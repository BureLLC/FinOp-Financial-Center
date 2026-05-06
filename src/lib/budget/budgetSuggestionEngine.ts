// Generates budget_suggestions from historical monthly debit spending.
// Pure function (buildBudgetSuggestions) has no side effects.
// DB-writing function (generateAndStoreBudgetSuggestions) inserts only into
// budget_suggestions — never into transactions, accounts, or any financial table.
//
// Never writes: transaction amount, direction, date, type, status, category,
//               subcategory, account balances, tax values, write-off totals,
//               budget_categories.monthly_limit.

import { SupabaseClient } from "@supabase/supabase-js";
import {
  buildMonthlyCategorySpend,
  computeCategoryAverages,
} from "./spendingSummaryEngine";
import { RawTransaction } from "../financialCalculations";

// Minimum months of data required before a suggestion is generated for a category.
const MIN_BASIS_MONTHS = 2;

// Confidence thresholds by month count.
const CONFIDENCE_3_OR_MORE = 0.80;
const CONFIDENCE_EXACTLY_2 = 0.60;

// How many months of transaction history to analyse.
const ANALYSIS_MONTHS_BACK = 6;

// "Uncategorized" transactions cannot be given a meaningful budget limit.
const SKIP_CATEGORIES = new Set(["uncategorized"]);

export interface BudgetSuggestionCandidate {
  category: string;
  suggestedAmount: number;  // rounded to 2dp
  basisMonths: number;
  avgMonthlySpend: number;
  confidence: number;
  reason: string;
}

/**
 * Pure function: generates budget suggestion candidates from historical spending data.
 *
 * Eligibility guards (all must pass before a candidate is emitted):
 *   - category is not "Uncategorized" or other skip categories
 *   - monthCount >= MIN_BASIS_MONTHS (2)
 *   - category is not in existingPendingCategories (no duplicate pending suggestions)
 *   - category is not in existingAcceptedCategories (no re-suggestion of accepted limits)
 *
 * Confidence:
 *   - 0.80 when monthCount >= 3
 *   - 0.60 when monthCount === 2
 *
 * suggestedAmount = avgMonthlySpend rounded up to the nearest dollar
 * (preserves real spend data without under-budgeting).
 */
export function buildBudgetSuggestions(
  byMonth: Map<string, Map<string, number>>,
  existingPendingCategories: Set<string>,
  existingAcceptedCategories: Set<string>,
): BudgetSuggestionCandidate[] {
  const averages = computeCategoryAverages(byMonth);
  const results: BudgetSuggestionCandidate[] = [];

  for (const [category, { avgMonthlySpend, monthCount }] of averages) {
    if (SKIP_CATEGORIES.has(category.toLowerCase())) continue;
    if (monthCount < MIN_BASIS_MONTHS) continue;
    if (existingPendingCategories.has(category.toLowerCase())) continue;
    if (existingAcceptedCategories.has(category.toLowerCase())) continue;

    const confidence = monthCount >= 3 ? CONFIDENCE_3_OR_MORE : CONFIDENCE_EXACTLY_2;

    // Round up to the nearest dollar so the budget slightly exceeds average spend.
    const suggestedAmount = Math.ceil(avgMonthlySpend * 100) / 100;

    const reason =
      monthCount >= 3
        ? `Based on ${monthCount} months of history, you typically spend $${avgMonthlySpend.toFixed(2)}/month on ${category}.`
        : `Based on ${monthCount} months of history, you spent around $${avgMonthlySpend.toFixed(2)}/month on ${category}.`;

    results.push({
      category,
      suggestedAmount,
      basisMonths: monthCount,
      avgMonthlySpend,
      confidence,
      reason,
    });
  }

  // Deterministic ordering: confidence desc, then category asc
  results.sort((a, b) => b.confidence - a.confidence || a.category.localeCompare(b.category));
  return results;
}

/**
 * Fetches the authenticated user's recent debit transactions, builds spending history,
 * generates budget suggestions, and inserts new rows into budget_suggestions.
 *
 * Deduplication:
 *   - skips categories that already have a pending suggestion (no duplicate pending)
 *   - skips categories that already have an accepted suggestion (no re-suggestion)
 *
 * Returns the number of new suggestions inserted (0 on error or no eligible categories).
 *
 * Never writes to: transactions, budget_categories, budget_records, envelopes,
 * or any financial source-of-truth table.
 */
export async function generateAndStoreBudgetSuggestions(
  userId: string,
  supabase: SupabaseClient,
): Promise<number> {
  // Fetch recent posted debit transactions (not transfers, not soft-deleted).
  // RLS enforces user ownership; explicit user_id filter is belt-and-suspenders.
  const cutoffDate = new Date();
  cutoffDate.setUTCMonth(cutoffDate.getUTCMonth() - ANALYSIS_MONTHS_BACK);
  cutoffDate.setUTCDate(1);
  const cutoffStr = cutoffDate.toISOString().substring(0, 10);

  const { data: txRows } = await supabase
    .from("transactions")
    .select(
      "id, direction, amount, status, deleted_at, transaction_type, category, " +
      "transaction_date, financial_account_id",
    )
    .eq("user_id", userId)
    .eq("direction", "debit")
    .neq("transaction_type", "transfer")
    .is("deleted_at", null)
    .eq("status", "posted")
    .gte("transaction_date", cutoffStr)
    .limit(1000);

  if (!txRows || txRows.length === 0) return 0;

  const { byMonth } = buildMonthlyCategorySpend(txRows as unknown as RawTransaction[], ANALYSIS_MONTHS_BACK);

  // Fetch existing pending suggestions to avoid duplicates.
  const { data: pendingRows } = await supabase
    .from("budget_suggestions")
    .select("category")
    .eq("user_id", userId)
    .eq("status", "pending");

  const existingPendingCategories = new Set(
    (pendingRows ?? []).map((r: { category: string }) => r.category.toLowerCase()),
  );

  // Fetch existing accepted suggestions to avoid re-suggesting confirmed limits.
  const { data: acceptedRows } = await supabase
    .from("budget_suggestions")
    .select("category")
    .eq("user_id", userId)
    .eq("status", "accepted");

  const existingAcceptedCategories = new Set(
    (acceptedRows ?? []).map((r: { category: string }) => r.category.toLowerCase()),
  );

  const candidates = buildBudgetSuggestions(byMonth, existingPendingCategories, existingAcceptedCategories);
  if (candidates.length === 0) return 0;

  const toInsert = candidates.map((c) => ({
    user_id: userId,
    category: c.category,
    suggested_amount: c.suggestedAmount,
    basis_months: c.basisMonths,
    avg_monthly_spend: c.avgMonthlySpend,
    confidence: c.confidence,
    reason: c.reason,
    status: "pending",
  }));

  const { error } = await supabase.from("budget_suggestions").insert(toInsert);
  return error ? 0 : toInsert.length;
}

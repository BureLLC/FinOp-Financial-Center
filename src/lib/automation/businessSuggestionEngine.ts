// Generates business_expense_candidate suggestions for eligible debit transactions.
// Pure matching step — buildBusinessSuggestionsForRule reads no DB and has no side effects.
// Writes (INSERT into automation_suggestions) are done only by generateAndStoreBusinessSuggestions.
// Never writes: category, subcategory, income_subtype, or any financial field.

import { SupabaseClient } from "@supabase/supabase-js";
import { RawTransaction } from "../financialCalculations";
import { AutomationRule, AutomationSuggestion, BusinessExpenseActionConfig } from "./types";
import { MIXED_USE_CATEGORIES } from "./constants";
import { evaluateRule } from "./matcherEngine";

// Confidence cap applied when the transaction's category is in MIXED_USE_CATEGORIES.
const MIXED_USE_CONFIDENCE_CAP = 0.60;

type CandidateTransaction = RawTransaction & { is_business_candidate?: boolean | null };

export interface PendingBusinessSuggestion {
  suggestion: Omit<AutomationSuggestion, "id" | "created_at" | "resolved_at" | "resolved_by">;
}

/**
 * Pure function: generates pending business_expense_candidate suggestions for eligible
 * debit transactions that match the given rule.
 *
 * Eligibility guards (all must pass before a suggestion is emitted):
 *  - rule.status must be 'active'
 *  - tx.direction must be 'debit'
 *  - tx.transaction_type must not be 'transfer' (transfers are not business expenses)
 *  - tx.is_business_candidate must not be true (null or false are eligible)
 *  - tx.id must not be excludeTransactionId (the triggering transaction)
 *  - tx.id must not be in rejectedTxIds (already rejected for this rule)
 *  - evaluateRule must return matched=true
 *
 * Mixed-use handling: if tx.category is in MIXED_USE_CATEGORIES, confidence is capped at
 * MIXED_USE_CONFIDENCE_CAP (0.60) and mixed_use=true is set in the suggested_action.
 */
export function buildBusinessSuggestionsForRule(
  rule: AutomationRule,
  candidates: CandidateTransaction[],
  excludeTransactionId: string,
  rejectedTxIds: Set<string>,
): PendingBusinessSuggestion[] {
  if (rule.status !== "active") return [];

  const results: PendingBusinessSuggestion[] = [];

  for (const tx of candidates) {
    if (tx.id === excludeTransactionId) continue;
    if (tx.direction !== "debit") continue;
    if ((tx.transaction_type ?? "").toLowerCase() === "transfer") continue;
    if (tx.is_business_candidate === true) continue;
    if (rejectedTxIds.has(tx.id)) continue;

    const matchResult = evaluateRule(rule, tx);
    if (!matchResult.matched) continue;

    const isMixedUse = MIXED_USE_CATEGORIES.has((tx.category ?? "").toLowerCase().trim());
    const confidence = isMixedUse
      ? Math.min(matchResult.confidence, MIXED_USE_CONFIDENCE_CAP)
      : matchResult.confidence;

    const suggestedAction: BusinessExpenseActionConfig = {
      mixed_use: isMixedUse,
      reason: matchResult.reason,
    };

    results.push({
      suggestion: {
        user_id: rule.user_id,
        automation_rule_id: rule.id,
        suggestion_type: "business_expense_candidate",
        source_entity_type: "transaction",
        source_entity_id: tx.id,
        suggested_action: suggestedAction,
        reason: matchResult.reason,
        confidence,
        status: "pending",
      },
    });
  }

  return results;
}

/**
 * Fetches eligible debit transactions for the rule's user, generates business candidate
 * suggestions, and inserts them into automation_suggestions.
 *
 * Deduplication:
 *  - skips tx IDs that already have a rejected suggestion for this rule (no regeneration)
 *  - skips tx IDs that already have a pending suggestion for this rule (no duplicates)
 *
 * Returns the number of new suggestions inserted (0 on error).
 */
export async function generateAndStoreBusinessSuggestions(
  rule: AutomationRule,
  excludeTransactionId: string,
  supabase: SupabaseClient,
): Promise<number> {
  // Fetch eligible debit transactions: not already marked, not soft-deleted, posted only.
  // is_business_candidate filter uses .is(null) rather than .not(true) to include
  // rows where is_business_candidate is null (never set) — the common case.
  // Transfers are excluded at the DB level; the in-memory guard in buildBusinessSuggestionsForRule
  // provides belt-and-suspenders coverage for any rows that slip through.
  const { data: txRows } = await supabase
    .from("transactions")
    .select(
      "id, direction, amount, status, deleted_at, merchant_name, description, category, " +
      "subcategory, transaction_date, income_subtype, transaction_type, financial_account_id, " +
      "external_transaction_id, provider, is_business_candidate",
    )
    .eq("direction", "debit")
    .neq("transaction_type", "transfer")
    .is("is_business_candidate", null)
    .is("deleted_at", null)
    .eq("status", "posted")
    .neq("id", excludeTransactionId)
    .limit(200);

  if (!txRows || txRows.length === 0) return 0;

  // Fetch already-rejected suggestions for this rule to prevent regeneration.
  const { data: rejectedRows } = await supabase
    .from("automation_suggestions")
    .select("source_entity_id")
    .eq("automation_rule_id", rule.id)
    .eq("status", "rejected");

  const rejectedTxIds = new Set(
    (rejectedRows ?? []).map((r: { source_entity_id: string }) => r.source_entity_id),
  );

  const proposed = buildBusinessSuggestionsForRule(
    rule,
    txRows as unknown as CandidateTransaction[],
    excludeTransactionId,
    rejectedTxIds,
  );
  if (proposed.length === 0) return 0;

  // Fetch already-pending suggestions for this rule to avoid duplicates.
  const { data: pendingRows } = await supabase
    .from("automation_suggestions")
    .select("source_entity_id")
    .eq("automation_rule_id", rule.id)
    .eq("status", "pending");

  const alreadyPending = new Set(
    (pendingRows ?? []).map((r: { source_entity_id: string }) => r.source_entity_id),
  );

  const toInsert = proposed
    .filter((p) => !alreadyPending.has(p.suggestion.source_entity_id))
    .map((p) => p.suggestion);

  if (toInsert.length === 0) return 0;

  const { error } = await supabase.from("automation_suggestions").insert(toInsert);
  return error ? 0 : toInsert.length;
}

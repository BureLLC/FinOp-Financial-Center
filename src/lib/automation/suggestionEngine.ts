// Generates category suggestions for uncategorized debit transactions.
// Pure matching step — reads from DB but never writes.
// Writes (INSERT into automation_suggestions) are the caller's responsibility.

import { SupabaseClient } from "@supabase/supabase-js";
import { RawTransaction } from "../financialCalculations";
import { AutomationRule, AutomationSuggestion, Phase1ActionConfig } from "./types";
import { SENSITIVE_CATEGORIES } from "./constants";
import { evaluateRule } from "./matcherEngine";

export interface PendingSuggestion {
  suggestion: Omit<AutomationSuggestion, "id" | "created_at" | "resolved_at" | "resolved_by">;
}

/**
 * Generates pending suggestions for uncategorized debit transactions
 * that match the given rule.
 *
 * Guards (all enforced before any DB write):
 *  - tx.direction must be 'debit'
 *  - tx must be uncategorized (category IS NULL)
 *  - proposed category must not be in SENSITIVE_CATEGORIES
 *  - no existing pending suggestion for this (source_entity_id, automation_rule_id) pair
 */
export function buildSuggestionsForRule(
  rule: AutomationRule,
  candidates: RawTransaction[],
  excludeTransactionId: string,
): PendingSuggestion[] {
  const catAction = rule.action_config as Phase1ActionConfig;
  if (SENSITIVE_CATEGORIES.has((catAction.category ?? "").toLowerCase())) return [];
  if (rule.status !== "active") return [];

  const results: PendingSuggestion[] = [];

  for (const tx of candidates) {
    if (tx.id === excludeTransactionId) continue;
    if (tx.direction !== "debit") continue;
    if (tx.category != null && tx.category !== "") continue;

    const match = evaluateRule(rule, tx);
    if (!match.matched) continue;

    results.push({
      suggestion: {
        user_id: rule.user_id,
        automation_rule_id: rule.id,
        suggestion_type: "transaction_category",
        source_entity_type: "transaction",
        source_entity_id: tx.id,
        suggested_action: {
          category: catAction.category,
          subcategory: catAction.subcategory,
          reason: match.reason,
        },
        reason: match.reason,
        confidence: match.confidence,
        status: "pending",
      },
    });
  }

  return results;
}

/**
 * Finds uncategorized debit transactions for the user and generates suggestions
 * from the given rule, then inserts them into automation_suggestions.
 * Skips any (source_entity_id, rule_id) pair that already has a pending suggestion.
 */
export async function generateAndStoreSuggestions(
  rule: AutomationRule,
  excludeTransactionId: string,
  supabase: SupabaseClient,
): Promise<number> {
  // Fetch uncategorized debit transactions from active accounts
  const { data: txRows } = await supabase
    .from("transactions")
    .select("id, direction, amount, status, deleted_at, merchant_name, description, category, subcategory, transaction_date, income_subtype, transaction_type, financial_account_id, external_transaction_id, provider")
    .eq("direction", "debit")
    .is("category", null)
    .is("deleted_at", null)
    .eq("status", "posted")
    .neq("id", excludeTransactionId)
    .limit(200);

  if (!txRows || txRows.length === 0) return 0;

  const candidates = txRows as RawTransaction[];
  const proposed = buildSuggestionsForRule(rule, candidates, excludeTransactionId);
  if (proposed.length === 0) return 0;

  // Fetch existing pending suggestions for this rule to avoid duplicates
  const { data: existing } = await supabase
    .from("automation_suggestions")
    .select("source_entity_id")
    .eq("automation_rule_id", rule.id)
    .eq("status", "pending");

  const alreadySuggested = new Set((existing ?? []).map((r: { source_entity_id: string }) => r.source_entity_id));

  const toInsert = proposed
    .filter((p) => !alreadySuggested.has(p.suggestion.source_entity_id))
    .map((p) => p.suggestion);

  if (toInsert.length === 0) return 0;

  const { error } = await supabase.from("automation_suggestions").insert(toInsert);
  return error ? 0 : toInsert.length;
}

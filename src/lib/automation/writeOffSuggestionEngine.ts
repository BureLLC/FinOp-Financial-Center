// Generates write_off_candidate suggestions for eligible debit transactions.
// Pure matching step — buildWriteOffSuggestionsForRule reads no DB and has no side effects.
// Writes (INSERT into automation_suggestions) are done only by generateAndStoreWriteOffSuggestions.
// Never writes: category, subcategory, income_subtype, or any financial field.

import { SupabaseClient } from "@supabase/supabase-js";
import { RawTransaction } from "../financialCalculations";
import { AutomationRule, AutomationSuggestion, WriteOffCandidateActionConfig } from "./types";
import { evaluateRule } from "./matcherEngine";

type CandidateTransaction = RawTransaction & { is_writeoff_candidate?: boolean | null };

export interface PendingWriteOffSuggestion {
  suggestion: Omit<AutomationSuggestion, "id" | "created_at" | "resolved_at" | "resolved_by">;
}

/**
 * Pure function: generates pending write_off_candidate suggestions for eligible
 * debit transactions that match the given rule.
 *
 * Eligibility guards (all must pass before a suggestion is emitted):
 *  - rule.status must be 'active'
 *  - tx.direction must be 'debit'
 *  - tx.transaction_type must not be 'transfer'
 *  - tx.is_writeoff_candidate must be null — null means never evaluated (eligible)
 *    true means already a write-off candidate (not eligible)
 *    false means explicitly declined/reserved state (not eligible)
 *  - tx.id must not be excludeTransactionId (the triggering transaction)
 *  - tx.id must not be in rejectedTxIds (already rejected for this rule)
 *  - evaluateRule must return matched=true
 *
 * No mixed-use confidence cap — write-off eligibility is independent of category.
 */
export function buildWriteOffSuggestionsForRule(
  rule: AutomationRule,
  candidates: CandidateTransaction[],
  excludeTransactionId: string,
  rejectedTxIds: Set<string>,
): PendingWriteOffSuggestion[] {
  if (rule.status !== "active") return [];

  const results: PendingWriteOffSuggestion[] = [];

  for (const tx of candidates) {
    if (tx.id === excludeTransactionId) continue;
    if (tx.direction !== "debit") continue;
    if ((tx.transaction_type ?? "").toLowerCase() === "transfer") continue;
    // Only null is eligible: null = never evaluated, true = already candidate, false = declined
    if (tx.is_writeoff_candidate !== null && tx.is_writeoff_candidate !== undefined) continue;
    if (rejectedTxIds.has(tx.id)) continue;

    const matchResult = evaluateRule(rule, tx);
    if (!matchResult.matched) continue;

    const suggestedAction: WriteOffCandidateActionConfig = {
      reason: matchResult.reason,
    };

    results.push({
      suggestion: {
        user_id: rule.user_id,
        automation_rule_id: rule.id,
        suggestion_type: "write_off_candidate",
        source_entity_type: "transaction",
        source_entity_id: tx.id,
        suggested_action: suggestedAction,
        reason: matchResult.reason,
        confidence: matchResult.confidence,
        status: "pending",
      },
    });
  }

  return results;
}

/**
 * Fetches eligible debit transactions for the rule's user, generates write-off candidate
 * suggestions, and inserts them into automation_suggestions.
 *
 * Deduplication:
 *  - skips tx IDs that already have a rejected suggestion for this rule (no regeneration)
 *  - skips tx IDs that already have a pending suggestion for this rule (no duplicates)
 *
 * Returns the number of new suggestions inserted (0 on error).
 */
export async function generateAndStoreWriteOffSuggestions(
  rule: AutomationRule,
  excludeTransactionId: string,
  supabase: SupabaseClient,
): Promise<number> {
  // Fetch eligible debit transactions: only null (never evaluated), not soft-deleted, posted only.
  // .is("is_writeoff_candidate", null) is intentional — only null rows are eligible:
  //   null  = never evaluated (eligible for suggestion)
  //   true  = already marked as write-off candidate (skip)
  //   false = explicitly declined/reserved state (skip)
  // Transfers excluded at DB level; in-memory guard in buildWriteOffSuggestionsForRule
  // provides belt-and-suspenders coverage for any rows that slip through.
  const { data: txRows } = await supabase
    .from("transactions")
    .select(
      "id, direction, amount, status, deleted_at, merchant_name, description, category, " +
      "subcategory, transaction_date, income_subtype, transaction_type, financial_account_id, " +
      "external_transaction_id, provider, is_writeoff_candidate",
    )
    .eq("direction", "debit")
    .neq("transaction_type", "transfer")
    .is("is_writeoff_candidate", null)
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

  const proposed = buildWriteOffSuggestionsForRule(
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

import { SupabaseClient } from "@supabase/supabase-js";
import { RawTransaction } from "../financialCalculations";
import { AutomationRule, AutomationSuggestion, Phase1ActionConfig, MerchantNormalizedMatcher, DescriptionPatternMatcher } from "./types";
import { SENSITIVE_CATEGORIES } from "./constants";
import { evaluateRule } from "./matcherEngine";

export interface PendingSuggestion {
  suggestion: Omit<AutomationSuggestion, "id" | "created_at" | "resolved_at" | "resolved_by">;
}

/**
 * Result from autoApplyRule.
 * applied: number of transactions updated (0 = no eligible matches).
 * failed: true only when a DB error prevented the update from running.
 *         false for all "skip" paths (guards, no matches, no signal).
 */
export interface AutoApplyResult {
  applied: number;
  failed: boolean;
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
    .eq("user_id", rule.user_id)
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

/**
 * Finds uncategorized debit transactions matching the given rule and directly
 * applies the rule's category/subcategory, writing audit log entries.
 *
 * Guards:
 *  - direction must be 'debit'
 *  - transaction must be uncategorized (category IS NULL)
 *  - proposed category must not be in SENSITIVE_CATEGORIES
 *  - rule must be active
 *
 * Uses DB-level ILIKE matching (same approach as tag-income auto-apply) instead of
 * JS-level evaluation. This handles null merchant_name cases and partial name
 * variations that caused the JS path to return zero matches in production.
 *
 * The .is("category", null) guard on the UPDATE prevents a race condition where
 * two requests categorize the same transaction simultaneously.
 */
export async function autoApplyRule(
  rule: AutomationRule,
  excludeTransactionId: string,
  userId: string,
  supabase: SupabaseClient,
): Promise<AutoApplyResult> {
  const skip: AutoApplyResult = { applied: 0, failed: false };

  const catAction = rule.action_config as Phase1ActionConfig;
  const category = catAction.category ?? null;
  if (!category || SENSITIVE_CATEGORIES.has(category.toLowerCase())) return skip;
  if (rule.status !== "active") return skip;

  // Base query: uncategorized debit posted transactions for this user.
  // Explicit user_id filter in addition to RLS for defence-in-depth.
  // .is("category", null) on the UPDATE is the race-condition guard.
  let matchQuery = supabase
    .from("transactions")
    .update({
      category,
      subcategory: catAction.subcategory ?? null,
    })
    .eq("user_id", userId)
    .eq("direction", "debit")
    .is("category", null)
    .is("deleted_at", null)
    .eq("status", "posted")
    .neq("id", excludeTransactionId);

  // Apply matcher-specific DB-level filter, mirroring the tag-income approach.
  if (rule.matcher_type === "merchant_normalized") {
    const mc = rule.matcher_config as MerchantNormalizedMatcher;
    if (!mc.normalized_merchant) return skip;
    // Very short normalized names (< 4 chars) produce overly broad %substring% patterns
    // that risk matching unrelated merchants. Skip auto-apply; the rule is still created
    // and strengthened for future use.
    if (mc.normalized_merchant.length < 4) return skip;
    matchQuery = matchQuery.ilike("merchant_name", `%${mc.normalized_merchant}%`);
  } else if (rule.matcher_type === "description_pattern") {
    const mc = rule.matcher_config as DescriptionPatternMatcher;
    if (!mc.description_tokens?.length) return skip;
    // Chain all tokens as AND-chained ILIKE filters (PostgREST ANDs multiple .ilike() calls).
    // Using only the first token risks over-matching when it is a generic word like "pos" or
    // "payment". Requiring every token to appear anywhere in the description gives the same
    // recall as JS evaluateDescriptionMatcher at a 100% hit rate, with far fewer false positives.
    for (const token of mc.description_tokens) {
      matchQuery = matchQuery.ilike("description", `%${token}%`);
    }
  } else {
    return skip;
  }

  const { data: matched, error: updateErr } = await matchQuery.select("id");
  if (updateErr) {
    console.error("[autoApplyRule] update failed:", updateErr.message);
    return { applied: 0, failed: true };
  }

  const applied = (matched ?? []).length;

  if (applied > 0) {
    const auditRows = (matched ?? []).map((tx: { id: string }) => ({
      user_id: userId,
      automation_rule_id: rule.id,
      suggestion_id: null,
      entity_type: "transaction",
      entity_id: tx.id,
      action_taken: "set_category",
      previous_value: { category: null, subcategory: null },
      new_value: { category, subcategory: catAction.subcategory ?? null },
      confidence: rule.confidence,
      triggered_by: "user_manual",
    }));
    // Audit insert is non-blocking — failure does not roll back the category update.
    supabase.from("automation_audit_log").insert(auditRows).then(({ error: auditErr }) => {
      if (auditErr) console.error("[autoApplyRule] audit insert failed:", auditErr.message);
    });
  }

  return { applied, failed: false };
}

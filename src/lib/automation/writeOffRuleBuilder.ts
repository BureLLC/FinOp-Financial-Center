// Creates or strengthens write-off candidate rules from explicit user mark-writeoff actions.
// Called only from the mark-writeoff-candidate API endpoint — not from the suggestion pipeline.
// Never touches category, subcategory, income_subtype, or any financial calculation.

import { SupabaseClient } from "@supabase/supabase-js";
import { AutomationRule, MerchantNormalizedMatcher, DescriptionPatternMatcher, WriteOffCandidateActionConfig } from "./types";
import { normalizeMerchant, normalizeDescription } from "./merchantNormalizer";

export interface WriteOffRuleInput {
  blocked: boolean;
  reason: string;
  matcherType?: "merchant_normalized" | "description_pattern";
  matcherConfig?: MerchantNormalizedMatcher | DescriptionPatternMatcher;
}

export interface CreateWriteOffRuleParams {
  userId: string;
  transactionId: string;
  merchantName: string | null;
  description: string | null;
  direction: string;
}

export interface CreateWriteOffRuleResult {
  rule: AutomationRule | null;
  reason: string;
}

/**
 * Derives matcher input for a write-off candidate rule from transaction fields.
 * Returns blocked=true if the transaction is not a debit or has no matcher signal.
 * No category guard — write-off eligibility is independent of category.
 */
export function deriveWriteOffRuleInput(
  merchantName: string | null,
  description: string | null,
  direction: string,
): WriteOffRuleInput {
  if (direction !== "debit") {
    return { blocked: true, reason: "Write-off candidate rules only apply to debit transactions" };
  }

  const normalizedMerchant = normalizeMerchant(merchantName ?? "");
  const normalizedDesc = normalizeDescription(description ?? "");
  const descTokens = normalizedDesc.split(/\s+/).filter((t) => t.length > 2);

  if (!normalizedMerchant && descTokens.length === 0) {
    return { blocked: true, reason: "No usable matcher signal (no merchant name or description tokens)" };
  }

  const matcherType = normalizedMerchant ? "merchant_normalized" : "description_pattern";
  const matcherConfig: MerchantNormalizedMatcher | DescriptionPatternMatcher = normalizedMerchant
    ? { normalized_merchant: normalizedMerchant, direction: "debit" as const }
    : { description_tokens: descTokens };

  return { blocked: false, reason: "OK", matcherType, matcherConfig };
}

/**
 * Creates a new write-off candidate rule or strengthens an existing matching one.
 * User-scoped: the rule is always tied to userId and never crosses user boundaries.
 * Returns null rule if the transaction has no matcher signal or is not a debit.
 */
export async function createOrStrengthenWriteOffRule(
  params: CreateWriteOffRuleParams,
  supabase: SupabaseClient,
): Promise<CreateWriteOffRuleResult> {
  const { userId, transactionId, merchantName, description, direction } = params;

  const input = deriveWriteOffRuleInput(merchantName, description, direction);
  if (input.blocked) {
    return { rule: null, reason: input.reason };
  }

  const { matcherType, matcherConfig } = input as Required<WriteOffRuleInput>;

  const actionConfig: WriteOffCandidateActionConfig = {
    reason: merchantName
      ? `Transactions from "${merchantName}" were marked as write-off candidate`
      : "Transaction was marked as write-off candidate",
  };

  // Find an existing active write-off candidate rule with the same matcher for this user.
  // Filter by action_type = 'mark_writeoff_candidate' to isolate from category and business rules.
  const { data: existing } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("action_type", "mark_writeoff_candidate")
    .eq("matcher_type", matcherType)
    .eq("status", "active")
    .is("deleted_at", null)
    .limit(10);

  const match = (existing ?? []).find((r: AutomationRule) => {
    if (matcherType === "merchant_normalized") {
      return (r.matcher_config as MerchantNormalizedMatcher).normalized_merchant ===
        (matcherConfig as MerchantNormalizedMatcher).normalized_merchant;
    }
    const existingTokens = (r.matcher_config as DescriptionPatternMatcher).description_tokens ?? [];
    const newTokens = (matcherConfig as DescriptionPatternMatcher).description_tokens ?? [];
    return existingTokens.join(",") === newTokens.join(",");
  });

  if (match) {
    const newConfidence = Math.min(match.confidence + 0.05, 1.0);
    const { data: updated, error } = await supabase
      .from("automation_rules")
      .update({
        confidence: newConfidence,
        source_entity_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", match.id)
      .select("*")
      .single();

    if (error) return { rule: null, reason: `Failed to strengthen write-off rule: ${error.message}` };
    return { rule: updated as AutomationRule, reason: "Existing write-off candidate rule strengthened" };
  }

  const { data: created, error: createError } = await supabase
    .from("automation_rules")
    .insert({
      user_id: userId,
      rule_type: "transaction_category",
      matcher_type: matcherType,
      matcher_config: matcherConfig,
      action_type: "mark_writeoff_candidate",
      action_config: actionConfig,
      confidence: 0.70,
      status: "active",
      requires_confirmation: true,
      created_from_user_action: true,
      source_entity_type: "transaction",
      source_entity_id: transactionId,
    })
    .select("*")
    .single();

  if (createError) return { rule: null, reason: `Failed to create write-off candidate rule: ${createError.message}` };
  return { rule: created as AutomationRule, reason: "New write-off candidate rule created" };
}

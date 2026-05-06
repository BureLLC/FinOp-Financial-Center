// Creates or strengthens business candidate rules from explicit user mark-business actions.
// Called only from the mark-business API endpoint — not from the suggestion pipeline.
// Never touches category, subcategory, income_subtype, or any financial calculation.

import { SupabaseClient } from "@supabase/supabase-js";
import { AutomationRule, MerchantNormalizedMatcher, DescriptionPatternMatcher, BusinessExpenseActionConfig } from "./types";
import { MIXED_USE_CATEGORIES } from "./constants";
import { normalizeMerchant, normalizeDescription } from "./merchantNormalizer";

export interface BusinessRuleInput {
  blocked: boolean;
  reason: string;
  matcherType?: "merchant_normalized" | "description_pattern";
  matcherConfig?: MerchantNormalizedMatcher | DescriptionPatternMatcher;
}

export interface CreateBusinessRuleParams {
  userId: string;
  transactionId: string;
  merchantName: string | null;
  description: string | null;
  direction: string;
  category: string | null;
}

export interface CreateBusinessRuleResult {
  rule: AutomationRule | null;
  reason: string;
}

/**
 * Derives matcher input for a business candidate rule from transaction fields.
 * Returns blocked=true if the transaction is not a debit or has no matcher signal.
 * No sensitive-category guard — business rules are not category-setting actions.
 */
export function deriveBusinessRuleInput(
  merchantName: string | null,
  description: string | null,
  direction: string,
): BusinessRuleInput {
  if (direction !== "debit") {
    return { blocked: true, reason: "Business candidate rules only apply to debit transactions" };
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
 * Creates a new business candidate rule or strengthens an existing matching one.
 * User-scoped: the rule is always tied to userId and never crosses user boundaries.
 * Returns null rule if the transaction has no matcher signal or is not a debit.
 */
export async function createOrStrengthenBusinessRule(
  params: CreateBusinessRuleParams,
  supabase: SupabaseClient,
): Promise<CreateBusinessRuleResult> {
  const { userId, transactionId, merchantName, description, direction, category } = params;

  const input = deriveBusinessRuleInput(merchantName, description, direction);
  if (input.blocked) {
    return { rule: null, reason: input.reason };
  }

  const { matcherType, matcherConfig } = input as Required<BusinessRuleInput>;

  const isMixedUse = MIXED_USE_CATEGORIES.has((category ?? "").toLowerCase().trim());
  const actionConfig: BusinessExpenseActionConfig = {
    mixed_use: isMixedUse,
    reason: merchantName
      ? `Transactions from "${merchantName}" were marked as business candidate`
      : "Transaction was marked as business candidate",
  };

  // Find an existing active business candidate rule with the same matcher for this user.
  // Filter by action_type = 'mark_business_candidate' to isolate from category rules.
  const { data: existing } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("action_type", "mark_business_candidate")
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

    if (error) return { rule: null, reason: `Failed to strengthen business rule: ${error.message}` };
    return { rule: updated as AutomationRule, reason: "Existing business candidate rule strengthened" };
  }

  const { data: created, error: createError } = await supabase
    .from("automation_rules")
    .insert({
      user_id: userId,
      rule_type: "transaction_category",
      matcher_type: matcherType,
      matcher_config: matcherConfig,
      action_type: "mark_business_candidate",
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

  if (createError) return { rule: null, reason: `Failed to create business candidate rule: ${createError.message}` };
  return { rule: created as AutomationRule, reason: "New business candidate rule created" };
}

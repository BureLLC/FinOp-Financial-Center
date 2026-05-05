// Creates or strengthens automation rules from explicit user categorization actions.
// Called only from the categorize API endpoint — not from the suggestion pipeline.

import { SupabaseClient } from "@supabase/supabase-js";
import { AutomationRule } from "./types";
import { SENSITIVE_CATEGORIES } from "./constants";
import { normalizeMerchant, normalizeDescription } from "./merchantNormalizer";

export interface CreateRuleParams {
  userId: string;
  transactionId: string;
  merchantName: string | null;
  description: string | null;
  category: string;
  subcategory?: string;
}

export interface CreateRuleResult {
  rule: AutomationRule | null;
  reason: string;
}

/**
 * Creates a new rule or increments confidence on an existing matching rule.
 * Returns null if the category is sensitive or if no usable matcher signal exists.
 * Never sets requires_confirmation = false.
 */
export async function createOrStrengthenRule(
  params: CreateRuleParams,
  supabase: SupabaseClient,
): Promise<CreateRuleResult> {
  const { userId, transactionId, merchantName, description, category, subcategory } = params;

  const normalizedCategory = category.toLowerCase().trim();
  if (SENSITIVE_CATEGORIES.has(normalizedCategory)) {
    return { rule: null, reason: `Category "${category}" is sensitive and not automatable in Phase 1` };
  }

  // Prefer merchant name as matcher signal; fall back to description tokens
  const normalizedMerchant = normalizeMerchant(merchantName ?? "");
  const normalizedDesc = normalizeDescription(description ?? "");
  const descTokens = normalizedDesc.split(/\s+/).filter((t) => t.length > 2);

  if (!normalizedMerchant && descTokens.length === 0) {
    return { rule: null, reason: "No usable matcher signal (no merchant name or description tokens)" };
  }

  const matcherType = normalizedMerchant ? "merchant_normalized" : "description_pattern";
  const matcherConfig = normalizedMerchant
    ? { normalized_merchant: normalizedMerchant, direction: "debit" as const }
    : { description_tokens: descTokens };

  const actionConfig: { category: string; subcategory?: string } = { category: normalizedCategory };
  if (subcategory) actionConfig.subcategory = subcategory;

  // Check for an existing active rule with the same matcher + action for this user
  const { data: existing } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("rule_type", "transaction_category")
    .eq("matcher_type", matcherType)
    .eq("status", "active")
    .neq("deleted_at", null)
    .is("deleted_at", null)
    .limit(10);

  // Find a rule whose matcher_config and action_config match meaningfully
  const match = (existing ?? []).find((r: AutomationRule) => {
    const mc = r.matcher_config as Record<string, unknown>;
    const ac = r.action_config as Record<string, unknown>;
    if (ac.category !== normalizedCategory) return false;
    if (matcherType === "merchant_normalized") {
      return (mc as { normalized_merchant?: string }).normalized_merchant === normalizedMerchant;
    }
    const existingTokens = (mc as { description_tokens?: string[] }).description_tokens ?? [];
    return existingTokens.join(",") === descTokens.join(",");
  });

  if (match) {
    // Strengthen: increment confidence slightly, update source
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

    if (error) return { rule: null, reason: `Failed to strengthen rule: ${error.message}` };
    return { rule: updated as AutomationRule, reason: "Existing rule strengthened" };
  }

  // Create a new rule
  const { data: created, error: createError } = await supabase
    .from("automation_rules")
    .insert({
      user_id: userId,
      rule_type: "transaction_category",
      matcher_type: matcherType,
      matcher_config: matcherConfig,
      action_type: "set_category",
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

  if (createError) return { rule: null, reason: `Failed to create rule: ${createError.message}` };
  return { rule: created as AutomationRule, reason: "New rule created" };
}

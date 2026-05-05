// Phase 1 automation types.
// All type aliases prefixed Phase1* document what is valid in this phase.
// Later phases will extend these without breaking Phase 1 consumers.

export type Phase1RuleType = 'transaction_category';
export type Phase1MatcherType = 'merchant_normalized' | 'description_pattern';
export type Phase1ActionType = 'set_category' | 'set_subcategory';
export type Phase1SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'ignored' | 'undone';
export type Phase1TriggeredBy = 'user_accept' | 'user_undo' | 'user_manual';
export type RuleStatus = 'active' | 'paused' | 'deleted';

// ─── Matcher config shapes ────────────────────────────────────────────────────

export interface MerchantNormalizedMatcher {
  normalized_merchant: string;
  direction: 'debit' | 'credit';
}

export interface DescriptionPatternMatcher {
  description_tokens: string[];
  amount_min?: number;
  amount_max?: number;
}

export type Phase1MatcherConfig = MerchantNormalizedMatcher | DescriptionPatternMatcher;

// ─── Action config shape ──────────────────────────────────────────────────────

export interface Phase1ActionConfig {
  category: string;
  subcategory?: string;
}

// ─── Core row types (mirror DB schema) ───────────────────────────────────────

export interface AutomationRule {
  id: string;
  user_id: string;
  rule_type: Phase1RuleType;
  matcher_type: Phase1MatcherType;
  matcher_config: Phase1MatcherConfig;
  action_type: Phase1ActionType;
  action_config: Phase1ActionConfig;
  confidence: number;
  status: RuleStatus;
  requires_confirmation: boolean;
  created_from_user_action: boolean;
  source_entity_type: string | null;
  source_entity_id: string | null;
  last_applied_at: string | null;
  apply_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AutomationSuggestion {
  id: string;
  user_id: string;
  automation_rule_id: string | null;
  suggestion_type: Phase1RuleType;
  source_entity_type: 'transaction';
  source_entity_id: string;
  suggested_action: Phase1ActionConfig & { reason: string };
  reason: string | null;
  confidence: number;
  status: Phase1SuggestionStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: 'user' | 'system' | null;
}

export interface AutomationAuditEntry {
  id: string;
  user_id: string;
  automation_rule_id: string | null;
  suggestion_id: string | null;
  entity_type: 'transaction';
  entity_id: string;
  action_taken:
    | 'set_category'
    | 'set_subcategory'
    | 'undo_set_category'
    | 'undo_set_subcategory'
    | 'user_manual_category';
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  confidence: number | null;
  triggered_by: Phase1TriggeredBy;
  undo_blocked_reason: string | null;
  created_at: string;
}

// ─── Match result returned by matcherEngine ───────────────────────────────────

export interface MatchResult {
  matched: boolean;
  confidence: number;
  reason: string;
}

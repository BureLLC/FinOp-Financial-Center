// Automation types for Phase 1 and Phase 4.
// Phase1* aliases document what is valid in Phase 1.
// Phase4* aliases extend Phase 1 types without breaking existing consumers.

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
    | 'user_manual_category'
    | 'mark_business_candidate'
    | 'undo_mark_business_candidate';
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  confidence: number | null;
  triggered_by: Phase1TriggeredBy;
  undo_blocked_reason: string | null;
  created_at: string;
}

// ─── Phase 4 type extensions ──────────────────────────────────────────────────

export type Phase4ActionType = Phase1ActionType | 'mark_business_candidate';
export type Phase4SuggestionType = Phase1RuleType | 'business_expense_candidate';

// Action config for business expense candidate suggestions.
// mixed_use: true when the merchant matches MIXED_USE_CATEGORIES.
// reason: human-readable explanation surfaced in the Phase 4 PR B UI.
export interface BusinessExpenseActionConfig {
  mixed_use: boolean;
  reason: string;
}

// ─── Match result returned by matcherEngine ───────────────────────────────────

export interface MatchResult {
  matched: boolean;
  confidence: number;
  reason: string;
}

-- Phase 1 Automation Foundation: automation_suggestions table
--
-- Suggestions are proposals only — they do not alter financial data until accepted.
-- Phase 1 constraints:
--   suggestion_type = 'transaction_category' only
--   source_entity_type = 'transaction' only
--   status 'auto_applied' is not valid in Phase 1
--   source_entity_id must reference a canonical (deduplicated) transaction — enforced in application layer
--   suggested_action.category must not be in SENSITIVE_CATEGORIES — enforced in application layer
--
-- The unique index on (user_id, source_entity_id, automation_rule_id) WHERE status = 'pending'
-- prevents duplicate pending suggestions for the same transaction + rule pair.

CREATE TABLE IF NOT EXISTS automation_suggestions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  automation_rule_id   uuid        REFERENCES automation_rules(id) ON DELETE SET NULL,

  suggestion_type      text        NOT NULL CHECK (suggestion_type = 'transaction_category'),
  source_entity_type   text        NOT NULL CHECK (source_entity_type = 'transaction'),
  source_entity_id     uuid        NOT NULL,

  suggested_action     jsonb       NOT NULL,
  -- { category: string, subcategory: string | null, reason: string }

  reason               text,
  confidence           numeric(5,4) NOT NULL
                                   CHECK (confidence >= 0.0 AND confidence <= 1.0),

  status               text        NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending', 'accepted', 'rejected', 'ignored', 'undone')),
  -- 'auto_applied' is intentionally excluded from Phase 1

  created_at           timestamptz NOT NULL DEFAULT now(),
  resolved_at          timestamptz,
  resolved_by          text        CHECK (resolved_by IN ('user', 'system'))
);

CREATE INDEX IF NOT EXISTS automation_suggestions_user_id_idx ON automation_suggestions (user_id);
CREATE INDEX IF NOT EXISTS automation_suggestions_entity_idx  ON automation_suggestions (source_entity_type, source_entity_id);
CREATE INDEX IF NOT EXISTS automation_suggestions_status_idx  ON automation_suggestions (user_id, status);

-- Prevents duplicate pending suggestions for the same transaction + rule pair.
CREATE UNIQUE INDEX IF NOT EXISTS automation_suggestions_dedup_idx
  ON automation_suggestions (user_id, source_entity_id, automation_rule_id)
  WHERE status = 'pending';

-- Row-Level Security
ALTER TABLE automation_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_suggestions: users select own"
  ON automation_suggestions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "automation_suggestions: users insert own"
  ON automation_suggestions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "automation_suggestions: users update own"
  ON automation_suggestions FOR UPDATE
  USING (user_id = auth.uid());

-- No DELETE policy. Status transitions replace deletion.

-- Phase 1 Automation Foundation: automation_rules table
--
-- Stores reusable user-approved matching patterns.
-- Phase 1 constraints:
--   rule_type  = 'transaction_category' only
--   action_type IN ('set_category', 'set_subcategory') only
--   matcher_type IN ('merchant_normalized', 'description_pattern') only
--   requires_confirmation is always true in Phase 1 (enforced in application layer)
--
-- action_config.category must not be in SENSITIVE_CATEGORIES.
-- That constraint is enforced in the application layer and in the apply Postgres function.
-- Rules are soft-deleted (status = 'deleted'), never hard-deleted.

CREATE TABLE IF NOT EXISTS automation_rules (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  rule_type                text        NOT NULL CHECK (rule_type = 'transaction_category'),
  matcher_type             text        NOT NULL CHECK (matcher_type IN ('merchant_normalized', 'description_pattern')),
  matcher_config           jsonb       NOT NULL DEFAULT '{}',

  action_type              text        NOT NULL CHECK (action_type IN ('set_category', 'set_subcategory')),
  action_config            jsonb       NOT NULL DEFAULT '{}',

  confidence               numeric(5,4) NOT NULL DEFAULT 0.5
                                       CHECK (confidence >= 0.0 AND confidence <= 1.0),

  status                   text        NOT NULL DEFAULT 'active'
                                       CHECK (status IN ('active', 'paused', 'deleted')),

  requires_confirmation    boolean     NOT NULL DEFAULT true,
  created_from_user_action boolean     NOT NULL DEFAULT false,

  source_entity_type       text,
  source_entity_id         uuid,

  last_applied_at          timestamptz,
  apply_count              integer     NOT NULL DEFAULT 0 CHECK (apply_count >= 0),

  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  deleted_at               timestamptz
);

CREATE INDEX IF NOT EXISTS automation_rules_user_id_idx ON automation_rules (user_id);
CREATE INDEX IF NOT EXISTS automation_rules_status_idx  ON automation_rules (user_id, status);

-- Row-Level Security
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_rules: users select own"
  ON automation_rules FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "automation_rules: users insert own"
  ON automation_rules FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "automation_rules: users update own"
  ON automation_rules FOR UPDATE
  USING (user_id = auth.uid());

-- No DELETE policy. Soft delete via status = 'deleted'.

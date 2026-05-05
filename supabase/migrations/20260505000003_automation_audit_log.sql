-- Phase 1 Automation Foundation: automation_audit_log table + apply/undo Postgres functions
--
-- The audit log is append-only:
--   - No UPDATE RLS policy exists on this table.
--   - Undo operations INSERT a new row; they do not modify existing rows.
--   - undo_blocked_reason is written at INSERT time when an undo attempt is rejected.
--
-- Phase 1 constraints:
--   entity_type = 'transaction' only
--   triggered_by 'auto_apply' is not valid in Phase 1
--   action_taken 'set_income_subtype' and similar are not valid
--
-- Postgres functions:
--   apply_automation_suggestion(p_suggestion_id, p_user_id) — atomic apply
--   undo_automation_suggestion(p_audit_id, p_user_id)        — atomic undo with stale-value guard

CREATE TABLE IF NOT EXISTS automation_audit_log (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  automation_rule_id    uuid        REFERENCES automation_rules(id) ON DELETE SET NULL,
  suggestion_id         uuid        REFERENCES automation_suggestions(id) ON DELETE SET NULL,

  entity_type           text        NOT NULL CHECK (entity_type = 'transaction'),
  entity_id             uuid        NOT NULL,

  action_taken          text        NOT NULL CHECK (action_taken IN (
                                      'set_category',
                                      'set_subcategory',
                                      'undo_set_category',
                                      'undo_set_subcategory',
                                      'user_manual_category'
                                    )),

  previous_value        jsonb,
  new_value             jsonb,
  confidence            numeric(5,4) CHECK (confidence >= 0.0 AND confidence <= 1.0),

  triggered_by          text        NOT NULL CHECK (triggered_by IN (
                                      'user_accept',
                                      'user_undo',
                                      'user_manual'
                                    )),
  -- 'auto_apply' is intentionally excluded from Phase 1

  undo_blocked_reason   text,
  -- Populated when an undo attempt is logged but rejected.
  -- Example value: 'transaction_edited_after_apply'

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS automation_audit_log_user_id_idx    ON automation_audit_log (user_id);
CREATE INDEX IF NOT EXISTS automation_audit_log_entity_idx     ON automation_audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS automation_audit_log_suggestion_idx ON automation_audit_log (suggestion_id);

-- Row-Level Security
ALTER TABLE automation_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_audit_log: users select own"
  ON automation_audit_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "automation_audit_log: users insert own"
  ON automation_audit_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- No UPDATE policy — append-only.
-- No DELETE policy.

-- ─── Postgres function: apply_automation_suggestion ──────────────────────────
-- Atomically applies an accepted suggestion to transactions.category / subcategory.
-- Guards:
--   1. suggestion.user_id must equal p_user_id
--   2. suggestion.status must be 'pending'
--   3. action_config.category must not be in the sensitive category list
--   4. the transaction must belong to p_user_id (via financial_accounts join)
-- Writes only: transactions.category, transactions.subcategory.
-- Never writes: income_subtype, direction, amount, transaction_date, transaction_type,
--               status, financial_account_id, external_transaction_id, provider, deleted_at.

CREATE OR REPLACE FUNCTION apply_automation_suggestion(
  p_suggestion_id uuid,
  p_user_id       uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_suggestion        automation_suggestions%ROWTYPE;
  v_rule              automation_rules%ROWTYPE;
  v_tx_id             uuid;
  v_prev_category     text;
  v_prev_subcategory  text;
  v_new_category      text;
  v_new_subcategory   text;
  v_sensitive_cats    text[] := ARRAY[
    'business', 'home office', 'vehicle', 'equipment', 'software',
    'meals', 'travel', 'professional services', 'advertising',
    'office supplies', 'insurance', 'utilities'
  ];
  v_tx_user_id        uuid;
BEGIN
  -- 1. Fetch and lock suggestion; verify ownership
  SELECT * INTO v_suggestion
  FROM automation_suggestions
  WHERE id = p_suggestion_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggestion not found: %', p_suggestion_id;
  END IF;

  IF v_suggestion.user_id <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: suggestion does not belong to user';
  END IF;

  -- 2. Verify suggestion is pending
  IF v_suggestion.status <> 'pending' THEN
    RAISE EXCEPTION 'Suggestion is not pending (current status: %)', v_suggestion.status;
  END IF;

  -- 3. Extract proposed category and guard against sensitive categories
  v_new_category    := (v_suggestion.suggested_action->>'category');
  v_new_subcategory := (v_suggestion.suggested_action->>'subcategory');

  IF v_new_category = ANY(v_sensitive_cats) THEN
    RAISE EXCEPTION 'Cannot apply suggestion: category "%" is sensitive and requires Phase 3+ handling', v_new_category;
  END IF;

  -- 4. Verify the transaction belongs to p_user_id via financial_accounts
  v_tx_id := v_suggestion.source_entity_id;

  SELECT fa.user_id INTO v_tx_user_id
  FROM transactions t
  JOIN financial_accounts fa ON fa.id = t.financial_account_id
  WHERE t.id = v_tx_id;

  IF NOT FOUND OR v_tx_user_id <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: transaction does not belong to user';
  END IF;

  -- 5. Capture previous values for audit
  SELECT category, subcategory
  INTO v_prev_category, v_prev_subcategory
  FROM transactions
  WHERE id = v_tx_id;

  -- 6. Fetch rule for confidence and apply_count update
  IF v_suggestion.automation_rule_id IS NOT NULL THEN
    SELECT * INTO v_rule
    FROM automation_rules
    WHERE id = v_suggestion.automation_rule_id
    FOR UPDATE;
  END IF;

  -- 7. Update transactions — category and subcategory only
  UPDATE transactions
  SET
    category    = v_new_category,
    subcategory = COALESCE(v_new_subcategory, subcategory)
  WHERE id = v_tx_id;

  -- 8. Mark suggestion accepted
  UPDATE automation_suggestions
  SET
    status      = 'accepted',
    resolved_at = now(),
    resolved_by = 'user'
  WHERE id = p_suggestion_id;

  -- 9. Update rule counters if rule exists
  IF v_rule.id IS NOT NULL THEN
    UPDATE automation_rules
    SET
      apply_count     = apply_count + 1,
      last_applied_at = now(),
      updated_at      = now()
    WHERE id = v_rule.id;
  END IF;

  -- 10. Insert audit log entry
  INSERT INTO automation_audit_log (
    user_id,
    automation_rule_id,
    suggestion_id,
    entity_type,
    entity_id,
    action_taken,
    previous_value,
    new_value,
    confidence,
    triggered_by
  ) VALUES (
    p_user_id,
    v_suggestion.automation_rule_id,
    p_suggestion_id,
    'transaction',
    v_tx_id,
    'set_category',
    jsonb_build_object('category', v_prev_category, 'subcategory', v_prev_subcategory),
    jsonb_build_object('category', v_new_category,  'subcategory', v_new_subcategory),
    v_suggestion.confidence,
    'user_accept'
  );
END;
$$;

-- ─── Postgres function: undo_automation_suggestion ───────────────────────────
-- Atomically undoes a previously applied suggestion.
-- Guard: verifies current transactions.category matches audit.new_value->>'category'.
-- If the transaction was edited after the apply, the undo is blocked and logged.
-- Writes only: transactions.category, transactions.subcategory.
-- Returns: jsonb { success: bool, reason?: text }

CREATE OR REPLACE FUNCTION undo_automation_suggestion(
  p_audit_id  uuid,
  p_user_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_audit           automation_audit_log%ROWTYPE;
  v_current_cat     text;
  v_current_subcat  text;
  v_prev_category   text;
  v_prev_subcategory text;
  v_expected_cat    text;
BEGIN
  -- 1. Fetch audit entry; verify ownership
  SELECT * INTO v_audit
  FROM automation_audit_log
  WHERE id = p_audit_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Audit entry not found: %', p_audit_id;
  END IF;

  IF v_audit.user_id <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: audit entry does not belong to user';
  END IF;

  -- 2. Verify this is an apply action, not already an undo
  IF v_audit.action_taken NOT IN ('set_category', 'set_subcategory') THEN
    RAISE EXCEPTION 'Audit entry action "%" cannot be undone directly', v_audit.action_taken;
  END IF;

  -- 3. Read current transaction values
  SELECT category, subcategory
  INTO v_current_cat, v_current_subcat
  FROM transactions
  WHERE id = v_audit.entity_id;

  -- 4. Stale-value guard: current value must match what automation wrote
  v_expected_cat := (v_audit.new_value->>'category');

  IF v_current_cat IS DISTINCT FROM v_expected_cat THEN
    -- Log the blocked undo attempt, then return failure
    INSERT INTO automation_audit_log (
      user_id,
      automation_rule_id,
      suggestion_id,
      entity_type,
      entity_id,
      action_taken,
      previous_value,
      new_value,
      triggered_by,
      undo_blocked_reason
    ) VALUES (
      p_user_id,
      v_audit.automation_rule_id,
      v_audit.suggestion_id,
      'transaction',
      v_audit.entity_id,
      'undo_set_category',
      v_audit.new_value,
      v_audit.new_value,
      'user_undo',
      'transaction_edited_after_apply'
    );

    RETURN jsonb_build_object('success', false, 'reason', 'transaction_edited_after_apply');
  END IF;

  -- 5. Extract previous values to restore
  v_prev_category    := (v_audit.previous_value->>'category');
  v_prev_subcategory := (v_audit.previous_value->>'subcategory');

  -- 6. Restore transactions — category and subcategory only
  UPDATE transactions
  SET
    category    = v_prev_category,
    subcategory = v_prev_subcategory
  WHERE id = v_audit.entity_id;

  -- 7. Set suggestion status to 'undone'
  IF v_audit.suggestion_id IS NOT NULL THEN
    UPDATE automation_suggestions
    SET status = 'undone'
    WHERE id = v_audit.suggestion_id
      AND user_id = p_user_id;
  END IF;

  -- 8. Decrement rule apply_count (floor 0); do not modify last_applied_at
  IF v_audit.automation_rule_id IS NOT NULL THEN
    UPDATE automation_rules
    SET
      apply_count = GREATEST(apply_count - 1, 0),
      updated_at  = now()
    WHERE id = v_audit.automation_rule_id
      AND user_id = p_user_id;
  END IF;

  -- 9. Insert undo audit entry
  INSERT INTO automation_audit_log (
    user_id,
    automation_rule_id,
    suggestion_id,
    entity_type,
    entity_id,
    action_taken,
    previous_value,
    new_value,
    triggered_by
  ) VALUES (
    p_user_id,
    v_audit.automation_rule_id,
    v_audit.suggestion_id,
    'transaction',
    v_audit.entity_id,
    'undo_set_category',
    v_audit.new_value,
    v_audit.previous_value,
    'user_undo'
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

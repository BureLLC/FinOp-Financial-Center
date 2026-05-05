-- Schema constraint validation for Phase 1 automation tables.
-- Run these against a local Supabase instance (supabase start) to verify
-- that CHECK constraints, RLS policies, and the unique index are enforced correctly.
--
-- Each block is a self-contained test. Blocks marked SHOULD FAIL are expected
-- to raise an error. Blocks marked SHOULD SUCCEED are expected to commit.
-- Run as a non-privileged authenticated user (auth.uid() = '<test-user-id>').

-- ─── Setup ───────────────────────────────────────────────────────────────────
-- Replace <user_a_id> and <user_b_id> with real UUIDs from auth.users for testing.

-- ─── automation_rules CHECK constraints ──────────────────────────────────────

-- SHOULD FAIL: rule_type must be 'transaction_category'
INSERT INTO automation_rules (user_id, rule_type, matcher_type, action_type, matcher_config, action_config)
VALUES ('<user_a_id>', 'business_expense', 'merchant_normalized', 'set_category', '{}', '{}');

-- SHOULD FAIL: action_type must be 'set_category' or 'set_subcategory'
INSERT INTO automation_rules (user_id, rule_type, matcher_type, action_type, matcher_config, action_config)
VALUES ('<user_a_id>', 'transaction_category', 'merchant_normalized', 'set_income_subtype', '{}', '{}');

-- SHOULD FAIL: matcher_type must be 'merchant_normalized' or 'description_pattern'
INSERT INTO automation_rules (user_id, rule_type, matcher_type, action_type, matcher_config, action_config)
VALUES ('<user_a_id>', 'transaction_category', 'recurrence', 'set_category', '{}', '{}');

-- SHOULD FAIL: confidence must be between 0.0 and 1.0
INSERT INTO automation_rules (user_id, rule_type, matcher_type, action_type, matcher_config, action_config, confidence)
VALUES ('<user_a_id>', 'transaction_category', 'merchant_normalized', 'set_category', '{}', '{}', 1.5);

-- SHOULD FAIL: apply_count must be >= 0
INSERT INTO automation_rules (user_id, rule_type, matcher_type, action_type, matcher_config, action_config, apply_count)
VALUES ('<user_a_id>', 'transaction_category', 'merchant_normalized', 'set_category', '{}', '{}', -1);

-- SHOULD FAIL: status must be in ('active', 'paused', 'deleted')
INSERT INTO automation_rules (user_id, rule_type, matcher_type, action_type, matcher_config, action_config, status)
VALUES ('<user_a_id>', 'transaction_category', 'merchant_normalized', 'set_category', '{}', '{}', 'enabled');

-- SHOULD SUCCEED: minimal valid rule
INSERT INTO automation_rules (user_id, rule_type, matcher_type, action_type, matcher_config, action_config)
VALUES ('<user_a_id>', 'transaction_category', 'merchant_normalized', 'set_category',
  '{"normalized_merchant": "netflix", "direction": "debit"}',
  '{"category": "entertainment"}')
RETURNING id;

-- ─── automation_suggestions CHECK constraints ─────────────────────────────────

-- SHOULD FAIL: status 'auto_applied' is not valid in Phase 1
INSERT INTO automation_suggestions (user_id, suggestion_type, source_entity_type, source_entity_id, suggested_action, confidence, status)
VALUES ('<user_a_id>', 'transaction_category', 'transaction', gen_random_uuid(),
  '{"category": "entertainment", "reason": "test"}', 0.85, 'auto_applied');

-- SHOULD FAIL: suggestion_type must be 'transaction_category'
INSERT INTO automation_suggestions (user_id, suggestion_type, source_entity_type, source_entity_id, suggested_action, confidence)
VALUES ('<user_a_id>', 'business_expense', 'transaction', gen_random_uuid(),
  '{"category": "entertainment", "reason": "test"}', 0.85);

-- SHOULD SUCCEED: valid pending suggestion
INSERT INTO automation_suggestions (user_id, suggestion_type, source_entity_type, source_entity_id, suggested_action, confidence)
VALUES ('<user_a_id>', 'transaction_category', 'transaction', gen_random_uuid(),
  '{"category": "entertainment", "reason": "Netflix monthly charge"}', 0.85)
RETURNING id;

-- ─── automation_suggestions unique index (dedup) ──────────────────────────────

-- Setup: insert a rule and a suggestion
DO $$
DECLARE
  v_rule_id uuid;
  v_tx_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO automation_rules (user_id, rule_type, matcher_type, action_type, matcher_config, action_config)
  VALUES ('<user_a_id>', 'transaction_category', 'merchant_normalized', 'set_category',
    '{"normalized_merchant": "spotify", "direction": "debit"}',
    '{"category": "entertainment"}')
  RETURNING id INTO v_rule_id;

  -- First suggestion: SHOULD SUCCEED
  INSERT INTO automation_suggestions (user_id, automation_rule_id, suggestion_type, source_entity_type, source_entity_id, suggested_action, confidence)
  VALUES ('<user_a_id>', v_rule_id, 'transaction_category', 'transaction', v_tx_id,
    '{"category": "entertainment", "reason": "Spotify match"}', 0.85);

  -- Second suggestion for same (user, tx, rule): SHOULD FAIL with unique constraint violation
  INSERT INTO automation_suggestions (user_id, automation_rule_id, suggestion_type, source_entity_type, source_entity_id, suggested_action, confidence)
  VALUES ('<user_a_id>', v_rule_id, 'transaction_category', 'transaction', v_tx_id,
    '{"category": "entertainment", "reason": "Spotify match duplicate"}', 0.85);
END;
$$;

-- ─── automation_audit_log CHECK constraints ───────────────────────────────────

-- SHOULD FAIL: triggered_by 'auto_apply' is not valid in Phase 1
INSERT INTO automation_audit_log (user_id, entity_type, entity_id, action_taken, triggered_by)
VALUES ('<user_a_id>', 'transaction', gen_random_uuid(), 'set_category', 'auto_apply');

-- SHOULD FAIL: action_taken 'set_income_subtype' is not valid
INSERT INTO automation_audit_log (user_id, entity_type, entity_id, action_taken, triggered_by)
VALUES ('<user_a_id>', 'transaction', gen_random_uuid(), 'set_income_subtype', 'user_accept');

-- SHOULD SUCCEED: valid audit entry
INSERT INTO automation_audit_log (user_id, entity_type, entity_id, action_taken, triggered_by,
  previous_value, new_value, confidence)
VALUES ('<user_a_id>', 'transaction', gen_random_uuid(), 'set_category', 'user_accept',
  '{"category": null}', '{"category": "entertainment"}', 0.85)
RETURNING id;

-- ─── RLS: cross-user isolation ───────────────────────────────────────────────

-- Switch session to user_b (set auth.uid() = '<user_b_id>')

-- SHOULD RETURN 0 ROWS: user_b cannot see user_a's rules
SELECT * FROM automation_rules WHERE user_id = '<user_a_id>';

-- SHOULD RETURN 0 ROWS: user_b cannot see user_a's suggestions
SELECT * FROM automation_suggestions WHERE user_id = '<user_a_id>';

-- SHOULD RETURN 0 ROWS: user_b cannot see user_a's audit log
SELECT * FROM automation_audit_log WHERE user_id = '<user_a_id>';

-- ─── RLS: audit log is append-only (no UPDATE) ───────────────────────────────

-- As user_a, insert a valid audit entry then attempt UPDATE — SHOULD FAIL
DO $$
DECLARE
  v_audit_id uuid;
BEGIN
  INSERT INTO automation_audit_log (user_id, entity_type, entity_id, action_taken, triggered_by)
  VALUES ('<user_a_id>', 'transaction', gen_random_uuid(), 'user_manual_category', 'user_manual')
  RETURNING id INTO v_audit_id;

  -- SHOULD FAIL: no UPDATE policy exists on automation_audit_log
  UPDATE automation_audit_log SET undo_blocked_reason = 'test' WHERE id = v_audit_id;
END;
$$;

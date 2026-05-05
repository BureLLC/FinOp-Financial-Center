-- Phase 4 PR A: extend automation table CHECK constraints with exact Phase 4
-- values only. All Phase 1/2/3 allowed values are preserved unchanged.
--
-- Values NOT added (intentional exclusions):
--   auto_applied, writeoff_rollup, tax_rollup, savings_goal_allocation,
--   budget_category, transfer_reconciliation, duplicate_detection,
--   investment_alert, documentation_reminder
--
-- Three constraints are extended:
--   1. automation_suggestions.suggestion_type — adds 'business_expense_candidate'
--   2. automation_rules.action_type           — adds 'mark_business_candidate'
--   3. automation_audit_log.action_taken      — adds 'mark_business_candidate',
--                                               'undo_mark_business_candidate'
--
-- automation_rules.rule_type is NOT changed: business expense rules reuse
--   rule_type = 'transaction_category'; action_type is the differentiator.
-- automation_rules.matcher_type is NOT changed: reuses 'merchant_normalized'.
--
-- Constraint drops are defensive: the actual constraint name is looked up from
-- pg_constraint before dropping, to avoid relying on assumed auto-generated names.
-- The existing inline column-level constraints have no explicit name, so PostgreSQL
-- auto-generates one; this DO-block approach survives if that name ever differs.
--
-- Rollback:
--   See individual rollback comments below each constraint block.

-- ─── 1. automation_suggestions.suggestion_type ───────────────────────────────

DO $$
DECLARE
  v_cname text;
BEGIN
  SELECT conname INTO v_cname
  FROM pg_constraint
  WHERE conrelid = 'automation_suggestions'::regclass
    AND contype = 'c'
    AND conname LIKE '%suggestion_type%';

  IF v_cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE automation_suggestions DROP CONSTRAINT %I', v_cname);
  END IF;

  ALTER TABLE automation_suggestions
    ADD CONSTRAINT automation_suggestions_suggestion_type_check
      CHECK (suggestion_type IN (
        'transaction_category',
        'business_expense_candidate'
      ));
END $$;

-- Rollback:
--   DO $$
--   DECLARE v_cname text;
--   BEGIN
--     SELECT conname INTO v_cname FROM pg_constraint
--     WHERE conrelid = 'automation_suggestions'::regclass AND contype = 'c'
--       AND conname LIKE '%suggestion_type%';
--     IF v_cname IS NOT NULL THEN
--       EXECUTE format('ALTER TABLE automation_suggestions DROP CONSTRAINT %I', v_cname);
--     END IF;
--     ALTER TABLE automation_suggestions
--       ADD CONSTRAINT automation_suggestions_suggestion_type_check
--         CHECK (suggestion_type = 'transaction_category');
--   END $$;

-- ─── 2. automation_rules.action_type ─────────────────────────────────────────

DO $$
DECLARE
  v_cname text;
BEGIN
  SELECT conname INTO v_cname
  FROM pg_constraint
  WHERE conrelid = 'automation_rules'::regclass
    AND contype = 'c'
    AND conname LIKE '%action_type%';

  IF v_cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE automation_rules DROP CONSTRAINT %I', v_cname);
  END IF;

  ALTER TABLE automation_rules
    ADD CONSTRAINT automation_rules_action_type_check
      CHECK (action_type IN (
        'set_category',
        'set_subcategory',
        'mark_business_candidate'
      ));
END $$;

-- Rollback:
--   DO $$
--   DECLARE v_cname text;
--   BEGIN
--     SELECT conname INTO v_cname FROM pg_constraint
--     WHERE conrelid = 'automation_rules'::regclass AND contype = 'c'
--       AND conname LIKE '%action_type%';
--     IF v_cname IS NOT NULL THEN
--       EXECUTE format('ALTER TABLE automation_rules DROP CONSTRAINT %I', v_cname);
--     END IF;
--     ALTER TABLE automation_rules
--       ADD CONSTRAINT automation_rules_action_type_check
--         CHECK (action_type IN ('set_category', 'set_subcategory'));
--   END $$;

-- ─── 3. automation_audit_log.action_taken ────────────────────────────────────
-- The audit log INSERT in mark-business and its undo both require these new values.
-- Without this extension the INSERTs would violate the constraint at runtime.

DO $$
DECLARE
  v_cname text;
BEGIN
  SELECT conname INTO v_cname
  FROM pg_constraint
  WHERE conrelid = 'automation_audit_log'::regclass
    AND contype = 'c'
    AND conname LIKE '%action_taken%';

  IF v_cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE automation_audit_log DROP CONSTRAINT %I', v_cname);
  END IF;

  ALTER TABLE automation_audit_log
    ADD CONSTRAINT automation_audit_log_action_taken_check
      CHECK (action_taken IN (
        'set_category',
        'set_subcategory',
        'undo_set_category',
        'undo_set_subcategory',
        'user_manual_category',
        'mark_business_candidate',
        'undo_mark_business_candidate'
      ));
END $$;

-- Rollback:
--   DO $$
--   DECLARE v_cname text;
--   BEGIN
--     SELECT conname INTO v_cname FROM pg_constraint
--     WHERE conrelid = 'automation_audit_log'::regclass AND contype = 'c'
--       AND conname LIKE '%action_taken%';
--     IF v_cname IS NOT NULL THEN
--       EXECUTE format('ALTER TABLE automation_audit_log DROP CONSTRAINT %I', v_cname);
--     END IF;
--     ALTER TABLE automation_audit_log
--       ADD CONSTRAINT automation_audit_log_action_taken_check
--         CHECK (action_taken IN (
--           'set_category', 'set_subcategory',
--           'undo_set_category', 'undo_set_subcategory',
--           'user_manual_category'
--         ));
--   END $$;

-- ─── Postgres function: apply_business_candidate_suggestion ──────────────────
-- Atomically accepts a business_expense_candidate suggestion.
-- Guards:
--   1. suggestion.user_id must equal p_user_id
--   2. suggestion.status must be 'pending'
--   3. suggestion.suggestion_type must be 'business_expense_candidate'
--   4. the transaction must belong to p_user_id (via financial_accounts join)
-- Writes only: transactions.is_business_candidate.
-- Never writes: category, subcategory, income_subtype, direction, amount,
--               transaction_date, transaction_type, status, financial_account_id,
--               external_transaction_id, provider, deleted_at.
-- Returns: jsonb { success: bool, audit_id: uuid }

CREATE OR REPLACE FUNCTION apply_business_candidate_suggestion(
  p_suggestion_id uuid,
  p_user_id       uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_suggestion     automation_suggestions%ROWTYPE;
  v_tx_id          uuid;
  v_tx_user_id     uuid;
  v_prev_candidate boolean;
  v_audit_id       uuid;
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

  -- 3. Verify suggestion type
  IF v_suggestion.suggestion_type <> 'business_expense_candidate' THEN
    RAISE EXCEPTION 'Wrong suggestion_type for this function: %', v_suggestion.suggestion_type;
  END IF;

  -- 4. Verify transaction ownership via financial_accounts join
  v_tx_id := v_suggestion.source_entity_id;

  SELECT fa.user_id INTO v_tx_user_id
  FROM transactions t
  JOIN financial_accounts fa ON fa.id = t.financial_account_id
  WHERE t.id = v_tx_id;

  IF NOT FOUND OR v_tx_user_id <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: transaction does not belong to user';
  END IF;

  -- 5. Capture current is_business_candidate for audit previous_value
  SELECT is_business_candidate INTO v_prev_candidate
  FROM transactions
  WHERE id = v_tx_id;

  -- 6. Update transactions — is_business_candidate only
  UPDATE transactions
  SET is_business_candidate = true
  WHERE id = v_tx_id;

  -- 7. Mark suggestion accepted
  UPDATE automation_suggestions
  SET
    status      = 'accepted',
    resolved_at = now(),
    resolved_by = 'user'
  WHERE id = p_suggestion_id;

  -- 8. Insert audit log entry; capture generated ID for return
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
    'mark_business_candidate',
    jsonb_build_object('is_business_candidate', v_prev_candidate),
    jsonb_build_object('is_business_candidate', true),
    v_suggestion.confidence,
    'user_accept'
  )
  RETURNING id INTO v_audit_id;

  RETURN jsonb_build_object('success', true, 'audit_id', v_audit_id);
END;
$$;

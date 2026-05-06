-- Write-Off Candidate PR A: extend automation table CHECK constraints with
-- exact Write-Off Candidate values only. All Phase 1/4 allowed values are
-- preserved unchanged.
--
-- Values NOT added (intentional exclusions):
--   auto_applied, writeoff_rollup, tax_rollup, savings_goal_allocation,
--   budget_category, transfer_reconciliation, duplicate_detection,
--   investment_alert, documentation_reminder
--
-- Three constraints are extended:
--   1. automation_suggestions.suggestion_type — adds 'write_off_candidate'
--   2. automation_rules.action_type           — adds 'mark_writeoff_candidate'
--   3. automation_audit_log.action_taken      — adds 'mark_writeoff_candidate',
--                                               'undo_mark_writeoff_candidate'
--
-- automation_rules.rule_type is NOT changed: write-off candidate rules reuse
--   rule_type = 'transaction_category'; action_type is the differentiator.
-- automation_rules.matcher_type is NOT changed: reuses existing matcher types.
--
-- No Postgres function is added in PR A. The apply_writeoff_candidate_suggestion
-- RPC will be added atomically in PR B alongside the full accept path.
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
  WHERE conrelid = 'public.automation_suggestions'::regclass
    AND contype = 'c'
    AND conname LIKE '%suggestion_type%';

  IF v_cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.automation_suggestions DROP CONSTRAINT %I', v_cname);
  END IF;

  ALTER TABLE public.automation_suggestions
    ADD CONSTRAINT automation_suggestions_suggestion_type_check
      CHECK (suggestion_type IN (
        'transaction_category',
        'business_expense_candidate',
        'write_off_candidate'
      ));
END $$;

-- Rollback:
--   DO $$
--   DECLARE v_cname text;
--   BEGIN
--     SELECT conname INTO v_cname FROM pg_constraint
--     WHERE conrelid = 'public.automation_suggestions'::regclass AND contype = 'c'
--       AND conname LIKE '%suggestion_type%';
--     IF v_cname IS NOT NULL THEN
--       EXECUTE format('ALTER TABLE public.automation_suggestions DROP CONSTRAINT %I', v_cname);
--     END IF;
--     ALTER TABLE public.automation_suggestions
--       ADD CONSTRAINT automation_suggestions_suggestion_type_check
--         CHECK (suggestion_type IN (
--           'transaction_category',
--           'business_expense_candidate'
--         ));
--   END $$;

-- ─── 2. automation_rules.action_type ─────────────────────────────────────────

DO $$
DECLARE
  v_cname text;
BEGIN
  SELECT conname INTO v_cname
  FROM pg_constraint
  WHERE conrelid = 'public.automation_rules'::regclass
    AND contype = 'c'
    AND conname LIKE '%action_type%';

  IF v_cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.automation_rules DROP CONSTRAINT %I', v_cname);
  END IF;

  ALTER TABLE public.automation_rules
    ADD CONSTRAINT automation_rules_action_type_check
      CHECK (action_type IN (
        'set_category',
        'set_subcategory',
        'mark_business_candidate',
        'mark_writeoff_candidate'
      ));
END $$;

-- Rollback:
--   DO $$
--   DECLARE v_cname text;
--   BEGIN
--     SELECT conname INTO v_cname FROM pg_constraint
--     WHERE conrelid = 'public.automation_rules'::regclass AND contype = 'c'
--       AND conname LIKE '%action_type%';
--     IF v_cname IS NOT NULL THEN
--       EXECUTE format('ALTER TABLE public.automation_rules DROP CONSTRAINT %I', v_cname);
--     END IF;
--     ALTER TABLE public.automation_rules
--       ADD CONSTRAINT automation_rules_action_type_check
--         CHECK (action_type IN (
--           'set_category',
--           'set_subcategory',
--           'mark_business_candidate'
--         ));
--   END $$;

-- ─── 3. automation_audit_log.action_taken ─────────────────────────────────────
-- Both 'mark_writeoff_candidate' (PR B mark path) and 'undo_mark_writeoff_candidate'
-- (PR B undo path) are added now so the constraint is ready when the write path ships.

DO $$
DECLARE
  v_cname text;
BEGIN
  SELECT conname INTO v_cname
  FROM pg_constraint
  WHERE conrelid = 'public.automation_audit_log'::regclass
    AND contype = 'c'
    AND conname LIKE '%action_taken%';

  IF v_cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.automation_audit_log DROP CONSTRAINT %I', v_cname);
  END IF;

  ALTER TABLE public.automation_audit_log
    ADD CONSTRAINT automation_audit_log_action_taken_check
      CHECK (action_taken IN (
        'set_category',
        'set_subcategory',
        'undo_set_category',
        'undo_set_subcategory',
        'user_manual_category',
        'mark_business_candidate',
        'undo_mark_business_candidate',
        'mark_writeoff_candidate',
        'undo_mark_writeoff_candidate'
      ));
END $$;

-- Rollback:
--   DO $$
--   DECLARE v_cname text;
--   BEGIN
--     SELECT conname INTO v_cname FROM pg_constraint
--     WHERE conrelid = 'public.automation_audit_log'::regclass AND contype = 'c'
--       AND conname LIKE '%action_taken%';
--     IF v_cname IS NOT NULL THEN
--       EXECUTE format('ALTER TABLE public.automation_audit_log DROP CONSTRAINT %I', v_cname);
--     END IF;
--     ALTER TABLE public.automation_audit_log
--       ADD CONSTRAINT automation_audit_log_action_taken_check
--         CHECK (action_taken IN (
--           'set_category', 'set_subcategory',
--           'undo_set_category', 'undo_set_subcategory',
--           'user_manual_category',
--           'mark_business_candidate', 'undo_mark_business_candidate'
--         ));
--   END $$;

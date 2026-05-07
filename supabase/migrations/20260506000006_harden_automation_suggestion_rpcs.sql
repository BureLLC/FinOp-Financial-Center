-- Harden apply_automation_suggestion and undo_automation_suggestion RPCs.
--
-- Migration 003 defined these functions with SECURITY DEFINER but without
-- SET search_path = public. A malicious search_path could redirect unqualified
-- table references to a shadow schema. This migration recreates both functions
-- with explicit schema qualification on every table reference and sets the
-- search_path to public to prevent injection.
--
-- Also adds GRANT EXECUTE TO authenticated so PostgREST can invoke both
-- functions on behalf of authenticated users (missing from migration 003).
--
-- Rollback: DROP FUNCTION IF EXISTS public.apply_automation_suggestion(uuid,uuid);
--           DROP FUNCTION IF EXISTS public.undo_automation_suggestion(uuid,uuid);
--           (then restore migration 003 versions if needed)

-- ─── apply_automation_suggestion ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.apply_automation_suggestion(
  p_suggestion_id uuid,
  p_user_id       uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_suggestion        public.automation_suggestions%ROWTYPE;
  v_rule              public.automation_rules%ROWTYPE;
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
  FROM public.automation_suggestions
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
  FROM public.transactions t
  JOIN public.financial_accounts fa ON fa.id = t.financial_account_id
  WHERE t.id = v_tx_id;

  IF NOT FOUND OR v_tx_user_id <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: transaction does not belong to user';
  END IF;

  -- 5. Capture previous values for audit
  SELECT category, subcategory
  INTO v_prev_category, v_prev_subcategory
  FROM public.transactions
  WHERE id = v_tx_id;

  -- 6. Fetch rule for confidence and apply_count update
  IF v_suggestion.automation_rule_id IS NOT NULL THEN
    SELECT * INTO v_rule
    FROM public.automation_rules
    WHERE id = v_suggestion.automation_rule_id
    FOR UPDATE;
  END IF;

  -- 7. Update transactions — category and subcategory only
  UPDATE public.transactions
  SET
    category    = v_new_category,
    subcategory = COALESCE(v_new_subcategory, subcategory)
  WHERE id = v_tx_id;

  -- 8. Mark suggestion accepted
  UPDATE public.automation_suggestions
  SET
    status      = 'accepted',
    resolved_at = now(),
    resolved_by = 'user'
  WHERE id = p_suggestion_id;

  -- 9. Update rule counters if rule exists
  IF v_rule.id IS NOT NULL THEN
    UPDATE public.automation_rules
    SET
      apply_count     = apply_count + 1,
      last_applied_at = now(),
      updated_at      = now()
    WHERE id = v_rule.id;
  END IF;

  -- 10. Insert audit log entry
  INSERT INTO public.automation_audit_log (
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

GRANT EXECUTE ON FUNCTION public.apply_automation_suggestion(uuid, uuid) TO authenticated;

-- ─── undo_automation_suggestion ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.undo_automation_suggestion(
  p_audit_id  uuid,
  p_user_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit           public.automation_audit_log%ROWTYPE;
  v_current_cat     text;
  v_current_subcat  text;
  v_prev_category   text;
  v_prev_subcategory text;
  v_expected_cat    text;
BEGIN
  -- 1. Fetch audit entry; verify ownership
  SELECT * INTO v_audit
  FROM public.automation_audit_log
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
  FROM public.transactions
  WHERE id = v_audit.entity_id;

  -- 4. Stale-value guard: current value must match what automation wrote
  v_expected_cat := (v_audit.new_value->>'category');

  IF v_current_cat IS DISTINCT FROM v_expected_cat THEN
    -- Log the blocked undo attempt, then return failure
    INSERT INTO public.automation_audit_log (
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
  UPDATE public.transactions
  SET
    category    = v_prev_category,
    subcategory = v_prev_subcategory
  WHERE id = v_audit.entity_id;

  -- 7. Set suggestion status to 'undone'
  IF v_audit.suggestion_id IS NOT NULL THEN
    UPDATE public.automation_suggestions
    SET status = 'undone'
    WHERE id = v_audit.suggestion_id
      AND user_id = p_user_id;
  END IF;

  -- 8. Decrement rule apply_count (floor 0); do not modify last_applied_at
  IF v_audit.automation_rule_id IS NOT NULL THEN
    UPDATE public.automation_rules
    SET
      apply_count = GREATEST(apply_count - 1, 0),
      updated_at  = now()
    WHERE id = v_audit.automation_rule_id
      AND user_id = p_user_id;
  END IF;

  -- 9. Insert undo audit entry
  INSERT INTO public.automation_audit_log (
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

GRANT EXECUTE ON FUNCTION public.undo_automation_suggestion(uuid, uuid) TO authenticated;

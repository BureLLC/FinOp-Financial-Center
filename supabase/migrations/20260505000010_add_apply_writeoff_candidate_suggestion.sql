-- Migration: add apply_writeoff_candidate_suggestion function
-- Provides an atomic RPC for accepting write_off_candidate suggestions.
-- Mirrors apply_business_candidate_suggestion from migration 007.
-- Rollback: DROP FUNCTION IF EXISTS apply_writeoff_candidate_suggestion(uuid, uuid);

-- apply_writeoff_candidate_suggestion(p_suggestion_id, p_user_id)
-- Guards:
--   1. suggestion must belong to p_user_id
--   2. suggestion.status must be 'pending'
--   3. suggestion.suggestion_type must be 'write_off_candidate'
--   4. the transaction must belong to p_user_id (via financial_accounts join)
-- Writes only: transactions.is_writeoff_candidate.
-- Never writes: category, subcategory, income_subtype, direction, amount,
--               transaction_date, transaction_type, status, financial_account_id,
--               external_transaction_id, provider, deleted_at.
-- Does not create write_offs, update Tax Center, or affect deductible totals.
-- Returns: jsonb { success: bool, audit_id: uuid }

CREATE OR REPLACE FUNCTION apply_writeoff_candidate_suggestion(
  p_suggestion_id uuid,
  p_user_id       uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_suggestion     public.automation_suggestions%ROWTYPE;
  v_tx_id          uuid;
  v_tx_user_id     uuid;
  v_prev_candidate boolean;
  v_audit_id       uuid;
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

  -- 3. Verify suggestion type
  IF v_suggestion.suggestion_type <> 'write_off_candidate' THEN
    RAISE EXCEPTION 'Wrong suggestion_type for this function: %', v_suggestion.suggestion_type;
  END IF;

  -- 4. Verify transaction ownership via financial_accounts join
  v_tx_id := v_suggestion.source_entity_id;

  SELECT fa.user_id INTO v_tx_user_id
  FROM public.transactions t
  JOIN public.financial_accounts fa ON fa.id = t.financial_account_id
  WHERE t.id = v_tx_id;

  IF NOT FOUND OR v_tx_user_id <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: transaction does not belong to user';
  END IF;

  -- 5. Capture current is_writeoff_candidate for audit previous_value
  SELECT is_writeoff_candidate INTO v_prev_candidate
  FROM public.transactions
  WHERE id = v_tx_id;

  -- 6. Update transactions — is_writeoff_candidate only
  UPDATE public.transactions
  SET is_writeoff_candidate = true
  WHERE id = v_tx_id;

  -- 7. Mark suggestion accepted
  UPDATE public.automation_suggestions
  SET
    status      = 'accepted',
    resolved_at = now(),
    resolved_by = 'user'
  WHERE id = p_suggestion_id;

  -- 8. Insert audit log entry; capture generated ID for return
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
    'mark_writeoff_candidate',
    jsonb_build_object('is_writeoff_candidate', v_prev_candidate),
    jsonb_build_object('is_writeoff_candidate', true),
    v_suggestion.confidence,
    'user_accept'
  )
  RETURNING id INTO v_audit_id;

  RETURN jsonb_build_object('success', true, 'audit_id', v_audit_id);
END;
$$;

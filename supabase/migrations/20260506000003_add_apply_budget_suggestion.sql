-- apply_budget_suggestion: atomically accepts a pending budget suggestion.
--
-- Writes to:
--   budget_categories.monthly_limit  (upsert by user_id + case-insensitive name)
--   budget_suggestions.status / resolved_at / resolved_by
--
-- Never writes to:
--   transactions, accounts, envelopes, tax values, write-off totals,
--   balances, Plaid/SnapTrade fields, or any financial source-of-truth table.
--
-- Rollback: DROP FUNCTION IF EXISTS public.apply_budget_suggestion;

CREATE OR REPLACE FUNCTION public.apply_budget_suggestion(
  p_suggestion_id uuid,
  p_user_id       uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category      text;
  v_suggested_amt numeric(18,2);
  v_status        text;
  v_cat_id        uuid;
BEGIN
  -- 1. Fetch and verify: suggestion must belong to the caller and be pending.
  SELECT category, suggested_amount, status
  INTO   v_category, v_suggested_amt, v_status
  FROM   public.budget_suggestions
  WHERE  id      = p_suggestion_id
    AND  user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized or suggestion not found';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Suggestion is not pending';
  END IF;

  -- 2. Try to update an existing active budget_categories row (case-insensitive name match).
  UPDATE public.budget_categories
  SET    monthly_limit = v_suggested_amt,
         updated_at    = now()
  WHERE  user_id       = p_user_id
    AND  LOWER(name)   = LOWER(v_category)
    AND  is_active     = true
  RETURNING id INTO v_cat_id;

  -- 3. If no existing row matched, insert a new one.
  IF v_cat_id IS NULL THEN
    INSERT INTO public.budget_categories
      (user_id, name, category_type, monthly_limit, is_active, created_at, updated_at)
    VALUES
      (p_user_id, v_category, 'expense', v_suggested_amt, true, now(), now())
    RETURNING id INTO v_cat_id;
  END IF;

  -- 4. Mark suggestion accepted.
  UPDATE public.budget_suggestions
  SET    status      = 'accepted',
         resolved_at = now(),
         resolved_by = 'user'
  WHERE  id      = p_suggestion_id
    AND  user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'category_id', v_cat_id);
END;
$$;

-- Grant execute to authenticated role so route handlers can call it via Supabase client.
GRANT EXECUTE ON FUNCTION public.apply_budget_suggestion(uuid, uuid) TO authenticated;

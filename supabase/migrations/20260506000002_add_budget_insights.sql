-- Budget Automation PR A: budget_insights table
--
-- Stores detected spending patterns surfaced as read-only insights to the user.
-- Insights are planning metadata only — they do not modify transactions, categories,
-- account balances, tax values, write-off totals, or any financial source-of-truth.
--
-- Insight types (MVP):
--   recurring_bill   — a merchant appears with consistent amount and cadence
--   spending_trend   — a category is trending higher or lower vs. prior periods
--
-- Lifecycle:
--   active    → dismissed (user acknowledges; no financial writes occur)
--   No auto-accept. No financial effects on dismiss.
--
-- Rollback: DROP TABLE IF EXISTS public.budget_insights;

CREATE TABLE IF NOT EXISTS public.budget_insights (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Classification of the insight.
  insight_type    text        NOT NULL
                              CHECK (insight_type IN ('recurring_bill', 'spending_trend')),

  -- Populated for recurring_bill insights: the normalized merchant name.
  merchant_name   text,

  -- Populated for spending_trend insights: the transaction category.
  category        text,

  -- Estimated monthly cost for recurring_bill; trend magnitude for spending_trend.
  -- Nullable — some trend insights may not have a clean dollar estimate.
  amount_estimate numeric(18,2) CHECK (amount_estimate IS NULL OR amount_estimate >= 0),

  -- Detected billing cadence for recurring_bill insights.
  cadence         text        CHECK (cadence IN ('weekly', 'monthly', 'annual')),

  confidence      numeric(5,4) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),

  -- Human-readable explanation shown in the UI.
  reason          text        NOT NULL,

  -- Lifecycle status. Transitions replace deletion (no DELETE policy).
  status          text        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'dismissed')),

  first_detected_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS budget_insights_user_status_idx
  ON public.budget_insights (user_id, status);

CREATE INDEX IF NOT EXISTS budget_insights_merchant_idx
  ON public.budget_insights (user_id, merchant_name)
  WHERE merchant_name IS NOT NULL;

-- Prevents duplicate active recurring_bill insights for the same user + merchant.
CREATE UNIQUE INDEX IF NOT EXISTS budget_insights_recurring_dedup_idx
  ON public.budget_insights (user_id, merchant_name)
  WHERE insight_type = 'recurring_bill' AND status = 'active';

-- Row-Level Security: users may only read and manage their own insights.
ALTER TABLE public.budget_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_insights: users select own"
  ON public.budget_insights FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "budget_insights: users insert own"
  ON public.budget_insights FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "budget_insights: users update own"
  ON public.budget_insights FOR UPDATE
  USING (user_id = auth.uid());

-- No DELETE policy. Status transitions (active → dismissed) replace deletion.

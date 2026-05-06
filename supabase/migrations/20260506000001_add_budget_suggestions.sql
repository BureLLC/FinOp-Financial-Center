-- Budget Automation PR A: budget_suggestions table
--
-- Stores automation-proposed monthly budget limits per spending category.
-- Suggestions are planning metadata only — they do not modify transactions,
-- account balances, tax values, write-off totals, or any financial source-of-truth.
--
-- Lifecycle:
--   pending  → accepted (user confirms; accept route writes monthly_limit to budget_categories)
--   pending  → rejected (user dismisses with rejection_reason)
--   No auto-accept. No auto-apply.
--
-- Deduplication: application layer prevents regeneration for categories that already
-- have a pending or accepted suggestion in the same basis window.
--
-- Rollback: DROP TABLE IF EXISTS public.budget_suggestions;

CREATE TABLE IF NOT EXISTS public.budget_suggestions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The spending category this suggestion targets.
  -- Matches transactions.category (case-insensitive comparison in application layer).
  category          text        NOT NULL,

  -- The automation-proposed monthly spending limit for this category.
  -- Derived from avg_monthly_spend with optional rounding applied in the engine.
  -- Never written to budget_categories.monthly_limit without explicit user confirmation.
  suggested_amount  numeric(18,2) NOT NULL CHECK (suggested_amount >= 0),

  -- Number of calendar months of transaction history used to compute the suggestion.
  -- Minimum 2 (confidence threshold). Higher = higher confidence.
  basis_months      integer     NOT NULL CHECK (basis_months >= 2),

  -- Raw average of monthly debit spending for this category over basis_months.
  avg_monthly_spend numeric(18,2) NOT NULL CHECK (avg_monthly_spend >= 0),

  -- Confidence score: 0.80 for 3+ basis months, 0.60 for exactly 2.
  confidence        numeric(5,4) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),

  -- Human-readable explanation shown in the UI.
  reason            text        NOT NULL,

  -- Lifecycle status. Transitions replace deletion (no DELETE policy).
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'accepted', 'rejected')),

  -- Populated on reject. 'already_budgeted' | 'amount_wrong' | 'skipped'
  rejection_reason  text        CHECK (rejection_reason IN ('already_budgeted', 'amount_wrong', 'skipped')),

  created_at        timestamptz NOT NULL DEFAULT now(),
  resolved_at       timestamptz,
  resolved_by       text        CHECK (resolved_by IN ('user', 'system'))
);

CREATE INDEX IF NOT EXISTS budget_suggestions_user_status_idx
  ON public.budget_suggestions (user_id, status);

CREATE INDEX IF NOT EXISTS budget_suggestions_category_idx
  ON public.budget_suggestions (user_id, category);

-- Prevents duplicate pending suggestions for the same user + category pair.
-- One active suggestion per category at a time.
CREATE UNIQUE INDEX IF NOT EXISTS budget_suggestions_pending_dedup_idx
  ON public.budget_suggestions (user_id, category)
  WHERE status = 'pending';

-- Row-Level Security: users may only read and manage their own suggestions.
ALTER TABLE public.budget_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_suggestions: users select own"
  ON public.budget_suggestions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "budget_suggestions: users insert own"
  ON public.budget_suggestions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "budget_suggestions: users update own"
  ON public.budget_suggestions FOR UPDATE
  USING (user_id = auth.uid());

-- No DELETE policy. Status transitions (pending → accepted | rejected) replace deletion.

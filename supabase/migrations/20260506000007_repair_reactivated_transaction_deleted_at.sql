-- Migration: repair soft-deleted transactions linked to reactivated accounts
--
-- Root cause: when a connection is deleted, transactions are soft-deleted
-- (deleted_at = now()). If the same connection is reconnected (same Plaid
-- item_id), plaid-exchange-token reactivates the connection and
-- upsertFinancialAccount reactivates the accounts (deleted_at → NULL).
-- However, upsertTransaction only updated status on match — it did not
-- clear deleted_at. Transactions remained invisible to financial pages
-- that filter with deleted_at IS NULL.
--
-- This migration clears deleted_at only for transactions that meet ALL of:
--   1. deleted_at IS NOT NULL  (soft-deleted)
--   2. linked to a financial_account with is_active = true AND deleted_at IS NULL
--      (the account has been reactivated, so the transaction should be visible)
--
-- Safety:
--   - Does NOT modify amounts, dates, descriptions, or any financial fields.
--   - Only writes deleted_at = NULL and updated_at = now() on qualifying rows.
--   - Idempotent: safe to re-run.
--   - Guarded: skips silently if required tables do not yet exist (shadow DB).
--
-- Rollback:
--   No automated rollback. Prior deleted_at values are not preserved.
--   To revert: soft-delete transactions again via the delete connection flow.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'transactions'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'financial_accounts'
  )
  THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'transactions'
        AND column_name = 'updated_at'
    )
    THEN
      EXECUTE $sql$
        UPDATE public.transactions t
        SET deleted_at = NULL,
            updated_at = now()
        FROM public.financial_accounts fa
        WHERE t.financial_account_id = fa.id
          AND t.deleted_at IS NOT NULL
          AND fa.is_active = true
          AND fa.deleted_at IS NULL
      $sql$;
    ELSE
      EXECUTE $sql$
        UPDATE public.transactions t
        SET deleted_at = NULL
        FROM public.financial_accounts fa
        WHERE t.financial_account_id = fa.id
          AND t.deleted_at IS NOT NULL
          AND fa.is_active = true
          AND fa.deleted_at IS NULL
      $sql$;
    END IF;
  ELSE
    RAISE NOTICE 'Skipping transactions deleted_at repair: required tables not present';
  END IF;
END $$;

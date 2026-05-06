-- Migration: repair reactivated financial accounts with stale deleted_at
--
-- Root cause: upsertFinancialAccount in process-refresh-job did not include
-- deleted_at: null in its update payload. After a delete + reconnect + sync,
-- financial_accounts rows could be set is_active = true while deleted_at
-- remained set from the prior delete operation.
--
-- getCanonicalTransactions() requires financial_accounts.deleted_at IS NULL,
-- so transactions linked to these accounts were invisible to all financial pages.
--
-- This migration clears deleted_at only for accounts that meet ALL of:
--   1. is_active = true  (system already considers them live)
--   2. deleted_at IS NOT NULL  (the stale state)
--   3. linked to an integration_connection with status = 'active'
--
-- Safety:
--   - Does NOT restore soft-deleted transactions.
--   - Does NOT modify balances, amounts, or any financial fields.
--   - Only writes deleted_at = NULL and updated_at = now() on qualifying rows.
--   - Idempotent: safe to re-run.
--   - Guarded: skips silently if required tables do not yet exist (shadow DB).
--
-- Rollback:
--   There is no safe automated rollback. The prior deleted_at values are not
--   preserved. If reverting is needed, run a delete on integration_connections
--   and re-sync.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'financial_accounts'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'integration_connections'
  )
  THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'financial_accounts'
        AND column_name = 'updated_at'
    )
    THEN
      EXECUTE $sql$
        UPDATE public.financial_accounts fa
        SET deleted_at = NULL,
            updated_at = now()
        FROM public.integration_connections ic
        WHERE fa.integration_connection_id = ic.id
          AND fa.is_active = true
          AND fa.deleted_at IS NOT NULL
          AND ic.status = 'active'
      $sql$;
    ELSE
      EXECUTE $sql$
        UPDATE public.financial_accounts fa
        SET deleted_at = NULL
        FROM public.integration_connections ic
        WHERE fa.integration_connection_id = ic.id
          AND fa.is_active = true
          AND fa.deleted_at IS NOT NULL
          AND ic.status = 'active'
      $sql$;
    END IF;
  ELSE
    RAISE NOTICE 'Skipping financial_accounts deleted_at repair: required tables not present';
  END IF;
END $$;

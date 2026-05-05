-- Phase 4 PR A: add is_business_candidate to transactions.
--
-- Semantic definition:
--   true  = user confirmed this transaction may be business-related
--   false = user explicitly declined (reserved for future use; not written in Phase 4)
--   NULL  = never evaluated (default for all existing and new rows)
--
-- What this field does NOT mean:
--   - deductible
--   - write-off eligible
--   - tax-qualified
--   - receipt-verified
--   - business purpose verified
--   - deductible percentage assigned
--
-- canonicalFinancialData.ts does NOT read this field in Phase 4.
-- isDeductibleBusinessExpense() reads only tx.category — this field has no effect
-- on Tax Center, Write-Off totals, or any financial calculation.
--
-- Guard: public.transactions is created outside the automation migration set
-- (via base schema restore or Supabase dashboard). This DO block skips the
-- ALTER safely in shadow/fresh databases that only have the automation tables,
-- while still adding the column when applied to an environment where the table exists.
--
-- Rollback: ALTER TABLE public.transactions DROP COLUMN is_business_candidate;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'transactions'
  ) THEN
    ALTER TABLE public.transactions
      ADD COLUMN IF NOT EXISTS is_business_candidate BOOLEAN NULL;
  ELSE
    RAISE NOTICE 'Skipping: public.transactions not found. Apply base schema before this migration.';
  END IF;
END $$;

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
-- Rollback: ALTER TABLE transactions DROP COLUMN is_business_candidate;

ALTER TABLE transactions
  ADD COLUMN is_business_candidate BOOLEAN NULL;

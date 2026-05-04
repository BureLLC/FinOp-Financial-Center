-- Investment Data Integrity Verification & Repair Script
-- Safe to run multiple times (idempotent, read-heavy, soft-delete only)
-- Run against the Supabase database to verify the brokerage investment data path

-- ============================================================
-- 1. BROKERAGE CONNECTIONS
-- ============================================================
SELECT '=== BROKERAGE CONNECTIONS ===' AS section;
SELECT id, user_id, provider, status, connection_status, institution_name, provider_name, external_id,
       created_at, updated_at, deleted_at
FROM integration_connections
WHERE provider = 'snaptrade'
ORDER BY user_id, created_at;

-- ============================================================
-- 2. BROKERAGE ACCOUNTS (investment-type financial_accounts)
-- ============================================================
SELECT '=== BROKERAGE ACCOUNTS ===' AS section;
SELECT fa.id, fa.user_id, fa.provider, fa.provider_account_id, fa.account_type,
       fa.account_name, fa.institution_name, fa.current_balance, fa.is_active,
       fa.integration_connection_id, fa.deleted_at,
       ic.status AS connection_status, ic.provider AS connection_provider
FROM financial_accounts fa
LEFT JOIN integration_connections ic ON fa.integration_connection_id = ic.id
WHERE fa.account_type = 'investment'
ORDER BY fa.user_id, fa.created_at;

-- ============================================================
-- 3. POSITIONS / HOLDINGS
-- ============================================================
SELECT '=== POSITIONS ===' AS section;
SELECT p.id, p.user_id, p.financial_account_id, p.asset_symbol, p.asset_name,
       p.asset_type, p.calculated_quantity, p.last_price, p.last_valuation,
       p.total_cost_basis, p.unrealized_gain, p.deleted_at,
       fa.account_type AS linked_account_type, fa.provider AS linked_account_provider,
       fa.is_active AS linked_account_active, fa.deleted_at AS linked_account_deleted
FROM positions p
LEFT JOIN financial_accounts fa ON p.financial_account_id = fa.id
ORDER BY p.user_id, p.financial_account_id, p.asset_symbol;

-- ============================================================
-- 4. DATA INTEGRITY CHECKS
-- ============================================================

-- 4a. Positions linked to NON-investment accounts (should be 0)
SELECT '=== CHECK: Positions linked to non-investment accounts ===' AS section;
SELECT p.id AS position_id, p.user_id, p.asset_symbol, p.last_valuation,
       fa.account_type, fa.provider, fa.account_name
FROM positions p
JOIN financial_accounts fa ON p.financial_account_id = fa.id
WHERE fa.account_type != 'investment'
  AND p.deleted_at IS NULL;

-- 4b. Positions linked to deleted accounts (should be 0 or soft-deleted)
SELECT '=== CHECK: Positions linked to deleted accounts ===' AS section;
SELECT p.id AS position_id, p.user_id, p.asset_symbol, p.last_valuation,
       p.deleted_at AS position_deleted, fa.deleted_at AS account_deleted
FROM positions p
JOIN financial_accounts fa ON p.financial_account_id = fa.id
WHERE fa.deleted_at IS NOT NULL
  AND p.deleted_at IS NULL;

-- 4c. Orphaned positions (no matching financial_account)
SELECT '=== CHECK: Orphaned positions ===' AS section;
SELECT p.id AS position_id, p.user_id, p.financial_account_id, p.asset_symbol, p.last_valuation
FROM positions p
LEFT JOIN financial_accounts fa ON p.financial_account_id = fa.id
WHERE fa.id IS NULL
  AND p.deleted_at IS NULL;

-- 4d. Duplicate positions (same user + account + symbol, not deleted)
SELECT '=== CHECK: Duplicate positions ===' AS section;
SELECT user_id, financial_account_id, asset_symbol, COUNT(*) AS dup_count
FROM positions
WHERE deleted_at IS NULL
GROUP BY user_id, financial_account_id, asset_symbol
HAVING COUNT(*) > 1;

-- 4e. Brokerage accounts with no positions
SELECT '=== CHECK: Brokerage accounts with no positions ===' AS section;
SELECT fa.id, fa.user_id, fa.provider, fa.account_name, fa.current_balance, fa.is_active
FROM financial_accounts fa
LEFT JOIN positions p ON p.financial_account_id = fa.id AND p.deleted_at IS NULL
WHERE fa.account_type = 'investment'
  AND fa.is_active = true
  AND fa.deleted_at IS NULL
  AND p.id IS NULL;

-- 4f. User ID mismatches between positions and their accounts
SELECT '=== CHECK: User ID mismatches ===' AS section;
SELECT p.id AS position_id, p.user_id AS position_user, fa.user_id AS account_user
FROM positions p
JOIN financial_accounts fa ON p.financial_account_id = fa.id
WHERE p.user_id != fa.user_id
  AND p.deleted_at IS NULL;

-- ============================================================
-- 5. CANONICAL INVESTMENT CALCULATION (manual verification)
-- ============================================================
SELECT '=== CANONICAL INVESTMENT TOTAL ===' AS section;

-- Positions value (primary source)
SELECT 'positions_value' AS metric,
       COALESCE(SUM(p.last_valuation), 0) AS value,
       COUNT(*) AS position_count
FROM positions p
JOIN financial_accounts fa ON p.financial_account_id = fa.id
WHERE fa.account_type = 'investment'
  AND fa.is_active = true
  AND fa.deleted_at IS NULL
  AND p.deleted_at IS NULL;

-- Fallback balance value
SELECT 'fallback_balance_value' AS metric,
       COALESCE(SUM(fa.current_balance), 0) AS value,
       COUNT(*) AS account_count
FROM financial_accounts fa
WHERE fa.account_type = 'investment'
  AND fa.is_active = true
  AND fa.deleted_at IS NULL;

-- Bank cash (should NOT include investments)
SELECT 'bank_cash' AS metric,
       COALESCE(SUM(fa.current_balance), 0) AS value,
       COUNT(*) AS account_count
FROM financial_accounts fa
WHERE fa.account_type IN ('depository', 'savings')
  AND fa.is_active = true
  AND fa.deleted_at IS NULL;

-- ============================================================
-- 6. REPAIR: Soft-delete positions linked to deleted accounts
-- (idempotent — only affects positions not already soft-deleted)
-- ============================================================
-- UNCOMMENT TO RUN:
-- UPDATE positions
-- SET deleted_at = NOW(), updated_at = NOW()
-- WHERE deleted_at IS NULL
--   AND financial_account_id IN (
--     SELECT id FROM financial_accounts WHERE deleted_at IS NOT NULL
--   );

-- ============================================================
-- 7. REPAIR: Soft-delete orphaned positions
-- (idempotent — only affects positions not already soft-deleted)
-- ============================================================
-- UNCOMMENT TO RUN:
-- UPDATE positions
-- SET deleted_at = NOW(), updated_at = NOW()
-- WHERE deleted_at IS NULL
--   AND financial_account_id NOT IN (
--     SELECT id FROM financial_accounts
--   );

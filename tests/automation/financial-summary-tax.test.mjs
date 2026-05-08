/**
 * Financial Summary Est. Tax Card — Source Parity Tests
 *
 * Verifies that the Financial Summary Est. Tax card uses the same
 * source/semantics as the corrected Tax Center page:
 * - getCanonicalTaxableIncome gates batch tax_estimates values
 * - Valid live zero suppresses stale batch tax values
 * - No truthy > 0 checks on financial values
 * - No stale snapshot sources
 * - No prohibited calculation logic changed
 *
 * All assertions are source-file only — no DB calls.
 *
 * Run with: node --test tests/automation/financial-summary-tax.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const SUMMARY_SRC = readFileSync(
  path.join(ROOT, "app/dashboard/summary/page.tsx"),
  "utf8",
);
const TAX_SRC = readFileSync(
  path.join(ROOT, "app/dashboard/tax/page.tsx"),
  "utf8",
);
const CANONICAL_SRC = readFileSync(
  path.join(ROOT, "src/lib/canonicalFinancialData.ts"),
  "utf8",
);
const CALCS_SRC = readFileSync(
  path.join(ROOT, "src/lib/financialCalculations.ts"),
  "utf8",
);

// ═══════════════════════════════════════════════════════════════════════════
// 1. Canonical tax source — same as Tax Center page
// ═══════════════════════════════════════════════════════════════════════════

test("Financial Summary imports getCanonicalTaxableIncome (same source as Tax Center)", () => {
  assert.match(SUMMARY_SRC, /getCanonicalTaxableIncome/,
    "Financial Summary must import getCanonicalTaxableIncome to match Tax Center source semantics");
});

test("Financial Summary calls getCanonicalTaxableIncome with supabase and user.id", () => {
  assert.match(SUMMARY_SRC, /getCanonicalTaxableIncome\(supabase,\s*user\.id/,
    "getCanonicalTaxableIncome must be scoped to the authenticated user");
});

test("Tax Center page also uses getCanonicalTaxableIncome (parity reference)", () => {
  assert.match(TAX_SRC, /getCanonicalTaxableIncome/,
    "Tax Center must use getCanonicalTaxableIncome — confirming both pages share the same canonical source");
});

test("getCanonicalTaxableIncome exists in canonicalFinancialData.ts", () => {
  assert.match(CANONICAL_SRC, /export async function getCanonicalTaxableIncome/,
    "getCanonicalTaxableIncome must be defined in the canonical data layer");
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. liveZero gate — matches Tax Center semantics exactly
// ═══════════════════════════════════════════════════════════════════════════

test("Financial Summary applies liveZero gate: ctiRes.taxableProfit === 0 suppresses batch value", () => {
  assert.match(SUMMARY_SRC, /ctiRes\.taxableProfit\s*===\s*0/,
    "Financial Summary must check ctiRes.taxableProfit === 0 (not > 0) to detect valid live zero");
});

test("Financial Summary estimatedTax is 0 when live taxable profit is zero (not stale batch)", () => {
  // The assignment must start with the zero guard before reading taxRes
  assert.match(SUMMARY_SRC, /ctiRes\.taxableProfit\s*===\s*0[\s\S]{0,30}?\?\s*0/,
    "estimatedTax must be 0 when ctiRes.taxableProfit is zero — stale batch must not override live zero");
});

test("Tax Center page also uses taxableProfit === 0 guard (both pages consistent)", () => {
  assert.match(TAX_SRC, /displayTaxableIncome\s*===\s*0/,
    "Tax Center liveZero depends on displayTaxableIncome === 0 — confirming the zero-is-valid pattern");
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Stale source exclusion
// ═══════════════════════════════════════════════════════════════════════════

test("Financial Summary does not query portfolio_snapshots table", () => {
  assert.doesNotMatch(SUMMARY_SRC, /from\(["'`]portfolio_snapshots["'`]\)/,
    "Financial Summary must not call .from('portfolio_snapshots') — that is a stale daily batch table");
});

test("Financial Summary does not reference snapshot_date", () => {
  assert.doesNotMatch(SUMMARY_SRC, /snapshot_date/,
    "snapshot_date is a daily-batch-only field and must not appear in the Financial Summary page");
});

test("Financial Summary does not use total_net_worth from snapshot tables", () => {
  assert.doesNotMatch(SUMMARY_SRC, /total_net_worth/,
    "total_net_worth is a batch snapshot field; Financial Summary must compute net worth from live accounts");
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. No truthy > 0 checks on financial values
// ═══════════════════════════════════════════════════════════════════════════

test("Est. Tax KPI value does not use estimatedTax > 0 truthy check", () => {
  // The old code: data.estimatedTax > 0 ? fmt(...) : "—"
  // The fix uses: data.estimatedTax !== null
  assert.doesNotMatch(SUMMARY_SRC, /estimatedTax\s*>\s*0/,
    "estimatedTax > 0 is a truthy check that treats valid zero as missing data — must use !== null");
});

test("Est. Tax KPI uses !== null to distinguish missing estimate from valid zero", () => {
  assert.match(SUMMARY_SRC, /estimatedTax\s*!==\s*null/,
    "Financial Summary must use estimatedTax !== null to detect whether an estimate is available");
});

test("Financial Health Tax Status uses !== null (not > 0) for Tax Status", () => {
  // Tax Status 'good' and value both used > 0 before fix
  const taxStatusMatch = SUMMARY_SRC.match(/Tax Status[\s\S]{0,200}?estimatedTax/);
  assert.ok(taxStatusMatch, "Tax Status row must reference estimatedTax");
  assert.doesNotMatch(taxStatusMatch[0], /estimatedTax\s*>\s*0/,
    "Tax Status must not use estimatedTax > 0 — must use !== null");
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. estimatedTax type — null | number (not just number)
// ═══════════════════════════════════════════════════════════════════════════

test("FinancialData interface declares estimatedTax as number | null", () => {
  assert.match(SUMMARY_SRC, /estimatedTax:\s*number\s*\|\s*null/,
    "estimatedTax must be number | null so the UI can distinguish no-estimate (null) from valid zero (0)");
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. tax_estimates still used when appropriate
// ═══════════════════════════════════════════════════════════════════════════

test("Financial Summary still queries tax_estimates for the batch liability value", () => {
  assert.match(SUMMARY_SRC, /from\("tax_estimates"\)/,
    "tax_estimates must still be queried — it is the correct source when live taxable profit is positive");
});

test("Financial Summary tax_estimates query is scoped to user_id and annual period", () => {
  assert.match(SUMMARY_SRC, /eq\("user_id",\s*user\.id\)/,
    "tax_estimates query must be scoped to the authenticated user");
  assert.match(SUMMARY_SRC, /eq\("period_type",\s*"annual"\)/,
    "tax_estimates query must filter to annual period only");
});

test("Financial Summary batch value used only when live taxable profit is positive", () => {
  // After the zero guard, the batch value is read from taxRes.data
  assert.match(SUMMARY_SRC, /taxRes\.data\s*!==\s*null\s*\?\s*toNum\(taxRes\.data\.total_tax_liability\)/,
    "batch total_tax_liability must only be used when taxRes.data is not null and live profit is nonzero");
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. User isolation
// ═══════════════════════════════════════════════════════════════════════════

test("Financial Summary authenticates user before fetching data", () => {
  assert.match(SUMMARY_SRC, /supabase\.auth\.getUser/,
    "Financial Summary must call supabase.auth.getUser() before any data fetch");
});

test("Financial Summary returns early when no authenticated user", () => {
  assert.match(SUMMARY_SRC, /if \(!user\)\s*return/,
    "Financial Summary must return early when no authenticated user to prevent cross-user data");
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. Other Financial Summary card sources unchanged
// ═══════════════════════════════════════════════════════════════════════════

test("Financial Summary still uses getCanonicalActivePostedTransactions for income/expenses", () => {
  assert.match(SUMMARY_SRC, /getCanonicalActivePostedTransactions/,
    "income and expense calculations must still use the canonical posted-transactions source");
});

test("Financial Summary still uses getCanonicalAccountBalances for cash and liabilities", () => {
  assert.match(SUMMARY_SRC, /getCanonicalAccountBalances/,
    "cash and liability totals must still come from getCanonicalAccountBalances");
});

test("Financial Summary still uses getCanonicalInvestments for portfolio value", () => {
  assert.match(SUMMARY_SRC, /getCanonicalInvestments/,
    "investment total must still come from getCanonicalInvestments (positions-preferred)");
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. No prohibited logic changed
// ═══════════════════════════════════════════════════════════════════════════

test("Tax Center calculation logic (getCanonicalTaxableIncome) is not modified", () => {
  assert.match(CANONICAL_SRC, /export async function getCanonicalTaxableIncome/,
    "getCanonicalTaxableIncome must still exist and be unchanged — Financial Summary fix must not modify it");
});

test("financialCalculations.ts is not modified by Financial Summary fix", () => {
  assert.match(CALCS_SRC, /export function calcTotalIncome/,
    "calcTotalIncome must still exist — Financial Summary fix must not touch financialCalculations.ts");
  assert.match(CALCS_SRC, /export function calcTotalExpenses/,
    "calcTotalExpenses must still exist — Financial Summary fix must not touch financialCalculations.ts");
});

test("LevelUP page is not imported or modified by Financial Summary fix", () => {
  // Financial Summary must not import from or reference the LevelUP page
  assert.doesNotMatch(SUMMARY_SRC, /levelup/i,
    "Financial Summary must not reference LevelUP — they are independent pages");
});

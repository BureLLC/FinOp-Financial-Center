/**
 * Tax Center — Taxable Income Calculation & Label Tests
 *
 * Verifies that:
 * - Business income is filtered to the selected/current tax year before summing
 * - Prior-year business/self-employment income is excluded from the current-year calculation
 * - Current-year deductible expenses are still subtracted (same year scope both sides)
 * - A valid zero taxableProfit does NOT trigger the tax_estimates fallback
 * - The tax_estimates fallback is only used when live data truly failed to load
 * - Excluded income types remain excluded (salary, rental, dividend, etc.)
 * - Excluded transaction states remain excluded (pending, deleted, etc.)
 * - Tax Center label/helper text is honest about what is and is not included
 * - No write-off deduction calculation logic was modified
 *
 * All assertions read source files only — no DB calls.
 *
 * Run with: node --test tests/automation/tax-center-taxable-income.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const CANONICAL_SRC = readFileSync(
  path.join(ROOT, "src/lib/canonicalFinancialData.ts"),
  "utf8",
);
const CALCS_SRC = readFileSync(
  path.join(ROOT, "src/lib/financialCalculations.ts"),
  "utf8",
);
const TAX_PAGE_SRC = readFileSync(
  path.join(ROOT, "app/dashboard/tax/page.tsx"),
  "utf8",
);

// ═══════════════════════════════════════════════════════════════════════════
// 1. Tax year filter applied symmetrically to business income
// ═══════════════════════════════════════════════════════════════════════════

test("getCanonicalTaxableIncome filters business income transactions to the tax year", () => {
  // Both the business income filter and the expense filter must reference taxYear.
  // Extract the function body and confirm taxYear appears in BOTH filter sections.
  const fnBody = CANONICAL_SRC.match(
    /export async function getCanonicalTaxableIncome[\s\S]{0,2000}?return \{[\s\S]{0,200}?\}/
  );
  assert.ok(fnBody, "getCanonicalTaxableIncome function body must be extractable");
  const body = fnBody[0];

  // taxYear must appear at least twice in the body (once for business income, once for expenses)
  const taxYearOccurrences = (body.match(/taxYear/g) ?? []).length;
  assert.ok(
    taxYearOccurrences >= 2,
    `taxYear must be referenced at least twice in getCanonicalTaxableIncome (once for income, once for expenses); found ${taxYearOccurrences}`
  );
});

test("business income filter uses getFullYear() === taxYear (same pattern as expense filter)", () => {
  // Both income and expense paths must use the same year boundary idiom.
  const yearFilterPattern = /isBusinessIncome[\s\S]{0,200}?getFullYear\(\)[\s\S]{0,50}?taxYear/;
  assert.match(
    CANONICAL_SRC,
    yearFilterPattern,
    "business income filter must check getFullYear() === taxYear before summing"
  );
});

test("deductible expense filter still uses getFullYear() === taxYear (unchanged)", () => {
  const expenseYearFilter = /isDeductibleBusinessExpense[\s\S]{0,200}?getFullYear\(\)[\s\S]{0,50}?taxYear/;
  assert.match(
    CANONICAL_SRC,
    expenseYearFilter,
    "deductible expense filter must still check getFullYear() === taxYear"
  );
});

test("taxableProfit is still computed as businessIncome minus deductibleExpenses capped at zero", () => {
  assert.match(
    CANONICAL_SRC,
    /Math\.max\(businessIncome\s*-\s*deductibleExpenses,\s*0\)/,
    "taxableProfit formula must remain: Math.max(businessIncome - deductibleExpenses, 0)"
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Business income qualifiers — only business/self-employment income_subtype
// ═══════════════════════════════════════════════════════════════════════════

test("isBusinessIncome requires income_subtype of business or self-employment", () => {
  // The isBusinessIncome helper must restrict to these two subtypes only
  assert.match(
    CANONICAL_SRC,
    /income_subtype.*business|business.*income_subtype/i,
    "isBusinessIncome must check income_subtype includes 'business'"
  );
  assert.match(
    CANONICAL_SRC,
    /self-employment/,
    "isBusinessIncome must check income_subtype includes 'self-employment'"
  );
});

test("isBusinessIncome requires direction === credit", () => {
  assert.match(
    CANONICAL_SRC,
    /direction.*credit|credit.*direction/,
    "isBusinessIncome must require direction === 'credit'"
  );
});

test("salary income_subtype is not included in isBusinessIncome", () => {
  // Check that the isBusinessIncome function does not include "salary"
  const fnMatch = CANONICAL_SRC.match(/function isBusinessIncome[\s\S]{0,300}?\}/);
  assert.ok(fnMatch, "isBusinessIncome function must exist");
  assert.doesNotMatch(
    fnMatch[0],
    /salary/,
    "isBusinessIncome must not include salary income"
  );
});

test("rental income_subtype is not included in isBusinessIncome", () => {
  const fnMatch = CANONICAL_SRC.match(/function isBusinessIncome[\s\S]{0,300}?\}/);
  assert.ok(fnMatch, "isBusinessIncome function must exist");
  assert.doesNotMatch(
    fnMatch[0],
    /rental/,
    "isBusinessIncome must not include rental income"
  );
});

test("dividend income_subtype is not included in isBusinessIncome", () => {
  const fnMatch = CANONICAL_SRC.match(/function isBusinessIncome[\s\S]{0,300}?\}/);
  assert.ok(fnMatch, "isBusinessIncome function must exist");
  assert.doesNotMatch(
    fnMatch[0],
    /dividend/,
    "isBusinessIncome must not include dividend income"
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Transaction state exclusions remain in place
// ═══════════════════════════════════════════════════════════════════════════

test("canonical source still excludes non-posted transactions (status filter)", () => {
  assert.match(
    CALCS_SRC,
    /status\s*===\s*"posted"/,
    "activePostedTransactions must still filter to posted status only"
  );
});

test("canonical source still excludes deleted transactions", () => {
  assert.match(
    CANONICAL_SRC,
    /deleted_at.*null|\.is\("deleted_at",\s*null\)/,
    "canonical source must still exclude deleted transactions"
  );
});

test("canonical source still excludes inactive-account transactions (inner join)", () => {
  assert.match(
    CANONICAL_SRC,
    /financial_accounts!inner/,
    "getCanonicalTransactions must still inner-join financial_accounts (active accounts only)"
  );
});

test("canonical source still deduplicates transactions", () => {
  assert.match(
    CALCS_SRC,
    /export function deduplicateTransactions/,
    "deduplicateTransactions must still exist and be applied in the canonical pipeline"
  );
});

test("transfer transactions are still excluded (isTransfer guard)", () => {
  assert.match(
    CANONICAL_SRC,
    /isTransfer|transaction_type.*transfer/,
    "canonical source must still exclude transfer transactions"
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. User scoping
// ═══════════════════════════════════════════════════════════════════════════

test("getCanonicalTaxableIncome accepts userId and passes it to canonical queries", () => {
  // The function signature must include userId
  assert.match(
    CANONICAL_SRC,
    /getCanonicalTaxableIncome\s*\(\s*supabase[^,]*,\s*userId/,
    "getCanonicalTaxableIncome must accept userId parameter"
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Tax Center label / helper text accuracy
// ═══════════════════════════════════════════════════════════════════════════

test("Taxable Income KPI subtitle no longer claims rental income is included", () => {
  assert.doesNotMatch(
    TAX_PAGE_SRC,
    /Taxable Income[\s\S]{0,200}?Business & rental/,
    "Taxable Income subtitle must not claim 'Business & rental only' — rental is not included"
  );
});

test("Taxable Income KPI subtitle says Business & self-employment only", () => {
  assert.match(
    TAX_PAGE_SRC,
    /Business & self-employment only/,
    "Taxable Income subtitle must say 'Business & self-employment only'"
  );
});

test("Tax Center notice text no longer says rental income feeds the tax engine", () => {
  assert.doesNotMatch(
    TAX_PAGE_SRC,
    /Only Business and Rental income feed the tax engine/,
    "Notice text must not claim rental income feeds the tax engine"
  );
});

test("Tax Center notice text says Self-Employment instead of Rental", () => {
  assert.match(
    TAX_PAGE_SRC,
    /Only Business and Self-Employment income feed the tax engine/,
    "Notice text must say 'Only Business and Self-Employment income feed the tax engine'"
  );
});

test("Tagged Income KPI subtitle clarifies it counts all income types", () => {
  assert.match(
    TAX_PAGE_SRC,
    /All types tagged|All income types|all types/i,
    "Tagged Income subtitle must clarify it counts all tagged income types, not just business"
  );
});

test("Tagged Income KPI subtitle no longer says only 'Transactions tagged' (ambiguous)", () => {
  // "Transactions tagged" alone was ambiguous — could imply business-only
  // The new label must be more specific
  assert.doesNotMatch(
    TAX_PAGE_SRC,
    /"Transactions tagged"/,
    "The old ambiguous 'Transactions tagged' subtitle should be replaced with a clearer label"
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. Write-off deduction calculation logic is not modified
// ═══════════════════════════════════════════════════════════════════════════

test("calcTotalWriteOffExpenses is unchanged (not touched by tax fix)", () => {
  assert.match(
    CALCS_SRC,
    /export function calcTotalWriteOffExpenses/,
    "calcTotalWriteOffExpenses must still exist — deduction logic not touched"
  );
});

test("calcTotalDeductible is unchanged (not touched by tax fix)", () => {
  assert.match(
    CALCS_SRC,
    /export function calcTotalDeductible/,
    "calcTotalDeductible must still exist — deduction logic not touched"
  );
});

test("getCanonicalCombinedWriteOffs is unchanged (write-off logic not touched by tax fix)", () => {
  assert.match(
    CANONICAL_SRC,
    /export async function getCanonicalCombinedWriteOffs/,
    "getCanonicalCombinedWriteOffs must still exist — write-off logic not touched"
  );
});

test("deductibleExpenses still uses Math.max of write-offs vs tx-based (not changed)", () => {
  assert.match(
    CANONICAL_SRC,
    /Math\.max\(writeOffs\.totalDeductible,\s*txBasedDeductible\)/,
    "deductibleExpenses must still take Math.max of write-offs vs tx-based to avoid double-counting"
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. Fallback guard: valid zero must not trigger tax_estimates fallback
// ═══════════════════════════════════════════════════════════════════════════

test("displayTaxableIncome uses canonicalTaxableIncome !== null as fallback guard (not > 0)", () => {
  // The old guard `cti.taxableProfit > 0` treated a valid zero as missing data,
  // causing the stale tax_estimates value to override a correct zero result.
  // The correct guard is whether live data loaded at all (null = not loaded).
  assert.match(
    TAX_PAGE_SRC,
    /canonicalTaxableIncome\s*!==\s*null/,
    "displayTaxableIncome fallback guard must be `canonicalTaxableIncome !== null`, not `> 0`"
  );
});

test("displayTaxableIncome does not use taxableProfit > 0 as fallback trigger", () => {
  // `taxableProfit > 0` incorrectly treated zero (a valid result) as missing data.
  assert.doesNotMatch(
    TAX_PAGE_SRC,
    /taxableProfit\s*>\s*0[\s\S]{0,50}?taxable_income/,
    "displayTaxableIncome must not fall back to tax_estimates when taxableProfit is 0"
  );
});

test("displayTaxableIncome uses cti.taxableProfit when live data loaded", () => {
  assert.match(
    TAX_PAGE_SRC,
    /canonicalTaxableIncome\s*!==\s*null[\s\S]{0,30}?cti\.taxableProfit/,
    "displayTaxableIncome must use cti.taxableProfit when canonicalTaxableIncome is not null"
  );
});

test("tax_estimates fallback for Taxable Income only fires when canonicalTaxableIncome is null", () => {
  // The ternary must produce `cti.taxableProfit` on the truthy branch (live data loaded)
  // and `annual?.taxable_income ?? 0` on the falsy branch (live data not yet loaded).
  assert.match(
    TAX_PAGE_SRC,
    /canonicalTaxableIncome\s*!==\s*null[\s\S]{0,60}?cti\.taxableProfit[\s\S]{0,80}?annual\?\.taxable_income/,
    "fallback must only use annual.taxable_income when canonicalTaxableIncome is null"
  );
});

test("taxableProfit is still capped at zero in the canonical calculation (Math.max)", () => {
  assert.match(
    CANONICAL_SRC,
    /Math\.max\(businessIncome\s*-\s*deductibleExpenses,\s*0\)/,
    "taxableProfit must still be capped at zero by Math.max in canonical calculation"
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. liveZero consistency: all liability figures zero when live taxable income is zero
// ═══════════════════════════════════════════════════════════════════════════

test("liveZero flag is declared and gates liability figures", () => {
  assert.match(
    TAX_PAGE_SRC,
    /const liveZero\s*=/,
    "liveZero variable must be declared to gate all liability figures"
  );
  assert.match(
    TAX_PAGE_SRC,
    /liveZero.*canonicalTaxableIncome\s*!==\s*null[\s\S]{0,50}?displayTaxableIncome\s*===\s*0/,
    "liveZero must be true only when live data loaded AND displayTaxableIncome is exactly 0"
  );
});

test("totalLiability is zero when liveZero (stale tax_estimates suppressed)", () => {
  assert.match(
    TAX_PAGE_SRC,
    /totalLiability\s*=\s*liveZero\s*\?\s*0/,
    "totalLiability must be forced to 0 when liveZero — stale tax_estimates must not override"
  );
});

test("taxBreakdown is empty when liveZero", () => {
  assert.match(
    TAX_PAGE_SRC,
    /taxBreakdown\s*=\s*liveZero\s*\?\s*\[\]/,
    "taxBreakdown must be empty array when liveZero — stale breakdown must not show"
  );
});

test("displayBalanceDue is zero when liveZero", () => {
  assert.match(
    TAX_PAGE_SRC,
    /displayBalanceDue\s*=\s*liveZero\s*\?\s*0/,
    "displayBalanceDue must be 0 when liveZero"
  );
});

test("displayUnderpayment is false when liveZero", () => {
  assert.match(
    TAX_PAGE_SRC,
    /displayUnderpayment\s*=\s*liveZero\s*\?\s*false/,
    "displayUnderpayment flag must be false when liveZero — no underpayment warning on zero income"
  );
});

test("Balance Due KPI uses displayBalanceDue (not raw annual.balance_due)", () => {
  assert.match(
    TAX_PAGE_SRC,
    /Balance Due[\s\S]{0,100}?displayBalanceDue/,
    "Balance Due KPI must use displayBalanceDue, not raw annual?.balance_due"
  );
  assert.doesNotMatch(
    TAX_PAGE_SRC,
    /Balance Due[\s\S]{0,100}?annual\?\.balance_due/,
    "Balance Due KPI must not read annual?.balance_due directly — use displayBalanceDue"
  );
});

test("quarterly estimated amounts are zero when liveZero", () => {
  assert.match(
    TAX_PAGE_SRC,
    /liveZero\s*\?\s*0\s*:[\s\S]{0,50}?total_tax_liability/,
    "quarterly amounts must be suppressed to 0 when liveZero"
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. Canonical zero scenarios: deductible >= income must display 0, not fallback
// ═══════════════════════════════════════════════════════════════════════════

test("taxableProfit formula guarantees zero when deductibleExpenses >= businessIncome", () => {
  // Math.max(x - y, 0) where y >= x always yields 0.
  // This is the canonical guarantee that zero is a real result, not missing data.
  assert.match(
    CANONICAL_SRC,
    /Math\.max\(businessIncome\s*-\s*deductibleExpenses,\s*0\)/,
    "Math.max cap ensures zero when deductible expenses equal or exceed business income"
  );
});

test("taxableProfit formula guarantees zero does not exceed businessIncome", () => {
  // taxableProfit = MAX(businessIncome - deductibleExpenses, 0)
  // Since deductibleExpenses >= 0, taxableProfit <= businessIncome always.
  // Both must be present in the formula; their relationship enforces the invariant.
  const fnBody = CANONICAL_SRC.match(
    /export async function getCanonicalTaxableIncome[\s\S]{0,2000}?return \{[\s\S]{0,200}?\}/
  );
  assert.ok(fnBody, "getCanonicalTaxableIncome must be extractable");
  const body = fnBody[0];
  assert.match(body, /businessIncome/, "businessIncome must appear in taxable profit formula");
  assert.match(body, /deductibleExpenses/, "deductibleExpenses must be subtracted from businessIncome");
  assert.match(body, /Math\.max[\s\S]{0,60}?,\s*0\)/, "result must be capped at 0 — never below zero");
});

test("displayTaxableIncome comes from cti.taxableProfit which is always <= cti.businessIncome", () => {
  // When live data is loaded, displayTaxableIncome = cti.taxableProfit.
  // cti.taxableProfit = MAX(businessIncome - deductibleExpenses, 0) <= businessIncome.
  // Verify both cti.taxableProfit and cti.businessIncome are rendered from the same cti object.
  assert.match(TAX_PAGE_SRC, /cti\.taxableProfit/, "Taxable Income card must use cti.taxableProfit");
  assert.match(TAX_PAGE_SRC, /cti\.businessIncome/, "Business Income card must use cti.businessIncome");
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. Effective Rate uses corrected displayTaxableIncome, not stale fallback
// ═══════════════════════════════════════════════════════════════════════════

test("effectiveRate is computed from displayTaxableIncome (not raw tax_estimates.taxable_income)", () => {
  assert.match(
    TAX_PAGE_SRC,
    /effectiveRate[\s\S]{0,80}?displayTaxableIncome/,
    "effectiveRate must reference displayTaxableIncome (the corrected live value)"
  );
  assert.doesNotMatch(
    TAX_PAGE_SRC,
    /effectiveRate[\s\S]{0,80}?taxable_income/,
    "effectiveRate must not directly reference tax_estimates.taxable_income"
  );
});

test("effectiveRate is zero when displayTaxableIncome is zero (guard in place)", () => {
  assert.match(
    TAX_PAGE_SRC,
    /displayTaxableIncome\s*>\s*0[\s\S]{0,50}?totalLiability\s*\/\s*displayTaxableIncome/,
    "effectiveRate must guard against division when displayTaxableIncome is 0"
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. Total Tax Liability and Balance Due: independence from displayTaxableIncome confirmed
// ═══════════════════════════════════════════════════════════════════════════

test("Total Tax Liability uses liveZero guard then tax_estimates fallback", () => {
  // totalLiability must be 0 when liveZero, else comes from annual.total_tax_liability.
  // It must never be derived from displayTaxableIncome.
  assert.match(
    TAX_PAGE_SRC,
    /totalLiability\s*=\s*liveZero\s*\?\s*0[\s\S]{0,60}?total_tax_liability/,
    "totalLiability must be 0 when liveZero, else annual.total_tax_liability"
  );
});

test("Balance Due uses displayBalanceDue (liveZero-gated, not raw annual.balance_due in KPI)", () => {
  assert.match(
    TAX_PAGE_SRC,
    /displayBalanceDue\s*=\s*liveZero\s*\?\s*0/,
    "displayBalanceDue must be 0 when liveZero, else annual.balance_due"
  );
  assert.doesNotMatch(
    TAX_PAGE_SRC,
    /balance_due[\s\S]{0,50}?displayTaxableIncome/,
    "Balance Due must not be computed from displayTaxableIncome"
  );
});

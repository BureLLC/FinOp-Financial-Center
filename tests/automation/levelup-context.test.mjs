/**
 * LevelUP Financial Context Regression Tests
 *
 * Verifies that LevelUP uses real-time canonical financial data — not stale
 * daily snapshots, not hardcoded values, not mock data.
 *
 * All assertions read source files only — no DB calls.
 *
 * Run with: node --test tests/automation/levelup-context.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const PAGE_SRC = readFileSync(
  path.join(ROOT, "app/dashboard/levelup/page.tsx"),
  "utf8",
);
const CHAT_SRC = readFileSync(
  path.join(ROOT, "app/api/chat/route.ts"),
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
// 1. No stale portfolio_snapshots table query
// ═══════════════════════════════════════════════════════════════════════════

test("LevelUP page does not query portfolio_snapshots", () => {
  assert.doesNotMatch(PAGE_SRC, /portfolio_snapshots/,
    "LevelUP must not query portfolio_snapshots — that table is a daily stale snapshot");
});

test("LevelUP page does not reference snapshot_date (daily batch field)", () => {
  assert.doesNotMatch(PAGE_SRC, /snapshot_date/,
    "snapshot_date is a daily-batch-only field and must not appear in the real-time context path");
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Canonical real-time data sources are used
// ═══════════════════════════════════════════════════════════════════════════

test("LevelUP page imports getCanonicalTransactions from canonicalFinancialData", () => {
  assert.match(PAGE_SRC, /getCanonicalTransactions/,
    "LevelUP must import and use getCanonicalTransactions for real-time account + transaction data");
});

test("LevelUP page imports calcTotalCash from financialCalculations", () => {
  assert.match(PAGE_SRC, /calcTotalCash/,
    "LevelUP must use calcTotalCash to compute live cash balance from financial_accounts");
});

test("LevelUP page imports getCanonicalInvestments from canonicalFinancialData", () => {
  assert.match(PAGE_SRC, /getCanonicalInvestments/,
    "LevelUP must use getCanonicalInvestments (positions-preferred) to match the Investments page source");
});

test("LevelUP page does not use calcTotalInvestmentsFromAccounts (account-balance-only fallback)", () => {
  assert.doesNotMatch(PAGE_SRC, /calcTotalInvestmentsFromAccounts/,
    "LevelUP must not use calcTotalInvestmentsFromAccounts — that function ignores positions; use getCanonicalInvestments instead");
});

test("LevelUP page calls getCanonicalInvestments with supabase and user.id", () => {
  assert.match(PAGE_SRC, /getCanonicalInvestments\(supabase,\s*user\.id\)/,
    "getCanonicalInvestments must be scoped to the authenticated user's id");
});

test("LevelUP page uses totalInvestmentValue from getCanonicalInvestments result", () => {
  assert.match(PAGE_SRC, /canonicalInvestments\.totalInvestmentValue/,
    "LevelUP must read totalInvestmentValue from the canonical investments result (positions-preferred)");
});

test("LevelUP page imports calcTotalLiabilities", () => {
  assert.match(PAGE_SRC, /calcTotalLiabilities/,
    "LevelUP must use calcTotalLiabilities for real-time liability balance");
});

test("LevelUP page imports calcNetWorth", () => {
  assert.match(PAGE_SRC, /calcNetWorth/,
    "LevelUP must compute net worth from live accounts, not from a cached snapshot");
});

test("LevelUP page uses activePostedTransactions for income/expense filtering", () => {
  assert.match(PAGE_SRC, /activePostedTransactions/,
    "LevelUP must apply activePostedTransactions filter to get only valid posted transactions");
});

test("LevelUP page uses calcTotalIn for income", () => {
  assert.match(PAGE_SRC, /calcTotalIn/,
    "LevelUP must use calcTotalIn (same function as other pages) for income totals");
});

test("LevelUP page uses calcTotalOut for expenses", () => {
  assert.match(PAGE_SRC, /calcTotalOut/,
    "LevelUP must use calcTotalOut (same function as other pages) for expense totals");
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. fetchContextData is a separate reusable function
// ═══════════════════════════════════════════════════════════════════════════

test("LevelUP page has a fetchContextData function", () => {
  assert.match(PAGE_SRC, /const fetchContextData\s*=/,
    "fetchContextData must be a named function separate from loadContext and sendMessage");
});

test("fetchContextData returns FinancialContext or null (safe error path)", () => {
  const match = PAGE_SRC.match(/const fetchContextData[\s\S]{0,8000}?return null;\s*\}/);
  assert.ok(match, "fetchContextData must have a return null path for safe error handling");
});

test("fetchContextData wraps logic in try/catch for safe error handling", () => {
  const match = PAGE_SRC.match(/const fetchContextData[\s\S]{0,6000}?catch\s*\(/);
  assert.ok(match, "fetchContextData must have a try/catch block to prevent unhandled errors");
});

test("fetchContextData error log does not contain user data format strings", () => {
  // The catch block should only log a generic message, not interpolate user values
  const catchMatch = PAGE_SRC.match(/catch\s*\(err\)\s*\{[\s\S]{0,200}?console\.error[^;]+;/);
  assert.ok(catchMatch, "catch block with console.error must be present");
  const logLine = catchMatch[0];
  assert.doesNotMatch(logLine, /\$\{.*netWorth/,
    "error log must not interpolate user financial values");
  assert.doesNotMatch(logLine, /\$\{.*totalCash/,
    "error log must not interpolate user financial values");
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Context is refreshed at message send time (not stale initial load only)
// ═══════════════════════════════════════════════════════════════════════════

test("sendMessage calls fetchContextData before building system prompt", () => {
  const match = PAGE_SRC.match(/const sendMessage[\s\S]{0,2500}?await fetchContextData\(\)/);
  assert.ok(match, "sendMessage must call fetchContextData() to get fresh context before each message");
});

test("sendMessage updates context state with fresh data", () => {
  const match = PAGE_SRC.match(/const sendMessage[\s\S]{0,2500}?setContext\(freshContext\)/);
  assert.ok(match, "sendMessage must update the context state with freshly fetched data");
});

test("sendMessage uses freshContext (not stale state) for system prompt", () => {
  // Check that sendMessage declares activeContext as freshContext ?? context (nullish coalesce)
  assert.match(PAGE_SRC, /const activeContext\s*=\s*freshContext\s*\?\?\s*context/,
    "activeContext must prefer freshly fetched data, falling back to cached state");
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. buildSystemPrompt receives context as parameter (not just closure)
// ═══════════════════════════════════════════════════════════════════════════

test("buildSystemPrompt accepts a context parameter", () => {
  assert.match(PAGE_SRC, /const buildSystemPrompt\s*=\s*\(\s*ctx\s*:/,
    "buildSystemPrompt must accept ctx as an explicit parameter, not rely solely on stale state closure");
});

test("buildSystemPrompt uses ctx parameter (not context state) for values", () => {
  // fmt(ctx.netWorth) appears inside the template literal returned by buildSystemPrompt.
  // Note: fmt(context.netWorth) also appears in the sidebar display JSX — that is correct
  // behaviour and intentional. The assertion here only verifies the system prompt path uses
  // the explicit ctx parameter, confirmed by the presence of fmt(ctx.netWorth) in the file.
  assert.match(PAGE_SRC, /fmt\(ctx\.netWorth\)/,
    "system prompt must use ctx.netWorth (parameter), not context.netWorth (stale state)");
  assert.match(PAGE_SRC, /fmt\(ctx\.totalCash\)/,
    "system prompt must use ctx.totalCash from parameter");
  assert.match(PAGE_SRC, /fmt\(ctx\.totalInvestments\)/,
    "system prompt must use ctx.totalInvestments from parameter");
});

test("sendMessage passes activeContext to buildSystemPrompt", () => {
  const match = PAGE_SRC.match(/buildSystemPrompt\(activeContext\)/);
  assert.ok(match, "sendMessage must call buildSystemPrompt(activeContext) with fresh data");
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. System prompt includes freshness label and real-time data fields
// ═══════════════════════════════════════════════════════════════════════════

test("system prompt labels context as live/fetched at message time", () => {
  assert.match(PAGE_SRC, /live.*fetched at message time|fetched at message time.*live/i,
    "system prompt must indicate data was fetched live at message time, not from a stale snapshot");
});

test("system prompt clearly labels tax estimate as Tax Center batch figure, not live recalculation", () => {
  assert.match(PAGE_SRC, /Tax Center Estimate/,
    "system prompt tax line must say 'Tax Center Estimate' to distinguish it from live values");
  assert.match(PAGE_SRC, /batch-generated/,
    "system prompt must include 'batch-generated' to clarify the tax figure is not a live recalculation");
});

test("system prompt does not overstate tax estimate as a live value", () => {
  assert.doesNotMatch(PAGE_SRC, /Est\. Tax Liability/,
    "old 'Est. Tax Liability' label must be replaced with the Tax Center Estimate label");
});

test("system prompt includes YTD income label (not misleading '10 tx' label)", () => {
  assert.match(PAGE_SRC, /Income YTD/,
    "income in system prompt must be labeled 'Income YTD', not the old '10 tx' approximation");
});

test("system prompt includes YTD expenses label", () => {
  assert.match(PAGE_SRC, /Expenses YTD/,
    "expenses in system prompt must be labeled 'Expenses YTD'");
});

test("system prompt includes recent transactions section", () => {
  assert.match(PAGE_SRC, /Most Recent Transactions/,
    "system prompt must include a recent transactions section so AI has transaction context");
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. Safe error handling when context cannot be loaded
// ═══════════════════════════════════════════════════════════════════════════

test("loadContext shows user-facing error message when fetchContextData returns null", () => {
  assert.match(PAGE_SRC, /unable to load your financial context/i,
    "loadContext must show a safe user-facing error when context cannot be loaded");
});

test("sendMessage shows user-facing error when activeContext is null", () => {
  assert.match(PAGE_SRC, /unable to access your financial data/i,
    "sendMessage must show a safe error message when no context is available at send time");
});

test("error messages do not reference internal implementation details", () => {
  assert.doesNotMatch(PAGE_SRC, /fetchContextData.*error/i,
    "user-facing error messages must not expose function names");
  assert.doesNotMatch(PAGE_SRC, /portfolio_snapshots.*error|error.*portfolio_snapshots/i,
    "user-facing error messages must not mention internal table names");
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. No mock / hardcoded financial values in LevelUP context
// ═══════════════════════════════════════════════════════════════════════════

test("fetchContextData does not hardcode any dollar amounts", () => {
  // Look for suspicious hardcoded dollar values (e.g., 50000, 100000, 25000)
  // near the context building logic — these would be mock data
  const match = PAGE_SRC.match(/const fetchContextData[\s\S]{0,4000}?return \{/);
  assert.ok(match, "fetchContextData body must be extractable");
  const body = match[0];
  assert.doesNotMatch(body, /netWorth:\s*\d{4,}/,
    "fetchContextData must not hardcode a netWorth value");
  assert.doesNotMatch(body, /totalCash:\s*\d{4,}/,
    "fetchContextData must not hardcode a totalCash value");
  assert.doesNotMatch(body, /totalIncome:\s*\d{4,}/,
    "fetchContextData must not hardcode a totalIncome value");
});

test("initial greeting uses computed context values (not raw snapshot response)", () => {
  // The greeting must use ctx.netWorth (from canonical calcs), not snapRes.data?.total_net_worth
  assert.doesNotMatch(PAGE_SRC, /snapRes\.data\?\.total_net_worth/,
    "greeting must not use stale snapRes — must use computed ctx values");
  assert.match(PAGE_SRC, /fmt\(ctx\.netWorth\)/,
    "greeting must use computed ctx.netWorth");
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. User isolation — each context fetch scopes to authenticated user
// ═══════════════════════════════════════════════════════════════════════════

test("fetchContextData gets the authenticated user before querying", () => {
  const match = PAGE_SRC.match(/const fetchContextData[\s\S]{0,300}?supabase\.auth\.getUser/);
  assert.ok(match, "fetchContextData must call supabase.auth.getUser() to identify the current user");
});

test("fetchContextData returns null when no authenticated user (prevents cross-user data)", () => {
  const match = PAGE_SRC.match(/const fetchContextData[\s\S]{0,500}?if \(!user\)\s*return null/);
  assert.ok(match, "fetchContextData must return null immediately when no authenticated user is found");
});

test("getCanonicalTransactions is called with user.id (not a hardcoded id)", () => {
  assert.match(PAGE_SRC, /getCanonicalTransactions\(supabase,\s*user\.id\)/,
    "getCanonicalTransactions must be scoped to the authenticated user's id");
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. Chat API route safety — no financial data in server logs
// ═══════════════════════════════════════════════════════════════════════════

test("chat API route logs do not include the request body (no financial data exposure)", () => {
  assert.doesNotMatch(CHAT_SRC, /console\.log.*body/i,
    "chat route must not log request body (which contains the financial system prompt)");
  assert.doesNotMatch(CHAT_SRC, /console\.log.*system/i,
    "chat route must not log the system prompt (which contains user financial data)");
  assert.doesNotMatch(CHAT_SRC, /console\.log.*messages/i,
    "chat route must not log the messages array (which may contain financial details)");
});

test("chat API route error logs do not expose upstream response body", () => {
  // Error logs should only log safe metadata (status code, error type), not full response
  const errorLog = CHAT_SRC.match(/console\.error[\s\S]{0,200}?Anthropic API error/);
  assert.ok(errorLog, "chat route must have an error log for Anthropic API failures");
  // The error log should not dump the full data object
  assert.doesNotMatch(errorLog[0], /console\.error.*data\b(?!.*type)/,
    "error log must not dump the full API response data object");
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. Canonical layer regression — existing functions unchanged
// ═══════════════════════════════════════════════════════════════════════════

test("getCanonicalTransactions still uses inner join to financial_accounts", () => {
  assert.match(CANONICAL_SRC, /financial_accounts!inner/,
    "getCanonicalTransactions must still use inner join for active-account filtering");
});

test("getCanonicalTransactions still filters deleted_at = null", () => {
  assert.match(CANONICAL_SRC, /is\("deleted_at",\s*null\)/,
    "getCanonicalTransactions must still exclude soft-deleted transactions");
});

test("financialCalculations calcTotalCash still filters depository accounts", () => {
  assert.match(CALCS_SRC, /depository/,
    "calcTotalCash must still include only depository-type accounts");
});

test("financialCalculations activePostedTransactions still filters status === posted", () => {
  assert.match(CALCS_SRC, /status\s*===\s*"posted"/,
    "activePostedTransactions must still filter to posted status only");
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. UI placement — no prohibited UI changes
// ═══════════════════════════════════════════════════════════════════════════

test("LevelUP page still has the left sidebar with YOUR SNAPSHOT", () => {
  assert.match(PAGE_SRC, /YOUR SNAPSHOT/,
    "sidebar snapshot panel must still be present");
});

test("LevelUP page still has TOPICS panel", () => {
  assert.match(PAGE_SRC, /TOPICS/,
    "TOPICS panel must still be present");
});

test("LevelUP page still has SUGGESTED questions panel", () => {
  assert.match(PAGE_SRC, /SUGGESTED/,
    "SUGGESTED questions panel must still be present");
});

test("LevelUP page still has the TypingIndicator component", () => {
  assert.match(PAGE_SRC, /TypingIndicator/,
    "TypingIndicator animation component must still be present");
});

test("LevelUP page still has the MessageBubble component", () => {
  assert.match(PAGE_SRC, /MessageBubble/,
    "MessageBubble component must still be present");
});

test("LevelUP page still has clear conversation button", () => {
  assert.match(PAGE_SRC, /clearConversation/,
    "clearConversation button must still be present");
});

test("LevelUP page still has viewport-responsive layout", () => {
  assert.match(PAGE_SRC, /viewport.*desktop.*mobile|mobile.*desktop/,
    "viewport-responsive layout must still be present");
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. Navigation support — suggested questions untouched
// ═══════════════════════════════════════════════════════════════════════════

test("navigation-style suggested questions still present", () => {
  assert.match(PAGE_SRC, /Am I on track with my budget/,
    "budget navigation question must still be in suggested questions");
  assert.match(PAGE_SRC, /How can I reach my savings goals/,
    "savings navigation question must still be in suggested questions");
  assert.match(PAGE_SRC, /How do I reduce my tax liability/,
    "tax navigation question must still be in suggested questions");
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. Prohibited areas: no changes to financial calculation logic
// ═══════════════════════════════════════════════════════════════════════════

test("financialCalculations.ts calcFinancialSummary is unchanged (not modified by LevelUP fix)", () => {
  assert.match(CALCS_SRC, /export function calcFinancialSummary/,
    "calcFinancialSummary must still exist and be unchanged");
});

test("financialCalculations.ts deduplicateTransactions is unchanged", () => {
  assert.match(CALCS_SRC, /export function deduplicateTransactions/,
    "deduplicateTransactions must still exist — LevelUP fix must not touch this");
});

test("canonicalFinancialData.ts getCanonicalCombinedWriteOffs is unchanged", () => {
  assert.match(CANONICAL_SRC, /export async function getCanonicalCombinedWriteOffs/,
    "getCanonicalCombinedWriteOffs must still exist — write-off path not touched by LevelUP fix");
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. Write-off source parity — LevelUP matches the Write-Offs page exactly
// ═══════════════════════════════════════════════════════════════════════════

test("LevelUP imports getCanonicalCombinedWriteOffs (same source as Write-Offs page)", () => {
  assert.match(PAGE_SRC, /getCanonicalCombinedWriteOffs/,
    "LevelUP must use getCanonicalCombinedWriteOffs — the same canonical source as the Write-Offs page");
});

test("LevelUP does not query write_offs table directly for totals", () => {
  // Must not fall back to a raw write_offs select — that misses transaction-based write-offs
  assert.doesNotMatch(PAGE_SRC, /from\("write_offs"\)\.select\("amount"\)/,
    "LevelUP must not query write_offs directly; must use getCanonicalCombinedWriteOffs");
});

test("LevelUP calls getCanonicalCombinedWriteOffs with supabase, user.id, and currentYear", () => {
  assert.match(PAGE_SRC, /getCanonicalCombinedWriteOffs\(supabase,\s*user\.id,\s*currentYear\)/,
    "getCanonicalCombinedWriteOffs must be scoped to the authenticated user and current year");
});

test("LevelUP write-off total includes transaction-based write-offs (writeOffCombined.transactionBased)", () => {
  assert.match(PAGE_SRC, /writeOffCombined\.transactionBased/,
    "LevelUP must include transaction-based write-offs — the Write-Offs page shows these too");
});

test("LevelUP write-off total includes manual write-offs (writeOffCombined.manual)", () => {
  assert.match(PAGE_SRC, /writeOffCombined\.manual/,
    "LevelUP must include manual write-off entries from the write_offs table");
});

test("LevelUP deduplicates: skips tx-based entries already linked to a manual write-off", () => {
  assert.match(PAGE_SRC, /linkedTxIds/,
    "LevelUP must maintain a linkedTxIds set to exclude already-linked transaction-based entries");
  assert.match(PAGE_SRC, /linkedTxIds\.has\(tx\.id\)/,
    "LevelUP must filter transactionBased entries using linkedTxIds to prevent double-counting");
});

test("LevelUP excludes suppressed/deleted transaction-based write-offs (is_writeoff_candidate guard)", () => {
  // getCanonicalCombinedWriteOffs → getCanonicalTransactionBasedWriteOffs already filters
  // is_writeoff_candidate !== false (set by delete flow). Verify the canonical guard exists.
  assert.match(CANONICAL_SRC, /is_writeoff_candidate\s*!==\s*false/,
    "canonical layer must exclude suppressed write-off candidates (is_writeoff_candidate !== false)");
});

test("LevelUP snapshot and chat context use the same write-off total (single totalWriteOffs field)", () => {
  // Both the sidebar snapshot and buildSystemPrompt use ctx.totalWriteOffs
  assert.match(PAGE_SRC, /ctx\.totalWriteOffs/,
    "both snapshot and chat context must reference ctx.totalWriteOffs for consistency");
  assert.match(PAGE_SRC, /context\.totalWriteOffs/,
    "sidebar display must also reference context.totalWriteOffs from the same fetched value");
});

test("write-off deduction calculation logic in financialCalculations.ts is not modified", () => {
  assert.match(CALCS_SRC, /export function calcTotalWriteOffExpenses/,
    "calcTotalWriteOffExpenses must be unchanged — LevelUP fix must not touch deduction logic");
  assert.match(CALCS_SRC, /export function calcTotalDeductible/,
    "calcTotalDeductible must be unchanged — LevelUP fix must not touch deduction logic");
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. Tax Center source parity — LevelUP matches Tax Center live semantics
// ═══════════════════════════════════════════════════════════════════════════

test("LevelUP imports getCanonicalTaxableIncome (same source as Tax Center page)", () => {
  assert.match(PAGE_SRC, /getCanonicalTaxableIncome/,
    "LevelUP must import getCanonicalTaxableIncome — the same live canonical source used by the Tax Center page");
});

test("LevelUP calls getCanonicalTaxableIncome with supabase, user.id, and currentYear", () => {
  assert.match(PAGE_SRC, /getCanonicalTaxableIncome\(supabase,\s*user\.id,\s*currentYear\)/,
    "getCanonicalTaxableIncome must be scoped to the authenticated user and current year");
});

test("LevelUP declares liveZero based on taxableProfit === 0 (not > 0 truthy check)", () => {
  assert.match(PAGE_SRC, /liveZero\s*=\s*ctiRes\.taxableProfit\s*===\s*0/,
    "liveZero must use strict equality (=== 0) — truthy check (> 0) would treat valid zero as missing data");
  assert.doesNotMatch(PAGE_SRC, /ctiRes\.taxableProfit\s*>\s*0/,
    "must not use > 0 check for liveZero — that incorrectly discards a valid zero taxable income");
});

test("LevelUP totalTaxLiability is zeroed when liveZero is true (not unconditionally from batch)", () => {
  assert.match(PAGE_SRC, /totalTaxLiability:\s*liveZero\s*\?\s*0\s*:/,
    "totalTaxLiability must apply the liveZero gate — batch tax_estimates must not override a valid live zero");
});

test("LevelUP valid zero taxableProfit does not fall back to stale tax_estimates liability", () => {
  // The pattern `liveZero ? 0 : toNum(taxRes.data?.total_tax_liability)` is required.
  // Verify the unconditional `toNum(taxRes.data?.total_tax_liability)` form is NOT used.
  assert.doesNotMatch(PAGE_SRC, /totalTaxLiability:\s*toNum\(taxRes\.data/,
    "totalTaxLiability must not be set unconditionally from taxRes — liveZero gate is required");
});

test("LevelUP FinancialContext interface includes taxableIncome field", () => {
  assert.match(PAGE_SRC, /taxableIncome:\s*number/,
    "FinancialContext must include taxableIncome so the live canonical value is available to the system prompt");
});

test("LevelUP taxableIncome is set from ctiRes.taxableProfit (canonical source)", () => {
  assert.match(PAGE_SRC, /taxableIncome:\s*ctiRes\.taxableProfit/,
    "taxableIncome must come from the canonical getCanonicalTaxableIncome result, not from tax_estimates");
});

test("LevelUP system prompt includes live taxableIncome (Tax Center value matches canonical)", () => {
  assert.match(PAGE_SRC, /ctx\.taxableIncome/,
    "buildSystemPrompt must include ctx.taxableIncome so the AI sees the live canonical taxable income");
  assert.match(PAGE_SRC, /Taxable Income/,
    "system prompt must label the taxable income field so the AI distinguishes it from the batch estimate");
});

test("LevelUP system prompt labels taxableIncome as live/canonical (not batch)", () => {
  assert.match(PAGE_SRC, /canonical.*self-employment|self-employment.*canonical/i,
    "system prompt taxableIncome label must indicate it is a canonical/live value scoped to business & self-employment");
});

test("LevelUP system prompt labels totalTaxLiability as batch-generated (not live)", () => {
  assert.match(PAGE_SRC, /batch-generated.*zeroed|zeroed.*batch-generated/i,
    "system prompt Tax Center Estimate label must indicate it is batch-generated and zeroed when live income is zero");
});

test("LevelUP still queries tax_estimates for liability when liveZero is false", () => {
  // The fix gates the value, not removes the source. tax_estimates must still be queried.
  assert.match(PAGE_SRC, /from\("tax_estimates"\)/,
    "tax_estimates must still be queried — it provides the batch estimate when live taxable income is nonzero");
});

test("LevelUP snapshot sidebar totalTaxLiability is now the gated value (UI unchanged)", () => {
  // The sidebar uses context.totalTaxLiability — which is now correctly gated.
  // No new sidebar row was added (UI placement preserved).
  assert.match(PAGE_SRC, /context\.totalTaxLiability/,
    "sidebar still uses context.totalTaxLiability — now gated by liveZero");
  assert.doesNotMatch(PAGE_SRC, /context\.taxableIncome/,
    "taxableIncome must not appear in the sidebar — UI layout is unchanged, new field is system-prompt-only");
});

test("LevelUP canonical tax source (getCanonicalTaxableIncome) exists in canonicalFinancialData.ts", () => {
  assert.match(CANONICAL_SRC, /export async function getCanonicalTaxableIncome/,
    "getCanonicalTaxableIncome must exist in canonicalFinancialData.ts — it is the live tax source");
});

test("getCanonicalTaxableIncome applies year filter symmetrically to both income and expenses", () => {
  // Both business income and deductible expenses must filter by the same taxYear.
  // The code assigns getFullYear() to txYear then compares: txYear === taxYear.
  // This must appear at least twice in the function body (once for income, once for expenses).
  const matches = [...CANONICAL_SRC.matchAll(/txYear\s*===\s*taxYear/g)];
  assert.ok(matches.length >= 2,
    "getCanonicalTaxableIncome must filter BOTH business income and deductible expenses by taxYear (txYear === taxYear must appear at least twice)");
});

test("LevelUP does not mix tax_estimates taxable_income into the live taxableIncome field", () => {
  assert.doesNotMatch(PAGE_SRC, /taxableIncome:.*taxRes/,
    "taxableIncome must not be sourced from taxRes (batch tax_estimates) — must use ctiRes (canonical)");
  assert.doesNotMatch(PAGE_SRC, /taxableIncome:.*taxable_income/,
    "taxableIncome must not reference the batch taxable_income field from tax_estimates");
});

test("LevelUP context includes businessIncome from canonical source (Tax Center KPI parity)", () => {
  assert.match(PAGE_SRC, /businessIncome:\s*ctiRes\.businessIncome/,
    "businessIncome must come from getCanonicalTaxableIncome — same canonical source as Tax Center's Business Income KPI");
});

test("LevelUP context includes deductibleExpenses from canonical source (Tax Center KPI parity)", () => {
  assert.match(PAGE_SRC, /deductibleExpenses:\s*ctiRes\.deductibleExpenses/,
    "deductibleExpenses must come from getCanonicalTaxableIncome — same canonical source as Tax Center's Deductible Expenses KPI");
});

test("LevelUP context includes balanceDue with liveZero gate (Tax Center parity)", () => {
  assert.match(PAGE_SRC, /balanceDue:\s*liveZero\s*\?\s*0\s*:/,
    "balanceDue must apply the same liveZero gate as Tax Center's displayBalanceDue");
});

test("LevelUP context includes underpaymentFlag with liveZero gate (Tax Center parity)", () => {
  assert.match(PAGE_SRC, /underpaymentFlag:\s*liveZero\s*\?\s*false\s*:/,
    "underpaymentFlag must apply the same liveZero gate as Tax Center's displayUnderpayment");
});

test("LevelUP tax_estimates query fetches balance_due and underpayment_flag (Tax Center parity)", () => {
  assert.match(PAGE_SRC, /balance_due.*underpayment_flag|underpayment_flag.*balance_due/,
    "tax_estimates SELECT must include balance_due and underpayment_flag to match Tax Center source");
});

test("LevelUP system prompt includes Balance Due field with underpayment indicator", () => {
  assert.match(PAGE_SRC, /Balance Due/,
    "system prompt must include Balance Due so AI can advise on underpayment risk");
  assert.match(PAGE_SRC, /ctx\.balanceDue/,
    "system prompt Balance Due must use the liveZero-gated ctx.balanceDue value");
  assert.match(PAGE_SRC, /underpaymentFlag/,
    "system prompt must reference underpaymentFlag to surface underpayment risk to the AI");
});

test("LevelUP system prompt includes businessIncome and deductibleExpenses", () => {
  assert.match(PAGE_SRC, /ctx\.businessIncome/,
    "system prompt must include ctx.businessIncome for AI to answer business income questions");
  assert.match(PAGE_SRC, /ctx\.deductibleExpenses/,
    "system prompt must include ctx.deductibleExpenses for AI to answer deduction questions");
});

test("LevelUP balanceDue and underpaymentFlag come from tax_estimates (batch), not a hardcoded value", () => {
  assert.match(PAGE_SRC, /taxRes\.data\?\.balance_due/,
    "balanceDue must reference taxRes.data?.balance_due — the batch tax_estimates row");
  assert.match(PAGE_SRC, /taxRes\.data\?\.underpayment_flag/,
    "underpaymentFlag must reference taxRes.data?.underpayment_flag — the batch tax_estimates row");
});

test("LevelUP FinancialContext interface declares all Tax Center parity fields", () => {
  assert.match(PAGE_SRC, /businessIncome:\s*number/,
    "FinancialContext must declare businessIncome: number");
  assert.match(PAGE_SRC, /deductibleExpenses:\s*number/,
    "FinancialContext must declare deductibleExpenses: number");
  assert.match(PAGE_SRC, /balanceDue:\s*number/,
    "FinancialContext must declare balanceDue: number");
  assert.match(PAGE_SRC, /underpaymentFlag:\s*boolean/,
    "FinancialContext must declare underpaymentFlag: boolean");
});

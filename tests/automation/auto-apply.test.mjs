/**
 * Auto-apply structural tests.
 *
 * Verifies that category auto-apply, income auto-apply, and write-offs
 * Verify/Edit/Delete fixes are correctly implemented in source files.
 * No database connection required.
 *
 * Run with: node --test tests/automation/auto-apply.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Category auto-apply: suggestionEngine.ts
// ═══════════════════════════════════════════════════════════════════════════════

test("suggestionEngine exports autoApplyRule function", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  assert.match(src, /export async function autoApplyRule/, "autoApplyRule must be exported");
});

test("autoApplyRule directly updates matching transactions (does not insert suggestions)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  assert.ok(fnStart !== -1, "autoApplyRule must exist");
  const fnBody = src.slice(fnStart);
  assert.match(fnBody, /\.from\("transactions"\)/, "Must query transactions table");
  assert.match(fnBody, /\.update\(/, "Must update matching transactions");
  assert.match(fnBody, /automation_audit_log/, "Must write audit log entries for each auto-applied transaction");
  assert.doesNotMatch(fnBody, /automation_suggestions.*insert|insert.*automation_suggestions/s, "Must not insert automation_suggestions — auto-apply bypasses suggestion queue");
});

test("autoApplyRule enforces direction=debit guard", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  assert.match(fnBody, /eq\("direction",\s*"debit"\)/, "Must filter to debit transactions only");
});

test("autoApplyRule enforces category IS NULL guard (only categorizes uncategorized transactions)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  assert.match(fnBody, /is\("category",\s*null\)/, "Must filter to uncategorized transactions");
});

test("autoApplyRule uses is(category, null) guard on UPDATE to prevent race conditions", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  // The UPDATE itself must have the is(category, null) guard
  const updateIdx = fnBody.indexOf(".update(");
  const guardAfterUpdate = fnBody.slice(updateIdx).indexOf('.is("category", null)');
  assert.ok(guardAfterUpdate !== -1, "UPDATE statement must include .is('category', null) guard");
});

test("autoApplyRule uses triggered_by: user_manual in audit log entries", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  assert.match(fnBody, /triggered_by.*user_manual|user_manual.*triggered_by/s, "Audit entries must use triggered_by: user_manual");
});

test("autoApplyRule uses action_taken: set_category in audit log entries", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  assert.match(fnBody, /action_taken.*set_category|set_category.*action_taken/s, "Audit entries must use action_taken: set_category");
});

test("autoApplyRule enforces SENSITIVE_CATEGORIES guard", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart, src.indexOf("export async function", fnStart + 1));
  assert.match(fnBody, /SENSITIVE_CATEGORIES/, "autoApplyRule must check SENSITIVE_CATEGORIES and return 0 for sensitive categories");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Category auto-apply: categorize route
// ═══════════════════════════════════════════════════════════════════════════════

test("categorize route imports autoApplyRule not generateAndStoreSuggestions", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/categorize/route.ts"),
    "utf8",
  );
  assert.match(src, /import.*autoApplyRule/, "Must import autoApplyRule");
  assert.doesNotMatch(src, /import.*generateAndStoreSuggestions/, "Must not import generateAndStoreSuggestions");
});

test("categorize route returns autoApplied not suggestionsCreated", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/categorize/route.ts"),
    "utf8",
  );
  assert.match(src, /autoApplied/, "Response must include autoApplied count");
  assert.doesNotMatch(src, /suggestionsCreated/, "Must not return suggestionsCreated");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Income auto-apply: tag-income route
// ═══════════════════════════════════════════════════════════════════════════════

test("tag-income route exists", () => {
  const p = path.join(ROOT, "app/api/automation/transactions/[id]/tag-income/route.ts");
  assert.ok(existsSync(p), "tag-income route must exist");
});

test("tag-income route requires authentication", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/tag-income/route.ts"),
    "utf8",
  );
  assert.match(src, /Unauthorized.*401/s, "Must return 401 when unauthenticated");
});

test("tag-income route verifies ownership via financial_accounts join", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/tag-income/route.ts"),
    "utf8",
  );
  assert.match(src, /financial_accounts!inner/, "Must use !inner join for ownership check");
  assert.match(src, /403/, "Must return 403 on ownership mismatch");
});

test("tag-income route only targets credit transactions in auto-apply", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/tag-income/route.ts"),
    "utf8",
  );
  const updateIdx = src.indexOf(".update(");
  // The second .update() (for auto-apply) must have direction=credit guard
  const secondUpdateIdx = src.indexOf(".update(", updateIdx + 1);
  const afterSecondUpdate = src.slice(secondUpdateIdx);
  assert.match(afterSecondUpdate, /eq\("direction",\s*"credit"\)/, "Auto-apply query must filter to direction=credit");
});

test("tag-income route only writes income_subtype and transaction_type", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/tag-income/route.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /\.update\([^)]*category[^)]*\)/, "Must not write category");
  assert.doesNotMatch(src, /\.update\([^)]*direction/, "Must not write direction");
  assert.doesNotMatch(src, /\.update\([^)]*amount/, "Must not write amount");
  assert.doesNotMatch(src, /\.update\([^)]*deleted_at/, "Must not write deleted_at");
});

test("tag-income route returns autoApplied count", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/tag-income/route.ts"),
    "utf8",
  );
  assert.match(src, /autoApplied/, "Must return autoApplied count");
});

test("tag-income route does not touch debit transactions in auto-apply", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/tag-income/route.ts"),
    "utf8",
  );
  // Verify the auto-apply explicitly guards direction=credit so debits are untouched
  assert.match(src, /eq\("direction",\s*"credit"\)/, "Auto-apply must be scoped to credit direction only");
  assert.doesNotMatch(src, /eq\("direction",\s*"debit"\)/, "Must not touch debit transactions");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Income auto-apply: income page
// ═══════════════════════════════════════════════════════════════════════════════

test("income page saveTag calls tag-income route instead of direct Supabase write", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/income/page.tsx"), "utf8");
  assert.match(src, /tag-income/, "saveTag must call the tag-income API route");
  assert.doesNotMatch(
    src,
    /\.from\("transactions"\).*\.update\(\s*\{[^}]*income_subtype/s,
    "saveTag must not directly update income_subtype on the transactions table"
  );
});

test("income page saveTag surfaces API errors to the user", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/income/page.tsx"), "utf8");
  assert.match(src, /!res\.ok/, "saveTag must check res.ok before assuming success");
  assert.match(src, /setPanelMsg/, "saveTag must show error message via setPanelMsg");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Transactions page: income auto-apply direction fix
// ═══════════════════════════════════════════════════════════════════════════════

test("transactions page routes credit income changes through tag-income API, not direct Supabase", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/transactions/page.tsx"), "utf8");
  assert.match(src, /tag-income/, "saveChanges must call the tag-income route for credit income changes");
  // income_subtype must not appear in any direct .update() payload — routed through tag-income
  assert.doesNotMatch(
    src,
    /\.update\s*\(\s*\{[^}]*income_subtype/s,
    "saveChanges must not directly write income_subtype — must route through tag-income"
  );
});

test("transactions page saveChanges uses autoApplied not suggestionsCreated", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/transactions/page.tsx"), "utf8");
  const saveFnIdx = src.indexOf("const saveChanges = async");
  const saveFnBody = src.slice(saveFnIdx, saveFnIdx + 2500);
  assert.match(saveFnBody, /autoApplied/, "saveChanges must use autoApplied count");
  assert.doesNotMatch(saveFnBody, /suggestionsCreated/, "saveChanges must not reference suggestionsCreated");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Write-offs Verify/Edit/Delete fix: mark-writeoff-candidate route
// ═══════════════════════════════════════════════════════════════════════════════

test("mark-writeoff-candidate route upserts write_offs row", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(src, /from\(["']write_offs["']\)/, "Route must reference write_offs table");
  assert.match(src, /\.insert\(/, "Route must insert a write_offs row");
});

test("mark-writeoff-candidate route checks for existing write_offs row before inserting (idempotent)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(
    src,
    /existingWoRows|existing.*write_offs|write_offs.*existing/s,
    "Route must check for existing write_offs row before inserting to prevent duplicates"
  );
});

test("mark-writeoff-candidate route write_offs insert links by transaction_id", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(src, /transaction_id\s*:\s*transactionId/, "write_offs row must be linked to transactionId");
});

test("mark-writeoff-candidate route does not update Tax Center or financial calculations", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /financialCalculations/, "Must not import financialCalculations");
  assert.doesNotMatch(src, /canonicalFinancialData/, "Must not import canonicalFinancialData");
  assert.doesNotMatch(src, /tax_center|taxCenter/i, "Must not reference Tax Center");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Write-offs Verify/Edit/Delete fix: write-offs page
// ═══════════════════════════════════════════════════════════════════════════════

test("write-offs page has ensureWriteOffRow helper", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/write-offs/page.tsx"), "utf8");
  assert.match(src, /ensureWriteOffRow/, "ensureWriteOffRow helper must exist");
});

test("ensureWriteOffRow calls API route instead of inline Supabase writes", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/write-offs/page.tsx"), "utf8");
  const fnStart = src.indexOf("const ensureWriteOffRow");
  assert.ok(fnStart !== -1, "ensureWriteOffRow must be defined");
  const fnBody = src.slice(fnStart, fnStart + 800);
  assert.match(fnBody, /transaction_id/, "Must pass transaction_id to API");
  assert.match(fnBody, /\/api\/write-offs\/ensure-row/, "Must call the ensure-row API route");
  assert.doesNotMatch(fnBody, /supabase\.auth\.getUser/, "Must not call getUser client-side");
  assert.doesNotMatch(fnBody, /\.from\("write_offs"\)/, "Client function must not query write_offs directly");
});

test("write-offs page saveEdit calls ensureWriteOffRow before update", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/write-offs/page.tsx"), "utf8");
  const saveEditIdx = src.indexOf("const saveEdit = async");
  assert.ok(saveEditIdx !== -1, "saveEdit must exist");
  const saveEditBody = src.slice(saveEditIdx, saveEditIdx + 800);
  assert.match(saveEditBody, /ensureWriteOffRow/, "saveEdit must call ensureWriteOffRow");
  assert.match(saveEditBody, /writeOffId/, "saveEdit must use the returned writeOffId");
});

test("write-offs page toggleVerified calls ensureWriteOffRow before update", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/write-offs/page.tsx"), "utf8");
  const fnIdx = src.indexOf("const toggleVerified = async");
  assert.ok(fnIdx !== -1, "toggleVerified must exist");
  const fnBody = src.slice(fnIdx, fnIdx + 400);
  assert.match(fnBody, /ensureWriteOffRow/, "toggleVerified must call ensureWriteOffRow");
  assert.match(fnBody, /writeOffId/, "toggleVerified must use the returned writeOffId");
});

test("write-offs page deleteWriteOff handles transaction-based entries by clearing is_writeoff_candidate", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/write-offs/page.tsx"), "utf8");
  const fnIdx = src.indexOf("const deleteWriteOff = async");
  assert.ok(fnIdx !== -1, "deleteWriteOff must exist");
  const fnBody = src.slice(fnIdx, fnIdx + 800);
  // Accept false or null — false is preferred because it enables explicit exclusion
  assert.match(fnBody, /is_writeoff_candidate.*(?:false|null)|(?:false|null).*is_writeoff_candidate/s,
    "deleteWriteOff must set is_writeoff_candidate on the transaction for transaction-based entries");
  assert.match(fnBody, /\.from\("transactions"\)/, "Must update transactions table for transaction-based entries");
});

test("write-offs page deleteWriteOff does not delete from write_offs for transaction-based entries", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/write-offs/page.tsx"), "utf8");
  const fnIdx = src.indexOf("const deleteWriteOff = async");
  const fnBody = src.slice(fnIdx, fnIdx + 800);
  // For transaction-based entries (wo.id === wo.transaction_id), the function returns early
  // without deleting from write_offs — it only clears the candidacy flag
  assert.match(fnBody, /return/, "Transaction-based delete path must return early");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Automation page copy: reflects auto-apply behavior
// ═══════════════════════════════════════════════════════════════════════════════

test("automation page copy no longer says nothing is applied automatically", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/automation/page.tsx"), "utf8");
  assert.doesNotMatch(
    src,
    /nothing is applied automatically/,
    "Automation page must not say 'nothing is applied automatically' — auto-apply is now active"
  );
});

test("automation page copy mentions automatic categorization", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/automation/page.tsx"), "utf8");
  assert.match(
    src,
    /automatically categori/i,
    "Automation page must reflect that matching transactions are automatically categorized"
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Financial isolation: no Tax Center, Write-Off deduction, or sync changes
// ═══════════════════════════════════════════════════════════════════════════════

test("tag-income route does not touch financialCalculations or canonicalFinancialData", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/tag-income/route.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /financialCalculations/, "Must not import financialCalculations");
  assert.doesNotMatch(src, /canonicalFinancialData/, "Must not import canonicalFinancialData");
  assert.doesNotMatch(src, /getCanonicalTaxableIncome/, "Must not reference Tax Center income calculations");
});

test("suggestionEngine autoApplyRule does not write is_business_candidate or is_writeoff_candidate", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  assert.doesNotMatch(fnBody, /is_business_candidate/, "autoApplyRule must not write is_business_candidate");
  assert.doesNotMatch(fnBody, /is_writeoff_candidate/, "autoApplyRule must not write is_writeoff_candidate");
});

test("autoApplyRule does not write amount, direction, transaction_date, or financial fields", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  const updateIdx = fnBody.indexOf(".update(");
  const updatePayload = fnBody.slice(updateIdx, fnBody.indexOf(")", updateIdx + 100));
  assert.doesNotMatch(updatePayload, /\bamount\b/, "autoApplyRule transaction UPDATE must not write amount");
  assert.doesNotMatch(updatePayload, /\bdirection\b/, "autoApplyRule transaction UPDATE must not write direction");
  assert.doesNotMatch(updatePayload, /\btransaction_date\b/, "autoApplyRule transaction UPDATE must not write transaction_date");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. Session 2 hardening: migration 006, ensure-row route, write-offs page fixes
// ═══════════════════════════════════════════════════════════════════════════════

test("migration 006 exists (harden automation suggestion RPCs)", () => {
  const p = path.join(ROOT, "supabase/migrations/20260506000006_harden_automation_suggestion_rpcs.sql");
  assert.ok(existsSync(p), "Migration 006 must exist");
});

test("migration 006 adds SET search_path = public to apply_automation_suggestion", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000006_harden_automation_suggestion_rpcs.sql"),
    "utf8",
  );
  assert.match(sql, /apply_automation_suggestion/, "Must define apply_automation_suggestion");
  assert.match(sql, /SET search_path = public/, "Must include SET search_path = public");
});

test("migration 006 adds SET search_path = public to undo_automation_suggestion", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000006_harden_automation_suggestion_rpcs.sql"),
    "utf8",
  );
  assert.match(sql, /undo_automation_suggestion/, "Must define undo_automation_suggestion");
  // Both functions are in the same file; two occurrences of SET search_path
  const occurrences = (sql.match(/SET search_path = public/g) ?? []).length;
  assert.ok(occurrences >= 2, "Both RPCs must have SET search_path = public");
});

test("migration 006 grants EXECUTE to authenticated for both RPCs", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000006_harden_automation_suggestion_rpcs.sql"),
    "utf8",
  );
  assert.match(
    sql,
    /GRANT EXECUTE ON FUNCTION public\.apply_automation_suggestion\(uuid.*\) TO authenticated/i,
    "Must GRANT EXECUTE on apply_automation_suggestion",
  );
  assert.match(
    sql,
    /GRANT EXECUTE ON FUNCTION public\.undo_automation_suggestion\(uuid.*\) TO authenticated/i,
    "Must GRANT EXECUTE on undo_automation_suggestion",
  );
});

test("migration 006 uses schema-qualified table references (public.*)", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000006_harden_automation_suggestion_rpcs.sql"),
    "utf8",
  );
  assert.match(sql, /FROM public\.automation_suggestions/, "Must use public.automation_suggestions");
  assert.match(sql, /FROM public\.transactions/, "Must use public.transactions");
  assert.match(sql, /UPDATE public\.transactions/, "Must use public.transactions in UPDATE");
  assert.match(sql, /INSERT INTO public\.automation_audit_log/, "Must use public.automation_audit_log");
});

test("ensure-row route exists", () => {
  const p = path.join(ROOT, "app/api/write-offs/ensure-row/route.ts");
  assert.ok(existsSync(p), "ensure-row route must exist");
});

test("ensure-row route uses createRouteClient for server-side auth", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/write-offs/ensure-row/route.ts"),
    "utf8",
  );
  assert.match(src, /createRouteClient/, "Must use createRouteClient for server-side session auth");
  assert.match(src, /Unauthorized.*401/s, "Must return 401 when unauthenticated");
  assert.match(src, /403/, "Must return 403 on ownership mismatch");
});

test("ensure-row route verifies transaction ownership via financial_accounts join", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/write-offs/ensure-row/route.ts"),
    "utf8",
  );
  assert.match(src, /financial_accounts!inner/, "Must use !inner join for ownership check");
});

test("ensure-row route only writes to write_offs table", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/write-offs/ensure-row/route.ts"),
    "utf8",
  );
  assert.match(src, /from\("write_offs"\)/, "Must reference write_offs table");
  assert.doesNotMatch(src, /from\("transactions"\).*\.update/, "Must not update transactions");
  assert.doesNotMatch(src, /financialCalculations/, "Must not import financialCalculations");
  assert.doesNotMatch(src, /canonicalFinancialData/, "Must not import canonicalFinancialData");
});

test("write-offs page ensureWriteOffRow calls API route not inline Supabase", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/write-offs/page.tsx"), "utf8");
  const fnStart = src.indexOf("const ensureWriteOffRow");
  assert.ok(fnStart !== -1, "ensureWriteOffRow must exist");
  const fnBody = src.slice(fnStart, fnStart + 800);
  assert.match(fnBody, /\/api\/write-offs\/ensure-row/, "Must call ensure-row API route");
  assert.doesNotMatch(fnBody, /supabase\.auth\.getUser/, "Must not call supabase.auth.getUser client-side");
});

test("write-offs page manual display mapping preserves transaction_id from DB (not hardcoded null)", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/write-offs/page.tsx"), "utf8");
  // The mapping must not hardcode transaction_id: null for manual entries
  assert.doesNotMatch(
    src,
    /transaction_id:\s*null,/,
    "Manual write-offs display mapping must not hardcode transaction_id: null",
  );
  assert.match(
    src,
    /transaction_id:.*transaction_id/,
    "Must pass through transaction_id from the DB result",
  );
});

test("deleteWriteOff clears is_writeoff_candidate when deleting a write_offs row with transaction_id", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/write-offs/page.tsx"), "utf8");
  const fnIdx = src.indexOf("const deleteWriteOff = async");
  assert.ok(fnIdx !== -1, "deleteWriteOff must exist");
  const fnBody = src.slice(fnIdx, fnIdx + 1200);
  // The non-synthetic path (manual write_offs row with transaction_id) must also clear the flag.
  // Must use false (not null) so getCanonicalTransactionBasedWriteOffs can exclude the entry.
  const firstReturnIdx = fnBody.indexOf("return;");
  const afterFirstReturn = fnBody.slice(firstReturnIdx + 1);
  assert.match(
    afterFirstReturn,
    /is_writeoff_candidate.*(?:false|null)|(?:false|null).*is_writeoff_candidate/s,
    "Non-synthetic delete path must clear is_writeoff_candidate (false preferred) when transaction_id is set",
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. Session 3 regression: category auto-apply and write-off delete fixes
// ═══════════════════════════════════════════════════════════════════════════════

test("autoApplyRule uses DB-level ilike for merchant matching (not JS evaluateRule)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  assert.ok(fnStart !== -1, "autoApplyRule must exist");
  const fnBody = src.slice(fnStart);
  assert.match(fnBody, /\.ilike\(/, "autoApplyRule must use .ilike() for DB-level matching");
});

test("autoApplyRule adds explicit user_id filter for defence-in-depth", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  assert.match(fnBody, /eq\("user_id",\s*userId\)/, "autoApplyRule must filter by user_id explicitly");
});

test("autoApplyRule logs errors instead of silently swallowing update failures", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  assert.match(fnBody, /console\.error/, "autoApplyRule must log errors, not swallow them");
});

test("autoApplyRule handles merchant_normalized matcher type", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  assert.match(fnBody, /merchant_normalized/, "autoApplyRule must handle merchant_normalized matcher");
});

test("autoApplyRule handles description_pattern matcher type", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  assert.match(fnBody, /description_pattern/, "autoApplyRule must handle description_pattern matcher");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 12. Session 3 regression: false-positive prevention for ILIKE matching
// ═══════════════════════════════════════════════════════════════════════════════

test("autoApplyRule description_pattern chains ALL tokens (not just first token)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  // Must iterate over all tokens, not pick description_tokens[0] alone.
  // A for..of loop (or equivalent) over description_tokens is the required pattern.
  assert.doesNotMatch(
    fnBody,
    /description_tokens\[0\]/,
    "Must not use only description_tokens[0] — common first tokens like 'pos' or 'payment' would over-match",
  );
  assert.match(
    fnBody,
    /for\s*\([^)]*description_tokens\)|description_tokens\.(?:forEach|map|reduce|for)/,
    "Must iterate over all description_tokens to AND-chain ILIKE filters",
  );
});

test("autoApplyRule description_pattern calls .ilike() once per token (AND semantics)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  // In the description_pattern branch, the ilike call must be inside a loop over tokens,
  // not a single .ilike(description_tokens[0]) call. Verify the loop + ilike combination.
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  const descPatternIdx = fnBody.indexOf("description_pattern");
  assert.ok(descPatternIdx !== -1, "description_pattern branch must exist");
  const branchBody = fnBody.slice(descPatternIdx, descPatternIdx + 600);
  assert.match(branchBody, /for\b/, "description_pattern branch must use a for loop over tokens");
  assert.match(branchBody, /\.ilike\(/, "description_pattern branch must call .ilike() inside the loop");
});

test("autoApplyRule merchant_normalized uses normalized_merchant from rule config (not raw name)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  // normalized_merchant is produced by normalizeMerchant() at rule creation time.
  // The DB-level ILIKE must use this stored normalized value, not a raw string.
  assert.match(
    fnBody,
    /mc\.normalized_merchant/,
    "Must use mc.normalized_merchant from rule config for the ILIKE pattern",
  );
});

test("autoApplyRule merchant_normalized guards against empty normalized_merchant (early skip)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  const merchantBranchIdx = fnBody.indexOf("merchant_normalized");
  const branchBody = fnBody.slice(merchantBranchIdx, merchantBranchIdx + 400);
  // Guard must return the skip sentinel (or 0) — prevents unbounded %% ILIKE
  assert.match(
    branchBody,
    /if\s*\(!mc\.normalized_merchant\)\s*return\s+(?:skip|0|\{)/,
    "Must skip when normalized_merchant is empty to prevent unbounded ILIKE",
  );
});

test("autoApplyRule description_pattern guards against empty token list (early skip)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  const descBranchIdx = fnBody.indexOf("description_pattern");
  const branchBody = fnBody.slice(descBranchIdx, descBranchIdx + 400);
  assert.match(
    branchBody,
    /description_tokens\?\.length.*return\s+(?:skip|0|\{)|!mc\.description_tokens.*return\s+(?:skip|0|\{)/,
    "Must skip when description_tokens is empty to prevent a no-op query that matches everything",
  );
});

test("deleteWriteOff uses false (not null) for is_writeoff_candidate to enable explicit exclusion", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/write-offs/page.tsx"), "utf8");
  const fnIdx = src.indexOf("const deleteWriteOff = async");
  assert.ok(fnIdx !== -1, "deleteWriteOff must exist");
  const fnBody = src.slice(fnIdx, fnIdx + 1500);
  assert.match(fnBody, /is_writeoff_candidate:\s*false/, "deleteWriteOff must set is_writeoff_candidate: false (not null) so excluded entries stay gone");
});

test("deleteWriteOff non-synthetic path checks error on write_offs.delete()", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/write-offs/page.tsx"), "utf8");
  const fnIdx = src.indexOf("const deleteWriteOff = async");
  assert.ok(fnIdx !== -1, "deleteWriteOff must exist");
  // Use 2500 chars to ensure the full function body is captured
  const fnBody = src.slice(fnIdx, fnIdx + 2500);
  // After the write_offs.delete() call there must be an error check
  const deleteIdx = fnBody.lastIndexOf(".delete()");
  assert.ok(deleteIdx !== -1, "Must have a .delete() call");
  const afterDelete = fnBody.slice(deleteIdx);
  assert.match(afterDelete, /error|Error/, "Must check error after write_offs.delete()");
});

test("deleteWriteOff surfaces error messages to the user (setListError)", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/write-offs/page.tsx"), "utf8");
  const fnIdx = src.indexOf("const deleteWriteOff = async");
  const fnBody = src.slice(fnIdx, fnIdx + 1500);
  const errorCallCount = (fnBody.match(/setListError\(/g) ?? []).length;
  assert.ok(errorCallCount >= 2, "deleteWriteOff must have at least two setListError calls (one per error path)");
});

test("getCanonicalTransactionBasedWriteOffs excludes is_writeoff_candidate === false", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/canonicalFinancialData.ts"), "utf8");
  const fnStart = src.indexOf("export async function getCanonicalTransactionBasedWriteOffs");
  assert.ok(fnStart !== -1, "getCanonicalTransactionBasedWriteOffs must exist");
  const fnBody = src.slice(fnStart, fnStart + 800);
  assert.match(fnBody, /is_writeoff_candidate/, "Must check is_writeoff_candidate field");
  assert.match(fnBody, /!== false/, "Must exclude is_writeoff_candidate === false transactions so deleted entries stay gone");
});

test("autoApplyRule does not touch income transactions (credit direction blocked at query level)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  assert.match(fnBody, /eq\("direction",\s*"debit"\)/, "Must restrict auto-apply to debit transactions only");
  assert.doesNotMatch(fnBody, /eq\("direction",\s*"credit"\)/, "Must not touch credit (income) transactions");
});

test("autoApplyRule does not touch deleted transactions (deleted_at IS NULL guard)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  assert.match(fnBody, /is\("deleted_at",\s*null\)/, "Must filter out deleted transactions");
});

test("autoApplyRule returns 0 for sensitive categories without touching any transaction", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  // Use 2000 chars to capture both the guard and the first query
  const fnBody = src.slice(fnStart, fnStart + 2000);
  // SENSITIVE_CATEGORIES check must come before any DB mutation (.update()
  const sensitiveCheckIdx = fnBody.indexOf("SENSITIVE_CATEGORIES");
  const firstUpdateIdx = fnBody.indexOf(".update(");
  assert.ok(sensitiveCheckIdx !== -1, "autoApplyRule must check SENSITIVE_CATEGORIES");
  assert.ok(firstUpdateIdx !== -1, "autoApplyRule must have a .update() call");
  assert.ok(sensitiveCheckIdx < firstUpdateIdx, "SENSITIVE_CATEGORIES guard must precede any DB mutation");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 13. Session 3 hardening: failure propagation + merchant over-match prevention
// ═══════════════════════════════════════════════════════════════════════════════

// ── A. autoApplyRule return type ─────────────────────────────────────────────

test("autoApplyRule returns AutoApplyResult with applied and failed fields (not a plain number)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  assert.match(src, /AutoApplyResult/, "AutoApplyResult interface must be exported");
  assert.match(src, /applied:\s*number/, "AutoApplyResult must have applied field");
  assert.match(src, /failed:\s*boolean/, "AutoApplyResult must have failed field");
  // Return type annotation on the function
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnSig = src.slice(fnStart, fnStart + 200);
  assert.match(fnSig, /Promise<AutoApplyResult>/, "autoApplyRule must return Promise<AutoApplyResult>");
});

test("autoApplyRule returns failed: true on DB update error (not just applied: 0)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  // The error path must set failed: true, not just return the skip sentinel
  assert.match(
    fnBody,
    /failed:\s*true/,
    "autoApplyRule must return { failed: true } on DB error so callers can distinguish from no-match",
  );
  // All skip paths must use failed: false
  const skipCount = (fnBody.match(/failed:\s*false/g) ?? []).length;
  assert.ok(skipCount >= 1, "Non-error skip paths must use failed: false");
});

test("autoApplyRule server-side error log contains no private data (only error message)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  // Log must use updateErr.message — the DB error string, not transaction/user data
  assert.match(fnBody, /console\.error.*updateErr\.message/, "Error log must use updateErr.message only");
  // Must not log userId, transactionId, or entity data
  assert.doesNotMatch(fnBody, /console\.error.*userId/, "Must not log userId");
  assert.doesNotMatch(fnBody, /console\.error.*transactionId/, "Must not log transactionId");
});

// ── B. Categorize route failure propagation ───────────────────────────────────

test("categorize route returns autoApplyFailed: true when autoApplyRule fails", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/categorize/route.ts"),
    "utf8",
  );
  assert.match(src, /autoApplyFailed/, "Route must handle autoApplyFailed from autoApplyRule result");
  assert.match(src, /autoApplyFailed:\s*true/, "Route must include autoApplyFailed: true in partial-fail response");
});

test("categorize route response includes warning message when autoApply fails", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/categorize/route.ts"),
    "utf8",
  );
  assert.match(src, /warning:/, "Route must include a warning field when auto-apply fails");
  assert.match(
    src,
    /categorized.*auto-updated|auto-updated.*categorized/s,
    "Warning must clarify that categorization succeeded but auto-update failed",
  );
});

test("categorize route returns success: true even when autoApply fails (primary action succeeded)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/categorize/route.ts"),
    "utf8",
  );
  // Both the success path and the partial-fail path must return success: true
  const successCount = (src.match(/success:\s*true/g) ?? []).length;
  assert.ok(successCount >= 2, "Both normal and partial-fail response paths must return success: true");
});

test("categorize route destructures applied and failed from autoApplyRule result", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/categorize/route.ts"),
    "utf8",
  );
  // Must destructure the result object, not use a bare number
  assert.match(
    src,
    /(?:applied|failed).*autoApplyRule|autoApplyRule.*(?:applied|failed)/s,
    "Route must destructure applied/failed from autoApplyRule result",
  );
});

// ── C. Transactions UI warning surface ────────────────────────────────────────

test("transactions page reads autoApplyFailed from categorize response", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/transactions/page.tsx"), "utf8");
  assert.match(src, /autoApplyFailed/, "UI must read autoApplyFailed from API response");
  assert.match(src, /catData\.autoApplyFailed/, "Must check catData.autoApplyFailed specifically");
});

test("transactions page shows safe warning when autoApplyFailed is true (not silent success)", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/transactions/page.tsx"), "utf8");
  // autoApplyWarning variable must exist and be used in the message
  assert.match(src, /autoApplyWarning/, "autoApplyWarning state variable must exist");
  // The warning message must be shown — not silently swallowed as "Saved successfully."
  assert.match(
    src,
    /autoApplyWarning.*could not be auto-updated|could not be auto-updated.*autoApplyWarning/s,
    "Warning message must tell user matching transactions could not be auto-updated",
  );
});

test("transactions page warning message is distinct from categoryError message", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/transactions/page.tsx"), "utf8");
  // categoryError = route HTTP failure; autoApplyWarning = route success but auto-apply DB error
  assert.match(src, /categoryError/, "categoryError must still exist for HTTP-level failures");
  assert.match(src, /autoApplyWarning/, "autoApplyWarning must be separate from categoryError");
  // Both must be checked in the message ternary
  const msgBlock = src.slice(src.indexOf("categoryError\n") === -1
    ? src.indexOf("categoryError ") : src.indexOf("categoryError\n"));
  assert.match(msgBlock.slice(0, 500), /autoApplyWarning/, "Message ternary must include autoApplyWarning branch");
});

// ── D. Merchant over-match prevention ─────────────────────────────────────────

test("autoApplyRule skips auto-apply for normalized merchant names shorter than 4 chars", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  const merchantBranchIdx = fnBody.indexOf("merchant_normalized");
  const branchBody = fnBody.slice(merchantBranchIdx, merchantBranchIdx + 500);
  assert.match(
    branchBody,
    /normalized_merchant\.length\s*<\s*4/,
    "Must skip auto-apply when normalized_merchant is shorter than 4 chars to prevent substring false positives",
  );
});

test("autoApplyRule merchant length guard returns skip (not failed) for short names", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  const merchantBranchIdx = fnBody.indexOf("merchant_normalized");
  const branchBody = fnBody.slice(merchantBranchIdx, merchantBranchIdx + 600);
  // The length guard must return skip (not { failed: true }) — it's a deliberate skip, not an error
  const lengthGuardIdx = branchBody.indexOf("normalized_merchant.length");
  const afterGuard = branchBody.slice(lengthGuardIdx, lengthGuardIdx + 80);
  assert.doesNotMatch(afterGuard, /failed:\s*true/, "Short merchant skip must not set failed: true");
});

test("autoApplyRule merchant normalized path still applies ILIKE for names of 4+ chars", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/suggestionEngine.ts"), "utf8");
  const fnStart = src.indexOf("export async function autoApplyRule");
  const fnBody = src.slice(fnStart);
  const merchantBranchIdx = fnBody.indexOf("merchant_normalized");
  const branchBody = fnBody.slice(merchantBranchIdx, merchantBranchIdx + 600);
  // After the length guard, .ilike() must still be called for longer names
  assert.match(branchBody, /\.ilike\("merchant_name"/, "merchant_normalized branch must still call .ilike()");
});

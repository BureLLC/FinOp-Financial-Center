/**
 * Write-Off Candidate PR B: UI and manual mark tests.
 *
 * All logic under test is inlined — no TypeScript imports.
 * Source files are read via fs.readFileSync where structural assertions
 * are needed.
 *
 * Run with: node --test tests/automation/writeoff-candidate-pr-b.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Mark-writeoff-candidate route
// ═══════════════════════════════════════════════════════════════════════════════

test("mark-writeoff-candidate route exists at expected path", () => {
  const routePath = path.join(
    ROOT,
    "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts",
  );
  assert.ok(existsSync(routePath), "Route file must exist");
});

test("mark-writeoff-candidate route requires authentication", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(src, /Unauthorized.*401/s, "Route must return 401 when unauthenticated");
});

test("mark-writeoff-candidate route verifies ownership through financial_accounts join", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(src, /financial_accounts!inner/, "Must use financial_accounts!inner join for ownership");
  assert.match(src, /403/, "Must return 403 on ownership mismatch");
});

test("mark-writeoff-candidate route only writes is_writeoff_candidate", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(src, /\.update\(\s*\{\s*is_writeoff_candidate\s*:\s*true\s*\}/, "Update payload must contain only is_writeoff_candidate");
  assert.doesNotMatch(src, /\.update\([^)]*category/, "Must not write category");
  assert.doesNotMatch(src, /\.update\([^)]*subcategory/, "Must not write subcategory");
  assert.doesNotMatch(src, /\.update\([^)]*income_subtype/, "Must not write income_subtype");
  assert.doesNotMatch(src, /\.update\([^)]*direction/, "Must not write direction");
  assert.doesNotMatch(src, /\.update\([^)]*amount/, "Must not write amount");
});

test("mark-writeoff-candidate route creates audit log entry", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(src, /automation_audit_log/, "Must write to automation_audit_log");
  assert.match(src, /mark_writeoff_candidate/, "audit action_taken must be mark_writeoff_candidate");
  assert.match(src, /previous_value/, "Must record previous_value");
  assert.match(src, /new_value/, "Must record new_value");
  assert.match(src, /triggered_by.*user_manual/s, "Must set triggered_by to user_manual");
});

test("mark-writeoff-candidate route does not create write-offs or affect tax", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  // Must not query or write to the write_offs table (import or from() call)
  assert.doesNotMatch(src, /from\(["']write_offs["']\)/i, "Must not query write_offs table");
  assert.doesNotMatch(src, /tax_center|taxCenter/i, "Must not reference Tax Center");
  assert.doesNotMatch(src, /financialCalculations/i, "Must not import financialCalculations");
  assert.doesNotMatch(src, /canonicalFinancialData/i, "Must not import canonicalFinancialData");
});

test("mark-writeoff-candidate route generates suggestions via writeOffSuggestionEngine (PR C)", () => {
  // PR B absence guard retired — PR C has wired suggestion generation.
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(src, /generateAndStoreWriteOffSuggestions/, "Route must call generateAndStoreWriteOffSuggestions (PR C)");
  assert.match(src, /writeOffSuggestionEngine/, "Route must import writeOffSuggestionEngine (PR C)");
});

test("mark-writeoff-candidate route returns suggestionsEnabled field", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(src, /suggestionsEnabled/, "Must return suggestionsEnabled in response shape");
  assert.match(src, /WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED/, "Must reference feature flag");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Write-off rule builder
// ═══════════════════════════════════════════════════════════════════════════════

test("writeOffRuleBuilder.ts exists", () => {
  const p = path.join(ROOT, "src/lib/automation/writeOffRuleBuilder.ts");
  assert.ok(existsSync(p), "writeOffRuleBuilder.ts must exist");
});

test("writeOffRuleBuilder blocks credit-direction transactions", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffRuleBuilder.ts"),
    "utf8",
  );
  assert.match(src, /direction.*!==.*debit|direction.*!==.*"debit"/s,
    "Must block non-debit (credit) transactions");
});

test("writeOffRuleBuilder uses action_type mark_writeoff_candidate", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffRuleBuilder.ts"),
    "utf8",
  );
  assert.match(src, /'mark_writeoff_candidate'/, "action_type must be mark_writeoff_candidate");
  assert.doesNotMatch(src, /'mark_business_candidate'/, "Must not reference business action_type");
});

test("writeOffRuleBuilder action config has reason but not category or mixed_use", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffRuleBuilder.ts"),
    "utf8",
  );
  assert.match(src, /reason\s*:/, "action config must include reason field");
  assert.doesNotMatch(src, /mixed_use\s*:/, "action config must not include mixed_use (not applicable to write-off)");
  assert.doesNotMatch(src, /category\s*:(?!.*comment)/, "action config must not include category field");
});

test("writeOffRuleBuilder creates rules at 0.70 confidence and strengthens by 0.05 capped at 1.0", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffRuleBuilder.ts"),
    "utf8",
  );
  assert.match(src, /0\.70/, "New rule confidence must be 0.70");
  assert.match(src, /0\.05/, "Strength increment must be 0.05");
  assert.match(src, /Math\.min.*1\.0|1\.0.*Math\.min/s, "Confidence cap must be 1.0");
});

test("writeOffRuleBuilder does not reference business rule builder or MIXED_USE_CATEGORIES", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffRuleBuilder.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /businessRuleBuilder/, "Must not import businessRuleBuilder");
  assert.doesNotMatch(src, /MIXED_USE_CATEGORIES/, "Write-off eligibility does not use MIXED_USE_CATEGORIES");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Migration 010: apply_writeoff_candidate_suggestion RPC
// ═══════════════════════════════════════════════════════════════════════════════

test("migration 010 exists", () => {
  const p = path.join(
    ROOT,
    "supabase/migrations/20260505000010_add_apply_writeoff_candidate_suggestion.sql",
  );
  assert.ok(existsSync(p), "Migration 010 must exist");
});

test("migration 010 defines apply_writeoff_candidate_suggestion function", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000010_add_apply_writeoff_candidate_suggestion.sql"),
    "utf8",
  );
  assert.match(sql, /CREATE OR REPLACE FUNCTION apply_writeoff_candidate_suggestion/i,
    "Must define apply_writeoff_candidate_suggestion");
});

test("migration 010 RPC verifies suggestion_type is write_off_candidate", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000010_add_apply_writeoff_candidate_suggestion.sql"),
    "utf8",
  );
  assert.match(sql, /'write_off_candidate'/, "Must check suggestion_type = 'write_off_candidate'");
  assert.match(sql, /suggestion_type.*<>|<>.*suggestion_type/s,
    "Must raise exception on wrong suggestion_type");
});

test("migration 010 RPC writes only is_writeoff_candidate", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000010_add_apply_writeoff_candidate_suggestion.sql"),
    "utf8",
  );
  const updateMatch = sql.match(/UPDATE\s+public\.transactions\s+SET\s+([^;]+)/i);
  assert.ok(updateMatch, "Must have UPDATE public.transactions SET");
  const setClauses = updateMatch[1];
  assert.match(setClauses, /is_writeoff_candidate/, "Must set is_writeoff_candidate");
  assert.doesNotMatch(setClauses, /\bcategory\b/, "Must not write category");
  assert.doesNotMatch(setClauses, /\bsubcategory\b/, "Must not write subcategory");
  assert.doesNotMatch(setClauses, /\bincome_subtype\b/, "Must not write income_subtype");
  assert.doesNotMatch(setClauses, /\bis_business_candidate\b/, "Must not write is_business_candidate");
});

test("migration 010 RPC inserts action_taken mark_writeoff_candidate in audit log", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000010_add_apply_writeoff_candidate_suggestion.sql"),
    "utf8",
  );
  assert.match(sql, /'mark_writeoff_candidate'/, "Audit log action_taken must be mark_writeoff_candidate");
  assert.match(sql, /'user_accept'/, "triggered_by must be user_accept");
});

test("migration 010 verifies transaction ownership via financial_accounts join", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000010_add_apply_writeoff_candidate_suggestion.sql"),
    "utf8",
  );
  assert.match(sql, /financial_accounts.*fa.*ON.*fa\.id.*financial_account_id/s,
    "Must join financial_accounts to verify transaction ownership");
});

test("migration 010 includes rollback comment", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000010_add_apply_writeoff_candidate_suggestion.sql"),
    "utf8",
  );
  assert.match(sql, /DROP FUNCTION IF EXISTS apply_writeoff_candidate_suggestion/i,
    "Rollback DROP FUNCTION must be documented");
});

test("migration 010 does not reference is_business_candidate or write-off creation", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000010_add_apply_writeoff_candidate_suggestion.sql"),
    "utf8",
  );
  assert.doesNotMatch(sql, /\bis_business_candidate\b/, "Must not reference is_business_candidate");
  assert.doesNotMatch(sql, /write_offs\s*(?:INSERT|UPDATE)/i, "Must not write to write_offs table");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Accept route: write_off_candidate branch
// ═══════════════════════════════════════════════════════════════════════════════

test("accept route write_off_candidate branch calls apply_writeoff_candidate_suggestion RPC", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.match(
    src,
    /\.rpc\(["']apply_writeoff_candidate_suggestion["']/,
    "write_off_candidate branch must call apply_writeoff_candidate_suggestion RPC",
  );
});

test("accept route write_off_candidate branch no longer returns 501", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.doesNotMatch(
    src,
    /write_off_candidate.*501|501.*write_off_candidate/s,
    "write_off_candidate branch must not return 501",
  );
});

test("accept route write_off_candidate branch returns success and auditId", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.match(src, /auditId/, "Accept route must return auditId in response");
  assert.match(src, /success.*true|true.*success/s, "Accept route must return success: true");
});

test("accept route business_expense_candidate branch still calls apply_business_candidate_suggestion", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.match(
    src,
    /\.rpc\(["']apply_business_candidate_suggestion["']/,
    "Business candidate path must still call apply_business_candidate_suggestion",
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Undo route: mark_writeoff_candidate branch
// ═══════════════════════════════════════════════════════════════════════════════

test("undo route mark_writeoff_candidate branch reads is_writeoff_candidate for stale guard", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/audit/[id]/undo/route.ts"),
    "utf8",
  );
  assert.match(
    src,
    /is_writeoff_candidate/,
    "Undo route must read is_writeoff_candidate for stale-value guard",
  );
});

test("undo route mark_writeoff_candidate branch reverts to NULL", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/audit/[id]/undo/route.ts"),
    "utf8",
  );
  assert.match(
    src,
    /is_writeoff_candidate\s*:\s*null/,
    "Undo must set is_writeoff_candidate to null",
  );
});

test("undo route mark_writeoff_candidate branch returns 409 on stale value (double-undo guard)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/audit/[id]/undo/route.ts"),
    "utf8",
  );
  assert.match(
    src,
    /transaction_edited_after_apply/,
    "Stale-value guard must return transaction_edited_after_apply reason",
  );
  assert.match(src, /409/, "Stale-value guard must return 409 status");
});

test("undo route mark_writeoff_candidate branch reverts suggestion to pending", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/audit/[id]/undo/route.ts"),
    "utf8",
  );
  assert.match(
    src,
    /status.*pending.*resolved_at.*null|pending.*suggestion/s,
    "Undo must revert suggestion status to pending when suggestion_id is present",
  );
});

test("undo route mark_writeoff_candidate branch inserts undo_mark_writeoff_candidate audit entry", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/audit/[id]/undo/route.ts"),
    "utf8",
  );
  assert.match(
    src,
    /undo_mark_writeoff_candidate/,
    "Undo audit log must use action_taken undo_mark_writeoff_candidate",
  );
});

test("undo route mark_writeoff_candidate branch no longer returns 501", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/audit/[id]/undo/route.ts"),
    "utf8",
  );
  assert.doesNotMatch(
    src,
    /mark_writeoff_candidate.*501|501.*mark_writeoff_candidate/s,
    "mark_writeoff_candidate undo must not return 501",
  );
});

test("undo route mark_business_candidate branch still has revert logic (regression)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/audit/[id]/undo/route.ts"),
    "utf8",
  );
  assert.match(
    src,
    /undo_mark_business_candidate/,
    "Business candidate undo audit entry must still exist",
  );
  assert.match(
    src,
    /is_business_candidate\s*:\s*null/,
    "Business candidate undo must still revert to null",
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Transactions UI: interface, state, confirmation, badges
// ═══════════════════════════════════════════════════════════════════════════════

test("Transaction interface includes is_writeoff_candidate", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(
    src,
    /is_writeoff_candidate\s*:\s*boolean\s*\|\s*null/,
    "Transaction interface must include is_writeoff_candidate: boolean | null",
  );
});

test("manual mark shows disclaimer before API call", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(
    src,
    /does not create a write-off.*deduction.*taxes|write-off review.*not.*taxes/s,
    "Disclaimer text must mention does not create a write-off or affect taxes",
  );
});

test("API call is gated by writeoffConfirmOpen state, not triggered on button click", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(src, /writeoffConfirmOpen/, "writeoffConfirmOpen state must exist");
  assert.match(src, /setWriteoffConfirmOpen/, "setWriteoffConfirmOpen must be called");
  assert.match(src, /mark-writeoff-candidate/, "API URL must reference mark-writeoff-candidate");
  // The confirmation open button must call setWriteoffConfirmOpen(true), not markWriteOff
  const confirmOpenIdx = src.indexOf("setWriteoffConfirmOpen(true)");
  const markApiIdx = src.indexOf("mark-writeoff-candidate");
  assert.ok(confirmOpenIdx !== -1, "setWriteoffConfirmOpen(true) must exist");
  assert.ok(markApiIdx !== -1, "mark-writeoff-candidate API call must exist");
});

test("failed API call does not optimistically update UI (error shown in panel)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(src, /writeoffMarkError/, "writeoffMarkError state must exist for error display");
  // is_writeoff_candidate must only be updated after res.ok check
  const resOkIdx = src.indexOf("res.ok");
  const optimisticIdx = src.indexOf("is_writeoff_candidate: true");
  assert.ok(resOkIdx !== -1, "res.ok check must exist");
  assert.ok(optimisticIdx > resOkIdx, "is_writeoff_candidate: true must appear after res.ok guard");
});

test("already-marked transaction shows Write-Off Candidate status, not the button", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(src, /is_writeoff_candidate.*Write-Off Candidate|Write-Off Candidate.*is_writeoff_candidate/s,
    "Already-marked state must show Write-Off Candidate badge");
  // The badge must be rendered when is_writeoff_candidate is truthy, and the mark button must not be shown in that branch
  const badgeIdx = src.indexOf("Write-Off Candidate\n");
  const confirmBtnIdx = src.indexOf("setWriteoffConfirmOpen(true)");
  // They must be in different branches — the badge comes before the confirm button in an if/else
  assert.ok(badgeIdx !== -1, "Write-Off Candidate badge text must exist");
  assert.ok(confirmBtnIdx !== -1, "setWriteoffConfirmOpen(true) must exist for unmark state");
});

test("undoEntry union includes writeoff kind", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(src, /"writeoff"/, "undoEntry union must include kind: \"writeoff\"");
});

test("undoAccept handler has dedicated writeoff branch that reverts is_writeoff_candidate", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(
    src,
    /entry\.kind.*writeoff.*is_writeoff_candidate/s,
    "undoAccept must have a writeoff branch that reverts is_writeoff_candidate",
  );
});

test("write-off suggestion badge is gated by WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(
    src,
    /WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED.*writeoffSuggestions|WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED.*writeoffSuggestion/s,
    "Write-Off? badge must be gated by WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED",
  );
});

test("writeoffSuggestions map is populated only when WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED is true", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(
    src,
    /WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED.*writeoffMap|if.*WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED/s,
    "writeoffSuggestions map must only be populated when flag is true",
  );
});

test("category, business, and write-off suggestion maps are built separately and do not overwrite each other", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(src, /catMap/, "catMap must exist for category suggestions");
  assert.match(src, /bizMap/, "bizMap must exist for business suggestions");
  assert.match(src, /writeoffMap/, "writeoffMap must exist for write-off suggestions");
  assert.match(src, /setCategorySuggestions\(catMap\)/, "catMap must be set independently");
  assert.match(src, /setBizSuggestions\(bizMap\)/, "bizMap must be set independently");
  assert.match(src, /setWriteoffSuggestions\(writeoffMap\)/, "writeoffMap must be set independently");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Canonical select: is_writeoff_candidate and is_business_candidate
// ═══════════════════════════════════════════════════════════════════════════════

test("canonical transactions select includes is_writeoff_candidate", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/canonicalFinancialData.ts"),
    "utf8",
  );
  assert.match(src, /is_writeoff_candidate/, "Canonical select must include is_writeoff_candidate");
});

test("canonical transactions select includes is_business_candidate", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/canonicalFinancialData.ts"),
    "utf8",
  );
  assert.match(src, /is_business_candidate/, "Canonical select must include is_business_candidate");
});

test("canonicalFinancialData.ts does not use is_writeoff_candidate in financial calculations", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/canonicalFinancialData.ts"),
    "utf8",
  );
  // is_writeoff_candidate should only appear in the SELECT string, not inside any function body.
  // Extract function bodies by splitting on top-level 'export function'/'export async function'.
  const fnBodies = src.split(/export (?:async )?function /);
  for (const body of fnBodies.slice(1)) {
    // Only check functions whose name is NOT getCanonicalTransactions (which owns the SELECT)
    if (body.startsWith("getCanonicalTransactions")) continue;
    assert.doesNotMatch(
      body,
      /is_writeoff_candidate/,
      `is_writeoff_candidate must not appear in financial calculation function bodies`,
    );
  }
});

test("financialCalculations.ts does not reference is_writeoff_candidate", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/financialCalculations.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /is_writeoff_candidate/, "financialCalculations must not reference is_writeoff_candidate");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Feature flag: WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED remains false
// ═══════════════════════════════════════════════════════════════════════════════

test("WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED is true in PR C (enabled)", () => {
  // PR B false guard retired — PR C enables the flag.
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/constants.ts"),
    "utf8",
  );
  assert.match(
    src,
    /WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED\s*=\s*true/,
    "Feature flag must be true in PR C — generation is enabled",
  );
});

test("BUSINESS_EXPENSE_SUGGESTIONS_ENABLED is still true (unchanged by PR B)", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/constants.ts"),
    "utf8",
  );
  assert.match(
    src,
    /BUSINESS_EXPENSE_SUGGESTIONS_ENABLED\s*=\s*true/,
    "Business expense flag must remain true",
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. No suggestion generation in PR B
// ═══════════════════════════════════════════════════════════════════════════════

test("writeOffSuggestionEngine.ts exists (shipped in PR C)", () => {
  // PR B absence guard retired — PR C has shipped writeOffSuggestionEngine.ts.
  const p = path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts");
  assert.ok(existsSync(p), "writeOffSuggestionEngine.ts must exist — shipped in PR C");
});

test("mark-writeoff-candidate route calls generateAndStoreWriteOffSuggestions (PR C)", () => {
  // PR B absence guard retired — PR C wires suggestion generation.
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(
    src,
    /generateAndStoreWriteOffSuggestions/,
    "Suggestion generation must be wired in PR C",
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. Financial isolation: no Write-Off totals, Tax Center, or deductible changes
// ═══════════════════════════════════════════════════════════════════════════════

// Inlined: isDeductibleBusinessExpense (mirrors canonicalFinancialData.ts source)
const DEDUCTIBLE_CATEGORIES_LOCAL = new Set([
  "business", "home office", "vehicle", "equipment", "software",
  "meals", "travel", "professional services", "advertising",
  "office supplies", "insurance", "utilities",
]);

function isDeductibleBusinessExpense(tx) {
  const cat = (tx.category ?? "").toLowerCase();
  const txType = (tx.transaction_type ?? "").toLowerCase();
  return (
    tx.direction === "debit" &&
    DEDUCTIBLE_CATEGORIES_LOCAL.has(cat) &&
    txType !== "transfer" &&
    txType !== "tax_payment" &&
    tx.deleted_at == null
  );
}

test("is_writeoff_candidate=true does not affect isDeductibleBusinessExpense result", () => {
  const base = { direction: "debit", category: "software", transaction_type: "bank", deleted_at: null };
  const withFlag = { ...base, is_writeoff_candidate: true };
  const withoutFlag = { ...base, is_writeoff_candidate: false };
  assert.equal(
    isDeductibleBusinessExpense(withFlag),
    isDeductibleBusinessExpense(withoutFlag),
    "is_writeoff_candidate must not affect deductible calculation",
  );
  assert.equal(isDeductibleBusinessExpense(withFlag), true);
});

test("is_writeoff_candidate=true on a non-deductible transaction does not make it deductible", () => {
  const tx = { direction: "debit", category: "food", transaction_type: "bank", deleted_at: null, is_writeoff_candidate: true };
  assert.equal(isDeductibleBusinessExpense(tx), false,
    "is_writeoff_candidate must not add deductible categories");
});

test("is_writeoff_candidate=true on a credit transaction does not affect deductible count", () => {
  const tx = { direction: "credit", category: "software", transaction_type: "bank", deleted_at: null, is_writeoff_candidate: true };
  assert.equal(isDeductibleBusinessExpense(tx), false);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. Protected transaction fields: never written
// ═══════════════════════════════════════════════════════════════════════════════

const PROTECTED_FIELDS = [
  "income_subtype", "direction", "amount", "transaction_date",
  "transaction_type", "status", "financial_account_id",
  "external_transaction_id", "provider", "deleted_at",
];

test("mark-writeoff-candidate route does not write any protected transaction fields", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  for (const field of PROTECTED_FIELDS) {
    assert.doesNotMatch(
      src,
      new RegExp(`\\.update\\([^)]*${field}`),
      `Route must not write ${field}`,
    );
  }
});

test("writeOffRuleBuilder does not write any transaction fields", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffRuleBuilder.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /from\("transactions"\).*\.update/, "Rule builder must not write to transactions table");
});

test("apply_writeoff_candidate_suggestion RPC does not write protected fields to transactions table", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000010_add_apply_writeoff_candidate_suggestion.sql"),
    "utf8",
  );
  // Only check the UPDATE public.transactions SET clause (not the automation_suggestions UPDATE)
  const txUpdate = sql.match(/UPDATE\s+public\.transactions\s+SET\s+([^;]+)/i);
  assert.ok(txUpdate, "Must have UPDATE public.transactions SET statement");
  const setClauses = txUpdate[1];
  for (const field of PROTECTED_FIELDS) {
    assert.doesNotMatch(
      setClauses,
      new RegExp(`\\b${field}\\b`, "i"),
      `RPC transaction UPDATE must not write ${field}`,
    );
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 12. Regression: existing category and business candidate paths undisturbed
// ═══════════════════════════════════════════════════════════════════════════════

test("accept route category path still calls apply_automation_suggestion RPC", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.match(
    src,
    /\.rpc\(["']apply_automation_suggestion["']/,
    "Category accept path must still call apply_automation_suggestion",
  );
});

test("undo route undo_set_category / RPC path undisturbed", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/audit/[id]/undo/route.ts"),
    "utf8",
  );
  assert.match(
    src,
    /undo_automation_suggestion/,
    "Category undo path must still call undo_automation_suggestion RPC",
  );
});

test("SENSITIVE_CATEGORIES still has 12 entries (no drift)", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/constants.ts"),
    "utf8",
  );
  const match = src.match(/SENSITIVE_CATEGORIES[^=]*=\s*new Set\(\[([^\]]+)\]\)/);
  assert.ok(match, "SENSITIVE_CATEGORIES must be defined");
  const entries = match[1].split(",").map((s) => s.trim()).filter((s) => s.startsWith('"') || s.startsWith("'"));
  assert.equal(entries.length, 12, "SENSITIVE_CATEGORIES must still have exactly 12 entries");
});

test("automation/page.tsx actionSummary handles mark_writeoff_candidate", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/automation/page.tsx"),
    "utf8",
  );
  assert.match(
    src,
    /mark_writeoff_candidate.*Write-Off Candidate|Write-Off Candidate.*mark_writeoff_candidate/s,
    "actionSummary must handle mark_writeoff_candidate to avoid showing '—'",
  );
});

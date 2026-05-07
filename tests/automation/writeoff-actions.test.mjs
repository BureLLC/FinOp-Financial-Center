/**
 * Write-Off Action Regression Tests
 *
 * Verifies the Verify / Edit / Delete button paths on the Write-Offs page
 * for both transaction-derived and manually-linked entries.
 *
 * All logic is inlined or read from source files — no runtime DB calls.
 *
 * Run with: node --test tests/automation/writeoff-actions.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const PAGE_SRC = readFileSync(
  path.join(ROOT, "app/dashboard/write-offs/page.tsx"),
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
const ENSURE_SRC = readFileSync(
  path.join(ROOT, "app/api/write-offs/ensure-row/route.ts"),
  "utf8",
);
const MARK_SRC = readFileSync(
  path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
  "utf8",
);

// ═══════════════════════════════════════════════════════════════════════════
// 1. RawWriteOff interface includes action-required fields
// ═══════════════════════════════════════════════════════════════════════════

test("RawWriteOff includes transaction_id field", () => {
  assert.match(CALCS_SRC, /transaction_id\??\s*:\s*string\s*\|\s*null/,
    "RawWriteOff must have transaction_id?: string | null");
});

test("RawWriteOff includes description field", () => {
  assert.match(CALCS_SRC, /description\??\s*:\s*string\s*\|\s*null/,
    "RawWriteOff must have description?: string | null");
});

test("RawWriteOff includes notes field", () => {
  assert.match(CALCS_SRC, /notes\??\s*:\s*string\s*\|\s*null/,
    "RawWriteOff must have notes?: string | null");
});

test("RawWriteOff includes category field", () => {
  assert.match(CALCS_SRC, /category\??\s*:\s*string\s*\|\s*null/,
    "RawWriteOff must have category?: string | null");
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. getCanonicalCombinedWriteOffs fetches all display-critical fields
// ═══════════════════════════════════════════════════════════════════════════

test("getCanonicalCombinedWriteOffs selects description from write_offs", () => {
  assert.match(CANONICAL_SRC, /select\(["'][^"']*description[^"']*["']\)/,
    "write_offs select must include description");
});

test("getCanonicalCombinedWriteOffs selects notes from write_offs", () => {
  assert.match(CANONICAL_SRC, /select\(["'][^"']*notes[^"']*["']\)/,
    "write_offs select must include notes");
});

test("getCanonicalCombinedWriteOffs selects category from write_offs", () => {
  assert.match(CANONICAL_SRC, /select\(["'][^"']*category[^"']*["']\)/,
    "write_offs select must include category");
});

test("getCanonicalCombinedWriteOffs selects transaction_id from write_offs", () => {
  assert.match(CANONICAL_SRC, /select\(["'][^"']*transaction_id[^"']*["']\)/,
    "write_offs select must include transaction_id");
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. loadData maps real DB values — does NOT hardcode null or display labels
// ═══════════════════════════════════════════════════════════════════════════

test("loadData uses actual DB description for manual entries (no hardcoded null)", () => {
  // The description for manual entries must come from wo.description or similar, not literal null
  assert.doesNotMatch(PAGE_SRC, /description:\s*null,\s*\/\/.*Manual/,
    "description must not be hardcoded null for manual entries");
  // Positive: must use wo.description or (wo as any).description
  assert.match(PAGE_SRC, /description:\s*\(wo as any\)\.description\s*\?\?/,
    "manual entries must map description from the write_offs row");
});

test("loadData uses actual DB category for manual entries (no hardcoded 'Manual Entry')", () => {
  assert.doesNotMatch(PAGE_SRC, /category:\s*"Manual Entry",\s*\n/,
    "category must not be hardcoded to 'Manual Entry' literal for all manual entries");
  // Positive: must use wo.category or (wo as any).category
  assert.match(PAGE_SRC, /category:\s*\(wo as any\)\.category\s*\?\?/,
    "manual entries must map category from the write_offs row");
});

test("loadData uses actual DB notes for manual entries (no hardcoded null)", () => {
  assert.doesNotMatch(PAGE_SRC, /notes:\s*null,\s*\/\/.*Manual/,
    "notes must not be hardcoded null for manual entries");
  assert.match(PAGE_SRC, /notes:\s*\(wo as any\)\.notes\s*\?\?/,
    "manual entries must map notes from the write_offs row");
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. tx-based entries: expense_date is truncated to YYYY-MM-DD
// ═══════════════════════════════════════════════════════════════════════════

test("tx-based entry expense_date truncated to YYYY-MM-DD (not raw ISO timestamp)", () => {
  assert.match(PAGE_SRC, /\.substring\(0,\s*10\)/,
    "expense_date for tx-based entries must call .substring(0, 10)");
  assert.doesNotMatch(PAGE_SRC, /expense_date:\s*tx\.transaction_date\s*\?\?\s*""/,
    "must not use raw transaction_date without truncation");
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. toggleVerified has error handling on the Supabase update
// ═══════════════════════════════════════════════════════════════════════════

test("toggleVerified captures and surfaces update error", () => {
  // Extract the toggleVerified function body
  const match = PAGE_SRC.match(/const toggleVerified\s*=[\s\S]{0,800}?await loadData\(\)/);
  assert.ok(match, "toggleVerified function body must be extractable");
  const body = match[0];
  assert.match(body, /const \{ error \}.*update\(/s,
    "toggleVerified must destructure error from the Supabase update call");
  assert.match(body, /if \(error\)/,
    "toggleVerified must check the error before calling loadData");
  assert.match(body, /setListError/,
    "toggleVerified must call setListError on failure");
});

test("toggleVerified does not call loadData when update fails", () => {
  const match = PAGE_SRC.match(/const toggleVerified\s*=[\s\S]{0,800}?await loadData\(\)/);
  assert.ok(match, "toggleVerified function body must be extractable");
  const body = match[0];
  // The error branch must return before loadData
  assert.match(body, /if \(error\)\s*\{[^}]*return;/s,
    "toggleVerified must return early when update fails (before loadData)");
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. ensureWriteOffRow sends a proper category — not display labels
// ═══════════════════════════════════════════════════════════════════════════

test("ensureWriteOffRow blocks 'Transaction-Based' and 'Manual Entry' display labels from being stored", () => {
  const match = PAGE_SRC.match(/const ensureWriteOffRow[\s\S]{0,1200}?return \(data\.id/);
  assert.ok(match, "ensureWriteOffRow function body must be extractable");
  const body = match[0];
  assert.match(body, /Transaction-Based/,
    "ensureWriteOffRow must reference 'Transaction-Based' to filter it out");
  assert.match(body, /Manual Entry/,
    "ensureWriteOffRow must reference 'Manual Entry' to filter it out");
  assert.match(body, /storedCategory/,
    "ensureWriteOffRow must use storedCategory (not wo.category) in the request body");
});

test("ensureWriteOffRow sends storedCategory in POST body, not wo.category", () => {
  const match = PAGE_SRC.match(/const ensureWriteOffRow[\s\S]{0,1200}?return \(data\.id/);
  assert.ok(match, "ensureWriteOffRow function body must be extractable");
  const body = match[0];
  assert.match(body, /category:\s*storedCategory/,
    "POST body must use storedCategory, not wo.category");
  assert.doesNotMatch(body, /category:\s*wo\.category/,
    "POST body must not use wo.category directly");
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. deleteWriteOff path separation — tx-based vs manual
// ═══════════════════════════════════════════════════════════════════════════

test("deleteWriteOff has separate path for tx-based (id === transaction_id)", () => {
  const match = PAGE_SRC.match(/const deleteWriteOff[\s\S]{0,2500}?await loadData\(\);\s*\}/);
  assert.ok(match, "deleteWriteOff function body must be extractable");
  const body = match[0];
  assert.match(body, /wo\.id\s*===\s*wo\.transaction_id/,
    "deleteWriteOff must have explicit tx-based branch (id === transaction_id)");
});

test("deleteWriteOff tx-based path sets is_writeoff_candidate = false (not deletes transaction)", () => {
  const match = PAGE_SRC.match(/const deleteWriteOff[\s\S]{0,2500}?await loadData\(\);\s*\}/);
  assert.ok(match, "deleteWriteOff function body must be extractable");
  const body = match[0];
  assert.match(body, /is_writeoff_candidate:\s*false/,
    "deleteWriteOff tx-based path must set is_writeoff_candidate = false");
  assert.doesNotMatch(body, /\.delete\(\).*transaction/s,
    "deleteWriteOff must never delete the source transaction");
});

test("deleteWriteOff manual path deletes write_offs row by id", () => {
  const match = PAGE_SRC.match(/const deleteWriteOff[\s\S]{0,2500}?await loadData\(\);\s*\}/);
  assert.ok(match, "deleteWriteOff function body must be extractable");
  const body = match[0];
  assert.match(body, /from\("write_offs"\)\.delete\(\)\.eq\("id",\s*wo\.id\)/,
    "deleteWriteOff manual path must delete write_offs row by wo.id");
});

test("deleteWriteOff surfaces errors via setListError on both paths", () => {
  const match = PAGE_SRC.match(/const deleteWriteOff[\s\S]{0,2500}?await loadData\(\);\s*\}/);
  assert.ok(match, "deleteWriteOff function body must be extractable");
  const body = match[0];
  const errorMatches = body.match(/setListError/g);
  assert.ok(errorMatches && errorMatches.length >= 2,
    "deleteWriteOff must call setListError in at least 2 error paths");
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. saveEdit path — ensureWriteOffRow + error surfacing
// ═══════════════════════════════════════════════════════════════════════════

test("saveEdit calls ensureWriteOffRow before updating write_offs", () => {
  const match = PAGE_SRC.match(/const saveEdit[\s\S]{0,1500}?setEditSaving\(false\);\s*\};/);
  assert.ok(match, "saveEdit function body must be extractable");
  const body = match[0];
  assert.match(body, /ensureWriteOffRow/,
    "saveEdit must call ensureWriteOffRow to resolve the real write_offs id");
});

test("saveEdit surfaces 'Failed to save' on Supabase update error", () => {
  const match = PAGE_SRC.match(/const saveEdit[\s\S]{0,1500}?setEditSaving\(false\);\s*\};/);
  assert.ok(match, "saveEdit function body must be extractable");
  const body = match[0];
  assert.match(body, /Failed to save/,
    "saveEdit must set an error message when the update fails");
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. ensure-row route: does not modify transaction fields
// ═══════════════════════════════════════════════════════════════════════════

test("ensure-row route writes to write_offs only — never updates transactions", () => {
  assert.doesNotMatch(ENSURE_SRC, /from\(["']transactions["']\).*\.update/s,
    "ensure-row route must never update the transactions table");
});

test("ensure-row route requires transaction_id in request body", () => {
  assert.match(ENSURE_SRC, /transaction_id/,
    "ensure-row route must accept and use transaction_id");
  assert.match(ENSURE_SRC, /transaction_id required/,
    "ensure-row route must return 400 when transaction_id is missing");
});

test("ensure-row route checks transaction ownership before write", () => {
  assert.match(ENSURE_SRC, /Unauthorized/,
    "ensure-row route must have an ownership check that can return Unauthorized");
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. mark-writeoff-candidate: upserts write_offs row for immediate action
// ═══════════════════════════════════════════════════════════════════════════

test("mark-writeoff-candidate route creates a write_offs row on first tag", () => {
  assert.match(MARK_SRC, /from\("write_offs"\)\.insert/,
    "mark-writeoff-candidate must insert a write_offs row so Verify/Edit/Delete work immediately");
});

test("mark-writeoff-candidate write_offs insert is idempotent (only inserts if no existing row)", () => {
  assert.match(MARK_SRC, /existingWoRows/,
    "mark-writeoff-candidate must check for an existing write_offs row before inserting");
  assert.match(MARK_SRC, /existingWoRows\.length === 0/,
    "must guard the insert with a length check");
});

test("mark-writeoff-candidate does not write category/subcategory/direction/amount on transaction", () => {
  assert.doesNotMatch(MARK_SRC, /\.update\([^)]*category/, "must not write category");
  assert.doesNotMatch(MARK_SRC, /\.update\([^)]*subcategory/, "must not write subcategory");
  assert.doesNotMatch(MARK_SRC, /\.update\([^)]*direction/, "must not write direction");
  assert.doesNotMatch(MARK_SRC, /\.update\([^)]*amount/, "must not write amount");
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. Pure logic: ensureWriteOffRow branching
// ═══════════════════════════════════════════════════════════════════════════

// Inline the branch logic to test it independently
function resolveWriteOffId(wo) {
  if (!wo.transaction_id || wo.id !== wo.transaction_id) return { direct: true, id: wo.id };
  return { direct: false, id: null }; // would call API
}

test("pure logic: manual entry (id !== transaction_id) resolves directly without API", () => {
  const wo = { id: "wo-uuid-111", transaction_id: "tx-uuid-222" };
  const result = resolveWriteOffId(wo);
  assert.equal(result.direct, true, "manual entry must resolve directly");
  assert.equal(result.id, "wo-uuid-111", "must return the write_offs UUID");
});

test("pure logic: tx-based entry (id === transaction_id) requires API call", () => {
  const wo = { id: "tx-uuid-333", transaction_id: "tx-uuid-333" };
  const result = resolveWriteOffId(wo);
  assert.equal(result.direct, false, "tx-based entry must go through API");
});

test("pure logic: entry with no transaction_id resolves directly", () => {
  const wo = { id: "wo-uuid-444", transaction_id: null };
  const result = resolveWriteOffId(wo);
  assert.equal(result.direct, true, "entry without transaction_id resolves directly");
  assert.equal(result.id, "wo-uuid-444", "must return its own id");
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. Pure logic: storedCategory guard filters display labels
// ═══════════════════════════════════════════════════════════════════════════

const DISPLAY_LABELS = new Set(["Transaction-Based", "Manual Entry"]);

function deriveStoredCategory(wo, deductionLabel) {
  const cat = wo.category;
  if (!cat || DISPLAY_LABELS.has(cat)) {
    return wo.description ?? deductionLabel ?? "Business Expense";
  }
  return cat;
}

test("pure logic: 'Transaction-Based' category is replaced with description", () => {
  const wo = { category: "Transaction-Based", description: "Office Depot", deduction_type: "other" };
  const result = deriveStoredCategory(wo, "Other Business Expense");
  assert.equal(result, "Office Depot", "display label must be replaced by description");
});

test("pure logic: 'Manual Entry' category is replaced with deduction type label", () => {
  const wo = { category: "Manual Entry", description: null, deduction_type: "equipment" };
  const result = deriveStoredCategory(wo, "Equipment & Hardware");
  assert.equal(result, "Equipment & Hardware", "display label must be replaced by deduction label");
});

test("pure logic: real category passes through unchanged", () => {
  const wo = { category: "Software Subscription", description: "Notion", deduction_type: "software" };
  const result = deriveStoredCategory(wo, "Software & Subscriptions");
  assert.equal(result, "Software Subscription", "real category must pass through");
});

test("pure logic: null category falls back to description then deduction label", () => {
  const wo = { category: null, description: null, deduction_type: "travel" };
  const result = deriveStoredCategory(wo, "Business Travel");
  assert.equal(result, "Business Travel", "null category with null description uses deduction label");
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. Protected fields: write-offs page never writes financial fields
// ═══════════════════════════════════════════════════════════════════════════

test("write-offs page Verify path does not write transaction category or direction", () => {
  const verifyMatch = PAGE_SRC.match(/const toggleVerified[\s\S]{0,600}?await loadData/);
  assert.ok(verifyMatch, "toggleVerified body extractable");
  const body = verifyMatch[0];
  assert.doesNotMatch(body, /category/, "Verify must not write category");
  assert.doesNotMatch(body, /direction/, "Verify must not write direction");
  assert.doesNotMatch(body, /amount/, "Verify must not write amount");
});

test("write-offs page Delete tx-based path does not update transaction category", () => {
  const deleteMatch = PAGE_SRC.match(/wo\.id\s*===\s*wo\.transaction_id[\s\S]{0,400}?return;/);
  assert.ok(deleteMatch, "tx-based delete branch extractable");
  const body = deleteMatch[0];
  assert.doesNotMatch(body, /category/, "tx-based delete must not write category");
  assert.doesNotMatch(body, /amount/, "tx-based delete must not write amount");
  assert.match(body, /is_writeoff_candidate/, "tx-based delete must only write is_writeoff_candidate");
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. Regression: no prohibited areas touched
// ═══════════════════════════════════════════════════════════════════════════

test("canonicalFinancialData.ts still has is_writeoff_candidate !== false filter", () => {
  assert.match(CANONICAL_SRC, /is_writeoff_candidate\s*!==\s*false/,
    "canonical layer must still exclude is_writeoff_candidate === false entries");
});

test("financialCalculations.ts still has is_writeoff_candidate on RawTransaction", () => {
  assert.match(CALCS_SRC, /is_writeoff_candidate\?\s*:\s*boolean\s*\|\s*null/,
    "RawTransaction must still include is_writeoff_candidate");
});

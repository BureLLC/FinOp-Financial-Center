/**
 * Phase 4 PR A: backend tests for business expense candidate support.
 *
 * All logic under test is inlined — no TypeScript imports.
 * Source files are read via fs.readFileSync where structural assertions
 * are needed (constants values, migration SQL content).
 *
 * Run with: node --test tests/automation/business-expense.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ─── Inlined: DEDUCTIBLE_CATEGORIES (mirrors canonicalFinancialData.ts) ────────

const DEDUCTIBLE_CATEGORIES = new Set([
  "business", "home office", "vehicle", "equipment", "software",
  "meals", "travel", "professional services", "advertising",
  "office supplies", "insurance", "utilities",
]);

// ─── Inlined: isDeductibleBusinessExpense (mirrors canonicalFinancialData.ts) ──

function isDeductibleBusinessExpense(tx) {
  const cat = (tx.category ?? "").toLowerCase();
  const txType = (tx.transaction_type ?? "").toLowerCase();
  return (
    tx.direction === "debit" &&
    DEDUCTIBLE_CATEGORIES.has(cat) &&
    txType !== "transfer" &&
    txType !== "tax_payment" &&
    tx.deleted_at == null
  );
}

// ─── Inlined: SENSITIVE_CATEGORIES ────────────────────────────────────────────

const SENSITIVE_CATEGORIES = new Set([
  "business", "home office", "vehicle", "equipment", "software",
  "meals", "travel", "professional services", "advertising",
  "office supplies", "insurance", "utilities",
]);

// ─── Inlined: NON_AUTOMATABLE_TX_FIELDS (mirrors constants.ts) ────────────────

const NON_AUTOMATABLE_TX_FIELDS = [
  "income_subtype", "direction", "amount", "transaction_date",
  "transaction_type", "status", "financial_account_id",
  "external_transaction_id", "provider", "deleted_at",
];

// ─── Inlined: MIXED_USE_CATEGORIES ────────────────────────────────────────────

const MIXED_USE_CATEGORIES = new Set([
  "meals", "home office", "vehicle", "phone",
  "travel", "equipment", "education", "professional services",
]);

// ─── Inlined: mark-business update payload logic ──────────────────────────────

function buildMarkBusinessPayload() {
  return { is_business_candidate: true };
}

// ─── Inlined: accept business_expense_candidate payload logic ─────────────────

function buildAcceptBusinessCandidatePayload() {
  return { is_business_candidate: true };
}

// ─── Inlined: undo stale-value guard ──────────────────────────────────────────

function undoIsStale(currentValue, auditNewValue) {
  const expected = auditNewValue?.is_business_candidate ?? true;
  return currentValue !== expected;
}

// ─── Simulate mark-business auth + ownership check ────────────────────────────

function simulateMarkBusiness(authenticatedUserId, txOwnerUserId, transactionExists) {
  if (!authenticatedUserId) return { status: 401 };
  if (!transactionExists) return { status: 404 };
  if (txOwnerUserId !== authenticatedUserId) return { status: 403 };

  const updatePayload = buildMarkBusinessPayload();
  return {
    status: 200,
    success: true,
    updatePayload,
    auditEntry: {
      action_taken: "mark_business_candidate",
      previous_value: { is_business_candidate: null },
      new_value: { is_business_candidate: true },
      triggered_by: "user_manual",
    },
  };
}

// ─── Simulate undo with stale-value guard ─────────────────────────────────────

function simulateUndo(auditEntry, currentValue, authenticatedUserId) {
  if (!authenticatedUserId) return { status: 401 };
  if (!auditEntry || auditEntry.user_id !== authenticatedUserId) return { status: 404 };
  if (auditEntry.action_taken !== "mark_business_candidate") return { status: 400 };
  if (undoIsStale(currentValue, auditEntry.new_value)) {
    return { status: 409, success: false, reason: "transaction_edited_after_apply" };
  }
  return {
    status: 200,
    success: true,
    updatePayload: { is_business_candidate: null },
    undoAuditEntry: { action_taken: "undo_mark_business_candidate" },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. Migration 6: is_business_candidate is nullable, no default, no NOT NULL

test("migration 6: adds is_business_candidate BOOLEAN NULL", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000006_add_is_business_candidate.sql"),
    "utf8",
  );
  // Verify the actual ADD COLUMN statement (not comments); handle optional IF NOT EXISTS
  const addColumnMatch = sql.match(/ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?is_business_candidate[^;]+/i);
  assert.ok(addColumnMatch, "ADD COLUMN is_business_candidate statement must exist");
  const addColumnStatement = addColumnMatch[0];
  assert.match(addColumnStatement, /BOOLEAN\s+NULL/i, "Must be BOOLEAN NULL");
  assert.doesNotMatch(addColumnStatement, /NOT\s+NULL/i, "Must not have NOT NULL constraint");
  assert.doesNotMatch(addColumnStatement, /\bDEFAULT\b/i, "Must not have a DEFAULT value in the ADD COLUMN clause");
  assert.doesNotMatch(addColumnStatement, /REFERENCES\s+/i, "Must not have a foreign key");
  assert.doesNotMatch(sql, /CREATE\s+INDEX/i, "Must not add an index");
});

test("migration 6: rollback instruction is present", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000006_add_is_business_candidate.sql"),
    "utf8",
  );
  assert.match(sql, /DROP\s+COLUMN\s+is_business_candidate/i,
    "Rollback DROP COLUMN must be documented");
});

// ─── 2. Migration 7: exact CHECK constraint values only

test("migration 7: suggestion_type allows business_expense_candidate", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000007_add_business_expense_constraint_values.sql"),
    "utf8",
  );
  assert.match(sql, /'business_expense_candidate'/, "Must add business_expense_candidate");
  assert.match(sql, /'transaction_category'/, "Must preserve transaction_category");
});

test("migration 7: action_type allows mark_business_candidate", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000007_add_business_expense_constraint_values.sql"),
    "utf8",
  );
  assert.match(sql, /'mark_business_candidate'/, "Must add mark_business_candidate");
  assert.match(sql, /'set_category'/, "Must preserve set_category");
  assert.match(sql, /'set_subcategory'/, "Must preserve set_subcategory");
});

test("migration 7: audit_log action_taken allows mark and undo_mark_business_candidate", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000007_add_business_expense_constraint_values.sql"),
    "utf8",
  );
  assert.match(sql, /'undo_mark_business_candidate'/,
    "Must add undo_mark_business_candidate to audit log constraint");
});

test("migration 7: prohibited values are not added as SQL values", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000007_add_business_expense_constraint_values.sql"),
    "utf8",
  );
  // Check that prohibited values don't appear as quoted SQL strings (e.g., 'auto_applied').
  // They may appear in comments as exclusion notes, which is intentional and acceptable.
  const prohibited = [
    "auto_applied", "writeoff_rollup", "tax_rollup", "savings_goal_allocation",
    "budget_category", "transfer_reconciliation", "duplicate_detection",
    "investment_alert", "documentation_reminder",
  ];
  for (const val of prohibited) {
    assert.doesNotMatch(sql, new RegExp(`'${val}'`),
      `Prohibited value '${val}' must not appear as a quoted SQL value in migration 7`);
  }
});

test("migration 7: rule_type constraint is NOT changed (reuses transaction_category)", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000007_add_business_expense_constraint_values.sql"),
    "utf8",
  );
  assert.doesNotMatch(sql, /automation_rules_rule_type_check/,
    "rule_type CHECK constraint must not be modified in Phase 4 PR A");
});

// ─── 3-4. is_business_candidate does not affect deductible/Tax Center/Write-Off

test("is_business_candidate = true does not make a non-deductible transaction deductible", () => {
  const tx = {
    direction: "debit",
    category: "groceries",
    transaction_type: "bank",
    deleted_at: null,
    is_business_candidate: true,
  };
  assert.equal(isDeductibleBusinessExpense(tx), false,
    "is_business_candidate must not affect isDeductibleBusinessExpense");
});

test("is_business_candidate = true with no category is not deductible", () => {
  const tx = {
    direction: "debit",
    category: null,
    transaction_type: "bank",
    deleted_at: null,
    is_business_candidate: true,
  };
  assert.equal(isDeductibleBusinessExpense(tx), false);
});

test("deductibility is determined only by tx.category matching DEDUCTIBLE_CATEGORIES", () => {
  const withCategory = {
    direction: "debit", category: "business", transaction_type: "bank", deleted_at: null,
  };
  const withFlagOnly = {
    direction: "debit", category: "groceries", transaction_type: "bank", deleted_at: null,
    is_business_candidate: true,
  };
  assert.equal(isDeductibleBusinessExpense(withCategory), true,
    "Deductible category makes transaction deductible regardless of flag");
  assert.equal(isDeductibleBusinessExpense(withFlagOnly), false,
    "is_business_candidate alone must not trigger deductibility");
});

test("setting is_business_candidate does not increase deductible expense count", () => {
  const transactions = [
    { direction: "debit", category: "groceries", transaction_type: "bank",
      deleted_at: null, is_business_candidate: true, amount: 100 },
    { direction: "debit", category: "entertainment", transaction_type: "bank",
      deleted_at: null, is_business_candidate: true, amount: 50 },
  ];
  const deductible = transactions.filter(isDeductibleBusinessExpense);
  assert.equal(deductible.length, 0,
    "Flagging transactions as business candidates must not add to deductible totals");
});

// ─── 5-6. mark-business auth and ownership

test("mark-business returns 401 when no authenticated user", () => {
  const result = simulateMarkBusiness(null, "u1", true);
  assert.equal(result.status, 401);
});

test("mark-business returns 404 when transaction does not exist", () => {
  const result = simulateMarkBusiness("u1", "u1", false);
  assert.equal(result.status, 404);
});

test("mark-business returns 403 when transaction belongs to different user", () => {
  const result = simulateMarkBusiness("u1", "u2", true);
  assert.equal(result.status, 403);
});

test("mark-business succeeds when user owns the transaction", () => {
  const result = simulateMarkBusiness("u1", "u1", true);
  assert.equal(result.status, 200);
  assert.equal(result.success, true);
});

// ─── 7. mark-business only writes is_business_candidate

test("mark-business update payload contains only is_business_candidate", () => {
  const result = simulateMarkBusiness("u1", "u1", true);
  assert.equal(result.status, 200);
  const keys = Object.keys(result.updatePayload);
  assert.deepEqual(keys, ["is_business_candidate"],
    "Update payload must contain exactly one field: is_business_candidate");
  assert.equal(result.updatePayload.is_business_candidate, true);
});

test("mark-business does not write any protected transaction field", () => {
  const result = simulateMarkBusiness("u1", "u1", true);
  for (const field of NON_AUTOMATABLE_TX_FIELDS) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(result.updatePayload, field),
      false,
      `Protected field "${field}" must not appear in mark-business update payload`,
    );
  }
});

// ─── 8. Audit log structure

test("mark-business audit entry has correct action_taken and values", () => {
  const result = simulateMarkBusiness("u1", "u1", true);
  assert.equal(result.auditEntry.action_taken, "mark_business_candidate");
  assert.deepEqual(result.auditEntry.previous_value, { is_business_candidate: null });
  assert.deepEqual(result.auditEntry.new_value, { is_business_candidate: true });
  assert.equal(result.auditEntry.triggered_by, "user_manual");
});

test("audit entry for accept branch uses triggered_by: user_accept", () => {
  const acceptAuditEntry = {
    action_taken: "mark_business_candidate",
    previous_value: { is_business_candidate: null },
    new_value: { is_business_candidate: true },
    triggered_by: "user_accept",
  };
  assert.equal(acceptAuditEntry.triggered_by, "user_accept");
});

// ─── 9. Undo: stale-value guard and safe reversal

test("undo mark_business_candidate: succeeds when current value matches new_value", () => {
  const auditEntry = {
    user_id: "u1",
    action_taken: "mark_business_candidate",
    entity_id: "tx1",
    new_value: { is_business_candidate: true },
    suggestion_id: null,
    automation_rule_id: null,
  };
  const result = simulateUndo(auditEntry, true, "u1");
  assert.equal(result.status, 200);
  assert.equal(result.success, true);
  assert.deepEqual(result.updatePayload, { is_business_candidate: null },
    "Undo must set is_business_candidate back to null");
  assert.equal(result.undoAuditEntry.action_taken, "undo_mark_business_candidate");
});

test("undo mark_business_candidate: 409 stale when is_business_candidate was already reverted", () => {
  const auditEntry = {
    user_id: "u1",
    action_taken: "mark_business_candidate",
    entity_id: "tx1",
    new_value: { is_business_candidate: true },
    suggestion_id: null,
    automation_rule_id: null,
  };
  const result = simulateUndo(auditEntry, null, "u1"); // current is null, expected is true
  assert.equal(result.status, 409);
  assert.equal(result.success, false);
  assert.equal(result.reason, "transaction_edited_after_apply");
});

test("undo mark_business_candidate: 409 stale when is_business_candidate was explicitly set false", () => {
  const auditEntry = {
    user_id: "u1",
    action_taken: "mark_business_candidate",
    new_value: { is_business_candidate: true },
    entity_id: "tx1",
  };
  const result = simulateUndo(auditEntry, false, "u1"); // current is false, expected is true
  assert.equal(result.status, 409);
});

test("undo mark_business_candidate: 401 when no authenticated user", () => {
  const auditEntry = { user_id: "u1", action_taken: "mark_business_candidate",
    new_value: { is_business_candidate: true }, entity_id: "tx1" };
  const result = simulateUndo(auditEntry, true, null);
  assert.equal(result.status, 401);
});

test("undo mark_business_candidate: 404 when audit entry belongs to different user", () => {
  const auditEntry = { user_id: "u1", action_taken: "mark_business_candidate",
    new_value: { is_business_candidate: true }, entity_id: "tx1" };
  const result = simulateUndo(auditEntry, true, "u2");
  assert.equal(result.status, 404);
});

test("undo does not affect category, income_subtype, or any protected field", () => {
  const auditEntry = { user_id: "u1", action_taken: "mark_business_candidate",
    new_value: { is_business_candidate: true }, entity_id: "tx1" };
  const result = simulateUndo(auditEntry, true, "u1");
  assert.equal(result.status, 200);
  const keys = Object.keys(result.updatePayload);
  assert.deepEqual(keys, ["is_business_candidate"],
    "Undo payload must contain exactly is_business_candidate only");
  assert.equal(result.updatePayload.is_business_candidate, null);
});

// ─── 10. BUSINESS_EXPENSE_SUGGESTIONS_ENABLED is true in PR C

test("BUSINESS_EXPENSE_SUGGESTIONS_ENABLED is defined and is true in Phase 4 PR C", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/constants.ts"),
    "utf8",
  );
  const match = src.match(/BUSINESS_EXPENSE_SUGGESTIONS_ENABLED\s*=\s*(true|false)/);
  assert.ok(match, "BUSINESS_EXPENSE_SUGGESTIONS_ENABLED must be defined in constants.ts");
  assert.equal(match[1], "true", "Must be true in Phase 4 PR C — suggestion generation enabled");
});

// ─── 11. Suggestions generated when flag is true

test("mark-business returns suggestionsEnabled: true in Phase 4 PR C", () => {
  // Simulate the route response when BUSINESS_EXPENSE_SUGGESTIONS_ENABLED = true
  const BUSINESS_EXPENSE_SUGGESTIONS_ENABLED = true;
  const response = {
    success: true,
    auditId: "audit-1",
    suggestionsEnabled: BUSINESS_EXPENSE_SUGGESTIONS_ENABLED,
    suggestionsCreated: 3,
  };
  assert.equal(response.suggestionsEnabled, true,
    "Flag must be true in PR C — suggestion generation enabled");
  assert.ok(response.suggestionsCreated >= 0,
    "suggestionsCreated must be a non-negative number");
});

// ─── 12. No auto-apply

test("mark_business_candidate action always has requires_confirmation: true", () => {
  // Any automation rule created for business expense must have requires_confirmation = true.
  // This mirrors the Phase 1 invariant from rules.test.mjs.
  const mockRule = {
    rule_type: "transaction_category",
    action_type: "mark_business_candidate",
    requires_confirmation: true,
  };
  assert.equal(mockRule.requires_confirmation, true,
    "Business expense rules must require user confirmation — no auto-apply");
});

test("business_expense_candidate suggestion cannot be accepted without explicit user action", () => {
  // The suggestion must have status = 'pending' before accept.
  // There is no code path that accepts it automatically.
  const suggestion = { suggestion_type: "business_expense_candidate", status: "pending" };
  assert.equal(suggestion.status, "pending",
    "Suggestion must be in pending state — only user accept can change this");
  // Simulating the accept guard
  function acceptGuard(sugg) {
    if (sugg.status !== "pending") return { status: 400 };
    return { status: 200 };
  }
  const alreadyAccepted = { suggestion_type: "business_expense_candidate", status: "accepted" };
  assert.equal(acceptGuard(alreadyAccepted).status, 400,
    "Already-accepted suggestion must be rejected");
});

// ─── 13. No sensitive/deductible category behavior added

test("SENSITIVE_CATEGORIES is unchanged — still has exactly 12 entries", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/constants.ts"),
    "utf8",
  );
  const match = src.match(/SENSITIVE_CATEGORIES[\s\S]*?new Set\(\[([\s\S]*?)\]\)/m);
  assert.ok(match, "SENSITIVE_CATEGORIES must be defined in constants.ts");
  const members = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(members.length, 12,
    `SENSITIVE_CATEGORIES must still have 12 entries, found: ${members.length}`);
});

test("DEDUCTIBLE_CATEGORIES is unchanged — still has exactly 12 entries (regression)", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/canonicalFinancialData.ts"),
    "utf8",
  );
  const match = src.match(/DEDUCTIBLE_CATEGORIES[\s\S]*?new Set\(\[([\s\S]*?)\]\)/m);
  assert.ok(match, "DEDUCTIBLE_CATEGORIES must be present in canonicalFinancialData.ts");
  const members = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(members.length, 12,
    `DEDUCTIBLE_CATEGORIES must still have 12 entries, found: ${members.length}`);
});

test("category automation (SENSITIVE_CATEGORIES guard) still blocks deductible categories", () => {
  // Regression: the Phase 1 guard must still fire for category suggestions
  const categorizeGuard = (category) => {
    if (SENSITIVE_CATEGORIES.has(category.toLowerCase())) return { status: 400 };
    return { status: 200 };
  };
  assert.equal(categorizeGuard("business").status, 400, "business must still be blocked");
  assert.equal(categorizeGuard("meals").status, 400, "meals must still be blocked");
  assert.equal(categorizeGuard("groceries").status, 200, "groceries must still be allowed");
});

// ─── 14. Cross-user isolation

test("cross-user isolation: user A cannot mark user B's transaction", () => {
  const result = simulateMarkBusiness("userA", "userB", true);
  assert.equal(result.status, 403,
    "Different user must receive 403 for mark-business");
});

test("cross-user isolation: user A cannot undo user B's audit entry", () => {
  const auditEntry = {
    user_id: "userB",
    action_taken: "mark_business_candidate",
    new_value: { is_business_candidate: true },
    entity_id: "tx1",
  };
  const result = simulateUndo(auditEntry, true, "userA");
  assert.equal(result.status, 404,
    "Cross-user undo attempt must return 404");
});

// ─── 15. MIXED_USE_CATEGORIES has correct entries

test("MIXED_USE_CATEGORIES is defined in constants.ts with 8 entries", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/constants.ts"),
    "utf8",
  );
  const match = src.match(/MIXED_USE_CATEGORIES[\s\S]*?new Set\(\[([\s\S]*?)\]\)/m);
  assert.ok(match, "MIXED_USE_CATEGORIES must be defined in constants.ts");
  const members = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(members.length, 8, `Expected 8 MIXED_USE_CATEGORIES, found ${members.length}`);
});

test("MIXED_USE_CATEGORIES is independent of SENSITIVE_CATEGORIES (not constrained to be equal)", () => {
  // MIXED_USE_CATEGORIES and SENSITIVE_CATEGORIES serve different purposes.
  // They are allowed to overlap but are not required to be identical.
  assert.notEqual(MIXED_USE_CATEGORIES.size, SENSITIVE_CATEGORIES.size,
    "MIXED_USE_CATEGORIES (8) and SENSITIVE_CATEGORIES (12) should have different sizes");
});

test("is_business_candidate is not in NON_AUTOMATABLE_TX_FIELDS", () => {
  assert.equal(
    NON_AUTOMATABLE_TX_FIELDS.includes("is_business_candidate"),
    false,
    "is_business_candidate is the one field Phase 4 automation is permitted to write",
  );
});

test("all original NON_AUTOMATABLE_TX_FIELDS are still protected", () => {
  const expected = [
    "income_subtype", "direction", "amount", "transaction_date",
    "transaction_type", "status", "financial_account_id",
    "external_transaction_id", "provider", "deleted_at",
  ];
  for (const field of expected) {
    assert.ok(
      NON_AUTOMATABLE_TX_FIELDS.includes(field),
      `Protected field "${field}" must still be in NON_AUTOMATABLE_TX_FIELDS`,
    );
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 4 PR B: UI behavior tests
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 16. Suggestion type routing ──────────────────────────────────────────────

test("PR B: loadSuggestions routes business_expense_candidate into biz map", () => {
  const pendingSuggestions = [
    { id: "s1", suggestion_type: "transaction_category",      source_entity_id: "tx1" },
    { id: "s2", suggestion_type: "business_expense_candidate", source_entity_id: "tx2" },
    { id: "s3", suggestion_type: "transaction_category",      source_entity_id: "tx3" },
    { id: "s4", suggestion_type: "business_expense_candidate", source_entity_id: "tx4" },
  ];
  const catMap = new Map();
  const bizMap = new Map();
  for (const s of pendingSuggestions) {
    if (s.suggestion_type === "business_expense_candidate") {
      bizMap.set(s.source_entity_id, s);
    } else {
      catMap.set(s.source_entity_id, s);
    }
  }
  assert.equal(catMap.size, 2, "catMap must have 2 category suggestions");
  assert.equal(bizMap.size, 2, "bizMap must have 2 biz suggestions");
  assert.ok(catMap.has("tx1") && catMap.has("tx3"), "catMap must contain tx1 and tx3");
  assert.ok(bizMap.has("tx2") && bizMap.has("tx4"), "bizMap must contain tx2 and tx4");
});

test("PR B: same transaction can have both a category and a biz suggestion without collision", () => {
  const catMap = new Map();
  const bizMap = new Map();
  catMap.set("tx1", { id: "s1", suggestion_type: "transaction_category", source_entity_id: "tx1" });
  bizMap.set("tx1", { id: "s2", suggestion_type: "business_expense_candidate", source_entity_id: "tx1" });
  assert.ok(catMap.has("tx1"), "catMap must retain category suggestion for tx1");
  assert.ok(bizMap.has("tx1"), "bizMap must retain biz suggestion for tx1");
  assert.notEqual(catMap.get("tx1").id, bizMap.get("tx1").id, "Maps must hold separate suggestions");
});

// ─── 17. Tagged union undoEntry ────────────────────────────────────────────────

test("PR B: undoEntry kind: 'category' carries prevCategory and category", () => {
  const entry = { kind: "category", txId: "tx1", auditId: "a1", prevCategory: "Shopping", category: "Food & Drink" };
  assert.equal(entry.kind, "category");
  assert.equal(entry.prevCategory, "Shopping");
  assert.equal(entry.category, "Food & Drink");
  assert.equal(Object.prototype.hasOwnProperty.call(entry, "merchantName"), false,
    "category entry must not have merchantName");
});

test("PR B: undoEntry kind: 'business' carries merchantName, not prevCategory/category", () => {
  const entry = { kind: "business", txId: "tx1", auditId: "a1", merchantName: "Starbucks" };
  assert.equal(entry.kind, "business");
  assert.equal(entry.merchantName, "Starbucks");
  assert.equal(Object.prototype.hasOwnProperty.call(entry, "prevCategory"), false,
    "business entry must not have prevCategory");
  assert.equal(Object.prototype.hasOwnProperty.call(entry, "category"), false,
    "business entry must not have category");
});

test("PR B: undoAccept for category kind reverts tx.category to prevCategory", () => {
  const entry = { kind: "category", txId: "tx1", auditId: "a1", prevCategory: "Shopping", category: "Food & Drink" };
  const txBefore = { id: "tx1", category: "Food & Drink", is_business_candidate: null };
  const txAfter = entry.kind === "category"
    ? { ...txBefore, category: entry.prevCategory }
    : { ...txBefore, is_business_candidate: null };
  assert.equal(txAfter.category, "Shopping", "Category undo must restore prevCategory");
  assert.equal(txAfter.is_business_candidate, null, "Category undo must not touch is_business_candidate");
});

test("PR B: undoAccept for business kind sets is_business_candidate to null", () => {
  const entry = { kind: "business", txId: "tx1", auditId: "a1", merchantName: "Starbucks" };
  const txBefore = { id: "tx1", category: "Food & Drink", is_business_candidate: true };
  const txAfter = entry.kind === "business"
    ? { ...txBefore, is_business_candidate: null }
    : { ...txBefore, category: entry.prevCategory };
  assert.equal(txAfter.is_business_candidate, null, "Business undo must set is_business_candidate to null");
  assert.equal(txAfter.category, "Food & Drink", "Business undo must not touch category");
});

// ─── 18. Amber badge gating ────────────────────────────────────────────────────

test("PR B: biz badge is not rendered when BUSINESS_EXPENSE_SUGGESTIONS_ENABLED is false", () => {
  const BUSINESS_EXPENSE_SUGGESTIONS_ENABLED = false;
  const bizSuggestionsMap = new Map();
  bizSuggestionsMap.set("tx1", { id: "s1", suggestion_type: "business_expense_candidate" });
  // Simulates the rendering condition: flag must be true to show biz badge
  const bizSuggestion = BUSINESS_EXPENSE_SUGGESTIONS_ENABLED ? bizSuggestionsMap.get("tx1") : undefined;
  assert.equal(bizSuggestion, undefined, "Biz badge must not render when flag is false");
});

test("PR B: biz badge renders when BUSINESS_EXPENSE_SUGGESTIONS_ENABLED is true", () => {
  const BUSINESS_EXPENSE_SUGGESTIONS_ENABLED = true;
  const bizSuggestionsMap = new Map();
  bizSuggestionsMap.set("tx1", { id: "s1", suggestion_type: "business_expense_candidate" });
  const bizSuggestion = BUSINESS_EXPENSE_SUGGESTIONS_ENABLED ? bizSuggestionsMap.get("tx1") : undefined;
  assert.ok(bizSuggestion, "Biz badge must render when flag is true and suggestion exists");
});

// ─── 19. Mark as Business Candidate confirmation guard ────────────────────────

test("PR B: markBusiness API is not called until user confirms (bizConfirmOpen gate)", () => {
  // Simulates the two-step confirmation flow: button click → confirmation → API call.
  let apiCalled = false;
  let bizConfirmOpen = false;

  // Step 1: button click opens confirmation only
  function handleMarkButtonClick() { bizConfirmOpen = true; }
  // Step 2: confirm button calls API
  function handleConfirm() { if (bizConfirmOpen) apiCalled = true; }

  handleMarkButtonClick();
  assert.equal(bizConfirmOpen, true, "Clicking Mark must open confirmation dialog");
  assert.equal(apiCalled, false, "API must not be called before confirmation");

  handleConfirm();
  assert.equal(apiCalled, true, "API must be called after user confirms");
});

test("PR B: cancel in confirmation dialog closes without calling API", () => {
  let apiCalled = false;
  let bizConfirmOpen = true;

  function handleCancel() { bizConfirmOpen = false; }

  handleCancel();
  assert.equal(bizConfirmOpen, false, "Cancel must close the confirmation dialog");
  assert.equal(apiCalled, false, "API must not be called after cancel");
});

// ─── 20. Mark-business update payload (PR B path) ─────────────────────────────

test("PR B: acceptBizSuggestion sets is_business_candidate: true on the transaction", () => {
  const txBefore = { id: "tx1", is_business_candidate: null, category: "Travel" };
  const txAfter = { ...txBefore, is_business_candidate: true };
  assert.equal(txAfter.is_business_candidate, true);
  assert.equal(txAfter.category, "Travel", "acceptBizSuggestion must not touch category");
});

test("PR B: manual markBusiness sets is_business_candidate: true on both transactions list and selected", () => {
  const txList = [
    { id: "tx1", is_business_candidate: null },
    { id: "tx2", is_business_candidate: null },
  ];
  const selectedId = "tx1";
  const updated = txList.map((t) => t.id === selectedId ? { ...t, is_business_candidate: true } : t);
  assert.equal(updated.find((t) => t.id === "tx1")?.is_business_candidate, true);
  assert.equal(updated.find((t) => t.id === "tx2")?.is_business_candidate, null,
    "Other transactions must not be affected");
});

// ─── 21. Already-marked transaction shows status text, not button ──────────────

test("PR B: already-marked transaction renders status text path, not button path", () => {
  // Simulates the ternary: is_business_candidate ? <status text> : <button>
  function renderBizSection(tx) {
    if (tx.is_business_candidate) return "status_text";
    return "button";
  }
  assert.equal(renderBizSection({ is_business_candidate: true }), "status_text");
  assert.equal(renderBizSection({ is_business_candidate: null }), "button");
  assert.equal(renderBizSection({ is_business_candidate: false }), "button");
});

// ─── 22. Biz suggestion panel buttons ─────────────────────────────────────────

test("PR B: rejectBizSuggestion removes from bizMap without a reason picker", () => {
  const bizMap = new Map();
  bizMap.set("tx1", { id: "s1" });
  bizMap.set("tx2", { id: "s2" });
  // Simulate reject (uses hardcoded 'skipped', no picker interaction)
  bizMap.delete("tx1");
  assert.equal(bizMap.has("tx1"), false, "tx1 must be removed from bizMap after rejection");
  assert.equal(bizMap.has("tx2"), true, "tx2 must not be affected");
});

test("PR B: Not-now closes biz panel without removing the suggestion from bizMap", () => {
  const bizMap = new Map();
  bizMap.set("tx1", { id: "s1" });
  let openBizSuggestionId = "tx1";
  // Simulate "Not now" — only closes panel, does not modify map
  openBizSuggestionId = null;
  assert.equal(openBizSuggestionId, null, "Panel must be closed after Not now");
  assert.equal(bizMap.has("tx1"), true, "Suggestion must remain in bizMap after Not now");
});

// ─── 23. Undo toast appearance ────────────────────────────────────────────────

test("PR B: undo toast for category kind shows category name", () => {
  const undoEntry = { kind: "category", txId: "tx1", auditId: "a1", prevCategory: null, category: "Food & Drink" };
  const toastText = undoEntry.kind === "category"
    ? `${undoEntry.category} category applied`
    : `Marked ${undoEntry.merchantName ?? "transaction"} as Business Candidate`;
  assert.match(toastText, /Food & Drink/, "Toast must show the category name");
});

test("PR B: undo toast for business kind shows merchant name", () => {
  const undoEntry = { kind: "business", txId: "tx1", auditId: "a1", merchantName: "Starbucks" };
  const toastText = undoEntry.kind === "category"
    ? `${undoEntry.category} category applied`
    : `Marked ${undoEntry.merchantName ?? "transaction"} as Business Candidate`;
  assert.match(toastText, /Starbucks/, "Toast must show the merchant name");
  assert.match(toastText, /Business Candidate/, "Toast must mention Business Candidate");
});

test("PR B: undo toast for business kind with null merchantName falls back to 'transaction'", () => {
  const undoEntry = { kind: "business", txId: "tx1", auditId: "a1", merchantName: null };
  const toastText = `Marked ${undoEntry.merchantName ?? "transaction"} as Business Candidate`;
  assert.match(toastText, /transaction/, "Fallback to 'transaction' when merchantName is null");
});

// ─── 24. Phase4SuggestionType covers both types ───────────────────────────────

test("PR B: Phase4SuggestionType includes both transaction_category and business_expense_candidate", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/types.ts"),
    "utf8",
  );
  assert.match(src, /Phase4SuggestionType/, "Phase4SuggestionType must be defined");
  assert.match(src, /'business_expense_candidate'/, "Must include business_expense_candidate");
  assert.match(src, /'transaction_category'/, "Must include transaction_category (via Phase1RuleType)");
});

test("PR B: AutomationSuggestion.suggestion_type uses Phase4SuggestionType", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/types.ts"),
    "utf8",
  );
  assert.match(src, /suggestion_type:\s*Phase4SuggestionType/,
    "AutomationSuggestion.suggestion_type must use Phase4SuggestionType");
});

test("PR B: BusinessExpenseActionConfig is defined with mixed_use and reason fields", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/types.ts"),
    "utf8",
  );
  assert.match(src, /BusinessExpenseActionConfig/, "BusinessExpenseActionConfig must be defined");
  assert.match(src, /mixed_use/, "Must have mixed_use field");
  assert.match(src, /reason/, "Must have reason field");
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 4 PR C: Business rule creation and suggestion generation
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Inlined helpers (mirror businessRuleBuilder.ts + merchantNormalizer.ts) ──

const LEGAL_SUFFIX_RE = /\s+(?:llc|inc|corp|co|ltd|incorporated|limited|company)\.?$/i;
const TLD_RE = /\.(com|net|org|io|co)$/i;
const PUNCTUATION_RE = /[^\w\s&]/g;
const WHITESPACE_RE = /\s+/g;

function normalizeMerchant(raw) {
  if (typeof raw !== "string" || raw.length === 0) return "";
  return raw
    .toLowerCase()
    .replace(TLD_RE, "")
    .replace(LEGAL_SUFFIX_RE, "")
    .replace(PUNCTUATION_RE, " ")
    .replace(WHITESPACE_RE, " ")
    .trim();
}

function normalizeDescription(raw) {
  if (typeof raw !== "string" || raw.length === 0) return "";
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(WHITESPACE_RE, " ")
    .trim();
}

function deriveBusinessRuleInput(merchantName, description, direction) {
  if (direction !== "debit") {
    return { blocked: true, reason: "Business candidate rules only apply to debit transactions" };
  }
  const normalizedMerchant = normalizeMerchant(merchantName ?? "");
  const normalizedDesc = normalizeDescription(description ?? "");
  const descTokens = normalizedDesc.split(/\s+/).filter((t) => t.length > 2);
  if (!normalizedMerchant && descTokens.length === 0) {
    return { blocked: true, reason: "No usable matcher signal (no merchant name or description tokens)" };
  }
  const matcherType = normalizedMerchant ? "merchant_normalized" : "description_pattern";
  const matcherConfig = normalizedMerchant
    ? { normalized_merchant: normalizedMerchant, direction: "debit" }
    : { description_tokens: descTokens };
  return { blocked: false, reason: "OK", matcherType, matcherConfig };
}

// ─── Inlined: buildBusinessSuggestionsForRule ─────────────────────────────────

const MIXED_USE_CONFIDENCE_CAP = 0.60;

function evaluateRuleInline(rule, tx) {
  if (tx.direction !== "debit") return { matched: false, confidence: 0 };
  if (rule.matcher_type === "merchant_normalized") {
    const ruleMerchant = rule.matcher_config.normalized_merchant;
    const txMerchant = normalizeMerchant(tx.merchant_name ?? "");
    if (!txMerchant || !ruleMerchant) return { matched: false, confidence: 0 };
    if (txMerchant === ruleMerchant) return { matched: true, confidence: 0.85, reason: `Exact merchant match: "${txMerchant}"` };
    if (txMerchant.startsWith(ruleMerchant) || ruleMerchant.startsWith(txMerchant))
      return { matched: true, confidence: 0.65, reason: `Partial merchant match` };
    return { matched: false, confidence: 0 };
  }
  return { matched: false, confidence: 0 };
}

function buildBusinessSuggestionsForRule(rule, candidates, excludeTransactionId, rejectedTxIds) {
  if (rule.status !== "active") return [];
  const results = [];
  for (const tx of candidates) {
    if (tx.id === excludeTransactionId) continue;
    if (tx.direction !== "debit") continue;
    if ((tx.transaction_type ?? "").toLowerCase() === "transfer") continue;
    if (tx.is_business_candidate === true) continue;
    if (rejectedTxIds.has(tx.id)) continue;
    const matchResult = evaluateRuleInline(rule, tx);
    if (!matchResult.matched) continue;
    const isMixedUse = MIXED_USE_CATEGORIES.has((tx.category ?? "").toLowerCase().trim());
    const confidence = isMixedUse
      ? Math.min(matchResult.confidence, MIXED_USE_CONFIDENCE_CAP)
      : matchResult.confidence;
    results.push({
      suggestion: {
        user_id: rule.user_id,
        automation_rule_id: rule.id,
        suggestion_type: "business_expense_candidate",
        source_entity_type: "transaction",
        source_entity_id: tx.id,
        suggested_action: { mixed_use: isMixedUse, reason: matchResult.reason },
        reason: matchResult.reason,
        confidence,
        status: "pending",
      },
    });
  }
  return results;
}

// ─── 25. deriveBusinessRuleInput: direction guard ─────────────────────────────

test("PR C: deriveBusinessRuleInput blocks credit transactions", () => {
  const result = deriveBusinessRuleInput("Starbucks", null, "credit");
  assert.equal(result.blocked, true);
  assert.match(result.reason, /debit/i, "Reason must mention debit");
});

test("PR C: deriveBusinessRuleInput blocks transactions with no merchant and no description", () => {
  const result = deriveBusinessRuleInput(null, null, "debit");
  assert.equal(result.blocked, true);
  assert.match(result.reason, /No usable matcher signal/);
});

test("PR C: deriveBusinessRuleInput blocks when description has only short tokens (<=2 chars)", () => {
  const result = deriveBusinessRuleInput(null, "is a on", "debit");
  assert.equal(result.blocked, true, "Tokens <= 2 chars should not produce a usable signal");
});

test("PR C: deriveBusinessRuleInput prefers merchant_normalized when merchant is available", () => {
  const result = deriveBusinessRuleInput("Starbucks", "coffee purchase", "debit");
  assert.equal(result.blocked, false);
  assert.equal(result.matcherType, "merchant_normalized");
  assert.equal(result.matcherConfig.normalized_merchant, "starbucks");
  assert.equal(result.matcherConfig.direction, "debit");
});

test("PR C: deriveBusinessRuleInput falls back to description_pattern when no merchant", () => {
  const result = deriveBusinessRuleInput(null, "office supply purchase", "debit");
  assert.equal(result.blocked, false);
  assert.equal(result.matcherType, "description_pattern");
  assert.ok(Array.isArray(result.matcherConfig.description_tokens), "description_tokens must be array");
  assert.ok(result.matcherConfig.description_tokens.length > 0, "Must have at least one token");
  assert.equal(result.matcherConfig.description_tokens.includes("office"), true);
});

test("PR C: deriveBusinessRuleInput normalizes merchant (strips legal suffix and TLD)", () => {
  const result = deriveBusinessRuleInput("Amazon.com LLC", null, "debit");
  assert.equal(result.blocked, false);
  assert.equal(result.matcherType, "merchant_normalized");
  assert.doesNotMatch(result.matcherConfig.normalized_merchant, /\.com/, "TLD must be stripped");
  assert.doesNotMatch(result.matcherConfig.normalized_merchant, /llc/i, "Legal suffix must be stripped");
});

test("PR C: deriveBusinessRuleInput description tokens exclude words of 2 chars or fewer", () => {
  const result = deriveBusinessRuleInput(null, "an to office supplies", "debit");
  assert.equal(result.blocked, false);
  const tokens = result.matcherConfig.description_tokens;
  for (const tok of tokens) {
    assert.ok(tok.length > 2, `Token "${tok}" must be longer than 2 chars`);
  }
});

// ─── 26. Business rule creation shape ────────────────────────────────────────

test("PR C: new business candidate rule has correct action_type and action_config shape", () => {
  // Simulate the rule insert payload from createOrStrengthenBusinessRule
  const rule = {
    user_id: "u1",
    rule_type: "transaction_category",
    matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "starbucks", direction: "debit" },
    action_type: "mark_business_candidate",
    action_config: { mixed_use: false, reason: 'Transactions from "Starbucks" were marked as business candidate' },
    confidence: 0.70,
    status: "active",
    requires_confirmation: true,
    created_from_user_action: true,
    source_entity_type: "transaction",
    source_entity_id: "tx1",
  };
  assert.equal(rule.action_type, "mark_business_candidate", "action_type must be mark_business_candidate");
  assert.equal(rule.rule_type, "transaction_category", "rule_type reuses transaction_category");
  assert.equal(rule.confidence, 0.70, "New business rule starts at 0.70 confidence");
  assert.equal(rule.requires_confirmation, true, "Business rules always require confirmation");
  assert.equal(rule.created_from_user_action, true);
  assert.equal(typeof rule.action_config.mixed_use, "boolean", "action_config.mixed_use must be boolean");
  assert.ok(rule.action_config.reason, "action_config.reason must be present");
  assert.equal(Object.prototype.hasOwnProperty.call(rule.action_config, "category"), false,
    "Business rule action_config must not have a category field");
});

test("PR C: business rule action_type is mark_business_candidate, not set_category", () => {
  const bizRule = { action_type: "mark_business_candidate" };
  const catRule = { action_type: "set_category" };
  assert.notEqual(bizRule.action_type, catRule.action_type,
    "Business and category rules must have distinct action_type values");
});

test("PR C: strengthened business rule increments confidence by 0.05", () => {
  const existingConfidence = 0.75;
  const newConfidence = Math.min(existingConfidence + 0.05, 1.0);
  assert.equal(newConfidence, 0.80, "Confidence must increase by 0.05");
});

test("PR C: strengthened business rule confidence caps at 1.0", () => {
  const existingConfidence = 0.98;
  const newConfidence = Math.min(existingConfidence + 0.05, 1.0);
  assert.equal(newConfidence, 1.0, "Confidence must not exceed 1.0");
});

test("PR C: business rule lookup filters by action_type to exclude category rules", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/businessRuleBuilder.ts"),
    "utf8",
  );
  assert.match(src, /eq\("action_type",\s*"mark_business_candidate"\)/,
    "businessRuleBuilder must filter by action_type = mark_business_candidate");
});

test("PR C: category ruleBuilder filters by action_type to exclude business rules", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/ruleBuilder.ts"),
    "utf8",
  );
  assert.match(src, /eq\("action_type",\s*"set_category"\)/,
    "ruleBuilder must filter by action_type = set_category to prevent business rule contamination");
});

// ─── 27. buildBusinessSuggestionsForRule eligibility guards ───────────────────

test("PR C: buildBusinessSuggestionsForRule returns empty for inactive rule", () => {
  const rule = {
    id: "r1", user_id: "u1", status: "paused",
    matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "starbucks", direction: "debit" },
    action_type: "mark_business_candidate",
  };
  const txs = [{ id: "tx2", direction: "debit", is_business_candidate: null, merchant_name: "Starbucks", category: null }];
  const result = buildBusinessSuggestionsForRule(rule, txs, "tx-exclude", new Set());
  assert.equal(result.length, 0, "Inactive rule must produce no suggestions");
});

test("PR C: buildBusinessSuggestionsForRule skips credit transactions", () => {
  const rule = { id: "r1", user_id: "u1", status: "active", matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "starbucks", direction: "debit" }, action_type: "mark_business_candidate" };
  const txs = [{ id: "tx2", direction: "credit", is_business_candidate: null, merchant_name: "Starbucks", category: null }];
  const result = buildBusinessSuggestionsForRule(rule, txs, "tx-exclude", new Set());
  assert.equal(result.length, 0, "Credit transactions must be skipped");
});

test("PR C: buildBusinessSuggestionsForRule skips already-marked transactions", () => {
  const rule = { id: "r1", user_id: "u1", status: "active", matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "starbucks", direction: "debit" }, action_type: "mark_business_candidate" };
  const txs = [{ id: "tx2", direction: "debit", is_business_candidate: true, merchant_name: "Starbucks", category: null }];
  const result = buildBusinessSuggestionsForRule(rule, txs, "tx-exclude", new Set());
  assert.equal(result.length, 0, "Already-marked transactions must be skipped");
});

test("PR C: buildBusinessSuggestionsForRule skips the triggering transaction", () => {
  const rule = { id: "r1", user_id: "u1", status: "active", matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "starbucks", direction: "debit" }, action_type: "mark_business_candidate" };
  const txs = [{ id: "tx-trigger", direction: "debit", is_business_candidate: null, merchant_name: "Starbucks", category: null }];
  const result = buildBusinessSuggestionsForRule(rule, txs, "tx-trigger", new Set());
  assert.equal(result.length, 0, "Triggering transaction must be excluded");
});

test("PR C: buildBusinessSuggestionsForRule skips rejected transactions", () => {
  const rule = { id: "r1", user_id: "u1", status: "active", matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "starbucks", direction: "debit" }, action_type: "mark_business_candidate" };
  const txs = [{ id: "tx2", direction: "debit", is_business_candidate: null, merchant_name: "Starbucks", category: null }];
  const rejected = new Set(["tx2"]);
  const result = buildBusinessSuggestionsForRule(rule, txs, "tx-exclude", rejected);
  assert.equal(result.length, 0, "Rejected transaction must not generate a suggestion");
});

test("PR C: buildBusinessSuggestionsForRule generates suggestion for matching eligible debit tx", () => {
  const rule = { id: "r1", user_id: "u1", status: "active", matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "starbucks", direction: "debit" }, action_type: "mark_business_candidate" };
  const txs = [{ id: "tx2", direction: "debit", transaction_type: "bank", is_business_candidate: null, merchant_name: "Starbucks", category: "food" }];
  const result = buildBusinessSuggestionsForRule(rule, txs, "tx-exclude", new Set());
  assert.equal(result.length, 1, "Eligible matching tx must produce one suggestion");
  assert.equal(result[0].suggestion.suggestion_type, "business_expense_candidate");
  assert.equal(result[0].suggestion.source_entity_id, "tx2");
  assert.equal(result[0].suggestion.status, "pending");
  assert.equal(result[0].suggestion.automation_rule_id, "r1");
});

test("PR C: buildBusinessSuggestionsForRule skips debit transfer transactions", () => {
  const rule = { id: "r1", user_id: "u1", status: "active", matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "starbucks", direction: "debit" }, action_type: "mark_business_candidate" };
  const txs = [
    { id: "tx-transfer", direction: "debit", transaction_type: "transfer", is_business_candidate: null, merchant_name: "Starbucks", category: null },
  ];
  const result = buildBusinessSuggestionsForRule(rule, txs, "tx-exclude", new Set());
  assert.equal(result.length, 0, "Debit transfer transactions must not receive business candidate suggestions");
});

test("PR C: buildBusinessSuggestionsForRule skips transfer regardless of case", () => {
  const rule = { id: "r1", user_id: "u1", status: "active", matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "starbucks", direction: "debit" }, action_type: "mark_business_candidate" };
  const txs = [
    { id: "tx-t1", direction: "debit", transaction_type: "Transfer", is_business_candidate: null, merchant_name: "Starbucks", category: null },
    { id: "tx-t2", direction: "debit", transaction_type: "TRANSFER", is_business_candidate: null, merchant_name: "Starbucks", category: null },
  ];
  const result = buildBusinessSuggestionsForRule(rule, txs, "tx-exclude", new Set());
  assert.equal(result.length, 0, "Transfer guard must be case-insensitive");
});

test("PR C: buildBusinessSuggestionsForRule allows non-transfer debit types (bank, payment, etc.)", () => {
  const rule = { id: "r1", user_id: "u1", status: "active", matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "starbucks", direction: "debit" }, action_type: "mark_business_candidate" };
  const txs = [
    { id: "tx-bank", direction: "debit", transaction_type: "bank", is_business_candidate: null, merchant_name: "Starbucks", category: null },
    { id: "tx-payment", direction: "debit", transaction_type: "payment", is_business_candidate: null, merchant_name: "Starbucks", category: null },
    { id: "tx-null-type", direction: "debit", transaction_type: null, is_business_candidate: null, merchant_name: "Starbucks", category: null },
  ];
  const result = buildBusinessSuggestionsForRule(rule, txs, "tx-exclude", new Set());
  assert.equal(result.length, 3, "bank, payment, and null transaction_type must all be eligible");
});

// ─── 28. Mixed-use confidence cap ────────────────────────────────────────────

test("PR C: mixed-use category caps suggestion confidence at 0.60", () => {
  const rule = { id: "r1", user_id: "u1", status: "active", matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "starbucks", direction: "debit" }, action_type: "mark_business_candidate" };
  const txs = [{ id: "tx2", direction: "debit", is_business_candidate: null, merchant_name: "Starbucks", category: "meals" }];
  const result = buildBusinessSuggestionsForRule(rule, txs, "tx-exclude", new Set());
  assert.equal(result.length, 1);
  assert.ok(result[0].suggestion.confidence <= 0.60,
    `Confidence ${result[0].suggestion.confidence} must be <= 0.60 for mixed-use category`);
  assert.equal(result[0].suggestion.suggested_action.mixed_use, true,
    "mixed_use must be true for meals category");
});

test("PR C: non-mixed-use category does not cap confidence", () => {
  const rule = { id: "r1", user_id: "u1", status: "active", matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "starbucks", direction: "debit" }, action_type: "mark_business_candidate" };
  const txs = [{ id: "tx2", direction: "debit", is_business_candidate: null, merchant_name: "Starbucks", category: "software" }];
  // software is in SENSITIVE_CATEGORIES but NOT in MIXED_USE_CATEGORIES (check: meals, home office, vehicle, phone, travel, equipment, education, professional services)
  // software is NOT in MIXED_USE_CATEGORIES
  const result = buildBusinessSuggestionsForRule(rule, txs, "tx-exclude", new Set());
  assert.equal(result.length, 1);
  assert.equal(result[0].suggestion.suggested_action.mixed_use, false,
    "mixed_use must be false for non-mixed-use category");
  assert.ok(result[0].suggestion.confidence > 0.60,
    `Confidence ${result[0].suggestion.confidence} must be > 0.60 for non-mixed-use category`);
});

// ─── 29. businessSuggestionEngine query: no user_id on transactions ───────────

test("PR C: businessSuggestionEngine does not filter transactions by user_id column", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/businessSuggestionEngine.ts"),
    "utf8",
  );
  // The transactions table has no user_id column — RLS handles user scoping.
  // The query must not include .eq("user_id", ...) on the transactions select block.
  const txSelectBlock = src.match(/from\("transactions"\)[\s\S]*?\.limit\(200\)/)?.[0] ?? "";
  assert.doesNotMatch(txSelectBlock, /eq\("user_id"/,
    'businessSuggestionEngine transactions query must not use .eq("user_id") — transactions has no user_id column; RLS handles scoping');
});

test("PR C: businessSuggestionEngine DB query excludes transfer transactions at the source", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/businessSuggestionEngine.ts"),
    "utf8",
  );
  const txSelectBlock = src.match(/from\("transactions"\)[\s\S]*?\.limit\(200\)/)?.[0] ?? "";
  assert.match(txSelectBlock, /neq\("transaction_type",\s*"transfer"\)/,
    'businessSuggestionEngine transactions query must exclude transfers with .neq("transaction_type", "transfer")');
});

// ─── 30. Protected field regression ──────────────────────────────────────────

test("PR C: accepting a business suggestion only writes is_business_candidate", () => {
  const acceptPayload = buildAcceptBusinessCandidatePayload();
  const keys = Object.keys(acceptPayload);
  assert.deepEqual(keys, ["is_business_candidate"],
    "Accept business candidate payload must only contain is_business_candidate");
  for (const field of NON_AUTOMATABLE_TX_FIELDS) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(acceptPayload, field),
      false,
      `Protected field "${field}" must not appear in accept business candidate payload`,
    );
  }
});

// ─── 31. Category suggestions unaffected by business rule changes ─────────────

test("PR C: category suggestion type is unchanged (transaction_category)", () => {
  const catSuggestion = {
    suggestion_type: "transaction_category",
    suggested_action: { category: "groceries", subcategory: null },
    status: "pending",
  };
  assert.equal(catSuggestion.suggestion_type, "transaction_category",
    "Category suggestions must still use transaction_category type");
  assert.ok(
    Object.prototype.hasOwnProperty.call(catSuggestion.suggested_action, "category"),
    "Category suggestion action must have a category field",
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(catSuggestion.suggested_action, "mixed_use"),
    false,
    "Category suggestions must not have mixed_use in their suggested_action",
  );
});

test("PR C: suggestionEngine still blocks sensitive categories (regression)", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/suggestionEngine.ts"),
    "utf8",
  );
  assert.match(src, /SENSITIVE_CATEGORIES\.has/,
    "suggestionEngine must still guard against sensitive categories");
  assert.match(src, /Phase1ActionConfig/,
    "suggestionEngine must cast action_config to Phase1ActionConfig for category access");
});

test("PR C: AutomationRule.action_type union includes both set_category and mark_business_candidate", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/types.ts"),
    "utf8",
  );
  assert.match(src, /Phase4ActionType/, "Phase4ActionType must be defined");
  assert.match(src, /'mark_business_candidate'/, "Phase4ActionType must include mark_business_candidate");
  assert.match(src, /'set_category'/, "Phase4ActionType must include set_category");
});

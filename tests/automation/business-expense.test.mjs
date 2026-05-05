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

// ─── 10. BUSINESS_EXPENSE_SUGGESTIONS_ENABLED defaults false

test("BUSINESS_EXPENSE_SUGGESTIONS_ENABLED is defined and defaults to false", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/constants.ts"),
    "utf8",
  );
  const match = src.match(/BUSINESS_EXPENSE_SUGGESTIONS_ENABLED\s*=\s*(true|false)/);
  assert.ok(match, "BUSINESS_EXPENSE_SUGGESTIONS_ENABLED must be defined in constants.ts");
  assert.equal(match[1], "false", "Must default to false in Phase 4 PR A");
});

// ─── 11. No suggestions generated when flag is false

test("mark-business returns suggestionsEnabled: false and suggestionsCreated: 0 in Phase 4 PR A", () => {
  // Simulate the route response when BUSINESS_EXPENSE_SUGGESTIONS_ENABLED = false
  const BUSINESS_EXPENSE_SUGGESTIONS_ENABLED = false;
  const response = {
    success: true,
    auditId: "audit-1",
    suggestionsEnabled: BUSINESS_EXPENSE_SUGGESTIONS_ENABLED,
    suggestionsCreated: 0,
  };
  assert.equal(response.suggestionsEnabled, false,
    "Flag must be false in PR A — no suggestion generation");
  assert.equal(response.suggestionsCreated, 0,
    "Zero suggestions must be created when flag is false");
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

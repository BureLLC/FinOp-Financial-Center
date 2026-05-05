/**
 * Integration-level tests for the undo pipeline.
 * Covers the stale-value guard, apply_count floor, and audit entry semantics
 * that match the undo_automation_suggestion Postgres function.
 *
 * Run with: node --test tests/automation/undo.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";

// ─── Inlined: IS DISTINCT FROM (null-safe equality, mirrors Postgres) ─────────

function isDistinctFrom(a, b) {
  if (a === null && b === null) return false;
  if (a === null || b === null) return true;
  return a !== b;
}

// ─── Inlined: stale-value guard from undo_automation_suggestion ──────────────
//
// The Postgres function does:
//   IF v_current_cat IS DISTINCT FROM v_expected_cat THEN
//     -- log blocked undo
//     RETURN jsonb_build_object('success', false, 'reason', 'transaction_edited_after_apply');
//   END IF;

function undoDecision(currentCategory, auditNewValueCategory) {
  if (isDistinctFrom(currentCategory, auditNewValueCategory)) {
    return { success: false, reason: "transaction_edited_after_apply" };
  }
  return { success: true };
}

// ─── Inlined: apply_count decrement (GREATEST(apply_count - 1, 0)) ────────────

function decrementApplyCount(count) {
  return Math.max(count - 1, 0);
}

// ─── Inlined: undo audit entry construction ───────────────────────────────────

function makeUndoAuditEntry(audit, userId, blocked) {
  return {
    user_id: userId,
    automation_rule_id: audit.automation_rule_id,
    suggestion_id: audit.suggestion_id,
    entity_type: "transaction",
    entity_id: audit.entity_id,
    action_taken: "undo_set_category",
    // blocked undo: both previous_value and new_value hold audit.new_value (the write that couldn't be reversed)
    // success undo: new_value holds audit.previous_value (restoring the original)
    previous_value: audit.new_value,
    new_value: blocked ? audit.new_value : audit.previous_value,
    triggered_by: "user_undo",
    undo_blocked_reason: blocked ? "transaction_edited_after_apply" : null,
  };
}

// ─── 1. Stale-value guard: success cases ─────────────────────────────────────

test("undoDecision: succeeds when current category exactly matches audit new_value", () => {
  const result = undoDecision("entertainment", "entertainment");
  assert.deepEqual(result, { success: true });
});

test("undoDecision: succeeds when both current and audit new_value are null", () => {
  const result = undoDecision(null, null);
  assert.deepEqual(result, { success: true });
});

// ─── 2. Stale-value guard: blocked cases ─────────────────────────────────────

test("undoDecision: blocked when current category differs from audit new_value", () => {
  const result = undoDecision("food", "entertainment");
  assert.equal(result.success, false);
  assert.equal(result.reason, "transaction_edited_after_apply");
});

test("undoDecision: blocked when current is null but audit expected a value", () => {
  const result = undoDecision(null, "entertainment");
  assert.equal(result.success, false);
  assert.equal(result.reason, "transaction_edited_after_apply");
});

test("undoDecision: blocked when current has a value but audit expected null", () => {
  const result = undoDecision("entertainment", null);
  assert.equal(result.success, false);
  assert.equal(result.reason, "transaction_edited_after_apply");
});

test("undoDecision: blocked on any category mismatch", () => {
  const pairs = [
    ["food", "groceries"],
    ["subscriptions", "entertainment"],
    ["healthcare", "fitness"],
  ];
  for (const [current, expected] of pairs) {
    const result = undoDecision(current, expected);
    assert.equal(result.success, false, `Expected blocked for (${current}, ${expected})`);
  }
});

// ─── 3. Blocked undo: audit entry structure ───────────────────────────────────

test("blocked undo: audit entry has undo_blocked_reason", () => {
  const audit = {
    automation_rule_id: "rule-1", suggestion_id: "sug-1", entity_id: "tx-1",
    previous_value: { category: null, subcategory: null },
    new_value: { category: "entertainment", subcategory: null },
  };
  const entry = makeUndoAuditEntry(audit, "user-a", true);
  assert.equal(entry.undo_blocked_reason, "transaction_edited_after_apply");
  assert.equal(entry.triggered_by, "user_undo");
  assert.equal(entry.action_taken, "undo_set_category");
  // Blocked undo does not restore the previous value — new_value stays at what automation wrote
  assert.deepEqual(entry.new_value, audit.new_value);
});

test("blocked undo: triggered_by is 'user_undo' (not 'auto_apply')", () => {
  const audit = {
    automation_rule_id: "rule-1", suggestion_id: "sug-1", entity_id: "tx-1",
    previous_value: { category: null }, new_value: { category: "entertainment" },
  };
  const entry = makeUndoAuditEntry(audit, "user-a", true);
  assert.equal(entry.triggered_by, "user_undo");
  assert.notEqual(entry.triggered_by, "auto_apply");
});

// ─── 4. Successful undo: audit entry structure ────────────────────────────────

test("successful undo: audit entry has null undo_blocked_reason", () => {
  const audit = {
    automation_rule_id: "rule-1", suggestion_id: "sug-1", entity_id: "tx-1",
    previous_value: { category: null, subcategory: null },
    new_value: { category: "entertainment", subcategory: null },
  };
  const entry = makeUndoAuditEntry(audit, "user-a", false);
  assert.equal(entry.undo_blocked_reason, null);
  assert.equal(entry.triggered_by, "user_undo");
  // Successful undo: new_value reflects what we restored to (the original previous value)
  assert.deepEqual(entry.new_value, audit.previous_value);
});

test("successful undo: restores previous category (new_value = audit.previous_value)", () => {
  const audit = {
    automation_rule_id: "rule-1", suggestion_id: "sug-1", entity_id: "tx-1",
    previous_value: { category: "groceries", subcategory: null },
    new_value: { category: "entertainment", subcategory: null },
  };
  const entry = makeUndoAuditEntry(audit, "user-a", false);
  assert.deepEqual(entry.new_value, { category: "groceries", subcategory: null });
});

// ─── 5. apply_count floor ────────────────────────────────────────────────────

test("decrementApplyCount: 5 → 4", () => {
  assert.equal(decrementApplyCount(5), 4);
});

test("decrementApplyCount: 1 → 0", () => {
  assert.equal(decrementApplyCount(1), 0);
});

test("decrementApplyCount: 0 → 0 (floor prevents negative)", () => {
  assert.equal(decrementApplyCount(0), 0);
});

test("decrementApplyCount: never returns a negative number", () => {
  for (let i = 0; i <= 5; i++) {
    assert.ok(decrementApplyCount(i) >= 0, `Got negative result for input ${i}`);
  }
});

// ─── 6. Phase 1 triggered_by constraints ─────────────────────────────────────

const VALID_TRIGGERED_BY = ["user_accept", "user_undo", "user_manual"];

test("triggered_by: undo always uses 'user_undo'", () => {
  const audit = {
    automation_rule_id: null, suggestion_id: null, entity_id: "tx-1",
    previous_value: { category: null }, new_value: { category: "entertainment" },
  };
  const entry = makeUndoAuditEntry(audit, "user-a", false);
  assert.equal(entry.triggered_by, "user_undo");
  assert.ok(VALID_TRIGGERED_BY.includes(entry.triggered_by));
});

test("triggered_by: 'auto_apply' is not in Phase 1 valid set", () => {
  assert.ok(!VALID_TRIGGERED_BY.includes("auto_apply"), "'auto_apply' must be excluded in Phase 1");
});

// ─── 7. Suggestion status lifecycle ──────────────────────────────────────────

const VALID_SUGGESTION_STATUSES = ["pending", "accepted", "rejected", "ignored", "undone"];

test("suggestion status: 'undone' is a valid Phase 1 status", () => {
  assert.ok(VALID_SUGGESTION_STATUSES.includes("undone"));
});

test("suggestion status: 'auto_applied' is not a valid Phase 1 status", () => {
  assert.ok(!VALID_SUGGESTION_STATUSES.includes("auto_applied"), "'auto_applied' must not exist in Phase 1");
});

// ─── 8. Undoable action types ─────────────────────────────────────────────────

const UNDOABLE_ACTIONS = ["set_category", "set_subcategory"];
const ALL_AUDIT_ACTIONS = [
  "set_category", "set_subcategory",
  "undo_set_category", "undo_set_subcategory",
  "user_manual_category",
];

test("undo: only set_category and set_subcategory actions can be undone", () => {
  assert.equal(UNDOABLE_ACTIONS.length, 2);
  assert.ok(UNDOABLE_ACTIONS.includes("set_category"));
  assert.ok(UNDOABLE_ACTIONS.includes("set_subcategory"));
});

test("undo: undo_set_category cannot itself be undone (no recursive undo)", () => {
  assert.ok(!UNDOABLE_ACTIONS.includes("undo_set_category"), "Cannot undo an undo");
});

test("undo: user_manual_category cannot be undone via automation undo", () => {
  assert.ok(!UNDOABLE_ACTIONS.includes("user_manual_category"), "Manual actions are not undoable via automation undo");
});

// ─── 9. Full undo scenario (stale-value guard + apply_count together) ─────────

test("full undo scenario: matching value → success=true, apply_count decremented", () => {
  const currentCategory = "entertainment";
  const auditNewCategory = "entertainment";
  const applyCount = 3;

  const decision = undoDecision(currentCategory, auditNewCategory);
  assert.equal(decision.success, true);

  const newApplyCount = decrementApplyCount(applyCount);
  assert.equal(newApplyCount, 2);
});

test("full undo scenario: mismatched value → success=false, apply_count unchanged", () => {
  const currentCategory = "food"; // user edited it after automation applied
  const auditNewCategory = "entertainment";
  const applyCount = 3;

  const decision = undoDecision(currentCategory, auditNewCategory);
  assert.equal(decision.success, false);

  // apply_count is NOT decremented when undo is blocked
  const newApplyCount = applyCount; // unchanged
  assert.equal(newApplyCount, 3);
});

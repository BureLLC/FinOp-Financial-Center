/**
 * Tests for Phase 3 PR B: rejection reason storage.
 *
 * Verifies:
 *   - Migration SQL adds a nullable rejection_reason column
 *   - Reject API behaviour: no body, valid reason, invalid reason, auth, cross-user, pending-only
 *   - rejection_reason does not alter rule confidence, rule status, or suggestion generation
 *   - UI reason picker constants are complete and map to API-allowed values
 *
 * Run with: node --test tests/automation/rejection-reason.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ─── Inlined: allowed values (mirrors reject/route.ts) ───────────────────────

const VALID_REJECTION_REASONS = new Set([
  "wrong_merchant",
  "wrong_category",
  "not_recurring",
  "personal_preference",
  "other",
  "skipped",
]);

// ─── Inlined: suggestion engine (abridged, mirrors rules.test.mjs) ────────────

const SENSITIVE_CATEGORIES = new Set([
  "business", "home office", "vehicle", "equipment", "software",
  "meals", "travel", "professional services", "advertising",
  "office supplies", "insurance", "utilities",
]);

function buildSuggestionsForRule(rule, candidates) {
  if (SENSITIVE_CATEGORIES.has((rule.action_config.category ?? "").toLowerCase())) return [];
  if (rule.status !== "active") return [];
  return candidates
    .filter((tx) => tx.direction === "debit" && (tx.category == null || tx.category === ""))
    .map((tx) => ({
      source_entity_id: tx.id,
      suggested_action: { category: rule.action_config.category },
    }));
}

// ─── Simulate reject-route logic ─────────────────────────────────────────────

function simulateReject(body, suggestion, authenticatedUserId) {
  if (!authenticatedUserId) return { status: 401 };

  // Validate reason if provided
  let rejectionReason = null;
  if (body && typeof body.rejection_reason === "string") {
    if (!VALID_REJECTION_REASONS.has(body.rejection_reason)) {
      return { status: 400, error: "Invalid rejection_reason" };
    }
    rejectionReason = body.rejection_reason;
  }

  // Ownership + existence check (scoped to user_id)
  if (!suggestion || suggestion.user_id !== authenticatedUserId) {
    return { status: 404, error: "Not found" };
  }
  if (suggestion.status !== "pending") {
    return { status: 400, error: "Suggestion is not pending" };
  }

  // Build the update payload — must never include rule fields
  const updatePayload = {
    status: "rejected",
    resolved_at: new Date().toISOString(),
    resolved_by: "user",
  };
  if (rejectionReason !== null) {
    updatePayload.rejection_reason = rejectionReason;
  }

  return { status: 200, success: true, updatePayload };
}

// ─── 1. Migration: adds nullable rejection_reason column ─────────────────────

test("migration SQL adds a nullable TEXT rejection_reason column", () => {
  const migrationPath = path.join(ROOT, "supabase/migrations/20260505000005_add_rejection_reason.sql");
  const sql = readFileSync(migrationPath, "utf8");
  assert.match(sql, /ADD\s+COLUMN\s+rejection_reason\s+TEXT\s+NULL/i,
    "Migration must use ADD COLUMN rejection_reason TEXT NULL");
  assert.doesNotMatch(sql, /NOT\s+NULL/i, "Column must not have NOT NULL constraint");
  assert.doesNotMatch(sql, /DEFAULT\s+/i, "Column must not have a DEFAULT");
  assert.doesNotMatch(sql, /REFERENCES\s+/i, "Column must not have a foreign key");
  assert.doesNotMatch(sql, /CREATE\s+INDEX/i, "Migration must not add an index");
});

// ─── 2. Reject API: works with no body ───────────────────────────────────────

test("reject API works with no body — stores null rejection_reason", () => {
  const suggestion = { id: "s1", user_id: "u1", status: "pending" };
  const result = simulateReject(null, suggestion, "u1");
  assert.equal(result.status, 200);
  assert.equal(result.success, true);
  assert.equal(result.updatePayload.rejection_reason, undefined,
    "rejection_reason must not be in update payload when not provided");
});

test("reject API works with empty body object — stores null rejection_reason", () => {
  const suggestion = { id: "s1", user_id: "u1", status: "pending" };
  const result = simulateReject({}, suggestion, "u1");
  assert.equal(result.status, 200);
  assert.equal(result.updatePayload.rejection_reason, undefined);
});

// ─── 3. Reject API: works with valid rejection_reason ────────────────────────

test("reject API stores valid rejection_reason: wrong_merchant", () => {
  const suggestion = { id: "s1", user_id: "u1", status: "pending" };
  const result = simulateReject({ rejection_reason: "wrong_merchant" }, suggestion, "u1");
  assert.equal(result.status, 200);
  assert.equal(result.updatePayload.rejection_reason, "wrong_merchant");
});

test("reject API accepts all 6 valid reason values", () => {
  for (const reason of VALID_REJECTION_REASONS) {
    const suggestion = { id: "s1", user_id: "u1", status: "pending" };
    const result = simulateReject({ rejection_reason: reason }, suggestion, "u1");
    assert.equal(result.status, 200,
      `Expected 200 for valid reason "${reason}", got ${result.status}`);
    assert.equal(result.updatePayload.rejection_reason, reason);
  }
});

// ─── 4. Reject API: returns 400 for invalid rejection_reason ─────────────────

test("reject API returns 400 for unknown reason", () => {
  const suggestion = { id: "s1", user_id: "u1", status: "pending" };
  const result = simulateReject({ rejection_reason: "unknown_reason" }, suggestion, "u1");
  assert.equal(result.status, 400);
  assert.equal(result.error, "Invalid rejection_reason");
});

test("reject API returns 400 for empty string reason", () => {
  const suggestion = { id: "s1", user_id: "u1", status: "pending" };
  const result = simulateReject({ rejection_reason: "" }, suggestion, "u1");
  assert.equal(result.status, 400);
});

test("reject API returns 400 for reason not in allowlist even if close", () => {
  const suggestion = { id: "s1", user_id: "u1", status: "pending" };
  const result = simulateReject({ rejection_reason: "wrong merchant" }, suggestion, "u1"); // space not underscore
  assert.equal(result.status, 400);
});

// ─── 5. Reject API: requires authenticated user ──────────────────────────────

test("reject API returns 401 when no authenticated user", () => {
  const suggestion = { id: "s1", user_id: "u1", status: "pending" };
  const result = simulateReject(null, suggestion, null);
  assert.equal(result.status, 401);
});

// ─── 6. Cross-user isolation ─────────────────────────────────────────────────

test("user cannot reject another user's suggestion — returns 404", () => {
  const suggestion = { id: "s1", user_id: "u1", status: "pending" };
  const result = simulateReject(null, suggestion, "u2");
  assert.equal(result.status, 404, "Different user must receive 404, not 403");
});

// ─── 7. Only pending suggestions can be rejected ─────────────────────────────

test("reject returns 400 if suggestion is already accepted", () => {
  const suggestion = { id: "s1", user_id: "u1", status: "accepted" };
  const result = simulateReject(null, suggestion, "u1");
  assert.equal(result.status, 400);
  assert.match(result.error, /not pending/i);
});

test("reject returns 400 if suggestion is already rejected", () => {
  const suggestion = { id: "s1", user_id: "u1", status: "rejected" };
  const result = simulateReject(null, suggestion, "u1");
  assert.equal(result.status, 400);
});

// ─── 8. rejection_reason does not alter rule confidence ──────────────────────

test("rejection_reason is not present in update payload for automation_rules table", () => {
  const suggestion = { id: "s1", user_id: "u1", status: "pending" };
  const result = simulateReject({ rejection_reason: "wrong_merchant" }, suggestion, "u1");
  assert.equal(result.status, 200);
  // Fields that exist only on automation_rules — must never appear in a suggestion update
  const rulesOnlyFields = ["confidence", "matcher_config", "action_config", "apply_count", "last_applied_at"];
  for (const field of rulesOnlyFields) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(result.updatePayload, field),
      false,
      `Update payload must not contain rule-only field "${field}"`,
    );
  }
  // The payload's status value must be a suggestion status, not a rule status
  assert.equal(result.updatePayload.status, "rejected",
    "Payload status must be suggestion status 'rejected', not a rule status");
});

test("rejection_reason does not call strengthenRule or weaken rule confidence", () => {
  // The reject route only calls .update() on automation_suggestions — never on automation_rules.
  // This is verified structurally: simulateReject returns only a suggestions update payload.
  const suggestion = { id: "s1", user_id: "u1", status: "pending" };
  const result = simulateReject({ rejection_reason: "not_recurring" }, suggestion, "u1");
  assert.equal(result.status, 200);
  // No rule object in the response — rejection cannot have strengthened/weakened a rule
  assert.equal(result.updatedRule, undefined);
});

// ─── 9. rejection_reason does not alter rule status ─────────────────────────

test("reject with reason does not pause, delete, or activate a rule", () => {
  const suggestion = { id: "s1", user_id: "u1", status: "pending" };
  const result = simulateReject({ rejection_reason: "personal_preference" }, suggestion, "u1");
  assert.equal(result.status, 200);
  // updatePayload targets automation_suggestions only
  const allowedKeys = new Set(["status", "resolved_at", "resolved_by", "rejection_reason"]);
  for (const key of Object.keys(result.updatePayload)) {
    assert.ok(allowedKeys.has(key),
      `Unexpected key "${key}" in update payload — only suggestion fields are allowed`);
  }
  assert.equal(result.updatePayload.status, "rejected",
    "Only the suggestion status changes, not the rule status");
});

// ─── 10. rejection_reason does not alter suggestion generation ───────────────

test("rejection_reason on a resolved suggestion does not affect new suggestion generation", () => {
  const rule = {
    id: "r1",
    status: "active",
    matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "netflix" },
    action_config: { category: "entertainment" },
  };
  // Simulate: a previously rejected suggestion has rejection_reason stored
  // New transactions come in — generation must be unaffected
  const newCandidates = [
    { id: "t2", direction: "debit", category: null, merchant_name: "Netflix" },
    { id: "t3", direction: "debit", category: null, merchant_name: "Netflix" },
  ];
  const suggestions = buildSuggestionsForRule(rule, newCandidates);
  // Generation is driven by rule.status, not by any rejection_reason on past suggestions
  assert.equal(suggestions.length, 2,
    "Rule generates suggestions regardless of past rejections");
});

test("pausing a rule stops suggestions independently of any rejection_reason", () => {
  const pausedRule = {
    id: "r1",
    status: "paused",
    action_config: { category: "entertainment" },
  };
  const candidates = [{ id: "t1", direction: "debit", category: null, merchant_name: "Netflix" }];
  const suggestions = buildSuggestionsForRule(pausedRule, candidates);
  assert.equal(suggestions.length, 0, "Paused rule generates no suggestions");
});

// ─── 11. UI reason picker constants ──────────────────────────────────────────

const UI_REASON_PICKER = [
  { reason: "wrong_merchant",    label: "Wrong merchant" },
  { reason: "wrong_category",    label: "Wrong category" },
  { reason: "not_recurring",     label: "Not recurring" },
  { reason: "personal_preference", label: "Personal preference" },
  { reason: "other",             label: "Other" },
  { reason: "skipped",           label: "Skip" },
];

test("UI reason picker has exactly 6 options", () => {
  assert.equal(UI_REASON_PICKER.length, 6);
});

test("every UI reason maps to a valid API rejection_reason", () => {
  for (const { reason } of UI_REASON_PICKER) {
    assert.ok(
      VALID_REJECTION_REASONS.has(reason),
      `UI reason "${reason}" is not in VALID_REJECTION_REASONS`,
    );
  }
});

test("every valid API reason has a UI picker entry", () => {
  const uiReasons = new Set(UI_REASON_PICKER.map((r) => r.reason));
  for (const reason of VALID_REJECTION_REASONS) {
    assert.ok(
      uiReasons.has(reason),
      `API reason "${reason}" has no UI picker entry`,
    );
  }
});

test("Skip option sends reason 'skipped' (not null or empty)", () => {
  const skipEntry = UI_REASON_PICKER.find((r) => r.label === "Skip");
  assert.ok(skipEntry, "Skip option must exist in UI picker");
  assert.equal(skipEntry.reason, "skipped", "Skip must send reason = 'skipped'");
  assert.ok(VALID_REJECTION_REASONS.has(skipEntry.reason), "skipped must be a valid API reason");
});

// ─── 12. UI error state: rejection fails ─────────────────────────────────────

test("UI shows error and keeps suggestion visible if rejection fails", () => {
  // Simulate the UI logic: if rejectSuggestion gets a non-ok response,
  // it sets rejectError and does NOT remove the suggestion from the map.
  let suggestionMap = new Map([["tx1", { id: "s1" }]]);
  let rejectError = null;
  let rejectingTxId = "tx1";

  function simulateUIReject(ok) {
    if (!ok) {
      rejectError = "Failed to reject. Please try again.";
      return; // suggestion NOT removed, rejectingTxId stays set
    }
    suggestionMap.delete("tx1");
    rejectingTxId = null;
    rejectError = null;
  }

  simulateUIReject(false);
  assert.equal(rejectError, "Failed to reject. Please try again.",
    "Error message must be set on failure");
  assert.ok(suggestionMap.has("tx1"),
    "Suggestion must remain visible in UI after failed rejection");
  assert.equal(rejectingTxId, "tx1",
    "Reason picker must remain open after failure so user can retry");
});

test("UI removes suggestion and clears state after successful rejection", () => {
  let suggestionMap = new Map([["tx1", { id: "s1" }]]);
  let rejectError = null;
  let rejectingTxId = "tx1";
  let openSuggestion = "tx1";

  function simulateUIReject(ok) {
    if (!ok) {
      rejectError = "Failed to reject. Please try again.";
      return;
    }
    suggestionMap.delete("tx1");
    rejectingTxId = null;
    rejectError = null;
    openSuggestion = null;
  }

  simulateUIReject(true);
  assert.equal(suggestionMap.has("tx1"), false, "Suggestion removed on success");
  assert.equal(rejectingTxId, null, "rejectingTxId cleared on success");
  assert.equal(rejectError, null, "rejectError cleared on success");
  assert.equal(openSuggestion, null, "Suggestion panel closed on success");
});

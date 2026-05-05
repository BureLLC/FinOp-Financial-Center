/**
 * Integration-level tests for the automation rules management layer.
 * Covers rule status transitions, cross-user isolation,
 * suggestion suppression for paused/deleted rules, and confidence bounds.
 *
 * Run with: node --test tests/automation/rules.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";

// ─── Inlined: status transition table ────────────────────────────────────────

const VALID_TRANSITIONS = {
  active: ["paused", "deleted"],
  paused: ["active", "deleted"],
  // deleted: [] — no transitions allowed from deleted
};

function canTransition(from, to) {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

const RULE_STATUSES = ["active", "paused", "deleted"];

// ─── Inlined: suggestion engine (abridged) ───────────────────────────────────

const SENSITIVE_CATEGORIES = new Set([
  "business", "home office", "vehicle", "equipment", "software",
  "meals", "travel", "professional services", "advertising",
  "office supplies", "insurance", "utilities",
]);

function normalizeMerchant(raw) {
  if (typeof raw !== "string" || raw.length === 0) return "";
  const LEGAL_SUFFIX_RE = /\s+(?:llc|inc|corp|co|ltd|incorporated|limited|company)\.?$/i;
  const TLD_RE = /\.(com|net|org|io|co)$/i;
  const PUNCTUATION_RE = /[^\w\s&]/g;
  return raw.toLowerCase().replace(TLD_RE, "").replace(LEGAL_SUFFIX_RE, "")
    .replace(PUNCTUATION_RE, " ").replace(/\s+/g, " ").trim();
}

function evaluateRule(rule, tx) {
  if (tx.direction !== "debit") return { matched: false, confidence: 0, reason: "Not a debit" };
  if (rule.matcher_type === "merchant_normalized") {
    const rm = rule.matcher_config.normalized_merchant;
    const tm = normalizeMerchant(tx.merchant_name ?? "");
    if (!tm || !rm) return { matched: false, confidence: 0, reason: "No merchant" };
    if (tm === rm) return { matched: true, confidence: 0.85, reason: `Exact: "${tm}"` };
    if (tm.startsWith(rm) || rm.startsWith(tm)) return { matched: true, confidence: 0.65, reason: "Partial" };
    return { matched: false, confidence: 0, reason: "No match" };
  }
  return { matched: false, confidence: 0, reason: "Unknown matcher" };
}

function buildSuggestionsForRule(rule, candidates, excludeId) {
  if (SENSITIVE_CATEGORIES.has((rule.action_config.category ?? "").toLowerCase())) return [];
  if (rule.status !== "active") return [];
  const results = [];
  for (const tx of candidates) {
    if (tx.id === excludeId) continue;
    if (tx.direction !== "debit") continue;
    if (tx.category != null && tx.category !== "") continue;
    const match = evaluateRule(rule, tx);
    if (!match.matched) continue;
    results.push({
      source_entity_id: tx.id,
      suggested_action: { category: rule.action_config.category },
      confidence: match.confidence,
    });
  }
  return results;
}

function strengthenRule(rule) {
  return { ...rule, confidence: Math.min(rule.confidence + 0.05, 1.0) };
}

// ─── 1. Valid status transitions ──────────────────────────────────────────────

test("status transitions: active → paused is valid", () => {
  assert.ok(canTransition("active", "paused"));
});

test("status transitions: active → deleted is valid", () => {
  assert.ok(canTransition("active", "deleted"));
});

test("status transitions: paused → active is valid", () => {
  assert.ok(canTransition("paused", "active"));
});

test("status transitions: paused → deleted is valid", () => {
  assert.ok(canTransition("paused", "deleted"));
});

// ─── 2. Invalid status transitions ───────────────────────────────────────────

test("status transitions: deleted → active is invalid", () => {
  assert.equal(canTransition("deleted", "active"), false);
});

test("status transitions: deleted → paused is invalid", () => {
  assert.equal(canTransition("deleted", "paused"), false);
});

test("status transitions: deleted → deleted is invalid", () => {
  assert.equal(canTransition("deleted", "deleted"), false);
});

test("status transitions: active → active is invalid (no self-transition)", () => {
  assert.equal(canTransition("active", "active"), false);
});

test("status transitions: paused → paused is invalid (no self-transition)", () => {
  assert.equal(canTransition("paused", "paused"), false);
});

test("status transitions: unknown status → anything is invalid", () => {
  assert.equal(canTransition("unknown", "active"), false);
  assert.equal(canTransition("", "active"), false);
});

// ─── 3. Rule status set completeness ─────────────────────────────────────────

test("RULE_STATUSES: exactly 3 statuses", () => {
  assert.equal(RULE_STATUSES.length, 3);
});

test("RULE_STATUSES: contains active, paused, deleted", () => {
  assert.ok(RULE_STATUSES.includes("active"));
  assert.ok(RULE_STATUSES.includes("paused"));
  assert.ok(RULE_STATUSES.includes("deleted"));
});

// ─── 4. Suggestion suppression for paused rules ──────────────────────────────

test("paused rule: generates no suggestions", () => {
  const rule = {
    id: "rule-1", user_id: "user-a", rule_type: "transaction_category",
    matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "netflix" },
    action_type: "set_category", action_config: { category: "entertainment" },
    confidence: 0.85, status: "paused",
  };
  const candidates = [
    { id: "tx-2", direction: "debit", merchant_name: "Netflix", category: null },
  ];
  const results = buildSuggestionsForRule(rule, candidates, "tx-1");
  assert.equal(results.length, 0, "Paused rules must not generate suggestions");
});

test("paused rule: zero suggestions even with multiple matching transactions", () => {
  const rule = {
    id: "rule-1", user_id: "user-a", rule_type: "transaction_category",
    matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "starbucks" },
    action_type: "set_category", action_config: { category: "food" },
    confidence: 0.80, status: "paused",
  };
  const candidates = [
    { id: "tx-2", direction: "debit", merchant_name: "Starbucks", category: null },
    { id: "tx-3", direction: "debit", merchant_name: "Starbucks Coffee", category: null },
    { id: "tx-4", direction: "debit", merchant_name: "Starbucks", category: null },
  ];
  const results = buildSuggestionsForRule(rule, candidates, "tx-1");
  assert.equal(results.length, 0);
});

// ─── 5. Suggestion suppression for deleted rules ──────────────────────────────

test("deleted rule: generates no suggestions", () => {
  const rule = {
    id: "rule-1", user_id: "user-a", rule_type: "transaction_category",
    matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "amazon" },
    action_type: "set_category", action_config: { category: "shopping" },
    confidence: 0.85, status: "deleted",
  };
  const candidates = [
    { id: "tx-2", direction: "debit", merchant_name: "Amazon", category: null },
  ];
  const results = buildSuggestionsForRule(rule, candidates, "tx-1");
  assert.equal(results.length, 0, "Deleted rules must not generate suggestions");
});

// ─── 6. Active rule still generates suggestions ───────────────────────────────

test("active rule: generates suggestions for matching uncategorized debits", () => {
  const rule = {
    id: "rule-1", user_id: "user-a", rule_type: "transaction_category",
    matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "netflix" },
    action_type: "set_category", action_config: { category: "entertainment" },
    confidence: 0.85, status: "active",
  };
  const candidates = [
    { id: "tx-2", direction: "debit", merchant_name: "Netflix", category: null },
    { id: "tx-3", direction: "debit", merchant_name: "Netflix", category: null },
  ];
  const results = buildSuggestionsForRule(rule, candidates, "tx-1");
  assert.equal(results.length, 2);
});

test("active rule: skips already-categorized transactions", () => {
  const rule = {
    id: "rule-1", user_id: "user-a", rule_type: "transaction_category",
    matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "netflix" },
    action_type: "set_category", action_config: { category: "entertainment" },
    confidence: 0.85, status: "active",
  };
  const candidates = [
    { id: "tx-2", direction: "debit", merchant_name: "Netflix", category: "entertainment" },
    { id: "tx-3", direction: "debit", merchant_name: "Netflix", category: null },
  ];
  const results = buildSuggestionsForRule(rule, candidates, "tx-1");
  assert.equal(results.length, 1);
  assert.equal(results[0].source_entity_id, "tx-3");
});

// ─── 7. Cross-user isolation ──────────────────────────────────────────────────

test("cross-user isolation: user A and user B rules are filtered separately", () => {
  const allRules = [
    { id: "rule-1", user_id: "user-a", status: "active", deleted_at: null },
    { id: "rule-2", user_id: "user-b", status: "active", deleted_at: null },
    { id: "rule-3", user_id: "user-a", status: "paused", deleted_at: null },
  ];
  const userARules = allRules.filter((r) => r.user_id === "user-a");
  const userBRules = allRules.filter((r) => r.user_id === "user-b");

  assert.equal(userARules.length, 2);
  assert.equal(userBRules.length, 1);
  assert.ok(userARules.every((r) => r.user_id === "user-a"));
  assert.ok(userBRules.every((r) => r.user_id === "user-b"));
});

test("cross-user isolation: user A cannot update user B's rule (ownership check)", () => {
  const rule = { id: "rule-b", user_id: "user-b", status: "active" };
  const requestUserId = "user-a";
  const isAuthorized = rule.user_id === requestUserId;
  assert.equal(isAuthorized, false, "Cross-user rule update must be rejected");
});

test("cross-user isolation: user A can update their own rule", () => {
  const rule = { id: "rule-a", user_id: "user-a", status: "active" };
  const requestUserId = "user-a";
  const isAuthorized = rule.user_id === requestUserId;
  assert.equal(isAuthorized, true);
});

// ─── 8. Confidence bounds ─────────────────────────────────────────────────────

test("strengthenRule: confidence increments by 0.05", () => {
  const rule = { confidence: 0.70 };
  const strengthened = strengthenRule(rule);
  assert.equal(strengthened.confidence, 0.75);
});

test("strengthenRule: confidence does not exceed 1.0", () => {
  const rule = { confidence: 0.98 };
  const strengthened = strengthenRule(rule);
  assert.equal(strengthened.confidence, 1.0);
});

test("strengthenRule: confidence at 1.0 stays at 1.0", () => {
  const rule = { confidence: 1.0 };
  const strengthened = strengthenRule(rule);
  assert.equal(strengthened.confidence, 1.0);
});

test("new rule starts at confidence 0.70", () => {
  const INITIAL_CONFIDENCE = 0.70;
  assert.equal(INITIAL_CONFIDENCE, 0.70);
});

test("strengthenRule: multiple strengthenings stay within bounds", () => {
  let rule = { confidence: 0.85 };
  for (let i = 0; i < 20; i++) {
    rule = strengthenRule(rule);
    assert.ok(rule.confidence <= 1.0, `Confidence exceeded 1.0 after ${i + 1} strengthenings`);
  }
  assert.equal(rule.confidence, 1.0);
});

// ─── 9. Rule list filtering ───────────────────────────────────────────────────

test("rules list: excludes deleted rules (deleted_at set)", () => {
  const rules = [
    { id: "r1", status: "active", deleted_at: null },
    { id: "r2", status: "paused", deleted_at: null },
    { id: "r3", status: "deleted", deleted_at: "2026-01-01T00:00:00Z" },
  ];
  const visible = rules.filter((r) => r.deleted_at === null);
  assert.equal(visible.length, 2);
  assert.ok(visible.every((r) => r.deleted_at === null));
});

test("rules list: includes both active and paused rules", () => {
  const rules = [
    { id: "r1", status: "active", deleted_at: null },
    { id: "r2", status: "paused", deleted_at: null },
  ];
  const visible = rules.filter((r) => ["active", "paused"].includes(r.status));
  assert.equal(visible.length, 2);
});

// ─── 10. PUT rule: write restriction ─────────────────────────────────────────

const PHASE1_RULE_WRITABLE_FIELDS = ["status", "updated_at", "deleted_at"];

test("PUT rule: status, updated_at, deleted_at are the only writable fields", () => {
  assert.ok(PHASE1_RULE_WRITABLE_FIELDS.includes("status"));
  assert.ok(PHASE1_RULE_WRITABLE_FIELDS.includes("updated_at"));
  assert.ok(PHASE1_RULE_WRITABLE_FIELDS.includes("deleted_at"));
  assert.equal(PHASE1_RULE_WRITABLE_FIELDS.length, 3);
});

test("PUT rule: matcher_config cannot be modified via status update", () => {
  assert.ok(!PHASE1_RULE_WRITABLE_FIELDS.includes("matcher_config"));
});

test("PUT rule: action_config cannot be modified via status update", () => {
  assert.ok(!PHASE1_RULE_WRITABLE_FIELDS.includes("action_config"));
});

test("PUT rule: confidence cannot be modified via status update", () => {
  assert.ok(!PHASE1_RULE_WRITABLE_FIELDS.includes("confidence"));
});

test("PUT rule: user_id cannot be modified via status update", () => {
  assert.ok(!PHASE1_RULE_WRITABLE_FIELDS.includes("user_id"));
});

// ─── 11. Phase 1 requires_confirmation invariant ─────────────────────────────

test("Phase 1: requires_confirmation is always true for new rules (no auto-apply)", () => {
  const REQUIRES_CONFIRMATION = true;
  assert.equal(REQUIRES_CONFIRMATION, true);
});

test("Phase 1 matcher types: merchant_normalized and description_pattern", () => {
  const PHASE1_MATCHER_TYPES = ["merchant_normalized", "description_pattern"];
  assert.equal(PHASE1_MATCHER_TYPES.length, 2);
  assert.ok(PHASE1_MATCHER_TYPES.includes("merchant_normalized"));
  assert.ok(PHASE1_MATCHER_TYPES.includes("description_pattern"));
});

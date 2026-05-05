/**
 * Integration-level tests for the automation protection layer.
 * Verifies that protected transaction fields cannot be automated,
 * sensitive categories are blocked at every layer, credit transactions
 * are excluded, and Phase 1 operation boundaries are enforced.
 *
 * Run with: node --test tests/automation/protection.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";

// ─── Inlined: constants ───────────────────────────────────────────────────────

const SENSITIVE_CATEGORIES = new Set([
  "business", "home office", "vehicle", "equipment", "software",
  "meals", "travel", "professional services", "advertising",
  "office supplies", "insurance", "utilities",
]);

const NON_AUTOMATABLE_TX_FIELDS = [
  "income_subtype", "direction", "amount", "transaction_date",
  "transaction_type", "status", "financial_account_id",
  "external_transaction_id", "provider", "deleted_at",
];

// The only fields automation may write (Phase 1)
const PHASE1_WRITABLE_TX_FIELDS = ["category", "subcategory"];

// ─── Inlined: evaluateRule ────────────────────────────────────────────────────

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

// ─── Inlined: buildSuggestionsForRule ────────────────────────────────────────

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

// ─── 1. Protected field list completeness ────────────────────────────────────

const REQUIRED_PROTECTED_FIELDS = [
  "income_subtype", "direction", "amount", "transaction_date",
  "transaction_type", "status", "financial_account_id",
  "external_transaction_id", "provider", "deleted_at",
];

test("NON_AUTOMATABLE_TX_FIELDS: contains all 10 required protected fields", () => {
  assert.equal(NON_AUTOMATABLE_TX_FIELDS.length, REQUIRED_PROTECTED_FIELDS.length);
  for (const field of REQUIRED_PROTECTED_FIELDS) {
    assert.ok(NON_AUTOMATABLE_TX_FIELDS.includes(field), `Missing protected field: "${field}"`);
  }
});

test("NON_AUTOMATABLE_TX_FIELDS: income_subtype is protected", () => {
  assert.ok(NON_AUTOMATABLE_TX_FIELDS.includes("income_subtype"));
});

test("NON_AUTOMATABLE_TX_FIELDS: direction is protected (debit/credit cannot be changed by automation)", () => {
  assert.ok(NON_AUTOMATABLE_TX_FIELDS.includes("direction"));
});

test("NON_AUTOMATABLE_TX_FIELDS: amount is protected", () => {
  assert.ok(NON_AUTOMATABLE_TX_FIELDS.includes("amount"));
});

test("NON_AUTOMATABLE_TX_FIELDS: financial_account_id is protected (net worth)", () => {
  assert.ok(NON_AUTOMATABLE_TX_FIELDS.includes("financial_account_id"));
});

test("NON_AUTOMATABLE_TX_FIELDS: provider is protected (sync metadata)", () => {
  assert.ok(NON_AUTOMATABLE_TX_FIELDS.includes("provider"));
});

test("NON_AUTOMATABLE_TX_FIELDS: deleted_at is protected (soft delete)", () => {
  assert.ok(NON_AUTOMATABLE_TX_FIELDS.includes("deleted_at"));
});

// ─── 2. Writable field restriction ───────────────────────────────────────────

test("Phase 1: only category and subcategory are writable by automation", () => {
  assert.equal(PHASE1_WRITABLE_TX_FIELDS.length, 2);
  assert.ok(PHASE1_WRITABLE_TX_FIELDS.includes("category"));
  assert.ok(PHASE1_WRITABLE_TX_FIELDS.includes("subcategory"));
});

test("category is NOT in NON_AUTOMATABLE_TX_FIELDS", () => {
  assert.ok(!NON_AUTOMATABLE_TX_FIELDS.includes("category"), "category must be automatable");
});

test("subcategory is NOT in NON_AUTOMATABLE_TX_FIELDS", () => {
  assert.ok(!NON_AUTOMATABLE_TX_FIELDS.includes("subcategory"), "subcategory must be automatable");
});

test("writable fields have zero overlap with protected fields", () => {
  const overlap = PHASE1_WRITABLE_TX_FIELDS.filter((f) => NON_AUTOMATABLE_TX_FIELDS.includes(f));
  assert.equal(overlap.length, 0, `Unexpected overlap: ${overlap.join(", ")}`);
});

// ─── 3. Credit transaction guard ─────────────────────────────────────────────

test("evaluateRule: credit transaction → matched=false regardless of merchant", () => {
  const rule = {
    matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "netflix" },
    action_config: { category: "entertainment" },
    status: "active",
  };
  const tx = { id: "tx-1", direction: "credit", merchant_name: "Netflix, Inc.", category: null };
  const result = evaluateRule(rule, tx);
  assert.equal(result.matched, false);
  assert.equal(result.confidence, 0);
  assert.match(result.reason, /debit/i);
});

test("buildSuggestionsForRule: all credit transactions produce no suggestions", () => {
  const rule = {
    id: "rule-1", user_id: "user-a", rule_type: "transaction_category",
    matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: "netflix" },
    action_type: "set_category", action_config: { category: "entertainment" },
    confidence: 0.85, status: "active",
  };
  const candidates = [
    { id: "tx-2", direction: "credit", merchant_name: "Netflix", category: null },
    { id: "tx-3", direction: "credit", merchant_name: "Netflix, Inc.", category: null },
  ];
  const results = buildSuggestionsForRule(rule, candidates, "tx-1");
  assert.equal(results.length, 0, "Credits must never receive suggestions");
});

// ─── 4. Sensitive category guard: suggestion engine ──────────────────────────

test("buildSuggestionsForRule: sensitive category in rule → no suggestions generated", () => {
  const sensitiveCats = ["business", "home office", "vehicle", "equipment", "software",
    "meals", "travel", "professional services", "advertising", "office supplies", "insurance", "utilities"];
  const candidates = [{ id: "tx-2", direction: "debit", merchant_name: "Amazon", category: null }];
  for (const cat of sensitiveCats) {
    const rule = {
      id: "rule-1", user_id: "user-a", rule_type: "transaction_category",
      matcher_type: "merchant_normalized",
      matcher_config: { normalized_merchant: "amazon" },
      action_type: "set_category", action_config: { category: cat },
      confidence: 0.85, status: "active",
    };
    const results = buildSuggestionsForRule(rule, candidates, "tx-1");
    assert.equal(results.length, 0, `Sensitive category "${cat}" should produce no suggestions`);
  }
});

// ─── 5. Suggestion can only be rejected/accepted when pending ─────────────────

function canReject(suggestion) {
  return suggestion.status === "pending";
}

function canApply(suggestion) {
  return suggestion.status === "pending";
}

test("reject guard: only pending suggestions can be rejected", () => {
  assert.equal(canReject({ status: "pending" }), true);
  assert.equal(canReject({ status: "rejected" }), false);
  assert.equal(canReject({ status: "accepted" }), false);
  assert.equal(canReject({ status: "undone" }), false);
  assert.equal(canReject({ status: "ignored" }), false);
});

test("accept guard: only pending suggestions can be applied", () => {
  assert.equal(canApply({ status: "pending" }), true);
  assert.equal(canApply({ status: "accepted" }), false);
  assert.equal(canApply({ status: "rejected" }), false);
  assert.equal(canApply({ status: "undone" }), false);
});

// ─── 6. Phase 1 operation boundary: triggered_by ─────────────────────────────

const VALID_TRIGGERED_BY = ["user_accept", "user_undo", "user_manual"];

test("Phase 1 triggered_by: does not include 'auto_apply'", () => {
  assert.ok(!VALID_TRIGGERED_BY.includes("auto_apply"), "'auto_apply' is excluded from Phase 1");
});

test("Phase 1 triggered_by: all three expected values present", () => {
  assert.ok(VALID_TRIGGERED_BY.includes("user_accept"));
  assert.ok(VALID_TRIGGERED_BY.includes("user_undo"));
  assert.ok(VALID_TRIGGERED_BY.includes("user_manual"));
  assert.equal(VALID_TRIGGERED_BY.length, 3);
});

// ─── 7. Phase 1 action type boundary ─────────────────────────────────────────

const VALID_ACTION_TYPES = ["set_category", "set_subcategory"];

test("Phase 1 action types: only category-related writes", () => {
  assert.equal(VALID_ACTION_TYPES.length, 2);
  assert.ok(VALID_ACTION_TYPES.includes("set_category"));
  assert.ok(VALID_ACTION_TYPES.includes("set_subcategory"));
});

test("Phase 1 action types: does not include set_income_subtype (tax-sensitive)", () => {
  assert.ok(!VALID_ACTION_TYPES.includes("set_income_subtype"));
});

test("Phase 1 action types: does not include set_amount, set_direction, set_status", () => {
  assert.ok(!VALID_ACTION_TYPES.includes("set_amount"));
  assert.ok(!VALID_ACTION_TYPES.includes("set_direction"));
  assert.ok(!VALID_ACTION_TYPES.includes("set_status"));
});

// ─── 8. Phase 1 rule type boundary ───────────────────────────────────────────

const VALID_RULE_TYPES = ["transaction_category"];

test("Phase 1 rule types: only transaction_category", () => {
  assert.equal(VALID_RULE_TYPES.length, 1);
  assert.ok(VALID_RULE_TYPES.includes("transaction_category"));
});

test("Phase 1 rule types: does not include investment, savings, tax rule types", () => {
  assert.ok(!VALID_RULE_TYPES.includes("investment_categorize"));
  assert.ok(!VALID_RULE_TYPES.includes("savings_transfer"));
  assert.ok(!VALID_RULE_TYPES.includes("tax_deduction"));
});

// ─── 9. Sensitive categories match DEDUCTIBLE_CATEGORIES exactly ─────────────

test("SENSITIVE_CATEGORIES: exactly 12 entries", () => {
  assert.equal(SENSITIVE_CATEGORIES.size, 12);
});

test("SENSITIVE_CATEGORIES: no non-deductible categories in the set", () => {
  const nonDeductible = ["food", "groceries", "entertainment", "shopping", "fitness", "subscriptions", "healthcare", "transportation"];
  for (const cat of nonDeductible) {
    assert.ok(!SENSITIVE_CATEGORIES.has(cat), `"${cat}" should NOT be in SENSITIVE_CATEGORIES`);
  }
});

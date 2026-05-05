/**
 * Gate A unit tests for the automation foundation.
 * Run with: npm run test:automation
 *
 * Pure logic is inlined here so the test file has zero build-time dependencies
 * and runs with `node --test` directly — consistent with the project's existing
 * financial-calculations.node.test.mjs pattern.
 *
 * Covers:
 *   1. merchantNormalizer — normalizeMerchant, normalizeDescription
 *   2. matcherEngine      — evaluateRule (merchant_normalized, description_pattern)
 *   3. constants          — SENSITIVE_CATEGORIES, NON_AUTOMATABLE_TX_FIELDS
 */

import test from "node:test";
import assert from "node:assert/strict";

// ─── Inlined: merchantNormalizer ─────────────────────────────────────────────

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

// ─── Inlined: matcherEngine ───────────────────────────────────────────────────

const MATCH_THRESHOLD = 0.50;
const MERCHANT_EXACT_CONFIDENCE = 0.85;
const MERCHANT_PARTIAL_CONFIDENCE = 0.65;
const DESCRIPTION_MAX_CONFIDENCE = 0.80;

function evaluateRule(rule, tx) {
  if (tx.direction !== "debit") {
    return { matched: false, confidence: 0, reason: "Transaction is not a debit" };
  }
  if (rule.matcher_type === "merchant_normalized") {
    return evaluateMerchantMatcher(rule.matcher_config, tx);
  }
  if (rule.matcher_type === "description_pattern") {
    return evaluateDescriptionMatcher(rule.matcher_config, tx);
  }
  return { matched: false, confidence: 0, reason: "Unknown matcher type" };
}

function evaluateMerchantMatcher(config, tx) {
  const ruleMerchant = config.normalized_merchant;
  const txMerchant = normalizeMerchant(tx.merchant_name ?? "");
  if (!txMerchant || !ruleMerchant) {
    return { matched: false, confidence: 0, reason: "No merchant name to compare" };
  }
  if (txMerchant === ruleMerchant) {
    return { matched: true, confidence: MERCHANT_EXACT_CONFIDENCE, reason: `Exact merchant match: "${txMerchant}"` };
  }
  if (txMerchant.startsWith(ruleMerchant) || ruleMerchant.startsWith(txMerchant)) {
    return { matched: true, confidence: MERCHANT_PARTIAL_CONFIDENCE, reason: `Partial merchant match: "${txMerchant}" ~ "${ruleMerchant}"` };
  }
  return { matched: false, confidence: 0, reason: `No merchant match: "${txMerchant}" vs "${ruleMerchant}"` };
}

function evaluateDescriptionMatcher(config, tx) {
  const ruleTokens = config.description_tokens;
  const txNorm = normalizeDescription(tx.description ?? "");
  const txTokens = txNorm.split(/\s+/).filter(Boolean);
  if (!txTokens.length || !ruleTokens.length) {
    return { matched: false, confidence: 0, reason: "No description tokens to compare" };
  }
  const amount = Number(tx.amount ?? 0);
  if (config.amount_min !== undefined && amount < config.amount_min) {
    return { matched: false, confidence: 0, reason: "Amount below range minimum" };
  }
  if (config.amount_max !== undefined && amount > config.amount_max) {
    return { matched: false, confidence: 0, reason: "Amount above range maximum" };
  }
  const txTokenSet = new Set(txTokens);
  const matchingTokens = ruleTokens.filter((t) => txTokenSet.has(t));
  const hitRate = matchingTokens.length / ruleTokens.length;
  const confidence = Math.round(hitRate * DESCRIPTION_MAX_CONFIDENCE * 10000) / 10000;
  if (hitRate === 0) {
    return { matched: false, confidence: 0, reason: "No description tokens matched" };
  }
  return {
    matched: confidence >= MATCH_THRESHOLD,
    confidence,
    reason: `Description match: ${matchingTokens.length}/${ruleTokens.length} tokens`,
  };
}

// ─── Inlined: constants ────────────────────────────────────────────────────────

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

// ─── Helper: make a minimal rule ─────────────────────────────────────────────

function makeMerchantRule(normalizedMerchant, category, overrides = {}) {
  return {
    id: "rule-1",
    user_id: "user-a",
    rule_type: "transaction_category",
    matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: normalizedMerchant, direction: "debit" },
    action_type: "set_category",
    action_config: { category },
    confidence: 0.85,
    status: "active",
    requires_confirmation: true,
    created_from_user_action: true,
    source_entity_type: "transaction",
    source_entity_id: "tx-1",
    last_applied_at: null,
    apply_count: 0,
    created_at: "2026-05-05T00:00:00Z",
    updated_at: "2026-05-05T00:00:00Z",
    deleted_at: null,
    ...overrides,
  };
}

function makeDescriptionRule(tokens, category, amountOpts = {}) {
  return {
    id: "rule-2",
    user_id: "user-a",
    rule_type: "transaction_category",
    matcher_type: "description_pattern",
    matcher_config: { description_tokens: tokens, ...amountOpts },
    action_type: "set_category",
    action_config: { category },
    confidence: 0.70,
    status: "active",
    requires_confirmation: true,
    created_from_user_action: true,
    source_entity_type: null,
    source_entity_id: null,
    last_applied_at: null,
    apply_count: 0,
    created_at: "2026-05-05T00:00:00Z",
    updated_at: "2026-05-05T00:00:00Z",
    deleted_at: null,
  };
}

function makeDebitTx(overrides = {}) {
  return {
    id: "tx-1",
    direction: "debit",
    amount: 15.00,
    status: "posted",
    deleted_at: null,
    merchant_name: null,
    description: null,
    ...overrides,
  };
}

// ─── 1. normalizeMerchant ─────────────────────────────────────────────────────

test("normalizeMerchant: strips legal suffix LLC", () => {
  assert.equal(normalizeMerchant("Whole Foods Market LLC"), "whole foods market");
});

test("normalizeMerchant: strips Inc with trailing period", () => {
  assert.equal(normalizeMerchant("Netflix, Inc."), "netflix");
});

test("normalizeMerchant: strips Corp", () => {
  assert.equal(normalizeMerchant("AT&T Corp"), "at&t");
});

test("normalizeMerchant: strips domain TLD before legal suffix logic", () => {
  assert.equal(normalizeMerchant("Amazon.com"), "amazon");
});

test("normalizeMerchant: strips COFFEE CO suffix", () => {
  assert.equal(normalizeMerchant("STARBUCKS COFFEE CO"), "starbucks coffee");
});

test("normalizeMerchant: lowercases without other changes", () => {
  assert.equal(normalizeMerchant("UBER EATS"), "uber eats");
});

test("normalizeMerchant: does not strip 'co' embedded mid-word (Costco)", () => {
  assert.equal(normalizeMerchant("Costco"), "costco");
});

test("normalizeMerchant: collapses internal whitespace", () => {
  assert.equal(normalizeMerchant("Trader  Joe's"), "trader joe s");
});

test("normalizeMerchant: preserves ampersand", () => {
  const result = normalizeMerchant("Tom & Jerry's Diner");
  assert.ok(result.includes("&"), `Expected & to be preserved, got: ${result}`);
});

test("normalizeMerchant: strips trailing period without legal suffix", () => {
  assert.equal(normalizeMerchant("Target."), "target");
});

test("normalizeMerchant: returns empty string for empty input", () => {
  assert.equal(normalizeMerchant(""), "");
});

test("normalizeMerchant: returns empty string for non-string input", () => {
  assert.equal(normalizeMerchant(null), "");
  assert.equal(normalizeMerchant(undefined), "");
  assert.equal(normalizeMerchant(42), "");
});

test("normalizeMerchant: Lyft example", () => {
  assert.equal(normalizeMerchant("Lyft"), "lyft");
});

test("normalizeMerchant: United Airlines", () => {
  assert.equal(normalizeMerchant("United Airlines"), "united airlines");
});

// ─── 2. normalizeDescription ─────────────────────────────────────────────────

test("normalizeDescription: lowercases, removes special chars, collapses whitespace", () => {
  // "-" and "#" are removed; surrounding spaces collapse to single space
  assert.equal(normalizeDescription("Monthly SUBSCRIPTION - Netflix #1234"), "monthly subscription  netflix 1234".replace(/\s+/g, " ").trim());
});

test("normalizeDescription: collapses whitespace", () => {
  assert.equal(normalizeDescription("apple  icloud  storage"), "apple icloud storage");
});

test("normalizeDescription: removes punctuation", () => {
  const result = normalizeDescription("ACH payment - ref#5678");
  assert.ok(!result.includes("#"), "Should remove #");
  assert.ok(!result.includes("-"), "Should remove -");
});

test("normalizeDescription: returns empty string for empty input", () => {
  assert.equal(normalizeDescription(""), "");
});

test("normalizeDescription: handles non-string gracefully", () => {
  assert.equal(normalizeDescription(null), "");
  assert.equal(normalizeDescription(undefined), "");
});

// ─── 3. evaluateRule: direction guard ────────────────────────────────────────

test("evaluateRule: credit transaction returns matched=false regardless of rule", () => {
  const rule = makeMerchantRule("netflix", "entertainment");
  const tx = makeDebitTx({ direction: "credit", merchant_name: "Netflix, Inc." });
  const result = evaluateRule(rule, tx);
  assert.equal(result.matched, false);
  assert.equal(result.confidence, 0);
});

// ─── 4. evaluateRule: merchant_normalized matcher ─────────────────────────────

test("evaluateRule: exact merchant match returns confidence 0.85", () => {
  const rule = makeMerchantRule("netflix", "entertainment");
  const tx = makeDebitTx({ merchant_name: "Netflix, Inc." });
  const result = evaluateRule(rule, tx);
  assert.equal(result.matched, true);
  assert.equal(result.confidence, MERCHANT_EXACT_CONFIDENCE);
});

test("evaluateRule: partial merchant match returns confidence 0.65", () => {
  const rule = makeMerchantRule("starbucks", "food");
  const tx = makeDebitTx({ merchant_name: "STARBUCKS COFFEE CO" });
  const result = evaluateRule(rule, tx);
  // "starbucks coffee" starts with "starbucks" → partial match
  assert.equal(result.matched, true);
  assert.equal(result.confidence, MERCHANT_PARTIAL_CONFIDENCE);
});

test("evaluateRule: no merchant overlap returns matched=false", () => {
  const rule = makeMerchantRule("netflix", "entertainment");
  const tx = makeDebitTx({ merchant_name: "Spotify" });
  const result = evaluateRule(rule, tx);
  assert.equal(result.matched, false);
  assert.equal(result.confidence, 0);
});

test("evaluateRule: missing merchant name in tx returns matched=false", () => {
  const rule = makeMerchantRule("netflix", "entertainment");
  const tx = makeDebitTx({ merchant_name: null });
  const result = evaluateRule(rule, tx);
  assert.equal(result.matched, false);
});

test("evaluateRule: paused rule still evaluates (status check is caller's responsibility)", () => {
  const rule = makeMerchantRule("netflix", "entertainment", { status: "paused" });
  const tx = makeDebitTx({ merchant_name: "Netflix, Inc." });
  // evaluateRule does not check status — it returns a result
  const result = evaluateRule(rule, tx);
  assert.equal(result.matched, true);
});

test("evaluateRule: sensitive category in action_config does not block evaluation", () => {
  // Filtering sensitive categories is the caller's job; evaluateRule returns a result
  const rule = makeMerchantRule("staples", "office supplies");
  const tx = makeDebitTx({ merchant_name: "Staples" });
  const result = evaluateRule(rule, tx);
  assert.equal(result.matched, true);
  // The caller (suggestionEngine) must then discard this result because "office supplies"
  // is in SENSITIVE_CATEGORIES. This test confirms separation of concerns.
});

// ─── 5. evaluateRule: description_pattern matcher ────────────────────────────

test("evaluateRule: 4/4 description tokens → confidence = 0.80", () => {
  const rule = makeDescriptionRule(["monthly", "subscription", "apple", "icloud"], "subscriptions");
  const tx = makeDebitTx({ description: "Monthly subscription Apple iCloud storage" });
  const result = evaluateRule(rule, tx);
  assert.equal(result.matched, true);
  assert.ok(result.confidence > 0.79 && result.confidence <= 0.80,
    `Expected confidence ~0.80, got ${result.confidence}`);
});

test("evaluateRule: 3/4 description tokens → confidence = 0.60, matched", () => {
  const rule = makeDescriptionRule(["monthly", "subscription", "apple", "icloud"], "subscriptions");
  const tx = makeDebitTx({ description: "Monthly subscription Apple storage" });
  const result = evaluateRule(rule, tx);
  // 3/4 = 0.75 hit rate → 0.75 * 0.80 = 0.60
  assert.ok(result.confidence >= 0.59 && result.confidence <= 0.61,
    `Expected confidence ~0.60, got ${result.confidence}`);
  assert.equal(result.matched, true);
});

test("evaluateRule: 2/4 description tokens → confidence = 0.40, not matched", () => {
  const rule = makeDescriptionRule(["monthly", "subscription", "apple", "icloud"], "subscriptions");
  const tx = makeDebitTx({ description: "Monthly apple payment" });
  const result = evaluateRule(rule, tx);
  // 2/4 = 0.50 hit rate → 0.50 * 0.80 = 0.40
  assert.ok(result.confidence >= 0.39 && result.confidence <= 0.41,
    `Expected confidence ~0.40, got ${result.confidence}`);
  assert.equal(result.matched, false);
});

test("evaluateRule: 0 matching tokens → matched=false, confidence=0", () => {
  const rule = makeDescriptionRule(["netflix", "streaming"], "entertainment");
  const tx = makeDebitTx({ description: "Lyft ride share March" });
  const result = evaluateRule(rule, tx);
  assert.equal(result.matched, false);
  assert.equal(result.confidence, 0);
});

test("evaluateRule: amount below amount_min → matched=false", () => {
  const rule = makeDescriptionRule(["gym", "membership"], "fitness", { amount_min: 30 });
  const tx = makeDebitTx({ description: "Gym membership monthly", amount: 10 });
  const result = evaluateRule(rule, tx);
  assert.equal(result.matched, false);
});

test("evaluateRule: amount above amount_max → matched=false", () => {
  const rule = makeDescriptionRule(["gym", "membership"], "fitness", { amount_max: 50 });
  const tx = makeDebitTx({ description: "Gym membership monthly", amount: 100 });
  const result = evaluateRule(rule, tx);
  assert.equal(result.matched, false);
});

test("evaluateRule: amount within range → proceeds to token matching", () => {
  const rule = makeDescriptionRule(["gym", "membership"], "fitness", { amount_min: 20, amount_max: 100 });
  const tx = makeDebitTx({ description: "Gym membership monthly", amount: 45 });
  const result = evaluateRule(rule, tx);
  // 2/2 tokens = 1.0 hit rate → 0.80 confidence
  assert.equal(result.matched, true);
});

test("evaluateRule: empty description → matched=false", () => {
  const rule = makeDescriptionRule(["subscription"], "subscriptions");
  const tx = makeDebitTx({ description: null });
  const result = evaluateRule(rule, tx);
  assert.equal(result.matched, false);
});

test("evaluateRule: empty rule tokens → matched=false", () => {
  const rule = makeDescriptionRule([], "subscriptions");
  const tx = makeDebitTx({ description: "Some description text" });
  const result = evaluateRule(rule, tx);
  assert.equal(result.matched, false);
});

// ─── 6. SENSITIVE_CATEGORIES constants ───────────────────────────────────────

const EXPECTED_SENSITIVE = [
  "business", "home office", "vehicle", "equipment", "software",
  "meals", "travel", "professional services", "advertising",
  "office supplies", "insurance", "utilities",
];

test("SENSITIVE_CATEGORIES contains all 12 expected deductible categories", () => {
  assert.equal(SENSITIVE_CATEGORIES.size, EXPECTED_SENSITIVE.length);
  for (const cat of EXPECTED_SENSITIVE) {
    assert.ok(SENSITIVE_CATEGORIES.has(cat), `Missing category: "${cat}"`);
  }
});

test("SENSITIVE_CATEGORIES does not contain non-deductible categories", () => {
  const safe = ["food", "groceries", "entertainment", "shopping", "fitness", "healthcare"];
  for (const cat of safe) {
    assert.ok(!SENSITIVE_CATEGORIES.has(cat), `"${cat}" should not be sensitive`);
  }
});

// ─── 7. NON_AUTOMATABLE_TX_FIELDS constants ───────────────────────────────────

test("NON_AUTOMATABLE_TX_FIELDS contains all required protected fields", () => {
  const required = [
    "income_subtype", "direction", "amount", "transaction_date",
    "transaction_type", "status", "financial_account_id",
    "external_transaction_id", "provider", "deleted_at",
  ];
  for (const field of required) {
    assert.ok(
      NON_AUTOMATABLE_TX_FIELDS.includes(field),
      `Protected field missing from NON_AUTOMATABLE_TX_FIELDS: "${field}"`,
    );
  }
});

test("NON_AUTOMATABLE_TX_FIELDS does not include category or subcategory", () => {
  assert.ok(!NON_AUTOMATABLE_TX_FIELDS.includes("category"),
    "category should be automatable (it is the only writable field)");
  assert.ok(!NON_AUTOMATABLE_TX_FIELDS.includes("subcategory"),
    "subcategory should be automatable");
});

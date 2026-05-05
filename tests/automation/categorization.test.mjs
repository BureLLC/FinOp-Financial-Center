/**
 * Integration-level tests for the categorization pipeline.
 * Tests ruleBuilder logic and buildSuggestionsForRule working together.
 *
 * All logic is inlined (no TS imports) — consistent with project's node:test pattern.
 * Run with: node --test tests/automation/categorization.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";

// ─── Inlined: constants ───────────────────────────────────────────────────────

const SENSITIVE_CATEGORIES = new Set([
  "business", "home office", "vehicle", "equipment", "software",
  "meals", "travel", "professional services", "advertising",
  "office supplies", "insurance", "utilities",
]);

// ─── Inlined: merchantNormalizer ─────────────────────────────────────────────

const LEGAL_SUFFIX_RE = /\s+(?:llc|inc|corp|co|ltd|incorporated|limited|company)\.?$/i;
const TLD_RE = /\.(com|net|org|io|co)$/i;
const PUNCTUATION_RE = /[^\w\s&]/g;
const WHITESPACE_RE = /\s+/g;

function normalizeMerchant(raw) {
  if (typeof raw !== "string" || raw.length === 0) return "";
  return raw.toLowerCase()
    .replace(TLD_RE, "")
    .replace(LEGAL_SUFFIX_RE, "")
    .replace(PUNCTUATION_RE, " ")
    .replace(WHITESPACE_RE, " ")
    .trim();
}

function normalizeDescription(raw) {
  if (typeof raw !== "string" || raw.length === 0) return "";
  return raw.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(WHITESPACE_RE, " ").trim();
}

// ─── Inlined: evaluateRule ────────────────────────────────────────────────────

const MERCHANT_EXACT_CONFIDENCE = 0.85;
const MERCHANT_PARTIAL_CONFIDENCE = 0.65;
const DESCRIPTION_MAX_CONFIDENCE = 0.80;
const MATCH_THRESHOLD = 0.50;

function evaluateRule(rule, tx) {
  if (tx.direction !== "debit") return { matched: false, confidence: 0, reason: "Not a debit" };
  if (rule.matcher_type === "merchant_normalized") return evalMerchant(rule.matcher_config, tx);
  if (rule.matcher_type === "description_pattern") return evalDescription(rule.matcher_config, tx);
  return { matched: false, confidence: 0, reason: "Unknown matcher type" };
}

function evalMerchant(config, tx) {
  const rm = config.normalized_merchant;
  const tm = normalizeMerchant(tx.merchant_name ?? "");
  if (!tm || !rm) return { matched: false, confidence: 0, reason: "No merchant name" };
  if (tm === rm) return { matched: true, confidence: MERCHANT_EXACT_CONFIDENCE, reason: `Exact: "${tm}"` };
  if (tm.startsWith(rm) || rm.startsWith(tm)) return { matched: true, confidence: MERCHANT_PARTIAL_CONFIDENCE, reason: `Partial: "${tm}"` };
  return { matched: false, confidence: 0, reason: "No match" };
}

function evalDescription(config, tx) {
  const tokens = config.description_tokens;
  const norm = normalizeDescription(tx.description ?? "");
  const txTokens = norm.split(/\s+/).filter(Boolean);
  if (!txTokens.length || !tokens.length) return { matched: false, confidence: 0, reason: "No tokens" };
  const amt = Number(tx.amount ?? 0);
  if (config.amount_min !== undefined && amt < config.amount_min) return { matched: false, confidence: 0, reason: "Below range" };
  if (config.amount_max !== undefined && amt > config.amount_max) return { matched: false, confidence: 0, reason: "Above range" };
  const txSet = new Set(txTokens);
  const hits = tokens.filter((t) => txSet.has(t));
  const hitRate = hits.length / tokens.length;
  const confidence = Math.round(hitRate * DESCRIPTION_MAX_CONFIDENCE * 10000) / 10000;
  if (hitRate === 0) return { matched: false, confidence: 0, reason: "No tokens matched" };
  return { matched: confidence >= MATCH_THRESHOLD, confidence, reason: `${hits.length}/${tokens.length} tokens` };
}

// ─── Inlined: ruleBuilder decision logic ─────────────────────────────────────

function deriveRuleInput(params) {
  const { merchantName, description, category } = params;
  const normalizedCategory = category.toLowerCase().trim();
  if (SENSITIVE_CATEGORIES.has(normalizedCategory)) {
    return { blocked: true, reason: "Sensitive category" };
  }
  const normalizedMerchant = normalizeMerchant(merchantName ?? "");
  const normalizedDesc = normalizeDescription(description ?? "");
  const descTokens = normalizedDesc.split(/\s+/).filter((t) => t.length > 2);
  if (!normalizedMerchant && descTokens.length === 0) {
    return { blocked: true, reason: "No usable matcher signal" };
  }
  const matcherType = normalizedMerchant ? "merchant_normalized" : "description_pattern";
  const matcherConfig = normalizedMerchant
    ? { normalized_merchant: normalizedMerchant, direction: "debit" }
    : { description_tokens: descTokens };
  return { blocked: false, matcherType, matcherConfig, normalizedCategory };
}

function createRule(input, userId, transactionId) {
  return {
    id: `rule-${Math.random().toString(36).slice(2)}`,
    user_id: userId,
    rule_type: "transaction_category",
    matcher_type: input.matcherType,
    matcher_config: input.matcherConfig,
    action_type: "set_category",
    action_config: { category: input.normalizedCategory },
    confidence: 0.70,
    status: "active",
    requires_confirmation: true,
    created_from_user_action: true,
    source_entity_type: "transaction",
    source_entity_id: transactionId,
    last_applied_at: null,
    apply_count: 0,
  };
}

function strengthenRule(rule) {
  return { ...rule, confidence: Math.min(rule.confidence + 0.05, 1.0) };
}

// ─── Inlined: buildSuggestionsForRule ────────────────────────────────────────

function buildSuggestionsForRule(rule, candidates, excludeTransactionId) {
  if (SENSITIVE_CATEGORIES.has((rule.action_config.category ?? "").toLowerCase())) return [];
  if (rule.status !== "active") return [];
  const results = [];
  for (const tx of candidates) {
    if (tx.id === excludeTransactionId) continue;
    if (tx.direction !== "debit") continue;
    if (tx.category != null && tx.category !== "") continue;
    const match = evaluateRule(rule, tx);
    if (!match.matched) continue;
    results.push({
      user_id: rule.user_id,
      automation_rule_id: rule.id,
      source_entity_id: tx.id,
      suggested_action: { category: rule.action_config.category, reason: match.reason },
      confidence: match.confidence,
      status: "pending",
    });
  }
  return results;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDebitTx(id, overrides = {}) {
  return {
    id, direction: "debit", amount: 15.00, status: "posted",
    deleted_at: null, merchant_name: null, description: null, category: null,
    ...overrides,
  };
}

function makeMerchantRule(normalizedMerchant, category, userId = "user-a") {
  return {
    id: "rule-1", user_id: userId, rule_type: "transaction_category",
    matcher_type: "merchant_normalized",
    matcher_config: { normalized_merchant: normalizedMerchant, direction: "debit" },
    action_type: "set_category", action_config: { category },
    confidence: 0.70, status: "active", requires_confirmation: true,
    created_from_user_action: true, source_entity_type: null, source_entity_id: null,
    apply_count: 0, last_applied_at: null,
  };
}

// ─── 1. ruleBuilder: sensitive category blocking ──────────────────────────────

test("deriveRuleInput: blocks 'business' (sensitive)", () => {
  const result = deriveRuleInput({ merchantName: "Apple", description: null, category: "business" });
  assert.equal(result.blocked, true);
  assert.match(result.reason, /sensitive/i);
});

test("deriveRuleInput: blocks 'meals' (sensitive)", () => {
  const result = deriveRuleInput({ merchantName: "Yelp", description: null, category: "meals" });
  assert.equal(result.blocked, true);
});

test("deriveRuleInput: blocks 'office supplies' (sensitive)", () => {
  const result = deriveRuleInput({ merchantName: "Staples", description: null, category: "office supplies" });
  assert.equal(result.blocked, true);
});

test("deriveRuleInput: does not block 'entertainment' (safe category)", () => {
  const result = deriveRuleInput({ merchantName: "Netflix", description: null, category: "entertainment" });
  assert.equal(result.blocked, false);
  assert.equal(result.matcherType, "merchant_normalized");
});

test("deriveRuleInput: returns blocked=true when no merchant and no desc tokens", () => {
  const result = deriveRuleInput({ merchantName: "", description: "  ", category: "shopping" });
  assert.equal(result.blocked, true);
  assert.match(result.reason, /matcher signal/i);
});

// ─── 2. ruleBuilder: matcher type selection ──────────────────────────────────

test("deriveRuleInput: uses merchant_normalized when merchant name present", () => {
  const result = deriveRuleInput({ merchantName: "Netflix, Inc.", description: "streaming service", category: "subscriptions" });
  assert.equal(result.blocked, false);
  assert.equal(result.matcherType, "merchant_normalized");
  assert.equal(result.matcherConfig.normalized_merchant, "netflix");
});

test("deriveRuleInput: uses description_pattern when no merchant name", () => {
  const result = deriveRuleInput({ merchantName: null, description: "Monthly streaming subscription", category: "subscriptions" });
  assert.equal(result.blocked, false);
  assert.equal(result.matcherType, "description_pattern");
  assert.ok(Array.isArray(result.matcherConfig.description_tokens));
  assert.ok(result.matcherConfig.description_tokens.includes("monthly"));
  assert.ok(result.matcherConfig.description_tokens.includes("streaming"));
  assert.ok(result.matcherConfig.description_tokens.includes("subscription"));
});

test("deriveRuleInput: description tokens exclude words of length <= 2", () => {
  const result = deriveRuleInput({ merchantName: null, description: "gym at the mall on street", category: "fitness" });
  assert.equal(result.blocked, false);
  assert.ok(!result.matcherConfig.description_tokens.includes("at"), "'at' (len 2) should be filtered");
  assert.ok(result.matcherConfig.description_tokens.includes("gym"), "'gym' (len 3) should be kept");
});

test("deriveRuleInput: prefers merchant over description when both are present", () => {
  const result = deriveRuleInput({ merchantName: "Spotify", description: "monthly music subscription", category: "subscriptions" });
  assert.equal(result.matcherType, "merchant_normalized");
});

// ─── 3. ruleBuilder: rule creation and strengthening ─────────────────────────

test("createRule: creates rule with confidence=0.70 and requires_confirmation=true", () => {
  const input = deriveRuleInput({ merchantName: "Spotify", description: null, category: "subscriptions" });
  assert.equal(input.blocked, false);
  const rule = createRule(input, "user-a", "tx-1");
  assert.equal(rule.confidence, 0.70);
  assert.equal(rule.requires_confirmation, true);
  assert.equal(rule.created_from_user_action, true);
  assert.equal(rule.status, "active");
  assert.equal(rule.rule_type, "transaction_category");
});

test("strengthenRule: increments confidence by 0.05", () => {
  const input = deriveRuleInput({ merchantName: "Spotify", description: null, category: "subscriptions" });
  const rule = createRule(input, "user-a", "tx-1");
  const strengthened = strengthenRule(rule);
  assert.ok(Math.abs(strengthened.confidence - 0.75) < 0.0001, `Expected 0.75, got ${strengthened.confidence}`);
});

test("strengthenRule: caps confidence at 1.0", () => {
  const input = deriveRuleInput({ merchantName: "Netflix", description: null, category: "entertainment" });
  const rule = { ...createRule(input, "user-a", "tx-1"), confidence: 0.98 };
  const strengthened = strengthenRule(rule);
  assert.ok(Math.abs(strengthened.confidence - 1.0) < 0.0001, `Expected 1.0, got ${strengthened.confidence}`);
});

test("strengthenRule: multiple strengthens never exceed 1.0", () => {
  const input = deriveRuleInput({ merchantName: "Netflix", description: null, category: "entertainment" });
  let rule = createRule(input, "user-a", "tx-1");
  for (let i = 0; i < 10; i++) rule = strengthenRule(rule);
  assert.ok(rule.confidence <= 1.0, `Confidence exceeded 1.0: ${rule.confidence}`);
});

// ─── 4. buildSuggestionsForRule: core generation ─────────────────────────────

test("buildSuggestionsForRule: generates suggestion for matching uncategorized debit", () => {
  const rule = makeMerchantRule("netflix", "entertainment");
  const candidates = [makeDebitTx("tx-2", { merchant_name: "Netflix, Inc." })];
  const results = buildSuggestionsForRule(rule, candidates, "tx-1");
  assert.equal(results.length, 1);
  assert.equal(results[0].source_entity_id, "tx-2");
  assert.equal(results[0].suggested_action.category, "entertainment");
  assert.equal(results[0].status, "pending");
  assert.equal(results[0].confidence, MERCHANT_EXACT_CONFIDENCE);
});

test("buildSuggestionsForRule: excludes the originating transaction (excludeTransactionId)", () => {
  const rule = makeMerchantRule("netflix", "entertainment");
  const candidates = [
    makeDebitTx("tx-1", { merchant_name: "Netflix, Inc." }), // originating — must be skipped
    makeDebitTx("tx-2", { merchant_name: "Netflix, Inc." }),
  ];
  const results = buildSuggestionsForRule(rule, candidates, "tx-1");
  assert.equal(results.length, 1);
  assert.equal(results[0].source_entity_id, "tx-2");
});

test("buildSuggestionsForRule: excludes already-categorized transactions", () => {
  const rule = makeMerchantRule("netflix", "entertainment");
  const candidates = [
    makeDebitTx("tx-2", { merchant_name: "Netflix, Inc.", category: "subscriptions" }), // has category
    makeDebitTx("tx-3", { merchant_name: "Netflix, Inc." }),                             // uncategorized
  ];
  const results = buildSuggestionsForRule(rule, candidates, "tx-1");
  assert.equal(results.length, 1);
  assert.equal(results[0].source_entity_id, "tx-3");
});

test("buildSuggestionsForRule: excludes credit transactions", () => {
  const rule = makeMerchantRule("netflix", "entertainment");
  const candidates = [
    makeDebitTx("tx-2", { direction: "credit", merchant_name: "Netflix" }), // credit
    makeDebitTx("tx-3", { merchant_name: "Netflix, Inc." }),                 // debit
  ];
  const results = buildSuggestionsForRule(rule, candidates, "tx-1");
  assert.equal(results.length, 1);
  assert.equal(results[0].source_entity_id, "tx-3");
});

test("buildSuggestionsForRule: returns [] when rule has sensitive category", () => {
  const rule = makeMerchantRule("staples", "office supplies");
  const candidates = [makeDebitTx("tx-2", { merchant_name: "Staples" })];
  const results = buildSuggestionsForRule(rule, candidates, "tx-1");
  assert.equal(results.length, 0, "office supplies is sensitive — no suggestions allowed");
});

test("buildSuggestionsForRule: returns [] when rule is paused", () => {
  const rule = { ...makeMerchantRule("netflix", "entertainment"), status: "paused" };
  const candidates = [makeDebitTx("tx-2", { merchant_name: "Netflix" })];
  const results = buildSuggestionsForRule(rule, candidates, "tx-1");
  assert.equal(results.length, 0);
});

test("buildSuggestionsForRule: returns [] when no candidates match the rule", () => {
  const rule = makeMerchantRule("netflix", "entertainment");
  const candidates = [makeDebitTx("tx-2", { merchant_name: "Spotify" })];
  const results = buildSuggestionsForRule(rule, candidates, "tx-1");
  assert.equal(results.length, 0);
});

test("buildSuggestionsForRule: preserves confidence from match (partial = 0.65)", () => {
  const rule = makeMerchantRule("starbucks", "food");
  const candidates = [makeDebitTx("tx-2", { merchant_name: "STARBUCKS COFFEE CO" })];
  const results = buildSuggestionsForRule(rule, candidates, "tx-1");
  assert.equal(results.length, 1);
  // "starbucks coffee" starts with "starbucks" → partial match → 0.65
  assert.equal(results[0].confidence, MERCHANT_PARTIAL_CONFIDENCE);
});

test("buildSuggestionsForRule: multiple matches generate one suggestion each", () => {
  const rule = makeMerchantRule("netflix", "entertainment");
  const candidates = [
    makeDebitTx("tx-2", { merchant_name: "Netflix, Inc." }),
    makeDebitTx("tx-3", { merchant_name: "Netflix" }),
    makeDebitTx("tx-4", { merchant_name: "Spotify" }), // no match
  ];
  const results = buildSuggestionsForRule(rule, candidates, "tx-1");
  assert.equal(results.length, 2);
  const ids = results.map((r) => r.source_entity_id);
  assert.ok(ids.includes("tx-2"));
  assert.ok(ids.includes("tx-3"));
});

// ─── 5. API guard: sensitive category check ───────────────────────────────────

test("categorize API guard: all sensitive categories are blocked", () => {
  const sensitiveCats = ["business", "home office", "vehicle", "equipment", "software",
    "meals", "travel", "professional services", "advertising", "office supplies", "insurance", "utilities"];
  for (const cat of sensitiveCats) {
    assert.ok(SENSITIVE_CATEGORIES.has(cat), `"${cat}" should be blocked`);
  }
});

test("categorize API guard: common safe categories pass through", () => {
  const safeCats = ["food", "groceries", "entertainment", "shopping", "fitness", "subscriptions", "healthcare"];
  for (const cat of safeCats) {
    assert.ok(!SENSITIVE_CATEGORIES.has(cat), `"${cat}" should not be blocked`);
  }
});

test("categorize API guard: check is case-insensitive (normalizes to lowercase first)", () => {
  const rawCategory = "MEALS";
  const blocked = SENSITIVE_CATEGORIES.has(rawCategory.toLowerCase());
  assert.equal(blocked, true);
});

test("categorize API guard: empty category is not sensitive", () => {
  const blocked = SENSITIVE_CATEGORIES.has("");
  assert.equal(blocked, false);
});

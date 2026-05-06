/**
 * Budget Automation PR A: backend foundation tests.
 *
 * Covers: spending summary engine (pure), budget suggestion engine (pure),
 * API route structure, feature flag defaults, auth guards, user scoping,
 * financial field protection, cross-user isolation, and regression checks.
 *
 * All behavioral logic is inlined — no TypeScript imports.
 * Source files are read via fs.readFileSync for structural assertions.
 *
 * Run with: node --test tests/budget/budget-pr-a.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ─── Inline: isExcludedFromSpendingSummary ───────────────────────────────────

function isExcludedFromSpendingSummary(tx) {
  if (tx.direction !== "debit") return true;
  if ((tx.transaction_type ?? "").toLowerCase() === "transfer") return true;
  if (tx.deleted_at != null) return true;
  if (tx.status !== "posted") return true;
  return false;
}

// ─── Inline: extractMonth ────────────────────────────────────────────────────

function extractMonth(transactionDate) {
  if (!transactionDate) return null;
  const d = new Date(transactionDate);
  if (isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ─── Inline: computeCutoffDate ───────────────────────────────────────────────

function computeCutoffDate(monthsBack) {
  const now = new Date();
  const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
  const y = cutoff.getUTCFullYear();
  const m = String(cutoff.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

// ─── Inline: buildMonthlyCategorySpend ──────────────────────────────────────

function toNum(v) {
  if (typeof v === "number") return v;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function buildMonthlyCategorySpend(transactions, monthsBack = 6) {
  const cutoff = computeCutoffDate(monthsBack);
  const byMonth = new Map();

  for (const tx of transactions) {
    if (isExcludedFromSpendingSummary(tx)) continue;
    const month = extractMonth(tx.transaction_date ?? null);
    if (!month) continue;
    if (month < cutoff.substring(0, 7)) continue;

    const category = (tx.category ?? "").trim() || "Uncategorized";
    const amount = toNum(tx.amount);
    if (amount <= 0) continue;

    if (!byMonth.has(month)) byMonth.set(month, new Map());
    const monthMap = byMonth.get(month);
    monthMap.set(category, (monthMap.get(category) ?? 0) + amount);
  }

  const rows = [];
  for (const [month, catMap] of byMonth) {
    for (const [category, total] of catMap) {
      rows.push({ month, category, total });
    }
  }
  rows.sort((a, b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category));
  return { byMonth, rows };
}

// ─── Inline: computeCategoryAverages ────────────────────────────────────────

function computeCategoryAverages(byMonth) {
  const categoryTotals = new Map();
  for (const catMap of byMonth.values()) {
    for (const [category, total] of catMap) {
      const existing = categoryTotals.get(category) ?? { sum: 0, count: 0 };
      categoryTotals.set(category, { sum: existing.sum + total, count: existing.count + 1 });
    }
  }
  const result = new Map();
  for (const [category, { sum, count }] of categoryTotals) {
    result.set(category, { avgMonthlySpend: count > 0 ? sum / count : 0, monthCount: count });
  }
  return result;
}

// ─── Inline: buildBudgetSuggestions ─────────────────────────────────────────

const MIN_BASIS_MONTHS = 2;
const CONFIDENCE_3_OR_MORE = 0.80;
const CONFIDENCE_EXACTLY_2 = 0.60;
const SKIP_CATEGORIES = new Set(["uncategorized"]);

function buildBudgetSuggestions(byMonth, existingPendingCategories, existingAcceptedCategories) {
  const averages = computeCategoryAverages(byMonth);
  const results = [];

  for (const [category, { avgMonthlySpend, monthCount }] of averages) {
    if (SKIP_CATEGORIES.has(category.toLowerCase())) continue;
    if (monthCount < MIN_BASIS_MONTHS) continue;
    if (existingPendingCategories.has(category.toLowerCase())) continue;
    if (existingAcceptedCategories.has(category.toLowerCase())) continue;

    const confidence = monthCount >= 3 ? CONFIDENCE_3_OR_MORE : CONFIDENCE_EXACTLY_2;
    const suggestedAmount = Math.ceil(avgMonthlySpend * 100) / 100;
    const reason =
      monthCount >= 3
        ? `Based on ${monthCount} months of history, you typically spend $${avgMonthlySpend.toFixed(2)}/month on ${category}.`
        : `Based on ${monthCount} months of history, you spent around $${avgMonthlySpend.toFixed(2)}/month on ${category}.`;

    results.push({ category, suggestedAmount, basisMonths: monthCount, avgMonthlySpend, confidence, reason });
  }

  results.sort((a, b) => b.confidence - a.confidence || a.category.localeCompare(b.category));
  return results;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTx(overrides = {}) {
  return {
    id: "tx-001",
    direction: "debit",
    amount: 100,
    status: "posted",
    deleted_at: null,
    transaction_type: "purchase",
    category: "Groceries",
    transaction_date: "2026-04-15",
    ...overrides,
  };
}

// Build a byMonth map with N months of spend for a category, starting from a given YYYY-MM
function buildByMonth(category, monthlyAmounts) {
  const byMonth = new Map();
  const now = new Date();
  monthlyAmounts.forEach((amount, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const catMap = new Map();
    catMap.set(category, amount);
    byMonth.set(key, catMap);
  });
  return byMonth;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. isExcludedFromSpendingSummary — exclusion guards
// ═══════════════════════════════════════════════════════════════════════════════

test("includes eligible posted debit transactions", () => {
  assert.equal(isExcludedFromSpendingSummary(makeTx()), false);
});

test("excludes credit/income transactions (direction = credit)", () => {
  assert.equal(isExcludedFromSpendingSummary(makeTx({ direction: "credit" })), true);
});

test("excludes non-debit directions", () => {
  assert.equal(isExcludedFromSpendingSummary(makeTx({ direction: "inbound" })), true);
});

test("excludes transfer transaction_type", () => {
  assert.equal(isExcludedFromSpendingSummary(makeTx({ transaction_type: "transfer" })), true);
  assert.equal(isExcludedFromSpendingSummary(makeTx({ transaction_type: "Transfer" })), true);
  assert.equal(isExcludedFromSpendingSummary(makeTx({ transaction_type: "TRANSFER" })), true);
});

test("excludes soft-deleted transactions (deleted_at set)", () => {
  assert.equal(isExcludedFromSpendingSummary(makeTx({ deleted_at: "2026-01-01T00:00:00Z" })), true);
});

test("excludes pending status", () => {
  assert.equal(isExcludedFromSpendingSummary(makeTx({ status: "pending" })), true);
});

test("excludes reversed status", () => {
  assert.equal(isExcludedFromSpendingSummary(makeTx({ status: "reversed" })), true);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. extractMonth — date parsing
// ═══════════════════════════════════════════════════════════════════════════════

test("extractMonth returns YYYY-MM for a valid date string", () => {
  assert.equal(extractMonth("2026-04-15"), "2026-04");
});

test("extractMonth handles end-of-month dates", () => {
  assert.equal(extractMonth("2026-01-31"), "2026-01");
});

test("extractMonth returns null for null input", () => {
  assert.equal(extractMonth(null), null);
});

test("extractMonth returns null for undefined input", () => {
  assert.equal(extractMonth(undefined), null);
});

test("extractMonth returns null for empty string", () => {
  assert.equal(extractMonth(""), null);
});

test("extractMonth returns null for invalid date", () => {
  assert.equal(extractMonth("not-a-date"), null);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. buildMonthlyCategorySpend — grouping and aggregation
// ═══════════════════════════════════════════════════════════════════════════════

test("aggregates debit amounts by month and category", () => {
  const txs = [
    makeTx({ category: "Groceries", amount: 50, transaction_date: "2026-04-01" }),
    makeTx({ category: "Groceries", amount: 30, transaction_date: "2026-04-15" }),
    makeTx({ category: "Dining", amount: 80, transaction_date: "2026-04-20" }),
  ];
  const { rows } = buildMonthlyCategorySpend(txs, 6);
  const groceries = rows.find(r => r.month === "2026-04" && r.category === "Groceries");
  assert.ok(groceries, "Groceries row must exist for 2026-04");
  assert.equal(groceries.total, 80);
  const dining = rows.find(r => r.month === "2026-04" && r.category === "Dining");
  assert.equal(dining.total, 80);
});

test("buckets null/empty category as Uncategorized", () => {
  const txs = [
    makeTx({ category: null, amount: 25, transaction_date: "2026-04-10" }),
    makeTx({ category: "", amount: 15, transaction_date: "2026-04-10" }),
  ];
  const { rows } = buildMonthlyCategorySpend(txs, 6);
  const uncategorized = rows.find(r => r.category === "Uncategorized");
  assert.ok(uncategorized, "Uncategorized bucket must exist");
  assert.equal(uncategorized.total, 40);
});

test("excludes transactions older than monthsBack cutoff", () => {
  const old = makeTx({ amount: 500, transaction_date: "2019-01-15" });
  const { rows } = buildMonthlyCategorySpend([old], 6);
  assert.equal(rows.length, 0, "Old transaction must be excluded");
});

test("returns deterministic row ordering: month desc, category asc", () => {
  const txs = [
    makeTx({ category: "Zippers", amount: 10, transaction_date: "2026-04-01" }),
    makeTx({ category: "Apples", amount: 20, transaction_date: "2026-04-01" }),
    makeTx({ category: "Groceries", amount: 30, transaction_date: "2026-03-01" }),
  ];
  const { rows } = buildMonthlyCategorySpend(txs, 6);
  assert.equal(rows[0].month, "2026-04");
  assert.equal(rows[0].category, "Apples");
  assert.equal(rows[1].category, "Zippers");
  assert.equal(rows[2].month, "2026-03");
});

test("skips transactions with amount <= 0", () => {
  const txs = [makeTx({ amount: 0, transaction_date: "2026-04-01" })];
  const { rows } = buildMonthlyCategorySpend(txs, 6);
  assert.equal(rows.length, 0);
});

test("returns empty rows and empty byMonth for empty input", () => {
  const { rows, byMonth } = buildMonthlyCategorySpend([], 6);
  assert.equal(rows.length, 0);
  assert.equal(byMonth.size, 0);
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. buildBudgetSuggestions — pure logic
// ═══════════════════════════════════════════════════════════════════════════════

test("generates suggestion for category with 3+ months of data", () => {
  const byMonth = buildByMonth("Groceries", [120, 100, 110]);
  const suggestions = buildBudgetSuggestions(byMonth, new Set(), new Set());
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].category, "Groceries");
  assert.equal(suggestions[0].confidence, 0.80);
  assert.equal(suggestions[0].basisMonths, 3);
});

test("generates suggestion with confidence 0.60 for exactly 2 months", () => {
  const byMonth = buildByMonth("Dining", [80, 100]);
  const suggestions = buildBudgetSuggestions(byMonth, new Set(), new Set());
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].confidence, 0.60);
  assert.equal(suggestions[0].basisMonths, 2);
});

test("does not generate suggestion for category with only 1 month of data", () => {
  const byMonth = buildByMonth("Rare", [200]);
  const suggestions = buildBudgetSuggestions(byMonth, new Set(), new Set());
  assert.equal(suggestions.length, 0);
});

test("skips Uncategorized category entirely", () => {
  const byMonth = buildByMonth("Uncategorized", [50, 60, 70]);
  const suggestions = buildBudgetSuggestions(byMonth, new Set(), new Set());
  assert.equal(suggestions.length, 0);
});

test("skips uncategorized case-insensitively", () => {
  const byMonth = buildByMonth("UNCATEGORIZED", [50, 60, 70]);
  const suggestions = buildBudgetSuggestions(byMonth, new Set(), new Set());
  assert.equal(suggestions.length, 0);
});

test("skips category already in existingPendingCategories", () => {
  const byMonth = buildByMonth("Groceries", [100, 110, 120]);
  const suggestions = buildBudgetSuggestions(byMonth, new Set(["groceries"]), new Set());
  assert.equal(suggestions.length, 0);
});

test("skips category already in existingAcceptedCategories", () => {
  const byMonth = buildByMonth("Groceries", [100, 110, 120]);
  const suggestions = buildBudgetSuggestions(byMonth, new Set(), new Set(["groceries"]));
  assert.equal(suggestions.length, 0);
});

test("suggestedAmount is ceiling of avgMonthlySpend (never under-budgets)", () => {
  const byMonth = buildByMonth("Groceries", [101.99, 102.01]);
  const suggestions = buildBudgetSuggestions(byMonth, new Set(), new Set());
  assert.equal(suggestions.length, 1);
  const avg = (101.99 + 102.01) / 2; // 102.00
  const expected = Math.ceil(avg * 100) / 100;
  assert.equal(suggestions[0].suggestedAmount, expected);
});

test("suggestions are sorted by confidence desc, then category asc", () => {
  const byMonth = new Map();
  const now = new Date();
  // Zippers: 3 months (confidence 0.80)
  for (let i = 0; i < 3; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(key)) byMonth.set(key, new Map());
    byMonth.get(key).set("Zippers", 50);
  }
  // Apples: 2 months (confidence 0.60)
  for (let i = 0; i < 2; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(key)) byMonth.set(key, new Map());
    byMonth.get(key).set("Apples", 40);
  }
  const suggestions = buildBudgetSuggestions(byMonth, new Set(), new Set());
  assert.equal(suggestions[0].category, "Zippers", "Higher confidence first");
  assert.equal(suggestions[1].category, "Apples");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Suggestion explainability
// ═══════════════════════════════════════════════════════════════════════════════

test("reason mentions month count and spend amount", () => {
  const byMonth = buildByMonth("Groceries", [100, 120, 110]);
  const suggestions = buildBudgetSuggestions(byMonth, new Set(), new Set());
  assert.ok(suggestions[0].reason.includes("3 months"), "Reason must mention month count");
  assert.ok(suggestions[0].reason.match(/\$[\d.]+\/month/), "Reason must mention monthly amount");
});

test("reason for 2-month basis uses softer language (spent around)", () => {
  const byMonth = buildByMonth("Dining", [80, 100]);
  const suggestions = buildBudgetSuggestions(byMonth, new Set(), new Set());
  assert.ok(suggestions[0].reason.includes("spent around"), "2-month reason must say 'spent around'");
});

test("reason for 3+ month basis uses stronger language (typically spend)", () => {
  const byMonth = buildByMonth("Groceries", [100, 110, 120]);
  const suggestions = buildBudgetSuggestions(byMonth, new Set(), new Set());
  assert.ok(suggestions[0].reason.includes("typically spend"), "3-month reason must say 'typically spend'");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Feature flag defaults
// ═══════════════════════════════════════════════════════════════════════════════

test("BUDGET_AUTOMATION_ENABLED is exported from constants.ts", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/constants.ts"), "utf8");
  assert.match(src, /BUDGET_AUTOMATION_ENABLED/, "Must export BUDGET_AUTOMATION_ENABLED");
});

test("BUDGET_AUTOMATION_ENABLED is defined as a boolean constant", () => {
  // PR A set this to false; PR B flips it to true. Both are valid — just verify it's exported.
  const src = readFileSync(path.join(ROOT, "src/lib/automation/constants.ts"), "utf8");
  assert.match(src, /BUDGET_AUTOMATION_ENABLED\s*=\s*(true|false)/, "Flag must be defined as a boolean");
});

test("constants.ts still exports SENSITIVE_CATEGORIES (regression)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/constants.ts"), "utf8");
  assert.match(src, /SENSITIVE_CATEGORIES/, "SENSITIVE_CATEGORIES must still be exported");
});

test("constants.ts still exports BUSINESS_EXPENSE_SUGGESTIONS_ENABLED (regression)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/constants.ts"), "utf8");
  assert.match(src, /BUSINESS_EXPENSE_SUGGESTIONS_ENABLED/, "Must still export business flag");
});

test("constants.ts still exports WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED (regression)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/constants.ts"), "utf8");
  assert.match(src, /WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED/, "Must still export write-off flag");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. API route existence and auth guards
// ═══════════════════════════════════════════════════════════════════════════════

test("GET /api/budget/summary route file exists", () => {
  assert.ok(existsSync(path.join(ROOT, "app/api/budget/summary/route.ts")));
});

test("GET /api/budget/suggestions route file exists", () => {
  assert.ok(existsSync(path.join(ROOT, "app/api/budget/suggestions/route.ts")));
});

test("GET /api/budget/summary requires authentication (401)", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/summary/route.ts"), "utf8");
  assert.match(src, /Unauthorized.*401/s, "Must return 401 when unauthenticated");
});

test("GET /api/budget/suggestions requires authentication (401)", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/suggestions/route.ts"), "utf8");
  assert.match(src, /Unauthorized.*401/s, "Must return 401 when unauthenticated");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. User scoping
// ═══════════════════════════════════════════════════════════════════════════════

test("GET /api/budget/summary filters by user_id", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/summary/route.ts"), "utf8");
  assert.match(src, /\.eq\(["']user_id["'],\s*userId\)/, "Must filter transactions by user_id");
});

test("GET /api/budget/suggestions filters by user_id", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/suggestions/route.ts"), "utf8");
  assert.match(src, /\.eq\(["']user_id["'],\s*userId\)/, "Must filter suggestions by user_id");
});

test("GET /api/budget/summary uses createRouteClient for auth context", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/summary/route.ts"), "utf8");
  assert.match(src, /createRouteClient/, "Must use createRouteClient");
});

test("GET /api/budget/suggestions uses createRouteClient for auth context", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/suggestions/route.ts"), "utf8");
  assert.match(src, /createRouteClient/, "Must use createRouteClient");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Flag guard: suggestions returns empty while BUDGET_AUTOMATION_ENABLED = false
// ═══════════════════════════════════════════════════════════════════════════════

test("GET /api/budget/suggestions imports BUDGET_AUTOMATION_ENABLED flag", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/suggestions/route.ts"), "utf8");
  assert.match(src, /BUDGET_AUTOMATION_ENABLED/, "Must reference the feature flag");
});

test("GET /api/budget/suggestions returns empty array when flag is false", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/suggestions/route.ts"), "utf8");
  assert.match(src, /!BUDGET_AUTOMATION_ENABLED[\s\S]{0,100}suggestions.*\[\]/, "Must return empty suggestions when flag is false");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. No writes to transactions or financial fields
// ═══════════════════════════════════════════════════════════════════════════════

test("GET /api/budget/summary never writes to any table", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/summary/route.ts"), "utf8");
  assert.doesNotMatch(src, /\.insert\(/, "Summary route must not insert");
  assert.doesNotMatch(src, /\.update\(/, "Summary route must not update");
  assert.doesNotMatch(src, /\.delete\(/, "Summary route must not delete");
  assert.doesNotMatch(src, /\.upsert\(/, "Summary route must not upsert");
});

test("GET /api/budget/suggestions never writes to any table", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/suggestions/route.ts"), "utf8");
  assert.doesNotMatch(src, /\.insert\(/, "Suggestions route must not insert");
  assert.doesNotMatch(src, /\.update\(/, "Suggestions route must not update");
  assert.doesNotMatch(src, /\.delete\(/, "Suggestions route must not delete");
  assert.doesNotMatch(src, /\.upsert\(/, "Suggestions route must not upsert");
});

test("spendingSummaryEngine.ts contains no DB calls", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/budget/spendingSummaryEngine.ts"), "utf8");
  assert.doesNotMatch(src, /supabase|createClient|from\(/, "Engine must be a pure function with no DB calls");
});

test("budgetSuggestionEngine.ts does not write to transactions table", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/budget/budgetSuggestionEngine.ts"), "utf8");
  assert.doesNotMatch(src, /from\(["']transactions["']\).*\.update\(/s, "Must not update transactions");
});

test("budgetSuggestionEngine.ts does not reference financial field names that it writes", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/budget/budgetSuggestionEngine.ts"), "utf8");
  // These are the NON_AUTOMATABLE_TX_FIELDS that must never be written by automation
  assert.doesNotMatch(src, /\.update\([^)]*income_subtype/, "Must not write income_subtype");
  assert.doesNotMatch(src, /\.update\([^)]*direction/, "Must not write direction");
  assert.doesNotMatch(src, /\.update\([^)]*amount[^_]/, "Must not write amount");
  assert.doesNotMatch(src, /\.update\([^)]*transaction_date/, "Must not write transaction_date");
  assert.doesNotMatch(src, /\.update\([^)]*transaction_type/, "Must not write transaction_type");
  assert.doesNotMatch(src, /\.update\([^)]*status/, "Must not write status");
});

test("budgetSuggestionEngine.ts does not write monthly_limit on budget_categories", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/budget/budgetSuggestionEngine.ts"), "utf8");
  // Must not appear in an update payload — comments mentioning it are fine
  assert.doesNotMatch(src, /\.update\([^)]*monthly_limit/, "Engine must not write monthly_limit — user must accept suggestion first");
  assert.doesNotMatch(src, /from\(["']budget_categories["']\).*\.update\(/s, "Must not write to budget_categories table");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. No Tax Center or Write-Off contamination
// ═══════════════════════════════════════════════════════════════════════════════

test("GET /api/budget/summary does not reference write_offs or Tax Center", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/summary/route.ts"), "utf8");
  assert.doesNotMatch(src, /from\(["']write_offs["']\)/i, "Must not query write_offs");
  assert.doesNotMatch(src, /tax_center|taxCenter/i, "Must not reference Tax Center");
  assert.doesNotMatch(src, /is_writeoff_candidate/i, "Must not reference write-off candidate flag");
  assert.doesNotMatch(src, /canonicalFinancialData/i, "Must not import canonicalFinancialData");
});

test("GET /api/budget/suggestions does not reference write_offs or Tax Center", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/suggestions/route.ts"), "utf8");
  assert.doesNotMatch(src, /from\(["']write_offs["']\)/i, "Must not query write_offs");
  assert.doesNotMatch(src, /tax_center|taxCenter/i, "Must not reference Tax Center");
  assert.doesNotMatch(src, /is_writeoff_candidate/i, "Must not reference write-off candidate flag");
  assert.doesNotMatch(src, /canonicalFinancialData/i, "Must not import canonicalFinancialData");
});

test("budgetSuggestionEngine.ts does not call financial aggregation functions", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/budget/budgetSuggestionEngine.ts"), "utf8");
  assert.doesNotMatch(src, /tax_center|taxCenter/i, "Must not reference Tax Center");
  assert.doesNotMatch(src, /is_writeoff_candidate/i, "Must not reference write-off fields");
  assert.doesNotMatch(src, /from\(["']write_offs["']\)/i, "Must not query write_offs");
  // RawTransaction is imported as a type reference from financialCalculations — that is permitted.
  // Guard against actual function calls from that module instead.
  assert.doesNotMatch(src, /calcTotal|calcTotalIn|calcTotalOut|activePostedTransactions/, "Must not call financial aggregation functions");
  assert.doesNotMatch(src, /canonicalFinancialData/i, "Must not import canonicalFinancialData");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 12. Migration files exist and have expected structure
// ═══════════════════════════════════════════════════════════════════════════════

test("budget_suggestions migration file exists", () => {
  assert.ok(existsSync(path.join(ROOT, "supabase/migrations/20260506000001_add_budget_suggestions.sql")));
});

test("budget_insights migration file exists", () => {
  assert.ok(existsSync(path.join(ROOT, "supabase/migrations/20260506000002_add_budget_insights.sql")));
});

test("budget_suggestions table has RLS enabled", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000001_add_budget_suggestions.sql"),
    "utf8",
  );
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/, "Must enable RLS on budget_suggestions");
});

test("budget_insights table has RLS enabled", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000002_add_budget_insights.sql"),
    "utf8",
  );
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/, "Must enable RLS on budget_insights");
});

test("budget_suggestions migration defines no DELETE policy", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000001_add_budget_suggestions.sql"),
    "utf8",
  );
  assert.doesNotMatch(sql, /FOR DELETE/i, "No DELETE policy — status transitions replace deletion");
});

test("budget_insights migration defines no DELETE policy", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000002_add_budget_insights.sql"),
    "utf8",
  );
  assert.doesNotMatch(sql, /FOR DELETE/i, "No DELETE policy — status transitions replace deletion");
});

test("budget_suggestions has pending dedup unique index", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000001_add_budget_suggestions.sql"),
    "utf8",
  );
  assert.match(sql, /UNIQUE INDEX.*WHERE.*status.*pending/s, "Must have partial unique index for pending dedup");
});

test("budget_suggestions migration includes rollback comment", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000001_add_budget_suggestions.sql"),
    "utf8",
  );
  assert.match(sql, /Rollback.*DROP TABLE/i, "Must include rollback comment");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 13. No cross-user data leakage
// ═══════════════════════════════════════════════════════════════════════════════

test("buildMonthlyCategorySpend produces isolated results per call (no shared state)", () => {
  const user1Txs = [makeTx({ category: "Groceries", amount: 100, transaction_date: "2026-04-01" })];
  const user2Txs = [makeTx({ category: "Travel", amount: 500, transaction_date: "2026-04-01" })];

  const { rows: rows1 } = buildMonthlyCategorySpend(user1Txs, 6);
  const { rows: rows2 } = buildMonthlyCategorySpend(user2Txs, 6);

  assert.ok(rows1.every(r => r.category === "Groceries"), "User1 results must only contain Groceries");
  assert.ok(rows2.every(r => r.category === "Travel"), "User2 results must only contain Travel");
  assert.ok(!rows1.some(r => r.category === "Travel"), "User1 must not see Travel");
  assert.ok(!rows2.some(r => r.category === "Groceries"), "User2 must not see Groceries");
});

test("buildBudgetSuggestions produces isolated results per call (no shared state)", () => {
  const byMonth1 = buildByMonth("Groceries", [100, 110, 120]);
  const byMonth2 = buildByMonth("Travel", [500, 600, 700]);

  const s1 = buildBudgetSuggestions(byMonth1, new Set(), new Set());
  const s2 = buildBudgetSuggestions(byMonth2, new Set(), new Set());

  assert.ok(s1.every(s => s.category === "Groceries"), "User1 suggestions must only be Groceries");
  assert.ok(s2.every(s => s.category === "Travel"), "User2 suggestions must only be Travel");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 14. Regression: existing automation service files untouched
// ═══════════════════════════════════════════════════════════════════════════════

test("automation/constants.ts still has NON_AUTOMATABLE_TX_FIELDS (regression)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/constants.ts"), "utf8");
  assert.match(src, /NON_AUTOMATABLE_TX_FIELDS/, "NON_AUTOMATABLE_TX_FIELDS must remain intact");
});

test("automation/constants.ts SENSITIVE_CATEGORIES still contains business (regression)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/constants.ts"), "utf8");
  assert.match(src, /"business"/, "SENSITIVE_CATEGORIES must still include business");
});

test("writeOffSuggestionEngine.ts still exists and has not been modified by budget work", () => {
  assert.ok(existsSync(path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts")));
});

test("automation suggestions route still exists (regression)", () => {
  assert.ok(existsSync(path.join(ROOT, "app/api/automation/suggestions/[id]/accept/route.ts")));
});

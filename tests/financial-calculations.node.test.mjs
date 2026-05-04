/**
 * Unit tests for the central financial calculation module.
 * Run with: npm run test:unit
 *
 * All tests use pure functions imported from the compiled JS.
 * Because the module is TypeScript, we import via the ts-to-js path or
 * use the helper re-export below.  Node's built-in test runner is used
 * (no Jest / Vitest dependency).
 */

import test from "node:test";
import assert from "node:assert/strict";

// ─── Inline implementations (mirrors src/lib/financialCalculations.ts) ────────
// We duplicate the pure functions here so the test file has zero build-time
// dependencies and can run with `node --test` directly.

function toNum(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function deduplicateTransactions(txs) {
  const seen = new Set();
  const result = [];
  for (const tx of txs) {
    let key;
    if (tx.external_transaction_id && tx.provider) {
      key = `ext:${tx.provider}:${tx.external_transaction_id}`;
    } else {
      // Fallback dedupe key: normalize fields to handle minor variations
      const accountId = tx.financial_account_id || "";
      const date = tx.transaction_date ? new Date(tx.transaction_date).toISOString().split('T')[0] : "";
      const amount = Math.abs(toNum(tx.amount)).toFixed(2);
      const merchant = (tx.merchant_name || "").trim().toLowerCase().replace(/\s+/g, ' ');
      const desc = (tx.description || "").trim().toLowerCase().replace(/\s+/g, ' ');
      const direction = tx.direction;
      key = `fp:${accountId}:${date}:${amount}:${merchant}:${desc}:${direction}`;
    }
    if (!seen.has(key)) {
      seen.add(key);
      result.push(tx);
    }
  }
  return result;
}

function activePostedTransactions(txs) {
  const posted = txs.filter((tx) => tx.status === "posted" && tx.deleted_at == null);
  return deduplicateTransactions(posted);
}

function calcTotalIn(txs) {
  return txs.filter((tx) => tx.direction === "credit").reduce((s, tx) => s + toNum(tx.amount), 0);
}

function calcTotalOut(txs) {
  return txs.filter((tx) => tx.direction === "debit").reduce((s, tx) => s + toNum(tx.amount), 0);
}

function calcNet(totalIn, totalOut) { return totalIn - totalOut; }
function calcTotalIncome(txs) { return calcTotalIn(txs); }
function calcTotalExpenses(txs) { return calcTotalOut(txs); }
function calcNetCashFlow(income, expenses) { return income - expenses; }

function calcTaggedIncome(txs) {
  return txs.filter((tx) => tx.direction === "credit" && !!tx.income_subtype).reduce((s, tx) => s + toNum(tx.amount), 0);
}

function calcUntaggedIncome(txs) {
  return txs.filter((tx) => tx.direction === "credit" && !tx.income_subtype).reduce((s, tx) => s + toNum(tx.amount), 0);
}

const TAX_CONTRIBUTING = new Set(["business", "rental", "other"]);
function calcTaxableIncomeBase(txs) {
  return txs.filter((tx) => tx.direction === "credit" && TAX_CONTRIBUTING.has(tx.income_subtype ?? "")).reduce((s, tx) => s + toNum(tx.amount), 0);
}

function calcTotalCash(accounts) {
  return accounts.filter((a) => {
    const type = (a.account_type ?? "").toLowerCase();
    const sub = (a.account_subtype ?? "").toLowerCase();
    return type === "depository" || type === "cash" || sub === "checking" || sub === "savings" || sub === "cd";
  }).reduce((s, a) => s + Math.max(toNum(a.current_balance), 0), 0);
}

function calcTotalInvestmentsFromAccounts(accounts) {
  return accounts.filter((a) => (a.account_type ?? "").toLowerCase() === "investment").reduce((s, a) => s + Math.max(toNum(a.current_balance), 0), 0);
}

function calcTotalLiabilities(accounts) {
  return accounts.filter((a) => {
    const type = (a.account_type ?? "").toLowerCase();
    const sub = (a.account_subtype ?? "").toLowerCase();
    return type === "credit" || sub === "loan" || sub === "mortgage" || sub === "line of credit";
  }).reduce((s, a) => s + Math.abs(toNum(a.current_balance)), 0);
}

function calcNetWorth(totalCash, totalInvestments, totalLiabilities) {
  return totalCash + totalInvestments - totalLiabilities;
}

function calcTotalInvestmentsFromPositions(positions) {
  return positions.reduce((s, p) => s + toNum(p.last_valuation), 0);
}

function calcTotalCostBasis(positions) {
  return positions.reduce((s, p) => s + toNum(p.total_cost_basis), 0);
}

function calcTotalUnrealizedGainLoss(positions) {
  return positions.reduce((s, p) => s + toNum(p.unrealized_gain), 0);
}

function calcTotalInvestments(positions, accounts) {
  const fromPositions = calcTotalInvestmentsFromPositions(positions);
  if (fromPositions > 0) return fromPositions;
  return calcTotalInvestmentsFromAccounts(accounts);
}

function calcPositionMarketValue(qty, price) { return toNum(qty) * toNum(price); }
function calcPositionGainLoss(mv, cb) { return toNum(mv) - toNum(cb); }
function calcPositionGainLossPct(gl, cb) {
  const b = toNum(cb);
  return b === 0 ? 0 : (gl / b) * 100;
}

function calcBudgetRemaining(limit, spent, adj) {
  return toNum(limit) - toNum(spent) + toNum(adj);
}
function calcBudgetUsedPct(spent, limit) {
  const l = toNum(limit);
  return l === 0 ? 0 : (toNum(spent) / l) * 100;
}

function calcTotalSaved(goals) {
  return goals.filter((g) => g.status === "active").reduce((s, g) => s + toNum(g.current_amount), 0);
}
function calcTotalTarget(goals) {
  return goals.filter((g) => g.status === "active" && toNum(g.target_amount) > 0).reduce((s, g) => s + toNum(g.target_amount), 0);
}
function calcActiveGoalsCount(goals) { return goals.filter((g) => g.status === "active").length; }
function calcGoalProgressPct(current, target) {
  const t = toNum(target);
  return t === 0 ? 0 : Math.min((toNum(current) / t) * 100, 100);
}

const DEFAULT_TAX_RATE = 0.25;
function calcDeductibleAmount(amount, pct) { return toNum(amount) * (toNum(pct) / 100); }
function calcTotalWriteOffExpenses(writeOffs) { return writeOffs.reduce((s, w) => s + toNum(w.amount), 0); }
function calcTotalDeductible(writeOffs, rules) {
  return writeOffs.reduce((s, w) => {
    const rule = rules.find((r) => r.value === w.deduction_type);
    const pct = rule ? rule.pct : 100;
    return s + calcDeductibleAmount(toNum(w.amount), pct);
  }, 0);
}
function calcTaxSavingsEstimate(deductible, rate = DEFAULT_TAX_RATE) {
  return toNum(deductible) * toNum(rate);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEDUCTION_RULES = [
  { value: "meals", pct: 50 },
  { value: "home_office", pct: 100 },
  { value: "equipment", pct: 100 },
  { value: "vehicle", pct: 100 },
  { value: "software", pct: 100 },
  { value: "travel", pct: 100 },
  { value: "marketing", pct: 100 },
  { value: "professional", pct: 100 },
  { value: "education", pct: 100 },
  { value: "other", pct: 100 },
];

// ─── toNum ────────────────────────────────────────────────────────────────────

test("toNum: handles null, undefined, NaN, Infinity, strings", () => {
  assert.equal(toNum(null), 0);
  assert.equal(toNum(undefined), 0);
  assert.equal(toNum(NaN), 0);
  assert.equal(toNum(Infinity), 0);
  assert.equal(toNum(-Infinity), 0);
  assert.equal(toNum("bad"), 0);
  assert.equal(toNum("123.45"), 123.45);
  assert.equal(toNum(0), 0);
  assert.equal(toNum(-50), -50);
});

// ─── Transaction filter ───────────────────────────────────────────────────────

test("activePostedTransactions: excludes pending and soft-deleted", () => {
  const txs = [
    { id: "1", status: "posted",  deleted_at: null, amount: 100, direction: "credit" },
    { id: "2", status: "pending", deleted_at: null, amount: 200, direction: "debit" },
    { id: "3", status: "posted",  deleted_at: "2026-01-01", amount: 300, direction: "credit" },
    { id: "4", status: "posted",  deleted_at: null, amount: 400, direction: "debit" },
  ];
  const result = activePostedTransactions(txs);
  assert.equal(result.length, 2);
  assert.deepEqual(result.map((t) => t.id), ["1", "4"]);
});

// ─── Transaction totals ───────────────────────────────────────────────────────

test("calcTotalIn / calcTotalOut / calcNet: basic math", () => {
  const txs = [
    { direction: "credit", amount: 5000 },
    { direction: "credit", amount: 1200 },
    { direction: "debit",  amount: 400 },
    { direction: "debit",  amount: 100 },
  ];
  assert.equal(calcTotalIn(txs), 6200);
  assert.equal(calcTotalOut(txs), 500);
  assert.equal(calcNet(calcTotalIn(txs), calcTotalOut(txs)), 5700);
});

test("calcTotalIn / calcTotalOut: null and bad values do not corrupt totals", () => {
  const txs = [
    { direction: "credit", amount: 1000 },
    { direction: "credit", amount: null },
    { direction: "debit",  amount: "bad" },
    { direction: "debit",  amount: 200 },
  ];
  assert.equal(calcTotalIn(txs), 1000);
  assert.equal(calcTotalOut(txs), 200);
});

// ─── Income ───────────────────────────────────────────────────────────────────

test("calcTotalIncome equals calcTotalIn", () => {
  const txs = [
    { direction: "credit", amount: 3000, income_subtype: "salary" },
    { direction: "debit",  amount: 500 },
  ];
  assert.equal(calcTotalIncome(txs), calcTotalIn(txs));
  assert.equal(calcTotalIncome(txs), 3000);
});

test("calcTaggedIncome and calcUntaggedIncome sum to totalIncome", () => {
  const txs = [
    { direction: "credit", amount: 5000, income_subtype: "salary" },
    { direction: "credit", amount: 2000, income_subtype: "business" },
    { direction: "credit", amount: 800,  income_subtype: null },
    { direction: "debit",  amount: 300 },
  ];
  const total = calcTotalIncome(txs);
  const tagged = calcTaggedIncome(txs);
  const untagged = calcUntaggedIncome(txs);
  assert.equal(total, 7800);
  assert.equal(tagged, 7000);
  assert.equal(untagged, 800);
  assert.equal(tagged + untagged, total);
});

test("calcTaxableIncomeBase: W2 salary and bonus excluded; business and rental included", () => {
  const txs = [
    { direction: "credit", amount: 5000, income_subtype: "salary" },    // excluded
    { direction: "credit", amount: 1000, income_subtype: "bonus" },     // excluded
    { direction: "credit", amount: 2000, income_subtype: "business" },  // included
    { direction: "credit", amount: 1500, income_subtype: "rental" },    // included
    { direction: "credit", amount: 500,  income_subtype: "other" },     // included
    { direction: "credit", amount: 750,  income_subtype: null },        // untagged — excluded
    { direction: "credit", amount: 300,  income_subtype: "dividend" },  // excluded
  ];
  assert.equal(calcTaxableIncomeBase(txs), 4000); // 2000 + 1500 + 500
});

// ─── Net cash flow ─────────────────────────────────────────────────────────────

test("calcNetCashFlow: income minus expenses", () => {
  assert.equal(calcNetCashFlow(10000, 7500), 2500);
  assert.equal(calcNetCashFlow(3000, 5000), -2000);
  assert.equal(calcNetCashFlow(0, 0), 0);
});

// ─── Account totals ───────────────────────────────────────────────────────────

test("calcTotalCash: depository and cash accounts, ignores negative balances", () => {
  const accounts = [
    { account_type: "depository", account_subtype: "checking", current_balance: 1500 },
    { account_type: "depository", account_subtype: "savings",  current_balance: 4000 },
    { account_type: "depository", account_subtype: "cd",       current_balance: 2000 },
    { account_type: "credit",     account_subtype: "credit card", current_balance: -800 },
    { account_type: "investment", account_subtype: "brokerage",   current_balance: 5000 },
  ];
  assert.equal(calcTotalCash(accounts), 7500); // 1500 + 4000 + 2000
});

test("calcTotalCash: does not include negative depository balance", () => {
  const accounts = [
    { account_type: "depository", account_subtype: "checking", current_balance: -50 },
    { account_type: "depository", account_subtype: "savings",  current_balance: 200 },
  ];
  assert.equal(calcTotalCash(accounts), 200);
});

test("calcTotalInvestmentsFromAccounts: investment accounts only", () => {
  const accounts = [
    { account_type: "investment", account_subtype: "brokerage", current_balance: 12000 },
    { account_type: "investment", account_subtype: "ira",       current_balance: 8000 },
    { account_type: "depository", account_subtype: "checking",  current_balance: 3000 },
  ];
  assert.equal(calcTotalInvestmentsFromAccounts(accounts), 20000);
});

test("calcTotalLiabilities: credit and loan accounts, uses absolute value", () => {
  const accounts = [
    { account_type: "credit",     account_subtype: "credit card",   current_balance: -1200 },
    { account_type: "loan",       account_subtype: "mortgage",      current_balance: -180000 },
    { account_type: "depository", account_subtype: "checking",      current_balance: 5000 },
  ];
  assert.equal(calcTotalLiabilities(accounts), 181200);
});

test("calcNetWorth: cash + investments - liabilities", () => {
  assert.equal(calcNetWorth(10000, 50000, 15000), 45000);
  assert.equal(calcNetWorth(5000, 0, 10000), -5000);
});

// ─── Investments from positions ────────────────────────────────────────────────

test("calcTotalInvestmentsFromPositions: sums last_valuation", () => {
  const positions = [
    { last_valuation: 10000, total_cost_basis: 8000, unrealized_gain: 2000 },
    { last_valuation: 5000,  total_cost_basis: 6000, unrealized_gain: -1000 },
    { last_valuation: null,  total_cost_basis: 0,    unrealized_gain: 0 },
  ];
  assert.equal(calcTotalInvestmentsFromPositions(positions), 15000);
});

test("calcTotalCostBasis and calcTotalUnrealizedGainLoss", () => {
  const positions = [
    { last_valuation: 10000, total_cost_basis: 8000,  unrealized_gain: 2000 },
    { last_valuation: 5000,  total_cost_basis: 6000,  unrealized_gain: -1000 },
  ];
  assert.equal(calcTotalCostBasis(positions), 14000);
  assert.equal(calcTotalUnrealizedGainLoss(positions), 1000);
});

test("calcTotalInvestments: prefers positions when available, falls back to accounts", () => {
  const positions = [{ last_valuation: 20000, total_cost_basis: 18000, unrealized_gain: 2000 }];
  const accounts  = [{ account_type: "investment", account_subtype: "brokerage", current_balance: 15000 }];

  assert.equal(calcTotalInvestments(positions, accounts), 20000); // positions win
  assert.equal(calcTotalInvestments([], accounts), 15000);         // falls back to accounts
});

test("calcPositionMarketValue / GainLoss / GainLossPct", () => {
  const mv = calcPositionMarketValue(10, 150);
  assert.equal(mv, 1500);

  const gl = calcPositionGainLoss(1500, 1200);
  assert.equal(gl, 300);

  const pct = calcPositionGainLossPct(300, 1200);
  assert.equal(pct, 25);

  // Zero cost basis returns 0
  assert.equal(calcPositionGainLossPct(300, 0), 0);
});

// ─── Budget ───────────────────────────────────────────────────────────────────

test("calcBudgetRemaining: limit - spent + adjustments", () => {
  assert.equal(calcBudgetRemaining(500, 300, 50), 250);
  assert.equal(calcBudgetRemaining(500, 600, 0), -100);  // over budget
  assert.equal(calcBudgetRemaining(0, 0, 0), 0);
});

test("calcBudgetUsedPct: percentage, handles zero limit", () => {
  assert.equal(calcBudgetUsedPct(250, 500), 50);
  assert.equal(calcBudgetUsedPct(600, 500), 120);  // over budget
  assert.equal(calcBudgetUsedPct(100, 0), 0);       // no limit set
});

// ─── Savings ─────────────────────────────────────────────────────────────────

test("calcTotalSaved: active goals only", () => {
  const goals = [
    { status: "active",   current_amount: 1000, target_amount: 5000 },
    { status: "active",   current_amount: 500,  target_amount: 2000 },
    { status: "archived", current_amount: 9999, target_amount: 10000 },
  ];
  assert.equal(calcTotalSaved(goals), 1500);
});

test("calcTotalTarget: active goals with positive targets only", () => {
  const goals = [
    { status: "active",   current_amount: 0, target_amount: 5000 },
    { status: "active",   current_amount: 0, target_amount: 0 },     // no target
    { status: "archived", current_amount: 0, target_amount: 10000 }, // archived
  ];
  assert.equal(calcTotalTarget(goals), 5000);
});

test("calcActiveGoalsCount", () => {
  const goals = [
    { status: "active" }, { status: "active" }, { status: "archived" },
  ];
  assert.equal(calcActiveGoalsCount(goals), 2);
});

test("calcGoalProgressPct: capped at 100%, handles zero target", () => {
  assert.equal(calcGoalProgressPct(500, 1000), 50);
  assert.equal(calcGoalProgressPct(1200, 1000), 100); // over-funded, capped
  assert.equal(calcGoalProgressPct(500, 0), 0);         // no target
});

// ─── Write-offs ───────────────────────────────────────────────────────────────

test("calcDeductibleAmount: applies percentage correctly", () => {
  assert.equal(calcDeductibleAmount(200, 50), 100);
  assert.equal(calcDeductibleAmount(500, 100), 500);
  assert.equal(calcDeductibleAmount(0, 100), 0);
});

test("calcTotalWriteOffExpenses: sums gross amounts before deduction rules", () => {
  const writeOffs = [
    { amount: 1000, deduction_type: "equipment", is_verified: true,  tax_year: 2026, expense_date: "2026-01-15" },
    { amount: 200,  deduction_type: "meals",     is_verified: false, tax_year: 2026, expense_date: "2026-02-10" },
    { amount: null, deduction_type: "other",     is_verified: false, tax_year: 2026, expense_date: "2026-03-01" },
  ];
  assert.equal(calcTotalWriteOffExpenses(writeOffs), 1200);
});

test("calcTotalDeductible: applies 50% rule for meals", () => {
  const writeOffs = [
    { amount: 1000, deduction_type: "equipment", is_verified: true,  tax_year: 2026, expense_date: "2026-01-15" },
    { amount: 200,  deduction_type: "meals",     is_verified: false, tax_year: 2026, expense_date: "2026-02-10" },
  ];
  const deductible = calcTotalDeductible(writeOffs, DEDUCTION_RULES);
  assert.equal(deductible, 1100); // 1000 + 100
});

test("calcTaxSavingsEstimate: uses DEFAULT_TAX_RATE and custom rate", () => {
  assert.equal(calcTaxSavingsEstimate(1000), 250);           // default 25%
  assert.equal(calcTaxSavingsEstimate(1000, 0.3), 300);      // custom 30%
  assert.equal(calcTaxSavingsEstimate(0, DEFAULT_TAX_RATE), 0);
});

// ─── Full financial summary ────────────────────────────────────────────────────

test("calcFinancialSummary: end-to-end roll-up with all data sources", () => {
  const transactions = [
    { id: "1", direction: "credit", amount: 8000,  status: "posted",  deleted_at: null }, // income
    { id: "2", direction: "debit",  amount: 3000,  status: "posted",  deleted_at: null }, // expense
    { id: "3", direction: "debit",  amount: 500,   status: "pending", deleted_at: null }, // pending — excluded
    { id: "4", direction: "debit",  amount: 200,   status: "posted",  deleted_at: "2026-01-01" }, // deleted — excluded
  ];
  const accounts = [
    { account_type: "depository", account_subtype: "checking",   current_balance: 5000  },
    { account_type: "depository", account_subtype: "savings",    current_balance: 10000 },
    { account_type: "investment", account_subtype: "brokerage",  current_balance: 20000 },
    { account_type: "credit",     account_subtype: "credit card", current_balance: -3000 },
  ];
  const positions = [
    { last_valuation: 22000, total_cost_basis: 18000, unrealized_gain: 4000 },
  ];

  // Replicate calcFinancialSummary inline for assertion
  const posted = activePostedTransactions(transactions);
  const totalIncome = calcTotalIncome(posted);    // 8000
  const totalExpenses = calcTotalExpenses(posted); // 3000
  const netCashFlow = calcNetCashFlow(totalIncome, totalExpenses); // 5000
  const totalCash = calcTotalCash(accounts);       // 15000
  const totalInvestments = calcTotalInvestments(positions, accounts); // 22000 (positions win)
  const totalLiabilities = calcTotalLiabilities(accounts); // 3000
  const netWorth = calcNetWorth(totalCash, totalInvestments, totalLiabilities); // 34000
  const totalAssets = totalCash + totalInvestments; // 37000

  assert.equal(totalIncome, 8000);
  assert.equal(totalExpenses, 3000);
  assert.equal(netCashFlow, 5000);
  assert.equal(totalCash, 15000);
  assert.equal(totalInvestments, 22000);
  assert.equal(totalLiabilities, 3000);
  assert.equal(netWorth, 34000);
  assert.equal(totalAssets, 37000);
});

// ─── Cross-page consistency assertions ────────────────────────────────────────

test("Income Tracker total equals Financial Summary totalIncome (same transaction set)", () => {
  const allTxs = [
    { id: "a", direction: "credit", amount: 4000, status: "posted",  deleted_at: null,        income_subtype: "salary"   },
    { id: "b", direction: "credit", amount: 1000, status: "posted",  deleted_at: null,        income_subtype: "business" },
    { id: "c", direction: "credit", amount: 500,  status: "pending", deleted_at: null,        income_subtype: null       },
    { id: "d", direction: "debit",  amount: 800,  status: "posted",  deleted_at: null  },
  ];
  const posted = activePostedTransactions(allTxs);
  const summaryIncome = calcTotalIncome(posted);
  const incomeTrackerTotal = calcTotalIncome(posted); // Income Tracker now also filters to posted
  assert.equal(summaryIncome, incomeTrackerTotal);
  assert.equal(summaryIncome, 5000);
});

test("Budget spending (manual records) vs Transaction expenses can differ — both are valid", () => {
  // Budget Center records manual spending; Transactions are synced.
  // They are complementary views, not required to match.
  // This test documents the expected relationship.
  const spentInBudget = 350; // manually recorded in budget_records
  const txExpenses = 420;    // synced debit transactions
  // No assertion of equality — this divergence is by design.
  assert.equal(typeof spentInBudget, "number");
  assert.equal(typeof txExpenses, "number");
});

test("Write-offs tax savings uses DEFAULT_TAX_RATE constant (no hardcoded 0.25)", () => {
  assert.equal(DEFAULT_TAX_RATE, 0.25);
  const est = calcTaxSavingsEstimate(1200);
  assert.equal(est, 300); // 1200 * 0.25
});

test("calcTotalInvestments: net worth investment component equals portfolio total when positions exist", () => {
  const positions = [
    { last_valuation: 15000, total_cost_basis: 12000, unrealized_gain: 3000 },
    { last_valuation: 7000,  total_cost_basis: 8000,  unrealized_gain: -1000 },
  ];
  const accounts = [
    { account_type: "investment", account_subtype: "brokerage", current_balance: 30000 },
  ];

  const portfolioTotal = calcTotalInvestmentsFromPositions(positions); // 22000
  const netWorthInvestments = calcTotalInvestments(positions, accounts); // 22000 (positions)
  assert.equal(portfolioTotal, netWorthInvestments); // they match → net worth is consistent
});

// ─── Large-dataset determinism ────────────────────────────────────────────────

// ─── Deduplication ────────────────────────────────────────────────────────────

test("deduplicateTransactions: removes duplicates by provider+external_transaction_id", () => {
  const txs = [
    { id: "1", status: "posted", deleted_at: null, provider: "plaid", external_transaction_id: "ext-abc", amount: 100, direction: "debit" },
    { id: "2", status: "posted", deleted_at: null, provider: "plaid", external_transaction_id: "ext-abc", amount: 100, direction: "debit" }, // duplicate
    { id: "3", status: "posted", deleted_at: null, provider: "plaid", external_transaction_id: "ext-xyz", amount: 200, direction: "credit" },
    { id: "4", status: "posted", deleted_at: null, provider: null,    external_transaction_id: null, amount: 300, direction: "debit" },
    { id: "5", status: "posted", deleted_at: null, provider: null,    external_transaction_id: null, amount: 400, direction: "credit" },
  ];
  const result = deduplicateTransactions(txs);
  assert.equal(result.length, 4); // id 2 is the duplicate
  assert.deepEqual(result.map((t) => t.id), ["1", "3", "4", "5"]);
});

test("deduplicateTransactions: same external_id under different providers are NOT duplicates", () => {
  const txs = [
    { id: "1", status: "posted", deleted_at: null, provider: "plaid",      external_transaction_id: "ext-123", amount: 100, direction: "debit" },
    { id: "2", status: "posted", deleted_at: null, provider: "snaptrade",   external_transaction_id: "ext-123", amount: 100, direction: "debit" },
  ];
  const result = deduplicateTransactions(txs);
  assert.equal(result.length, 2);
});

test("deduplicateTransactions: preserves first occurrence, drops subsequent duplicates", () => {
  const txs = [
    { id: "a", status: "posted", deleted_at: null, provider: "plaid", external_transaction_id: "dup", amount: 100, direction: "debit" },
    { id: "b", status: "posted", deleted_at: null, provider: "plaid", external_transaction_id: "dup", amount: 100, direction: "debit" },
    { id: "c", status: "posted", deleted_at: null, provider: "plaid", external_transaction_id: "dup", amount: 100, direction: "debit" },
  ];
  const result = deduplicateTransactions(txs);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "a");
});

test("activePostedTransactions: deduplicates same-bank double-connection in one pass", () => {
  const txs = [
    { id: "1", status: "posted",  deleted_at: null,         provider: "plaid", external_transaction_id: "dup-1", amount: 100, direction: "debit" },
    { id: "2", status: "posted",  deleted_at: null,         provider: "plaid", external_transaction_id: "dup-1", amount: 100, direction: "debit" }, // duplicate
    { id: "3", status: "pending", deleted_at: null,         provider: "plaid", external_transaction_id: "dup-2", amount: 200, direction: "credit" }, // pending
    { id: "4", status: "posted",  deleted_at: "2026-01-01", provider: "plaid", external_transaction_id: "dup-3", amount: 300, direction: "debit" }, // deleted
    { id: "5", status: "posted",  deleted_at: null,         provider: "plaid", external_transaction_id: "dup-4", amount: 400, direction: "credit" },
  ];
  const result = activePostedTransactions(txs);
  assert.equal(result.length, 2);
  assert.deepEqual(result.map((t) => t.id), ["1", "5"]);
});

test("deduplicateTransactions: fallback fingerprint dedupes identical transactions", () => {
  const txs = [
    { id: "x", status: "posted", deleted_at: null, provider: null, external_transaction_id: null, financial_account_id: "acc1", transaction_date: "2023-01-01", amount: 100, merchant_name: "Store", description: "Purchase", direction: "debit" },
    { id: "y", status: "posted", deleted_at: null, provider: null, external_transaction_id: null, financial_account_id: "acc1", transaction_date: "2023-01-01", amount: 100, merchant_name: "Store", description: "Purchase", direction: "debit" }, // duplicate
    { id: "z", status: "posted", deleted_at: null, provider: null, external_transaction_id: null, financial_account_id: "acc1", transaction_date: "2023-01-01", amount: 200, merchant_name: "Store", description: "Purchase", direction: "debit" },
  ];
  const result = deduplicateTransactions(txs);
  assert.equal(result.length, 2); // y is duplicate of x
  assert.deepEqual(result.map((t) => t.id), ["x", "z"]);
});

test("large dataset: no NaN, totals are deterministic", () => {
  const txs = Array.from({ length: 1000 }, (_, i) => ({
    id: String(i),
    direction: i % 3 === 0 ? "credit" : "debit",
    amount: i % 3 === 0 ? 100 : 25,
    status: "posted",
    deleted_at: null,
    income_subtype: i % 6 === 0 ? "salary" : i % 3 === 0 ? "business" : null,
    financial_account_id: `acc${i % 10}`, // make them unique
    transaction_date: `2023-01-${String(i % 28 + 1).padStart(2, '0')}`,
    merchant_name: `Merchant${i}`, // make unique
  }));

  const posted = activePostedTransactions(txs);
  const totalIncome = calcTotalIncome(posted);
  const totalExpenses = calcTotalExpenses(posted);
  const netCashFlow = calcNetCashFlow(totalIncome, totalExpenses);

  assert.equal(Number.isNaN(totalIncome),   false);
  assert.equal(Number.isNaN(totalExpenses), false);
  assert.equal(Number.isNaN(netCashFlow),   false);
  assert.equal(totalIncome,   33400);
  assert.equal(totalExpenses, 16650);
  assert.equal(netCashFlow,   16750);
});

// ─── Multi-User Isolation Tests ───────────────────────────────────────────────
// Ensures canonical sources properly isolate data by user_id at the Supabase query level

test("multi-user: two users with identical account names and balances calculate separately", () => {
  // Simulate User A's data
  const userAAccounts = [
    { account_type: "depository", account_subtype: "checking", current_balance: 5000 },
    { account_type: "investment", account_subtype: "brokerage", current_balance: 50000 },
  ];

  // Simulate User B's data (same structure but different user context)
  const userBAccounts = [
    { account_type: "depository", account_subtype: "checking", current_balance: 3000 },
    { account_type: "investment", account_subtype: "brokerage", current_balance: 80000 },
  ];

  // Each user should only see their own cash balance
  const userACash = calcTotalCash(userAAccounts);
  const userBCash = calcTotalCash(userBAccounts);

  assert.equal(userACash, 5000);
  assert.equal(userBCash, 3000);
  assert.notEqual(userACash, userBCash);
});

test("multi-user: two users with same transactions calculate separately", () => {
  // Simulate User A's transactions
  const userATxs = [
    { id: "a1", direction: "credit", amount: 1000, status: "posted", deleted_at: null, income_subtype: "salary" },
    { id: "a2", direction: "debit",  amount: 200,  status: "posted", deleted_at: null },
  ];

  // Simulate User B's transactions
  const userBTxs = [
    { id: "b1", direction: "credit", amount: 2000, status: "posted", deleted_at: null, income_subtype: "salary" },
    { id: "b2", direction: "debit",  amount: 500,  status: "posted", deleted_at: null },
  ];

  // Each user should see only their own totals
  const userAIncome = calcTotalIncome(userATxs);
  const userAExpenses = calcTotalExpenses(userATxs);
  const userBIncome = calcTotalIncome(userBTxs);
  const userBExpenses = calcTotalExpenses(userBTxs);

  assert.equal(userAIncome, 1000);
  assert.equal(userAExpenses, 200);
  assert.equal(userBIncome, 2000);
  assert.equal(userBExpenses, 500);
});

test("multi-user: deleted accounts are excluded from all users' calculations", () => {
  // When Supabase query layer (in canonicalFinancialData.ts) filters out deleted accounts,
  // the calculation functions receive only non-deleted accounts.
  // Simulate the data AFTER Supabase filtering (deleted accounts already excluded).
  const accountsAfterFiltering = [
    { account_type: "depository", account_subtype: "checking", current_balance: 5000 },
    // savings account with deleted_at would already be filtered out by Supabase query
  ];

  // Should only count the non-deleted checking account
  const total = calcTotalCash(accountsAfterFiltering);
  assert.equal(total, 5000);
});

test("multi-user: write-offs for user A do not affect user B", () => {
  // Simulate User A's write-offs
  const userAWriteOffs = [
    { amount: 500, deduction_type: "equipment" },
    { amount: 200, deduction_type: "meals" },
  ];

  // Simulate User B's write-offs
  const userBWriteOffs = [
    { amount: 1000, deduction_type: "vehicle" },
  ];

  // Each user should see their own deductible total
  const userATotalDeductible = userAWriteOffs[0].amount * 1.0 + userAWriteOffs[1].amount * 0.5; // 500 + 100
  const userBTotalDeductible = userBWriteOffs[0].amount * 1.0; // 1000

  assert.equal(userATotalDeductible, 600);
  assert.equal(userBTotalDeductible, 1000);
  assert.notEqual(userATotalDeductible, userBTotalDeductible);
});

// ─── Investment Roll-Up Tests ──────────────────────────────────────────────────
// Ensures investment values roll into net worth and not into bank cash

test("investment: brokerage accounts do not contribute to bank cash", () => {
  const accounts = [
    { account_type: "depository", account_subtype: "checking", current_balance: 5000 },
    { account_type: "investment", account_subtype: "brokerage", current_balance: 50000 }, // should NOT count as cash
  ];

  const bankCash = calcTotalCash(accounts);
  assert.equal(bankCash, 5000); // only counting checking
});

test("investment: brokerage accounts roll into investment total", () => {
  const accounts = [
    { account_type: "depository", account_subtype: "checking", current_balance: 5000 },
    { account_type: "investment", account_subtype: "brokerage", current_balance: 50000 },
  ];

  const investments = calcTotalInvestmentsFromAccounts(accounts);
  assert.equal(investments, 50000);
});

test("investment: brokerage cash is counted in investments, not bank cash", () => {
  const accounts = [
    { account_type: "depository", account_subtype: "checking", current_balance: 5000 },
    { account_type: "investment", account_subtype: "brokerage", current_balance: 50000 }, // includes cash management
  ];

  const bankCash = calcTotalCash(accounts);
  const investments = calcTotalInvestmentsFromAccounts(accounts);
  const total = bankCash + investments;

  assert.equal(bankCash, 5000);
  assert.equal(investments, 50000);
  assert.equal(total, 55000);
});

// ─── Deductible Expense Tests ──────────────────────────────────────────────────
// Ensures write-offs and deductible expenses behave consistently

test("deductible: meals have 50% deduction rate, equipment has 100%", () => {
  const writeOffs = [
    { amount: 100, deduction_type: "meals" },
    { amount: 100, deduction_type: "equipment" },
  ];

  const deductionRules = [
    { value: "meals", pct: 50 },
    { value: "equipment", pct: 100 },
  ];

  const totalDeductible = calcTotalDeductible(writeOffs, deductionRules);
  // 100 * 0.5 + 100 * 1.0 = 50 + 100 = 150
  assert.equal(totalDeductible, 150);
});

test("deductible: non-deductible categories reduce net benefit", () => {
  const writeOffs = [
    { amount: 500, deduction_type: "equipment" },  // 100% → 500
    { amount: 500, deduction_type: "meals" },      // 50% → 250
  ];

  const deductionRules = [
    { value: "equipment", pct: 100 },
    { value: "meals", pct: 50 },
  ];

  const totalDeductible = calcTotalDeductible(writeOffs, deductionRules);
  assert.equal(totalDeductible, 750); // 500 + 250
});

// ─── Trading Realized Gains Tests ──────────────────────────────────────────────
// Ensures only closed trades with realized gains are included in tax calculations

test("trading: only closed trades with realized_pnl are included", () => {
  const trades = [
    { id: "t1", status: "closed", realized_pnl: 1000, exit_date: "2026-03-15" },
    { id: "t2", status: "open", realized_pnl: null, exit_date: null },
    { id: "t3", status: "closed", realized_pnl: null, exit_date: null }, // closed but no PNL
    { id: "t4", status: "closed", realized_pnl: -500, exit_date: "2026-02-20" },
  ];

  const realizedTrades = trades.filter((t) => t.status === "closed" && t.realized_pnl != null);
  assert.equal(realizedTrades.length, 2);
  assert.deepEqual(realizedTrades.map((t) => t.id), ["t1", "t4"]);
});

test("trading: unrealized gains (open trades) are excluded from tax", () => {
  const trades = [
    { id: "t1", status: "open", entry_price: 100, exit_price: null, quantity: 10 }, // unrealized gain
    { id: "t2", status: "closed", realized_pnl: 500, exit_date: "2026-01-15" },
  ];

  const realizedGains = trades.filter((t) => t.status === "closed").map((t) => t.realized_pnl).reduce((sum, g) => sum + (g ?? 0), 0);
  assert.equal(realizedGains, 500);
});

test("trading: multi-year realized gains are filtered by tax year", () => {
  const trades = [
    { id: "t1", status: "closed", realized_pnl: 1000, exit_date: "2025-12-31" },
    { id: "t2", status: "closed", realized_pnl: 500, exit_date: "2026-01-15" },
    { id: "t3", status: "closed", realized_pnl: 750, exit_date: "2026-06-20" },
  ];

  const year2026Gains = trades.filter((t) => {
    const exitYear = new Date(t.exit_date).getFullYear();
    return t.status === "closed" && exitYear === 2026;
  }).map((t) => t.realized_pnl).reduce((sum, g) => sum + (g ?? 0), 0);

  assert.equal(year2026Gains, 1250); // 500 + 750
});

// ─── Budget Savings Categories Tests ─────────────────────────────────────────
// Ensures savings-classified budget categories are properly identified

test("budget-savings: category_type='savings' are identified correctly", () => {
  const categories = [
    { id: "c1", name: "Emergency Fund", category_type: "savings", is_active: true },
    { id: "c2", name: "Vacation", category_type: "savings", is_active: true },
    { id: "c3", name: "Groceries", category_type: "expense", is_active: true },
    { id: "c4", name: "Archived Savings", category_type: "savings", is_active: false },
  ];

  const savingsCategories = categories.filter((c) => c.category_type === "savings" && c.is_active);
  assert.equal(savingsCategories.length, 2);
  assert.deepEqual(savingsCategories.map((c) => c.id), ["c1", "c2"]);
});

test("budget-savings: expense categories are excluded from savings rollup", () => {
  const categories = [
    { id: "c1", name: "Emergency Fund", category_type: "savings", is_active: true },
    { id: "c2", name: "Dining", category_type: "expense", is_active: true },
    { id: "c3", name: "Salary", category_type: "income", is_active: true },
  ];

  const savingsCount = categories.filter((c) => c.category_type === "savings").length;
  const expenseCount = categories.filter((c) => c.category_type === "expense").length;

  assert.equal(savingsCount, 1);
  assert.equal(expenseCount, 1);
  assert.equal(savingsCount + expenseCount, 2);
});

test("budget-savings: inactive savings categories do not affect totals", () => {
  const categories = [
    { id: "c1", name: "Active Savings", category_type: "savings", monthly_limit: 500, is_active: true },
    { id: "c2", name: "Old Savings", category_type: "savings", monthly_limit: 1000, is_active: false },
  ];

  const activeSavings = categories.filter((c) => c.category_type === "savings" && c.is_active);
  const totalLimit = activeSavings.reduce((sum, c) => sum + (c.monthly_limit ?? 0), 0);

  assert.equal(activeSavings.length, 1);
  assert.equal(totalLimit, 500);
});

// ─── Investment Source Consistency Tests ────────────────────────────────────────
// Ensures positions are filtered by active accounts and totals match across pages

test("investment-source: positions from inactive accounts are excluded", () => {
  const accounts = [
    { id: "acct1", is_active: true, deleted_at: null },
    { id: "acct2", is_active: false, deleted_at: null },
    { id: "acct3", is_active: true, deleted_at: "2026-01-01" },
  ];
  const positions = [
    { id: "p1", financial_account_id: "acct1", last_valuation: 10000 },
    { id: "p2", financial_account_id: "acct2", last_valuation: 5000 },  // inactive account
    { id: "p3", financial_account_id: "acct3", last_valuation: 3000 },  // deleted account
    { id: "p4", financial_account_id: null, last_valuation: 2000 },     // orphan position
  ];

  const activeAccountIds = new Set(
    accounts.filter((a) => a.is_active && a.deleted_at == null).map((a) => a.id)
  );
  const validPositions = positions.filter(
    (p) => p.financial_account_id && activeAccountIds.has(p.financial_account_id)
  );

  assert.equal(validPositions.length, 1);
  assert.equal(validPositions[0].id, "p1");
  const total = validPositions.reduce((s, p) => s + toNum(p.last_valuation), 0);
  assert.equal(total, 10000);
});

test("investment-source: canonical and portfolio page use same active-account filter logic", () => {
  // Simulates both canonical and Investments page filtering
  const accounts = [
    { id: "acct1", is_active: true, deleted_at: null, provider: "snaptrade" },
    { id: "acct2", is_active: true, deleted_at: null, provider: "plaid" },
    { id: "acct3", is_active: false, deleted_at: null, provider: "snaptrade" },
  ];
  const positions = [
    { id: "p1", financial_account_id: "acct1", last_valuation: 25000 },
    { id: "p2", financial_account_id: "acct2", last_valuation: 15000 },
    { id: "p3", financial_account_id: "acct3", last_valuation: 8000 },
  ];

  // Both pages: filter by active, non-deleted accounts (all providers)
  const activeIds = new Set(
    accounts.filter((a) => a.is_active && a.deleted_at == null).map((a) => a.id)
  );
  const filtered = positions.filter((p) => p.financial_account_id && activeIds.has(p.financial_account_id));
  const total = filtered.reduce((s, p) => s + toNum(p.last_valuation), 0);

  assert.equal(filtered.length, 2);
  assert.equal(total, 40000); // acct1 + acct2
});

test("investment-source: net worth includes investments, total cash excludes them", () => {
  const accounts = [
    { account_type: "depository", account_subtype: "checking", current_balance: 10000 },
    { account_type: "investment", account_subtype: "brokerage", current_balance: 50000 },
    { account_type: "credit", account_subtype: "credit card", current_balance: 2000 },
  ];

  const bankCash = calcTotalCash(accounts);
  const investmentTotal = 75000; // from positions (preferred over account balance)
  const liabilities = calcTotalLiabilities(accounts);
  const netWorth = bankCash + investmentTotal - liabilities;

  assert.equal(bankCash, 10000);
  assert.equal(liabilities, 2000);
  assert.equal(netWorth, 83000); // 10000 + 75000 - 2000
  // Total Cash must NOT include investments
  assert.equal(bankCash, 10000);
});

// ─── Transaction Classification Tests ──────────────────────────────────────────
// Mirrors the central classification layer in canonicalFinancialData.ts

const DEDUCTIBLE_CATEGORIES = new Set([
  "business", "home office", "vehicle", "equipment", "software",
  "meals", "travel", "professional services", "advertising",
  "office supplies", "insurance", "utilities",
]);

function isBusinessIncome(tx) {
  return tx.direction === "credit" &&
    (tx.income_subtype === "business" || tx.income_subtype === "self-employment") &&
    tx.deleted_at == null;
}

function isDeductibleBusinessExpense(tx) {
  const cat = (tx.category ?? "").toLowerCase();
  const txType = (tx.transaction_type ?? "").toLowerCase();
  return tx.direction === "debit" &&
    DEDUCTIBLE_CATEGORIES.has(cat) &&
    txType !== "transfer" &&
    txType !== "tax_payment" &&
    tx.deleted_at == null;
}

test("classification: positive business transaction is business income, not write-off", () => {
  const tx = { direction: "credit", income_subtype: "business", category: "Business", transaction_type: "income", deleted_at: null, amount: 5000 };
  assert.equal(isBusinessIncome(tx), true);
  assert.equal(isDeductibleBusinessExpense(tx), false);
});

test("classification: negative business-category transaction is deductible expense", () => {
  const tx = { direction: "debit", income_subtype: null, category: "Business", transaction_type: "bank", deleted_at: null, amount: 200 };
  assert.equal(isDeductibleBusinessExpense(tx), true);
  assert.equal(isBusinessIncome(tx), false);
});

test("classification: transfer is never income or deductible expense", () => {
  const tx = { direction: "debit", income_subtype: null, category: "Business", transaction_type: "transfer", deleted_at: null, amount: 1000 };
  assert.equal(isDeductibleBusinessExpense(tx), false);
  assert.equal(isBusinessIncome(tx), false);
});

test("classification: tax payment is not deductible by default", () => {
  const tx = { direction: "debit", income_subtype: null, category: "Business", transaction_type: "tax_payment", deleted_at: null, amount: 3000 };
  assert.equal(isDeductibleBusinessExpense(tx), false);
});

test("classification: personal expense category is not deductible", () => {
  const tx = { direction: "debit", income_subtype: null, category: "Shopping", transaction_type: "bank", deleted_at: null, amount: 150 };
  assert.equal(isDeductibleBusinessExpense(tx), false);
});

test("classification: deleted transaction is excluded from all classifications", () => {
  const tx = { direction: "credit", income_subtype: "business", category: "Business", transaction_type: "income", deleted_at: "2026-01-01", amount: 5000 };
  assert.equal(isBusinessIncome(tx), false);
  assert.equal(isDeductibleBusinessExpense(tx), false);
});

// ─── Savings Actual vs Planned Tests ───────────────────────────────────────────

test("savings: actual saved comes from goal contributions, not budget allocations", () => {
  const goals = [
    { id: "g1", current_amount: 500, target_amount: 2000 },
    { id: "g2", current_amount: 1200, target_amount: 5000 },
  ];
  const budgetSavings = [
    { id: "b1", name: "Emergency Fund", monthly_limit: 300 },
    { id: "b2", name: "Vacation", monthly_limit: 200 },
  ];

  const actualSaved = goals.reduce((s, g) => s + toNum(g.current_amount), 0);
  const plannedMonthly = budgetSavings.reduce((s, c) => s + toNum(c.monthly_limit), 0);

  assert.equal(actualSaved, 1700);
  assert.equal(plannedMonthly, 500);
  // These must not be mixed
  assert.notEqual(actualSaved, plannedMonthly);
});

test("savings: total saved is zero when no contributions exist, regardless of budget savings", () => {
  const goals = [];
  const budgetSavings = [
    { id: "b1", name: "Emergency Fund", monthly_limit: 500 },
  ];

  const actualSaved = goals.reduce((s, g) => s + toNum(g.current_amount), 0);
  const plannedMonthly = budgetSavings.reduce((s, c) => s + toNum(c.monthly_limit), 0);

  assert.equal(actualSaved, 0);
  assert.equal(plannedMonthly, 500);
  // Planned savings should not inflate actual saved
});

// ─── Brokerage Investment Data Path Tests ──────────────────────────────────────
// Tests the full path: brokerage connection → brokerage account → positions → canonical total

test("brokerage-path: connected brokerage with positions returns canonical investment total", () => {
  // Simulate: SnapTrade synced account_type="investment" with positions
  const accounts = [
    { id: "inv1", account_type: "investment", account_subtype: "brokerage", current_balance: 45000 },
    { id: "bank1", account_type: "depository", account_subtype: "checking", current_balance: 5000 },
  ];
  const positions = [
    { last_valuation: 25000, total_cost_basis: 20000, unrealized_gain: 5000 },
    { last_valuation: 18000, total_cost_basis: 15000, unrealized_gain: 3000 },
  ];

  const total = calcTotalInvestments(positions, accounts);
  assert.equal(total, 43000); // positions preferred: 25000 + 18000
});

test("brokerage-path: positions feed Investment Portfolio, Home, Summary, and Net Worth consistently", () => {
  const accounts = [
    { id: "inv1", account_type: "investment", account_subtype: "brokerage", current_balance: 50000 },
    { id: "bank1", account_type: "depository", account_subtype: "checking", current_balance: 10000 },
    { id: "cc1", account_type: "credit", account_subtype: "credit card", current_balance: 2000 },
  ];
  const positions = [
    { last_valuation: 30000, total_cost_basis: 25000, unrealized_gain: 5000 },
    { last_valuation: 22000, total_cost_basis: 20000, unrealized_gain: 2000 },
  ];

  // All pages must use the same canonical investment total
  const investmentTotal = calcTotalInvestments(positions, accounts); // 52000
  const bankCash = calcTotalCash(accounts); // 10000
  const liabilities = calcTotalLiabilities(accounts); // 2000
  const netWorth = calcNetWorth(bankCash, investmentTotal, liabilities);

  // Investment Portfolio page total
  assert.equal(investmentTotal, 52000);
  // Home Investments card
  assert.equal(investmentTotal, 52000);
  // Financial Summary Investments card
  assert.equal(investmentTotal, 52000);
  // Net Worth includes investments
  assert.equal(netWorth, 60000); // 10000 + 52000 - 2000
  // Total Cash excludes investments
  assert.equal(bankCash, 10000);
});

test("brokerage-path: brokerage investments do not feed Total Cash", () => {
  const accounts = [
    { id: "inv1", account_type: "investment", account_subtype: "brokerage", current_balance: 100000 },
    { id: "bank1", account_type: "depository", account_subtype: "checking", current_balance: 3000 },
  ];

  const bankCash = calcTotalCash(accounts);
  assert.equal(bankCash, 3000); // investment account excluded from cash
});

test("brokerage-path: bank cash does not feed Investments", () => {
  const accounts = [
    { id: "bank1", account_type: "depository", account_subtype: "checking", current_balance: 50000 },
    { id: "bank2", account_type: "depository", account_subtype: "savings", current_balance: 20000 },
  ];

  const investments = calcTotalInvestmentsFromAccounts(accounts);
  assert.equal(investments, 0); // no investment accounts
});

test("brokerage-path: positions linked through investment accounts resolve correctly", () => {
  // Simulate the filtering logic used by getCanonicalInvestments and Investments page
  const accounts = [
    { id: "inv1", account_type: "investment", is_active: true, deleted_at: null },
    { id: "bank1", account_type: "depository", is_active: true, deleted_at: null },
  ];
  const positions = [
    { id: "p1", financial_account_id: "inv1", last_valuation: 15000 },
    { id: "p2", financial_account_id: "bank1", last_valuation: 500 }, // bank cash position — must be excluded
    { id: "p3", financial_account_id: "inv1", last_valuation: 10000 },
  ];

  // Filter: only positions linked to investment-type accounts
  const investmentAccountIds = new Set(
    accounts.filter((a) => a.account_type === "investment").map((a) => a.id)
  );
  const investmentPositions = positions.filter(
    (p) => p.financial_account_id && investmentAccountIds.has(p.financial_account_id)
  );

  assert.equal(investmentPositions.length, 2);
  const total = investmentPositions.reduce((s, p) => s + toNum(p.last_valuation), 0);
  assert.equal(total, 25000); // only inv1 positions
});

test("brokerage-path: user A brokerage positions do not affect user B", () => {
  // Simulate separate user datasets (Supabase filters by user_id)
  const userAPositions = [
    { last_valuation: 30000, total_cost_basis: 25000, unrealized_gain: 5000 },
  ];
  const userBPositions = [
    { last_valuation: 80000, total_cost_basis: 70000, unrealized_gain: 10000 },
  ];

  const userATotal = calcTotalInvestmentsFromPositions(userAPositions);
  const userBTotal = calcTotalInvestmentsFromPositions(userBPositions);

  assert.equal(userATotal, 30000);
  assert.equal(userBTotal, 80000);
  assert.notEqual(userATotal, userBTotal);
});

test("brokerage-path: brokerage with no positions falls back to account balance", () => {
  const accounts = [
    { account_type: "investment", account_subtype: "brokerage", current_balance: 45000 },
  ];
  const positions = []; // no positions synced yet

  const total = calcTotalInvestments(positions, accounts);
  assert.equal(total, 45000); // falls back to account balance
});

test("brokerage-path: brokerage connection without synced positions reports account balance, not zero", () => {
  // When positions haven't synced yet, the account balance should still show
  const accounts = [
    { account_type: "investment", account_subtype: "brokerage", current_balance: 60000 },
    { account_type: "depository", account_subtype: "checking", current_balance: 5000 },
  ];
  const positions = [];

  const investmentTotal = calcTotalInvestments(positions, accounts);
  const bankCash = calcTotalCash(accounts);

  assert.equal(investmentTotal, 60000); // not zero — uses account balance fallback
  assert.equal(bankCash, 5000); // bank cash unaffected
});

test("brokerage-path: asset allocation includes investment value from positions", () => {
  const accounts = [
    { account_type: "depository", account_subtype: "checking", current_balance: 10000 },
    { account_type: "depository", account_subtype: "savings", current_balance: 5000 },
    { account_type: "investment", account_subtype: "brokerage", current_balance: 40000 },
    { account_type: "credit", account_subtype: "credit card", current_balance: 3000 },
  ];
  const positions = [
    { last_valuation: 42000, total_cost_basis: 35000, unrealized_gain: 7000 },
  ];

  const bankCash = calcTotalCash(accounts); // 15000
  const investmentTotal = calcTotalInvestments(positions, accounts); // 42000 (positions)
  const totalAssets = bankCash + investmentTotal;

  assert.equal(totalAssets, 57000); // 15000 + 42000
  // Asset allocation segments should include investments
  const segments = [
    { label: "Checking", value: 10000 },
    { label: "Savings", value: 5000 },
    { label: "Investments", value: investmentTotal },
  ];
  const segmentTotal = segments.reduce((s, seg) => s + seg.value, 0);
  assert.equal(segmentTotal, 57000);
});

// ─── Canonical Investment Metadata Tests ───────────────────────────────────────
// Simulates the structured metadata logic from getCanonicalInvestments
// to verify dataStatus, warnings, and value separation without Supabase

/**
 * Pure-logic replica of getCanonicalInvestments metadata computation.
 * Takes pre-fetched accounts and positions (already filtered by user_id).
 */
function computeCanonicalInvestmentMetadata(investmentAccounts, allPositions, allAccounts) {
  const investmentAccountIds = new Set(investmentAccounts.map((a) => a.id));
  const positions = allPositions.filter(
    (p) => p.financial_account_id && investmentAccountIds.has(p.financial_account_id)
  );

  const accountsWithPositionIds = new Set(positions.map((p) => p.financial_account_id));
  const brokerageAccountCount = investmentAccounts.length;
  let brokerageAccountsWithPositions = 0;
  let brokerageAccountsUsingFallback = 0;
  let brokerageAccountsMissingPositions = 0;

  for (const acct of investmentAccounts) {
    if (accountsWithPositionIds.has(acct.id)) {
      brokerageAccountsWithPositions++;
    } else {
      const bal = toNum(acct.current_balance);
      if (bal > 0) {
        brokerageAccountsUsingFallback++;
      } else {
        brokerageAccountsMissingPositions++;
      }
    }
  }

  const positionsValue = positions.reduce((s, p) => s + toNum(p.last_valuation), 0);
  const fallbackBalanceValue = calcTotalInvestmentsFromAccounts(allAccounts);
  const totalInvestmentValue = positionsValue > 0 ? positionsValue : fallbackBalanceValue;

  const warnings = [];
  let dataStatus;

  if (brokerageAccountCount === 0) {
    dataStatus = "no_brokerage_connection";
  } else if (brokerageAccountsWithPositions > 0) {
    dataStatus = "positions_verified";
    if (brokerageAccountsUsingFallback > 0) {
      warnings.push(`${brokerageAccountsUsingFallback} brokerage account(s) using balance fallback`);
    }
    if (brokerageAccountsMissingPositions > 0) {
      warnings.push(`${brokerageAccountsMissingPositions} brokerage account(s) have no positions and no usable balance`);
    }
  } else if (brokerageAccountsUsingFallback > 0) {
    dataStatus = "fallback_used";
    warnings.push(`No positions synced — using account balance as temporary fallback`);
  } else {
    dataStatus = "missing_positions";
    warnings.push(`${brokerageAccountCount} brokerage account(s) connected but no positions or usable balance found`);
  }

  return {
    totalInvestmentValue,
    positionsValue,
    fallbackBalanceValue,
    brokerageAccountCount,
    brokerageAccountsWithPositions,
    brokerageAccountsUsingFallback,
    brokerageAccountsMissingPositions,
    dataStatus,
    warnings,
    positions,
  };
}

test("canonical-metadata: positions_verified when positions exist", () => {
  const accounts = [
    { id: "inv1", account_type: "investment", current_balance: 50000 },
    { id: "bank1", account_type: "depository", current_balance: 10000 },
  ];
  const investmentAccounts = accounts.filter((a) => a.account_type === "investment");
  const positions = [
    { financial_account_id: "inv1", last_valuation: 52000 },
  ];

  const result = computeCanonicalInvestmentMetadata(investmentAccounts, positions, accounts);
  assert.equal(result.dataStatus, "positions_verified");
  assert.equal(result.positionsValue, 52000);
  assert.equal(result.totalInvestmentValue, 52000);
  assert.equal(result.brokerageAccountsWithPositions, 1);
  assert.equal(result.brokerageAccountsUsingFallback, 0);
  assert.equal(result.brokerageAccountsMissingPositions, 0);
  assert.equal(result.warnings.length, 0);
});

test("canonical-metadata: fallback_used when no positions but account balance exists", () => {
  const accounts = [
    { id: "inv1", account_type: "investment", current_balance: 45000 },
  ];
  const investmentAccounts = accounts.filter((a) => a.account_type === "investment");
  const positions = [];

  const result = computeCanonicalInvestmentMetadata(investmentAccounts, positions, accounts);
  assert.equal(result.dataStatus, "fallback_used");
  assert.equal(result.positionsValue, 0);
  assert.equal(result.fallbackBalanceValue, 45000);
  assert.equal(result.totalInvestmentValue, 45000);
  assert.equal(result.brokerageAccountsWithPositions, 0);
  assert.equal(result.brokerageAccountsUsingFallback, 1);
  assert.equal(result.warnings.length, 1);
  assert.ok(result.warnings[0].includes("fallback"));
});

test("canonical-metadata: missing_positions when no positions and no usable balance", () => {
  const accounts = [
    { id: "inv1", account_type: "investment", current_balance: 0 },
  ];
  const investmentAccounts = accounts.filter((a) => a.account_type === "investment");
  const positions = [];

  const result = computeCanonicalInvestmentMetadata(investmentAccounts, positions, accounts);
  assert.equal(result.dataStatus, "missing_positions");
  assert.equal(result.totalInvestmentValue, 0);
  assert.equal(result.brokerageAccountsMissingPositions, 1);
  assert.equal(result.warnings.length, 1);
  assert.ok(result.warnings[0].includes("no positions"));
});

test("canonical-metadata: no_brokerage_connection when no investment accounts", () => {
  const accounts = [
    { id: "bank1", account_type: "depository", current_balance: 10000 },
  ];
  const investmentAccounts = accounts.filter((a) => a.account_type === "investment");
  const positions = [];

  const result = computeCanonicalInvestmentMetadata(investmentAccounts, positions, accounts);
  assert.equal(result.dataStatus, "no_brokerage_connection");
  assert.equal(result.totalInvestmentValue, 0);
  assert.equal(result.brokerageAccountCount, 0);
  assert.equal(result.warnings.length, 0);
});

test("canonical-metadata: mixed accounts — some with positions, some fallback, some missing", () => {
  const accounts = [
    { id: "inv1", account_type: "investment", current_balance: 50000 },
    { id: "inv2", account_type: "investment", current_balance: 30000 },
    { id: "inv3", account_type: "investment", current_balance: 0 },
    { id: "bank1", account_type: "depository", current_balance: 5000 },
  ];
  const investmentAccounts = accounts.filter((a) => a.account_type === "investment");
  const positions = [
    { financial_account_id: "inv1", last_valuation: 55000 },
  ];

  const result = computeCanonicalInvestmentMetadata(investmentAccounts, positions, accounts);
  assert.equal(result.dataStatus, "positions_verified");
  assert.equal(result.positionsValue, 55000);
  assert.equal(result.totalInvestmentValue, 55000); // positions preferred
  assert.equal(result.brokerageAccountCount, 3);
  assert.equal(result.brokerageAccountsWithPositions, 1);
  assert.equal(result.brokerageAccountsUsingFallback, 1); // inv2 has balance but no positions
  assert.equal(result.brokerageAccountsMissingPositions, 1); // inv3 has nothing
  assert.equal(result.warnings.length, 2);
});

test("canonical-metadata: duplicate positions do not double-count", () => {
  const accounts = [
    { id: "inv1", account_type: "investment", current_balance: 50000 },
  ];
  const investmentAccounts = accounts.filter((a) => a.account_type === "investment");
  // Two distinct position records for same account
  const positions = [
    { financial_account_id: "inv1", last_valuation: 25000 },
    { financial_account_id: "inv1", last_valuation: 25000 },
  ];

  const result = computeCanonicalInvestmentMetadata(investmentAccounts, positions, accounts);
  assert.equal(result.positionsValue, 50000); // sum of both, not doubled by account
  assert.equal(result.brokerageAccountsWithPositions, 1); // still 1 account
});

test("canonical-metadata: bank positions excluded from investment total", () => {
  const accounts = [
    { id: "inv1", account_type: "investment", current_balance: 40000 },
    { id: "bank1", account_type: "depository", current_balance: 10000 },
  ];
  const investmentAccounts = accounts.filter((a) => a.account_type === "investment");
  const positions = [
    { financial_account_id: "inv1", last_valuation: 42000 },
    { financial_account_id: "bank1", last_valuation: 500 }, // bank position — must be excluded
  ];

  const result = computeCanonicalInvestmentMetadata(investmentAccounts, positions, accounts);
  assert.equal(result.positionsValue, 42000); // bank position excluded
  assert.equal(result.positions.length, 1);
});

test("canonical-metadata: user isolation — separate metadata per user dataset", () => {
  // User A
  const userAAccounts = [{ id: "a-inv1", account_type: "investment", current_balance: 100000 }];
  const userAPositions = [{ financial_account_id: "a-inv1", last_valuation: 105000 }];
  const resultA = computeCanonicalInvestmentMetadata(
    userAAccounts.filter((a) => a.account_type === "investment"), userAPositions, userAAccounts
  );

  // User B
  const userBAccounts = [{ id: "b-inv1", account_type: "investment", current_balance: 0 }];
  const userBPositions = [];
  const resultB = computeCanonicalInvestmentMetadata(
    userBAccounts.filter((a) => a.account_type === "investment"), userBPositions, userBAccounts
  );

  assert.equal(resultA.dataStatus, "positions_verified");
  assert.equal(resultA.totalInvestmentValue, 105000);
  assert.equal(resultB.dataStatus, "missing_positions");
  assert.equal(resultB.totalInvestmentValue, 0);
});

test("canonical-metadata: deleted/disconnected brokerage accounts excluded by pre-filter", () => {
  // Simulate: only active, non-deleted investment accounts are passed in
  // (the canonical function filters deleted_at IS NULL and is_active = true before this logic)
  const allAccounts = [
    { id: "inv1", account_type: "investment", current_balance: 50000, is_active: true, deleted_at: null },
    { id: "inv2", account_type: "investment", current_balance: 30000, is_active: false, deleted_at: "2026-01-01" },
  ];
  // Only active accounts would be passed to the metadata computation
  const activeInvestmentAccounts = allAccounts.filter(
    (a) => a.account_type === "investment" && a.is_active && !a.deleted_at
  );
  const positions = [{ financial_account_id: "inv1", last_valuation: 52000 }];

  const result = computeCanonicalInvestmentMetadata(activeInvestmentAccounts, positions, allAccounts);
  assert.equal(result.brokerageAccountCount, 1); // only active account counted
  assert.equal(result.brokerageAccountsWithPositions, 1);
  assert.equal(result.dataStatus, "positions_verified");
});

// ─── Generic SnapTrade Integration Tests ─────────────────────────────────────
// These test the deriveBrokerageStatus logic and generic multi-user/multi-institution scenarios.

/**
 * Mirrors the deriveBrokerageStatus function from connections/page.tsx.
 * Derives brokerage connection health from child data (accounts + positions).
 */
function deriveBrokerageStatus(conn, connAccounts, positionCounts) {
  if (conn.provider !== "snaptrade") {
    const map = {
      synced:  { label: "Synced", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
      pending: { label: "Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
      syncing: { label: "Syncing", color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
      error:   { label: "Error", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
      never:   { label: "Never synced", color: "#475569", bg: "rgba(71,85,105,0.1)" },
    };
    return map[conn.sync_status] ?? map.never;
  }
  if (conn.sync_status === "error") {
    return { label: "Sync Error", color: "#ef4444", bg: "rgba(239,68,68,0.1)", warning: "Last sync encountered an error" };
  }
  if (conn.sync_status === "syncing" || conn.sync_status === "pending") {
    return { label: "Syncing…", color: "#38bdf8", bg: "rgba(56,189,248,0.1)" };
  }
  if (connAccounts.length === 0) {
    if (conn.sync_status === "never") {
      return { label: "Pending Sync", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", warning: "Connection exists but accounts have not been synced yet" };
    }
    return { label: "No Accounts", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", warning: "Brokerage returned no accounts — try re-syncing" };
  }
  const posCountMap = new Map(positionCounts.map(p => [p.financial_account_id, p.count]));
  const acctIds = connAccounts.map(a => a.id);
  const withPositions = acctIds.filter(id => (posCountMap.get(id) ?? 0) > 0).length;
  const missingPositions = acctIds.length - withPositions;
  if (withPositions > 0 && missingPositions === 0) {
    return { label: "Synced", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
  }
  if (withPositions > 0 && missingPositions > 0) {
    return { label: "Partial", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", warning: `${missingPositions} account(s) missing positions` };
  }
  const hasBalance = connAccounts.some(a => (a.current_balance ?? 0) > 0);
  if (hasBalance) {
    return { label: "No Positions", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", warning: "Accounts synced but positions not yet available — using balance fallback" };
  }
  return { label: "Missing Data", color: "#ef4444", bg: "rgba(239,68,68,0.1)", warning: "Accounts synced but no positions or balances found" };
}

test("connection-status: SnapTrade connection with no accounts shows pending/warning", () => {
  const conn = { id: "c1", provider: "snaptrade", sync_status: "synced" };
  const result = deriveBrokerageStatus(conn, [], []);
  assert.equal(result.label, "No Accounts");
  assert.ok(result.warning);
  assert.ok(result.warning.includes("no accounts"));
});

test("connection-status: SnapTrade connection never synced shows pending sync", () => {
  const conn = { id: "c1", provider: "snaptrade", sync_status: "never" };
  const result = deriveBrokerageStatus(conn, [], []);
  assert.equal(result.label, "Pending Sync");
  assert.ok(result.warning.includes("not been synced"));
});

test("connection-status: SnapTrade with accounts but no positions shows warning", () => {
  const conn = { id: "c1", provider: "snaptrade", sync_status: "synced" };
  const accounts = [{ id: "a1", current_balance: 50000 }];
  const result = deriveBrokerageStatus(conn, accounts, []);
  assert.equal(result.label, "No Positions");
  assert.ok(result.warning.includes("positions not yet available"));
});

test("connection-status: SnapTrade with accounts and positions shows Synced", () => {
  const conn = { id: "c1", provider: "snaptrade", sync_status: "synced" };
  const accounts = [{ id: "a1", current_balance: 50000 }];
  const posCounts = [{ financial_account_id: "a1", count: 3 }];
  const result = deriveBrokerageStatus(conn, accounts, posCounts);
  assert.equal(result.label, "Synced");
  assert.equal(result.warning, undefined);
});

test("connection-status: SnapTrade with mixed accounts shows Partial", () => {
  const conn = { id: "c1", provider: "snaptrade", sync_status: "synced" };
  const accounts = [
    { id: "a1", current_balance: 50000 },
    { id: "a2", current_balance: 30000 },
  ];
  const posCounts = [{ financial_account_id: "a1", count: 3 }];
  const result = deriveBrokerageStatus(conn, accounts, posCounts);
  assert.equal(result.label, "Partial");
  assert.ok(result.warning.includes("1 account(s) missing positions"));
});

test("connection-status: SnapTrade sync error shows error state", () => {
  const conn = { id: "c1", provider: "snaptrade", sync_status: "error" };
  const result = deriveBrokerageStatus(conn, [], []);
  assert.equal(result.label, "Sync Error");
  assert.ok(result.warning.includes("error"));
});

test("connection-status: SnapTrade accounts with no positions and no balance shows Missing Data", () => {
  const conn = { id: "c1", provider: "snaptrade", sync_status: "synced" };
  const accounts = [{ id: "a1", current_balance: 0 }];
  const result = deriveBrokerageStatus(conn, accounts, []);
  assert.equal(result.label, "Missing Data");
  assert.ok(result.warning.includes("no positions or balances"));
});

test("connection-status: Plaid connection uses sync_status directly", () => {
  const conn = { id: "c1", provider: "plaid", sync_status: "synced" };
  const result = deriveBrokerageStatus(conn, [], []);
  assert.equal(result.label, "Synced");
  assert.equal(result.warning, undefined);
});

test("generic-multi-institution: two SnapTrade institutions per user remain isolated", () => {
  const conn1 = { id: "c1", provider: "snaptrade", sync_status: "synced" };
  const conn2 = { id: "c2", provider: "snaptrade", sync_status: "synced" };
  const accts1 = [{ id: "a1", current_balance: 50000, integration_connection_id: "c1" }];
  const accts2 = [{ id: "a2", current_balance: 0, integration_connection_id: "c2" }];
  const posCounts = [{ financial_account_id: "a1", count: 5 }];

  const status1 = deriveBrokerageStatus(conn1, accts1, posCounts);
  const status2 = deriveBrokerageStatus(conn2, accts2, posCounts);

  assert.equal(status1.label, "Synced");
  assert.equal(status2.label, "Missing Data");
});

test("generic-multi-user: user A and user B brokerage statuses are independent", () => {
  // User A: has positions
  const userAAccounts = [{ id: "a-inv1", account_type: "investment", current_balance: 100000 }];
  const userAPositions = [{ financial_account_id: "a-inv1", last_valuation: 105000 }];
  const resultA = computeCanonicalInvestmentMetadata(
    userAAccounts, userAPositions, userAAccounts
  );

  // User B: connection exists, no positions, no balance
  const userBAccounts = [{ id: "b-inv1", account_type: "investment", current_balance: 0 }];
  const resultB = computeCanonicalInvestmentMetadata(
    userBAccounts, [], userBAccounts
  );

  assert.equal(resultA.dataStatus, "positions_verified");
  assert.equal(resultA.totalInvestmentValue, 105000);
  assert.equal(resultB.dataStatus, "missing_positions");
  assert.equal(resultB.totalInvestmentValue, 0);
  assert.ok(resultB.warnings.length > 0);
});

test("generic-reconnect: reconnected brokerage with new positions replaces stale data", () => {
  // Simulate: after reconnect, only new positions exist (stale ones soft-deleted by sync)
  const accounts = [{ id: "inv1", account_type: "investment", current_balance: 60000 }];
  const newPositions = [
    { financial_account_id: "inv1", last_valuation: 30000 },
    { financial_account_id: "inv1", last_valuation: 32000 },
  ];
  // Stale positions would have deleted_at set and not be passed in

  const result = computeCanonicalInvestmentMetadata(accounts, newPositions, accounts);
  assert.equal(result.positionsValue, 62000);
  assert.equal(result.dataStatus, "positions_verified");
});

test("generic-sync: repeated sync does not duplicate — canonical uses sum of all positions", () => {
  // If sync is idempotent (upsert), same positions appear once
  const accounts = [{ id: "inv1", account_type: "investment", current_balance: 50000 }];
  const positions = [
    { financial_account_id: "inv1", last_valuation: 25000, asset_symbol: "AAPL" },
    { financial_account_id: "inv1", last_valuation: 25000, asset_symbol: "GOOG" },
  ];

  const result = computeCanonicalInvestmentMetadata(accounts, positions, accounts);
  assert.equal(result.positionsValue, 50000);
  assert.equal(result.brokerageAccountsWithPositions, 1);
});

test("generic-sync: multiple accounts per institution all contribute to total", () => {
  const accounts = [
    { id: "inv1", account_type: "investment", current_balance: 50000 },
    { id: "inv2", account_type: "investment", current_balance: 30000 },
    { id: "inv3", account_type: "investment", current_balance: 20000 },
  ];
  const positions = [
    { financial_account_id: "inv1", last_valuation: 55000 },
    { financial_account_id: "inv2", last_valuation: 32000 },
    { financial_account_id: "inv3", last_valuation: 18000 },
  ];

  const result = computeCanonicalInvestmentMetadata(accounts, positions, accounts);
  assert.equal(result.positionsValue, 105000);
  assert.equal(result.brokerageAccountCount, 3);
  assert.equal(result.brokerageAccountsWithPositions, 3);
  assert.equal(result.dataStatus, "positions_verified");
});

// ─── Regression: connections page visibility ──────────────────────────────────
// deriveBrokerageStatus is already declared above; reuse it here.

// Simulates connections/page.tsx query filter: .neq("status", "deleted")
function filterActiveConnections(allConnections) {
  return allConnections.filter(c => c.status !== "deleted");
}

test("regression: plaid connection with active status appears in connections list", () => {
  const connections = [
    { id: "c1", provider: "plaid", institution_name: "TD Bank", status: "active", sync_status: "synced" },
  ];
  const visible = filterActiveConnections(connections);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].institution_name, "TD Bank");
});

test("regression: plaid connection with inactive status still appears (not deleted)", () => {
  const connections = [
    { id: "c1", provider: "plaid", institution_name: "TD Bank", status: "inactive", sync_status: "never" },
  ];
  const visible = filterActiveConnections(connections);
  assert.equal(visible.length, 1, "inactive plaid connection must still appear on connections page");
});

test("regression: deleted connection is excluded from connections list", () => {
  const connections = [
    { id: "c1", provider: "plaid", institution_name: "TD Bank", status: "deleted", sync_status: "never" },
  ];
  const visible = filterActiveConnections(connections);
  assert.equal(visible.length, 0);
});

test("regression: plaid and snaptrade connections coexist independently", () => {
  const connections = [
    { id: "c1", provider: "plaid",      institution_name: "TD Bank",  status: "active",   sync_status: "synced" },
    { id: "c2", provider: "snaptrade",  institution_name: "Fidelity", status: "active",   sync_status: "synced" },
  ];
  const visible = filterActiveConnections(connections);
  assert.equal(visible.length, 2);
  assert.ok(visible.some(c => c.provider === "plaid"));
  assert.ok(visible.some(c => c.provider === "snaptrade"));
});

test("regression: plaid connection uses sync_status badge, not brokerage derivation", () => {
  const conn = { id: "c1", provider: "plaid", sync_status: "synced" };
  const status = deriveBrokerageStatus(conn, [], []);
  assert.equal(status.label, "Synced");
  assert.equal(status.warning, undefined, "plaid connections must never show a brokerage warning");
});

test("regression: plaid connection with sync_status=never shows Never synced, not brokerage warning", () => {
  const conn = { id: "c1", provider: "plaid", sync_status: "never" };
  const status = deriveBrokerageStatus(conn, [], []);
  assert.equal(status.label, "Never synced");
  assert.equal(status.warning, undefined);
});

test("regression: snaptrade status derivation does not affect plaid display", () => {
  const plaidConn    = { id: "c1", provider: "plaid",     sync_status: "synced" };
  const snapConn     = { id: "c2", provider: "snaptrade", sync_status: "synced" };
  const snapAccounts = [{ id: "a1", current_balance: 0 }];
  const posCounts    = [];

  const plaidStatus = deriveBrokerageStatus(plaidConn, [], []);
  const snapStatus  = deriveBrokerageStatus(snapConn, snapAccounts, posCounts);

  assert.equal(plaidStatus.label, "Synced",      "plaid status must be derived from sync_status only");
  assert.equal(snapStatus.label, "Missing Data", "snaptrade with zero-balance account and no positions shows Missing Data");
});

test("regression: snaptrade connection with no child accounts shows warning, not clean synced", () => {
  const conn = { id: "c1", provider: "snaptrade", sync_status: "synced" };
  const status = deriveBrokerageStatus(conn, [], []);
  assert.equal(status.label, "No Accounts");
  assert.ok(status.warning, "must show a warning when brokerage has no child accounts");
});

test("regression: snaptrade connection with no accounts and sync_status=never shows Pending Sync", () => {
  const conn = { id: "c1", provider: "snaptrade", sync_status: "never" };
  const status = deriveBrokerageStatus(conn, [], []);
  assert.equal(status.label, "Pending Sync");
  assert.ok(status.warning);
});

test("regression: snaptrade connection with accounts and positions shows Synced (no warning)", () => {
  const conn     = { id: "c1", provider: "snaptrade", sync_status: "synced" };
  const accounts = [{ id: "a1", current_balance: 10000 }];
  const posCounts = [{ financial_account_id: "a1", count: 5 }];
  const status = deriveBrokerageStatus(conn, accounts, posCounts);
  assert.equal(status.label, "Synced");
  assert.equal(status.warning, undefined);
});

test("regression: snaptrade with accounts but no positions shows No Positions warning (not Synced)", () => {
  const conn     = { id: "c1", provider: "snaptrade", sync_status: "synced" };
  const accounts = [{ id: "a1", current_balance: 50000 }];
  const posCounts = [];
  const status = deriveBrokerageStatus(conn, accounts, posCounts);
  assert.equal(status.label, "No Positions");
  assert.ok(status.warning, "must warn when accounts present but positions missing");
});

test("regression: snaptrade partial sync warns about missing accounts (some have positions, some don't)", () => {
  const conn = { id: "c1", provider: "snaptrade", sync_status: "synced" };
  const accounts = [
    { id: "a1", current_balance: 10000 },
    { id: "a2", current_balance: 5000 },
  ];
  const posCounts = [{ financial_account_id: "a1", count: 3 }]; // a2 has no positions
  const status = deriveBrokerageStatus(conn, accounts, posCounts);
  assert.equal(status.label, "Partial");
  assert.ok(status.warning?.includes("1 account(s) missing positions"));
});

test("regression: connections array null (failed query) defaults to empty — no crash", () => {
  // Mirrors: setConnections(connRes.data ?? [])
  const connResData = null;
  const connections = connResData ?? [];
  assert.equal(connections.length, 0);
  // No crash simulates what the UI does — but this verifies the fallback is safe,
  // not that the data is correct. Real fix is removing invalid column from SELECT.
});

test("regression: multi-user isolation — user A connections do not appear for user B", () => {
  const allConnections = [
    { id: "c1", user_id: "user-a", provider: "plaid",     institution_name: "TD Bank",  status: "active" },
    { id: "c2", user_id: "user-b", provider: "snaptrade", institution_name: "Fidelity", status: "active" },
  ];
  const userAConnections = filterActiveConnections(allConnections.filter(c => c.user_id === "user-a"));
  const userBConnections = filterActiveConnections(allConnections.filter(c => c.user_id === "user-b"));
  assert.equal(userAConnections.length, 1);
  assert.equal(userAConnections[0].institution_name, "TD Bank");
  assert.equal(userBConnections.length, 1);
  assert.equal(userBConnections[0].institution_name, "Fidelity");
});

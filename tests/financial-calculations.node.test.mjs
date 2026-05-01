import test from "node:test";
import assert from "node:assert/strict";

function sumAmounts(items) {
  return items.reduce((sum, item) => {
    const value = Number(item.amount ?? 0);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);
}

function classifyIncome(transactions) {
  const income = transactions.filter((tx) => tx.type === "income");
  const totalIncome = sumAmounts(income);
  const w2Income = sumAmounts(income.filter((tx) => tx.taxClass === "w2"));
  const selfEmployedIncome = sumAmounts(income.filter((tx) => tx.taxClass === "self_employed"));
  const businessIncome = sumAmounts(income.filter((tx) => tx.taxClass === "business"));
  const untaggedIncome = sumAmounts(income.filter((tx) => !tx.taxClass));

  return {
    totalIncome,
    w2Income,
    selfEmployedIncome,
    businessIncome,
    untaggedIncome,
    estimatedTaxIncomeBase: selfEmployedIncome + businessIncome,
  };
}

test("financial calculation smoke: income, expenses, and cash flow are deterministic", () => {
  const transactions = [
    { type: "income", amount: 5000, taxClass: "w2" },
    { type: "income", amount: 1200, taxClass: "self_employed" },
    { type: "expense", amount: 400 },
    { type: "expense", amount: 100 },
    { type: "income", amount: null },
    { type: "expense", amount: "bad-value" },
  ];

  const totalIncome = sumAmounts(transactions.filter((tx) => tx.type === "income"));
  const totalExpenses = sumAmounts(transactions.filter((tx) => tx.type === "expense"));
  const netCashFlow = totalIncome - totalExpenses;

  assert.equal(totalIncome, 6200);
  assert.equal(totalExpenses, 500);
  assert.equal(netCashFlow, 5700);
});

test("W2 salary is included in income but excluded from estimated tax base", () => {
  const result = classifyIncome([
    { type: "income", amount: 5000, taxClass: "w2" },
    { type: "income", amount: 2000, taxClass: "self_employed" },
    { type: "income", amount: 3000, taxClass: "business" },
    { type: "income", amount: 750 },
  ]);

  assert.equal(result.totalIncome, 10750);
  assert.equal(result.w2Income, 5000);
  assert.equal(result.selfEmployedIncome, 2000);
  assert.equal(result.businessIncome, 3000);
  assert.equal(result.untaggedIncome, 750);
  assert.equal(result.estimatedTaxIncomeBase, 5000);
});

test("large dataset calculation remains deterministic and non-NaN", () => {
  const transactions = Array.from({ length: 1000 }, (_, index) => ({
    type: index % 3 === 0 ? "income" : "expense",
    amount: index % 3 === 0 ? 100 : 25,
    taxClass: index % 6 === 0 ? "w2" : index % 3 === 0 ? "business" : undefined,
  }));

  const totalIncome = sumAmounts(transactions.filter((tx) => tx.type === "income"));
  const totalExpenses = sumAmounts(transactions.filter((tx) => tx.type === "expense"));
  const netCashFlow = totalIncome - totalExpenses;

  assert.equal(Number.isNaN(totalIncome), false);
  assert.equal(Number.isNaN(totalExpenses), false);
  assert.equal(Number.isNaN(netCashFlow), false);
  assert.equal(totalIncome, 33400);
  assert.equal(totalExpenses, 16650);
  assert.equal(netCashFlow, 16750);
});

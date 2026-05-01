import { test, expect } from "@playwright/test";
import { loginAsE2EUser, ensureDashboardReady } from "./helpers/auth";
import { createSupabaseAdmin, updateRow } from "./helpers/supabase-admin";
import { cleanupDashboardSeed, seedDashboardData, type DashboardSeed } from "./fixtures/dashboard-seed";
import { expectCurrencyNear, expectNoInvalidFinancialText, readCurrency } from "./helpers/financial-values";

let seed: DashboardSeed;

test.beforeEach(async ({ page }) => {
  seed = await seedDashboardData();
  await loginAsE2EUser(page);
  await ensureDashboardReady(page);
});

test.afterEach(async () => {
  if (seed?.user?.id) {
    await cleanupDashboardSeed(seed.user.id);
  }
});

test.describe("Dashboard mutation-flow regression coverage", () => {
  test("transaction edits propagate to Transactions and Summary totals", async ({ page }) => {
    await page.goto("/dashboard/transactions", { waitUntil: "domcontentloaded" });
    await ensureDashboardReady(page);

    await expectCurrencyNear(await readCurrency(page, "transactions-total-in"), 10000);
    await expectCurrencyNear(await readCurrency(page, "transactions-total-out"), 400);
    await expectCurrencyNear(await readCurrency(page, "transactions-net"), 9600);

    await updateRow("transactions", seed.expenseTransactionId, {
      amount: 600,
      category: "Business",
      updated_at: new Date().toISOString(),
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await expectCurrencyNear(await readCurrency(page, "transactions-total-out"), 600);
    await expectCurrencyNear(await readCurrency(page, "transactions-net"), 9400);

    await page.goto("/dashboard/summary", { waitUntil: "domcontentloaded" });
    await ensureDashboardReady(page);
    await expectCurrencyNear(await readCurrency(page, "summary-total-income"), 10000);
    await expectCurrencyNear(await readCurrency(page, "summary-total-expenses"), 600);
    await expectCurrencyNear(await readCurrency(page, "summary-net-cash-flow"), 9400);
    await expectNoInvalidFinancialText(page);
  });

  test("deleted transactions are excluded from dashboard financial totals", async ({ page }) => {
    await updateRow("transactions", seed.expenseTransactionId, {
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await page.goto("/dashboard/transactions", { waitUntil: "domcontentloaded" });
    await ensureDashboardReady(page);
    await expectCurrencyNear(await readCurrency(page, "transactions-total-out"), 0);
    await expectCurrencyNear(await readCurrency(page, "transactions-net"), 10000);

    await page.goto("/dashboard/summary", { waitUntil: "domcontentloaded" });
    await ensureDashboardReady(page);
    await expectCurrencyNear(await readCurrency(page, "summary-total-expenses"), 0);
    await expectCurrencyNear(await readCurrency(page, "summary-net-cash-flow"), 10000);
  });

  test("W2 salary is included in income totals while tax estimate remains driven by non-W2 inputs", async ({ page }) => {
    await page.goto("/dashboard/income", { waitUntil: "domcontentloaded" });
    await ensureDashboardReady(page);
    await expectCurrencyNear(await readCurrency(page, "income-total"), 10000);
    await expectCurrencyNear(await readCurrency(page, "income-tagged"), 10000);

    await page.goto("/dashboard/summary", { waitUntil: "domcontentloaded" });
    await ensureDashboardReady(page);
    await expectCurrencyNear(await readCurrency(page, "summary-total-income"), 10000);
    await expectCurrencyNear(await readCurrency(page, "summary-estimated-tax"), 1250);

    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from("transactions")
      .update({ amount: 7000, updated_at: new Date().toISOString() })
      .eq("id", seed.salaryTransactionId);
    if (error) throw error;

    await page.reload({ waitUntil: "domcontentloaded" });
    await expectCurrencyNear(await readCurrency(page, "summary-total-income"), 12000);
    await expectCurrencyNear(await readCurrency(page, "summary-estimated-tax"), 1250);
  });

  test("business/self-employed income and write-offs remain visible in tax and deduction surfaces", async ({ page }) => {
    await page.goto("/dashboard/write-offs", { waitUntil: "domcontentloaded" });
    await ensureDashboardReady(page);

    await expectCurrencyNear(await readCurrency(page, "writeoffs-total-expenses"), 200);
    await expectCurrencyNear(await readCurrency(page, "writeoffs-total-deductible"), 100);
    await expectCurrencyNear(await readCurrency(page, "writeoffs-tax-savings"), 25);

    await updateRow("write_offs", seed.writeOffId, {
      amount: 300,
      updated_at: new Date().toISOString(),
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await expectCurrencyNear(await readCurrency(page, "writeoffs-total-expenses"), 300);
    await expectCurrencyNear(await readCurrency(page, "writeoffs-total-deductible"), 150);
    await expectCurrencyNear(await readCurrency(page, "writeoffs-tax-savings"), 37.5);
    await expectNoInvalidFinancialText(page);
  });

  test("budget records enforce monthly budget spent and remaining identity", async ({ page }) => {
    await page.goto("/dashboard/budget", { waitUntil: "domcontentloaded" });
    await ensureDashboardReady(page);

    const monthlyBudget = await readCurrency(page, "budget-monthly");
    const spent = await readCurrency(page, "budget-spent");
    const remaining = await readCurrency(page, "budget-remaining");

    await expectCurrencyNear(monthlyBudget, 1000);
    await expectCurrencyNear(spent, 400);
    await expectCurrencyNear(remaining, 600);
    await expectCurrencyNear(monthlyBudget - spent, remaining);

    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from("budget_records")
      .update({ actual_spent: 650, variance: 350, updated_at: new Date().toISOString() })
      .eq("category_id", seed.budgetCategoryId);
    if (error) throw error;

    await page.reload({ waitUntil: "domcontentloaded" });
    await expectCurrencyNear(await readCurrency(page, "budget-spent"), 650);
    await expectCurrencyNear(await readCurrency(page, "budget-remaining"), 350);
  });

  test("savings goal mutations update saved, target, and active goal totals", async ({ page }) => {
    await page.goto("/dashboard/savings", { waitUntil: "domcontentloaded" });
    await ensureDashboardReady(page);

    await expectCurrencyNear(await readCurrency(page, "savings-total-saved"), 1500);
    await expectCurrencyNear(await readCurrency(page, "savings-total-target"), 5000);

    await updateRow("savings_goals", seed.savingsGoalId, {
      current_amount: 2000,
      updated_at: new Date().toISOString(),
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await expectCurrencyNear(await readCurrency(page, "savings-total-saved"), 2000);
    await expectCurrencyNear(await readCurrency(page, "savings-total-target"), 5000);

    await updateRow("savings_goals", seed.savingsGoalId, {
      status: "archived",
      updated_at: new Date().toISOString(),
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await expectCurrencyNear(await readCurrency(page, "savings-total-saved"), 0);
  });

  test("investment position values feed portfolio and summary investments once", async ({ page }) => {
    await page.goto("/dashboard/investments", { waitUntil: "domcontentloaded" });
    await ensureDashboardReady(page);

    await expectCurrencyNear(await readCurrency(page, "investments-portfolio-total"), 1000);

    await page.goto("/dashboard/summary", { waitUntil: "domcontentloaded" });
    await ensureDashboardReady(page);
    await expectCurrencyNear(await readCurrency(page, "summary-investments"), 0);

    await updateRow("financial_accounts", seed.investmentAccountId, {
      current_balance: 1000,
      updated_at: new Date().toISOString(),
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await expectCurrencyNear(await readCurrency(page, "summary-investments"), 1000);

    await updateRow("positions", seed.positionId, {
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await page.goto("/dashboard/investments", { waitUntil: "domcontentloaded" });
    await ensureDashboardReady(page);
    await expectCurrencyNear(await readCurrency(page, "investments-portfolio-total"), 0);
  });

  test("connection disconnect clears connected-account balances from summary", async ({ page }) => {
    await page.goto("/dashboard/summary", { waitUntil: "domcontentloaded" });
    await ensureDashboardReady(page);
    await expectCurrencyNear(await readCurrency(page, "summary-net-worth"), 10000);

    await updateRow("financial_accounts", seed.accountId, {
      is_active: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await expectCurrencyNear(await readCurrency(page, "summary-net-worth"), 0);
    await expectNoInvalidFinancialText(page);
  });
});

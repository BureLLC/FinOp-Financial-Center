const { test, expect } = require("@playwright/test");

const dashboardRoutes = [
  { path: "/dashboard", name: "Dashboard Home", expected: [/Net Worth/i, /Expenses/i, /Investments/i] },
  { path: "/dashboard/summary", name: "Financial Summary", expected: [/summary|net worth|income|expenses|cash flow/i] },
  { path: "/dashboard/income", name: "Income Tracker", expected: [/income/i] },
  { path: "/dashboard/transactions", name: "Transactions", expected: [/transactions|total in|total out|net/i] },
  { path: "/dashboard/budget", name: "Budget Center", expected: [/budget|spent|remaining|envelope/i] },
  { path: "/dashboard/savings", name: "Savings Dashboard", expected: [/savings|saved|target|goal/i] },
  { path: "/dashboard/write-offs", name: "Write-Offs", expected: [/write.?offs|deductible|tax savings|verified/i] },
  { path: "/dashboard/investments", name: "Investment Portfolio", expected: [/investment|portfolio|position/i] },
  { path: "/dashboard/connections", name: "Financial Connections", expected: [/connection|bank|brokerage|sync|plaid|snaptrade/i] },
  { path: "/dashboard/tax", name: "Tax Center", expected: [/tax|irs|state|self|business|salary|w2/i] },
];

test.describe("Dashboard route coverage", () => {
  for (const route of dashboardRoutes) {
    test(`${route.name} renders without crashing`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible();

      const bodyText = await page.locator("body").innerText();
      const matched = route.expected.some((pattern) => pattern.test(bodyText));

      expect(
        matched,
        `${route.name} at ${route.path} should show one of: ${route.expected.map(String).join(", ")}`
      ).toBe(true);

      await expect(page.locator("body")).not.toContainText(/Application error|Unhandled Runtime Error|TypeError|ReferenceError/i);
      expect(bodyText).not.toMatch(/NaN|undefined/i);
    });
  }
});

test.describe("Financial dashboard smoke checks", () => {
  test("dashboard home exposes key financial concepts", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    await expect(page.getByText(/Net Worth/i)).toBeVisible();
    await expect(page.getByText(/Expenses/i)).toBeVisible();
    await expect(page.getByText(/Investments/i)).toBeVisible();

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/NaN|undefined|null/i);
  });

  test("tax page exposes tax concepts without obvious invalid values", async ({ page }) => {
    await page.goto("/dashboard/tax", { waitUntil: "domcontentloaded" });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toMatch(/tax/i);
    expect(bodyText).not.toMatch(/NaN|undefined/i);
  });
});

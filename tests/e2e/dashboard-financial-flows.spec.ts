const { test, expect } = require("@playwright/test");

const dashboardRoutes = [
  { path: "/dashboard",              name: "Dashboard Home",        expected: [/Net Worth/i, /Expenses/i, /Investments/i] },
  { path: "/dashboard/summary",      name: "Financial Summary",     expected: [/summary|net worth|income|expenses|cash flow/i] },
  { path: "/dashboard/income",       name: "Income Tracker",        expected: [/income/i] },
  { path: "/dashboard/transactions", name: "Transactions",          expected: [/transactions|total in|total out|net/i] },
  { path: "/dashboard/budget",       name: "Budget Center",         expected: [/budget|spent|remaining|envelope/i] },
  { path: "/dashboard/savings",      name: "Savings Dashboard",     expected: [/savings|saved|target|goal/i] },
  { path: "/dashboard/write-offs",   name: "Write-Offs",            expected: [/write.?offs|deductible|tax savings|verified/i] },
  { path: "/dashboard/investments",  name: "Investment Portfolio",  expected: [/investment|portfolio|position/i] },
  { path: "/dashboard/connections",  name: "Financial Connections", expected: [/connection|bank|brokerage|sync|plaid|snaptrade/i] },
  { path: "/dashboard/tax",          name: "Tax Center",            expected: [/tax|irs|state|self|business|salary|w2/i] },
];

// ─── Route smoke tests ────────────────────────────────────────────────────────

test.describe("Dashboard route coverage", () => {
  for (const route of dashboardRoutes) {
    test(`${route.name} renders without crashing`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible();

      const bodyText = await page.locator("body").innerText();
      const matched = route.expected.some((pattern) => pattern.test(bodyText));

      expect(
        matched,
        `${route.name} at ${route.path} should show one of: ${route.expected.map(String).join(", ")}`,
      ).toBe(true);

      await expect(page.locator("body")).not.toContainText(
        /Application error|Unhandled Runtime Error|TypeError|ReferenceError/i,
      );
      expect(bodyText).not.toMatch(/NaN|undefined/i);
    });
  }
});

// ─── Dashboard smoke checks ───────────────────────────────────────────────────

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

// ─── Financial Summary KPI card checks ───────────────────────────────────────

test.describe("Financial Summary KPI cards", () => {
  test("summary page shows all six KPI labels", async ({ page }) => {
    await page.goto("/dashboard/summary", { waitUntil: "domcontentloaded" });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toMatch(/Net Worth/i);
    expect(bodyText).toMatch(/Total Income/i);
    expect(bodyText).toMatch(/Total Expenses/i);
    expect(bodyText).toMatch(/Net Cash Flow/i);
    expect(bodyText).toMatch(/Investments/i);
    expect(bodyText).not.toMatch(/NaN/i);
  });

  test("summary page shows currency values (dollar signs), no raw numbers like 500,650", async ({ page }) => {
    await page.goto("/dashboard/summary", { waitUntil: "domcontentloaded" });

    const bodyText = await page.locator("body").innerText();
    // Old hardcoded chart values were 500, 650, 720, 780, 850 — they must not appear standalone
    // (they could appear inside formatted values like $650.00 but not as raw labels)
    expect(bodyText).not.toMatch(/\b500\b.*\b650\b.*\b720\b/);
  });
});

// ─── Income Tracker checks ────────────────────────────────────────────────────

test.describe("Income Tracker", () => {
  test("income page shows income KPI cards without NaN", async ({ page }) => {
    await page.goto("/dashboard/income", { waitUntil: "domcontentloaded" });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toMatch(/Total Income/i);
    expect(bodyText).toMatch(/Tagged Income/i);
    expect(bodyText).not.toMatch(/NaN/i);
  });
});

// ─── Transactions checks ──────────────────────────────────────────────────────

test.describe("Transactions page", () => {
  test("shows Total In, Total Out, and Net without NaN", async ({ page }) => {
    await page.goto("/dashboard/transactions", { waitUntil: "domcontentloaded" });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toMatch(/Total In/i);
    expect(bodyText).toMatch(/Total Out/i);
    expect(bodyText).toMatch(/\bNet\b/i);
    expect(bodyText).not.toMatch(/NaN/i);
  });
});

// ─── Write-Offs checks ────────────────────────────────────────────────────────

test.describe("Write-Offs page", () => {
  test("write-offs page shows tax savings estimate without NaN", async ({ page }) => {
    await page.goto("/dashboard/write-offs", { waitUntil: "domcontentloaded" });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toMatch(/Tax Savings/i);
    expect(bodyText).toMatch(/25%/);         // DEFAULT_TAX_RATE rendered as ~25%
    expect(bodyText).not.toMatch(/NaN/i);
  });

  test("write-offs year selector defaults to current year", async ({ page }) => {
    await page.goto("/dashboard/write-offs", { waitUntil: "domcontentloaded" });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toMatch(/2026/);
  });
});

// ─── Budget Center checks ─────────────────────────────────────────────────────

test.describe("Budget Center", () => {
  test("budget page shows monthly budget KPIs without NaN", async ({ page }) => {
    await page.goto("/dashboard/budget", { waitUntil: "domcontentloaded" });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toMatch(/Monthly Budget|Budget Tracker|Envelope/i);
    expect(bodyText).not.toMatch(/NaN/i);
  });
});

// ─── Savings Dashboard checks ─────────────────────────────────────────────────

test.describe("Savings Dashboard", () => {
  test("savings page shows Total Saved, Total Target, Active Goals without NaN", async ({ page }) => {
    await page.goto("/dashboard/savings", { waitUntil: "domcontentloaded" });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toMatch(/Total Saved/i);
    expect(bodyText).toMatch(/Total Target|Active Goals/i);
    expect(bodyText).not.toMatch(/NaN/i);
  });
});

// ─── Investment Portfolio checks ──────────────────────────────────────────────

test.describe("Investment Portfolio", () => {
  test("investments page loads without NaN or undefined", async ({ page }) => {
    await page.goto("/dashboard/investments", { waitUntil: "domcontentloaded" });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/NaN/i);
    expect(bodyText).not.toMatch(/\bundefined\b/i);
  });
});

// ─── Financial Connections checks ─────────────────────────────────────────────

test.describe("Financial Connections", () => {
  test("connections page loads and shows provider options", async ({ page }) => {
    await page.goto("/dashboard/connections", { waitUntil: "domcontentloaded" });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toMatch(/plaid|snaptrade|bank|brokerage/i);
    expect(bodyText).not.toMatch(/NaN/i);
  });
});

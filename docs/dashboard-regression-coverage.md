# Dashboard Regression Coverage

This branch adds an executable regression-test foundation for the FinOps dashboard.

## Scope added

- Node unit/smoke tests for deterministic financial calculations.
- Playwright configuration for browser-based dashboard tests.
- Dashboard route coverage for the core financial pages:
  - Dashboard home
  - Financial Summary
  - Income Tracker
  - Transactions
  - Budget Center
  - Savings Dashboard
  - Write-Offs
  - Investment Portfolio
  - Financial Connections
  - Tax Center

## Commands

```bash
npm test
npm run test:unit
npm run test:e2e
npm run test:all
```

## Local Playwright setup

After installing dependencies, install the Chromium browser binary once:

```bash
npx playwright install chromium
```

For lower-resource local runs, start the app manually in one terminal:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Then run the browser test in another terminal:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test tests/e2e/dashboard-financial-flows.spec.ts --project=chromium --workers=1 --reporter=line
```

## Current limitations

The browser coverage currently verifies route reachability, core financial terminology, and obvious invalid-value failures such as `NaN` or `undefined`. It does not yet seed a test database or perform full mutation flows for create/edit/delete/tag operations.

Recommended next coverage layer:

1. Add isolated test fixtures or mocked Supabase responses.
2. Add stable `data-testid` attributes to financial KPI values.
3. Add mutation-flow tests for transactions, income tags, budgets, savings, write-offs, investments, and connection refresh behavior.
4. Add CI workflow steps for `npm ci`, `npm run build`, `npm test`, and `npm run test:e2e`.

## Tax regression guardrails

The unit tests explicitly guard the rule that W2/Salary income is included in total income but excluded from the estimated-tax income base. Self-employed and business income remain the categories that feed estimated-tax responsibility in the smoke model.

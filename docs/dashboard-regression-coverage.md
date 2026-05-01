# Dashboard Regression Coverage

This repository now has a staged dashboard regression strategy for launch readiness.

## Foundation coverage

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

## Mutation-flow coverage

The `dashboard-mutation-flow-tests` branch adds seeded Supabase-backed E2E mutation coverage for:

- Transaction amount edits propagating to Transactions and Summary totals.
- Deleted transactions being excluded from Transactions and Summary totals.
- W2/Salary income appearing in income totals while estimated tax remains unchanged by W2 changes.
- Business/self-employed income and write-offs remaining visible in tax/deduction surfaces.
- Budget monthly budget, spent, and remaining identity.
- Savings goal saved/target/active state changes.
- Investment position values flowing into Investment Portfolio and Summary investments.
- Connection/account disconnect clearing stale Summary balances.

## Commands

```bash
npm test
npm run test:unit
npm run test:e2e
npm run test:all
```

## Required E2E environment

The full mutation-flow suite requires these environment variables locally or as GitHub Actions secrets:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
E2E_SUPABASE_SERVICE_ROLE_KEY
E2E_TEST_EMAIL
E2E_TEST_PASSWORD
```

`E2E_SUPABASE_SERVICE_ROLE_KEY` must only be used in test/CI environments. Do not expose it to client-side app code.

## Local Playwright setup

After installing dependencies, install Chromium once:

```bash
npx playwright install chromium
```

For lower-resource local runs, start the app manually in one terminal:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Then run the browser test in another terminal:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test tests/e2e/dashboard-mutation-flows.spec.ts --project=chromium --workers=1 --reporter=line
```

## CI

The dashboard regression workflow runs:

```bash
npm ci
npm run build
npm test
npx playwright install --with-deps chromium
npm run test:e2e
npm run test:all
```

## Tax regression guardrails

The unit and mutation-flow tests guard the rule that W2/Salary income is included in total income but excluded from estimated-tax changes. Self-employed/business income and business deductions remain covered through the dashboard tax/write-off surfaces.

## Known risks

- The full mutation-flow suite depends on Supabase schema compatibility with seeded test records.
- If schema columns differ between environments, seed fixtures may need to be adjusted.
- The selector hydrator is a bridge implementation. Long-term, explicit page-level `data-testid` attributes should replace dynamic assignment.

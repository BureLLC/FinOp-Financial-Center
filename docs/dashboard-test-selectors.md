# Dashboard Test Selectors

This branch adds a non-visual dashboard test-id hydrator so Playwright tests can target dashboard values, rows, and controls consistently while the full page-by-page selector migration is completed.

## Implementation

- `app/components/DashboardTestIds.tsx` observes dashboard pages and applies `data-testid` attributes after render.
- `app/dashboard/layout.tsx` mounts the hydrator for dashboard routes.

The hydrator does not change visual styling or financial business logic. It only adds `data-testid` attributes to existing rendered elements.

## Selector coverage

The hydrator currently targets the selector groups required by Issue #10:

- Summary KPI values
- Income totals and income classification controls
- Transactions totals, rows, category input, income classification, save/delete controls
- Budget totals, filters, and category controls
- Savings totals, goal rows, and goal controls
- Write-off totals, tax-year selector, rows, and controls
- Investment totals, position rows, and position controls
- Tax estimated due and income classification values
- Connection rows and connection action buttons

## Limitations

This is a bridge implementation for launch-test enablement. The strongest long-term version is to place explicit `data-testid` attributes directly in each page component next to the rendered value/control.

Recommended follow-up:

1. Keep the hydrator as a compatibility layer.
2. Gradually replace dynamic selector assignment with explicit page-level `data-testid` attributes.
3. Expand Playwright mutation tests against the stable selector names.

## Validation commands

Run locally or in CI:

```bash
npm test
npm run build
npm run test:e2e
```

## Related

- Issue #10: Add stable dashboard mutation test selectors
- Issue #9: Add full dashboard mutation-flow regression coverage
- PR #8: Add executable dashboard regression coverage

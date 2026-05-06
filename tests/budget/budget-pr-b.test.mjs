/**
 * Budget Automation PR B: suggestion UI, accept/reject, generation wiring, flag flip.
 *
 * All behavioral logic under test is inlined — no TypeScript imports.
 * Source files are read via fs.readFileSync for structural assertions.
 *
 * Run with: node --test tests/budget/budget-pr-b.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Feature flag
// ═══════════════════════════════════════════════════════════════════════════════

test("BUDGET_AUTOMATION_ENABLED is true in PR B", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/constants.ts"), "utf8");
  assert.match(src, /BUDGET_AUTOMATION_ENABLED\s*=\s*true/, "Flag must be true in PR B");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Migration: apply_budget_suggestion RPC
// ═══════════════════════════════════════════════════════════════════════════════

test("apply_budget_suggestion migration file exists", () => {
  assert.ok(existsSync(path.join(ROOT, "supabase/migrations/20260506000003_add_apply_budget_suggestion.sql")));
});

test("apply_budget_suggestion RPC is defined in the migration", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000003_add_apply_budget_suggestion.sql"),
    "utf8",
  );
  assert.match(sql, /CREATE OR REPLACE FUNCTION.*apply_budget_suggestion/s, "RPC must be defined");
});

test("apply_budget_suggestion verifies ownership and pending status", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000003_add_apply_budget_suggestion.sql"),
    "utf8",
  );
  assert.match(sql, /user_id\s*=\s*p_user_id/, "Must verify user_id");
  assert.match(sql, /Unauthorized or suggestion not found/, "Must raise on ownership failure");
  assert.match(sql, /Suggestion is not pending/, "Must raise on non-pending status");
});

test("apply_budget_suggestion writes to budget_categories.monthly_limit only", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000003_add_apply_budget_suggestion.sql"),
    "utf8",
  );
  assert.match(sql, /UPDATE.*budget_categories[\s\S]*SET.*monthly_limit/s, "Must update monthly_limit");
  assert.doesNotMatch(sql, /UPDATE.*transactions/i, "Must not update transactions");
  assert.doesNotMatch(sql, /UPDATE.*financial_accounts/i, "Must not update accounts");
  assert.doesNotMatch(sql, /UPDATE.*write_offs/i, "Must not update write_offs");
});

test("apply_budget_suggestion upserts: inserts new budget_categories row when none exists", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000003_add_apply_budget_suggestion.sql"),
    "utf8",
  );
  assert.match(sql, /INSERT INTO.*budget_categories/s, "Must insert when no existing row");
  assert.match(sql, /category_type.*expense/s, "New row must default to expense type");
  assert.match(sql, /is_active.*true/s, "New row must be active");
});

test("apply_budget_suggestion marks suggestion accepted", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000003_add_apply_budget_suggestion.sql"),
    "utf8",
  );
  assert.match(sql, /status\s*=\s*'accepted'/, "Must set status to accepted");
  assert.match(sql, /resolved_at/, "Must set resolved_at");
  assert.match(sql, /resolved_by\s*=\s*'user'/, "Must set resolved_by = user");
});

test("apply_budget_suggestion uses SECURITY DEFINER with search_path guard", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000003_add_apply_budget_suggestion.sql"),
    "utf8",
  );
  assert.match(sql, /SECURITY DEFINER/, "Must be SECURITY DEFINER");
  assert.match(sql, /SET search_path\s*=\s*public/, "Must pin search_path to prevent path injection");
});

test("apply_budget_suggestion grants execute to authenticated", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000003_add_apply_budget_suggestion.sql"),
    "utf8",
  );
  assert.match(sql, /GRANT EXECUTE.*authenticated/, "Must grant execute to authenticated role");
});

test("apply_budget_suggestion migration includes rollback comment", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000003_add_apply_budget_suggestion.sql"),
    "utf8",
  );
  assert.match(sql, /Rollback.*DROP FUNCTION/i, "Must include rollback comment");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. POST /api/budget/suggestions/[id]/accept route
// ═══════════════════════════════════════════════════════════════════════════════

test("accept route file exists", () => {
  assert.ok(existsSync(path.join(ROOT, "app/api/budget/suggestions/[id]/accept/route.ts")));
});

test("accept route requires authentication (401)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.match(src, /Unauthorized.*401/s, "Must return 401 when unauthenticated");
});

test("accept route verifies ownership (404 on mismatch)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.match(src, /Not found.*404/s, "Must return 404 when suggestion not found or wrong user");
  assert.match(src, /\.eq\(["']user_id["'],\s*userId\)/, "Must filter by user_id");
});

test("accept route returns 400 when suggestion is not pending", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.match(src, /not pending.*400/s, "Must return 400 when suggestion is not pending");
});

test("accept route delegates to apply_budget_suggestion RPC", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.match(src, /apply_budget_suggestion/, "Must call apply_budget_suggestion RPC");
  assert.match(src, /p_suggestion_id/, "Must pass p_suggestion_id to RPC");
  assert.match(src, /p_user_id/, "Must pass p_user_id to RPC");
});

test("accept route does not directly write transactions or balances", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /from\(["']transactions["']\).*\.update\(/s, "Must not update transactions");
  assert.doesNotMatch(src, /from\(["']financial_accounts["']\)/i, "Must not query accounts table");
  assert.doesNotMatch(src, /from\(["']write_offs["']\)/i, "Must not query write_offs");
  assert.doesNotMatch(src, /canonicalFinancialData/i, "Must not import canonicalFinancialData");
});

test("accept route does not directly write budget_categories (delegates to RPC)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.doesNotMatch(
    src,
    /from\(["']budget_categories["']\).*\.update\(/s,
    "Route must not directly write budget_categories — RPC handles this atomically",
  );
  assert.doesNotMatch(
    src,
    /from\(["']budget_categories["']\).*\.insert\(/s,
    "Route must not directly insert into budget_categories",
  );
});

test("accept route does not reference Tax Center or Write-Offs", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /tax_center|taxCenter/i, "Must not reference Tax Center");
  assert.doesNotMatch(src, /is_writeoff_candidate/i, "Must not reference write-off fields");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. POST /api/budget/suggestions/[id]/reject route
// ═══════════════════════════════════════════════════════════════════════════════

test("reject route file exists", () => {
  assert.ok(existsSync(path.join(ROOT, "app/api/budget/suggestions/[id]/reject/route.ts")));
});

test("reject route requires authentication (401)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/reject/route.ts"),
    "utf8",
  );
  assert.match(src, /Unauthorized.*401/s, "Must return 401 when unauthenticated");
});

test("reject route verifies ownership (404 on mismatch)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/reject/route.ts"),
    "utf8",
  );
  assert.match(src, /Not found.*404/s, "Must return 404 when suggestion not found or wrong user");
  assert.match(src, /\.eq\(["']user_id["'],\s*userId\)/, "Must filter by user_id");
});

test("reject route returns 400 when suggestion is not pending", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/reject/route.ts"),
    "utf8",
  );
  assert.match(src, /not pending.*400/s, "Must return 400 when not pending");
});

test("reject route accepts the three valid budget rejection reasons", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/reject/route.ts"),
    "utf8",
  );
  assert.match(src, /already_budgeted/, "Must accept already_budgeted");
  assert.match(src, /amount_wrong/, "Must accept amount_wrong");
  assert.match(src, /skipped/, "Must accept skipped");
});

test("reject route returns 400 for invalid rejection_reason", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/reject/route.ts"),
    "utf8",
  );
  assert.match(src, /Invalid rejection_reason.*400/s, "Must return 400 for invalid reason");
});

test("reject route returns 400 for empty string rejection_reason", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/reject/route.ts"),
    "utf8",
  );
  // Must guard empty string
  assert.match(src, /rejection_reason\s*===\s*""/, "Must reject empty string reason");
});

test("reject route marks suggestion rejected with resolved metadata", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/reject/route.ts"),
    "utf8",
  );
  assert.match(src, /status.*rejected/, "Must set status to rejected");
  assert.match(src, /resolved_at/, "Must set resolved_at");
  assert.match(src, /resolved_by.*user/, "Must set resolved_by to user");
});

test("reject route does not write budget_categories.monthly_limit", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/reject/route.ts"),
    "utf8",
  );
  // Must not appear in an update payload context — safety comments mentioning it are fine
  assert.doesNotMatch(src, /\.update\([^)]*monthly_limit/, "Must not write monthly_limit in update");
  assert.doesNotMatch(src, /from\(["']budget_categories["']\)/, "Must not touch budget_categories table");
});

test("reject route does not write transactions or financial fields", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/reject/route.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /from\(["']transactions["']\)/i, "Must not query transactions");
  assert.doesNotMatch(src, /from\(["']financial_accounts["']\)/i, "Must not query accounts");
  assert.doesNotMatch(src, /from\(["']write_offs["']\)/i, "Must not query write_offs");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. GET /api/budget/suggestions — generation wiring
// ═══════════════════════════════════════════════════════════════════════════════

test("GET suggestions route imports generateAndStoreBudgetSuggestions", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/suggestions/route.ts"), "utf8");
  assert.match(src, /generateAndStoreBudgetSuggestions/, "Must import generation function");
  assert.match(src, /budgetSuggestionEngine/, "Must import from budgetSuggestionEngine");
});

test("GET suggestions route calls generation when flag is true", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/suggestions/route.ts"), "utf8");
  assert.match(
    src,
    /generateAndStoreBudgetSuggestions\s*\(\s*userId\s*,\s*supabase\s*\)/,
    "Must call generateAndStoreBudgetSuggestions(userId, supabase)",
  );
});

test("GET suggestions route still returns empty when flag is false", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/suggestions/route.ts"), "utf8");
  assert.match(src, /!BUDGET_AUTOMATION_ENABLED[\s\S]{0,100}suggestions.*\[\]/s, "Must return empty when flag false");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Rejected suggestions excluded from future generation (dedup)
// ═══════════════════════════════════════════════════════════════════════════════

test("budgetSuggestionEngine includes rejected status in dedup fetch", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/budget/budgetSuggestionEngine.ts"), "utf8");
  assert.match(src, /\.in\(["']status["'],\s*\[["']accepted["'],\s*["']rejected["']\]\)/, "Must fetch both accepted and rejected for dedup");
});

test("budgetSuggestionEngine dedup variable covers both accepted and rejected", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/budget/budgetSuggestionEngine.ts"), "utf8");
  // The resolved rows must be passed as the existingAcceptedCategories argument
  assert.match(src, /resolvedRows|existingResolved/, "Must use a resolved rows variable covering both statuses");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Budget page UI — suggestion cards
// ═══════════════════════════════════════════════════════════════════════════════

test("Budget page fetches from /api/budget/suggestions on load", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /\/api\/budget\/suggestions/, "Must fetch from budget suggestions endpoint");
});

test("Budget page declares BudgetSuggestion interface", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /interface BudgetSuggestion\s*\{/, "Must declare BudgetSuggestion interface");
  assert.match(src, /suggested_amount/, "BudgetSuggestion must include suggested_amount");
  assert.match(src, /avg_monthly_spend/, "BudgetSuggestion must include avg_monthly_spend");
  assert.match(src, /basis_months/, "BudgetSuggestion must include basis_months");
  assert.match(src, /confidence/, "BudgetSuggestion must include confidence");
  assert.match(src, /reason/, "BudgetSuggestion must include reason");
});

test("Budget page has accept handler that calls POST accept", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /\/api\/budget\/suggestions\/.*\/accept/, "Must call accept endpoint");
  assert.match(src, /method.*POST/s, "Accept must use POST");
});

test("Budget page has reject handler that calls POST reject", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /\/api\/budget\/suggestions\/.*\/reject/, "Must call reject endpoint");
});

test("Budget page sends rejection_reason in reject request body", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /rejection_reason/, "Must include rejection_reason in reject body");
  assert.match(src, /Content-Type.*application\/json/s, "Reject call must set Content-Type header");
});

test("Budget page has Not now dismiss that is local only (no API call)", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /dismissedIds/, "Must have local dismiss state");
  assert.match(src, /Not now/, "Must have Not now button");
  // Dismiss must not call accept or reject endpoint
  const notNowSection = src.match(/Not now[\s\S]{0,400}/)?.[0] ?? "";
  assert.doesNotMatch(notNowSection, /\/api\/budget\/suggestions\/.*\/(accept|reject)/, "Not now must not call API");
});

test("Budget page shows suggestions only when visibleSuggestions.length > 0", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /visibleSuggestions\.length\s*>\s*0/, "Must gate section on non-empty suggestions");
});

test("Budget page copy does not imply money movement", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /no money is moved/, "Must include disclaimer that no money is moved");
  assert.match(src, /transactions are not changed/, "Must state transactions are not changed");
  assert.match(src, /past spending/, "Must reference past spending as the basis");
});

test("Budget page renders suggested_amount in the suggestion card", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /sug\.suggested_amount/, "Must display suggested_amount");
});

test("Budget page renders reason from suggestion", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /sug\.reason/, "Must display reason text");
});

test("Budget page renders avg_monthly_spend and basis_months", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /sug\.avg_monthly_spend/, "Must display avg_monthly_spend");
  assert.match(src, /sug\.basis_months/, "Must display basis_months");
});

test("Budget page has reject reason picker with all three budget reasons", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /already_budgeted/, "Reject picker must include already_budgeted");
  assert.match(src, /amount_wrong/, "Reject picker must include amount_wrong");
  assert.match(src, /skipped/, "Reject picker must include skipped");
});

test("Budget page accept handler reloads budget categories after success", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  // After accept, loadData() must be called so the new monthly_limit appears in the tracker
  const acceptHandler = src.match(/handleAcceptSuggestion[\s\S]{0,600}/)?.[0] ?? "";
  assert.match(acceptHandler, /loadData\s*\(\s*\)/, "Must reload data after successful accept");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. No financial field writes anywhere in PR B code
// ═══════════════════════════════════════════════════════════════════════════════

test("accept route does not write transaction amount, direction, date, type, status", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /\.update\([^)]*["']amount["']/, "Must not write amount");
  assert.doesNotMatch(src, /\.update\([^)]*["']direction["']/, "Must not write direction");
  assert.doesNotMatch(src, /\.update\([^)]*["']transaction_date["']/, "Must not write transaction_date");
  assert.doesNotMatch(src, /\.update\([^)]*["']status["']/, "Must not write status");
});

test("reject route does not write transaction amount, direction, or status", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/reject/route.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /\.update\([^)]*["']amount["']/, "Must not write amount");
  assert.doesNotMatch(src, /\.update\([^)]*["']direction["']/, "Must not write direction");
});

test("GET suggestions route does not write transaction or balance fields", () => {
  const src = readFileSync(path.join(ROOT, "app/api/budget/suggestions/route.ts"), "utf8");
  assert.doesNotMatch(src, /from\(["']transactions["']\).*\.update\(/s, "Must not update transactions");
  assert.doesNotMatch(src, /from\(["']financial_accounts["']\)/i, "Must not query accounts");
});

test("apply_budget_suggestion migration does not reference income_subtype, direction, or provider", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000003_add_apply_budget_suggestion.sql"),
    "utf8",
  );
  assert.doesNotMatch(sql, /income_subtype/i, "Must not reference income_subtype");
  assert.doesNotMatch(sql, /provider\b/i, "Must not reference provider field");
  assert.doesNotMatch(sql, /external_transaction_id/i, "Must not reference external_transaction_id");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. No Tax Center, Write-Off, or deductible contamination
// ═══════════════════════════════════════════════════════════════════════════════

test("accept route does not reference Tax Center or Write-Off fields", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /tax_center|taxCenter/i);
  assert.doesNotMatch(src, /is_writeoff_candidate/i);
  assert.doesNotMatch(src, /deductible/i);
});

test("reject route does not reference Tax Center or Write-Off fields", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/reject/route.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /tax_center|taxCenter/i);
  assert.doesNotMatch(src, /is_writeoff_candidate/i);
  assert.doesNotMatch(src, /deductible/i);
});

test("apply_budget_suggestion migration does not reference write_offs or tax tables", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000003_add_apply_budget_suggestion.sql"),
    "utf8",
  );
  assert.doesNotMatch(sql, /write_offs/i, "Must not reference write_offs");
  assert.doesNotMatch(sql, /tax_center/i, "Must not reference tax_center");
  assert.doesNotMatch(sql, /deductible/i, "Must not reference deductible logic");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. No Total Cash, Net Worth, or Investment contamination
// ═══════════════════════════════════════════════════════════════════════════════

test("accept route does not reference net worth or total cash", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/budget/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /net_worth|netWorth|totalCash|total_cash/i);
  assert.doesNotMatch(src, /investments|trading|portfolio/i);
});

test("apply_budget_suggestion migration does not modify account balances", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260506000003_add_apply_budget_suggestion.sql"),
    "utf8",
  );
  assert.doesNotMatch(sql, /current_balance|available_balance|balance_amount/i, "Must not modify account balances");
  assert.doesNotMatch(sql, /financial_accounts/i, "Must not touch financial_accounts");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. PR B inline behavioral: rejection reason validation
// ═══════════════════════════════════════════════════════════════════════════════

// Inline the same valid-reasons set from the route for behavioral testing
const VALID_BUDGET_REJECTION_REASONS = new Set(["already_budgeted", "amount_wrong", "skipped"]);

test("valid rejection reasons: already_budgeted passes", () => {
  assert.ok(VALID_BUDGET_REJECTION_REASONS.has("already_budgeted"));
});

test("valid rejection reasons: amount_wrong passes", () => {
  assert.ok(VALID_BUDGET_REJECTION_REASONS.has("amount_wrong"));
});

test("valid rejection reasons: skipped passes", () => {
  assert.ok(VALID_BUDGET_REJECTION_REASONS.has("skipped"));
});

test("invalid rejection reasons: automation reason 'wrong_merchant' is rejected", () => {
  assert.equal(VALID_BUDGET_REJECTION_REASONS.has("wrong_merchant"), false, "Budget reasons must differ from automation reasons");
});

test("invalid rejection reasons: empty string is rejected", () => {
  assert.equal(VALID_BUDGET_REJECTION_REASONS.has(""), false);
});

test("invalid rejection reasons: unknown value is rejected", () => {
  assert.equal(VALID_BUDGET_REJECTION_REASONS.has("bad_reason"), false);
});

test("budget has exactly 3 valid rejection reasons", () => {
  assert.equal(VALID_BUDGET_REJECTION_REASONS.size, 3, "Must have exactly 3 valid budget rejection reasons");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 12. Regression: existing automation untouched
// ═══════════════════════════════════════════════════════════════════════════════

test("SENSITIVE_CATEGORIES unchanged (regression)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/constants.ts"), "utf8");
  assert.match(src, /SENSITIVE_CATEGORIES/, "SENSITIVE_CATEGORIES must still be present");
  assert.match(src, /"business"/, "SENSITIVE_CATEGORIES must still contain business");
});

test("NON_AUTOMATABLE_TX_FIELDS unchanged (regression)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/constants.ts"), "utf8");
  assert.match(src, /NON_AUTOMATABLE_TX_FIELDS/, "NON_AUTOMATABLE_TX_FIELDS must still be present");
  assert.match(src, /income_subtype/, "Must still protect income_subtype");
  assert.match(src, /direction/, "Must still protect direction");
  assert.match(src, /amount/, "Must still protect amount");
});

test("WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED unchanged (regression)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/constants.ts"), "utf8");
  assert.match(src, /WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED\s*=\s*true/, "Write-off flag must remain true");
});

test("BUSINESS_EXPENSE_SUGGESTIONS_ENABLED unchanged (regression)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/automation/constants.ts"), "utf8");
  assert.match(src, /BUSINESS_EXPENSE_SUGGESTIONS_ENABLED\s*=\s*true/, "Business flag must remain true");
});

test("automation accept route untouched (regression)", () => {
  assert.ok(existsSync(path.join(ROOT, "app/api/automation/suggestions/[id]/accept/route.ts")));
  const src = readFileSync(path.join(ROOT, "app/api/automation/suggestions/[id]/accept/route.ts"), "utf8");
  assert.match(src, /apply_automation_suggestion/, "apply_automation_suggestion RPC must still be called");
});

test("writeOffSuggestionEngine untouched (regression)", () => {
  assert.ok(existsSync(path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts")));
});

test("spendingSummaryEngine.ts is still a pure function (no DB calls added)", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/budget/spendingSummaryEngine.ts"), "utf8");
  assert.doesNotMatch(src, /supabase|createClient|from\(/, "spendingSummaryEngine must remain pure");
});

test("budget PR A tests still run: spendingSummaryEngine file exists", () => {
  assert.ok(existsSync(path.join(ROOT, "src/lib/budget/spendingSummaryEngine.ts")));
});

test("budget PR A tests still run: budget_suggestions migration exists", () => {
  assert.ok(existsSync(path.join(ROOT, "supabase/migrations/20260506000001_add_budget_suggestions.sql")));
});

// ═══════════════════════════════════════════════════════════════════════════════
// 13. Error feedback: accept/reject/load failures are surfaced to the user
// ═══════════════════════════════════════════════════════════════════════════════

test("Budget page declares suggestionLoadError state", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /suggestionLoadError/, "Must declare suggestionLoadError state");
  assert.match(src, /setSuggestionLoadError/, "Must have setter for suggestionLoadError");
});

test("Budget page declares suggestionActionError state", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /suggestionActionError/, "Must declare suggestionActionError state");
  assert.match(src, /setSuggestionActionError/, "Must have setter for suggestionActionError");
});

test("Budget page sets suggestionLoadError when suggestion fetch fails", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /setSuggestionLoadError\s*\(["']/, "Must call setSuggestionLoadError with error message on fetch failure");
});

test("Budget page clears suggestionLoadError on successful suggestion fetch", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /setSuggestionLoadError\s*\(\s*null\s*\)/, "Must clear suggestionLoadError to null on success");
});

test("Budget page accept handler sets suggestionActionError on failure", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  const acceptHandler = src.match(/handleAcceptSuggestion[\s\S]{0,900}/)?.[0] ?? "";
  assert.match(acceptHandler, /setSuggestionActionError/, "Accept handler must call setSuggestionActionError on failure");
});

test("Budget page reject handler sets suggestionActionError on failure", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  const rejectHandler = src.match(/handleRejectSuggestion[\s\S]{0,900}/)?.[0] ?? "";
  assert.match(rejectHandler, /setSuggestionActionError/, "Reject handler must call setSuggestionActionError on failure");
});

test("Budget page renders suggestionLoadError in suggestion section", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  const suggestionSection = src.match(/BUDGET SUGGESTIONS[\s\S]{0,2500}/)?.[0] ?? "";
  assert.match(suggestionSection, /suggestionLoadError/, "Suggestion section must reference suggestionLoadError for conditional rendering");
  // User-facing load error message is in the JSX render path (may be beyond the slice — check whole file)
  assert.match(src, /Could not load/, "Must include a user-facing load error message");
});

test("Budget page renders suggestionActionError in suggestion section", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  const suggestionSection = src.match(/BUDGET SUGGESTIONS[\s\S]{0,2500}/)?.[0] ?? "";
  assert.match(suggestionSection, /suggestionActionError/, "Suggestion section must render suggestionActionError");
});

test("Budget page renders suggestionActionError in reject modal", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  const rejectModal = src.match(/REJECT SUGGESTION MODAL[\s\S]{0,2000}/)?.[0] ?? "";
  assert.match(rejectModal, /suggestionActionError/, "Reject modal must render suggestionActionError");
});

test("Budget page suggestion section shows when suggestionLoadError is set (not just on card count)", () => {
  const src = readFileSync(path.join(ROOT, "app/dashboard/budget/page.tsx"), "utf8");
  assert.match(src, /visibleSuggestions\.length\s*>\s*0\s*\|\|.*suggestionLoadError/, "Suggestion section must render when load error is set, regardless of card count");
});

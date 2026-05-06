/**
 * Transaction sync visibility fix — structural tests.
 *
 * These tests verify that the fixes applied in fix/transaction-sync-visibility
 * are present and correct in source code and migration files.
 * They do not require a database or Supabase connection.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const PROCESS_REFRESH = path.resolve(
  "supabase/functions/process-refresh-job/index.ts"
);
const ORCHESTRATE_REFRESH = path.resolve(
  "supabase/functions/orchestrate-refresh/index.ts"
);
const PLAID_CONNECT_BUTTON = path.resolve(
  "app/components/PlaidConnectButton.tsx"
);
const REPAIR_MIGRATION = path.resolve(
  "supabase/migrations/20260506000005_repair_reactivated_account_deleted_at.sql"
);
const CANONICAL = path.resolve("src/lib/canonicalFinancialData.ts");

const src = fs.readFileSync(PROCESS_REFRESH, "utf8");
const orchestrateSrc = fs.readFileSync(ORCHESTRATE_REFRESH, "utf8");
const plaidBtnSrc = fs.readFileSync(PLAID_CONNECT_BUTTON, "utf8");
const migrationSrc = fs.readFileSync(REPAIR_MIGRATION, "utf8");
const canonicalSrc = fs.readFileSync(CANONICAL, "utf8");

// ─── 1. upsertFinancialAccount: deleted_at cleared on reactivation ────────────

test("upsertFinancialAccount: accountData includes deleted_at: null", () => {
  assert.match(
    src,
    /deleted_at\s*:\s*null/,
    "accountData must explicitly set deleted_at: null to clear stale soft-delete on reactivation"
  );
});

test("upsertFinancialAccount: deleted_at: null appears inside accountData block (before institution_name)", () => {
  const acctDataIdx = src.indexOf("const accountData = {");
  const institutionIdx = src.indexOf("institution_name:", acctDataIdx);
  const deletedAtIdx = src.indexOf("deleted_at:", acctDataIdx);
  assert.ok(acctDataIdx !== -1, "accountData block must exist");
  assert.ok(deletedAtIdx !== -1, "deleted_at: null must be in accountData");
  assert.ok(
    deletedAtIdx < institutionIdx,
    "deleted_at must appear in accountData before institution_name"
  );
});

test("upsertFinancialAccount: is_active: true is also set in accountData", () => {
  const acctDataIdx = src.indexOf("const accountData = {");
  const closingIdx = src.indexOf("}", acctDataIdx + 100);
  const block = src.slice(acctDataIdx, src.indexOf("if (existing)", acctDataIdx));
  assert.match(block, /is_active\s*:\s*true/, "accountData must set is_active: true");
});

// ─── 2. upsertTransaction: returns status strings ─────────────────────────────

test("upsertTransaction: returns 'inserted' on new row", () => {
  assert.match(src, /return "inserted"/, "upsertTransaction must return 'inserted' after insert");
});

test("upsertTransaction: returns 'updated' on existing row status update", () => {
  assert.match(src, /return "updated"/, "upsertTransaction must return 'updated' when updating existing row");
});

test("upsertTransaction: returns 'skipped' on fingerprint duplicate", () => {
  assert.match(src, /return "skipped"/, "upsertTransaction must return 'skipped' on duplicate");
});

test("upsertTransaction: return type annotation includes all three values", () => {
  assert.match(
    src,
    /Promise<"inserted" \| "updated" \| "skipped">/,
    "upsertTransaction must have explicit return type"
  );
});

// ─── 3. Transaction insert isolation ─────────────────────────────────────────

test("syncIntegrations: transaction loop wraps upsertTransaction in try/catch", () => {
  const loopRegion = src.slice(src.indexOf("for (const tx of allTransactions)"));
  assert.match(
    loopRegion,
    /try\s*\{/,
    "transaction loop must wrap each upsertTransaction call in try/catch"
  );
  assert.match(
    loopRegion,
    /catch\s*\(/,
    "transaction loop must have a catch block"
  );
});

test("syncIntegrations: tracks transactionsFailed count", () => {
  assert.match(src, /transactionsFailed/, "sync must track failed transaction count");
});

test("syncIntegrations: logs failed transaction with external_id (anonymized)", () => {
  assert.match(
    src,
    /console\.error.*external_id/,
    "failed transaction must be logged with external_id, not user-specific content"
  );
});

test("syncIntegrations: one failure does not abort remaining transactions", () => {
  const loopRegion = src.slice(src.indexOf("for (const tx of allTransactions)"));
  // The catch must NOT re-throw — it only increments transactionsFailed
  const catchBlock = loopRegion.slice(
    loopRegion.indexOf("catch ("),
    loopRegion.indexOf("}", loopRegion.indexOf("catch (")) + 1
  );
  assert.doesNotMatch(
    catchBlock,
    /\bthrow\b/,
    "catch block inside transaction loop must not re-throw — one failure must not abort others"
  );
});

test("syncIntegrations: skipped duplicates do not increment transactionsSynced", () => {
  const loopRegion = src.slice(src.indexOf("for (const tx of allTransactions)"));
  assert.match(
    loopRegion,
    /result !== "skipped"/,
    "synced count must exclude skipped (duplicate) transactions"
  );
});

test("syncIntegrations: sync_status is error only when ALL transactions failed", () => {
  assert.match(
    src,
    /allFailed/,
    "sync must distinguish all-failed from partial-failed"
  );
  assert.match(
    src,
    /transactionsFailed > 0 && transactionsSynced === 0/,
    "allFailed condition must require both transactionsFailed > 0 and transactionsSynced === 0"
  );
});

test("syncIntegrations: error message records both failed and succeeded counts", () => {
  assert.match(
    src,
    /transactionsFailed.*succeeded|succeeded.*transactionsFailed/,
    "sync error message must report both failed and succeeded counts"
  );
});

// ─── 4. Plaid pagination ──────────────────────────────────────────────────────

test("syncIntegrations: pagination loop uses allTransactions accumulator", () => {
  assert.match(src, /allTransactions/, "pagination must accumulate into allTransactions array");
});

test("syncIntegrations: pagination has safety cap (MAX_PAGES)", () => {
  assert.match(src, /MAX_PAGES/, "pagination must have a safety cap constant");
});

test("syncIntegrations: MAX_PAGES is 5 (2500 transaction cap)", () => {
  assert.match(src, /MAX_PAGES\s*=\s*5/, "safety cap must be 5 pages");
});

test("syncIntegrations: pagination uses fetchOffset to advance pages", () => {
  assert.match(src, /fetchOffset/, "pagination must use an offset variable to advance pages");
});

test("syncIntegrations: pagination breaks on short page (last page detection)", () => {
  assert.match(
    src,
    /page\.length < PAGE_SIZE/,
    "pagination must break when Plaid returns fewer rows than requested (last page)"
  );
});

test("syncIntegrations: pagination reads total_transactions from Plaid response", () => {
  assert.match(
    src,
    /total_transactions/,
    "pagination must read total_transactions from Plaid response to know when to stop"
  );
});

// ─── 5. CORS: orchestrate-refresh ────────────────────────────────────────────

test("orchestrate-refresh: does not use wildcard Access-Control-Allow-Origin", () => {
  assert.doesNotMatch(
    orchestrateSrc,
    /"Access-Control-Allow-Origin"\s*:\s*"\*"/,
    "orchestrate-refresh must not use wildcard CORS origin"
  );
});

test("orchestrate-refresh: ADDITIONAL_ALLOWED_ORIGIN env var is supported", () => {
  assert.match(
    orchestrateSrc,
    /ADDITIONAL_ALLOWED_ORIGIN/,
    "orchestrate-refresh must support ADDITIONAL_ALLOWED_ORIGIN env var for staging/preview"
  );
});

test("orchestrate-refresh: production origin is always in allowed set", () => {
  assert.match(
    orchestrateSrc,
    /finopsfinancialcenter\.vercel\.app/,
    "production origin must always be allowed"
  );
});

test("orchestrate-refresh: uses dynamic corsHeaders function, not static constant", () => {
  assert.match(
    orchestrateSrc,
    /function corsHeaders/,
    "CORS headers must be generated by a function that reads the request origin"
  );
  assert.doesNotMatch(
    orchestrateSrc,
    /const CORS_HEADERS\s*=/,
    "static CORS_HEADERS constant must be removed"
  );
});

// ─── 6. PlaidConnectButton: honest UI copy ───────────────────────────────────

test("PlaidConnectButton: success message does not falsely claim auto-sync", () => {
  assert.doesNotMatch(
    plaidBtnSrc,
    /will sync shortly/,
    "success message must not claim transactions will sync automatically"
  );
});

test("PlaidConnectButton: success message directs user to Connections + Sync Now", () => {
  assert.match(
    plaidBtnSrc,
    /Connections/,
    "success message must reference the Connections page"
  );
  assert.match(
    plaidBtnSrc,
    /Sync Now/,
    "success message must tell user to click Sync Now"
  );
});

// ─── 7. Repair migration ─────────────────────────────────────────────────────

test("repair migration: file exists", () => {
  assert.ok(
    fs.existsSync(REPAIR_MIGRATION),
    "repair migration file must exist"
  );
});

test("repair migration: only clears deleted_at and updated_at", () => {
  assert.match(migrationSrc, /deleted_at\s*=\s*NULL/, "migration must clear deleted_at");
  assert.match(migrationSrc, /updated_at\s*=\s*now\(\)/, "migration must set updated_at");
  // Extract non-comment lines to check the actual SQL, not the documentation comments.
  const sqlLines = migrationSrc
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n");
  assert.doesNotMatch(
    sqlLines,
    /UPDATE.*transactions/i,
    "repair migration SQL must not update the transactions table"
  );
  assert.doesNotMatch(
    sqlLines,
    /SET.*amount|SET.*balance|SET.*direction|SET.*currency/i,
    "repair migration SQL SET clause must not touch financial fields"
  );
});

test("repair migration: only targets is_active = true accounts", () => {
  assert.match(
    migrationSrc,
    /is_active\s*=\s*true/,
    "migration must only target accounts already marked is_active = true"
  );
});

test("repair migration: only targets accounts linked to active connections", () => {
  assert.match(
    migrationSrc,
    /ic\.status\s*=\s*'active'/,
    "migration must check that the linked integration_connection is active"
  );
});

test("repair migration: is idempotent (safe to re-run)", () => {
  assert.match(
    migrationSrc,
    /deleted_at IS NOT NULL/,
    "WHERE clause must filter by deleted_at IS NOT NULL, making the migration idempotent"
  );
});

// ─── 8. Canonical read path: unchanged ───────────────────────────────────────

test("canonicalFinancialData: still filters transactions.deleted_at IS NULL", () => {
  assert.match(
    canonicalSrc,
    /\.is\("deleted_at",\s*null\)/,
    "canonical query must still filter deleted_at IS NULL on transactions"
  );
});

test("canonicalFinancialData: still filters financial_accounts.deleted_at IS NULL", () => {
  assert.match(
    canonicalSrc,
    /\.is\("financial_accounts\.deleted_at",\s*null\)/,
    "canonical query must still filter financial_accounts.deleted_at IS NULL"
  );
});

test("canonicalFinancialData: still uses !inner join on financial_accounts", () => {
  assert.match(
    canonicalSrc,
    /financial_accounts!inner/,
    "canonical query must still use !inner join to exclude orphaned transactions"
  );
});

// ─── 9. No automation impact ──────────────────────────────────────────────────

test("process-refresh-job: does not reference automation_rules or automation_suggestions", () => {
  assert.doesNotMatch(
    src,
    /automation_rules|automation_suggestions/,
    "process-refresh-job must not touch automation tables"
  );
});

test("process-refresh-job: does not reference budget_categories or budget_suggestions", () => {
  assert.doesNotMatch(
    src,
    /budget_categories|budget_suggestions/,
    "process-refresh-job must not touch budget tables"
  );
});

test("process-refresh-job: transaction insert sets is_business_candidate and is_writeoff_candidate only via null default", () => {
  assert.doesNotMatch(
    src,
    /is_business_candidate|is_writeoff_candidate/,
    "upsertTransaction must not explicitly set is_business_candidate or is_writeoff_candidate — they default to NULL"
  );
});

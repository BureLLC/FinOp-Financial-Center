/**
 * Plaid Sync Orchestration — Stuck-Job Gate Tests
 *
 * Verifies that orchestrate-refresh correctly handles stale "processing" jobs
 * that were killed by an edge-function timeout without reaching their own
 * catch block, which would otherwise permanently block future syncs.
 *
 * All assertions are source-file only — no DB calls.
 *
 * Run with: node --test tests/automation/plaid-sync-orchestration.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const ORCHESTRATE_SRC = readFileSync(
  path.join(ROOT, "supabase/functions/orchestrate-refresh/index.ts"),
  "utf8",
);
const WORKER_SRC = readFileSync(
  path.join(ROOT, "supabase/functions/process-refresh-job/index.ts"),
  "utf8",
);

// ═══════════════════════════════════════════════════════════════════════════
// 1. Stale-job detection — orchestrate-refresh must read status + started_at
// ═══════════════════════════════════════════════════════════════════════════

test("orchestrate-refresh selects status and started_at from existing job query", () => {
  assert.match(ORCHESTRATE_SRC, /\.select\(["'`]id,\s*status,\s*started_at["'`]\)/,
    "existing job query must select status and started_at so stale detection can inspect them");
});

test("orchestrate-refresh checks existingJob.status === 'processing' for stale detection", () => {
  assert.match(ORCHESTRATE_SRC, /existingJob\.status\s*===\s*["'`]processing["'`]/,
    "stale-job check must gate on status === 'processing' — queued jobs are not stale");
});

test("orchestrate-refresh checks existingJob.started_at for stale detection", () => {
  assert.match(ORCHESTRATE_SRC, /existingJob\.started_at/,
    "stale-job check must read started_at to compute job age");
});

test("orchestrate-refresh computes job age from started_at", () => {
  assert.match(ORCHESTRATE_SRC, /new Date\(existingJob\.started_at\)\.getTime\(\)/,
    "stale-job check must convert started_at to a timestamp to compare against Date.now()");
});

test("orchestrate-refresh uses a time threshold to identify stale jobs", () => {
  assert.match(ORCHESTRATE_SRC, /\d+\s*\*\s*60\s*\*\s*1000/,
    "stale-job threshold must be expressed in minutes (N * 60 * 1000)");
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Stale-job reset — must mark the job failed before creating a new one
// ═══════════════════════════════════════════════════════════════════════════

test("orchestrate-refresh resets stale job to status 'failed'", () => {
  assert.match(ORCHESTRATE_SRC, /status:\s*["'`]failed["'`]/,
    "stale processing jobs must be marked failed so they no longer block new jobs");
});

test("orchestrate-refresh sets error_message on stale job reset", () => {
  assert.match(ORCHESTRATE_SRC, /error_message:\s*["'`][^"'`]+timed out[^"'`]*["'`]/i,
    "stale job reset must include a human-readable error_message describing the timeout");
});

test("orchestrate-refresh sets completed_at on stale job reset", () => {
  assert.match(ORCHESTRATE_SRC, /completed_at:\s*new Date\(\)\.toISOString\(\)/,
    "stale job reset must set completed_at to close the job record cleanly");
});

test("orchestrate-refresh does not return early after stale job reset (falls through to new job)", () => {
  // After reset, orchestrate-refresh must NOT return "already_processing" —
  // it must continue to the new-job creation path.
  const staleBlock = ORCHESTRATE_SRC.match(/isStale[\s\S]{0,600}?Fall through to create/);
  assert.ok(staleBlock, "stale reset block must include a comment indicating fall-through to new job creation");
  assert.doesNotMatch(staleBlock[0], /return json\(\{[\s\S]*?already_processing/,
    "stale reset path must not return 'already_processing' — it must fall through");
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Non-stale path preserved — fresh processing jobs still short-circuit
// ═══════════════════════════════════════════════════════════════════════════

test("orchestrate-refresh still returns already_processing for non-stale jobs", () => {
  assert.match(ORCHESTRATE_SRC, /already_processing/,
    "non-stale in-flight jobs must still return already_processing to avoid duplicate syncs");
});

test("orchestrate-refresh re-triggers worker for non-stale processing jobs", () => {
  // The worker nudge for genuinely in-flight jobs must still exist in the else branch
  const elseBranch = ORCHESTRATE_SRC.match(/} else \{[\s\S]{0,600}?already_processing/);
  assert.ok(elseBranch, "non-stale else branch must exist and contain already_processing logic");
  assert.match(elseBranch[0], /process-refresh-job/,
    "non-stale else branch must still invoke process-refresh-job worker");
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Worker guard — process-refresh-job rejects non-queued jobs
// ═══════════════════════════════════════════════════════════════════════════

test("process-refresh-job rejects jobs not in queued state", () => {
  assert.match(WORKER_SRC, /job\.status\s*!==\s*["'`]queued["'`]/,
    "worker must check job.status === 'queued' — this is why stale processing jobs silently blocked syncs");
});

test("process-refresh-job returns 400 for non-queued jobs", () => {
  const guardBlock = WORKER_SRC.match(/job\.status\s*!==\s*["'`]queued["'`][\s\S]{0,100}?400/);
  assert.ok(guardBlock,
    "worker must return 400 when job is not queued — confirms why stuck-in-processing jobs need the orchestrator reset");
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. syncIntegrations source filter — active-only, no sync_status filter
// ═══════════════════════════════════════════════════════════════════════════

test("syncIntegrations queries only status=active connections", () => {
  assert.match(WORKER_SRC, /\.eq\(["'`]status["'`],\s*["'`]active["'`]\)/,
    "syncIntegrations must only process active connections — inactive/disconnected are correctly excluded");
});

test("syncIntegrations does not filter by sync_status (unsynced connections are included)", () => {
  // sync_status=never connections should still be synced when status=active
  const syncIntegrationsBody = WORKER_SRC.match(/async function syncIntegrations[\s\S]{0,500}?\.eq\("provider"/);
  assert.ok(syncIntegrationsBody, "syncIntegrations function must exist");
  assert.doesNotMatch(syncIntegrationsBody[0], /\.eq\(["'`]sync_status["'`]/,
    "syncIntegrations must not filter by sync_status — an unsynced (sync_status=never) but active connection must be re-syncable");
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. Token storage — access_token_encrypted is used directly (not decrypted)
// ═══════════════════════════════════════════════════════════════════════════

test("syncIntegrations passes access_token_encrypted directly to Plaid (no decryption step)", () => {
  assert.match(WORKER_SRC, /access_token:\s*connection\.access_token_encrypted/,
    "Plaid access token is stored as plaintext in access_token_encrypted — must be used directly without decryption");
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. Disconnect does not block re-connection (plaid-exchange-token handles it)
// ═══════════════════════════════════════════════════════════════════════════

test("orchestrate-refresh user isolation: extracts userId from JWT, not request body", () => {
  assert.match(ORCHESTRATE_SRC, /user\.id/,
    "orchestrate-refresh must derive userId from the authenticated JWT, not from caller-supplied connectionId");
  assert.match(ORCHESTRATE_SRC, /\.auth\.getUser/,
    "orchestrate-refresh must verify JWT via getUser before any DB operation");
});

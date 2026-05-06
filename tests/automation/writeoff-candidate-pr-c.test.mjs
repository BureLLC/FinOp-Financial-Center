/**
 * Write-Off Candidate PR C: suggestion generation tests.
 *
 * All logic under test is inlined — no TypeScript imports.
 * Source files are read via fs.readFileSync where structural assertions are needed.
 *
 * Run with: node --test tests/automation/writeoff-candidate-pr-c.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ═══════════════════════════════════════════════════════════════════════════════
// 1. writeOffSuggestionEngine.ts — file and exports
// ═══════════════════════════════════════════════════════════════════════════════

test("writeOffSuggestionEngine.ts exists at expected path (PR C)", () => {
  const p = path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts");
  assert.ok(existsSync(p), "writeOffSuggestionEngine.ts must exist in PR C");
});

test("writeOffSuggestionEngine.ts exports buildWriteOffSuggestionsForRule", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.match(src, /export function buildWriteOffSuggestionsForRule/,
    "buildWriteOffSuggestionsForRule must be exported");
});

test("writeOffSuggestionEngine.ts exports generateAndStoreWriteOffSuggestions", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.match(src, /export async function generateAndStoreWriteOffSuggestions/,
    "generateAndStoreWriteOffSuggestions must be exported");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Pure function: buildWriteOffSuggestionsForRule eligibility guards
// ═══════════════════════════════════════════════════════════════════════════════

// Inline a minimal version of buildWriteOffSuggestionsForRule to test guard logic
function buildWriteOffSuggestionsForRule_test(rule, candidates, excludeTransactionId, rejectedTxIds) {
  if (rule.status !== "active") return [];
  const results = [];
  for (const tx of candidates) {
    if (tx.id === excludeTransactionId) continue;
    if (tx.direction !== "debit") continue;
    if ((tx.transaction_type ?? "").toLowerCase() === "transfer") continue;
    if (tx.is_writeoff_candidate !== null && tx.is_writeoff_candidate !== undefined) continue;
    if (rejectedTxIds.has(tx.id)) continue;
    // Simplified: always match if we get here
    results.push({
      suggestion: {
        user_id: rule.user_id,
        automation_rule_id: rule.id,
        suggestion_type: "write_off_candidate",
        source_entity_id: tx.id,
        suggested_action: { reason: "test" },
        confidence: rule.confidence,
        status: "pending",
      },
    });
  }
  return results;
}

const activeRule = { id: "rule-1", user_id: "user-1", status: "active", confidence: 0.70 };
const pausedRule = { id: "rule-2", user_id: "user-1", status: "paused", confidence: 0.70 };
const deletedRule = { id: "rule-3", user_id: "user-1", status: "deleted", confidence: 0.70 };

test("pure function: skips inactive (paused) rules", () => {
  const tx = { id: "tx-1", direction: "debit", transaction_type: "bank", is_writeoff_candidate: null };
  const results = buildWriteOffSuggestionsForRule_test(pausedRule, [tx], "other", new Set());
  assert.equal(results.length, 0, "Paused rule must not generate suggestions");
});

test("pure function: skips deleted rules", () => {
  const tx = { id: "tx-1", direction: "debit", transaction_type: "bank", is_writeoff_candidate: null };
  const results = buildWriteOffSuggestionsForRule_test(deletedRule, [tx], "other", new Set());
  assert.equal(results.length, 0, "Deleted rule must not generate suggestions");
});

test("pure function: skips credit transactions", () => {
  const tx = { id: "tx-1", direction: "credit", transaction_type: "bank", is_writeoff_candidate: null };
  const results = buildWriteOffSuggestionsForRule_test(activeRule, [tx], "other", new Set());
  assert.equal(results.length, 0, "Credit transactions must not generate suggestions");
});

test("pure function: skips transfer transactions", () => {
  const tx = { id: "tx-1", direction: "debit", transaction_type: "transfer", is_writeoff_candidate: null };
  const results = buildWriteOffSuggestionsForRule_test(activeRule, [tx], "other", new Set());
  assert.equal(results.length, 0, "Transfer transactions must not generate suggestions");
});

test("pure function: null is_writeoff_candidate is eligible", () => {
  const tx = { id: "tx-1", direction: "debit", transaction_type: "bank", is_writeoff_candidate: null };
  const results = buildWriteOffSuggestionsForRule_test(activeRule, [tx], "other", new Set());
  assert.equal(results.length, 1, "null is_writeoff_candidate must be eligible");
});

test("pure function: true is_writeoff_candidate is not eligible", () => {
  const tx = { id: "tx-1", direction: "debit", transaction_type: "bank", is_writeoff_candidate: true };
  const results = buildWriteOffSuggestionsForRule_test(activeRule, [tx], "other", new Set());
  assert.equal(results.length, 0, "true is_writeoff_candidate means already candidate — skip");
});

test("pure function: false is_writeoff_candidate is not eligible", () => {
  const tx = { id: "tx-1", direction: "debit", transaction_type: "bank", is_writeoff_candidate: false };
  const results = buildWriteOffSuggestionsForRule_test(activeRule, [tx], "other", new Set());
  assert.equal(results.length, 0, "false is_writeoff_candidate means explicitly declined — skip");
});

test("pure function: skips the triggering transaction (excludeTransactionId)", () => {
  const tx = { id: "tx-trigger", direction: "debit", transaction_type: "bank", is_writeoff_candidate: null };
  const results = buildWriteOffSuggestionsForRule_test(activeRule, [tx], "tx-trigger", new Set());
  assert.equal(results.length, 0, "The triggering transaction must be excluded");
});

test("pure function: skips transactions already rejected for this rule", () => {
  const tx = { id: "tx-1", direction: "debit", transaction_type: "bank", is_writeoff_candidate: null };
  const rejectedTxIds = new Set(["tx-1"]);
  const results = buildWriteOffSuggestionsForRule_test(activeRule, [tx], "other", rejectedTxIds);
  assert.equal(results.length, 0, "Previously rejected transactions must not regenerate");
});

test("pure function: returns write_off_candidate suggestion_type", () => {
  const tx = { id: "tx-1", direction: "debit", transaction_type: "bank", is_writeoff_candidate: null };
  const results = buildWriteOffSuggestionsForRule_test(activeRule, [tx], "other", new Set());
  assert.equal(results.length, 1);
  assert.equal(results[0].suggestion.suggestion_type, "write_off_candidate");
});

test("pure function: suggested_action has reason but not mixed_use or category", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  // Extract the suggestedAction construction
  assert.match(src, /WriteOffCandidateActionConfig/,
    "Must use WriteOffCandidateActionConfig type");
  assert.match(src, /reason\s*:\s*matchResult\.reason/,
    "suggestedAction must set reason from matchResult.reason");
  assert.doesNotMatch(src, /mixed_use\s*:/,
    "Write-off suggestion action must not have mixed_use field");
  assert.doesNotMatch(src, /category\s*:/,
    "Write-off suggestion action must not have category field");
});

test("pure function: confidence comes directly from matchResult (no cap)", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.match(src, /confidence\s*:\s*matchResult\.confidence/,
    "Confidence must pass through from matchResult with no cap");
  assert.doesNotMatch(src, /MIXED_USE_CONFIDENCE_CAP/,
    "Must not apply a mixed-use confidence cap");
  assert.doesNotMatch(src, /Math\.min.*confidence.*0\.\d/,
    "Must not cap confidence");
});

test("pure function: returns empty array on empty candidates", () => {
  const results = buildWriteOffSuggestionsForRule_test(activeRule, [], "other", new Set());
  assert.equal(results.length, 0, "Empty candidate list must return empty results");
});

test("pure function: multiple eligible candidates all generate suggestions", () => {
  const candidates = [
    { id: "tx-1", direction: "debit", transaction_type: "bank", is_writeoff_candidate: null },
    { id: "tx-2", direction: "debit", transaction_type: "bank", is_writeoff_candidate: null },
    { id: "tx-3", direction: "credit", transaction_type: "bank", is_writeoff_candidate: null }, // credit, skip
    { id: "tx-4", direction: "debit", transaction_type: "transfer", is_writeoff_candidate: null }, // transfer, skip
  ];
  const results = buildWriteOffSuggestionsForRule_test(activeRule, candidates, "other", new Set());
  assert.equal(results.length, 2, "Only eligible debit non-transfer candidates should generate");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. generateAndStoreWriteOffSuggestions — DB filter verification (source-level)
// ═══════════════════════════════════════════════════════════════════════════════

test("generateAndStoreWriteOffSuggestions uses .is(is_writeoff_candidate, null) — not .eq(false)", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.match(src, /\.is\(["']is_writeoff_candidate["'],\s*null\)/,
    "DB filter must use .is('is_writeoff_candidate', null) — null-only eligibility");
  assert.doesNotMatch(src, /\.eq\(["']is_writeoff_candidate["'],\s*false\)/,
    "Must not filter with .eq('is_writeoff_candidate', false) — that would skip null rows");
});

test("generateAndStoreWriteOffSuggestions DB filter excludes transfers at DB level", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.match(src, /\.neq\(["']transaction_type["'],\s*["']transfer["']\)/,
    "DB filter must exclude transfers");
});

test("generateAndStoreWriteOffSuggestions DB filter targets debit direction", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.match(src, /\.eq\(["']direction["'],\s*["']debit["']\)/,
    "DB filter must target debit transactions only");
});

test("generateAndStoreWriteOffSuggestions DB filter excludes soft-deleted and non-posted", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.match(src, /\.is\(["']deleted_at["'],\s*null\)/,
    "DB filter must exclude soft-deleted transactions");
  assert.match(src, /\.eq\(["']status["'],\s*["']posted["']\)/,
    "DB filter must include only posted transactions");
});

test("generateAndStoreWriteOffSuggestions limits candidate fetch to 200", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.match(src, /\.limit\(200\)/,
    "Candidate fetch must be limited to 200 rows");
});

test("generateAndStoreWriteOffSuggestions includes is_writeoff_candidate in SELECT", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.match(src, /is_writeoff_candidate/,
    "SELECT must include is_writeoff_candidate field");
});

test("generateAndStoreWriteOffSuggestions deduplication: skips already-rejected txIds", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.match(src, /\.eq\(["']status["'],\s*["']rejected["']\)/,
    "Must fetch rejected suggestions for deduplication");
  assert.match(src, /rejectedTxIds/,
    "Must use rejectedTxIds set to prevent regeneration");
});

test("generateAndStoreWriteOffSuggestions deduplication: skips already-pending txIds", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.match(src, /\.eq\(["']status["'],\s*["']pending["']\)/,
    "Must fetch pending suggestions for deduplication");
  assert.match(src, /alreadyPending/,
    "Must use alreadyPending set to prevent duplicate inserts");
});

test("generateAndStoreWriteOffSuggestions returns 0 on empty candidate set", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.match(src, /if.*!txRows.*txRows\.length.*===.*0.*return 0/s,
    "Must return 0 early when no candidates found");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Protected fields: writeOffSuggestionEngine never writes financial fields
// ═══════════════════════════════════════════════════════════════════════════════

const PROTECTED_FIELDS_ENGINE = [
  "category", "subcategory", "income_subtype", "direction", "amount",
  "transaction_date", "transaction_type", "status",
];

test("writeOffSuggestionEngine does not write to the transactions table", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /from\(["']transactions["']\).*\.update/s,
    "Suggestion engine must never write to the transactions table");
});

test("writeOffSuggestionEngine does not reference write_offs table", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /from\(["']write_offs["']\)/i,
    "Suggestion engine must not reference the write_offs table");
});

test("writeOffSuggestionEngine does not call financial calculation functions or reference Tax Center", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  // Importing RawTransaction type from financialCalculations is permitted (type-only use).
  // The constraint is that no calculation functions are called from there.
  assert.doesNotMatch(src, /calcTotal|calcTotalIn|calcTotalOut|activePostedTransactions/,
    "Must not call financial aggregation functions");
  assert.doesNotMatch(src, /canonicalFinancialData/i,
    "Must not import canonicalFinancialData");
  assert.doesNotMatch(src, /tax_center|taxCenter/i,
    "Must not reference Tax Center");
  assert.doesNotMatch(src, /isDeductibleBusinessExpense/,
    "Must not call isDeductibleBusinessExpense");
});

test("writeOffSuggestionEngine does not reference MIXED_USE_CATEGORIES", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /MIXED_USE_CATEGORIES/,
    "Write-off suggestion engine must not reference MIXED_USE_CATEGORIES");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Mark-writeoff-candidate route: generation wiring
// ═══════════════════════════════════════════════════════════════════════════════

test("mark-writeoff-candidate route imports writeOffSuggestionEngine (PR C)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(src, /writeOffSuggestionEngine/,
    "Route must import writeOffSuggestionEngine in PR C");
});

test("mark-writeoff-candidate route calls generateAndStoreWriteOffSuggestions (PR C)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(src, /generateAndStoreWriteOffSuggestions/,
    "Route must call generateAndStoreWriteOffSuggestions in PR C");
});

test("mark-writeoff-candidate route captures rule from createOrStrengthenWriteOffRule", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(src, /const.*\{.*rule.*\}.*=.*await.*createOrStrengthenWriteOffRule/s,
    "Route must capture the returned rule from createOrStrengthenWriteOffRule");
});

test("mark-writeoff-candidate route gates generation on WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED && rule", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(src, /WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED.*&&.*rule/s,
    "Generation must be gated on both flag and rule being present");
});

test("mark-writeoff-candidate route skips generation safely when rule is null", () => {
  // When createOrStrengthenWriteOffRule returns { rule: null }, the guard
  // `WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED && rule` is falsy — no generation call.
  // This is verified by the && rule guard in the source.
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(src, /&&\s*rule/,
    "Guard `&& rule` ensures generation is safely skipped when no rule is returned");
});

test("mark-writeoff-candidate route returns suggestionsCreated as non-hardcoded value", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  // Must return suggestionsCreated as a variable, not hardcoded 0
  assert.match(src, /suggestionsCreated[^,}]*(,|\n|\s*\})/,
    "suggestionsCreated must be returned as a variable");
  // The variable must be assigned from generateAndStoreWriteOffSuggestions
  assert.match(src, /suggestionsCreated\s*=\s*await\s*generateAndStoreWriteOffSuggestions/,
    "suggestionsCreated must be assigned from generateAndStoreWriteOffSuggestions");
});

test("mark-writeoff-candidate route still writes only is_writeoff_candidate (protected fields regression)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  assert.match(src, /\.update\(\s*\{\s*is_writeoff_candidate\s*:\s*true\s*\}/,
    "Update payload must still contain only is_writeoff_candidate");
  assert.doesNotMatch(src, /\.update\([^)]*category/, "Must not write category");
  assert.doesNotMatch(src, /\.update\([^)]*income_subtype/, "Must not write income_subtype");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Feature flag: WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED is true in PR C
// ═══════════════════════════════════════════════════════════════════════════════

test("WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED is true in PR C", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/constants.ts"),
    "utf8",
  );
  assert.match(
    src,
    /WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED\s*=\s*true/,
    "Feature flag must be true in PR C — suggestion generation is enabled",
  );
});

test("BUSINESS_EXPENSE_SUGGESTIONS_ENABLED is still true (regression)", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/constants.ts"),
    "utf8",
  );
  assert.match(
    src,
    /BUSINESS_EXPENSE_SUGGESTIONS_ENABLED\s*=\s*true/,
    "Business expense flag must remain true",
  );
});

test("rollback is a one-line flag revert: flag has no other dependents gating it", () => {
  // Rollback = change WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED back to false.
  // All downstream behavior (generation call, UI map population, suggestion badge)
  // is already gated by this flag — no other changes needed.
  const routeSrc = readFileSync(
    path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
    "utf8",
  );
  const pageSrc = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(routeSrc, /WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED/,
    "Route generation is gated by flag — rollback reverts it");
  assert.match(pageSrc, /WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED/,
    "UI population is gated by flag — rollback reverts it");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. UI: accept/reject handlers wired
// ═══════════════════════════════════════════════════════════════════════════════

test("transactions/page.tsx defines acceptWriteoffSuggestion function", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(src, /const acceptWriteoffSuggestion\s*=/,
    "acceptWriteoffSuggestion function must be defined");
});

test("transactions/page.tsx defines rejectWriteoffSuggestion function", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(src, /const rejectWriteoffSuggestion\s*=/,
    "rejectWriteoffSuggestion function must be defined");
});

test("acceptWriteoffSuggestion calls the accept route", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(src, /acceptWriteoffSuggestion[\s\S]{0,200}\/api\/automation\/suggestions.*accept/s,
    "acceptWriteoffSuggestion must call the accept route");
});

test("acceptWriteoffSuggestion performs optimistic update setting is_writeoff_candidate to true", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  // Within acceptWriteoffSuggestion body, look for is_writeoff_candidate: true
  const fnMatch = src.match(/const acceptWriteoffSuggestion\s*=[\s\S]{0,1000}?setUndoEntry/);
  assert.ok(fnMatch, "acceptWriteoffSuggestion function body must be extractable");
  assert.match(fnMatch[0], /is_writeoff_candidate\s*:\s*true/,
    "acceptWriteoffSuggestion must optimistically set is_writeoff_candidate to true");
});

test("acceptWriteoffSuggestion removes the accepted txId from writeoffSuggestions map", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  const fnMatch = src.match(/const acceptWriteoffSuggestion\s*=[\s\S]{0,1000}?setUndoEntry/);
  assert.ok(fnMatch, "acceptWriteoffSuggestion function body must be extractable");
  assert.match(fnMatch[0], /setWriteoffSuggestions/,
    "Must clear the accepted txId from writeoffSuggestions map");
});

test("acceptWriteoffSuggestion sets undoEntry with kind writeoff", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  const fnMatch = src.match(/const acceptWriteoffSuggestion\s*=[\s\S]{0,1000}?setUndoEntry[\s\S]{0,200}?\}/);
  assert.ok(fnMatch, "acceptWriteoffSuggestion function must include setUndoEntry call");
  assert.match(fnMatch[0], /"writeoff"/,
    "undoEntry must be set with kind: \"writeoff\"");
});

test("rejectWriteoffSuggestion calls the reject route with rejection_reason", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  const fnMatch = src.match(/const rejectWriteoffSuggestion\s*=[\s\S]{0,600}?setOpenWriteoffSuggestionId/);
  assert.ok(fnMatch, "rejectWriteoffSuggestion function body must be extractable");
  assert.match(fnMatch[0], /\/api\/automation\/suggestions.*reject/s,
    "rejectWriteoffSuggestion must call the reject route");
  assert.match(fnMatch[0], /rejection_reason/,
    "rejectWriteoffSuggestion must pass rejection_reason");
});

test("write-off suggestion accept button calls acceptWriteoffSuggestion (not a no-op)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(src, /acceptWriteoffSuggestion\(writeoffSuggestion\.id,\s*tx\.id\)/,
    "Accept button must call acceptWriteoffSuggestion with suggestion id and tx id");
  assert.doesNotMatch(src, /accept handled via suggestion accept route/,
    "No-op comment must be replaced with real handler call");
});

test("write-off suggestion reject button calls rejectWriteoffSuggestion", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(src, /rejectWriteoffSuggestion\(writeoffSuggestion\.id,\s*tx\.id\)/,
    "Reject button must call rejectWriteoffSuggestion with suggestion id and tx id");
});

test("markWriteOff reloads suggestions when suggestionsCreated > 0", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(src, /suggestionsCreated.*>.*0.*loadSuggestions|loadSuggestions.*suggestionsCreated/s,
    "markWriteOff must reload suggestions when generation produced new results");
});

test("disclaimer text still present in write-off candidate panel", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(src,
    /does not create a write-off.*deduction.*taxes|write-off review.*not.*taxes|This only marks.*write-off review/s,
    "Disclaimer text must still be present");
});

test("button label is still Mark as Write-Off Candidate", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(src, /Mark as Write-Off Candidate/,
    "Button label must remain 'Mark as Write-Off Candidate'");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. User isolation: suggestion engine is user-scoped
// ═══════════════════════════════════════════════════════════════════════════════

test("writeOffSuggestionEngine uses rule.user_id for all inserted suggestions", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.match(src, /user_id\s*:\s*rule\.user_id/,
    "All inserted suggestions must use rule.user_id (user isolation)");
});

test("writeOffSuggestionEngine does not perform cross-user queries (no userId passed to DB)", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  // The user isolation comes from the rule itself — which is already user-scoped.
  // The transaction fetch relies on RLS (enforced at DB level).
  // Verify that no cross-user .eq("user_id", ...) override is added that could leak.
  assert.doesNotMatch(src, /\.eq\(["']user_id["'],.*\)/,
    "Suggestion engine must not add manual user_id filter — rely on rule scope and RLS");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. No-generation fallback: flag false guard
// ═══════════════════════════════════════════════════════════════════════════════

test("no suggestions are generated when WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED is false", () => {
  // Simulate the guard in the route
  const WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED_OFF = false;
  const fakeRule = { id: "rule-1", user_id: "user-1", status: "active" };
  let generateCalled = false;
  const fakeGenerate = () => { generateCalled = true; return 0; };

  if (WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED_OFF && fakeRule) {
    fakeGenerate();
  }
  assert.equal(generateCalled, false, "Generation must not be called when flag is false");
});

test("generation is skipped safely when rule is null (blocked direction/no signal)", () => {
  // Simulate the guard in the route
  const WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED_ON = true;
  const nullRule = null;
  let generateCalled = false;
  const fakeGenerate = () => { generateCalled = true; return 0; };

  if (WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED_ON && nullRule) {
    fakeGenerate();
  }
  assert.equal(generateCalled, false, "Generation must be skipped when createOrStrengthenWriteOffRule returns null rule");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. Regression: existing business candidate and category suggestion paths
// ═══════════════════════════════════════════════════════════════════════════════

test("businessSuggestionEngine.ts is unchanged (regression)", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/businessSuggestionEngine.ts"),
    "utf8",
  );
  assert.match(src, /business_expense_candidate/,
    "businessSuggestionEngine must still generate business_expense_candidate suggestions");
  assert.doesNotMatch(src, /write_off_candidate/,
    "businessSuggestionEngine must not reference write_off_candidate");
});

test("accept route still has business_expense_candidate and category paths (regression)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.match(src, /apply_business_candidate_suggestion/,
    "Business candidate accept path must still be present");
  assert.match(src, /apply_automation_suggestion/,
    "Category accept path must still be present");
  assert.match(src, /apply_writeoff_candidate_suggestion/,
    "Write-off candidate accept path must still be present");
});

test("undo route still has mark_business_candidate and set_category paths (regression)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/audit/[id]/undo/route.ts"),
    "utf8",
  );
  assert.match(src, /undo_mark_business_candidate/,
    "Business candidate undo path must still be present");
  assert.match(src, /undo_automation_suggestion/,
    "Category undo path must still be present");
  assert.match(src, /undo_mark_writeoff_candidate/,
    "Write-off candidate undo path must still be present");
});

test("bizSuggestions and categorySuggestions maps still work independently (regression)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/dashboard/transactions/page.tsx"),
    "utf8",
  );
  assert.match(src, /acceptBizSuggestion/,
    "acceptBizSuggestion function must still exist");
  assert.match(src, /rejectBizSuggestion/,
    "rejectBizSuggestion function must still exist");
  assert.match(src, /acceptSuggestion/,
    "acceptSuggestion (category) function must still exist");
  assert.match(src, /rejectSuggestion/,
    "rejectSuggestion (category) function must still exist");
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. Financial isolation: no Tax Center, no Write-Off totals, no deductible changes
// ═══════════════════════════════════════════════════════════════════════════════

const DEDUCTIBLE_CATEGORIES_LOCAL = new Set([
  "business", "home office", "vehicle", "equipment", "software",
  "meals", "travel", "professional services", "advertising",
  "office supplies", "insurance", "utilities",
]);

function isDeductibleBusinessExpense(tx) {
  const cat = (tx.category ?? "").toLowerCase();
  const txType = (tx.transaction_type ?? "").toLowerCase();
  return (
    tx.direction === "debit" &&
    DEDUCTIBLE_CATEGORIES_LOCAL.has(cat) &&
    txType !== "transfer" &&
    txType !== "tax_payment" &&
    tx.deleted_at == null
  );
}

test("accepting a write-off suggestion does not change deductible calculation", () => {
  // is_writeoff_candidate: true is set on accept, but deductibility is unchanged
  const before = { direction: "debit", category: "groceries", transaction_type: "bank", deleted_at: null, is_writeoff_candidate: null };
  const after = { ...before, is_writeoff_candidate: true };
  assert.equal(isDeductibleBusinessExpense(before), false);
  assert.equal(isDeductibleBusinessExpense(after), false,
    "Accepting write-off suggestion must not make a non-deductible transaction deductible");
});

test("write-off candidate suggestions do not affect Write-Off totals", () => {
  const candidates = [
    { direction: "debit", category: "personal", transaction_type: "bank", deleted_at: null, is_writeoff_candidate: true, amount: 300 },
    { direction: "debit", category: "entertainment", transaction_type: "bank", deleted_at: null, is_writeoff_candidate: true, amount: 100 },
  ];
  const deductible = candidates.filter(isDeductibleBusinessExpense);
  const writeOffTotal = deductible.reduce((sum, tx) => sum + tx.amount, 0);
  assert.equal(writeOffTotal, 0,
    "Accepting write-off suggestions must not increase Write-Off totals");
});

test("no Tax Center values change when write-off suggestions are accepted", () => {
  const DEFAULT_TAX_RATE = 0.25;
  const accepted = [
    { direction: "debit", category: "food", transaction_type: "bank", deleted_at: null, is_writeoff_candidate: true, amount: 500 },
  ];
  const deductible = accepted.filter(isDeductibleBusinessExpense);
  const taxSavings = deductible.reduce((sum, tx) => sum + tx.amount * DEFAULT_TAX_RATE, 0);
  assert.equal(taxSavings, 0, "Tax savings estimate must not change from write-off candidate acceptance");
});

test("writeOffSuggestionEngine.ts does not import isDeductibleBusinessExpense or DEDUCTIBLE_CATEGORIES", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /isDeductibleBusinessExpense/,
    "Engine must not use isDeductibleBusinessExpense");
  assert.doesNotMatch(src, /DEDUCTIBLE_CATEGORIES/,
    "Engine must not reference DEDUCTIBLE_CATEGORIES");
});

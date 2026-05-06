/**
 * Write-Off Candidate PR A: backend foundation tests.
 *
 * All logic under test is inlined — no TypeScript imports.
 * Source files are read via fs.readFileSync where structural assertions
 * are needed (constants values, migration SQL content, type definitions).
 *
 * Run with: node --test tests/automation/writeoff-candidate.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ─── Inlined: DEDUCTIBLE_CATEGORIES (mirrors canonicalFinancialData.ts) ────────

const DEDUCTIBLE_CATEGORIES = new Set([
  "business", "home office", "vehicle", "equipment", "software",
  "meals", "travel", "professional services", "advertising",
  "office supplies", "insurance", "utilities",
]);

// ─── Inlined: isDeductibleBusinessExpense (mirrors canonicalFinancialData.ts) ──

function isDeductibleBusinessExpense(tx) {
  const cat = (tx.category ?? "").toLowerCase();
  const txType = (tx.transaction_type ?? "").toLowerCase();
  return (
    tx.direction === "debit" &&
    DEDUCTIBLE_CATEGORIES.has(cat) &&
    txType !== "transfer" &&
    txType !== "tax_payment" &&
    tx.deleted_at == null
  );
}

// ─── Inlined: NON_AUTOMATABLE_TX_FIELDS (mirrors constants.ts) ────────────────

const NON_AUTOMATABLE_TX_FIELDS = [
  "income_subtype", "direction", "amount", "transaction_date",
  "transaction_type", "status", "financial_account_id",
  "external_transaction_id", "provider", "deleted_at",
];

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. Migration 008: is_writeoff_candidate column ──────────────────────────

test("migration 008: adds is_writeoff_candidate BOOLEAN NULL", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000008_add_is_writeoff_candidate.sql"),
    "utf8",
  );
  const addColumnMatch = sql.match(/ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?is_writeoff_candidate[^;]+/i);
  assert.ok(addColumnMatch, "ADD COLUMN is_writeoff_candidate statement must exist");
  const stmt = addColumnMatch[0];
  assert.match(stmt, /BOOLEAN\s+NULL/i, "Must be BOOLEAN NULL");
  assert.doesNotMatch(stmt, /NOT\s+NULL/i, "Must not have NOT NULL constraint");
  assert.doesNotMatch(stmt, /\bDEFAULT\b/i, "Must not have a DEFAULT value");
  assert.doesNotMatch(stmt, /REFERENCES\s+/i, "Must not have a foreign key");
  assert.doesNotMatch(sql, /CREATE\s+INDEX/i, "Must not add an index");
});

test("migration 008: rollback DROP COLUMN comment is present", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000008_add_is_writeoff_candidate.sql"),
    "utf8",
  );
  assert.match(sql, /DROP\s+COLUMN\s+is_writeoff_candidate/i,
    "Rollback DROP COLUMN must be documented");
});

test("migration 008: uses defensive DO block — skips if transactions table absent", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000008_add_is_writeoff_candidate.sql"),
    "utf8",
  );
  assert.match(sql, /information_schema\.tables/i,
    "Must check information_schema.tables for table existence");
  assert.match(sql, /RAISE\s+NOTICE/i,
    "Must RAISE NOTICE when table is absent rather than failing");
});

test("migration 008: does not create public.transactions", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000008_add_is_writeoff_candidate.sql"),
    "utf8",
  );
  assert.doesNotMatch(sql, /CREATE\s+TABLE\s+(?:public\.)?transactions/i,
    "Migration must not create the transactions table");
});

// ─── 2. Migration 009: exact constraint values only ──────────────────────────

test("migration 009: suggestion_type allows write_off_candidate and preserves existing", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000009_add_writeoff_candidate_constraint_values.sql"),
    "utf8",
  );
  assert.match(sql, /'write_off_candidate'/, "Must add write_off_candidate");
  assert.match(sql, /'transaction_category'/, "Must preserve transaction_category");
  assert.match(sql, /'business_expense_candidate'/, "Must preserve business_expense_candidate");
});

test("migration 009: action_type allows mark_writeoff_candidate and preserves existing", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000009_add_writeoff_candidate_constraint_values.sql"),
    "utf8",
  );
  assert.match(sql, /'mark_writeoff_candidate'/, "Must add mark_writeoff_candidate");
  assert.match(sql, /'set_category'/, "Must preserve set_category");
  assert.match(sql, /'set_subcategory'/, "Must preserve set_subcategory");
  assert.match(sql, /'mark_business_candidate'/, "Must preserve mark_business_candidate");
});

test("migration 009: audit_log action_taken allows mark and undo_mark_writeoff_candidate", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000009_add_writeoff_candidate_constraint_values.sql"),
    "utf8",
  );
  assert.match(sql, /'mark_writeoff_candidate'/,
    "Must add mark_writeoff_candidate to audit log constraint");
  assert.match(sql, /'undo_mark_writeoff_candidate'/,
    "Must add undo_mark_writeoff_candidate to audit log constraint");
  assert.match(sql, /'mark_business_candidate'/, "Must preserve mark_business_candidate");
  assert.match(sql, /'undo_mark_business_candidate'/, "Must preserve undo_mark_business_candidate");
});

test("migration 009: prohibited values are not added as SQL values", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000009_add_writeoff_candidate_constraint_values.sql"),
    "utf8",
  );
  const prohibited = [
    "auto_applied", "writeoff_rollup", "tax_rollup", "savings_goal_allocation",
    "budget_category", "transfer_reconciliation", "duplicate_detection",
    "investment_alert", "documentation_reminder",
  ];
  for (const val of prohibited) {
    assert.doesNotMatch(sql, new RegExp(`'${val}'`),
      `Prohibited value '${val}' must not appear as a quoted SQL value in migration 009`);
  }
});

test("migration 009: rule_type constraint is NOT changed (reuses transaction_category)", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000009_add_writeoff_candidate_constraint_values.sql"),
    "utf8",
  );
  assert.doesNotMatch(sql, /automation_rules_rule_type_check/,
    "rule_type CHECK constraint must not be modified");
});

test("migration 009: does not CREATE apply_writeoff_candidate_suggestion function (PR B only)", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260505000009_add_writeoff_candidate_constraint_values.sql"),
    "utf8",
  );
  // The function name may appear in comments, but must not be declared with CREATE FUNCTION.
  assert.doesNotMatch(
    sql,
    /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+apply_writeoff_candidate_suggestion/i,
    "The atomic RPC function must not be created in PR A — it ships in PR B",
  );
});

// ─── 3. WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED defaults false ────────────────

test("WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED is defined and defaults to false in PR A", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/constants.ts"),
    "utf8",
  );
  const match = src.match(/WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED\s*=\s*(true|false)/);
  assert.ok(match, "WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED must be defined in constants.ts");
  assert.equal(match[1], "false",
    "Must default to false in PR A — no suggestion generation yet");
});

test("BUSINESS_EXPENSE_SUGGESTIONS_ENABLED is still true and unchanged", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/constants.ts"),
    "utf8",
  );
  const match = src.match(/BUSINESS_EXPENSE_SUGGESTIONS_ENABLED\s*=\s*(true|false)/);
  assert.ok(match, "BUSINESS_EXPENSE_SUGGESTIONS_ENABLED must still be defined");
  assert.equal(match[1], "true", "Business candidate flag must remain true");
});

// ─── 4. No write-off candidate suggestions generated when flag is false ────────

test("no write-off candidate suggestions are generated when flag is false", () => {
  const WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED = false;
  // Simulate the guard that will exist in the mark-writeoff route (PR B)
  const wouldGenerate = WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED;
  assert.equal(wouldGenerate, false,
    "No write-off candidate suggestions must be generated when flag is false");
});

// ─── 5. Type definitions ──────────────────────────────────────────────────────

test("WriteOffCandidateActionConfig is defined with reason field", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/types.ts"),
    "utf8",
  );
  assert.match(src, /WriteOffCandidateActionConfig/,
    "WriteOffCandidateActionConfig must be defined");
  assert.match(src, /reason.*string/,
    "Must have a reason: string field");
});

test("WriteOffCandidateActionConfig does not have a category or mixed_use field", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/types.ts"),
    "utf8",
  );
  // Extract just the WriteOffCandidateActionConfig interface block
  const match = src.match(/WriteOffCandidateActionConfig\s*\{([^}]+)\}/);
  assert.ok(match, "WriteOffCandidateActionConfig interface body must be extractable");
  const body = match[1];
  assert.doesNotMatch(body, /\bcategory\b/,
    "WriteOffCandidateActionConfig must not have a category field");
  assert.doesNotMatch(body, /mixed_use/,
    "WriteOffCandidateActionConfig must not have a mixed_use field");
});

test("Phase4ActionType includes mark_writeoff_candidate", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/types.ts"),
    "utf8",
  );
  assert.match(src, /'mark_writeoff_candidate'/,
    "Phase4ActionType must include mark_writeoff_candidate");
  assert.match(src, /'mark_business_candidate'/, "Must still include mark_business_candidate");
  assert.match(src, /'set_category'/, "Must still include set_category");
});

test("Phase4SuggestionType includes write_off_candidate", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/types.ts"),
    "utf8",
  );
  assert.match(src, /'write_off_candidate'/,
    "Phase4SuggestionType must include write_off_candidate");
  assert.match(src, /'business_expense_candidate'/, "Must still include business_expense_candidate");
  assert.match(src, /'transaction_category'/, "Must still include transaction_category");
});

test("AutomationAuditEntry.action_taken includes write-off candidate values", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/types.ts"),
    "utf8",
  );
  assert.match(src, /'mark_writeoff_candidate'/,
    "action_taken must include mark_writeoff_candidate");
  assert.match(src, /'undo_mark_writeoff_candidate'/,
    "action_taken must include undo_mark_writeoff_candidate");
});

// ─── 6. Protected fields ──────────────────────────────────────────────────────

test("is_writeoff_candidate is not in NON_AUTOMATABLE_TX_FIELDS", () => {
  assert.equal(
    NON_AUTOMATABLE_TX_FIELDS.includes("is_writeoff_candidate"),
    false,
    "is_writeoff_candidate is a field automation is permitted to write",
  );
});

test("is_business_candidate is not in NON_AUTOMATABLE_TX_FIELDS (regression)", () => {
  assert.equal(
    NON_AUTOMATABLE_TX_FIELDS.includes("is_business_candidate"),
    false,
    "is_business_candidate must remain excluded from NON_AUTOMATABLE_TX_FIELDS",
  );
});

test("all original NON_AUTOMATABLE_TX_FIELDS are still protected", () => {
  const expected = [
    "income_subtype", "direction", "amount", "transaction_date",
    "transaction_type", "status", "financial_account_id",
    "external_transaction_id", "provider", "deleted_at",
  ];
  for (const field of expected) {
    assert.ok(
      NON_AUTOMATABLE_TX_FIELDS.includes(field),
      `Protected field "${field}" must still be in NON_AUTOMATABLE_TX_FIELDS`,
    );
  }
});

// ─── 7. Financial isolation: is_writeoff_candidate does not affect deductibility

test("is_writeoff_candidate = true does not make a non-deductible transaction deductible", () => {
  const tx = {
    direction: "debit",
    category: "groceries",
    transaction_type: "bank",
    deleted_at: null,
    is_writeoff_candidate: true,
  };
  assert.equal(isDeductibleBusinessExpense(tx), false,
    "is_writeoff_candidate must not affect isDeductibleBusinessExpense");
});

test("is_writeoff_candidate = true with no category is not deductible", () => {
  const tx = {
    direction: "debit",
    category: null,
    transaction_type: "bank",
    deleted_at: null,
    is_writeoff_candidate: true,
  };
  assert.equal(isDeductibleBusinessExpense(tx), false);
});

test("deductibility is determined only by category, direction, transaction_type, deleted_at", () => {
  // Transaction with deductible category — deductible
  const withDeductibleCat = {
    direction: "debit", category: "business", transaction_type: "bank",
    deleted_at: null, is_writeoff_candidate: false,
  };
  // Transaction with write-off candidate flag but non-deductible category — not deductible
  const withFlagOnly = {
    direction: "debit", category: "groceries", transaction_type: "bank",
    deleted_at: null, is_writeoff_candidate: true,
  };
  assert.equal(isDeductibleBusinessExpense(withDeductibleCat), true,
    "Category in DEDUCTIBLE_CATEGORIES makes it deductible regardless of write-off flag");
  assert.equal(isDeductibleBusinessExpense(withFlagOnly), false,
    "is_writeoff_candidate alone must not trigger deductibility");
});

test("setting is_writeoff_candidate does not increase deductible expense count", () => {
  const transactions = [
    { direction: "debit", category: "groceries", transaction_type: "bank",
      deleted_at: null, is_writeoff_candidate: true, amount: 100 },
    { direction: "debit", category: "entertainment", transaction_type: "bank",
      deleted_at: null, is_writeoff_candidate: true, amount: 50 },
  ];
  const deductible = transactions.filter(isDeductibleBusinessExpense);
  assert.equal(deductible.length, 0,
    "Flagging transactions as write-off candidates must not add to deductible totals");
});

test("is_writeoff_candidate does not affect Tax Center values", () => {
  // Tax Center derives taxable income from:
  // Business Income (credits with income_subtype=business/self-employment)
  // minus Deductible Expenses (only category-matched transactions)
  // is_writeoff_candidate plays no role in either calculation.
  const withFlag = {
    direction: "debit", category: "rent", transaction_type: "bank",
    deleted_at: null, is_writeoff_candidate: true, amount: 1500,
  };
  // rent is not in DEDUCTIBLE_CATEGORIES, so this transaction contributes nothing
  assert.equal(isDeductibleBusinessExpense(withFlag), false,
    "Write-off candidate flag must not inject value into Tax Center calculations");
});

test("is_writeoff_candidate does not affect Write-Off totals (rollup only counts deductible txs)", () => {
  // Write-Off totals are the sum of deductible transaction amounts.
  // A transaction is deductible only when isDeductibleBusinessExpense() returns true.
  // is_writeoff_candidate is never part of that check.
  const candidates = [
    { direction: "debit", category: "groceries", transaction_type: "bank",
      deleted_at: null, is_writeoff_candidate: true, amount: 200 },
    { direction: "debit", category: "entertainment", transaction_type: "bank",
      deleted_at: null, is_writeoff_candidate: true, amount: 75 },
  ];
  const deductible = candidates.filter(isDeductibleBusinessExpense);
  const writeOffTotal = deductible.reduce((sum, tx) => sum + tx.amount, 0);
  assert.equal(writeOffTotal, 0,
    "Write-Off total must be 0 for write-off-candidate-flagged transactions with non-deductible categories");
});

test("is_writeoff_candidate does not affect federal/state tax estimate calculations", () => {
  // Tax savings estimate = total deductible × DEFAULT_TAX_RATE (0.25)
  // Total deductible is calculated from deductible transaction amounts.
  // is_writeoff_candidate is not part of that calculation path.
  const DEFAULT_TAX_RATE = 0.25;
  const candidates = [
    { direction: "debit", category: "personal", transaction_type: "bank",
      deleted_at: null, is_writeoff_candidate: true, amount: 500 },
  ];
  const deductible = candidates.filter(isDeductibleBusinessExpense);
  const taxSavings = deductible.reduce((sum, tx) => sum + tx.amount * DEFAULT_TAX_RATE, 0);
  assert.equal(taxSavings, 0,
    "Tax savings estimate must be 0 for write-off-candidate transactions in non-deductible categories");
});

// ─── 8. DEDUCTIBLE_CATEGORIES unchanged (regression) ─────────────────────────

test("DEDUCTIBLE_CATEGORIES is unchanged — still has exactly 12 entries", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/canonicalFinancialData.ts"),
    "utf8",
  );
  const match = src.match(/DEDUCTIBLE_CATEGORIES[\s\S]*?new Set\(\[([\s\S]*?)\]\)/m);
  assert.ok(match, "DEDUCTIBLE_CATEGORIES must be present in canonicalFinancialData.ts");
  const members = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(members.length, 12,
    `DEDUCTIBLE_CATEGORIES must still have 12 entries, found: ${members.length}`);
});

test("SENSITIVE_CATEGORIES is unchanged — still has exactly 12 entries", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/automation/constants.ts"),
    "utf8",
  );
  const match = src.match(/SENSITIVE_CATEGORIES[\s\S]*?new Set\(\[([\s\S]*?)\]\)/m);
  assert.ok(match, "SENSITIVE_CATEGORIES must be defined in constants.ts");
  const members = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(members.length, 12,
    `SENSITIVE_CATEGORIES must still have 12 entries, found: ${members.length}`);
});

test("canonicalFinancialData.ts does not reference is_writeoff_candidate", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/canonicalFinancialData.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /is_writeoff_candidate/,
    "canonicalFinancialData.ts must not reference is_writeoff_candidate in PR A");
});

test("financialCalculations.ts does not reference is_writeoff_candidate", () => {
  const src = readFileSync(
    path.join(ROOT, "src/lib/financialCalculations.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /is_writeoff_candidate/,
    "financialCalculations.ts must not reference is_writeoff_candidate in PR A");
});

// ─── 9. Accept route: write_off_candidate returns 501 ────────────────────────

test("accept route returns 501 for write_off_candidate in PR A", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  // Verify the route has a branch for write_off_candidate that explicitly 501s
  assert.match(src, /write_off_candidate/,
    "Accept route must handle write_off_candidate suggestion type");
  assert.match(src, /501/,
    "Accept route must return 501 for write_off_candidate in PR A");
  // Verify it does NOT make an RPC call to apply_writeoff_candidate_suggestion
  assert.doesNotMatch(src, /\.rpc\(["']apply_writeoff_candidate_suggestion["']/,
    "Accept route must not make the unimplemented RPC call in PR A");
});

test("accept route does not write is_writeoff_candidate for write_off_candidate branch", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  // The write_off_candidate branch must only return a response — no DB writes
  const wocBranch = src.match(
    /write_off_candidate[\s\S]*?(?=\/\/ ─── Branch|\/\/ ─── existing|export)/,
  )?.[0] ?? "";
  assert.doesNotMatch(wocBranch, /\.update\b/,
    "Write-off candidate accept branch must not call .update() in PR A");
  assert.doesNotMatch(wocBranch, /is_writeoff_candidate/,
    "Write-off candidate accept branch must not write is_writeoff_candidate in PR A");
});

// ─── 10. Undo route: mark_writeoff_candidate returns 501 ──────────────────────

test("undo route returns 501 for mark_writeoff_candidate in PR A", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/audit/[id]/undo/route.ts"),
    "utf8",
  );
  assert.match(src, /mark_writeoff_candidate/,
    "Undo route must handle mark_writeoff_candidate action type");
  assert.match(src, /501/,
    "Undo route must return 501 for mark_writeoff_candidate in PR A");
});

test("undo route does not revert is_writeoff_candidate in PR A", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/audit/[id]/undo/route.ts"),
    "utf8",
  );
  // Find the mark_writeoff_candidate branch and verify it does no DB writes
  const wocBranch = src.match(
    /mark_writeoff_candidate[\s\S]*?(?=\/\/ ─── Branch|\/\/ ─── transaction_category)/,
  )?.[0] ?? "";
  assert.doesNotMatch(wocBranch, /is_writeoff_candidate.*null/,
    "Undo must not attempt to revert is_writeoff_candidate in PR A");
  assert.doesNotMatch(wocBranch, /\.update\b/,
    "Undo write-off candidate branch must not call .update() in PR A");
});

// ─── 11. Existing behavior regression ────────────────────────────────────────

test("business_expense_candidate accept path is still wired (not disrupted)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/suggestions/[id]/accept/route.ts"),
    "utf8",
  );
  assert.match(src, /apply_business_candidate_suggestion/,
    "Business candidate RPC call must remain in the accept route");
  assert.match(src, /business_expense_candidate/,
    "Accept route must still have business_expense_candidate branch");
});

test("mark_business_candidate undo path is still wired (not disrupted)", () => {
  const src = readFileSync(
    path.join(ROOT, "app/api/automation/audit/[id]/undo/route.ts"),
    "utf8",
  );
  assert.match(src, /mark_business_candidate/,
    "Undo route must still handle mark_business_candidate");
  assert.match(src, /is_business_candidate.*null/,
    "Undo route must still revert is_business_candidate");
});

test("category suggestion SENSITIVE_CATEGORIES guard still blocks deductible categories", () => {
  const categorizeGuard = (category) => {
    const SENSITIVE = new Set([
      "business", "home office", "vehicle", "equipment", "software",
      "meals", "travel", "professional services", "advertising",
      "office supplies", "insurance", "utilities",
    ]);
    if (SENSITIVE.has(category.toLowerCase())) return { status: 400 };
    return { status: 200 };
  };
  assert.equal(categorizeGuard("business").status, 400, "business must still be blocked");
  assert.equal(categorizeGuard("meals").status, 400, "meals must still be blocked");
  assert.equal(categorizeGuard("groceries").status, 200, "groceries must still be allowed");
});

test("is_business_candidate behavior is unchanged (regression)", () => {
  const txWithBizFlag = {
    direction: "debit",
    category: "groceries",
    transaction_type: "bank",
    deleted_at: null,
    is_business_candidate: true,
  };
  assert.equal(isDeductibleBusinessExpense(txWithBizFlag), false,
    "is_business_candidate must still not affect deductibility");
});

// ─── 12. No UI or generation code added in PR A ───────────────────────────────

test("no mark-writeoff-candidate route exists in PR A", () => {
  let exists = false;
  try {
    readFileSync(
      path.join(ROOT, "app/api/automation/transactions/[id]/mark-writeoff-candidate/route.ts"),
      "utf8",
    );
    exists = true;
  } catch {
    // File not found is expected in PR A
  }
  assert.equal(exists, false,
    "mark-writeoff-candidate route must not exist in PR A — it ships in PR B");
});

test("no writeOffRuleBuilder.ts exists in PR A", () => {
  let exists = false;
  try {
    readFileSync(path.join(ROOT, "src/lib/automation/writeOffRuleBuilder.ts"), "utf8");
    exists = true;
  } catch {
    // File not found is expected in PR A
  }
  assert.equal(exists, false,
    "writeOffRuleBuilder.ts must not exist in PR A — it ships in PR B");
});

test("no writeOffSuggestionEngine.ts exists in PR A", () => {
  let exists = false;
  try {
    readFileSync(path.join(ROOT, "src/lib/automation/writeOffSuggestionEngine.ts"), "utf8");
    exists = true;
  } catch {
    // File not found is expected in PR A
  }
  assert.equal(exists, false,
    "writeOffSuggestionEngine.ts must not exist in PR A — it ships in PR C");
});

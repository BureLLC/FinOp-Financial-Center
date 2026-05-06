// SENSITIVE_CATEGORIES mirrors DEDUCTIBLE_CATEGORIES in canonicalFinancialData.ts.
// These categories affect Write-Offs and Tax Center through existing canonical logic.
// Phase 1 automation must never suggest, apply, or create rules for these categories.
// This set is the single authoritative reference for that guard in the automation layer.
// If DEDUCTIBLE_CATEGORIES in canonicalFinancialData.ts changes, update this set to match.

export const SENSITIVE_CATEGORIES: ReadonlySet<string> = new Set([
  "business",
  "home office",
  "vehicle",
  "equipment",
  "software",
  "meals",
  "travel",
  "professional services",
  "advertising",
  "office supplies",
  "insurance",
  "utilities",
]);

// Fields on the transactions table that automation is never permitted to write.
// Used in tests to enumerate protected fields and in API layer documentation.
// The Postgres apply function enforces this structurally by only issuing
// UPDATE ... SET category = ..., subcategory = ...
// Phase 4 note: is_business_candidate and is_writeoff_candidate are intentionally
// NOT in this list — they are the only transaction fields automation is permitted
// to write. All other fields listed here are permanently protected.
export const NON_AUTOMATABLE_TX_FIELDS: readonly string[] = [
  "income_subtype",
  "direction",
  "amount",
  "transaction_date",
  "transaction_type",
  "status",
  "financial_account_id",
  "external_transaction_id",
  "provider",
  "deleted_at",
];

// MIXED_USE_CATEGORIES: expenses that are sometimes personal, sometimes business.
// Business expense suggestions targeting these require explicit user confirmation.
// When BUSINESS_EXPENSE_SUGGESTIONS_ENABLED is true, confidence for suggestions
// that match a mixed-use merchant is capped at 0.60.
// This set is independent of SENSITIVE_CATEGORIES and DEDUCTIBLE_CATEGORIES —
// it governs business expense suggestion behavior only, not category automation.
// It is NOT monitored by drift.test.mjs.
export const MIXED_USE_CATEGORIES: ReadonlySet<string> = new Set([
  "meals",
  "home office",
  "vehicle",
  "phone",
  "travel",
  "equipment",
  "education",
  "professional services",
]);

// Controls whether business expense suggestion generation is active.
// Phase 4 PR C: enabled — mark-business now creates/strengthens automation rules
// and generates business_expense_candidate suggestions for similar debit transactions.
export const BUSINESS_EXPENSE_SUGGESTIONS_ENABLED = true;

// Controls whether write-off candidate suggestion generation is active.
// Write-Off Candidate PR C: enabled — mark-writeoff route now calls
// generateAndStoreWriteOffSuggestions when a rule is learned.
// Rollback: set to false to disable generation and dormant the UI suggestion panel.
export const WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED = true;

// Controls whether budget automation is active.
// Budget Automation PR A: false — tables and services exist but no generation is wired
// into user-facing routes and the UI is not modified.
// Flip to true in Budget Automation PR B after generation, accept/reject, and UI are complete.
// Rollback: set to false and redeploy. No migration needed.
export const BUDGET_AUTOMATION_ENABLED = false;

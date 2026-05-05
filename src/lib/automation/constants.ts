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
// Phase 4 note: is_business_candidate is intentionally NOT in this list —
// it is the one additional field that Phase 4 automation is permitted to write.
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
// Phase 4 PR A: defaults to false — mark-business writes is_business_candidate
// and creates an audit log entry, but does not create automation rules or
// generate suggestions for similar transactions.
// Set to true only when the Phase 4 PR B UI is merged and tested.
export const BUSINESS_EXPENSE_SUGGESTIONS_ENABLED = false;

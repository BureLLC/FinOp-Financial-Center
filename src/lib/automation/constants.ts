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

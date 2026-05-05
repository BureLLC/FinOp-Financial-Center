// Pure merchant/description normalization helpers.
// No external dependencies. No DB calls. No side effects.
// Used by matcherEngine and ruleBuilder to produce stable comparison keys.

// Matches common legal entity suffixes at the end of a string.
// Requires at least one space before the suffix (prevents matching "Costco" → suffix "co").
const LEGAL_SUFFIX_RE = /\s+(?:llc|inc|corp|co|ltd|incorporated|limited|company)\.?$/i;

// Matches common top-level domain suffixes attached directly to a word (e.g. ".com", ".net").
const TLD_RE = /\.(com|net|org|io|co)$/i;

// Removes any character that is not a word character, space, or ampersand.
// Ampersand is kept because it is semantically meaningful in merchant names (e.g. "AT&T").
const PUNCTUATION_RE = /[^\w\s&]/g;

const WHITESPACE_RE = /\s+/g;

/** Returns a stable lowercase key for a merchant name, stripping TLDs, legal suffixes, and punctuation. */
export function normalizeMerchant(raw: string): string {
  if (typeof raw !== "string" || raw.length === 0) return "";
  return raw
    .toLowerCase()
    .replace(TLD_RE, "")
    .replace(LEGAL_SUFFIX_RE, "")
    .replace(PUNCTUATION_RE, " ")
    .replace(WHITESPACE_RE, " ")
    .trim();
}

/** Returns a lowercase, alphanumeric-only key for a transaction description. */
export function normalizeDescription(raw: string): string {
  if (typeof raw !== "string" || raw.length === 0) return "";
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(WHITESPACE_RE, " ")
    .trim();
}

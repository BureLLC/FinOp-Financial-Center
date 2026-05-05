/**
 * Drift protection: asserts SENSITIVE_CATEGORIES (automation/constants.ts) and
 * DEDUCTIBLE_CATEGORIES (canonicalFinancialData.ts) contain identical members.
 *
 * These two sets must stay in sync because automation uses SENSITIVE_CATEGORIES
 * to block suggestions for deductible categories. If a new deductible category
 * is added to canonicalFinancialData.ts without updating constants.ts, automation
 * would silently start suggesting it and corrupt Tax Center / Write-Offs data.
 *
 * This test reads the actual source files so it catches live drift without
 * requiring any imports from TypeScript modules.
 *
 * Run with: node --test tests/automation/drift.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * Parses a `new Set([...])` literal from a TypeScript/JavaScript source file.
 * Finds the first `new Set([...])` that appears after the given variable name.
 * Returns a Set<string> of the double-quoted string members found inside.
 */
function parseSetFromSource(filePath, variableName) {
  const src = readFileSync(filePath, "utf8");
  const escaped = variableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = src.match(new RegExp(`${escaped}[\\s\\S]*?new Set\\(\\[([\\s\\S]*?)\\]\\)`, "m"));
  if (!match) {
    throw new Error(`Could not locate "${variableName}" Set literal in ${filePath}`);
  }
  const members = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  return new Set(members);
}

const SENSITIVE = parseSetFromSource(
  path.join(ROOT, "src/lib/automation/constants.ts"),
  "SENSITIVE_CATEGORIES",
);

const DEDUCTIBLE = parseSetFromSource(
  path.join(ROOT, "src/lib/canonicalFinancialData.ts"),
  "DEDUCTIBLE_CATEGORIES",
);

// ─── Size parity ──────────────────────────────────────────────────────────────

test("SENSITIVE_CATEGORIES and DEDUCTIBLE_CATEGORIES have the same number of entries", () => {
  assert.equal(
    SENSITIVE.size,
    DEDUCTIBLE.size,
    `Size mismatch: SENSITIVE_CATEGORIES has ${SENSITIVE.size}, DEDUCTIBLE_CATEGORIES has ${DEDUCTIBLE.size}`,
  );
});

test("Both sets have exactly 12 entries (the known Phase 1 deductible category count)", () => {
  assert.equal(SENSITIVE.size, 12, `SENSITIVE_CATEGORIES has ${SENSITIVE.size} entries, expected 12`);
  assert.equal(DEDUCTIBLE.size, 12, `DEDUCTIBLE_CATEGORIES has ${DEDUCTIBLE.size} entries, expected 12`);
});

// ─── Subset checks: every deductible must be sensitive ────────────────────────

test("Every DEDUCTIBLE category is present in SENSITIVE_CATEGORIES", () => {
  for (const cat of DEDUCTIBLE) {
    assert.ok(
      SENSITIVE.has(cat),
      `"${cat}" is in DEDUCTIBLE_CATEGORIES but missing from SENSITIVE_CATEGORIES — automation would suggest it`,
    );
  }
});

test("Every SENSITIVE category is present in DEDUCTIBLE_CATEGORIES (no phantom entries)", () => {
  for (const cat of SENSITIVE) {
    assert.ok(
      DEDUCTIBLE.has(cat),
      `"${cat}" is in SENSITIVE_CATEGORIES but not in DEDUCTIBLE_CATEGORIES — unnecessary automation block`,
    );
  }
});

// ─── Specific member assertions ───────────────────────────────────────────────

const KNOWN_DEDUCTIBLE_CATEGORIES = [
  "business", "home office", "vehicle", "equipment", "software",
  "meals", "travel", "professional services", "advertising",
  "office supplies", "insurance", "utilities",
];

test("All 12 known deductible categories are in SENSITIVE_CATEGORIES", () => {
  for (const cat of KNOWN_DEDUCTIBLE_CATEGORIES) {
    assert.ok(SENSITIVE.has(cat), `SENSITIVE_CATEGORIES is missing known deductible category "${cat}"`);
  }
});

test("All 12 known deductible categories are in DEDUCTIBLE_CATEGORIES", () => {
  for (const cat of KNOWN_DEDUCTIBLE_CATEGORIES) {
    assert.ok(DEDUCTIBLE.has(cat), `DEDUCTIBLE_CATEGORIES is missing known deductible category "${cat}"`);
  }
});

// ─── Non-deductible categories must not appear in either set ─────────────────

const NON_DEDUCTIBLE = [
  "food", "groceries", "entertainment", "shopping", "fitness",
  "subscriptions", "healthcare", "transportation", "personal care",
  "education", "income", "transfer",
];

test("No non-deductible categories in SENSITIVE_CATEGORIES", () => {
  for (const cat of NON_DEDUCTIBLE) {
    assert.ok(!SENSITIVE.has(cat), `Non-deductible category "${cat}" should not be in SENSITIVE_CATEGORIES`);
  }
});

test("No non-deductible categories in DEDUCTIBLE_CATEGORIES", () => {
  for (const cat of NON_DEDUCTIBLE) {
    assert.ok(!DEDUCTIBLE.has(cat), `Non-deductible category "${cat}" should not be in DEDUCTIBLE_CATEGORIES`);
  }
});

// ─── Drift simulation: verify the test infrastructure catches drift ───────────

test("Drift detection works: a fabricated extra category would be caught", () => {
  const hypotheticalSensitive = new Set([...SENSITIVE, "fabricated_new_category"]);
  const inDeductible = DEDUCTIBLE.has("fabricated_new_category");
  assert.equal(inDeductible, false, "Fabricated category must not be in DEDUCTIBLE");
  // Simulates: if SENSITIVE had this extra entry, the 'no phantom entries' check would catch it
  assert.notEqual(hypotheticalSensitive.size, DEDUCTIBLE.size);
});

test("Drift detection works: a missing category would be caught", () => {
  const hypotheticalSensitive = new Set([...SENSITIVE]);
  hypotheticalSensitive.delete("meals");
  const allPresent = [...DEDUCTIBLE].every((cat) => hypotheticalSensitive.has(cat));
  assert.equal(allPresent, false, "'meals' removal should cause the subset check to fail");
});

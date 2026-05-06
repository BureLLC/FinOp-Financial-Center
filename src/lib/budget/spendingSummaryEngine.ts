// Computes monthly debit spending summaries by category from transaction records.
// Pure function — reads no DB, has no side effects.
// Never writes: category, subcategory, income_subtype, or any transaction/financial field.

import { RawTransaction, toNum } from "../financialCalculations";

export interface MonthlySpendRow {
  month: string;     // YYYY-MM format
  category: string;  // normalized category, or "Uncategorized" when tx.category is null/empty
  total: number;     // sum of debit amounts for this month + category
}

export interface MonthlyCategorySpendMap {
  // Outer key: YYYY-MM, Inner key: category, value: total spend
  byMonth: Map<string, Map<string, number>>;
  rows: MonthlySpendRow[];
}

/**
 * Returns true when a transaction should be excluded from budget spending summaries.
 *
 * Excluded when ANY of the following:
 *   - direction is not 'debit' (credits and income are not spending)
 *   - transaction_type is 'transfer' (internal money movement, not spending)
 *   - deleted_at is set (soft-deleted)
 *   - status is not 'posted' (pending/reversed/failed are unreliable)
 */
export function isExcludedFromSpendingSummary(tx: RawTransaction): boolean {
  if (tx.direction !== "debit") return true;
  if ((tx.transaction_type ?? "").toLowerCase() === "transfer") return true;
  if (tx.deleted_at != null) return true;
  if (tx.status !== "posted") return true;
  return false;
}

/**
 * Extracts the YYYY-MM month string from a transaction_date string.
 * Returns null if the date is absent or unparseable.
 */
export function extractMonth(transactionDate: string | null | undefined): string | null {
  if (!transactionDate) return null;
  const d = new Date(transactionDate);
  if (isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Computes a cutoff date string (YYYY-MM-DD) representing the first day of the
 * calendar month that is `monthsBack` full months before today.
 *
 * Example: today=2026-05-06, monthsBack=3 → "2026-02-01"
 */
export function computeCutoffDate(monthsBack: number): string {
  const now = new Date();
  const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
  const y = cutoff.getUTCFullYear();
  const m = String(cutoff.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/**
 * Pure function: builds monthly debit spending totals grouped by category.
 *
 * Eligibility guards (all must pass):
 *   - direction === 'debit'
 *   - transaction_type is not 'transfer'
 *   - deleted_at is null
 *   - status === 'posted'
 *   - transaction_date falls within the last monthsBack full calendar months
 *
 * Category bucketing:
 *   - tx.category (trimmed) is used as-is when non-empty
 *   - null, undefined, or empty string → bucketed as "Uncategorized"
 *
 * No writes. No DB access. Returns deterministic output for the same input.
 */
export function buildMonthlyCategorySpend(
  transactions: RawTransaction[],
  monthsBack: number = 6,
): MonthlyCategorySpendMap {
  const cutoff = computeCutoffDate(monthsBack);
  const byMonth = new Map<string, Map<string, number>>();

  for (const tx of transactions) {
    if (isExcludedFromSpendingSummary(tx)) continue;

    const month = extractMonth((tx as { transaction_date?: string }).transaction_date ?? null);
    if (!month) continue;

    // Exclude transactions older than the cutoff
    if (month < cutoff.substring(0, 7)) continue;

    const category = (tx.category ?? "").trim() || "Uncategorized";
    const amount = toNum(tx.amount);
    if (amount <= 0) continue;

    if (!byMonth.has(month)) byMonth.set(month, new Map());
    const monthMap = byMonth.get(month)!;
    monthMap.set(category, (monthMap.get(category) ?? 0) + amount);
  }

  const rows: MonthlySpendRow[] = [];
  for (const [month, catMap] of byMonth) {
    for (const [category, total] of catMap) {
      rows.push({ month, category, total });
    }
  }

  // Sort deterministically: month desc, category asc
  rows.sort((a, b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category));

  return { byMonth, rows };
}

/**
 * Derives per-category averages across all months present in the spend map.
 * Only considers months where the category had non-zero spend.
 * Returns a map of category → { avgMonthlySpend, monthCount }.
 */
export function computeCategoryAverages(
  byMonth: Map<string, Map<string, number>>,
): Map<string, { avgMonthlySpend: number; monthCount: number }> {
  const categoryTotals = new Map<string, { sum: number; count: number }>();

  for (const catMap of byMonth.values()) {
    for (const [category, total] of catMap) {
      const existing = categoryTotals.get(category) ?? { sum: 0, count: 0 };
      categoryTotals.set(category, { sum: existing.sum + total, count: existing.count + 1 });
    }
  }

  const result = new Map<string, { avgMonthlySpend: number; monthCount: number }>();
  for (const [category, { sum, count }] of categoryTotals) {
    result.set(category, {
      avgMonthlySpend: count > 0 ? sum / count : 0,
      monthCount: count,
    });
  }
  return result;
}

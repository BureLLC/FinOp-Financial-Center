/**
 * Central financial calculation module.
 *
 * All financial formulas used across the dashboard live here.
 * Pages must import from this module instead of duplicating logic.
 *
 * Design rules:
 * - Every function is pure: same inputs → same output, no side effects.
 * - toNum() guards every external value so NaN never propagates.
 * - No Supabase calls, no React, no hardcoded dollar amounts.
 */

// ─── Primitive guard ─────────────────────────────────────────────────────────

/** Safely convert any DB value to a finite number. Returns 0 for null/undefined/NaN/Infinity. */
export function toNum(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface RawTransaction {
  id: string;
  direction: string;
  amount: number | string | null;
  status: string;
  deleted_at: string | null | undefined;
  income_subtype?: string | null;
  transaction_type?: string;
  category?: string | null;
  transaction_date?: string;
  external_transaction_id?: string | null;
  provider?: string | null;
  financial_account_id?: string;
  merchant_name?: string | null;
  description?: string | null;
}

export interface RawAccount {
  id: string;
  account_type: string;
  account_subtype: string | null;
  current_balance: number | string | null;
}

export interface RawPosition {
  id: string;
  asset_type: string;
  last_valuation: number | string | null;
  total_cost_basis: number | string | null;
  unrealized_gain: number | string | null;
  calculated_quantity: number | string | null;
  last_price: number | string | null;
}

export interface RawWriteOff {
  id: string;
  amount: number | string | null;
  deduction_type: string;
  is_verified: boolean;
  tax_year: number;
  expense_date: string;
}

export interface DeductionRule {
  value: string;
  pct: number;
}

export interface RawSavingsGoal {
  id: string;
  current_amount: number | string | null;
  target_amount: number | string | null;
  status: string;
}

// ─── Transaction filters ──────────────────────────────────────────────────────

/**
 * Remove duplicate transactions caused by the same bank being connected twice.
 * Deduplication key: provider + external_transaction_id when both are set.
 * Falls back to a stable fingerprint based on account, date, amount, merchant, description, direction.
 * This prevents duplicates from multiple connections to the same institution.
 */
export function deduplicateTransactions(txs: RawTransaction[]): RawTransaction[] {
  const seen = new Set<string>();
  const result: RawTransaction[] = [];
  for (const tx of txs) {
    let key: string;
    if (tx.external_transaction_id && tx.provider) {
      key = `ext:${tx.provider}:${tx.external_transaction_id}`;
    } else {
      // Fallback dedupe key: normalize fields to handle minor variations
      const accountId = tx.financial_account_id || "";
      const date = tx.transaction_date ? new Date(tx.transaction_date).toISOString().split('T')[0] : "";
      const amount = Math.abs(toNum(tx.amount)).toFixed(2);
      const merchant = (tx.merchant_name || "").trim().toLowerCase().replace(/\s+/g, ' ');
      const desc = (tx.description || "").trim().toLowerCase().replace(/\s+/g, ' ');
      const direction = tx.direction;
      key = `fp:${accountId}:${date}:${amount}:${merchant}:${desc}:${direction}`;
    }
    if (!seen.has(key)) {
      seen.add(key);
      result.push(tx);
    }
  }
  return result;
}

/**
 * Return only posted, non-deleted, deduplicated transactions.
 * This is the canonical set for all financial summaries.
 */
export function activePostedTransactions(txs: RawTransaction[]): RawTransaction[] {
  const posted = txs.filter((tx) => tx.status === "posted" && tx.deleted_at == null);
  return deduplicateTransactions(posted);
}

// ─── Transaction totals ──────────────────────────────────────────────────────

/** Sum all credit (money-in) transactions. */
export function calcTotalIn(txs: RawTransaction[]): number {
  return txs
    .filter((tx) => tx.direction === "credit")
    .reduce((sum, tx) => sum + toNum(tx.amount), 0);
}

/** Sum all debit (money-out) transactions. */
export function calcTotalOut(txs: RawTransaction[]): number {
  return txs
    .filter((tx) => tx.direction === "debit")
    .reduce((sum, tx) => sum + toNum(tx.amount), 0);
}

/** Net = totalIn − totalOut */
export function calcNet(totalIn: number, totalOut: number): number {
  return totalIn - totalOut;
}

// ─── Income ──────────────────────────────────────────────────────────────────

/** Total of all credit transactions (= total income). */
export function calcTotalIncome(txs: RawTransaction[]): number {
  return calcTotalIn(txs);
}

/** Income transactions that have an income_subtype tag. */
export function calcTaggedIncome(txs: RawTransaction[]): number {
  return txs
    .filter((tx) => tx.direction === "credit" && !!tx.income_subtype)
    .reduce((sum, tx) => sum + toNum(tx.amount), 0);
}

/** Income transactions with no income_subtype tag. */
export function calcUntaggedIncome(txs: RawTransaction[]): number {
  return txs
    .filter((tx) => tx.direction === "credit" && !tx.income_subtype)
    .reduce((sum, tx) => sum + toNum(tx.amount), 0);
}

/**
 * Income that counts toward self-employment / estimated tax.
 * W2 salary and bonus are excluded (taxes already withheld by employer).
 * Business, rental, and other income are included.
 */
export function calcTaxableIncomeBase(txs: RawTransaction[]): number {
  const TAX_CONTRIBUTING = new Set(["business", "rental", "other"]);
  return txs
    .filter((tx) => tx.direction === "credit" && TAX_CONTRIBUTING.has(tx.income_subtype ?? ""))
    .reduce((sum, tx) => sum + toNum(tx.amount), 0);
}

// ─── Expenses ────────────────────────────────────────────────────────────────

/** Total of all debit transactions (= total expenses). */
export function calcTotalExpenses(txs: RawTransaction[]): number {
  return calcTotalOut(txs);
}

// ─── Cash flow ────────────────────────────────────────────────────────────────

/** Net cash flow = totalIncome − totalExpenses */
export function calcNetCashFlow(totalIncome: number, totalExpenses: number): number {
  return totalIncome - totalExpenses;
}

// ─── Account-based balance calculations ──────────────────────────────────────

/** Sum of depository/cash account balances (checking + savings + CD). */
export function calcTotalCash(accounts: RawAccount[]): number {
  return accounts
    .filter((a) => {
      const type = (a.account_type ?? "").toLowerCase();
      const sub = (a.account_subtype ?? "").toLowerCase();
      return (
        type === "depository" ||
        type === "cash" ||
        sub === "checking" ||
        sub === "savings" ||
        sub === "cd"
      );
    })
    .reduce((sum, a) => sum + Math.max(toNum(a.current_balance), 0), 0);
}

/** Sum of investment account balances (synced broker accounts). */
export function calcTotalInvestmentsFromAccounts(accounts: RawAccount[]): number {
  return accounts
    .filter((a) => (a.account_type ?? "").toLowerCase() === "investment")
    .reduce((sum, a) => sum + Math.max(toNum(a.current_balance), 0), 0);
}

/** Sum of credit / loan account balances (absolute value = amount owed). */
export function calcTotalLiabilities(accounts: RawAccount[]): number {
  return accounts
    .filter((a) => {
      const type = (a.account_type ?? "").toLowerCase();
      const sub = (a.account_subtype ?? "").toLowerCase();
      return (
        type === "credit" ||
        sub === "loan" ||
        sub === "mortgage" ||
        sub === "line of credit"
      );
    })
    .reduce((sum, a) => sum + Math.abs(toNum(a.current_balance)), 0);
}

/** Net worth = totalCash + totalInvestments − totalLiabilities */
export function calcNetWorth(
  totalCash: number,
  totalInvestments: number,
  totalLiabilities: number,
): number {
  return totalCash + totalInvestments - totalLiabilities;
}

// ─── Position-based investment calculations ───────────────────────────────────

/** Market value of a single position: quantity × lastPrice */
export function calcPositionMarketValue(quantity: number, lastPrice: number): number {
  return toNum(quantity) * toNum(lastPrice);
}

/** Unrealized gain/loss: marketValue − costBasis */
export function calcPositionGainLoss(marketValue: number, costBasis: number): number {
  return toNum(marketValue) - toNum(costBasis);
}

/** Unrealized gain/loss %: gainLoss / costBasis × 100 */
export function calcPositionGainLossPct(gainLoss: number, costBasis: number): number {
  const basis = toNum(costBasis);
  if (basis === 0) return 0;
  return (gainLoss / basis) * 100;
}

/** Sum of last_valuation across all positions. */
export function calcTotalInvestmentsFromPositions(positions: RawPosition[]): number {
  return positions.reduce((sum, pos) => sum + toNum(pos.last_valuation), 0);
}

/** Sum of total_cost_basis across all positions. */
export function calcTotalCostBasis(positions: RawPosition[]): number {
  return positions.reduce((sum, pos) => sum + toNum(pos.total_cost_basis), 0);
}

/** Sum of unrealized_gain across all positions. */
export function calcTotalUnrealizedGainLoss(positions: RawPosition[]): number {
  return positions.reduce((sum, pos) => sum + toNum(pos.unrealized_gain), 0);
}

/**
 * Canonical investment total used on Financial Summary and Net Worth.
 * Prefers the positions table (covers manually-added positions).
 * Falls back to investment account balances (synced broker accounts with no positions).
 */
export function calcTotalInvestments(
  positions: RawPosition[],
  accounts: RawAccount[],
): number {
  const fromPositions = calcTotalInvestmentsFromPositions(positions);
  if (fromPositions > 0) return fromPositions;
  return calcTotalInvestmentsFromAccounts(accounts);
}

// ─── Budget calculations ──────────────────────────────────────────────────────

/**
 * Remaining budget for a category:
 *   remaining = monthlyLimit − actualSpent + adjustmentAmount
 */
export function calcBudgetRemaining(
  monthlyLimit: number,
  actualSpent: number,
  adjustmentAmount: number,
): number {
  return toNum(monthlyLimit) - toNum(actualSpent) + toNum(adjustmentAmount);
}

/** Percentage of budget limit used (0–100+). */
export function calcBudgetUsedPct(actualSpent: number, monthlyLimit: number): number {
  const limit = toNum(monthlyLimit);
  if (limit === 0) return 0;
  return (toNum(actualSpent) / limit) * 100;
}

// ─── Savings calculations ─────────────────────────────────────────────────────

/**
 * Total currently saved across all active goals.
 * Note: this is goal-based savings (manually tracked), not bank account balances.
 */
export function calcTotalSaved(goals: RawSavingsGoal[]): number {
  return goals
    .filter((g) => g.status === "active")
    .reduce((sum, g) => sum + toNum(g.current_amount), 0);
}

/** Sum of target_amount for active goals that have a positive target. */
export function calcTotalTarget(goals: RawSavingsGoal[]): number {
  return goals
    .filter((g) => g.status === "active" && toNum(g.target_amount) > 0)
    .reduce((sum, g) => sum + toNum(g.target_amount), 0);
}

/** Count of active savings goals. */
export function calcActiveGoalsCount(goals: RawSavingsGoal[]): number {
  return goals.filter((g) => g.status === "active").length;
}

/** Progress percentage toward a goal target (capped at 100%). */
export function calcGoalProgressPct(currentAmount: number, targetAmount: number): number {
  const target = toNum(targetAmount);
  if (target === 0) return 0;
  return Math.min((toNum(currentAmount) / target) * 100, 100);
}

// ─── Write-off / tax deduction calculations ────────────────────────────────────

/**
 * Default estimated tax rate used for write-off savings estimates.
 * Exposed as a named constant so pages don't hardcode "0.25".
 */
export const DEFAULT_TAX_RATE = 0.25;

/** Deductible amount after applying the deduction percentage rule. */
export function calcDeductibleAmount(amount: number, deductionPct: number): number {
  return toNum(amount) * (toNum(deductionPct) / 100);
}

/** Sum of all write-off gross amounts (before deduction % rules). */
export function calcTotalWriteOffExpenses(writeOffs: RawWriteOff[]): number {
  return writeOffs.reduce((sum, w) => sum + toNum(w.amount), 0);
}

/**
 * Sum of deductible amounts after applying each type's deduction percentage.
 * Business meals = 50%, all others = 100% by default.
 */
export function calcTotalDeductible(
  writeOffs: RawWriteOff[],
  deductionRules: DeductionRule[],
): number {
  return writeOffs.reduce((sum, w) => {
    const rule = deductionRules.find((r) => r.value === w.deduction_type);
    const pct = rule ? rule.pct : 100;
    return sum + calcDeductibleAmount(toNum(w.amount), pct);
  }, 0);
}

/**
 * Estimated tax savings from write-offs.
 * Uses the provided effective tax rate, defaulting to DEFAULT_TAX_RATE.
 */
export function calcTaxSavingsEstimate(
  totalDeductible: number,
  taxRate: number = DEFAULT_TAX_RATE,
): number {
  return toNum(totalDeductible) * toNum(taxRate);
}

// ─── Full financial summary roll-up ───────────────────────────────────────────

export interface FinancialSummaryInputs {
  /** All transactions — filtering to posted+non-deleted is done internally. */
  transactions: RawTransaction[];
  accounts: RawAccount[];
  positions: RawPosition[];
  /** Pre-computed tax liability from the tax_estimates table (0 if unavailable). */
  estimatedTax: number;
}

export interface FinancialSummaryResult {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  totalCash: number;
  totalInvestments: number;
  totalLiabilities: number;
  netWorth: number;
  totalAssets: number;
  estimatedTax: number;
}

/**
 * Compute the canonical financial summary from raw data.
 * This is the single source of truth for the Financial Summary page
 * and the Dashboard Home KPI cards.
 */
export function calcFinancialSummary(inputs: FinancialSummaryInputs): FinancialSummaryResult {
  const { transactions, accounts, positions, estimatedTax } = inputs;

  const posted = activePostedTransactions(transactions);
  const totalIncome = calcTotalIncome(posted);
  const totalExpenses = calcTotalExpenses(posted);
  const netCashFlow = calcNetCashFlow(totalIncome, totalExpenses);

  const totalCash = calcTotalCash(accounts);
  const totalInvestments = calcTotalInvestments(positions, accounts);
  const totalLiabilities = calcTotalLiabilities(accounts);
  const netWorth = calcNetWorth(totalCash, totalInvestments, totalLiabilities);
  const totalAssets = totalCash + totalInvestments;

  return {
    totalIncome,
    totalExpenses,
    netCashFlow,
    totalCash,
    totalInvestments,
    totalLiabilities,
    netWorth,
    totalAssets,
    estimatedTax: toNum(estimatedTax),
  };
}

// ─── Currency formatting ──────────────────────────────────────────────────────

/** Format a number as USD currency with two decimal places. */
export function fmtUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n ?? 0);
}

/** Format a number as compact USD (e.g. $1.2K, $3.4M). */
export function fmtUSDCompact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n ?? 0);
}

/** Format a gain/loss percentage with leading + sign. */
export function fmtGainLossPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

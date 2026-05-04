/**
 * Canonical Financial Data Layer
 *
 * Single source of truth for all financial pages.
 * Ensures all pages query transactions the same way:
 * - Only from active financial accounts
 * - Only non-deleted transactions
 * - Only from non-deleted accounts
 * - Properly deduplicated
 *
 * This module prevents the inconsistency where different pages
 * use different queries and show conflicting financial totals.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  activePostedTransactions,
  deduplicateTransactions,
  RawTransaction,
  RawWriteOff,
  calcTotalCash,
  calcTotalInvestmentsFromAccounts,
  calcTotalLiabilities,
  calcNetWorth,
  calcTotalWriteOffExpenses,
  calcTotalDeductible,
  toNum,
} from "./financialCalculations";

// ─── Central Transaction Classification Layer ─────────────────────────────────
// These functions define exactly how transaction fields control roll-ups.
// All pages must use these instead of ad-hoc field checks.

const DEDUCTIBLE_CATEGORIES = new Set([
  "business", "home office", "vehicle", "equipment", "software",
  "meals", "travel", "professional services", "advertising",
  "office supplies", "insurance", "utilities",
]);

/** A transaction is business income when it is a credit with business/self-employment income_subtype. */
export function isBusinessIncome(tx: RawTransaction): boolean {
  return (
    tx.direction === "credit" &&
    (tx.income_subtype === "business" || tx.income_subtype === "self-employment") &&
    tx.deleted_at == null
  );
}

/** A transaction is a deductible business expense when it is a debit with a deductible category and is not a transfer or tax payment. */
export function isDeductibleBusinessExpense(tx: RawTransaction): boolean {
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

/** Transfers should not count as income, expenses, write-offs, or tax deductions. */
export function isTransfer(tx: RawTransaction): boolean {
  return (tx.transaction_type ?? "").toLowerCase() === "transfer";
}

/** Tax payments are not deductible unless specifically classified. */
export function isTaxPayment(tx: RawTransaction): boolean {
  return (tx.transaction_type ?? "").toLowerCase() === "tax_payment";
}

export interface FinancialSnapshot {
  transactions: RawTransaction[];
  accounts: FinancialAccount[];
}

export interface FinancialAccount {
  id: string;
  account_type: string;
  account_subtype: string | null;
  current_balance: number | string | null;
  account_name: string;
  institution_name: string | null;
  mask: string | null;
  is_active: boolean;
}

export interface CanonicalAccountBalances {
  /** Bank checking + savings + CD accounts only */
  bankCash: number;
  /** Investment accounts from synced brokerages */
  investmentAccounts: number;
  /** Credit cards + loans + mortgages */
  liabilities: number;
  /** Bank cash + investment accounts - liabilities */
  netWorth: number;
  /** Raw account data for detailed breakdowns */
  accounts: FinancialAccount[];
}

/** Data status for canonical investment result */
export type InvestmentDataStatus =
  | "positions_verified"    // Positions exist and are used for valuation
  | "fallback_used"         // No positions; using account current_balance as fallback
  | "missing_positions"     // Brokerage account exists but no positions and no usable balance
  | "no_brokerage_connection"; // No investment/brokerage accounts found at all

export interface BrokerageAccountBreakdown {
  accountId: string;
  accountName: string;
  institutionName: string | null;
  mask: string | null;
  positionsCount: number;
  positionsValue: number;
  balanceValue: number;
  /** "positions" = positions used; "fallback" = balance used; "missing" = neither */
  valueSource: "positions" | "fallback" | "missing";
}

export interface CanonicalInvestments {
  /** Total investment value (positions if available, else fallback balance) */
  totalInvestmentValue: number;
  /** Value calculated from actual positions/holdings */
  positionsValue: number;
  /** Value from brokerage account current_balance (fallback) */
  fallbackBalanceValue: number;
  /** Number of active brokerage connections */
  brokerageConnectionCount: number;
  /** Number of active investment/brokerage accounts */
  brokerageAccountCount: number;
  /** Number of brokerage accounts that have positions */
  brokerageAccountsWithPositions: number;
  /** Number of brokerage accounts using fallback balance */
  brokerageAccountsUsingFallback: number;
  /** Number of brokerage accounts with no positions and no usable balance */
  brokerageAccountsMissingPositions: number;
  /** Overall data status */
  dataStatus: InvestmentDataStatus;
  /** Warnings for consumers to log or display */
  warnings: string[];
  /** Per-account breakdown for Investment Portfolio page and diagnostics */
  perAccountBreakdown: BrokerageAccountBreakdown[];
  /** Raw position data if available */
  positions: any[];

  // ── Legacy aliases (keep existing consumers working) ──
  /** @deprecated Use positionsValue */
  fromPositions: number;
  /** @deprecated Use fallbackBalanceValue */
  fromAccounts: number;
  /** @deprecated Use totalInvestmentValue */
  total: number;
}

export interface CanonicalWriteOffs {
  /** All write-off records for user */
  writeOffs: RawWriteOff[];
  /** Total amount across all write-offs */
  totalAmount: number;
  /** Total deductible amount (after applying deduction rates) */
  totalDeductible: number;
  /** Breakdown by deduction type */
  byType: Array<{
    type: string;
    count: number;
    totalAmount: number;
    deductibleAmount: number;
    deductionRate: number;
  }>;
}

export interface CanonicalNetWorth {
  /** Active bank/cash account balances */
  bankCash: number;
  /** Active investment account balances */
  investmentAccounts: number;
  /** Active liability balances (credit, loans, mortgages) */
  liabilities: number;
  /** Bank cash + investments - liabilities */
  netWorthValue: number;
  /** Raw account data for detailed breakdown */
  accounts: FinancialAccount[];
}

/**
 * Fetch the canonical transaction dataset.
 *
 * This is the ONLY function pages should use to load transactions.
 * It ensures:
 * 1. Inner join to financial_accounts (validates account is_active)
 * 2. Filters out deleted accounts and transactions
 * 3. Returns raw data; caller applies deduplication and filtering
 *
 * Usage:
 *   const { transactions, accounts } = await getCanonicalTransactions(supabase, userId);
 *   const deduped = deduplicateTransactions(transactions);
 *   const posted = activePostedTransactions(transactions);
 */
export async function getCanonicalTransactions(
  supabase: SupabaseClient,
  userId: string
): Promise<FinancialSnapshot> {
  const [txRes, acctRes] = await Promise.all([
    // Transactions query with inner join to verify accounts are active
    supabase
      .from("transactions")
      .select(
        `id, user_id, financial_account_id, direction, amount, status, deleted_at,
        external_transaction_id, provider, transaction_date, merchant_name, description,
        transaction_type, income_subtype, category, subcategory, currency,
        financial_accounts!inner(id, is_active, deleted_at)`
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .eq("financial_accounts.is_active", true)
      .is("financial_accounts.deleted_at", null)
      .order("transaction_date", { ascending: false }),

    // Accounts query: only active, non-deleted accounts
    supabase
      .from("financial_accounts")
      .select(
        "id, account_type, account_subtype, current_balance, account_name, institution_name, mask, is_active"
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .is("deleted_at", null),
  ]);

  // Flatten the nested account data from the join
  const transactions: RawTransaction[] = (txRes.data ?? []).map((tx: any) => ({
    ...tx,
    // Remove the nested financial_accounts object
    financial_accounts: undefined,
  }));

  const accounts: FinancialAccount[] = acctRes.data ?? [];

  return { transactions, accounts };
}

/**
 * Get the canonical active posted transactions.
 *
 * This applies both status filtering and deduplication.
 * Use this when you need only posted, deduplicated transactions.
 *
 * Usage:
 *   const posted = await getCanonicalActivePostedTransactions(supabase, userId);
 */
export async function getCanonicalActivePostedTransactions(
  supabase: SupabaseClient,
  userId: string
): Promise<RawTransaction[]> {
  const { transactions } = await getCanonicalTransactions(supabase, userId);
  return activePostedTransactions(transactions);
}

/**
 * Get canonical deduplicated transactions (all statuses, not just posted).
 *
 * Use this when you need to see all transactions without duplicates
 * (e.g., transaction list page showing pending + posted).
 *
 * Usage:
 *   const all = await getCanonicalDeduplicatedTransactions(supabase, userId);
 */
export async function getCanonicalDeduplicatedTransactions(
  supabase: SupabaseClient,
  userId: string
): Promise<RawTransaction[]> {
  const { transactions } = await getCanonicalTransactions(supabase, userId);
  return deduplicateTransactions(transactions);
}

/**
 * Get count of tagged income transactions from canonical source.
 *
 * Use this for Tax Center to display count of tagged income transactions.
 * Ensures Tax Center uses the same active-account filter as other financial pages.
 *
 * Usage:
 *   const count = await getCanonicalTaggedIncomeCount(supabase, userId);
 */
export async function getCanonicalTaggedIncomeCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { transactions } = await getCanonicalTransactions(supabase, userId);
  const tagged = transactions.filter((tx) => tx.income_subtype);
  return tagged.length;
}

/**
 * Get debit transactions for write-off association from canonical source.
 *
 * Use this for Write-Offs page to list debit transactions available for
 * write-off record association. Ensures consistency with other financial pages.
 *
 * Usage:
 *   const debits = await getCanonicalDebitTransactions(supabase, userId);
 */
export async function getCanonicalDebitTransactions(
  supabase: SupabaseClient,
  userId: string
): Promise<Array<{ id: string; description: string | null; amount: number | string; transaction_date: string; direction: string }>> {
  const { transactions } = await getCanonicalTransactions(supabase, userId);
  return transactions
    .filter((tx) => tx.direction === "debit")
    .map((tx) => ({
      id: tx.id,
      description: tx.description ?? null,
      amount: tx.amount ?? 0,
      transaction_date: tx.transaction_date ?? "",
      direction: tx.direction,
    }))
    .filter((tx) => tx.transaction_date) // Only include transactions with dates
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, 100);
}

/**
 * Canonical Account Balances Layer
 *
 * Returns active account balances by account class.
 * Critical filters enforce at query-time:
 * - Only from active connected institutions
 * - Only active (is_active = true) accounts
 * - Only non-deleted (deleted_at = null) accounts
 * - No SnapTrade/investment cash mixed into bank cash
 *
 * Strictly separates:
 * - Bank depository (checking, savings, CD)
 * - Investment accounts (synced brokerages)
 * - Liabilities (credit, loans, mortgages)
 *
 * Usage:
 *   const balances = await getCanonicalAccountBalances(supabase, userId);
 *   console.log(`Bank cash: $${balances.bankCash}`);
 *   console.log(`Investments: $${balances.investmentAccounts}`);
 */
export async function getCanonicalAccountBalances(
  supabase: SupabaseClient,
  userId: string
): Promise<CanonicalAccountBalances> {
  const { accounts } = await getCanonicalTransactions(supabase, userId);

  // Calculate balances using the same logic as financialCalculations.ts
  // but from the canonical active-account-only dataset
  const bankCash = calcTotalCash(accounts);
  const investmentAccounts = calcTotalInvestmentsFromAccounts(accounts);
  const liabilities = calcTotalLiabilities(accounts);
  const netWorth = calcNetWorth(bankCash, investmentAccounts, liabilities);

  return {
    bankCash,
    investmentAccounts,
    liabilities,
    netWorth,
    accounts,
  };
}

/**
 * Canonical Investment Source
 *
 * SnapTrade/Fidelity data flows ONLY through this function.
 * It returns investment holdings/valuations but NOT transaction income.
 *
 * Returns:
 * - Investment account balances (synced brokerages)
 * - Investment positions (detailed holdings if available)
 * - Preferred total (positions if available, else accounts)
 *
 * Does NOT return:
 * - Brokerage cash (unless explicitly labeled)
 * - Transaction income/expenses
 * - Bank account cash
 *
 * Usage:
 *   const investments = await getCanonicalInvestments(supabase, userId);
 *   console.log(`Portfolio value: $${investments.total}`);
 */
export async function getCanonicalInvestments(
  supabase: SupabaseClient,
  userId: string
): Promise<CanonicalInvestments> {
  // Fetch active investment/brokerage accounts and positions in parallel
  const [accountsSnapshot, investmentAcctsRes, positionsRes] = await Promise.all([
    getCanonicalAccountBalances(supabase, userId),
    // Only fetch investment-type accounts (not bank/depository/credit)
    supabase
      .from("financial_accounts")
      .select("id, account_type, account_name, institution_name, mask, current_balance")
      .eq("user_id", userId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .eq("account_type", "investment"),
    supabase
      .from("positions")
      .select("id, financial_account_id, asset_type, last_valuation, total_cost_basis, unrealized_gain, calculated_quantity")
      .eq("user_id", userId)
      .is("deleted_at", null),
  ]);

  const investmentAccounts = investmentAcctsRes.data ?? [];
  const investmentAccountIds = new Set(investmentAccounts.map((a: any) => a.id));

  // Only include positions linked to active investment accounts.
  // This excludes cash positions from bank/depository accounts (Plaid cash)
  // which belong in Total Cash, not Investments.
  const positions = (positionsRes.data ?? []).filter(
    (p: any) => p.financial_account_id && investmentAccountIds.has(p.financial_account_id)
  );

  // ── Per-account analysis ──
  const accountsWithPositionIds = new Set(
    positions.map((p: any) => p.financial_account_id)
  );

  // Group positions by account for per-account value calculation
  const positionsByAccount = new Map<string, number>();
  const positionsCountByAccount = new Map<string, number>();
  for (const p of positions) {
    const aid = (p as any).financial_account_id;
    positionsByAccount.set(aid, (positionsByAccount.get(aid) ?? 0) + toNum((p as any).last_valuation));
    positionsCountByAccount.set(aid, (positionsCountByAccount.get(aid) ?? 0) + 1);
  }

  const brokerageAccountCount = investmentAccounts.length;
  let brokerageAccountsWithPositions = 0;
  let brokerageAccountsUsingFallback = 0;
  let brokerageAccountsMissingPositions = 0;
  const perAccountBreakdown: BrokerageAccountBreakdown[] = [];

  for (const acct of investmentAccounts) {
    const acctAny = acct as any;
    const acctBalance = toNum(acctAny.current_balance);
    const acctPositionsValue = positionsByAccount.get(acctAny.id) ?? 0;
    const acctPositionsCount = positionsCountByAccount.get(acctAny.id) ?? 0;

    let valueSource: "positions" | "fallback" | "missing";
    if (accountsWithPositionIds.has(acctAny.id)) {
      brokerageAccountsWithPositions++;
      valueSource = "positions";
    } else if (acctBalance > 0) {
      brokerageAccountsUsingFallback++;
      valueSource = "fallback";
    } else {
      brokerageAccountsMissingPositions++;
      valueSource = "missing";
    }

    perAccountBreakdown.push({
      accountId: acctAny.id,
      accountName: acctAny.account_name,
      institutionName: acctAny.institution_name ?? null,
      mask: acctAny.mask ?? null,
      positionsCount: acctPositionsCount,
      positionsValue: acctPositionsValue,
      balanceValue: acctBalance,
      valueSource,
    });
  }

  // ── Value calculations ──
  const positionsValue = positions.length > 0
    ? positions.reduce((sum: number, p: any) => sum + toNum(p.last_valuation), 0)
    : 0;
  const fallbackBalanceValue = accountsSnapshot.investmentAccounts;

  // Prefer positions if available, fallback to investment account balances
  const totalInvestmentValue = positionsValue > 0 ? positionsValue : fallbackBalanceValue;

  // ── Data status & warnings ──
  const warnings: string[] = [];
  let dataStatus: InvestmentDataStatus;

  if (brokerageAccountCount === 0) {
    dataStatus = "no_brokerage_connection";
  } else if (brokerageAccountsWithPositions > 0) {
    dataStatus = "positions_verified";
    if (brokerageAccountsUsingFallback > 0) {
      warnings.push(
        `${brokerageAccountsUsingFallback} brokerage account(s) using balance fallback — positions not yet synced`
      );
    }
    if (brokerageAccountsMissingPositions > 0) {
      warnings.push(
        `${brokerageAccountsMissingPositions} brokerage account(s) have no positions and no usable balance`
      );
    }
  } else if (brokerageAccountsUsingFallback > 0) {
    dataStatus = "fallback_used";
    warnings.push(
      `No positions synced for ${brokerageAccountCount} brokerage account(s) — using account balance as temporary fallback`
    );
  } else {
    dataStatus = "missing_positions";
    warnings.push(
      `${brokerageAccountCount} brokerage account(s) connected but no positions or usable balance found — sync may have failed`
    );
  }

  // Count active brokerage connections
  const connectionsRes = await supabase
    .from("integration_connections")
    .select("id")
    .eq("user_id", userId)
    .eq("provider", "snaptrade")
    .neq("status", "deleted");
  const brokerageConnectionCount = (connectionsRes.data ?? []).length;

  return {
    totalInvestmentValue,
    positionsValue,
    fallbackBalanceValue,
    brokerageConnectionCount,
    brokerageAccountCount,
    brokerageAccountsWithPositions,
    brokerageAccountsUsingFallback,
    brokerageAccountsMissingPositions,
    dataStatus,
    warnings,
    perAccountBreakdown,
    positions,
    // Legacy aliases
    fromPositions: positionsValue,
    fromAccounts: fallbackBalanceValue,
    total: totalInvestmentValue,
  };
}

/**
 * Canonical Write-Offs Source
 *
 * Returns all write-off records for the user with calculated totals.
 * Enforces:
 * - User scope (filters by user_id)
 * - Tax year filtering
 * - Deductibility calculations (applies deduction rates)
 *
 * Usage:
 *   const writeOffs = await getCanonicalWriteOffs(supabase, userId, taxYear);
 *   console.log(`Total deductible: $${writeOffs.totalDeductible}`);
 */
export async function getCanonicalWriteOffs(
  supabase: SupabaseClient,
  userId: string,
  taxYear: number
): Promise<CanonicalWriteOffs> {
  const res = await supabase
    .from("write_offs")
    .select("id, amount, deduction_type, is_verified, tax_year, expense_date")
    .eq("user_id", userId)
    .eq("tax_year", taxYear);

  const writeOffs: RawWriteOff[] = res.data ?? [];

  // Define deduction rates by type (must match DEDUCTION_TYPES in pages)
  const deductionRates: Record<string, number> = {
    home_office: 100,
    vehicle: 100,
    equipment: 100,
    software: 100,
    meals: 50,
    travel: 100,
    marketing: 100,
    professional: 100,
    education: 100,
    other: 100,
  };

  // Calculate totals
  const totalAmount = calcTotalWriteOffExpenses(writeOffs);
  
  // Build deduction rules for calculation
  const deductionRules = Object.entries(deductionRates).map(([type, pct]) => ({
    value: type,
    pct,
  }));
  
  const totalDeductible = calcTotalDeductible(writeOffs, deductionRules);

  // Breakdown by type
  const byType = Object.entries(deductionRates).map(([type, rate]) => {
    const items = writeOffs.filter((w) => w.deduction_type === type);
    const typeTotal = items.reduce((sum, w) => sum + toNum(w.amount), 0);
    const deductibleAmount = typeTotal * (rate / 100);
    return {
      type,
      count: items.length,
      totalAmount: typeTotal,
      deductibleAmount,
      deductionRate: rate,
    };
  }).filter((d) => d.totalAmount > 0);

  return {
    writeOffs,
    totalAmount,
    totalDeductible,
    byType,
  };
}

/**
 * Canonical Net Worth Source
 *
 * Explicitly calculates Net Worth from canonical sources.
 * Net Worth = Active Bank Cash + Active Investments - Active Liabilities
 *
 * Ensures:
 * - Only active, non-deleted accounts count
 * - Brokerage accounts are separated from bank cash
 * - Liabilities are properly classified
 * - Multi-user isolation (user_id scoped)
 *
 * Usage:
 *   const netWorth = await getCanonicalNetWorth(supabase, userId);
 *   console.log(`Net worth: $${netWorth.netWorthValue}`);
 */
export async function getCanonicalNetWorth(
  supabase: SupabaseClient,
  userId: string
): Promise<CanonicalNetWorth> {
  const balances = await getCanonicalAccountBalances(supabase, userId);

  return {
    bankCash: balances.bankCash,
    investmentAccounts: balances.investmentAccounts,
    liabilities: balances.liabilities,
    netWorthValue: balances.netWorth,
    accounts: balances.accounts,
  };
}

/**
 * Canonical Transaction-Based Write-Offs Source
 *
 * Auto-generates write-off entries from transactions tagged as
 * business/self-employment expenses that are deductible.
 *
 * Returns eligible deductible transactions that could become write-offs,
 * excluding:
 * - personal expenses
 * - non-deductible categories
 * - deleted transactions
 * - transactions from disconnected/inactive accounts
 *
 * Usage:
 *   const txWriteOffs = await getCanonicalTransactionBasedWriteOffs(supabase, userId, taxYear);
 */
export async function getCanonicalTransactionBasedWriteOffs(
  supabase: SupabaseClient,
  userId: string,
  taxYear: number
): Promise<RawTransaction[]> {
  const { transactions } = await getCanonicalTransactions(supabase, userId);

  // Filter to deductible business expense transactions using central classification
  const deductibleExpenses = activePostedTransactions(transactions).filter(
    (tx) => isDeductibleBusinessExpense(tx) && tx.transaction_date
  );

  // Filter to transactions in the requested tax year
  return deductibleExpenses.filter((tx) => {
    const txYear = tx.transaction_date ? new Date(tx.transaction_date).getFullYear() : 0;
    return txYear === taxYear;
  });
}

/**
 * Canonical Combined Write-Offs Source
 *
 * Returns both manual and transaction-based write-offs for a given tax year.
 * Combines:
 * - Manual write-off entries from write_offs table
 * - Auto-eligible transaction-based write-offs from business expenses
 *
 * Usage:
 *   const allWriteOffs = await getCanonicalCombinedWriteOffs(supabase, userId, taxYear);
 */
export async function getCanonicalCombinedWriteOffs(
  supabase: SupabaseClient,
  userId: string,
  taxYear: number
): Promise<{
  manual: RawWriteOff[];
  transactionBased: RawTransaction[];
  combined: Array<RawWriteOff | RawTransaction>;
  totalAmount: number;
  totalDeductible: number;
}> {
  const [manualRes, txBased] = await Promise.all([
    supabase
      .from("write_offs")
      .select("id, amount, deduction_type, is_verified, tax_year, expense_date, transaction_id")
      .eq("user_id", userId)
      .eq("tax_year", taxYear),
    getCanonicalTransactionBasedWriteOffs(supabase, userId, taxYear),
  ]);

  const manual: RawWriteOff[] = manualRes.data ?? [];

  // Deduction rates
  const deductionRates: Record<string, number> = {
    home_office: 100,
    vehicle: 100,
    equipment: 100,
    software: 100,
    meals: 50,
    travel: 100,
    marketing: 100,
    professional: 100,
    education: 100,
    other: 100,
  };

  // For transaction-based, default to "other" category (100% deductible) if not specified
  const combined = [...manual, ...txBased];

  // Calculate totals
  let totalAmount = 0;
  let totalDeductible = 0;

  for (const item of combined) {
    const amount = toNum(item.amount);
    totalAmount += amount;

    if ("deduction_type" in item) {
      // Manual write-off
      const rate = deductionRates[item.deduction_type] ?? 100;
      totalDeductible += amount * (rate / 100);
    } else {
      // Transaction-based - assume 100% deductible (user already tagged as business)
      totalDeductible += amount;
    }
  }

  return {
    manual,
    transactionBased: txBased,
    combined,
    totalAmount,
    totalDeductible,
  };
}

/**
 * Canonical Realized Gains Source
 *
 * Returns closed/realized trading positions with gains/losses.
 * Filters to closed positions only (not open/unrealized).
 *
 * Does NOT include unrealized gains which should not be taxed.
 *
 * Usage:
 *   const realized = await getCanonicalRealizedGains(supabase, userId, taxYear);
 */
export async function getCanonicalRealizedGains(
  supabase: SupabaseClient,
  userId: string,
  taxYear: number
): Promise<any[]> {
  const res = await supabase
    .from("trades")
    .select("id, symbol, entry_price, exit_price, quantity, entry_date, exit_date, realized_pnl, notes, status")
    .eq("user_id", userId)
    .eq("status", "closed") // Only closed/realized
    .not("exit_date", "is", null)
    .order("exit_date", { ascending: false });

  const trades = res.data ?? [];

  // Filter to transactions in the requested tax year
  return trades.filter((t) => {
    const exitYear = t.exit_date ? new Date(t.exit_date).getFullYear() : 0;
    return exitYear === taxYear;
  });
}

/**
 * Canonical Taxable Income Source
 *
 * Calculates taxable business income as:
 * Business Taxable Profit = Business Income - Deductible Business Expenses
 *
 * Includes:
 * - Tagged business/self-employment income transactions
 * - Minus manual write-offs
 * - Minus transaction-based deductible expenses
 *
 * Excludes:
 * - Personal expenses
 * - Non-deductible expenses
 * - Transfers
 * - Deleted transactions
 * - Transactions from disconnected/inactive accounts
 * - Pending transactions (uses posted only)
 *
 * Usage:
 *   const taxable = await getCanonicalTaxableIncome(supabase, userId, taxYear);
 */
export async function getCanonicalTaxableIncome(
  supabase: SupabaseClient,
  userId: string,
  taxYear: number
): Promise<{
  businessIncome: number;
  deductibleExpenses: number;
  taxableProfit: number;
}> {
  const [postedTxs, writeOffs] = await Promise.all([
    getCanonicalActivePostedTransactions(supabase, userId),
    getCanonicalCombinedWriteOffs(supabase, userId, taxYear),
  ]);

  // Business income from transactions tagged as business/self-employment income
  const businessIncome = postedTxs
    .filter((tx) => isBusinessIncome(tx))
    .reduce((sum, tx) => sum + toNum(tx.amount), 0);

  // Also include deductible expenses directly from transactions (not just manual write-offs)
  // This ensures tagging a transaction as Business category immediately affects tax
  const txBasedDeductible = postedTxs
    .filter((tx) => isDeductibleBusinessExpense(tx) && tx.transaction_date)
    .filter((tx) => {
      const txYear = new Date(tx.transaction_date!).getFullYear();
      return txYear === taxYear;
    })
    .reduce((sum, tx) => sum + Math.abs(toNum(tx.amount)), 0);

  // Use the greater of manual write-offs or transaction-based deductible expenses
  // to avoid double-counting while ensuring tagged transactions are reflected
  const deductibleExpenses = Math.max(writeOffs.totalDeductible, txBasedDeductible);
  const taxableProfit = Math.max(businessIncome - deductibleExpenses, 0);

  return {
    businessIncome,
    deductibleExpenses,
    taxableProfit,
  };
}

/**
 * Canonical Budget Savings Source
 *
 * Returns all budget categories marked as 'savings' type.
 * These are user-created savings categories within the budget system.
 *
 * Excludes:
 * - Inactive categories (is_active = false)
 * - Expense categories
 * - Income categories
 * - Deleted budget records
 *
 * Usage:
 *   const savingsCategories = await getCanonicalBudgetSavings(supabase, userId);
 */
export async function getCanonicalBudgetSavings(
  supabase: SupabaseClient,
  userId: string
): Promise<any[]> {
  const res = await supabase
    .from("budget_categories")
    .select("id, user_id, name, description, parent_category_id, category_type, monthly_limit, is_active, created_at, updated_at")
    .eq("user_id", userId)
    .eq("category_type", "savings")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return res.data ?? [];
}

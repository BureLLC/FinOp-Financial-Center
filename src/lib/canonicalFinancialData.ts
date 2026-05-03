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
  calcTotalCash,
  calcTotalInvestmentsFromAccounts,
  calcTotalLiabilities,
  calcNetWorth,
  toNum,
} from "./financialCalculations";

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

export interface CanonicalInvestments {
  /** Total from investment accounts (synced broker positions) */
  fromAccounts: number;
  /** Total from investment positions (detailed holdings) */
  fromPositions: number;
  /** Preferred value (positions if available, else accounts) */
  total: number;
  /** Raw position data if available */
  positions: any[];
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
  const [accountsSnapshot, positionsRes] = await Promise.all([
    getCanonicalAccountBalances(supabase, userId),
    supabase
      .from("investment_positions")
      .select("id, asset_type, last_valuation, total_cost_basis, unrealized_gain, calculated_quantity")
      .eq("user_id", userId)
      .is("deleted_at", null),
  ]);

  const positions = positionsRes.data ?? [];
  const fromAccounts = accountsSnapshot.investmentAccounts;

  // Calculate total from positions if available
  let fromPositions = 0;
  if (positions.length > 0) {
    fromPositions = positions.reduce((sum: number, p: any) => sum + toNum(p.last_valuation), 0);
  }

  // Prefer positions if available, fallback to accounts
  const total = fromPositions > 0 ? fromPositions : fromAccounts;

  return {
    fromAccounts,
    fromPositions,
    total,
    positions,
  };
}

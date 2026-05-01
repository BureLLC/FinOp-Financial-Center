import { createSupabaseAdmin, deleteRowsByUserId, ensureE2ETestUser, type E2ETestUser } from "../helpers/supabase-admin";

export type DashboardSeed = {
  user: E2ETestUser;
  accountId: string;
  investmentAccountId: string;
  salaryTransactionId: string;
  selfEmployedTransactionId: string;
  businessTransactionId: string;
  expenseTransactionId: string;
  budgetCategoryId: string;
  savingsGoalId: string;
  writeOffId: string;
  positionId: string;
};

const TEST_DATE = "2026-04-15";
const TEST_MONTH_START = "2026-04-01";
const TEST_MONTH_END = "2026-04-30";
const TEST_TAX_YEAR = 2026;

async function insertOne<T>(tableName: string, values: Record<string, unknown>): Promise<T> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from(tableName).insert(values).select("*").single();
  if (error) throw new Error(`Failed to insert ${tableName}: ${error.message}`);
  return data as T;
}

export async function cleanupDashboardSeed(userId: string) {
  const tables = [
    "envelope_transactions",
    "envelopes",
    "budget_records",
    "budget_categories",
    "write_offs",
    "savings_goals",
    "positions",
    "tax_estimates",
    "transactions",
    "financial_accounts",
  ];

  for (const table of tables) {
    try {
      await deleteRowsByUserId(table, userId);
    } catch (error) {
      // Some environments may not have every optional dashboard table yet.
      // Surface the warning without hiding failures in the actual test assertions.
      console.warn(error);
    }
  }
}

export async function seedDashboardData(): Promise<DashboardSeed> {
  const user = await ensureE2ETestUser();
  await cleanupDashboardSeed(user.id);

  const checking = await insertOne<{ id: string }>("financial_accounts", {
    user_id: user.id,
    account_name: "E2E Checking",
    account_type: "depository",
    account_subtype: "checking",
    current_balance: 10000,
    institution_name: "E2E Bank",
    mask: "0001",
    provider: "e2e",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const brokerage = await insertOne<{ id: string }>("financial_accounts", {
    user_id: user.id,
    account_name: "E2E Brokerage",
    account_type: "investment",
    account_subtype: "brokerage",
    current_balance: 0,
    institution_name: "E2E Brokerage",
    mask: "0002",
    provider: "snaptrade",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const salary = await insertOne<{ id: string }>("transactions", {
    user_id: user.id,
    financial_account_id: checking.id,
    transaction_type: "income",
    direction: "credit",
    status: "posted",
    income_subtype: "salary",
    amount: 5000,
    currency: "USD",
    description: "E2E Salary Paycheck",
    merchant_name: "E2E Employer",
    category: "Income",
    subcategory: "Salary",
    transaction_date: TEST_DATE,
    provider: "e2e",
    external_transaction_id: "e2e-salary-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const selfEmployed = await insertOne<{ id: string }>("transactions", {
    user_id: user.id,
    financial_account_id: checking.id,
    transaction_type: "income",
    direction: "credit",
    status: "posted",
    income_subtype: "business",
    amount: 2000,
    currency: "USD",
    description: "E2E Self Employed Consulting",
    merchant_name: "E2E Client A",
    category: "Income",
    subcategory: "Self Employment",
    transaction_date: TEST_DATE,
    provider: "e2e",
    external_transaction_id: "e2e-self-employed-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const business = await insertOne<{ id: string }>("transactions", {
    user_id: user.id,
    financial_account_id: checking.id,
    transaction_type: "income",
    direction: "credit",
    status: "posted",
    income_subtype: "business",
    amount: 3000,
    currency: "USD",
    description: "E2E Business Revenue",
    merchant_name: "E2E Client B",
    category: "Income",
    subcategory: "Business",
    transaction_date: TEST_DATE,
    provider: "e2e",
    external_transaction_id: "e2e-business-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const expense = await insertOne<{ id: string }>("transactions", {
    user_id: user.id,
    financial_account_id: checking.id,
    transaction_type: "bank",
    direction: "debit",
    status: "posted",
    income_subtype: null,
    amount: 400,
    currency: "USD",
    description: "E2E Office Supplies",
    merchant_name: "E2E Office Store",
    category: "Business",
    subcategory: "Office Supplies",
    transaction_date: TEST_DATE,
    provider: "e2e",
    external_transaction_id: "e2e-expense-001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const budgetCategory = await insertOne<{ id: string }>("budget_categories", {
    user_id: user.id,
    name: "Business",
    description: "E2E business budget",
    category_type: "expense",
    monthly_limit: 1000,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await insertOne("budget_records", {
    user_id: user.id,
    category_id: budgetCategory.id,
    budget_amount: 1000,
    actual_spent: 400,
    adjustment_amount: 0,
    variance: 600,
    status: "active",
    start_date: TEST_MONTH_START,
    end_date: TEST_MONTH_END,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await insertOne("envelopes", {
    user_id: user.id,
    name: "E2E Envelope",
    description: "E2E envelope budget",
    budgeted_amount: 600,
    spent_amount: 100,
    period_type: "monthly",
    color_index: 0,
    is_active: true,
    total_stuffed_alltime: 600,
    total_spent_alltime: 100,
    last_reset_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const savingsGoal = await insertOne<{ id: string }>("savings_goals", {
    user_id: user.id,
    name: "E2E Emergency Fund",
    description: "E2E savings goal",
    target_amount: 5000,
    current_amount: 1500,
    cumulative_amount: 1500,
    monthly_target: 500,
    goal_type: "one_time",
    start_date: TEST_MONTH_START,
    target_date: "2026-12-31",
    last_reset_at: null,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const writeOff = await insertOne<{ id: string }>("write_offs", {
    user_id: user.id,
    category: "Business Meals",
    description: "E2E client meal",
    amount: 200,
    expense_date: TEST_DATE,
    tax_year: TEST_TAX_YEAR,
    deduction_type: "meals",
    is_verified: true,
    notes: "E2E 50 percent deductible meal",
    transaction_id: expense.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const position = await insertOne<{ id: string }>("positions", {
    user_id: user.id,
    financial_account_id: brokerage.id,
    asset_symbol: "E2E",
    asset_name: "E2E Test Equity",
    asset_type: "equity",
    calculated_quantity: 10,
    average_cost_basis: 80,
    total_cost_basis: 800,
    last_price: 100,
    last_valuation: 1000,
    unrealized_gain: 200,
    currency: "USD",
    is_short: false,
    last_price_updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await insertOne("tax_estimates", {
    user_id: user.id,
    period_type: "annual",
    tax_year: TEST_TAX_YEAR,
    total_tax_liability: 1250,
    calculated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return {
    user,
    accountId: checking.id,
    investmentAccountId: brokerage.id,
    salaryTransactionId: salary.id,
    selfEmployedTransactionId: selfEmployed.id,
    businessTransactionId: business.id,
    expenseTransactionId: expense.id,
    budgetCategoryId: budgetCategory.id,
    savingsGoalId: savingsGoal.id,
    writeOffId: writeOff.id,
    positionId: position.id,
  };
}

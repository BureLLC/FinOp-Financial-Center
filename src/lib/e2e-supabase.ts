type RecordValue = string | number | boolean | null | undefined;

type TableRow = Record<string, RecordValue>;
type DbState = Record<string, TableRow[]>;

type Filter = {
  column: string;
  op: "eq" | "is";
  value: RecordValue;
};

const STORAGE_KEY = "finops:e2e:db";
const TEST_USER_ID = "e2e-user-001";

const baseState: DbState = {
  transactions: [
    {
      id: "tx-w2-001",
      user_id: TEST_USER_ID,
      financial_account_id: "acct-checking-001",
      transaction_type: "income",
      direction: "credit",
      status: "posted",
      income_subtype: "salary",
      amount: 5000,
      currency: "USD",
      description: "ACME Payroll",
      merchant_name: "ACME Payroll",
      category: "Income",
      subcategory: "Salary",
      transaction_date: "2026-04-05",
      provider: "e2e",
      external_transaction_id: "ext-w2-001",
      deleted_at: null,
    },
    {
      id: "tx-business-001",
      user_id: TEST_USER_ID,
      financial_account_id: "acct-checking-001",
      transaction_type: "income",
      direction: "credit",
      status: "posted",
      income_subtype: "business",
      amount: 2500,
      currency: "USD",
      description: "Client Retainer",
      merchant_name: "Client Retainer",
      category: "Business",
      subcategory: "Consulting",
      transaction_date: "2026-04-08",
      provider: "e2e",
      external_transaction_id: "ext-business-001",
      deleted_at: null,
    },
    {
      id: "tx-grocery-001",
      user_id: TEST_USER_ID,
      financial_account_id: "acct-checking-001",
      transaction_type: "bank",
      direction: "debit",
      status: "posted",
      income_subtype: null,
      amount: 300,
      currency: "USD",
      description: "Grocery Store",
      merchant_name: "Grocery Store",
      category: "Groceries",
      subcategory: "Food",
      transaction_date: "2026-04-10",
      provider: "e2e",
      external_transaction_id: "ext-grocery-001",
      deleted_at: null,
    },
    {
      id: "tx-meal-001",
      user_id: TEST_USER_ID,
      financial_account_id: "acct-checking-001",
      transaction_type: "bank",
      direction: "debit",
      status: "posted",
      income_subtype: null,
      amount: 200,
      currency: "USD",
      description: "Business Meal",
      merchant_name: "Business Meal",
      category: "Meals",
      subcategory: "Business",
      transaction_date: "2026-04-11",
      provider: "e2e",
      external_transaction_id: "ext-meal-001",
      deleted_at: null,
    },
  ],
  financial_accounts: [
    {
      id: "acct-checking-001",
      user_id: TEST_USER_ID,
      account_name: "E2E Checking",
      account_type: "depository",
      account_subtype: "checking",
      current_balance: 8000,
      mask: "0001",
      institution_name: "E2E Bank",
      is_active: true,
      deleted_at: null,
    },
    {
      id: "acct-savings-001",
      user_id: TEST_USER_ID,
      account_name: "E2E Savings",
      account_type: "depository",
      account_subtype: "savings",
      current_balance: 2500,
      mask: "0002",
      institution_name: "E2E Bank",
      is_active: true,
      deleted_at: null,
    },
    {
      id: "acct-investment-001",
      user_id: TEST_USER_ID,
      account_name: "E2E Brokerage",
      account_type: "investment",
      account_subtype: "brokerage",
      current_balance: 4200,
      mask: "0003",
      institution_name: "E2E Brokerage",
      is_active: true,
      deleted_at: null,
    },
    {
      id: "acct-card-001",
      user_id: TEST_USER_ID,
      account_name: "E2E Credit Card",
      account_type: "credit",
      account_subtype: "credit card",
      current_balance: -700,
      mask: "0004",
      institution_name: "E2E Card",
      is_active: true,
      deleted_at: null,
    },
  ],
  tax_estimates: [
    {
      id: "tax-2026-001",
      user_id: TEST_USER_ID,
      period_type: "annual",
      tax_year: 2026,
      total_tax_liability: 625,
      calculated_at: "2026-04-15T12:00:00.000Z",
      deleted_at: null,
    },
  ],
  savings_goals: [
    {
      id: "goal-001",
      user_id: TEST_USER_ID,
      name: "Emergency Fund",
      current_amount: 2500,
      target_amount: 10000,
      status: "active",
      deleted_at: null,
    },
  ],
  write_offs: [
    {
      id: "writeoff-meal-001",
      user_id: TEST_USER_ID,
      transaction_id: "tx-meal-001",
      tax_year: 2026,
      amount: 200,
      deductible_amount: 100,
      deduction_percentage: 50,
      category: "Meals",
      verified: true,
      deleted_at: null,
    },
  ],
  investment_positions: [
    {
      id: "position-001",
      user_id: TEST_USER_ID,
      financial_account_id: "acct-investment-001",
      symbol: "E2E",
      quantity: 20,
      current_price: 100,
      market_value: 2000,
      status: "open",
      deleted_at: null,
    },
  ],
  financial_connections: [
    {
      id: "connection-001",
      user_id: TEST_USER_ID,
      provider: "plaid",
      institution_name: "E2E Bank",
      status: "connected",
      deleted_at: null,
    },
  ],
};

function cloneState(state: DbState): DbState {
  return JSON.parse(JSON.stringify(state));
}

function getState(): DbState {
  if (typeof window === "undefined") return cloneState(baseState);
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seeded = cloneState(baseState);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(stored) as DbState;
  } catch {
    const seeded = cloneState(baseState);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function setState(state: DbState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function matchesFilters(row: TableRow, filters: Filter[]) {
  return filters.every((filter) => {
    if (filter.op === "eq") return row[filter.column] === filter.value;
    if (filter.op === "is") return row[filter.column] === filter.value;
    return true;
  });
}

class QueryBuilder {
  private filters: Filter[] = [];
  private orderColumn: string | null = null;
  private ascending = true;
  private limitCount: number | null = null;
  private updatePayload: TableRow | null = null;
  private insertPayload: TableRow[] | null = null;
  private wantsSingle = false;

  constructor(private tableName: string) {}

  select() { return this; }

  eq(column: string, value: RecordValue) {
    this.filters.push({ column, op: "eq", value });
    return this;
  }

  is(column: string, value: RecordValue) {
    this.filters.push({ column, op: "is", value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderColumn = column;
    this.ascending = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  maybeSingle() {
    this.wantsSingle = true;
    return this.execute();
  }

  single() {
    this.wantsSingle = true;
    return this.execute();
  }

  update(payload: TableRow) {
    this.updatePayload = payload;
    return this;
  }

  insert(payload: TableRow | TableRow[]) {
    this.insertPayload = Array.isArray(payload) ? payload : [payload];
    return this;
  }

  upsert(payload: TableRow | TableRow[]) {
    this.insertPayload = Array.isArray(payload) ? payload : [payload];
    return this;
  }

  delete() {
    this.updatePayload = { deleted_at: new Date().toISOString() };
    return this;
  }

  then(resolve: (value: { data: unknown; error: null }) => void, reject?: (reason: unknown) => void) {
    this.execute().then(resolve, reject);
  }

  private async execute(): Promise<{ data: unknown; error: null }> {
    const state = getState();
    const rows = state[this.tableName] ?? [];

    if (this.insertPayload) {
      const inserted = this.insertPayload.map((row) => ({ ...row, id: row.id ?? `${this.tableName}-${Date.now()}-${Math.random()}` }));
      state[this.tableName] = [...rows, ...inserted];
      setState(state);
      return { data: inserted, error: null };
    }

    if (this.updatePayload) {
      const updatedRows = rows.map((row) => matchesFilters(row, this.filters) ? { ...row, ...this.updatePayload } : row);
      state[this.tableName] = updatedRows;
      setState(state);
      const updated = updatedRows.filter((row) => matchesFilters(row, this.filters));
      return { data: updated, error: null };
    }

    let result = rows.filter((row) => matchesFilters(row, this.filters));

    if (this.orderColumn) {
      const column = this.orderColumn;
      result = [...result].sort((a, b) => {
        const left = a[column];
        const right = b[column];
        const cmp = String(left ?? "").localeCompare(String(right ?? ""));
        return this.ascending ? cmp : -cmp;
      });
    }

    if (this.limitCount !== null) result = result.slice(0, this.limitCount);

    if (this.wantsSingle) return { data: result[0] ?? null, error: null };
    return { data: result, error: null };
  }
}

export function createE2ESupabaseClient() {
  return {
    auth: {
      async getSession() {
        return { data: { session: { user: { id: TEST_USER_ID, email: "e2e@example.com" } } }, error: null };
      },
      async getUser() {
        return { data: { user: { id: TEST_USER_ID, email: "e2e@example.com" } }, error: null };
      },
      async signOut() {
        return { error: null };
      },
    },
    from(tableName: string) {
      return new QueryBuilder(tableName);
    },
  };
}

export const E2E_STORAGE_KEY = STORAGE_KEY;
export const E2E_BASE_STATE = baseState;

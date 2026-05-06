import { NextResponse } from "next/server";
import { createRouteClient } from "../../../../src/lib/automation/serverSupabase";
import { buildMonthlyCategorySpend, computeCutoffDate } from "../../../../src/lib/budget/spendingSummaryEngine";
import type { RawTransaction } from "../../../../src/lib/financialCalculations";

// Read-only budget spending summary.
// Queries the authenticated user's own posted debit transactions and returns
// monthly spending grouped by category.
//
// Never writes to: transactions, accounts, budgets, tax values, or any financial field.
// User isolation: explicit user_id filter + RLS on transactions table.

const SUMMARY_MONTHS_BACK = 6;

export async function GET() {
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cutoffDate = computeCutoffDate(SUMMARY_MONTHS_BACK);

  // Fetch posted debit transactions for this user within the analysis window.
  // Transfers excluded at DB level; isExcludedFromSpendingSummary provides belt-and-suspenders.
  const { data: txRows, error } = await supabase
    .from("transactions")
    .select(
      "id, direction, amount, status, deleted_at, transaction_type, category, transaction_date",
    )
    .eq("user_id", userId)
    .eq("direction", "debit")
    .neq("transaction_type", "transfer")
    .is("deleted_at", null)
    .eq("status", "posted")
    .gte("transaction_date", cutoffDate)
    .limit(2000);

  if (error) {
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
  }

  const { rows } = buildMonthlyCategorySpend(
    (txRows ?? []) as unknown as RawTransaction[],
    SUMMARY_MONTHS_BACK,
  );

  return NextResponse.json({ summary: rows, monthsBack: SUMMARY_MONTHS_BACK });
}

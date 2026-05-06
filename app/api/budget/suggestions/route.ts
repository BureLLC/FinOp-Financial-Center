import { NextResponse } from "next/server";
import { createRouteClient } from "../../../../src/lib/automation/serverSupabase";
import { BUDGET_AUTOMATION_ENABLED } from "../../../../src/lib/automation/constants";
import { generateAndStoreBudgetSuggestions } from "../../../../src/lib/budget/budgetSuggestionEngine";

// Budget suggestions endpoint.
// Returns empty while BUDGET_AUTOMATION_ENABLED is false.
// When enabled: generates + deduplicates suggestions from historical spending,
// then returns all pending suggestions for the authenticated user.
//
// Never writes to: transactions, accounts, tax values, or any financial field.
// Writes only to: budget_suggestions (via generateAndStoreBudgetSuggestions).
// User isolation: explicit user_id filter + RLS on budget_suggestions table.

export async function GET() {
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!BUDGET_AUTOMATION_ENABLED) {
    return NextResponse.json({ suggestions: [] });
  }

  // Generate and store new suggestions (idempotent — dedup index prevents duplicates).
  await generateAndStoreBudgetSuggestions(userId, supabase);

  const { data: suggestions, error } = await supabase
    .from("budget_suggestions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("confidence", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load suggestions" }, { status: 500 });
  }

  return NextResponse.json({ suggestions: suggestions ?? [] });
}

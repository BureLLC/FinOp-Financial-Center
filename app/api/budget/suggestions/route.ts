import { NextResponse } from "next/server";
import { createRouteClient } from "../../../../src/lib/automation/serverSupabase";
import { BUDGET_AUTOMATION_ENABLED } from "../../../../src/lib/automation/constants";

// Read-only budget suggestions endpoint.
// Returns empty while BUDGET_AUTOMATION_ENABLED is false (PR A).
// When enabled (PR B), returns pending budget suggestions for the authenticated user.
//
// Never writes to: transactions, accounts, budgets, tax values, or any financial field.
// User isolation: explicit user_id filter + RLS on budget_suggestions table.

export async function GET() {
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Flag guard: return empty list while budget automation is not yet enabled.
  // Generation is not wired until PR B — this prevents empty table queries
  // from surfacing partial state during the foundation phase.
  if (!BUDGET_AUTOMATION_ENABLED) {
    return NextResponse.json({ suggestions: [] });
  }

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

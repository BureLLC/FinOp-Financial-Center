import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "../../../../../../src/lib/automation/serverSupabase";

// POST /api/budget/suggestions/[id]/accept
//
// Accepts a pending budget suggestion by delegating to the apply_budget_suggestion RPC.
// The RPC atomically:
//   - verifies ownership and pending status
//   - upserts budget_categories.monthly_limit (never writes transaction or balance fields)
//   - marks suggestion accepted with resolved_at / resolved_by
//
// Never writes: transactions, account balances, tax values, write-off totals,
//               Plaid/SnapTrade fields, or any financial source-of-truth table.
// User isolation: explicit user_id filter + ownership verified inside RPC.

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership before delegating to RPC.
  const { data: suggestion } = await supabase
    .from("budget_suggestions")
    .select("id, user_id, status")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!suggestion) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (suggestion.status !== "pending") {
    return NextResponse.json({ error: "Suggestion is not pending" }, { status: 400 });
  }

  // Atomic RPC: upserts budget_categories + marks suggestion accepted in one transaction.
  const { error } = await supabase.rpc("apply_budget_suggestion", {
    p_suggestion_id: id,
    p_user_id: userId,
  });

  if (error) {
    const isAuth = error.message?.includes("Unauthorized");
    const status = isAuth ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ success: true });
}

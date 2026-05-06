import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "../../../../../../src/lib/automation/serverSupabase";

// POST /api/budget/suggestions/[id]/reject
//
// Rejects a pending budget suggestion with an optional rejection reason.
// Rejected suggestions are excluded from future generation for the same user + category
// (the generation engine's dedup logic skips rejected categories).
//
// Never writes: budget_categories.monthly_limit, transactions, balances, tax/write-off values.
// User isolation: explicit user_id filter + RLS on budget_suggestions.

const VALID_REJECTION_REASONS = new Set([
  "already_budgeted",
  "amount_wrong",
  "skipped",
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Parse optional rejection reason — unknown values are rejected with 400.
  let rejectionReason: string | null = null;
  const body = await req.json().catch(() => null);
  if (body && typeof body.rejection_reason === "string") {
    if (body.rejection_reason === "" || !VALID_REJECTION_REASONS.has(body.rejection_reason)) {
      return NextResponse.json({ error: "Invalid rejection_reason" }, { status: 400 });
    }
    rejectionReason = body.rejection_reason;
  }

  // Verify ownership and current status.
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

  const updatePayload: Record<string, unknown> = {
    status: "rejected",
    resolved_at: new Date().toISOString(),
    resolved_by: "user",
  };
  if (rejectionReason !== null) {
    updatePayload.rejection_reason = rejectionReason;
  }

  const { error } = await supabase
    .from("budget_suggestions")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

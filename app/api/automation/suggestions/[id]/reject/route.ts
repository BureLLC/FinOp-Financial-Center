import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "../../../../../../src/lib/automation/serverSupabase";

const VALID_REJECTION_REASONS = new Set([
  "wrong_merchant",
  "wrong_category",
  "not_recurring",
  "personal_preference",
  "other",
  "skipped",
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Parse optional rejection reason — unknown reasons are rejected with 400
  let rejectionReason: string | null = null;
  const body = await req.json().catch(() => null);
  if (body && typeof body.rejection_reason === "string") {
    if (!VALID_REJECTION_REASONS.has(body.rejection_reason)) {
      return NextResponse.json({ error: "Invalid rejection_reason" }, { status: 400 });
    }
    rejectionReason = body.rejection_reason;
  }

  // Verify ownership before updating
  const { data: suggestion } = await supabase
    .from("automation_suggestions")
    .select("id, user_id, status")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

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
    .from("automation_suggestions")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

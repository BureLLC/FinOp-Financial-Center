import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "../../../../../../src/lib/automation/serverSupabase";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const { error } = await supabase
    .from("automation_suggestions")
    .update({ status: "rejected", resolved_at: new Date().toISOString(), resolved_by: "user" })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

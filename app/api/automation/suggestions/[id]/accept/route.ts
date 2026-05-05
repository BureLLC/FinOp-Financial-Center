import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "../../../../../../src/lib/automation/serverSupabase";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.rpc("apply_automation_suggestion", {
    p_suggestion_id: id,
    p_user_id: userId,
  });

  if (error) {
    const isAuth = error.message?.includes("Unauthorized");
    const isSensitive = error.message?.includes("sensitive");
    const status = isAuth ? 403 : isSensitive ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "../../../../../../src/lib/automation/serverSupabase";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: auditId } = await params;
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.rpc("undo_automation_suggestion", {
    p_audit_id: auditId,
    p_user_id: userId,
  });

  if (error) {
    const isAuth = error.message?.includes("Unauthorized");
    const status = isAuth ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  // data is the jsonb return value: { success: bool, reason?: string }
  const result = data as { success: boolean; reason?: string };
  if (!result.success) {
    return NextResponse.json({ success: false, reason: result.reason }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}

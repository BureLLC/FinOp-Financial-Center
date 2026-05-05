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

  const { data: auditRow } = await supabase
    .from("automation_audit_log")
    .select("id")
    .eq("suggestion_id", id)
    .eq("triggered_by", "user_accept")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ success: true, auditId: auditRow?.id ?? null });
}

import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "../../../../src/lib/automation/serverSupabase";

export async function GET(_req: NextRequest) {
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("automation_audit_log")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ activity: data ?? [] });
}

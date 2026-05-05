import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "../../../../src/lib/automation/serverSupabase";

export async function GET(_req: NextRequest) {
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .in("status", ["active", "paused"])
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rules: data ?? [] });
}

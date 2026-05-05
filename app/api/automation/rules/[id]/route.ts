import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "../../../../../src/lib/automation/serverSupabase";

const VALID_TRANSITIONS: Record<string, string[]> = {
  active: ["paused", "deleted"],
  paused: ["active", "deleted"],
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const newStatus: string = (body.status ?? "").toString().trim();

  if (!["active", "paused", "deleted"].includes(newStatus)) {
    return NextResponse.json({ error: `Invalid status "${newStatus}"` }, { status: 400 });
  }

  const { data: rule } = await supabase
    .from("automation_rules")
    .select("id, status, deleted_at, user_id")
    .eq("id", id)
    .single();

  if (!rule) return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  if (rule.user_id !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (rule.deleted_at !== null) {
    return NextResponse.json({ error: "Cannot modify a deleted rule" }, { status: 409 });
  }

  const allowed = VALID_TRANSITIONS[rule.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from "${rule.status}" to "${newStatus}"` },
      { status: 409 },
    );
  }

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (newStatus === "deleted") {
    updatePayload.deleted_at = new Date().toISOString();
  }

  const { data: updated, error: updateError } = await supabase
    .from("automation_rules")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ rule: updated });
}

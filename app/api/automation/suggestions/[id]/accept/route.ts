import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "../../../../../../src/lib/automation/serverSupabase";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch suggestion to determine type before routing.
  // business_expense_candidate is handled via apply_business_candidate_suggestion RPC
  // (not apply_automation_suggestion, which only handles transaction_category).
  const { data: suggestion } = await supabase
    .from("automation_suggestions")
    .select("id, user_id, suggestion_type, status, source_entity_id, automation_rule_id, confidence")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!suggestion) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ─── Branch: business expense candidate ──────────────────────────────────────
  if (suggestion.suggestion_type === "business_expense_candidate") {
    if (suggestion.status !== "pending") {
      return NextResponse.json({ error: "Suggestion is not pending" }, { status: 400 });
    }

    // Single atomic RPC: ownership, status, type guards + transaction update +
    // suggestion status update + audit log insert all run in one plpgsql transaction.
    const { data, error } = await supabase.rpc("apply_business_candidate_suggestion", {
      p_suggestion_id: id,
      p_user_id: userId,
    });

    if (error) {
      const isAuth = error.message?.includes("Unauthorized");
      const status = isAuth ? 403 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    const result = data as { success: boolean; audit_id: string | null } | null;
    return NextResponse.json({ success: true, auditId: result?.audit_id ?? null });
  }

  // ─── Branch: transaction_category (existing RPC path — unchanged) ─────────────
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

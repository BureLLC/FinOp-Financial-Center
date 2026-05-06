import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "../../../../../../src/lib/automation/serverSupabase";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: auditId } = await params;
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch audit entry to determine action type before routing.
  // mark_business_candidate entries are handled directly in the application layer.
  // The undo_automation_suggestion RPC explicitly rejects any action_taken not in
  // ('set_category', 'set_subcategory'), so we must intercept before calling it.
  const { data: auditEntry } = await supabase
    .from("automation_audit_log")
    .select("id, user_id, action_taken, entity_type, entity_id, new_value, suggestion_id, automation_rule_id")
    .eq("id", auditId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!auditEntry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ─── Branch: write-off candidate undo ────────────────────────────────────────
  if (auditEntry.action_taken === "mark_writeoff_candidate") {
    // Stale-value guard: verify is_writeoff_candidate still matches what automation wrote.
    // If the transaction was modified since the mark-writeoff action, undo is blocked.
    const { data: txRow } = await supabase
      .from("transactions")
      .select("is_writeoff_candidate")
      .eq("id", auditEntry.entity_id as string)
      .single();

    const newValue = auditEntry.new_value as Record<string, unknown> | null;
    const expectedValue = newValue?.is_writeoff_candidate ?? true;
    const currentValue = (txRow as { is_writeoff_candidate: boolean | null } | null)?.is_writeoff_candidate ?? null;

    if (currentValue !== expectedValue) {
      return NextResponse.json(
        { success: false, reason: "transaction_edited_after_apply" },
        { status: 409 },
      );
    }

    // Revert: set is_writeoff_candidate back to NULL (the pre-mark state)
    const { error: revertError } = await supabase
      .from("transactions")
      .update({ is_writeoff_candidate: null })
      .eq("id", auditEntry.entity_id as string);

    if (revertError) return NextResponse.json({ error: revertError.message }, { status: 500 });

    // Revert suggestion status to 'pending' so the suggestion can be acted on again
    if (auditEntry.suggestion_id) {
      await supabase
        .from("automation_suggestions")
        .update({ status: "pending", resolved_at: null, resolved_by: null })
        .eq("id", auditEntry.suggestion_id as string)
        .eq("user_id", userId);
    }

    // Append-only audit log entry for the undo
    await supabase.from("automation_audit_log").insert({
      user_id: userId,
      automation_rule_id: (auditEntry.automation_rule_id as string | null) ?? null,
      suggestion_id: (auditEntry.suggestion_id as string | null) ?? null,
      entity_type: "transaction",
      entity_id: auditEntry.entity_id as string,
      action_taken: "undo_mark_writeoff_candidate",
      previous_value: { is_writeoff_candidate: true },
      new_value: { is_writeoff_candidate: null },
      confidence: null,
      triggered_by: "user_undo",
    });

    return NextResponse.json({ success: true });
  }

  // ─── Branch: business expense candidate undo ──────────────────────────────────
  if (auditEntry.action_taken === "mark_business_candidate") {
    // Stale-value guard: verify is_business_candidate still matches what automation wrote.
    // If the transaction was modified since the mark-business action, undo is blocked.
    const { data: txRow } = await supabase
      .from("transactions")
      .select("is_business_candidate")
      .eq("id", auditEntry.entity_id as string)
      .single();

    const newValue = auditEntry.new_value as Record<string, unknown> | null;
    const expectedValue = newValue?.is_business_candidate ?? true;
    const currentValue = (txRow as { is_business_candidate: boolean | null } | null)?.is_business_candidate ?? null;

    if (currentValue !== expectedValue) {
      return NextResponse.json(
        { success: false, reason: "transaction_edited_after_apply" },
        { status: 409 },
      );
    }

    // Revert: set is_business_candidate back to NULL (the pre-mark state)
    const { error: revertError } = await supabase
      .from("transactions")
      .update({ is_business_candidate: null })
      .eq("id", auditEntry.entity_id as string);

    if (revertError) return NextResponse.json({ error: revertError.message }, { status: 500 });

    // Revert suggestion status to 'pending' so the suggestion can be acted on again
    if (auditEntry.suggestion_id) {
      await supabase
        .from("automation_suggestions")
        .update({ status: "pending", resolved_at: null, resolved_by: null })
        .eq("id", auditEntry.suggestion_id as string)
        .eq("user_id", userId);
    }

    // Append-only audit log entry for the undo
    await supabase.from("automation_audit_log").insert({
      user_id: userId,
      automation_rule_id: (auditEntry.automation_rule_id as string | null) ?? null,
      suggestion_id: (auditEntry.suggestion_id as string | null) ?? null,
      entity_type: "transaction",
      entity_id: auditEntry.entity_id as string,
      action_taken: "undo_mark_business_candidate",
      previous_value: { is_business_candidate: true },
      new_value: { is_business_candidate: null },
      confidence: null,
      triggered_by: "user_undo",
    });

    return NextResponse.json({ success: true });
  }

  // ─── Branch: transaction_category undo (existing RPC path — unchanged) ────────
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

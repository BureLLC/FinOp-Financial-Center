import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "../../../../../../src/lib/automation/serverSupabase";
import { WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED } from "../../../../../../src/lib/automation/constants";
import { createOrStrengthenWriteOffRule } from "../../../../../../src/lib/automation/writeOffRuleBuilder";

// Writes only: transactions.is_writeoff_candidate
// Never writes: category, subcategory, income_subtype, direction, amount,
//               transaction_date, transaction_type, status, financial_account_id,
//               external_transaction_id, provider, deleted_at, or any Plaid/SnapTrade field.
// Does not create write_offs, update Tax Center, or affect deductible totals.

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: transactionId } = await params;
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify transaction ownership through financial_accounts join.
  // Also fetch merchant_name, description, direction for rule creation.
  const { data: txRow } = await supabase
    .from("transactions")
    .select("id, is_writeoff_candidate, merchant_name, description, direction, financial_accounts!inner(user_id)")
    .eq("id", transactionId)
    .single();

  if (!txRow) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  type AccountOwnerRow = { user_id: string | null };
  const accountRelation = txRow.financial_accounts as AccountOwnerRow | AccountOwnerRow[] | null;
  const accountOwner = Array.isArray(accountRelation) ? accountRelation[0] : accountRelation;
  if ((accountOwner?.user_id ?? null) !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const previousValue = (txRow as { is_writeoff_candidate: boolean | null }).is_writeoff_candidate ?? null;

  // Write only is_writeoff_candidate — explicit payload with no other fields
  const { error: updateError } = await supabase
    .from("transactions")
    .update({ is_writeoff_candidate: true })
    .eq("id", transactionId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Audit log: records previous and new values for undo support
  const { data: auditRow, error: auditError } = await supabase
    .from("automation_audit_log")
    .insert({
      user_id: userId,
      automation_rule_id: null,
      suggestion_id: null,
      entity_type: "transaction",
      entity_id: transactionId,
      action_taken: "mark_writeoff_candidate",
      previous_value: { is_writeoff_candidate: previousValue },
      new_value: { is_writeoff_candidate: true },
      confidence: null,
      triggered_by: "user_manual",
    })
    .select("id")
    .single();

  if (auditError) {
    // Audit log failure is non-blocking for the write, but omit auditId so the
    // client knows undo will not be available for this action.
    return NextResponse.json({ success: true, auditId: null, suggestionsEnabled: false, suggestionsCreated: 0 });
  }

  // Create or strengthen a write-off candidate rule from this user action.
  // Rule learning is not gated by WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED — the system
  // learns from every explicit user mark so that rules are already present when the
  // flag is enabled.
  const merchantName = (txRow as { merchant_name: string | null }).merchant_name ?? null;
  const description = (txRow as { description: string | null }).description ?? null;
  const direction = (txRow as { direction: string }).direction ?? "debit";

  await createOrStrengthenWriteOffRule(
    { userId, transactionId, merchantName, description, direction },
    supabase,
  );

  return NextResponse.json({
    success: true,
    auditId: auditRow?.id ?? null,
    suggestionsEnabled: WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED,
    suggestionsCreated: 0,
  });
}

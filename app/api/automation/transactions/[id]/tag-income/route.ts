import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "../../../../../../src/lib/automation/serverSupabase";

// Writes only: transactions.income_subtype and transactions.transaction_type
// Applies the same tagging to matching credit transactions with null income_subtype.
// Never writes: category, subcategory, direction, amount, transaction_date,
//               financial_account_id, external_transaction_id, provider, deleted_at.
// Does not create automation rules, suggestions, or audit log entries.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: transactionId } = await params;
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const incomeSubtype: string | null = body.income_subtype ?? null;
  const transactionType: string = body.transaction_type ?? (incomeSubtype ? "income" : "bank");

  // Verify ownership via financial_accounts join; require credit direction
  const { data: txRow } = await supabase
    .from("transactions")
    .select("id, direction, merchant_name, description, income_subtype, financial_accounts!inner(user_id)")
    .eq("id", transactionId)
    .eq("direction", "credit")
    .single();

  if (!txRow) return NextResponse.json({ error: "Transaction not found or not a credit transaction" }, { status: 404 });

  type AccountOwnerRow = { user_id: string | null };
  const accountRelation = txRow.financial_accounts as AccountOwnerRow | AccountOwnerRow[] | null;
  const accountOwner = Array.isArray(accountRelation) ? accountRelation[0] : accountRelation;
  if ((accountOwner?.user_id ?? null) !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Update source transaction
  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      income_subtype: incomeSubtype || null,
      transaction_type: transactionType,
    })
    .eq("id", transactionId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Auto-apply to matching credit transactions with null income_subtype
  const merchantName = (txRow.merchant_name as string | null)?.trim().toLowerCase() ?? null;
  const description = (txRow.description as string | null)?.trim().toLowerCase() ?? null;
  let autoApplied = 0;

  if (merchantName || description) {
    let matchQuery = supabase
      .from("transactions")
      .update({
        income_subtype: incomeSubtype || null,
        transaction_type: transactionType,
      })
      .eq("direction", "credit")
      .is("income_subtype", null)
      .is("deleted_at", null)
      .eq("status", "posted")
      .neq("id", transactionId);

    matchQuery = merchantName
      ? matchQuery.ilike("merchant_name", merchantName)
      : matchQuery.ilike("description", description as string);

    const { data: matched } = await matchQuery.select("id");
    autoApplied = (matched ?? []).length;
  }

  return NextResponse.json({ success: true, autoApplied });
}

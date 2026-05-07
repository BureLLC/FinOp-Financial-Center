import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "../../../../src/lib/automation/serverSupabase";

// Server-side route to find or create a write_offs row linked to a transaction.
// Used by the write-offs page to resolve real write_offs.id for synthetic entries
// before Verify/Edit/Delete operations, replacing the inline client-side version.
//
// Writes: write_offs table only. Never touches transactions or financial fields.

export async function POST(req: NextRequest) {
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { transaction_id, amount, expense_date, tax_year, deduction_type, category, description } = body as {
    transaction_id: string;
    amount?: number;
    expense_date?: string;
    tax_year?: number;
    deduction_type?: string;
    category?: string;
    description?: string | null;
  };

  if (!transaction_id) {
    return NextResponse.json({ error: "transaction_id required" }, { status: 400 });
  }

  // Verify transaction ownership via financial_accounts join.
  const { data: txRow } = await supabase
    .from("transactions")
    .select("id, financial_accounts!inner(user_id)")
    .eq("id", transaction_id)
    .single();

  if (!txRow) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  type AccountOwnerRow = { user_id: string | null };
  const accountRelation = txRow.financial_accounts as AccountOwnerRow | AccountOwnerRow[] | null;
  const accountOwner = Array.isArray(accountRelation) ? accountRelation[0] : accountRelation;
  if ((accountOwner?.user_id ?? null) !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Look up existing write_offs row linked to this transaction.
  const { data: existing } = await supabase
    .from("write_offs")
    .select("id")
    .eq("transaction_id", transaction_id)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ id: existing[0].id });
  }

  // Insert a new write_offs row.
  const resolvedDate = expense_date ?? new Date().toISOString().substring(0, 10);
  const resolvedYear = tax_year ?? new Date(resolvedDate).getFullYear();

  const { data: newRow, error } = await supabase
    .from("write_offs")
    .insert({
      user_id: userId,
      transaction_id,
      category: category ?? "Business Expense",
      description: description ?? null,
      amount: Number(amount ?? 0),
      expense_date: resolvedDate,
      tax_year: resolvedYear,
      deduction_type: deduction_type ?? "other",
      is_verified: false,
      notes: "Auto-generated from write-off candidate tag",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !newRow) {
    return NextResponse.json({ error: "Failed to create write-off row" }, { status: 500 });
  }

  return NextResponse.json({ id: newRow.id });
}

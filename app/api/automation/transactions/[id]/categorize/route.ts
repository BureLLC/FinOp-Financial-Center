import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "../../../../../../src/lib/automation/serverSupabase";
import { SENSITIVE_CATEGORIES } from "../../../../../../src/lib/automation/constants";
import { createOrStrengthenRule } from "../../../../../../src/lib/automation/ruleBuilder";
import { autoApplyRule } from "../../../../../../src/lib/automation/suggestionEngine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: transactionId } = await params;
  const { supabase, userId } = await createRouteClient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rawCategory: string = (body.category ?? "").toString().trim();
  const subcategory: string | undefined = body.subcategory?.toString().trim() || undefined;

  const normalizedCategory = rawCategory.toLowerCase();

  // Block sensitive categories — they affect Tax Center and Write-Offs
  if (rawCategory && SENSITIVE_CATEGORIES.has(normalizedCategory)) {
    return NextResponse.json(
      { error: `Category "${rawCategory}" is a deductible/sensitive category and cannot be set via automation in Phase 1. Use the Tax Center or Write-Offs pages instead.` },
      { status: 400 },
    );
  }

  // Verify transaction belongs to this user via financial_accounts join
  const { data: txRow } = await supabase
    .from("transactions")
    .select("id, category, subcategory, merchant_name, description, financial_account_id, financial_accounts!inner(user_id)")
    .eq("id", transactionId)
    .single();

  if (!txRow) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  type AccountOwnerRow = { user_id: string | null };
  const accountRelation = txRow.financial_accounts as AccountOwnerRow | AccountOwnerRow[] | null;
  const accountOwner = Array.isArray(accountRelation) ? accountRelation[0] : accountRelation;
  const accountUserId = accountOwner?.user_id ?? null;
  if (accountUserId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const previousCategory = txRow.category as string | null;
  const previousSubcategory = txRow.subcategory as string | null;
  const merchantName = txRow.merchant_name as string | null;
  const description = txRow.description as string | null;

  // Write category to transactions (only category and subcategory)
  const newCategory = rawCategory || null;
  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      category: newCategory,
      subcategory: subcategory ?? null,
    })
    .eq("id", transactionId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Insert audit log entry for this manual categorization
  await supabase.from("automation_audit_log").insert({
    user_id: userId,
    automation_rule_id: null,
    suggestion_id: null,
    entity_type: "transaction",
    entity_id: transactionId,
    action_taken: "user_manual_category",
    previous_value: { category: previousCategory, subcategory: previousSubcategory },
    new_value: { category: newCategory, subcategory: subcategory ?? null },
    confidence: null,
    triggered_by: "user_manual",
  });

  // Build/strengthen a rule then immediately apply it to matching uncategorized transactions
  let autoApplied = 0;
  if (newCategory && !SENSITIVE_CATEGORIES.has(newCategory.toLowerCase())) {
    const { rule } = await createOrStrengthenRule(
      { userId, transactionId, merchantName, description, category: newCategory, subcategory },
      supabase,
    );

    if (rule) {
      autoApplied = await autoApplyRule(rule, transactionId, userId, supabase);
    }
  }

  return NextResponse.json({ success: true, autoApplied });
}

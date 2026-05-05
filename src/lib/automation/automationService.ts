// Read-only DB accessors for automation data.
// All writes go through Postgres RPC functions or the categorize endpoint.

import { SupabaseClient } from "@supabase/supabase-js";
import { AutomationRule, AutomationSuggestion, AutomationAuditEntry } from "./types";

/** Returns pending suggestions for the user, joined with transaction display context. */
export async function listPendingSuggestions(
  userId: string,
  supabase: SupabaseClient,
): Promise<(AutomationSuggestion & { tx_merchant_name: string | null; tx_amount: number | null; tx_date: string | null })[]> {
  const { data, error } = await supabase
    .from("automation_suggestions")
    .select(`
      *,
      transactions!source_entity_id (
        merchant_name,
        amount,
        transaction_date
      )
    `)
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => {
    const tx = (row.transactions as Record<string, unknown> | null) ?? {};
    return {
      ...(row as unknown as AutomationSuggestion),
      tx_merchant_name: (tx.merchant_name as string | null) ?? null,
      tx_amount: tx.amount != null ? Number(tx.amount) : null,
      tx_date: (tx.transaction_date as string | null) ?? null,
    };
  });
}

/** Returns active rules for the user. */
export async function listActiveRules(
  userId: string,
  supabase: SupabaseClient,
): Promise<AutomationRule[]> {
  const { data, error } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as AutomationRule[];
}

/** Returns a single audit entry by id, verifying user ownership. */
export async function getAuditEntry(
  auditId: string,
  userId: string,
  supabase: SupabaseClient,
): Promise<AutomationAuditEntry | null> {
  const { data, error } = await supabase
    .from("automation_audit_log")
    .select("*")
    .eq("id", auditId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data as AutomationAuditEntry;
}

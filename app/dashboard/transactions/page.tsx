"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../src/lib/supabase";
import { activePostedTransactions, deduplicateTransactions, calcTotalIn, calcTotalOut } from "../../../src/lib/financialCalculations";
import { getCanonicalDeduplicatedTransactions } from "../../../src/lib/canonicalFinancialData";
import type { AutomationSuggestion } from "../../../src/lib/automation/types";
import { SENSITIVE_CATEGORIES, BUSINESS_EXPENSE_SUGGESTIONS_ENABLED, MIXED_USE_CATEGORIES, WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED } from "../../../src/lib/automation/constants";

interface Transaction {
  id: string;
  financial_account_id: string;
  transaction_type: string;
  direction: string;
  status: string;
  income_subtype: string | null;
  amount: number;
  currency: string;
  description: string | null;
  merchant_name: string | null;
  category: string | null;
  subcategory: string | null;
  transaction_date: string;
  provider: string | null;
  external_transaction_id: string | null;
  deleted_at: string | null;
  is_business_candidate: boolean | null;
  is_writeoff_candidate: boolean | null;
}

interface Account {
  id: string;
  account_name: string;
  mask: string | null;
  institution_name: string | null;
}

const MERCHANT_ICONS: Record<string, { icon: string; color: string }> = {
  "starbucks":         { icon: "☕", color: "#00704A" },
  "mcdonald":          { icon: "🍔", color: "#FFC72C" },
  "kfc":               { icon: "🍗", color: "#F40027" },
  "uber":              { icon: "🚗", color: "#1a1a1a" },
  "lyft":              { icon: "🚗", color: "#FF00BF" },
  "amazon":            { icon: "📦", color: "#FF9900" },
  "netflix":           { icon: "🎬", color: "#E50914" },
  "spotify":           { icon: "🎵", color: "#1DB954" },
  "apple":             { icon: "🍎", color: "#555555" },
  "google":            { icon: "🔍", color: "#4285F4" },
  "walmart":           { icon: "🛒", color: "#0071CE" },
  "target":            { icon: "🎯", color: "#CC0000" },
  "costco":            { icon: "🏪", color: "#005DAA" },
  "whole foods":       { icon: "🥬", color: "#00674B" },
  "trader joe":        { icon: "🛍️", color: "#B22222" },
  "united airlines":   { icon: "✈️", color: "#002244" },
  "delta":             { icon: "✈️", color: "#003366" },
  "american airlines": { icon: "✈️", color: "#0078D2" },
  "southwest":         { icon: "✈️", color: "#304CB2" },
  "marriott":          { icon: "🏨", color: "#8B0000" },
  "hilton":            { icon: "🏨", color: "#002F5F" },
  "airbnb":            { icon: "🏠", color: "#FF5A5F" },
  "cvs":               { icon: "💊", color: "#CC0000" },
  "walgreens":         { icon: "💊", color: "#E31837" },
  "climbing":          { icon: "🧗", color: "#8B4513" },
  "touchstone":        { icon: "🧗", color: "#8B4513" },
  "bicycle":           { icon: "🚴", color: "#2E86AB" },
  "sparkfun":          { icon: "⚡", color: "#E91E63" },
  "fun":               { icon: "⚡", color: "#E91E63" },
  "tectra":            { icon: "💼", color: "#607D8B" },
  "credit card":       { icon: "💳", color: "#5C6BC0" },
  "deposit":           { icon: "🏦", color: "#26A69A" },
  "interest":          { icon: "📈", color: "#66BB6A" },
  "intrst":            { icon: "📈", color: "#66BB6A" },
  "automatic payment": { icon: "🔄", color: "#42A5F5" },
};

const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
  "food":          { icon: "🍔", color: "#FF7043" },
  "restaurant":    { icon: "🍽️", color: "#FF7043" },
  "travel":        { icon: "✈️", color: "#42A5F5" },
  "transport":     { icon: "🚗", color: "#78909C" },
  "shopping":      { icon: "🛍️", color: "#EC407A" },
  "entertainment": { icon: "🎬", color: "#AB47BC" },
  "health":        { icon: "❤️", color: "#EF5350" },
  "utilities":     { icon: "💡", color: "#FFA726" },
  "transfer":      { icon: "🔄", color: "#42A5F5" },
  "payment":       { icon: "💳", color: "#5C6BC0" },
  "income":        { icon: "💰", color: "#66BB6A" },
  "interest":      { icon: "📈", color: "#66BB6A" },
  "investment":    { icon: "📊", color: "#26A69A" },
  "crypto":        { icon: "₿",  color: "#F7931A" },
  "subscription":  { icon: "🔔", color: "#7E57C2" },
  "education":     { icon: "📚", color: "#29B6F6" },
  "fitness":       { icon: "💪", color: "#FF6B35" },
  "groceries":     { icon: "🛒", color: "#66BB6A" },
};

function getTransactionIcon(tx: Transaction): { icon: string; color: string } {
  const name = (tx.merchant_name ?? tx.description ?? "").toLowerCase();
  for (const [key, val] of Object.entries(MERCHANT_ICONS)) {
    if (name.includes(key)) return val;
  }
  const cat = (tx.category ?? tx.subcategory ?? "").toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_ICONS)) {
    if (cat.includes(key)) return val;
  }
  return tx.direction === "credit"
    ? { icon: "💰", color: "#66BB6A" }
    : { icon: "💳", color: "#5C6BC0" };
}

const INCOME_SUBTYPES = [
  { value: "",         label: "Not income" },
  { value: "salary",   label: "Salary / W2" },
  { value: "bonus",    label: "Bonus" },
  { value: "business", label: "Business / Self-employment" },
  { value: "rental",   label: "Rental income" },
  { value: "dividend", label: "Dividend" },
  { value: "interest", label: "Interest" },
  { value: "other",    label: "Other income" },
];

const TRANSACTION_TYPES = [
  "bank", "trade", "crypto", "income", "fee", "transfer", "tax_payment",
];

const SUGGESTED_CATEGORIES = [
  "Food & Drink", "Shopping", "Travel", "Transportation", "Entertainment",
  "Health & Fitness", "Utilities", "Subscription", "Transfer", "Payment",
  "Income", "Investment", "Crypto", "Education", "Personal Care",
  "Home", "Business", "Taxes", "Other",
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 2,
  }).format(n);
}

export default function TransactionsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [filterDirection, setFilterDirection] = useState<"all" | "credit" | "debit">("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editSubtype, setEditSubtype] = useState("");
  const [editType, setEditType] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [panelMsg, setPanelMsg] = useState<string | null>(null);
  // Automation suggestions keyed by transaction id, split by type
  const [categorySuggestions, setCategorySuggestions] = useState<Map<string, AutomationSuggestion>>(new Map());
  const [bizSuggestions, setBizSuggestions] = useState<Map<string, AutomationSuggestion>>(new Map());
  // Which suggestion panel is open (by transaction id)
  const [openSuggestion, setOpenSuggestion] = useState<string | null>(null);
  const [openBizSuggestionId, setOpenBizSuggestionId] = useState<string | null>(null);
  // Ephemeral undo entry — lost on page refresh (intentional)
  const [undoEntry, setUndoEntry] = useState<
    | { kind: "category"; txId: string; auditId: string; prevCategory: string | null; category: string }
    | { kind: "business"; txId: string; auditId: string; merchantName: string | null }
    | { kind: "writeoff"; txId: string; auditId: string; merchantName: string | null }
    | null
  >(null);
  // Which transaction's category suggestion is in the reason-picker step
  const [rejectingTxId, setRejectingTxId] = useState<string | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  // Business candidate manual mark state
  const [bizConfirmOpen, setBizConfirmOpen] = useState(false);
  const [markingBusiness, setMarkingBusiness] = useState(false);
  const [bizMarkError, setBizMarkError] = useState<string | null>(null);
  // Write-off candidate suggestion map — populated only when flag is true (dormant in PR B)
  const [writeoffSuggestions, setWriteoffSuggestions] = useState<Map<string, AutomationSuggestion>>(new Map());
  // Write-off candidate suggestion panel open state (by transaction id)
  const [openWriteoffSuggestionId, setOpenWriteoffSuggestionId] = useState<string | null>(null);
  // Write-off candidate manual mark state
  const [writeoffConfirmOpen, setWriteoffConfirmOpen] = useState(false);
  const [markingWriteOff, setMarkingWriteOff] = useState(false);
  const [writeoffMarkError, setWriteoffMarkError] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [dedupTransactions, acctRes] = await Promise.all([
      // Use canonical deduplicated source
      getCanonicalDeduplicatedTransactions(supabase, user.id),
      supabase
        .from("financial_accounts")
        .select("id, account_name, mask, institution_name")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .is("deleted_at", null),
    ]);

    setTransactions(dedupTransactions as Transaction[]);
    setAccounts(acctRes.data ?? []);
    setLoading(false);
    loadSuggestions();
  };

  const loadSuggestions = async () => {
    try {
      const res = await fetch("/api/automation/suggestions");
      if (!res.ok) return;
      const { suggestions: data } = await res.json();
      const catMap = new Map<string, AutomationSuggestion>();
      const bizMap = new Map<string, AutomationSuggestion>();
      const writeoffMap = new Map<string, AutomationSuggestion>();
      for (const s of (data ?? [])) {
        if (s.suggestion_type === "business_expense_candidate") {
          bizMap.set(s.source_entity_id, s);
        } else if (s.suggestion_type === "write_off_candidate") {
          // Only populate when flag is enabled — dormant in PR B
          if (WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED) {
            writeoffMap.set(s.source_entity_id, s);
          }
        } else {
          catMap.set(s.source_entity_id, s);
        }
      }
      setCategorySuggestions(catMap);
      setBizSuggestions(bizMap);
      setWriteoffSuggestions(writeoffMap);
    } catch {
      // Suggestions are non-critical; silent fail is acceptable
    }
  };

  const getAccount = (id: string) => accounts.find((a) => a.id === id);

  // Transactions are already deduplicated from canonical source, filter for UI
  const filtered = transactions.filter((tx) => {
    if (filterDirection !== "all" && tx.direction !== filterDirection) return false;
    if (filterType !== "all" && tx.transaction_type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const text = `${tx.merchant_name ?? ""} ${tx.description ?? ""} ${tx.category ?? ""}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  // Summary totals: filter to posted, deduplicated transactions for summary only
  const postedTransactions = activePostedTransactions(transactions);
  const totalIn = calcTotalIn(postedTransactions);
  const totalOut = calcTotalOut(postedTransactions);

  const openPanel = (tx: Transaction) => {
    setSelected(tx);
    setEditSubtype(tx.income_subtype ?? "");
    setEditType(tx.transaction_type);
    setEditCategory(tx.category ?? "");
    setPanelMsg(null);
    setBizConfirmOpen(false);
    setBizMarkError(null);
    setWriteoffConfirmOpen(false);
    setWriteoffMarkError(null);
  };

  const saveChanges = async () => {
    if (!selected) return;
    setSaving(true);
    setPanelMsg(null);

    const isCredit = selected.direction === "credit";
    const newIncomeSubtype = editSubtype || null;
    const incomeChanged = newIncomeSubtype !== (selected.income_subtype ?? null);

    if (isCredit && incomeChanged) {
      // Route credit income changes through the server route: verifies session,
      // updates source transaction, and auto-applies to matching credits.
      const tagRes = await fetch(`/api/automation/transactions/${selected.id}/tag-income`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ income_subtype: newIncomeSubtype, transaction_type: editType }),
      });
      if (!tagRes.ok) {
        const tagData = await tagRes.json().catch(() => ({}));
        setPanelMsg(tagData.error ?? "Failed to save. Please try again.");
        setSaving(false);
        return;
      }
      const tagData = await tagRes.json().catch(() => ({}));
      if ((tagData.autoApplied ?? 0) > 0) await loadData();
    } else {
      // Debit transactions: write transaction_type only (never income_subtype for debit).
      // Credit transactions with no income change: write transaction_type + keep income_subtype.
      const directFields: Record<string, unknown> = {
        transaction_type: editType,
        updated_at: new Date().toISOString(),
      };
      if (isCredit) directFields.income_subtype = newIncomeSubtype;

      const { error } = await supabase
        .from("transactions")
        .update(directFields)
        .eq("id", selected.id);
      if (error) {
        setPanelMsg("Failed to save. Please try again.");
        setSaving(false);
        return;
      }
    }

    // Category via the categorize endpoint (auto-applies to matching uncategorized transactions)
    const categoryChanged = editCategory !== (selected.category ?? "");
    let categoryError = false;
    let autoApplied = 0;

    if (categoryChanged) {
      const isSensitive = SENSITIVE_CATEGORIES.has(editCategory.toLowerCase().trim());
      if (isSensitive) {
        // Sensitive categories written directly without automation (no rule/auto-apply)
        await supabase
          .from("transactions")
          .update({ category: editCategory || null })
          .eq("id", selected.id);
      } else {
        const catRes = await fetch(`/api/automation/transactions/${selected.id}/categorize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: editCategory || null }),
        });
        if (catRes.ok) {
          const catData = await catRes.json().catch(() => ({}));
          autoApplied = catData.autoApplied ?? 0;
          if (autoApplied > 0) await loadData();
        } else {
          categoryError = true;
          // Fall back to direct write so the category still saves
          await supabase
            .from("transactions")
            .update({ category: editCategory || null })
            .eq("id", selected.id);
        }
      }
    }

    // Update local state
    const allUpdated = {
      income_subtype: newIncomeSubtype,
      transaction_type: editType,
      category: editCategory || null,
    };
    setTransactions((prev) =>
      prev.map((t) => (t.id === selected.id ? { ...t, ...allUpdated } : t))
    );
    setSelected((prev) => (prev ? { ...prev, ...allUpdated } : null));

    const msg = categoryError
      ? "Saved, but category automation failed — category saved directly."
      : autoApplied > 0
      ? `Saved. Auto-categorized ${autoApplied} similar transaction${autoApplied === 1 ? "" : "s"}.`
      : "Saved successfully.";

    setPanelMsg(msg);
    setSaving(false);
  };

  const deleteTransaction = async () => {
    if (!selected) return;
    if (!confirm("Delete this transaction? This cannot be undone.")) return;
    setDeleting(true);

    const { error } = await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", selected.id);

    if (error) {
      setPanelMsg("Failed to delete.");
      setDeleting(false);
    } else {
      setTransactions((prev) => prev.filter((t) => t.id !== selected.id));
      setSelected(null);
      setDeleting(false);
    }
  };

  const acceptSuggestion = async (suggestionId: string, txId: string, category: string) => {
    const res = await fetch(`/api/automation/suggestions/${suggestionId}/accept`, { method: "POST" });
    if (!res.ok) return;
    const resData = await res.json().catch(() => ({}));
    const auditId: string | null = resData.auditId ?? null;
    const prevCategory = transactions.find((t) => t.id === txId)?.category ?? null;
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, category } : t))
    );
    setCategorySuggestions((prev) => {
      const next = new Map(prev);
      next.delete(txId);
      return next;
    });
    setOpenSuggestion(null);
    if (auditId) {
      setUndoEntry({ kind: "category", txId, auditId, prevCategory, category });
    }
  };

  const acceptBizSuggestion = async (suggestionId: string, txId: string) => {
    const res = await fetch(`/api/automation/suggestions/${suggestionId}/accept`, { method: "POST" });
    if (!res.ok) return;
    const resData = await res.json().catch(() => ({}));
    const auditId: string | null = resData.auditId ?? null;
    const merchantName = transactions.find((t) => t.id === txId)?.merchant_name ?? null;
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, is_business_candidate: true } : t))
    );
    setBizSuggestions((prev) => {
      const next = new Map(prev);
      next.delete(txId);
      return next;
    });
    setOpenBizSuggestionId(null);
    if (auditId) {
      setUndoEntry({ kind: "business", txId, auditId, merchantName });
    }
  };

  const undoAccept = async () => {
    if (!undoEntry) return;
    const entry = undoEntry;
    setUndoEntry(null);
    const res = await fetch(`/api/automation/audit/${entry.auditId}/undo`, { method: "POST" });
    if (!res.ok) return;
    if (entry.kind === "category") {
      setTransactions((prev) =>
        prev.map((t) => (t.id === entry.txId ? { ...t, category: entry.prevCategory } : t))
      );
    } else if (entry.kind === "writeoff") {
      setTransactions((prev) =>
        prev.map((t) => (t.id === entry.txId ? { ...t, is_writeoff_candidate: null } : t))
      );
    } else {
      setTransactions((prev) =>
        prev.map((t) => (t.id === entry.txId ? { ...t, is_business_candidate: null } : t))
      );
    }
  };

  const rejectSuggestion = async (suggestionId: string, txId: string, reason: string) => {
    setRejectError(null);
    const res = await fetch(`/api/automation/suggestions/${suggestionId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejection_reason: reason }),
    });
    if (!res.ok) {
      setRejectError("Failed to reject. Please try again.");
      return;
    }
    setCategorySuggestions((prev) => {
      const next = new Map(prev);
      next.delete(txId);
      return next;
    });
    setRejectingTxId(null);
    setRejectError(null);
    setOpenSuggestion(null);
  };

  const rejectBizSuggestion = async (suggestionId: string, txId: string) => {
    const res = await fetch(`/api/automation/suggestions/${suggestionId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejection_reason: "skipped" }),
    });
    if (!res.ok) return;
    setBizSuggestions((prev) => {
      const next = new Map(prev);
      next.delete(txId);
      return next;
    });
    setOpenBizSuggestionId(null);
  };

  const acceptWriteoffSuggestion = async (suggestionId: string, txId: string) => {
    const res = await fetch(`/api/automation/suggestions/${suggestionId}/accept`, { method: "POST" });
    if (!res.ok) return;
    const resData = await res.json().catch(() => ({}));
    const auditId: string | null = resData.auditId ?? null;
    const merchantName = transactions.find((t) => t.id === txId)?.merchant_name ?? null;
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, is_writeoff_candidate: true } : t))
    );
    setWriteoffSuggestions((prev) => {
      const next = new Map(prev);
      next.delete(txId);
      return next;
    });
    setOpenWriteoffSuggestionId(null);
    if (auditId) {
      setUndoEntry({ kind: "writeoff", txId, auditId, merchantName });
    }
  };

  const rejectWriteoffSuggestion = async (suggestionId: string, txId: string) => {
    const res = await fetch(`/api/automation/suggestions/${suggestionId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejection_reason: "skipped" }),
    });
    if (!res.ok) return;
    setWriteoffSuggestions((prev) => {
      const next = new Map(prev);
      next.delete(txId);
      return next;
    });
    setOpenWriteoffSuggestionId(null);
  };

  const markBusiness = async () => {
    if (!selected) return;
    setMarkingBusiness(true);
    setBizMarkError(null);
    const res = await fetch(`/api/automation/transactions/${selected.id}/mark-business`, { method: "POST" });
    if (!res.ok) {
      setBizMarkError("Failed to mark. Please try again.");
      setMarkingBusiness(false);
      return;
    }
    const resData = await res.json().catch(() => ({}));
    const auditId: string | null = resData.auditId ?? null;
    const merchantName = selected.merchant_name ?? null;
    setTransactions((prev) =>
      prev.map((t) => (t.id === selected.id ? { ...t, is_business_candidate: true } : t))
    );
    setSelected((prev) => (prev ? { ...prev, is_business_candidate: true } : null));
    setBizConfirmOpen(false);
    setMarkingBusiness(false);
    if (auditId) {
      setUndoEntry({ kind: "business", txId: selected.id, auditId, merchantName });
    }
  };

  const markWriteOff = async () => {
    if (!selected) return;
    setMarkingWriteOff(true);
    setWriteoffMarkError(null);
    const res = await fetch(`/api/automation/transactions/${selected.id}/mark-writeoff-candidate`, { method: "POST" });
    if (!res.ok) {
      setWriteoffMarkError("Failed to mark. Please try again.");
      setMarkingWriteOff(false);
      return;
    }
    const resData = await res.json().catch(() => ({}));
    const auditId: string | null = resData.auditId ?? null;
    const merchantName = selected.merchant_name ?? null;
    setTransactions((prev) =>
      prev.map((t) => (t.id === selected.id ? { ...t, is_writeoff_candidate: true } : t))
    );
    setSelected((prev) => (prev ? { ...prev, is_writeoff_candidate: true } : null));
    setWriteoffConfirmOpen(false);
    setMarkingWriteOff(false);
    if (auditId) {
      setUndoEntry({ kind: "writeoff", txId: selected.id, auditId, merchantName });
    }
    if ((resData.suggestionsCreated ?? 0) > 0) {
      await loadSuggestions();
    }
  };

  function confidenceTier(confidence: number): string {
    if (confidence >= 0.80) return "High";
    if (confidence >= 0.60) return "Medium";
    return "Low";
  }

  const txTypes = [...new Set(transactions.map((t) => t.transaction_type))];

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px", color: "#e2e8f0", fontSize: "13px",
    outline: "none", transition: "border-color 0.2s ease",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "10px", fontWeight: 700, color: "#475569",
    letterSpacing: "0.1em", display: "block", marginBottom: "6px",
  };

  return (
    <div style={{ maxWidth: "1200px", display: "flex", gap: "24px", alignItems: "flex-start" }}>
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Transactions
          </h1>
          <p style={{ color: "#475569", fontSize: "13.5px", margin: 0 }}>
            All synced financial activity. Click any transaction to tag, edit, or delete.
          </p>
        </div>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: "Total In",  value: fmt(totalIn),           color: "#22c55e" },
            { label: "Total Out", value: fmt(totalOut),          color: "#ef4444" },
            { label: "Net",       value: fmt(totalIn - totalOut), color: totalIn >= totalOut ? "#22c55e" : "#ef4444" },
          ].map((s) => (
            <div key={s.label} style={{
              padding: "16px", background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px",
            }}>
              <div style={{ fontSize: "11px", color: "#475569", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "6px" }}>{s.label}</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            placeholder="Search merchant, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: "180px", padding: "8px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", color: "#e2e8f0", fontSize: "13px", outline: "none" }}
            onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
            onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
          />
          {(["all","credit","debit"] as const).map((f) => (
            <button key={f} onClick={() => setFilterDirection(f)}
              style={{
                padding: "7px 14px", borderRadius: "7px",
                background: filterDirection === f ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.04)",
                color: filterDirection === f ? "#38bdf8" : "#64748b",
                fontSize: "12px", fontWeight: 500, cursor: "pointer",
                border: `1px solid ${filterDirection === f ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.07)"}`,
              }}>
              {f === "all" ? "All" : f === "credit" ? "💚 Money In" : "🔴 Money Out"}
            </button>
          ))}
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: "7px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "7px", color: "#64748b", fontSize: "12px", outline: "none", cursor: "pointer" }}>
            <option value="all">All Types</option>
            {txTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <span style={{ fontSize: "12px", color: "#334155", marginLeft: "auto" }}>{filtered.length} transactions</span>
        </div>

        {/* Undo toast */}
        {undoEntry && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "12px", padding: "10px 14px", marginBottom: "12px",
            background: undoEntry.kind === "business" ? "rgba(245,158,11,0.08)" : undoEntry.kind === "writeoff" ? "rgba(20,184,166,0.08)" : "rgba(99,102,241,0.08)",
            border: `1px solid ${undoEntry.kind === "business" ? "rgba(245,158,11,0.3)" : undoEntry.kind === "writeoff" ? "rgba(20,184,166,0.3)" : "rgba(99,102,241,0.25)"}`,
            borderRadius: "9px",
          }}>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              {undoEntry.kind === "category"
                ? <><strong style={{ color: "#e2e8f0" }}>{undoEntry.category}</strong> category applied</>
                : undoEntry.kind === "writeoff"
                ? <>Marked <strong style={{ color: "#e2e8f0" }}>{undoEntry.merchantName ?? "transaction"}</strong> as Write-Off Candidate</>
                : <>Marked <strong style={{ color: "#e2e8f0" }}>{undoEntry.merchantName ?? "transaction"}</strong> as Business Candidate</>
              }
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
              <button onClick={undoAccept} style={{
                padding: "4px 12px", fontSize: "11px", fontWeight: 600,
                background: undoEntry.kind === "business" ? "rgba(245,158,11,0.15)" : undoEntry.kind === "writeoff" ? "rgba(20,184,166,0.15)" : "rgba(99,102,241,0.2)",
                border: `1px solid ${undoEntry.kind === "business" ? "rgba(245,158,11,0.4)" : undoEntry.kind === "writeoff" ? "rgba(20,184,166,0.4)" : "rgba(99,102,241,0.4)"}`,
                borderRadius: "6px",
                color: undoEntry.kind === "business" ? "#f59e0b" : undoEntry.kind === "writeoff" ? "#2dd4bf" : "#818cf8",
                cursor: "pointer",
              }}>
                Undo
              </button>
              <button onClick={() => setUndoEntry(null)} style={{
                padding: "4px 6px", background: "transparent", border: "none",
                color: "#475569", cursor: "pointer", fontSize: "13px",
              }}>✕</button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>📭</div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#475569" }}>No transactions found</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {filtered.map((tx) => {
              const { icon, color } = getTransactionIcon(tx);
              const account = getAccount(tx.financial_account_id);
              const isSelected = selected?.id === tx.id;
              const isCredit = tx.direction === "credit";
              const catSuggestion = categorySuggestions.get(tx.id);
              const bizSuggestion = BUSINESS_EXPENSE_SUGGESTIONS_ENABLED ? bizSuggestions.get(tx.id) : undefined;
              const writeoffSuggestion = WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED ? writeoffSuggestions.get(tx.id) : undefined;
              const catSuggestionOpen = openSuggestion === tx.id;
              const bizSuggestionOpen = openBizSuggestionId === tx.id;
              const writeoffSuggestionOpen = openWriteoffSuggestionId === tx.id;
              const anyPanelOpen = catSuggestionOpen || bizSuggestionOpen || writeoffSuggestionOpen;
              return (
                <div key={tx.id} style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  <div onClick={() => openPanel(tx)}
                    style={{
                      display: "flex", alignItems: "center", gap: "14px",
                      padding: "13px 16px",
                      background: isSelected ? "rgba(37,99,235,0.08)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isSelected ? "rgba(37,99,235,0.25)" : "rgba(255,255,255,0.04)"}`,
                      borderRadius: anyPanelOpen ? "10px 10px 0 0" : "10px",
                      cursor: "pointer", transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; } }}
                    onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; } }}
                  >
                    <div style={{
                      width: "42px", height: "42px", borderRadius: "12px", flexShrink: 0,
                      background: `linear-gradient(145deg, ${color}22, ${color}44)`,
                      border: `1px solid ${color}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "20px",
                      boxShadow: `0 4px 12px ${color}22, inset 0 1px 0 ${color}33`,
                    }}>{icon}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#e2e8f0", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tx.merchant_name ?? tx.description ?? "Unknown"}
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", color: "#334155" }}>
                          {new Date(tx.transaction_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        {account && (
                          <span style={{ fontSize: "11px", color: "#1e293b" }}>
                            {account.institution_name ?? account.account_name}{account.mask ? ` ••${account.mask}` : ""}
                          </span>
                        )}
                        {tx.category && (
                          <span style={{ fontSize: "10px", color: "#475569", background: "rgba(255,255,255,0.05)", padding: "1px 7px", borderRadius: "99px", border: "1px solid rgba(255,255,255,0.07)" }}>
                            {tx.category}
                          </span>
                        )}
                        {tx.income_subtype && (
                          <span style={{ fontSize: "10px", fontWeight: 600, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "1px 7px", borderRadius: "99px", border: "1px solid rgba(34,197,94,0.2)" }}>
                            {tx.income_subtype}
                          </span>
                        )}
                        {tx.status === "pending" && (
                          <span style={{ fontSize: "10px", fontWeight: 600, color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "1px 7px", borderRadius: "99px", border: "1px solid rgba(245,158,11,0.2)" }}>
                            pending
                          </span>
                        )}
                        {catSuggestion && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenSuggestion(catSuggestionOpen ? null : tx.id); if (catSuggestionOpen) { setRejectingTxId(null); setRejectError(null); } }}
                            style={{
                              fontSize: "10px", fontWeight: 600, color: "#818cf8",
                              background: "rgba(99,102,241,0.12)",
                              padding: "1px 8px", borderRadius: "99px",
                              border: "1px solid rgba(99,102,241,0.3)",
                              cursor: "pointer",
                            }}
                          >
                            Suggestion
                          </button>
                        )}
                        {bizSuggestion && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenBizSuggestionId(bizSuggestionOpen ? null : tx.id); }}
                            style={{
                              fontSize: "10px", fontWeight: 600, color: "#f59e0b",
                              background: "rgba(245,158,11,0.1)",
                              padding: "1px 8px", borderRadius: "99px",
                              border: "1px solid rgba(245,158,11,0.3)",
                              cursor: "pointer",
                            }}
                          >
                            Biz?
                          </button>
                        )}
                        {writeoffSuggestion && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenWriteoffSuggestionId(writeoffSuggestionOpen ? null : tx.id); }}
                            style={{
                              fontSize: "10px", fontWeight: 600, color: "#2dd4bf",
                              background: "rgba(20,184,166,0.1)",
                              padding: "1px 8px", borderRadius: "99px",
                              border: "1px solid rgba(20,184,166,0.3)",
                              cursor: "pointer",
                            }}
                          >
                            Write-Off?
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: isCredit ? "#22c55e" : "#f8fafc" }}>
                        {isCredit ? "+" : "−"}{fmt(Number(tx.amount))}
                      </div>
                      <div style={{ fontSize: "10px", color: isCredit ? "#22c55e" : "#ef4444", fontWeight: 500 }}>
                        {isCredit ? "Money In" : "Money Out"}
                      </div>
                    </div>
                  </div>

                  {/* Category suggestion inline panel */}
                  {catSuggestion && catSuggestionOpen && (() => {
                    const catAction = catSuggestion.suggested_action as { category: string; reason?: string };
                    return (
                      <div style={{
                        padding: "12px 16px",
                        background: "rgba(99,102,241,0.06)",
                        border: "1px solid rgba(99,102,241,0.2)",
                        borderTop: "none",
                        borderRadius: bizSuggestion && bizSuggestionOpen ? "0 0 0 0" : "0 0 10px 10px",
                      }}>
                        <div style={{ fontSize: "11px", color: "#818cf8", fontWeight: 700, marginBottom: "6px", letterSpacing: "0.06em" }}>
                          SUGGESTED CATEGORY
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>
                            {catAction.category}
                          </span>
                          <span style={{
                            fontSize: "10px", color: "#64748b",
                            background: "rgba(255,255,255,0.04)",
                            padding: "1px 7px", borderRadius: "99px",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }}>
                            {confidenceTier(catSuggestion.confidence)} confidence
                          </span>
                        </div>
                        {catSuggestion.reason && (
                          <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>
                            {catSuggestion.reason}
                          </div>
                        )}
                        {rejectingTxId === tx.id ? (
                          <div style={{ marginTop: "10px" }}>
                            <div style={{ fontSize: "10px", fontWeight: 700, color: "#475569", letterSpacing: "0.08em", marginBottom: "7px" }}>
                              WHY ARE YOU REJECTING THIS?
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {([
                                { reason: "wrong_merchant",    label: "Wrong merchant" },
                                { reason: "wrong_category",    label: "Wrong category" },
                                { reason: "not_recurring",     label: "Not recurring" },
                                { reason: "personal_preference", label: "Personal preference" },
                                { reason: "other",             label: "Other" },
                                { reason: "skipped",           label: "Skip" },
                              ] as const).map(({ reason, label }) => (
                                <button
                                  key={reason}
                                  onClick={(e) => { e.stopPropagation(); rejectSuggestion(catSuggestion.id, tx.id, reason); }}
                                  style={{
                                    padding: "5px 11px", fontSize: "11px", fontWeight: 500,
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "7px", color: "#94a3b8", cursor: "pointer",
                                  }}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                            {rejectError && (
                              <div style={{ marginTop: "8px", fontSize: "11px", color: "#ef4444" }}>
                                {rejectError}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); acceptSuggestion(catSuggestion.id, tx.id, catAction.category); }}
                              style={{
                                padding: "6px 14px", fontSize: "12px", fontWeight: 600,
                                background: "rgba(99,102,241,0.2)",
                                border: "1px solid rgba(99,102,241,0.4)",
                                borderRadius: "7px", color: "#818cf8", cursor: "pointer",
                              }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setRejectingTxId(tx.id); setRejectError(null); }}
                              style={{
                                padding: "6px 14px", fontSize: "12px", fontWeight: 600,
                                background: "transparent",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "7px", color: "#475569", cursor: "pointer",
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Business candidate suggestion inline panel */}
                  {bizSuggestion && bizSuggestionOpen && (() => {
                    const bizAction = bizSuggestion.suggested_action as { mixed_use?: boolean; reason?: string };
                    const isMixedUse = bizAction.mixed_use === true;
                    return (
                      <div style={{
                        padding: "12px 16px",
                        background: "rgba(245,158,11,0.06)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        borderTop: "none",
                        borderRadius: writeoffSuggestion && writeoffSuggestionOpen ? "0 0 0 0" : "0 0 10px 10px",
                      }}>
                        <div style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 700, marginBottom: "6px", letterSpacing: "0.06em" }}>
                          BUSINESS EXPENSE CANDIDATE
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
                          This transaction may be a business expense. Marking it does not affect tax calculations or deductions.
                        </div>
                        {isMixedUse && (
                          <div style={{
                            fontSize: "11px", color: "#f59e0b",
                            background: "rgba(245,158,11,0.08)",
                            border: "1px solid rgba(245,158,11,0.2)",
                            borderRadius: "6px", padding: "6px 10px", marginBottom: "8px",
                          }}>
                            Mixed-use expense: this category is sometimes personal, sometimes business.
                          </div>
                        )}
                        {bizSuggestion.reason && (
                          <div style={{ fontSize: "11px", color: "#475569", marginBottom: "8px" }}>
                            {bizSuggestion.reason}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); acceptBizSuggestion(bizSuggestion.id, tx.id); }}
                            style={{
                              padding: "6px 14px", fontSize: "12px", fontWeight: 600,
                              background: "rgba(245,158,11,0.15)",
                              border: "1px solid rgba(245,158,11,0.4)",
                              borderRadius: "7px", color: "#f59e0b", cursor: "pointer",
                            }}
                          >
                            Confirm Business Candidate
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); rejectBizSuggestion(bizSuggestion.id, tx.id); }}
                            style={{
                              padding: "6px 14px", fontSize: "12px", fontWeight: 600,
                              background: "transparent",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: "7px", color: "#475569", cursor: "pointer",
                            }}
                          >
                            Reject
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenBizSuggestionId(null); }}
                            style={{
                              padding: "6px 12px", fontSize: "12px", fontWeight: 500,
                              background: "transparent", border: "none",
                              borderRadius: "7px", color: "#334155", cursor: "pointer",
                            }}
                          >
                            Not now
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Write-off candidate suggestion inline panel — dormant while WRITE_OFF_CANDIDATE_SUGGESTIONS_ENABLED is false */}
                  {writeoffSuggestion && writeoffSuggestionOpen && (() => {
                    const writeoffAction = writeoffSuggestion.suggested_action as { reason?: string };
                    return (
                      <div style={{
                        padding: "12px 16px",
                        background: "rgba(20,184,166,0.06)",
                        border: "1px solid rgba(20,184,166,0.2)",
                        borderTop: "none",
                        borderRadius: "0 0 10px 10px",
                      }}>
                        <div style={{ fontSize: "11px", color: "#2dd4bf", fontWeight: 700, marginBottom: "6px", letterSpacing: "0.06em" }}>
                          WRITE-OFF CANDIDATE
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
                          This transaction may be eligible for write-off review. Marking it does not create a write-off or affect your taxes.
                        </div>
                        {writeoffAction.reason && (
                          <div style={{ fontSize: "11px", color: "#475569", marginBottom: "8px" }}>
                            {writeoffAction.reason}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); acceptWriteoffSuggestion(writeoffSuggestion.id, tx.id); }}
                            style={{
                              padding: "6px 14px", fontSize: "12px", fontWeight: 600,
                              background: "rgba(20,184,166,0.15)",
                              border: "1px solid rgba(20,184,166,0.4)",
                              borderRadius: "7px", color: "#2dd4bf", cursor: "pointer",
                            }}
                          >
                            Mark as Write-Off Candidate
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); rejectWriteoffSuggestion(writeoffSuggestion.id, tx.id); }}
                            style={{
                              padding: "6px 12px", fontSize: "12px", fontWeight: 500,
                              background: "transparent", border: "none",
                              borderRadius: "7px", color: "#334155", cursor: "pointer",
                            }}
                          >
                            Not now
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-out panel */}
      {selected && (() => {
        const { icon, color } = getTransactionIcon(selected);
        const account = getAccount(selected.financial_account_id);
        const isCredit = selected.direction === "credit";
        return (
          <div style={{
            width: "320px", flexShrink: 0,
            background: "rgba(8,11,18,0.97)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px", padding: "24px",
            position: "sticky", top: "86px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            backdropFilter: "blur(20px)",
            maxHeight: "calc(100vh - 110px)",
            overflowY: "auto",
          }}>
            <button onClick={() => setSelected(null)}
              style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: "16px" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#94a3b8"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#475569"}
            >✕</button>

            {/* Icon + amount */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "18px",
                background: `linear-gradient(145deg, ${color}22, ${color}55)`,
                border: `1px solid ${color}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "30px", margin: "0 auto 12px",
                boxShadow: `0 8px 24px ${color}33, inset 0 1px 0 ${color}44`,
              }}>{icon}</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc", marginBottom: "4px" }}>
                {selected.merchant_name ?? selected.description ?? "Unknown"}
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: isCredit ? "#22c55e" : "#f8fafc" }}>
                {isCredit ? "+" : "−"}{fmt(Number(selected.amount))}
              </div>
              <div style={{ fontSize: "11px", marginTop: "4px", fontWeight: 600, color: isCredit ? "#22c55e" : "#ef4444" }}>
                {isCredit ? "💚 Money In" : "🔴 Money Out"}
              </div>
            </div>

            {/* Read-only details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0px", marginBottom: "20px" }}>
              {[
                { label: "Date", value: new Date(selected.transaction_date).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" }) },
                { label: "Status", value: selected.status },
                { label: "Account", value: account ? `${account.account_name}${account.mask ? ` ••${account.mask}` : ""}` : "—" },
                { label: "Provider", value: selected.provider ?? "—" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: "10px", color: "#334155", fontWeight: 700, letterSpacing: "0.08em" }}>{row.label.toUpperCase()}</span>
                  <span style={{ fontSize: "12px", color: "#94a3b8", textAlign: "right", maxWidth: "170px" }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Editable: Transaction Type */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>TRANSACTION TYPE</label>
              <select value={editType} onChange={(e) => setEditType(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              >
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace("_", " ")}</option>
                ))}
              </select>
            </div>

            {/* Editable: Category */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>CATEGORY</label>
              <input
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder="e.g. Food & Drink"
                style={inputStyle}
                list="category-suggestions"
                onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
              <datalist id="category-suggestions">
                {SUGGESTED_CATEGORIES.map((c) => <option key={c} value={c} />)}
              </datalist>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "7px" }}>
                {SUGGESTED_CATEGORIES.slice(0, 8).map((c) => (
                  <button key={c} onClick={() => setEditCategory(c)}
                    style={{
                      padding: "3px 9px", fontSize: "10px", fontWeight: 500,
                      background: editCategory === c ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${editCategory === c ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: "99px", color: editCategory === c ? "#38bdf8" : "#475569",
                      cursor: "pointer", transition: "all 0.15s ease",
                    }}
                  >{c}</button>
                ))}
              </div>
            </div>

            {/* Editable: Income Classification */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>INCOME CLASSIFICATION</label>
              <select value={editSubtype} onChange={(e) => setEditSubtype(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              >
                {INCOME_SUBTYPES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <p style={{ fontSize: "10px", color: "#334155", marginTop: "5px" }}>
                Tagging as income affects your tax estimates.
              </p>
            </div>

            {/* Business Candidate */}
            {selected.is_business_candidate ? (
              <div style={{
                padding: "10px 12px", marginBottom: "12px",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "8px",
                fontSize: "12px", color: "#f59e0b", fontWeight: 600,
                textAlign: "center",
              }}>
                Business Candidate
              </div>
            ) : bizConfirmOpen ? (
              <div style={{
                padding: "12px", marginBottom: "12px",
                background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "8px",
              }}>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "8px" }}>
                  Marking as a business candidate is for your review only. It does not affect tax calculations, deductions, or write-offs.
                </div>
                {MIXED_USE_CATEGORIES.has((selected.category ?? "").toLowerCase()) && (
                  <div style={{ fontSize: "11px", color: "#f59e0b", marginBottom: "8px" }}>
                    Mixed-use category: may be personal or business.
                  </div>
                )}
                {bizMarkError && (
                  <div style={{ fontSize: "11px", color: "#ef4444", marginBottom: "8px" }}>{bizMarkError}</div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={markBusiness} disabled={markingBusiness}
                    style={{
                      flex: 1, padding: "8px", fontSize: "12px", fontWeight: 600,
                      background: "rgba(245,158,11,0.15)",
                      border: "1px solid rgba(245,158,11,0.4)",
                      borderRadius: "7px", color: "#f59e0b",
                      cursor: markingBusiness ? "not-allowed" : "pointer",
                      opacity: markingBusiness ? 0.7 : 1,
                    }}>
                    {markingBusiness ? "Marking..." : "Confirm"}
                  </button>
                  <button onClick={() => { setBizConfirmOpen(false); setBizMarkError(null); }}
                    style={{
                      padding: "8px 14px", fontSize: "12px", fontWeight: 500,
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "7px", color: "#475569", cursor: "pointer",
                    }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setBizConfirmOpen(true)}
                style={{
                  width: "100%", padding: "10px", marginBottom: "10px",
                  background: "transparent",
                  border: "1px solid rgba(245,158,11,0.25)",
                  borderRadius: "9px", color: "#f59e0b",
                  fontSize: "13px", fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(245,158,11,0.06)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                Mark as Business Candidate
              </button>
            )}

            {/* Write-Off Candidate */}
            {selected.is_writeoff_candidate ? (
              <div style={{
                padding: "10px 12px", marginBottom: "12px",
                background: "rgba(20,184,166,0.08)",
                border: "1px solid rgba(20,184,166,0.2)",
                borderRadius: "8px",
                fontSize: "12px", color: "#2dd4bf", fontWeight: 600,
                textAlign: "center",
              }}>
                Write-Off Candidate
              </div>
            ) : writeoffConfirmOpen ? (
              <div style={{
                padding: "12px", marginBottom: "12px",
                background: "rgba(20,184,166,0.06)",
                border: "1px solid rgba(20,184,166,0.2)",
                borderRadius: "8px",
              }}>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "8px" }}>
                  This only marks the transaction for write-off review. It does not create a write-off, calculate a deduction, or affect your taxes.
                </div>
                {writeoffMarkError && (
                  <div style={{ fontSize: "11px", color: "#ef4444", marginBottom: "8px" }}>{writeoffMarkError}</div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={markWriteOff} disabled={markingWriteOff}
                    style={{
                      flex: 1, padding: "8px", fontSize: "12px", fontWeight: 600,
                      background: "rgba(20,184,166,0.15)",
                      border: "1px solid rgba(20,184,166,0.4)",
                      borderRadius: "7px", color: "#2dd4bf",
                      cursor: markingWriteOff ? "not-allowed" : "pointer",
                      opacity: markingWriteOff ? 0.7 : 1,
                    }}>
                    {markingWriteOff ? "Marking..." : "Confirm"}
                  </button>
                  <button onClick={() => { setWriteoffConfirmOpen(false); setWriteoffMarkError(null); }}
                    style={{
                      padding: "8px 14px", fontSize: "12px", fontWeight: 500,
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "7px", color: "#475569", cursor: "pointer",
                    }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setWriteoffConfirmOpen(true)}
                style={{
                  width: "100%", padding: "10px", marginBottom: "10px",
                  background: "transparent",
                  border: "1px solid rgba(20,184,166,0.25)",
                  borderRadius: "9px", color: "#2dd4bf",
                  fontSize: "13px", fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(20,184,166,0.06)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                Mark as Write-Off Candidate
              </button>
            )}

            {/* Save */}
            <button onClick={saveChanges} disabled={saving}
              style={{
                width: "100%", padding: "11px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                border: "none", borderRadius: "9px", color: "#fff",
                fontSize: "13px", fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1, marginBottom: "10px",
              }}
            >{saving ? "Saving..." : "Save Changes"}</button>

            {/* Delete */}
            <button onClick={deleteTransaction} disabled={deleting}
              style={{
                width: "100%", padding: "10px", background: "transparent",
                border: "1px solid rgba(239,68,68,0.2)", borderRadius: "9px",
                color: "#ef4444", fontSize: "13px", fontWeight: 600,
                cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >{deleting ? "Deleting..." : "🗑 Delete Transaction"}</button>

            {panelMsg && (
              <div style={{
                marginTop: "12px", padding: "10px 12px",
                background: panelMsg.includes("success") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${panelMsg.includes("success") ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                borderRadius: "8px", fontSize: "12px",
                color: panelMsg.includes("success") ? "#22c55e" : "#ef4444",
              }}>{panelMsg}</div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

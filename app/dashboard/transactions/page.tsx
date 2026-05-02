"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../src/lib/supabase";
import { activePostedTransactions, calcTotalIn, calcTotalOut } from "../../../src/lib/financialCalculations";

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

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [txRes, acctRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("id, financial_account_id, transaction_type, direction, status, income_subtype, amount, currency, description, merchant_name, category, subcategory, transaction_date, provider, external_transaction_id, deleted_at")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("transaction_date", { ascending: false })
        .limit(500),
      supabase
        .from("financial_accounts")
        .select("id, account_name, mask, institution_name")
        .eq("user_id", user.id)
        .eq("is_active", true),
    ]);
    setTransactions(txRes.data ?? []);
    setAccounts(acctRes.data ?? []);
    setLoading(false);
  };

  const getAccount = (id: string) => accounts.find((a) => a.id === id);

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

  // Summary totals reflect ALL posted transactions, not just the current filter view.
  const postedTransactions = activePostedTransactions(transactions);
  const totalIn = calcTotalIn(postedTransactions);
  const totalOut = calcTotalOut(postedTransactions);

  const openPanel = (tx: Transaction) => {
    setSelected(tx);
    setEditSubtype(tx.income_subtype ?? "");
    setEditType(tx.transaction_type);
    setEditCategory(tx.category ?? "");
    setPanelMsg(null);
  };

  const saveChanges = async () => {
    if (!selected) return;
    setSaving(true);
    setPanelMsg(null);

    const updatedFields = {
      income_subtype: editSubtype || null,
      transaction_type: editType,
      category: editCategory || null,
    };
    const updates = { ...updatedFields, updated_at: new Date().toISOString() };

    const { error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", selected.id);

    if (error) {
      setPanelMsg("Failed to save. Please try again.");
      setSaving(false);
      return;
    }

    // Update primary transaction in local state
    setTransactions((prev) =>
      prev.map((t) => (t.id === selected.id ? { ...t, ...updatedFields } : t))
    );
    setSelected((prev) => (prev ? { ...prev, ...updatedFields } : null));

    // Auto-tag all other transactions with the same merchant name (or description fallback)
    let autoTagCount = 0;
    const matchKey = selected.merchant_name?.trim().toLowerCase();
    const descKey = selected.description?.trim().toLowerCase();

    if (matchKey || descKey) {
      let autoTagged: { id: string }[] | null = null;

      if (matchKey) {
        const { data } = await supabase
          .from("transactions")
          .update(updates)
          .neq("id", selected.id)
          .is("deleted_at", null)
          .ilike("merchant_name", matchKey)
          .select("id");
        autoTagged = data;
      } else if (descKey) {
        const { data } = await supabase
          .from("transactions")
          .update(updates)
          .neq("id", selected.id)
          .is("deleted_at", null)
          .ilike("description", descKey)
          .select("id");
        autoTagged = data;
      }

      autoTagCount = (autoTagged ?? []).length;

      if (autoTagCount > 0) {
        setTransactions((prev) =>
          prev.map((t) => {
            if (t.id === selected.id) return t;
            const name = t.merchant_name?.trim().toLowerCase();
            const desc = t.description?.trim().toLowerCase();
            const matches = matchKey ? name === matchKey : desc === descKey;
            return matches ? { ...t, ...updatedFields } : t;
          })
        );
      }
    }

    setPanelMsg(
      autoTagCount > 0
        ? `Saved. Also auto-tagged ${autoTagCount} matching transaction${autoTagCount === 1 ? "" : "s"}.`
        : "Saved successfully."
    );
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
              return (
                <div key={tx.id} onClick={() => openPanel(tx)}
                  style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    padding: "13px 16px",
                    background: isSelected ? "rgba(37,99,235,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isSelected ? "rgba(37,99,235,0.25)" : "rgba(255,255,255,0.04)"}`,
                    borderRadius: "10px", cursor: "pointer", transition: "all 0.15s ease",
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

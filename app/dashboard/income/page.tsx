"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../src/lib/supabase";
import { calcTotalIncome, calcTaggedIncome, toNum } from "../../../src/lib/financialCalculations";

interface Transaction {
  id: string;
  financial_account_id: string;
  transaction_type: string;
  direction: string;
  income_subtype: string | null;
  amount: number;
  currency: string;
  description: string | null;
  merchant_name: string | null;
  transaction_date: string;
  status: string;
  deleted_at: string | null;
}

interface Account {
  id: string;
  account_name: string;
  mask: string | null;
  institution_name: string | null;
}

const INCOME_SUBTYPES = [
  { value: "",          label: "Untagged",                    color: "#475569", rgb: "71,85,105" },
  { value: "salary",    label: "Salary / W2",                 color: "#38bdf8", rgb: "56,189,248" },
  { value: "bonus",     label: "Bonus",                       color: "#22c55e", rgb: "34,197,94" },
  { value: "business",  label: "Business / Self-employment",  color: "#a855f7", rgb: "168,85,247" },
  { value: "rental",    label: "Rental Income",               color: "#f59e0b", rgb: "245,158,11" },
  { value: "dividend",  label: "Dividend",                    color: "#6366f1", rgb: "99,102,241" },
  { value: "interest",  label: "Interest",                    color: "#ec4899", rgb: "236,72,153" },
  { value: "other",     label: "Other Income",                color: "#64748b", rgb: "100,116,139" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function fmtCompact(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function getSubtypeInfo(value: string | null) {
  return INCOME_SUBTYPES.find((s) => s.value === (value ?? "")) ?? INCOME_SUBTYPES[0];
}

export default function IncomePage() {
  const supabase = useMemo(() => createClient(), []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [editSubtype, setEditSubtype] = useState("");
  const [saving, setSaving] = useState(false);
  const [panelMsg, setPanelMsg] = useState<string | null>(null);
  const [filterSubtype, setFilterSubtype] = useState<string>("all");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [txRes, acctRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("id, financial_account_id, transaction_type, direction, income_subtype, amount, currency, description, merchant_name, transaction_date, status, deleted_at, external_transaction_id, provider")
        .eq("user_id", user.id)
        .eq("direction", "credit")
        .eq("status", "posted")
        .is("deleted_at", null)
        .order("transaction_date", { ascending: false }),
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
    if (filterSubtype === "all") return true;
    if (filterSubtype === "untagged") return !tx.income_subtype;
    return tx.income_subtype === filterSubtype;
  });

  const totalIncome = calcTotalIncome(transactions);
  const taggedIncome = calcTaggedIncome(transactions);
  const untaggedCount = transactions.filter((t) => !t.income_subtype).length;

  // Income by subtype breakdown
  const bySubtype = INCOME_SUBTYPES.slice(1).map((sub) => {
    const txs = transactions.filter((t) => t.income_subtype === sub.value);
    const total = txs.reduce((s, t) => s + Number(t.amount), 0);
    return { ...sub, total, count: txs.length };
  }).filter((s) => s.total > 0);

  const openPanel = (tx: Transaction) => {
    setSelected(tx);
    setEditSubtype(tx.income_subtype ?? "");
    setPanelMsg(null);
  };

  const saveTag = async () => {
    if (!selected) return;
    setSaving(true);
    setPanelMsg(null);

    const { error } = await supabase
      .from("transactions")
      .update({
        income_subtype: editSubtype || null,
        transaction_type: editSubtype ? "income" : "bank",
        updated_at: new Date().toISOString(),
      })
      .eq("id", selected.id);

    if (error) {
      setPanelMsg("Failed to save.");
    } else {
      setPanelMsg("Saved.");
      setTransactions((prev) =>
        prev.map((t) => t.id === selected.id
          ? { ...t, income_subtype: editSubtype || null, transaction_type: editSubtype ? "income" : "bank" }
          : t
        )
      );
      setSelected((prev) => prev ? { ...prev, income_subtype: editSubtype || null } : null);
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: "1100px", display: "flex", gap: "24px", alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Income Tracker
          </h1>
          <p style={{ color: "#475569", fontSize: "13.5px", margin: 0 }}>
            All money coming in. Tag each source to power your tax estimates.
          </p>
        </div>

        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Total Income",    value: fmt(totalIncome),   color: "#22c55e", rgb: "34,197,94" },
            { label: "Tagged Income",   value: fmt(taggedIncome),  color: "#38bdf8", rgb: "56,189,248" },
            { label: "Untagged",        value: `${untaggedCount} transactions`, color: "#f59e0b", rgb: "245,158,11" },
            { label: "Income Sources",  value: `${bySubtype.length} types`, color: "#a855f7", rgb: "168,85,247" },
          ].map((k, i) => (
            <div key={i} style={{
              padding: "16px", background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px",
            }}>
              <div style={{ fontSize: "10px", color: "#475569", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "6px" }}>{k.label}</div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: k.color }}>{k.value}</div>
              <div style={{ marginTop: "8px", height: "2px", background: `rgba(${k.rgb},0.3)`, borderRadius: "1px" }} />
            </div>
          ))}
        </div>

        {/* Income breakdown by type */}
        {bySubtype.length > 0 && (
          <div style={{ marginBottom: "24px", padding: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: "14px" }}>INCOME BY SOURCE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {bySubtype.map((sub) => {
                const pct = totalIncome > 0 ? (sub.total / totalIncome) * 100 : 0;
                return (
                  <div key={sub.value}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>{sub.label}</span>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "#475569" }}>{pct.toFixed(1)}%</span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: sub.color }}>{fmt(sub.total)}</span>
                      </div>
                    </div>
                    <div style={{ height: "6px", background: "rgba(255,255,255,0.04)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${pct}%`,
                        background: `linear-gradient(90deg, ${sub.color}, rgba(${sub.rgb},0.6))`,
                        borderRadius: "3px",
                        boxShadow: `0 0 8px rgba(${sub.rgb},0.5)`,
                        transition: "width 0.6s ease",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {[
            { value: "all",      label: `All (${transactions.length})` },
            { value: "untagged", label: `Untagged (${untaggedCount})` },
            ...INCOME_SUBTYPES.slice(1).filter((s) => transactions.some((t) => t.income_subtype === s.value)).map((s) => ({
              value: s.value, label: s.label,
            })),
          ].map((f) => (
            <button key={f.value} onClick={() => setFilterSubtype(f.value)}
              style={{
                padding: "6px 14px", borderRadius: "7px", cursor: "pointer",
                background: filterSubtype === f.value ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${filterSubtype === f.value ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.07)"}`,
                color: filterSubtype === f.value ? "#38bdf8" : "#64748b",
                fontSize: "12px", fontWeight: 500,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>💰</div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>No income transactions found</div>
            <div style={{ fontSize: "13px", color: "#334155" }}>Connect a bank account to sync income activity.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {filtered.map((tx) => {
              const subtype = getSubtypeInfo(tx.income_subtype);
              const account = getAccount(tx.financial_account_id);
              const isSelected = selected?.id === tx.id;

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
                  {/* Icon */}
                  <div style={{
                    width: "42px", height: "42px", borderRadius: "12px", flexShrink: 0,
                    background: `linear-gradient(145deg, rgba(${subtype.rgb},0.15), rgba(${subtype.rgb},0.3))`,
                    border: `1px solid rgba(${subtype.rgb},0.3)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "18px",
                    boxShadow: `0 4px 12px rgba(${subtype.rgb},0.2), inset 0 1px 0 rgba(${subtype.rgb},0.2)`,
                  }}>
                    💰
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#e2e8f0", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tx.merchant_name ?? tx.description ?? "Income"}
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "11px", color: "#334155" }}>
                        {new Date(tx.transaction_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {account && (
                        <span style={{ fontSize: "11px", color: "#1e293b" }}>
                          {account.institution_name ?? account.account_name}{account.mask ? ` ••${account.mask}` : ""}
                        </span>
                      )}
                      <span style={{
                        fontSize: "10px", fontWeight: 600,
                        color: subtype.color,
                        background: `rgba(${subtype.rgb},0.1)`,
                        padding: "1px 8px", borderRadius: "99px",
                        border: `1px solid rgba(${subtype.rgb},0.2)`,
                      }}>
                        {tx.income_subtype ? subtype.label : "Untagged"}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#22c55e" }}>
                      +{fmt(Number(tx.amount))}
                    </div>
                    <div style={{ fontSize: "10px", color: "#22c55e", fontWeight: 500 }}>Money In</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-out panel */}
      {selected && (
        <div style={{
          width: "300px", flexShrink: 0,
          background: "rgba(8,11,18,0.97)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px", padding: "24px",
          position: "sticky", top: "86px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          backdropFilter: "blur(20px)",
          maxHeight: "calc(100vh - 110px)", overflowY: "auto",
        }}>
          <button onClick={() => setSelected(null)}
            style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: "16px" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#94a3b8"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#475569"}
          >✕</button>

          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>💰</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc", marginBottom: "4px" }}>
              {selected.merchant_name ?? selected.description ?? "Income"}
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#22c55e" }}>
              +{fmt(Number(selected.amount))}
            </div>
            <div style={{ fontSize: "12px", color: "#475569", marginTop: "4px" }}>
              {new Date(selected.transaction_date).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>

          {/* Tax impact notice */}
          <div style={{
            padding: "12px", marginBottom: "18px",
            background: "rgba(37,99,235,0.06)",
            border: "1px solid rgba(37,99,235,0.15)",
            borderRadius: "10px",
          }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", marginBottom: "4px" }}>💡 TAX IMPACT</div>
            <div style={{ fontSize: "11px", color: "#475569", lineHeight: 1.5 }}>
              Tagging as <strong style={{ color: "#a855f7" }}>Business</strong> or <strong style={{ color: "#f59e0b" }}>Rental</strong> income will include this in your estimated tax calculations.
              <strong style={{ color: "#38bdf8" }}> Salary</strong> is excluded — taxes already withheld.
            </div>
          </div>

          {/* Income type selector */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "10px", fontWeight: 700, color: "#475569", letterSpacing: "0.1em", display: "block", marginBottom: "10px" }}>
              INCOME TYPE
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {INCOME_SUBTYPES.map((sub) => (
                <button key={sub.value} onClick={() => setEditSubtype(sub.value)}
                  style={{
                    padding: "10px 12px", borderRadius: "9px", cursor: "pointer",
                    background: editSubtype === sub.value ? `rgba(${sub.rgb},0.15)` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${editSubtype === sub.value ? `rgba(${sub.rgb},0.4)` : "rgba(255,255,255,0.06)"}`,
                    color: editSubtype === sub.value ? sub.color : "#475569",
                    fontSize: "12px", fontWeight: editSubtype === sub.value ? 600 : 400,
                    textAlign: "left", transition: "all 0.15s ease",
                    display: "flex", alignItems: "center", gap: "8px",
                  }}
                >
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: editSubtype === sub.value ? sub.color : "rgba(255,255,255,0.1)",
                    boxShadow: editSubtype === sub.value ? `0 0 6px ${sub.color}` : "none",
                    flexShrink: 0,
                  }} />
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={saveTag} disabled={saving}
            style={{
              width: "100%", padding: "12px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              border: "none", borderRadius: "9px", color: "#fff",
              fontSize: "13px", fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >{saving ? "Saving..." : "Save Income Tag"}</button>

          {panelMsg && (
            <div style={{
              marginTop: "12px", padding: "10px 12px",
              background: panelMsg === "Saved." ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${panelMsg === "Saved." ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
              borderRadius: "8px", fontSize: "12px",
              color: panelMsg === "Saved." ? "#22c55e" : "#ef4444",
            }}>{panelMsg}</div>
          )}
        </div>
      )}
    </div>
  );
}

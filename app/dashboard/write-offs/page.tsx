"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../src/lib/supabase";
import {
  DEFAULT_TAX_RATE,
  calcTotalWriteOffExpenses,
  calcTotalDeductible,
  calcTaxSavingsEstimate,
  toNum,
} from "../../../src/lib/financialCalculations";

interface WriteOff {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  tax_year: number;
  deduction_type: string;
  is_verified: boolean;
  notes: string | null;
  transaction_id: string | null;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  direction: string;
}

const DEDUCTION_TYPES = [
  { value: "home_office",  label: "Home Office",           icon: "🏠", color: "#6366f1", rgb: "99,102,241",   pct: 100 },
  { value: "vehicle",      label: "Vehicle & Mileage",     icon: "🚗", color: "#f97316", rgb: "249,115,22",   pct: 100 },
  { value: "equipment",    label: "Equipment & Hardware",  icon: "💻", color: "#38bdf8", rgb: "56,189,248",   pct: 100 },
  { value: "software",     label: "Software & Subscriptions", icon: "🔧", color: "#a855f7", rgb: "168,85,247", pct: 100 },
  { value: "meals",        label: "Business Meals",        icon: "🍽️", color: "#22c55e", rgb: "34,197,94",    pct: 50  },
  { value: "travel",       label: "Business Travel",       icon: "✈️", color: "#0ea5e9", rgb: "14,165,233",   pct: 100 },
  { value: "marketing",    label: "Marketing & Advertising", icon: "📣", color: "#ec4899", rgb: "236,72,153", pct: 100 },
  { value: "professional", label: "Professional Services", icon: "⚖️", color: "#f59e0b", rgb: "245,158,11",  pct: 100 },
  { value: "education",    label: "Business Education",    icon: "📚", color: "#06b6d4", rgb: "6,182,212",    pct: 100 },
  { value: "other",        label: "Other Business Expense",icon: "📋", color: "#64748b", rgb: "100,116,139",  pct: 100 },
];

function getDeductionType(value: string) {
  return DEDUCTION_TYPES.find((d) => d.value === value) ?? DEDUCTION_TYPES[DEDUCTION_TYPES.length - 1];
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n ?? 0);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "9px", color: "#e2e8f0", fontSize: "13px",
  outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "10px", fontWeight: 700, color: "#475569",
  letterSpacing: "0.1em", display: "block", marginBottom: "6px",
};

const modalOverlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 500,
  background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
};

const modalBox: React.CSSProperties = {
  width: "100%", maxWidth: "460px",
  background: "rgba(8,11,18,0.98)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "20px", padding: "28px",
  boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
  maxHeight: "90vh", overflowY: "auto",
};

export default function WriteOffsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [writeOffs, setWriteOffs] = useState<WriteOff[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [filterType, setFilterType] = useState("all");
  const [selectedWriteOff, setSelectedWriteOff] = useState<WriteOff | null>(null);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newType, setNewType] = useState("equipment");
  const [newNotes, setNewNotes] = useState("");
  const [newTransactionId, setNewTransactionId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editCategory, setEditCategory] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [selectedYear]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [writeOffsRes, txRes] = await Promise.all([
      supabase.from("write_offs")
        .select("id, category, description, amount, expense_date, tax_year, deduction_type, is_verified, notes, transaction_id")
        .eq("user_id", user.id)
        .eq("tax_year", selectedYear)
        .order("expense_date", { ascending: false }),
      supabase.from("transactions")
        .select("id, description, amount, transaction_date, direction")
        .eq("user_id", user.id)
        .eq("direction", "debit")
        .is("deleted_at", null)
        .order("transaction_date", { ascending: false })
        .limit(100),
    ]);

    setWriteOffs(writeOffsRes.data ?? []);
    setTransactions(txRes.data ?? []);
    setLoading(false);
  };

  const addWriteOff = async () => {
    if (!newAmount || !newDate || !newType) return;
    setSaving(true); setSaveMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("write_offs").insert({
      user_id: user.id,
      category: newCategory || getDeductionType(newType).label,
      description: newDesc || null,
      amount: Number(newAmount),
      expense_date: newDate,
      tax_year: selectedYear,
      deduction_type: newType,
      is_verified: false,
      notes: newNotes || null,
      transaction_id: newTransactionId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setSaveMsg("Failed to save. Please try again.");
    } else {
      setNewCategory(""); setNewDesc(""); setNewAmount("");
      setNewDate(new Date().toISOString().split("T")[0]);
      setNewType("equipment"); setNewNotes(""); setNewTransactionId("");
      setShowAdd(false); setSaveMsg(null);
      await loadData();
    }
    setSaving(false);
  };

  const openEdit = (wo: WriteOff) => {
    setSelectedWriteOff(wo);
    setEditCategory(wo.category);
    setEditDesc(wo.description ?? "");
    setEditAmount(String(wo.amount));
    setEditDate(wo.expense_date);
    setEditType(wo.deduction_type);
    setEditNotes(wo.notes ?? "");
    setEditMsg(null);
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!selectedWriteOff || !editAmount || !editDate) return;
    setEditSaving(true); setEditMsg(null);
    const { error } = await supabase.from("write_offs").update({
      category: editCategory,
      description: editDesc || null,
      amount: Number(editAmount),
      expense_date: editDate,
      deduction_type: editType,
      notes: editNotes || null,
      updated_at: new Date().toISOString(),
    }).eq("id", selectedWriteOff.id);

    if (error) {
      setEditMsg("Failed to save.");
    } else {
      setShowEdit(false); setSelectedWriteOff(null);
      await loadData();
    }
    setEditSaving(false);
  };

  const toggleVerified = async (wo: WriteOff) => {
    await supabase.from("write_offs").update({
      is_verified: !wo.is_verified,
      updated_at: new Date().toISOString(),
    }).eq("id", wo.id);
    await loadData();
  };

  const deleteWriteOff = async (id: string) => {
    if (!confirm("Delete this write-off?")) return;
    await supabase.from("write_offs").delete().eq("id", id);
    await loadData();
  };

  // ── Calculations (via central module) ───────────────────────────────────
  const filtered = filterType === "all" ? writeOffs : writeOffs.filter((w) => w.deduction_type === filterType);
  const totalExpenses = calcTotalWriteOffExpenses(writeOffs);
  const totalDeductible = calcTotalDeductible(writeOffs, DEDUCTION_TYPES);
  const taxSavingsEst = calcTaxSavingsEstimate(totalDeductible, DEFAULT_TAX_RATE);
  const verifiedCount = writeOffs.filter((w) => w.is_verified).length;
  const byCategory = DEDUCTION_TYPES.map((dt) => {
    const items = writeOffs.filter((w) => w.deduction_type === dt.value);
    const total = items.reduce((s, w) => s + toNum(w.amount), 0);
    const deductible = total * dt.pct / 100;
    return { ...dt, total, deductible, count: items.length };
  }).filter((d) => d.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Write-Offs</h1>
          <p style={{ color: "#475569", fontSize: "13.5px", margin: 0 }}>Track business expenses and deductions to reduce your taxable income.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ ...inputStyle, width: "auto", padding: "9px 14px" }}>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <button onClick={() => setShowAdd(true)}
            style={{ padding: "10px 18px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "9px", color: "#22c55e", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            + Add Write-Off
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Expenses",     value: fmt(totalExpenses),    color: "#ef4444", rgb: "239,68,68",   sub: `${writeOffs.length} entries` },
          { label: "Total Deductible",   value: fmt(totalDeductible),  color: "#22c55e", rgb: "34,197,94",   sub: "After deduction rules" },
          { label: "Tax Savings Est.",   value: fmt(taxSavingsEst), color: "#38bdf8", rgb: "56,189,248", sub: `At ~${Math.round(DEFAULT_TAX_RATE * 100)}% effective rate` },
          { label: "Verified",           value: `${verifiedCount} / ${writeOffs.length}`, color: "#a855f7", rgb: "168,85,247", sub: "Entries confirmed" },
        ].map((k, i) => (
          <div key={i} style={{ padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "70px", height: "70px", borderRadius: "50%", background: `radial-gradient(circle, rgba(${k.rgb},0.1) 0%, transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ fontSize: "10px", color: "#475569", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "6px" }}>{k.label}</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: "10px", color: "#334155", marginTop: "3px" }}>{k.sub}</div>
            <div style={{ marginTop: "8px", height: "2px", background: `rgba(${k.rgb},0.3)`, borderRadius: "1px" }} />
          </div>
        ))}
      </div>

      {/* IRS Note */}
      <div style={{ marginBottom: "20px", padding: "12px 16px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "10px", fontSize: "11px", color: "#64748b", lineHeight: 1.6 }}>
        💡 <strong style={{ color: "#f59e0b" }}>IRS Rules:</strong> Business meals are only 50% deductible. Home office deductions require exclusive and regular use. Vehicle deductions require a mileage log. Always keep receipts. Consult a tax professional for guidance specific to your situation.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "20px", alignItems: "flex-start" }}>
        {/* Category breakdown sidebar */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "18px", position: "sticky", top: "86px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: "14px" }}>BY CATEGORY</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button onClick={() => setFilterType("all")}
              style={{ padding: "8px 10px", background: filterType === "all" ? "rgba(255,255,255,0.08)" : "transparent", border: `1px solid ${filterType === "all" ? "rgba(255,255,255,0.15)" : "transparent"}`, borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", width: "100%" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: filterType === "all" ? 700 : 400 }}>All Categories</span>
              <span style={{ fontSize: "11px", color: "#475569" }}>{fmt(totalExpenses)}</span>
            </button>
            {byCategory.map((cat) => (
              <button key={cat.value} onClick={() => setFilterType(filterType === cat.value ? "all" : cat.value)}
                style={{ padding: "8px 10px", background: filterType === cat.value ? `rgba(${cat.rgb},0.1)` : "transparent", border: `1px solid ${filterType === cat.value ? `rgba(${cat.rgb},0.25)` : "transparent"}`, borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <span style={{ fontSize: "13px" }}>{cat.icon}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "11px", color: filterType === cat.value ? cat.color : "#94a3b8", fontWeight: filterType === cat.value ? 700 : 400 }}>{cat.label}</div>
                    <div style={{ fontSize: "9px", color: "#334155" }}>{cat.count} {cat.count === 1 ? "entry" : "entries"}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: cat.color }}>{fmt(cat.deductible)}</div>
                  {cat.pct < 100 && <div style={{ fontSize: "9px", color: "#334155" }}>{cat.pct}% deductible</div>}
                </div>
              </button>
            ))}

            {byCategory.length === 0 && (
              <div style={{ padding: "16px", textAlign: "center", color: "#334155", fontSize: "12px" }}>No write-offs yet</div>
            )}
          </div>

          {totalDeductible > 0 && (
            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "9px", color: "#334155", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "4px" }}>TOTAL DEDUCTIBLE</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#22c55e" }}>{fmt(totalDeductible)}</div>
              <div style={{ fontSize: "10px", color: "#334155", marginTop: "2px" }}>Reduces taxable income</div>
            </div>
          )}
        </div>

        {/* Write-offs list */}
        <div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: "14px" }}>
            {filterType === "all" ? `ALL WRITE-OFFS (${filtered.length})` : `${getDeductionType(filterType).label.toUpperCase()} (${filtered.length})`}
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>✍️</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>No write-offs yet for {selectedYear}</div>
              <div style={{ fontSize: "13px", color: "#334155", marginBottom: "16px" }}>Start logging business expenses to reduce your taxable income.</div>
              <button onClick={() => setShowAdd(true)} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                Add First Write-Off
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filtered.map((wo) => {
                const dt = getDeductionType(wo.deduction_type);
                const deductible = Number(wo.amount) * dt.pct / 100;
                return (
                  <div key={wo.id} style={{
                    padding: "16px 18px",
                    background: wo.is_verified ? "rgba(34,197,94,0.03)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${wo.is_verified ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: "12px", transition: "all 0.15s ease",
                    display: "flex", gap: "14px", alignItems: "center",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.055)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = wo.is_verified ? "rgba(34,197,94,0.03)" : "rgba(255,255,255,0.03)"}
                  >
                    {/* Icon */}
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `linear-gradient(145deg, rgba(${dt.rgb},0.2), rgba(${dt.rgb},0.4))`, border: `1px solid rgba(${dt.rgb},0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                      {dt.icon}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>{wo.category}</div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "12px" }}>
                          <div style={{ fontSize: "15px", fontWeight: 800, color: "#ef4444" }}>−{fmt(wo.amount)}</div>
                          {dt.pct < 100 && <div style={{ fontSize: "10px", color: "#22c55e" }}>{fmt(deductible)} deductible</div>}
                        </div>
                      </div>
                      {wo.description && <div style={{ fontSize: "11px", color: "#475569", marginBottom: "4px" }}>{wo.description}</div>}
                      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "10px", color: "#334155" }}>{fmtDate(wo.expense_date)}</span>
                        <span style={{ fontSize: "10px", padding: "2px 8px", background: `rgba(${dt.rgb},0.1)`, border: `1px solid rgba(${dt.rgb},0.2)`, borderRadius: "99px", color: dt.color }}>{dt.label}</span>
                        {dt.pct < 100 && <span style={{ fontSize: "10px", color: "#f59e0b" }}>{dt.pct}% deductible</span>}
                        {wo.transaction_id && <span style={{ fontSize: "10px", color: "#334155" }}>📎 Linked</span>}
                      </div>
                      {wo.notes && <div style={{ fontSize: "10px", color: "#334155", marginTop: "4px", fontStyle: "italic" }}>{wo.notes}</div>}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", flexShrink: 0 }}>
                      <button onClick={() => toggleVerified(wo)}
                        style={{ padding: "5px 10px", background: wo.is_verified ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${wo.is_verified ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: "6px", color: wo.is_verified ? "#22c55e" : "#475569", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}
                        title={wo.is_verified ? "Mark as unverified" : "Mark as verified"}>
                        {wo.is_verified ? "✓ Verified" : "Verify"}
                      </button>
                      <button onClick={() => openEdit(wo)}
                        style={{ padding: "5px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#475569", fontSize: "10px", cursor: "pointer" }}>
                        Edit
                      </button>
                      <button onClick={() => deleteWriteOff(wo.id)}
                        style={{ padding: "5px 10px", background: "transparent", border: "none", color: "#334155", fontSize: "10px", cursor: "pointer" }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ADD WRITE-OFF MODAL ── */}
      {showAdd && (
        <div style={modalOverlay} onClick={() => setShowAdd(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Add Write-Off</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 20px" }}>Log a business expense to reduce your {selectedYear} taxable income.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              <div>
                <label style={labelStyle}>EXPENSE TYPE</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  {DEDUCTION_TYPES.map((d) => <option key={d.value} value={d.value}>{d.icon} {d.label}{d.pct < 100 ? ` (${d.pct}% deductible)` : ""}</option>)}
                </select>
                {getDeductionType(newType).pct < 100 && (
                  <div style={{ fontSize: "10px", color: "#f59e0b", marginTop: "5px" }}>
                    ⚠️ Only {getDeductionType(newType).pct}% of this expense type is deductible per IRS rules
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>CATEGORY / NAME</label>
                <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder={getDeductionType(newType).label} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              <div>
                <label style={labelStyle}>AMOUNT</label>
                <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0.00"
                  style={{ ...inputStyle, fontSize: "18px", fontWeight: 700 }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
                {newAmount && getDeductionType(newType).pct < 100 && (
                  <div style={{ fontSize: "10px", color: "#22c55e", marginTop: "5px" }}>
                    Deductible amount: {fmt(Number(newAmount) * getDeductionType(newType).pct / 100)}
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>DATE</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              <div>
                <label style={labelStyle}>DESCRIPTION (optional)</label>
                <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What was this expense for?" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              <div>
                <label style={labelStyle}>LINK TO TRANSACTION (optional)</label>
                <select value={newTransactionId} onChange={(e) => setNewTransactionId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">No linked transaction</option>
                  {transactions.map((tx) => (
                    <option key={tx.id} value={tx.id}>
                      {new Date(tx.transaction_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {tx.description.substring(0, 40)} — {fmt(tx.amount)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>NOTES (optional)</label>
                <input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Receipt location, business purpose, etc." style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              {saveMsg && (
                <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", fontSize: "12px", color: "#ef4444" }}>{saveMsg}</div>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={addWriteOff} disabled={saving || !newAmount || !newDate}
                  style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: saving || !newAmount || !newDate ? "not-allowed" : "pointer", opacity: saving || !newAmount || !newDate ? 0.7 : 1 }}>
                  {saving ? "Saving..." : "Add Write-Off"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT WRITE-OFF MODAL ── */}
      {showEdit && selectedWriteOff && (
        <div style={modalOverlay} onClick={() => setShowEdit(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Edit Write-Off</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 20px" }}>Update the details for this expense.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              <div>
                <label style={labelStyle}>EXPENSE TYPE</label>
                <select value={editType} onChange={(e) => setEditType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  {DEDUCTION_TYPES.map((d) => <option key={d.value} value={d.value}>{d.icon} {d.label}{d.pct < 100 ? ` (${d.pct}% deductible)` : ""}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>CATEGORY / NAME</label>
                <input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              <div>
                <label style={labelStyle}>AMOUNT</label>
                <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} style={{ ...inputStyle, fontSize: "18px", fontWeight: 700 }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              <div>
                <label style={labelStyle}>DATE</label>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              <div>
                <label style={labelStyle}>DESCRIPTION (optional)</label>
                <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              <div>
                <label style={labelStyle}>NOTES (optional)</label>
                <input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              {editMsg && (
                <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", fontSize: "12px", color: "#ef4444" }}>{editMsg}</div>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowEdit(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={saveEdit} disabled={editSaving || !editAmount || !editDate}
                  style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: editSaving ? "not-allowed" : "pointer", opacity: editSaving ? 0.7 : 1 }}>
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

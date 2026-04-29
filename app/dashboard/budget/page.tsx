"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../src/lib/supabase";

interface BudgetCategory {
  id: string;
  name: string;
  description: string | null;
  category_type: string;
  monthly_limit: number | null;
  is_active: boolean;
}

interface BudgetRecord {
  id: string;
  category_id: string;
  budget_amount: number;
  actual_spent: number;
  adjustment_amount: number;
  variance: number | null;
  status: string;
  start_date: string;
  end_date: string;
}

interface Envelope {
  id: string;
  name: string;
  description: string | null;
  budgeted_amount: number;
  spent_amount: number;
  period_type: string;
  color_index: number;
  is_active: boolean;
  total_stuffed_alltime: number;
  total_spent_alltime: number;
  last_reset_at: string | null;
}

interface EnvelopeTx {
  id: string;
  envelope_id: string;
  amount: number;
  transaction_type: string;
  note: string | null;
  created_at: string;
}

const CATEGORY_ICONS: Record<string, { icon: string; color: string; rgb: string }> = {
  "gas":         { icon: "⛽", color: "#f97316", rgb: "249,115,22" },
  "fuel":        { icon: "⛽", color: "#f97316", rgb: "249,115,22" },
  "grocery":     { icon: "🛒", color: "#22c55e", rgb: "34,197,94" },
  "groceries":   { icon: "🛒", color: "#22c55e", rgb: "34,197,94" },
  "food":        { icon: "🍔", color: "#ef4444", rgb: "239,68,68" },
  "eating":      { icon: "🍽️", color: "#ef4444", rgb: "239,68,68" },
  "restaurant":  { icon: "🍽️", color: "#ef4444", rgb: "239,68,68" },
  "utility":     { icon: "💡", color: "#fbbf24", rgb: "251,191,36" },
  "utilities":   { icon: "💡", color: "#fbbf24", rgb: "251,191,36" },
  "beauty":      { icon: "💅", color: "#ec4899", rgb: "236,72,153" },
  "personal":    { icon: "🧴", color: "#ec4899", rgb: "236,72,153" },
  "rent":        { icon: "🏠", color: "#6366f1", rgb: "99,102,241" },
  "housing":     { icon: "🏠", color: "#6366f1", rgb: "99,102,241" },
  "transport":   { icon: "🚗", color: "#38bdf8", rgb: "56,189,248" },
  "car":         { icon: "🚗", color: "#38bdf8", rgb: "56,189,248" },
  "health":      { icon: "❤️", color: "#ef4444", rgb: "239,68,68" },
  "medical":     { icon: "🏥", color: "#ef4444", rgb: "239,68,68" },
  "gym":         { icon: "💪", color: "#f97316", rgb: "249,115,22" },
  "fitness":     { icon: "💪", color: "#f97316", rgb: "249,115,22" },
  "entertain":   { icon: "🎬", color: "#a855f7", rgb: "168,85,247" },
  "subscription":{ icon: "🔔", color: "#a855f7", rgb: "168,85,247" },
  "shopping":    { icon: "🛍️", color: "#f43f5e", rgb: "244,63,94" },
  "clothing":    { icon: "👗", color: "#f43f5e", rgb: "244,63,94" },
  "travel":      { icon: "✈️", color: "#0ea5e9", rgb: "14,165,233" },
  "education":   { icon: "📚", color: "#06b6d4", rgb: "6,182,212" },
  "pet":         { icon: "🐾", color: "#84cc16", rgb: "132,204,22" },
  "child":       { icon: "👶", color: "#f59e0b", rgb: "245,158,11" },
  "insurance":   { icon: "🛡️", color: "#64748b", rgb: "100,116,139" },
  "donation":    { icon: "❤️", color: "#ef4444", rgb: "239,68,68" },
};

const ENVELOPE_COLORS = [
  { color: "#38bdf8", rgb: "56,189,248" },
  { color: "#22c55e", rgb: "34,197,94" },
  { color: "#a855f7", rgb: "168,85,247" },
  { color: "#f59e0b", rgb: "245,158,11" },
  { color: "#ef4444", rgb: "239,68,68" },
  { color: "#6366f1", rgb: "99,102,241" },
  { color: "#ec4899", rgb: "236,72,153" },
  { color: "#f97316", rgb: "249,115,22" },
  { color: "#06b6d4", rgb: "6,182,212" },
  { color: "#84cc16", rgb: "132,204,22" },
];

function getCategoryStyle(name: string) {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return val;
  }
  return { icon: "📊", color: "#475569", rgb: "71,85,105" };
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n ?? 0);
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  return { start, end };
}

// remaining = monthly_limit - actual_spent + adjustment_amount
function getRemaining(cat: BudgetCategory, record: BudgetRecord | null) {
  const limit = Number(cat.monthly_limit ?? 0);
  const spent = Number(record?.actual_spent ?? 0);
  const adj = Number(record?.adjustment_amount ?? 0);
  return limit - spent + adj;
}

function DonutChart({ pct, color, size = 64, strokeWidth = 8 }: {
  pct: number; color: string; size?: number; strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  const cx = size / 2; const cy = size / 2;
  const isOver = pct > 100;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={isOver ? "#ef4444" : color} strokeWidth={strokeWidth}
        strokeDasharray={`${Math.min(dash, circ)} ${circ}`}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${isOver ? "#ef4444" : color}88)` }}
      />
    </svg>
  );
}

function Envelope3D({ color, rgb, size = 56 }: { color: string; rgb: string; size?: number }) {
  const uid = rgb.replace(/,/g, "");
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 80 60"
      style={{ filter: `drop-shadow(0 4px 10px rgba(${rgb},0.5))` }}>
      <defs>
        <linearGradient id={`envb-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`envf-${uid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect x="2" y="18" width="76" height="40" rx="5" fill={`url(#envb-${uid})`} />
      <rect x="2" y="18" width="8" height="40" rx="5" fill="rgba(0,0,0,0.15)" />
      <rect x="70" y="18" width="10" height="40" rx="5" fill="rgba(0,0,0,0.1)" />
      <path d="M2 18 L40 42 L78 18 Z" fill={`url(#envf-${uid})`} />
      <path d="M2 18 L40 42 L78 18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <path d="M2 58 L32 40" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <path d="M78 58 L48 40" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <ellipse cx="22" cy="24" rx="10" ry="3" fill="rgba(255,255,255,0.22)" />
    </svg>
  );
}

export default function BudgetPage() {
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<"tracker" | "envelopes">("tracker");
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [records, setRecords] = useState<BudgetRecord[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [envelopeTxs, setEnvelopeTxs] = useState<EnvelopeTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnvelope, setSelectedEnvelope] = useState<Envelope | null>(null);

  // Category modals
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatLimit, setNewCatLimit] = useState("");
  const [newCatType, setNewCatType] = useState("expense");
  const [savingCat, setSavingCat] = useState(false);

  // Record expense modal
  const [spendAction, setSpendAction] = useState<{ cat: BudgetCategory; record: BudgetRecord | null } | null>(null);
  const [spendAmount, setSpendAmount] = useState("");
  const [spendSaving, setSpendSaving] = useState(false);

  // Adjust modal (adds to remaining via adjustment_amount)
  const [adjustAction, setAdjustAction] = useState<{ cat: BudgetCategory; record: BudgetRecord | null } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustSaving, setAdjustSaving] = useState(false);

  // Reallocate modal
  const [reallocateAction, setReallocateAction] = useState<{ cat: BudgetCategory; record: BudgetRecord | null } | null>(null);
  const [reallocateAmount, setReallocateAmount] = useState("");
  const [reallocateTarget, setReallocateTarget] = useState("");
  const [reallocateSaving, setReallocateSaving] = useState(false);

  // Reset modal
  const [resetAction, setResetAction] = useState<{ cat: BudgetCategory; record: BudgetRecord | null } | null>(null);

  // Envelope modals
  const [showAddEnvelope, setShowAddEnvelope] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const [newEnvBudget, setNewEnvBudget] = useState("");
  const [newEnvDesc, setNewEnvDesc] = useState("");
  const [newEnvPeriod, setNewEnvPeriod] = useState("monthly");
  const [savingEnv, setSavingEnv] = useState(false);

  const [envelopeAction, setEnvelopeAction] = useState<{ env: Envelope; type: "add" | "spend" } | null>(null);
  const [actionAmount, setActionAmount] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [actionSaving, setActionSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { start, end } = getMonthRange();

    const [catRes, recRes, envRes, envTxRes] = await Promise.all([
      supabase.from("budget_categories").select("id, name, description, category_type, monthly_limit, is_active").eq("user_id", user.id).eq("is_active", true).order("created_at"),
      supabase.from("budget_records").select("id, category_id, budget_amount, actual_spent, adjustment_amount, variance, status, start_date, end_date").eq("user_id", user.id).gte("start_date", start).lte("end_date", end),
      supabase.from("envelopes").select("id, name, description, budgeted_amount, spent_amount, period_type, color_index, is_active, total_stuffed_alltime, total_spent_alltime, last_reset_at").eq("user_id", user.id).eq("is_active", true).order("created_at"),
      supabase.from("envelope_transactions").select("id, envelope_id, amount, transaction_type, note, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
    ]);

    setCategories(catRes.data ?? []);
    setRecords(recRes.data ?? []);
    setEnvelopes(envRes.data ?? []);
    setEnvelopeTxs(envTxRes.data ?? []);
    setLoading(false);
  };

  const getRecord = (categoryId: string) => records.find((r) => r.category_id === categoryId);

  const totalBudget = categories.reduce((s, c) => s + Number(c.monthly_limit ?? 0), 0);
  const totalSpent = records.reduce((s, r) => s + Number(r.actual_spent ?? 0), 0);
  const totalRemaining = categories.reduce((s, c) => s + Math.max(getRemaining(c, getRecord(c.id) ?? null), 0), 0);

  const totalEnvBudgeted = envelopes.reduce((s, e) => s + Number(e.budgeted_amount), 0);
  const totalEnvSpent = envelopes.reduce((s, e) => s + Number(e.spent_amount), 0);
  const totalEnvAvailable = totalEnvBudgeted - totalEnvSpent;

  const getMTD = (envId: string, lastResetAt: string | null) => {
    const { start } = getMonthRange();
    const resetCutoff = lastResetAt && new Date(lastResetAt) > new Date(start) ? new Date(lastResetAt) : new Date(start);
    const startDate = resetCutoff;
    const txs = envelopeTxs.filter((t) => t.envelope_id === envId && new Date(t.created_at) >= startDate);
    const stuffedMTD = txs.filter((t) => t.transaction_type === "add").reduce((s, t) => s + Number(t.amount), 0);
    const spentMTD = txs.filter((t) => t.transaction_type === "spend").reduce((s, t) => s + Number(t.amount), 0);
    return { stuffedMTD, spentMTD };
  };

  // ── Upsert budget record helper ───────────────────────────────────────────
  const upsertRecord = async (
    userId: string,
    cat: BudgetCategory,
    record: BudgetRecord | null,
    newSpent: number,
    newAdj: number
  ) => {
    const { start, end } = getMonthRange();
    const limit = Number(cat.monthly_limit ?? 0);
    const status = newSpent > limit ? "exceeded" : "active";
    const variance = limit - newSpent + newAdj;

    if (record) {
      const { error } = await supabase.from("budget_records").update({
        actual_spent: newSpent,
        adjustment_amount: newAdj,
        variance,
        status,
        updated_at: new Date().toISOString(),
      }).eq("id", record.id);
      if (error) console.error("Update error:", error.message);
    } else {
      const { error } = await supabase.from("budget_records").insert({
        user_id: userId,
        category_id: cat.id,
        budget_amount: limit,
        actual_spent: newSpent,
        adjustment_amount: newAdj,
        variance,
        status,
        start_date: start,
        end_date: end,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) console.error("Insert error:", error.message);
    }
  };

  // ── Record expense ────────────────────────────────────────────────────────
  const handleSpend = async () => {
    if (!spendAction || !spendAmount) return;
    setSpendSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSpendSaving(false); return; }
    const { cat, record } = spendAction;
    const newSpent = Number(record?.actual_spent ?? 0) + Number(spendAmount);
    const newAdj = Number(record?.adjustment_amount ?? 0);
    await upsertRecord(user.id, cat, record, newSpent, newAdj);
    setSpendAction(null); setSpendAmount(""); setSpendSaving(false);
    await loadData();
  };

  // ── Adjust: adds to adjustment_amount → increases remaining ──────────────
  const handleAdjust = async () => {
    if (!adjustAction || !adjustAmount) return;
    setAdjustSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAdjustSaving(false); return; }
    const { cat, record } = adjustAction;
    const newSpent = Number(record?.actual_spent ?? 0);
    const newAdj = Number(record?.adjustment_amount ?? 0) + Number(adjustAmount);
    await upsertRecord(user.id, cat, record, newSpent, newAdj);
    setAdjustAction(null); setAdjustAmount(""); setAdjustSaving(false);
    await loadData();
  };

  // ── Reallocate: removes from adjustment_amount, adds to target ────────────
  const handleReallocate = async () => {
    if (!reallocateAction || !reallocateAmount || !reallocateTarget) return;
    setReallocateSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setReallocateSaving(false); return; }

    const { cat, record } = reallocateAction;
    const delta = Number(reallocateAmount);

    // Subtract from source category's adjustment_amount
    const sourceSpent = Number(record?.actual_spent ?? 0);
    const sourceAdj = Math.max(0, Number(record?.adjustment_amount ?? 0) - delta);
    await upsertRecord(user.id, cat, record, sourceSpent, sourceAdj);

    // Add to target category's adjustment_amount
    const targetCat = categories.find((c) => c.id === reallocateTarget);
    if (targetCat) {
      const targetRecord = getRecord(targetCat.id);
      const targetSpent = Number(targetRecord?.actual_spent ?? 0);
      const targetAdj = Number(targetRecord?.adjustment_amount ?? 0) + delta;
      await upsertRecord(user.id, targetCat, targetRecord ?? null, targetSpent, targetAdj);
    }

    setReallocateAction(null); setReallocateAmount(""); setReallocateTarget("");
    setReallocateSaving(false);
    await loadData();
  };

  // ── Reset: two options ────────────────────────────────────────────────────
  const handleReset = async (keepRemaining: boolean) => {
    if (!resetAction) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { cat } = resetAction;
    const freshRecord = getRecord(cat.id) ?? null;
    const newAdj = keepRemaining ? Number(freshRecord?.adjustment_amount ?? 0) : 0;
    await upsertRecord(user.id, cat, freshRecord, 0, newAdj);
    if (!keepRemaining) {
      await supabase.from("budget_categories").update({ monthly_limit: 0, updated_at: new Date().toISOString() }).eq("id", cat.id);
    }
    setResetAction(null);
    await loadData();
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("budget_categories").upsert({
      user_id: user.id, name: newCatName.trim(), category_type: newCatType,
      monthly_limit: newCatLimit ? Number(newCatLimit) : null,
      is_active: true, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,name" });
    setNewCatName(""); setNewCatLimit(""); setNewCatType("expense");
    setShowAddCategory(false); setSavingCat(false); await loadData();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this budget category?")) return;
    await supabase.from("budget_categories").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
    await loadData();
  };

  const addEnvelope = async () => {
    if (!newEnvName.trim() || !newEnvBudget) return;
    setSavingEnv(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const colorIndex = envelopes.length % ENVELOPE_COLORS.length;
    const amount = Number(newEnvBudget);
    const { data: envData } = await supabase.from("envelopes").insert({
      user_id: user.id, name: newEnvName.trim(),
      description: newEnvDesc || null,
      budgeted_amount: amount, spent_amount: 0,
      total_stuffed_alltime: amount, total_spent_alltime: 0,
      period_type: newEnvPeriod, color_index: colorIndex, is_active: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).select("id").single();

    if (envData?.id) {
      await supabase.from("envelope_transactions").insert({
        envelope_id: envData.id, user_id: user.id,
        amount, transaction_type: "add",
        note: "Initial envelope funding",
        created_at: new Date().toISOString(),
      });
    }

    setNewEnvName(""); setNewEnvBudget(""); setNewEnvDesc(""); setNewEnvPeriod("monthly");
    setShowAddEnvelope(false); setSavingEnv(false); await loadData();
  };

  const deleteEnvelope = async (id: string) => {
    if (!confirm("Delete this envelope and all its history?")) return;
    await supabase.from("envelopes").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
    if (selectedEnvelope?.id === id) setSelectedEnvelope(null);
    await loadData();
  };

  const handleEnvelopeAction = async () => {
    if (!envelopeAction || !actionAmount) return;
    setActionSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setActionSaving(false); return; }
    const { env, type } = envelopeAction;
    const delta = Number(actionAmount);
    let updateData: Record<string, number | string> = { updated_at: new Date().toISOString() };
    if (type === "add") {
      updateData.budgeted_amount = Number(env.budgeted_amount) + delta;
      updateData.total_stuffed_alltime = Number(env.total_stuffed_alltime) + delta;
    } else {
      updateData.spent_amount = Number(env.spent_amount) + delta;
      updateData.total_spent_alltime = Number(env.total_spent_alltime) + delta;
    }
    const { error: envErr } = await supabase.from("envelopes").update(updateData).eq("id", env.id);
    if (envErr) { console.error("Envelope update error:", envErr.message); setActionSaving(false); return; }
    await supabase.from("envelope_transactions").insert({
      envelope_id: env.id, user_id: user.id,
      amount: delta, transaction_type: type === "spend" ? "spend" : "add",
      note: actionNote || null, created_at: new Date().toISOString(),
    });
    setEnvelopeAction(null); setActionAmount(""); setActionNote("");
    setActionSaving(false); await loadData();
  };

  const resetEnvelope = async (env: Envelope) => {
    if (!confirm(`Reset "${env.name}"? This clears the current period balance to zero. All-time totals are preserved.`)) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("envelopes").update({
      budgeted_amount: 0, spent_amount: 0,
      last_reset_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", env.id).eq("user_id", user.id);
    if (error) { alert("Reset failed. Please try again."); return; }
    await supabase.from("envelope_transactions").insert({
      envelope_id: env.id, user_id: user.id, amount: 0,
      transaction_type: "reset",
      note: `Period reset — stuffed ${fmt(env.budgeted_amount)}, spent ${fmt(env.spent_amount)}`,
      created_at: new Date().toISOString(),
    });
    if (selectedEnvelope?.id === env.id) setSelectedEnvelope({ ...env, budgeted_amount: 0, spent_amount: 0 });
    await loadData();
  };

  const getEnvelopeTxs = (envId: string) => envelopeTxs.filter((t) => t.envelope_id === envId);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "9px", color: "#e2e8f0", fontSize: "13px",
    outline: "none", boxSizing: "border-box",
  };

  const modalOverlay: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 500,
    background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
  };

  const modalBox: React.CSSProperties = {
    width: "100%", maxWidth: "420px",
    background: "rgba(8,11,18,0.98)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px", padding: "28px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
  };

  const statCell = (label: string, value: string, color: string) => (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "8px", color: "#334155", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "3px", whiteSpace: "pre-line" }}>{label}</div>
      <div style={{ fontSize: "12px", fontWeight: 700, color }}>{value}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: "1100px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Budget Center</h1>
        <p style={{ color: "#475569", fontSize: "13.5px", margin: 0 }}>Track spending by category or use the envelope system for disciplined budget allocation.</p>
      </div>

      <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "4px", marginBottom: "28px", gap: "4px" }}>
        <button onClick={() => setActiveTab("tracker")} style={{ padding: "10px 22px", borderRadius: "9px", border: "none", cursor: "pointer", background: activeTab === "tracker" ? "rgba(37,99,235,0.2)" : "transparent", color: activeTab === "tracker" ? "#38bdf8" : "#475569", fontSize: "13px", fontWeight: activeTab === "tracker" ? 700 : 400, transition: "all 0.15s ease" }}>
          📊 Budget Tracker
        </button>
        <button onClick={() => setActiveTab("envelopes")} style={{ padding: "10px 22px", borderRadius: "9px", border: "none", cursor: "pointer", background: activeTab === "envelopes" ? "rgba(168,85,247,0.2)" : "transparent", color: activeTab === "envelopes" ? "#a855f7" : "#475569", fontSize: "13px", fontWeight: activeTab === "envelopes" ? 700 : 400, transition: "all 0.15s ease" }}>
          ✉️ Envelope System
        </button>
      </div>

      {/* ── BUDGET TRACKER ── */}
      {activeTab === "tracker" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "24px" }}>
            {[
              { label: "Monthly Budget", value: fmt(totalBudget),    color: "#38bdf8", rgb: "56,189,248" },
              { label: "Total Spent",    value: fmt(totalSpent),     color: totalSpent > totalBudget ? "#ef4444" : "#22c55e", rgb: totalSpent > totalBudget ? "239,68,68" : "34,197,94" },
              { label: "Total Remaining", value: fmt(totalRemaining), color: "#a855f7", rgb: "168,85,247" },
            ].map((k, i) => (
              <div key={i} style={{ padding: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px" }}>
                <div style={{ fontSize: "10px", color: "#475569", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "8px" }}>{k.label}</div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ marginTop: "10px", height: "2px", background: `rgba(${k.rgb},0.3)`, borderRadius: "1px" }} />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em" }}>BUDGET CATEGORIES ({categories.length})</div>
            <button onClick={() => setShowAddCategory(true)} style={{ padding: "8px 16px", background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "8px", color: "#38bdf8", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>+ Add Category</button>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>Loading...</div>
          ) : categories.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>📊</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>No budget categories yet</div>
              <div style={{ fontSize: "13px", color: "#334155", marginBottom: "16px" }}>Add categories to start tracking — gas, groceries, utilities, beauty, and more.</div>
              <button onClick={() => setShowAddCategory(true)} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Add First Category</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "14px" }}>
              {categories.map((cat) => {
                const style = getCategoryStyle(cat.name);
                const record = getRecord(cat.id);
                const spent = Number(record?.actual_spent ?? 0);
                const adj = Number(record?.adjustment_amount ?? 0);
                const limit = Number(cat.monthly_limit ?? 0);
                const remaining = getRemaining(cat, record ?? null);
                const pct = limit > 0 ? (spent / limit) * 100 : 0;
                const isOver = spent > limit && limit > 0;

                return (
                  <div key={cat.id} style={{ padding: "20px", background: "rgba(255,255,255,0.03)", border: `1px solid ${isOver ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.07)"}`, borderRadius: "16px", transition: "all 0.2s ease", position: "relative", overflow: "hidden" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.055)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "100px", height: "100px", borderRadius: "50%", background: `radial-gradient(circle, rgba(${style.rgb},0.08) 0%, transparent 70%)`, pointerEvents: "none" }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "46px", height: "46px", borderRadius: "13px", background: `linear-gradient(145deg, rgba(${style.rgb},0.2), rgba(${style.rgb},0.4))`, border: `1px solid rgba(${style.rgb},0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "21px", boxShadow: `0 4px 14px rgba(${style.rgb},0.25), inset 0 1px 0 rgba(255,255,255,0.15)` }}>
                          {style.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>{cat.name}</div>
                          <div style={{ fontSize: "10px", color: "#334155", textTransform: "capitalize" }}>{cat.category_type}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <DonutChart pct={pct} color={style.color} size={48} strokeWidth={6} />
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <button onClick={() => deleteCategory(cat.id)} style={{ background: "transparent", border: "none", color: "#334155", cursor: "pointer", fontSize: "12px", padding: "2px" }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}
                          >🗑</button>
                          <button onClick={() => setResetAction({ cat, record: record ?? null })} style={{ background: "transparent", border: "none", color: "#334155", cursor: "pointer", fontSize: "12px", padding: "2px" }}
                            title="Reset period"
                            onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}
                          >↺</button>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: "#475569" }}>Spent</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: isOver ? "#ef4444" : "#f8fafc" }}>{fmt(spent)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: "#475569" }}>Monthly Limit</span>
                      <span style={{ fontSize: "11px", color: "#475569" }}>{limit > 0 ? fmt(limit) : "No limit"}</span>
                    </div>
                    {adj > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "11px", color: "#22c55e" }}>Adjustments</span>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#22c55e" }}>+{fmt(adj)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600 }}>Remaining</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: remaining < 0 ? "#ef4444" : "#22c55e" }}>{fmt(remaining)}</span>
                    </div>

                    {/* Progress */}
                    <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }}>
                      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: isOver ? "#ef4444" : `linear-gradient(90deg, ${style.color}, rgba(${style.rgb},0.6))`, borderRadius: "3px", boxShadow: `0 0 6px rgba(${style.rgb},0.5)`, transition: "width 0.5s ease" }} />
                    </div>

                    {isOver && <div style={{ fontSize: "10px", fontWeight: 600, color: "#ef4444", marginBottom: "8px" }}>⚠️ Over budget by {fmt(spent - limit)}</div>}
                    {!isOver && limit > 0 && <div style={{ fontSize: "10px", color: "#334155", marginBottom: "8px" }}>{pct.toFixed(0)}% of budget used</div>}

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button onClick={() => { setSpendAction({ cat, record: record ?? null }); setSpendAmount(""); }}
                        style={{ flex: 1, padding: "7px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "7px", color: "#ef4444", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                      >− Record Expense</button>
                      <button onClick={() => { setAdjustAction({ cat, record: record ?? null }); setAdjustAmount(""); }}
                        style={{ flex: 1, padding: "7px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "7px", color: "#22c55e", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(34,197,94,0.15)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(34,197,94,0.08)"}
                      >+ Adjust</button>
                      <button onClick={() => { setReallocateAction({ cat, record: record ?? null }); setReallocateAmount(""); setReallocateTarget(""); }}
                        style={{ padding: "7px 9px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "7px", color: "#6366f1", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.15)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.08)"}
                      >⇄ Move</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ENVELOPE SYSTEM ── */}
      {activeTab === "envelopes" && (
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ padding: "14px 18px", marginBottom: "20px", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: "12px", display: "flex", gap: "12px" }}>
              <div style={{ fontSize: "22px", flexShrink: 0 }}>✉️</div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#a855f7", marginBottom: "3px" }}>Digital Envelope System</div>
                <div style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.6 }}>
                  Stuff money into each envelope. Spend from it — when empty, stop. Reset each period for a clean slate. All-time totals are always preserved.
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Total Budgeted",  value: fmt(totalEnvBudgeted), color: "#38bdf8", rgb: "56,189,248" },
                { label: "Total Spent",     value: fmt(totalEnvSpent),    color: "#ef4444", rgb: "239,68,68" },
                { label: "Still Available", value: fmt(Math.max(totalEnvAvailable, 0)), color: "#22c55e", rgb: "34,197,94" },
              ].map((k, i) => (
                <div key={i} style={{ padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px" }}>
                  <div style={{ fontSize: "10px", color: "#475569", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "6px" }}>{k.label}</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: k.color }}>{k.value}</div>
                  <div style={{ marginTop: "8px", height: "2px", background: `rgba(${k.rgb},0.3)`, borderRadius: "1px" }} />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em" }}>MY ENVELOPES ({envelopes.length})</div>
              <button onClick={() => setShowAddEnvelope(true)} style={{ padding: "8px 16px", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "8px", color: "#a855f7", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>+ New Envelope</button>
            </div>

            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>Loading...</div>
            ) : envelopes.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>✉️</div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>No envelopes yet</div>
                <button onClick={() => setShowAddEnvelope(true)} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Create First Envelope</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "16px" }}>
                {envelopes.map((env) => {
                  const colorStyle = ENVELOPE_COLORS[env.color_index % ENVELOPE_COLORS.length];
                  const available = Number(env.budgeted_amount) - Number(env.spent_amount);
                  const pct = env.budgeted_amount > 0 ? (env.spent_amount / env.budgeted_amount) * 100 : 0;
                  const isOver = available < 0;
                  const isSelected = selectedEnvelope?.id === env.id;
                  const { stuffedMTD, spentMTD } = getMTD(env.id, env.last_reset_at ?? null);

                  return (
                    <div key={env.id}
                      onClick={() => setSelectedEnvelope(isSelected ? null : env)}
                      style={{ padding: "20px", background: isSelected ? `rgba(${colorStyle.rgb},0.08)` : "rgba(255,255,255,0.03)", border: `1px solid ${isSelected ? `rgba(${colorStyle.rgb},0.35)` : isOver ? "rgba(239,68,68,0.25)" : `rgba(${colorStyle.rgb},0.15)`}`, borderRadius: "18px", transition: "all 0.2s ease", position: "relative", overflow: "hidden", cursor: "pointer" }}
                      onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.background = `rgba(${colorStyle.rgb},0.05)`; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 32px rgba(${colorStyle.rgb},0.12)`; } }}
                      onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; } }}
                    >
                      <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "140px", height: "140px", borderRadius: "50%", background: `radial-gradient(circle, rgba(${colorStyle.rgb},0.1) 0%, transparent 70%)`, pointerEvents: "none" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <Envelope3D color={colorStyle.color} rgb={colorStyle.rgb} size={58} />
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                          <div style={{ position: "relative" }}>
                            <DonutChart pct={pct} color={isOver ? "#ef4444" : colorStyle.color} size={58} strokeWidth={7} />
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: isOver ? "#ef4444" : colorStyle.color }}>{pct.toFixed(0)}%</div>
                          </div>
                          <span style={{ fontSize: "8px", color: "#334155", textTransform: "capitalize" }}>{env.period_type}</span>
                        </div>
                      </div>

                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc", marginBottom: "2px" }}>{env.name}</div>
                      {env.description && <div style={{ fontSize: "10px", color: "#475569", marginBottom: "8px" }}>{env.description}</div>}

                      <div style={{ padding: "10px", marginBottom: "10px", background: `rgba(${colorStyle.rgb},0.07)`, border: `1px solid rgba(${colorStyle.rgb},0.15)`, borderRadius: "9px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "9px", color: "#475569", fontWeight: 700 }}>CURRENT BALANCE</span>
                          <span style={{ fontSize: "15px", fontWeight: 800, color: isOver ? "#ef4444" : colorStyle.color }}>{isOver ? "-" : ""}{fmt(Math.abs(available))}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                          <span style={{ fontSize: "9px", color: "#334155" }}>Stuffed / Spent</span>
                          <span style={{ fontSize: "9px", color: "#475569" }}>{fmt(env.budgeted_amount)} / {fmt(env.spent_amount)}</span>
                        </div>
                        <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: isOver ? "#ef4444" : `linear-gradient(90deg, ${colorStyle.color}, rgba(${colorStyle.rgb},0.5))`, borderRadius: "2px" }} />
                        </div>
                        {isOver && <div style={{ fontSize: "9px", fontWeight: 600, color: "#ef4444", marginTop: "3px" }}>⚠️ Over by {fmt(Math.abs(available))}</div>}
                      </div>

                      {/* 5-stat tracker */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr auto 1fr auto 1fr", gap: "0px", marginBottom: "10px", padding: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", alignItems: "center" }}>
                        {statCell("STUFFED\nALL TIME", fmt(env.total_stuffed_alltime), "#38bdf8")}
                        <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.06)" }} />
                        {statCell("SPENT\nALL TIME", fmt(env.total_spent_alltime), "#ef4444")}
                        <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.06)" }} />
                        {statCell("CURRENT\nBAL", fmt(Math.max(available, 0)), colorStyle.color)}
                        <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.06)" }} />
                        {statCell("STUFFED\nMTD", fmt(stuffedMTD), "#22c55e")}
                        <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.06)" }} />
                        {statCell("SPENT\nMTD", fmt(spentMTD), "#f59e0b")}
                      </div>

                      <div style={{ display: "flex", gap: "5px" }}>
                        <button onClick={(e) => { e.stopPropagation(); setEnvelopeAction({ env, type: "spend" }); setActionAmount(""); setActionNote(""); }}
                          style={{ flex: 1, padding: "7px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "7px", color: "#ef4444", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                        >− Spend</button>
                        <button onClick={(e) => { e.stopPropagation(); setEnvelopeAction({ env, type: "add" }); setActionAmount(""); setActionNote(""); }}
                          style={{ flex: 1, padding: "7px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "7px", color: "#22c55e", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(34,197,94,0.15)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(34,197,94,0.08)"}
                        >+ Stuff</button>
                        <button onClick={(e) => { e.stopPropagation(); resetEnvelope(env); }}
                          style={{ padding: "7px 9px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "7px", color: "#f59e0b", fontSize: "12px", cursor: "pointer" }}
                          title="Reset period"
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(245,158,11,0.15)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(245,158,11,0.08)"}
                        >↺</button>
                        <button onClick={(e) => { e.stopPropagation(); deleteEnvelope(env.id); }}
                          style={{ padding: "7px 9px", background: "transparent", border: "none", color: "#334155", fontSize: "12px", cursor: "pointer" }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}
                        >🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transaction history panel */}
          {selectedEnvelope && (
            <div style={{ width: "260px", flexShrink: 0, background: "rgba(8,11,18,0.97)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px", position: "sticky", top: "86px", maxHeight: "calc(100vh - 110px)", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>{selectedEnvelope.name}</div>
                <button onClick={() => setSelectedEnvelope(null)} style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: "16px" }}>✕</button>
              </div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginBottom: "10px" }}>TRANSACTION HISTORY</div>
              {getEnvelopeTxs(selectedEnvelope.id).length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#334155", fontSize: "12px" }}>No transactions yet</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {getEnvelopeTxs(selectedEnvelope.id).map((tx) => (
                    <div key={tx.id} style={{ padding: "9px 11px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: tx.transaction_type === "spend" ? "#ef4444" : tx.transaction_type === "reset" ? "#f59e0b" : "#22c55e" }}>
                          {tx.transaction_type === "spend" ? "Spent" : tx.transaction_type === "reset" ? "Reset" : "Stuffed"}
                        </div>
                        {tx.note && <div style={{ fontSize: "10px", color: "#334155", marginTop: "1px" }}>{tx.note}</div>}
                        <div style={{ fontSize: "10px", color: "#1e293b" }}>{new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: tx.transaction_type === "spend" ? "#ef4444" : tx.transaction_type === "reset" ? "#f59e0b" : "#22c55e" }}>
                        {tx.transaction_type === "spend" ? "−" : tx.transaction_type === "reset" ? "↺" : "+"}{tx.transaction_type !== "reset" ? fmt(tx.amount) : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ADD CATEGORY MODAL ── */}
      {showAddCategory && (
        <div style={modalOverlay} onClick={() => setShowAddCategory(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 20px", letterSpacing: "-0.02em" }}>Add Budget Category</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#475569", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>CATEGORY NAME</label>
                <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Groceries, Gas, Utilities, Beauty..." style={inputStyle} onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"} onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#475569", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>TYPE</label>
                <select value={newCatType} onChange={(e) => setNewCatType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="savings">Savings</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#475569", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>MONTHLY LIMIT (optional)</label>
                <input type="number" value={newCatLimit} onChange={(e) => setNewCatLimit(e.target.value)} placeholder="0.00" style={inputStyle} onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"} onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowAddCategory(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={addCategory} disabled={savingCat || !newCatName.trim()} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: savingCat ? "not-allowed" : "pointer", opacity: savingCat ? 0.7 : 1 }}>
                  {savingCat ? "Saving..." : "Add Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RECORD EXPENSE MODAL ── */}
      {spendAction && (
        <div style={modalOverlay} onClick={() => setSpendAction(null)}>
          <div style={{ ...modalBox, maxWidth: "360px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>🔴 Record Expense</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 4px" }}>{spendAction.cat.name}</p>
            <p style={{ fontSize: "11px", color: "#334155", margin: "0 0 20px" }}>
              Current spent: <strong style={{ color: "#ef4444" }}>{fmt(Number(spendAction.record?.actual_spent ?? 0))}</strong>
              &nbsp;· Remaining: <strong style={{ color: "#22c55e" }}>{fmt(getRemaining(spendAction.cat, spendAction.record))}</strong>
            </p>
            <input type="number" value={spendAmount} onChange={(e) => setSpendAmount(e.target.value)} placeholder="0.00" autoFocus
              style={{ ...inputStyle, fontSize: "22px", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}
              onFocus={(e) => e.target.style.borderColor = "rgba(239,68,68,0.4)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setSpendAction(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSpend} disabled={spendSaving || !spendAmount}
                style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #dc2626, #b91c1c)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: spendSaving || !spendAmount ? "not-allowed" : "pointer", opacity: spendSaving || !spendAmount ? 0.7 : 1 }}>
                {spendSaving ? "Saving..." : "Record Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADJUST MODAL (adds to remaining) ── */}
      {adjustAction && (
        <div style={modalOverlay} onClick={() => setAdjustAction(null)}>
          <div style={{ ...modalBox, maxWidth: "360px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>💚 Adjust Remaining</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 4px" }}>{adjustAction.cat.name}</p>
            <p style={{ fontSize: "11px", color: "#334155", margin: "0 0 20px" }}>
              Adds to your remaining balance. Limit stays at {fmt(Number(adjustAction.cat.monthly_limit ?? 0))}. Use for credits, returns, or extra funds added to this category.
            </p>
            <input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} placeholder="0.00" autoFocus
              style={{ ...inputStyle, fontSize: "22px", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}
              onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setAdjustAction(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAdjust} disabled={adjustSaving || !adjustAmount}
                style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: adjustSaving || !adjustAmount ? "not-allowed" : "pointer", opacity: adjustSaving || !adjustAmount ? 0.7 : 1 }}>
                {adjustSaving ? "Saving..." : "Add to Remaining"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REALLOCATE MODAL ── */}
      {reallocateAction && (
        <div style={modalOverlay} onClick={() => setReallocateAction(null)}>
          <div style={{ ...modalBox, maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>⇄ Reallocate Funds</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 4px" }}>From: {reallocateAction.cat.name}</p>
            <p style={{ fontSize: "11px", color: "#334155", margin: "0 0 20px" }}>
              Available to reallocate: <strong style={{ color: "#22c55e" }}>{fmt(getRemaining(reallocateAction.cat, reallocateAction.record))}</strong>
              &nbsp;· Move unused funds to another category or savings.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#475569", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>AMOUNT TO MOVE</label>
                <input type="number" value={reallocateAmount} onChange={(e) => setReallocateAmount(e.target.value)} placeholder="0.00"
                  style={{ ...inputStyle, fontSize: "20px", fontWeight: 700, textAlign: "center" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#475569", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>MOVE TO</label>
                <select value={reallocateTarget} onChange={(e) => setReallocateTarget(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Select a category...</option>
                  {categories.filter((c) => c.id !== reallocateAction.cat.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setReallocateAction(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleReallocate} disabled={reallocateSaving || !reallocateAmount || !reallocateTarget}
                  style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #6366f1, #4f46e5)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: reallocateSaving || !reallocateAmount || !reallocateTarget ? "not-allowed" : "pointer", opacity: reallocateSaving || !reallocateAmount || !reallocateTarget ? 0.7 : 1 }}>
                  {reallocateSaving ? "Moving..." : "Move Funds"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET MODAL (two options) ── */}
      {resetAction && (
        <div style={modalOverlay} onClick={() => setResetAction(null)}>
          <div style={{ ...modalBox, maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>↺ Reset {resetAction.cat.name}</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 20px" }}>Choose how to reset this category for the new period.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => handleReset(false)}
                style={{ padding: "16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.14)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#ef4444", marginBottom: "4px" }}>🔴 Reset Everything</div>
                <div style={{ fontSize: "11px", color: "#475569" }}>Clears spent to $0 and removes all adjustments. Fresh start — limit stays the same.</div>
              </button>
              <button onClick={() => handleReset(true)}
                style={{ padding: "16px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "12px", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(34,197,94,0.14)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(34,197,94,0.08)"}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e", marginBottom: "4px" }}>💚 Keep Remaining Balance</div>
                <div style={{ fontSize: "11px", color: "#475569" }}>Clears spent to $0 but carries over your remaining balance into the new period.</div>
              </button>
              <button onClick={() => setResetAction(null)}
                style={{ padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD ENVELOPE MODAL ── */}
      {showAddEnvelope && (
        <div style={modalOverlay} onClick={() => setShowAddEnvelope(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Create New Envelope</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 20px" }}>Set a spending budget. When empty — stop spending. Reset each period for a clean start.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#475569", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>ENVELOPE NAME</label>
                <input value={newEnvName} onChange={(e) => setNewEnvName(e.target.value)} placeholder="e.g. Groceries, Gas, Eating Out..." style={inputStyle} onFocus={(e) => e.target.style.borderColor = "rgba(168,85,247,0.4)"} onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#475569", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>BUDGET AMOUNT</label>
                <input type="number" value={newEnvBudget} onChange={(e) => setNewEnvBudget(e.target.value)} placeholder="0.00" style={inputStyle} onFocus={(e) => e.target.style.borderColor = "rgba(168,85,247,0.4)"} onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#475569", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>PERIOD</label>
                <select value={newEnvPeriod} onChange={(e) => setNewEnvPeriod(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#475569", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>NOTE (optional)</label>
                <input value={newEnvDesc} onChange={(e) => setNewEnvDesc(e.target.value)} placeholder="What is this envelope for?" style={inputStyle} onFocus={(e) => e.target.style.borderColor = "rgba(168,85,247,0.4)"} onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowAddEnvelope(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={addEnvelope} disabled={savingEnv || !newEnvName.trim() || !newEnvBudget} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: savingEnv ? "not-allowed" : "pointer", opacity: savingEnv ? 0.7 : 1 }}>
                  {savingEnv ? "Creating..." : "Create Envelope"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ENVELOPE ACTION MODAL ── */}
      {envelopeAction && (
        <div style={modalOverlay} onClick={() => setEnvelopeAction(null)}>
          <div style={{ ...modalBox, maxWidth: "360px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              {envelopeAction.type === "add" ? "💚 Stuff Envelope" : "🔴 Record Spend"}
            </h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 4px" }}>{envelopeAction.env.name}</p>
            <p style={{ fontSize: "11px", color: "#334155", margin: "0 0 20px" }}>
              Balance: <strong style={{ color: "#22c55e" }}>{fmt(Number(envelopeAction.env.budgeted_amount) - Number(envelopeAction.env.spent_amount))}</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input type="number" value={actionAmount} onChange={(e) => setActionAmount(e.target.value)} placeholder="0.00" autoFocus
                style={{ ...inputStyle, fontSize: "22px", fontWeight: 700, textAlign: "center" }}
                onFocus={(e) => e.target.style.borderColor = envelopeAction.type === "add" ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
              <input value={actionNote} onChange={(e) => setActionNote(e.target.value)} placeholder="Note (optional)" style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setEnvelopeAction(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleEnvelopeAction} disabled={actionSaving || !actionAmount}
                  style={{ flex: 1, padding: "11px", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700,
                    background: envelopeAction.type === "add" ? "linear-gradient(135deg, #16a34a, #15803d)" : "linear-gradient(135deg, #dc2626, #b91c1c)",
                    cursor: actionSaving || !actionAmount ? "not-allowed" : "pointer",
                    opacity: actionSaving || !actionAmount ? 0.7 : 1,
                  }}>
                  {actionSaving ? "Saving..." : envelopeAction.type === "add" ? "Stuff Envelope" : "Record Spend"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

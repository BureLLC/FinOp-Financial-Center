"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../src/lib/supabase";
import { getCanonicalBudgetSavings } from "../../../src/lib/canonicalFinancialData";

interface SavingsGoal {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  cumulative_amount: number;
  monthly_target: number | null;
  goal_type: string;
  start_date: string;
  target_date: string | null;
  last_reset_at: string | null;
  status: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n ?? 0);
}
function fmtCompact(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n ?? 0);
}

const GOAL_ICONS: Record<string, { icon: string; color: string; rgb: string }> = {
  "travel":     { icon: "✈️", color: "#38bdf8", rgb: "56,189,248" },
  "vacation":   { icon: "🏖️", color: "#38bdf8", rgb: "56,189,248" },
  "emergency":  { icon: "🛡️", color: "#22c55e", rgb: "34,197,94" },
  "house":      { icon: "🏠", color: "#6366f1", rgb: "99,102,241" },
  "home":       { icon: "🏠", color: "#6366f1", rgb: "99,102,241" },
  "car":        { icon: "🚗", color: "#f97316", rgb: "249,115,22" },
  "vehicle":    { icon: "🚗", color: "#f97316", rgb: "249,115,22" },
  "wedding":    { icon: "💍", color: "#ec4899", rgb: "236,72,153" },
  "education":  { icon: "🎓", color: "#a855f7", rgb: "168,85,247" },
  "college":    { icon: "🎓", color: "#a855f7", rgb: "168,85,247" },
  "retirement": { icon: "🌅", color: "#f59e0b", rgb: "245,158,11" },
  "business":   { icon: "💼", color: "#64748b", rgb: "100,116,139" },
  "baby":       { icon: "👶", color: "#f43f5e", rgb: "244,63,94" },
  "medical":    { icon: "🏥", color: "#ef4444", rgb: "239,68,68" },
  "tech":       { icon: "💻", color: "#06b6d4", rgb: "6,182,212" },
  "investment": { icon: "📈", color: "#22c55e", rgb: "34,197,94" },
  "gift":       { icon: "🎁", color: "#ec4899", rgb: "236,72,153" },
  "holiday":    { icon: "🎄", color: "#ef4444", rgb: "239,68,68" },
  "fund":       { icon: "💰", color: "#22c55e", rgb: "34,197,94" },
  "grocery":    { icon: "🛒", color: "#22c55e", rgb: "34,197,94" },
  "groceries":  { icon: "🛒", color: "#22c55e", rgb: "34,197,94" },
  "gas":        { icon: "⛽", color: "#f97316", rgb: "249,115,22" },
  "utility":    { icon: "💡", color: "#fbbf24", rgb: "251,191,36" },
};

function getGoalStyle(name: string) {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(GOAL_ICONS)) {
    if (lower.includes(key)) return val;
  }
  return { icon: "💰", color: "#38bdf8", rgb: "56,189,248" };
}

function RingProgress({ pct, color, size = 110, strokeWidth = 11 }: {
  pct: number; color: string; size?: number; strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  const cx = size / 2; const cy = size / 2;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", filter: `drop-shadow(0 0 8px ${color}44)` }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}88)`, transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

export default function SavingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [budgetSavingsCategories, setBudgetSavingsCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  // Add goal
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newTargetDate, setNewTargetDate] = useState("");
  const [newGoalType, setNewGoalType] = useState<"one_time" | "sinking_fund">("one_time");
  const [newMonthlyTarget, setNewMonthlyTarget] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  // Edit panel
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editMonthlyTarget, setEditMonthlyTarget] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState<string | null>(null);

  // Contribute/withdraw
  const [goalAction, setGoalAction] = useState<{ goal: SavingsGoal; type: "contribute" | "withdraw" } | null>(null);
  const [actionAmount, setActionAmount] = useState("");
  const [actionSaving, setActionSaving] = useState(false);

  // Reset modal
  const [resetTarget, setResetTarget] = useState<SavingsGoal | null>(null);
  const [showResetTotal, setShowResetTotal] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [goalsRes, budgetSavings] = await Promise.all([
      supabase
        .from("savings_goals")
        .select("id, name, description, target_amount, current_amount, cumulative_amount, monthly_target, goal_type, start_date, target_date, last_reset_at, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      getCanonicalBudgetSavings(supabase, user.id),
    ]);
    setGoals(goalsRes.data ?? []);
    setBudgetSavingsCategories(budgetSavings);
    setLoading(false);
  };

  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const budgetSavingsTotal = budgetSavingsCategories.reduce((s: number, c: any) => s + Number(c.monthly_limit ?? 0), 0);
  const goalsWithTarget = goals.filter((g) => Number(g.target_amount) > 0);
  const totalTarget = goalsWithTarget.reduce((s, g) => s + Number(g.target_amount), 0);
  const sinkingFunds = goals.filter((g) => g.goal_type === "sinking_fund");
  const oneTimeGoals = goals.filter((g) => g.goal_type === "one_time");

  const getOneTimeProjection = (goal: SavingsGoal) => {
    const remaining = Number(goal.target_amount) - Number(goal.current_amount);
    if (!goal.target_date || remaining <= 0) return null;
    const months = Math.max(1, Math.ceil(
      (new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
    ));
    return {
      monthlyNeeded: remaining / months,
      targetLabel: new Date(goal.target_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
  };

  const openPanel = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setEditName(goal.name);
    setEditDesc(goal.description ?? "");
    setEditTarget(Number(goal.target_amount) > 0 ? String(goal.target_amount) : "");
    setEditTargetDate(goal.target_date ?? "");
    setEditMonthlyTarget(goal.monthly_target ? String(goal.monthly_target) : "");
    setEditMsg(null);
  };

  const saveEdit = async () => {
    if (!selectedGoal) return;
    setEditSaving(true);
    const { error } = await supabase.from("savings_goals").update({
      name: editName.trim(),
      description: editDesc || null,
      target_amount: editTarget ? Number(editTarget) : 0,
      target_date: editTargetDate || null,
      monthly_target: editMonthlyTarget ? Number(editMonthlyTarget) : null,
      updated_at: new Date().toISOString(),
    }).eq("id", selectedGoal.id);

    if (error) {
      setEditMsg("Failed to save.");
    } else {
      setEditMsg("Saved successfully.");
      await loadData();
    }
    setEditSaving(false);
  };

  const addGoal = async () => {
    if (!newName.trim()) return;
    setSavingGoal(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("savings_goals").insert({
      user_id: user.id,
      name: newName.trim(),
      description: newDesc || null,
      goal_type: newGoalType,
      target_amount: newTarget ? Number(newTarget) : 0,
      monthly_target: newGoalType === "sinking_fund" && newMonthlyTarget ? Number(newMonthlyTarget) : null,
      current_amount: 0,
      cumulative_amount: 0,
      start_date: new Date().toISOString().split("T")[0],
      target_date: newTargetDate || null,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setNewName(""); setNewDesc(""); setNewTarget(""); setNewTargetDate("");
    setNewGoalType("one_time"); setNewMonthlyTarget("");
    setShowAddGoal(false); setSavingGoal(false); await loadData();
  };

  const handleAction = async () => {
    if (!goalAction || !actionAmount) return;
    setActionSaving(true);
    const { goal, type } = goalAction;
    const delta = Number(actionAmount);
    const newAmount = type === "contribute"
      ? Number(goal.current_amount) + delta
      : Math.max(0, Number(goal.current_amount) - delta);

    await supabase.from("savings_goals").update({
      current_amount: newAmount,

      updated_at: new Date().toISOString(),
    }).eq("id", goal.id);

    if (selectedGoal?.id === goal.id) {
      setSelectedGoal((prev) => prev ? { ...prev, current_amount: newAmount } : null);
    }
    setGoalAction(null); setActionAmount("");
    setActionSaving(false); await loadData();
  };

  // Reset period — clears current_amount, adds to cumulative, updates last_reset_at
  const resetPeriod = async (goal: SavingsGoal) => {
    const newCumulative = Number(goal.cumulative_amount) + Number(goal.current_amount);
    const { error } = await supabase.from("savings_goals").update({
      current_amount: 0,
      cumulative_amount: newCumulative,

      last_reset_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", goal.id);
    if (error) { alert("Reset failed."); return; }
    if (selectedGoal?.id === goal.id) {
      setSelectedGoal((prev) => prev ? { ...prev, current_amount: 0, cumulative_amount: newCumulative, last_reset_at: new Date().toISOString() } : null);
    }
    setResetTarget(null);
    await loadData();
  };

  // Reset everything — clears both current_amount AND cumulative_amount
  const resetEverything = async (goal: SavingsGoal) => {
    const { error } = await supabase.from("savings_goals").update({
      current_amount: 0,
      cumulative_amount: 0,
      last_reset_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", goal.id);
    if (error) { alert("Reset failed."); return; }
    if (selectedGoal?.id === goal.id) {
      setSelectedGoal((prev) => prev ? { ...prev, current_amount: 0, cumulative_amount: 0 } : null);
    }
    setResetTarget(null);
    await loadData();
  };

  const closeGoal = async (id: string) => {
    if (!confirm("Archive this savings goal?")) return;
    await supabase.from("savings_goals").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", id);
    if (selectedGoal?.id === id) setSelectedGoal(null);
    await loadData();
  };

  const resetAllSaved = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("savings_goals").update({
      current_amount: 0, updated_at: new Date().toISOString(),
    }).eq("user_id", user.id).eq("status", "active");
    setShowResetTotal(false);
    await loadData();
  };

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
    background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
  };

  const modalBox: React.CSSProperties = {
    width: "100%", maxWidth: "440px",
    background: "rgba(8,11,18,0.98)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px", padding: "28px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
  };

  const GoalCard = ({ goal }: { goal: SavingsGoal }) => {
    const style = getGoalStyle(goal.name);
    const isSinking = goal.goal_type === "sinking_fund";
    const monthlyTarget = Number(goal.monthly_target ?? 0);
    const current = Number(goal.current_amount);
    const cumulative = Number(goal.cumulative_amount);
    const hasTarget = Number(goal.target_amount) > 0;
    const pct = isSinking
      ? (monthlyTarget > 0 ? (current / monthlyTarget) * 100 : 0)
      : (hasTarget ? (current / Number(goal.target_amount)) * 100 : 0);
    const isSelected = selectedGoal?.id === goal.id;
    const showRing = isSinking ? monthlyTarget > 0 : hasTarget;
    const projection = !isSinking && hasTarget ? getOneTimeProjection(goal) : null;
    const remaining = hasTarget ? Number(goal.target_amount) - current : 0;

    return (
      <div
        onClick={() => openPanel(goal)}
        style={{
          padding: "22px",
          background: isSelected ? `rgba(${style.rgb},0.06)` : "rgba(255,255,255,0.03)",
          border: `1px solid ${isSelected ? `rgba(${style.rgb},0.3)` : `rgba(${style.rgb},0.12)`}`,
          borderRadius: "18px", transition: "all 0.2s ease",
          position: "relative", overflow: "hidden", cursor: "pointer",
        }}
        onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 32px rgba(${style.rgb},0.12)`; } }}
        onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; } }}
      >
        <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "160px", height: "160px", borderRadius: "50%", background: `radial-gradient(circle, rgba(${style.rgb},0.08) 0%, transparent 70%)`, pointerEvents: "none" }} />

        {/* Sinking fund badge */}
        {isSinking && (
          <div style={{ position: "absolute", top: "14px", right: "14px", padding: "2px 9px", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "99px", fontSize: "9px", fontWeight: 700, color: "#a855f7" }}>
            SINKING FUND
          </div>
        )}

        {showRing ? (
          <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <RingProgress pct={pct} color={style.color} size={100} strokeWidth={10} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: "20px", marginBottom: "2px" }}>{style.icon}</div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: style.color }}>{Math.min(pct, 100).toFixed(0)}%</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc", marginBottom: "3px" }}>{goal.name}</div>
              {goal.description && <div style={{ fontSize: "11px", color: "#475569", marginBottom: "6px" }}>{goal.description}</div>}
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>{fmt(current)}</div>
              <div style={{ fontSize: "11px", color: "#334155" }}>
                {isSinking ? `of ${fmt(monthlyTarget)} this period` : `of ${fmt(goal.target_amount)}`}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "13px", background: `linear-gradient(145deg, rgba(${style.rgb},0.2), rgba(${style.rgb},0.4))`, border: `1px solid rgba(${style.rgb},0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "21px" }}>
                {style.icon}
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>{goal.name}</div>
                {goal.description && <div style={{ fontSize: "11px", color: "#475569" }}>{goal.description}</div>}
              </div>
            </div>
            <div style={{ padding: "12px", borderRadius: "10px", background: `rgba(${style.rgb},0.07)`, border: `1px solid rgba(${style.rgb},0.15)`, textAlign: "center" }}>
              <div style={{ fontSize: "9px", color: "#475569", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "4px" }}>CURRENT BALANCE</div>
              <div style={{ fontSize: "26px", fontWeight: 800, color: style.color }}>{fmt(current)}</div>
            </div>
          </div>
        )}

        {/* Progress bar — one time with target */}
        {!isSinking && hasTarget && (
          <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
            <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${style.color}, rgba(${style.rgb},0.6))`, borderRadius: "3px", boxShadow: `0 0 8px rgba(${style.rgb},0.5)` }} />
          </div>
        )}

        {/* Sinking fund: cumulative + period stats */}
        {isSinking && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
            <div style={{ padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "8px", color: "#334155", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "3px" }}>CUMULATIVE (ALL TIME)</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#38bdf8" }}>{fmtCompact(cumulative)}</div>
            </div>
            <div style={{ padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "8px", color: "#334155", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "3px" }}>THIS PERIOD</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: style.color }}>{fmtCompact(current)}</div>
            </div>
            {monthlyTarget > 0 && (
              <div style={{ padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "8px", color: "#334155", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "3px" }}>MONTHLY TARGET</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#a855f7" }}>{fmtCompact(monthlyTarget)}</div>
              </div>
            )}
            {monthlyTarget > 0 && (
              <div style={{ padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "8px", color: "#334155", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "3px" }}>STILL NEEDED</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b" }}>{fmtCompact(Math.max(0, monthlyTarget - current))}</div>
              </div>
            )}
          </div>
        )}

        {/* One-time: stats row */}
        {!isSinking && hasTarget && remaining > 0 && projection && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
            <div style={{ padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "8px", color: "#334155", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "3px" }}>REMAINING</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b" }}>{fmtCompact(remaining)}</div>
            </div>
            <div style={{ padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "8px", color: "#334155", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "3px" }}>MONTHLY</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: style.color }}>{fmtCompact(projection.monthlyNeeded)}</div>
            </div>
            <div style={{ padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "8px", color: "#334155", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "3px" }}>TARGET DATE</div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8" }}>{projection.targetLabel}</div>
            </div>
          </div>
        )}

        {/* Last reset */}
        {goal.last_reset_at && (
          <div style={{ fontSize: "10px", color: "#1e293b", marginBottom: "10px" }}>
            Last reset: {new Date(goal.last_reset_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setGoalAction({ goal, type: "contribute" }); setActionAmount(""); }}
            style={{ flex: 1, padding: "8px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "8px", color: "#22c55e", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(34,197,94,0.18)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(34,197,94,0.1)"}
          >+ Contribute</button>
          <button onClick={() => { setGoalAction({ goal, type: "withdraw" }); setActionAmount(""); }}
            style={{ flex: 1, padding: "8px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", color: "#f59e0b", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(245,158,11,0.15)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(245,158,11,0.08)"}
          >− Withdraw</button>
          <button onClick={() => setResetTarget(goal)}
            style={{ padding: "8px 10px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", color: "#6366f1", fontSize: "12px", cursor: "pointer" }}
            title="Reset options"
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.15)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.08)"}
          >↺</button>
          <button onClick={() => closeGoal(goal.id)}
            style={{ padding: "8px 10px", background: "transparent", border: "none", color: "#334155", fontSize: "13px", cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}
          >🗑</button>
        </div>
      </div>
    );
  };

  const inputStyleLocal: React.CSSProperties = inputStyle;
  const labelStyleLocal: React.CSSProperties = labelStyle;

  return (
    <div style={{ maxWidth: "1100px", display: "flex", gap: "24px", alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Savings Dashboard</h1>
          <p style={{ color: "#475569", fontSize: "13.5px", margin: 0 }}>Track savings goals and recurring sinking funds.</p>
        </div>

        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "24px" }}>
          <div style={{ padding: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: "10px", color: "#475569", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "8px" }}>TOTAL SAVED</div>
              <button onClick={() => setShowResetTotal(true)} style={{ background: "transparent", border: "none", color: "#334155", cursor: "pointer", fontSize: "12px" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}
                title="Reset total">↺</button>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#22c55e" }}>{fmt(totalSaved)}</div>
            <div style={{ fontSize: "10px", color: "#334155", marginTop: "4px" }}>{totalSaved > 0 ? "Actual saved across all goals" : "No contributions yet"}{budgetSavingsTotal > 0 ? ` · ${fmtCompact(budgetSavingsTotal)}/mo planned` : ""}</div>
            <div style={{ marginTop: "10px", height: "2px", background: "rgba(34,197,94,0.3)", borderRadius: "1px" }} />
          </div>
          <div style={{ padding: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px" }}>
            <div style={{ fontSize: "10px", color: "#475569", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "8px" }}>TOTAL TARGET</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#38bdf8" }}>{totalTarget > 0 ? fmt(totalTarget) : "—"}</div>
            <div style={{ fontSize: "10px", color: "#334155", marginTop: "4px" }}>{goalsWithTarget.length > 0 ? `${goalsWithTarget.length} goal${goalsWithTarget.length !== 1 ? "s" : ""} with targets` : "No targets set"}</div>
            <div style={{ marginTop: "10px", height: "2px", background: "rgba(56,189,248,0.3)", borderRadius: "1px" }} />
          </div>
          <div style={{ padding: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px" }}>
            <div style={{ fontSize: "10px", color: "#475569", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "8px" }}>ACTIVE GOALS</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#a855f7" }}>{goals.length}</div>
            <div style={{ fontSize: "10px", color: "#334155", marginTop: "4px" }}>{oneTimeGoals.length} one-time · {sinkingFunds.length} sinking funds</div>
            <div style={{ marginTop: "10px", height: "2px", background: "rgba(168,85,247,0.3)", borderRadius: "1px" }} />
          </div>
        </div>

        {/* Add button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em" }}>SAVINGS GOALS ({goals.length})</div>
          <button onClick={() => setShowAddGoal(true)} style={{ padding: "8px 16px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", color: "#22c55e", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>+ Add Goal</button>
        </div>

        {/* Sinking funds section */}
        {sinkingFunds.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#a855f7", letterSpacing: "0.12em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>↻</span> SINKING FUNDS ({sinkingFunds.length})
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {sinkingFunds.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
            </div>
          </div>
        )}

        {/* One-time goals section */}
        {oneTimeGoals.length > 0 && (
          <div>
            {sinkingFunds.length > 0 && (
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.12em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🎯</span> ONE-TIME GOALS ({oneTimeGoals.length})
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {oneTimeGoals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
            </div>
          </div>
        )}

        {/* Budget savings categories */}
        {budgetSavingsCategories.length > 0 && (
          <div style={{ marginTop: "24px", marginBottom: "24px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#f59e0b", letterSpacing: "0.12em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>📋</span> BUDGET SAVINGS CATEGORIES ({budgetSavingsCategories.length})
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
              {budgetSavingsCategories.map((cat: any) => (
                <div key={cat.id} style={{ padding: "16px", background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "14px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc", marginBottom: "4px" }}>{cat.name}</div>
                  {cat.description && <div style={{ fontSize: "11px", color: "#475569", marginBottom: "6px" }}>{cat.description}</div>}
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#f59e0b" }}>{fmt(Number(cat.monthly_limit ?? 0))}<span style={{ fontSize: "11px", color: "#475569", fontWeight: 600 }}>/mo</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {goals.length === 0 && !loading && (
          <div style={{ padding: "56px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px" }}>
            <div style={{ fontSize: "48px", marginBottom: "14px" }}>💰</div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>No savings goals yet</div>
            <div style={{ fontSize: "13px", color: "#334155", marginBottom: "20px" }}>Create a one-time goal or a recurring sinking fund.</div>
            <button onClick={() => setShowAddGoal(true)} style={{ padding: "11px 24px", background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Create First Goal</button>
          </div>
        )}
      </div>

      {/* ── EDIT PANEL ── */}
      {selectedGoal && (
        <div style={{ width: "290px", flexShrink: 0, background: "rgba(8,11,18,0.97)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "22px", position: "sticky", top: "86px", maxHeight: "calc(100vh - 110px)", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>Edit Goal</div>
            <button onClick={() => setSelectedGoal(null)} style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: "16px" }}>✕</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
            <div>
              <label style={labelStyleLocal}>GOAL NAME</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyleLocal}
                onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
            <div>
              <label style={labelStyleLocal}>DESCRIPTION</label>
              <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Optional" style={inputStyleLocal}
                onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
            {selectedGoal.goal_type === "sinking_fund" && (
              <div>
                <label style={labelStyleLocal}>MONTHLY TARGET</label>
                <input type="number" value={editMonthlyTarget} onChange={(e) => setEditMonthlyTarget(e.target.value)} placeholder="0.00" style={inputStyleLocal}
                  onFocus={(e) => e.target.style.borderColor = "rgba(168,85,247,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
            )}
            <div>
              <label style={labelStyleLocal}>TARGET AMOUNT (optional)</label>
              <input type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} placeholder="Leave blank for ongoing" style={inputStyleLocal}
                onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
            <div>
              <label style={labelStyleLocal}>TARGET DATE (optional)</label>
              <input type="date" value={editTargetDate} onChange={(e) => setEditTargetDate(e.target.value)} style={inputStyleLocal}
                onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>

            <button onClick={saveEdit} disabled={editSaving || !editName.trim()}
              style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: editSaving ? "not-allowed" : "pointer", opacity: editSaving ? 0.7 : 1 }}>
              {editSaving ? "Saving..." : "Save Changes"}
            </button>

            {editMsg && (
              <div style={{ padding: "10px 12px", background: editMsg.includes("success") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${editMsg.includes("success") ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: "8px", fontSize: "12px", color: editMsg.includes("success") ? "#22c55e" : "#ef4444" }}>
                {editMsg}
              </div>
            )}

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginBottom: "10px" }}>BALANCES</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", color: "#475569" }}>Current period</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>{fmt(selectedGoal.current_amount)}</span>
              </div>
              {selectedGoal.goal_type === "sinking_fund" && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11px", color: "#475569" }}>Cumulative (all time)</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#38bdf8" }}>{fmt(selectedGoal.cumulative_amount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ADD GOAL MODAL ── */}
      {showAddGoal && (
        <div style={modalOverlay} onClick={() => setShowAddGoal(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Create Savings Goal</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 18px" }}>Choose a goal type — one-time target or a recurring sinking fund.</p>

            {/* Goal type toggle */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "4px", marginBottom: "18px", gap: "4px" }}>
              <button onClick={() => setNewGoalType("one_time")} style={{ flex: 1, padding: "9px", borderRadius: "7px", border: "none", cursor: "pointer", background: newGoalType === "one_time" ? "rgba(37,99,235,0.2)" : "transparent", color: newGoalType === "one_time" ? "#38bdf8" : "#475569", fontSize: "12px", fontWeight: newGoalType === "one_time" ? 700 : 400 }}>
                🎯 One-Time Goal
              </button>
              <button onClick={() => setNewGoalType("sinking_fund")} style={{ flex: 1, padding: "9px", borderRadius: "7px", border: "none", cursor: "pointer", background: newGoalType === "sinking_fund" ? "rgba(168,85,247,0.2)" : "transparent", color: newGoalType === "sinking_fund" ? "#a855f7" : "#475569", fontSize: "12px", fontWeight: newGoalType === "sinking_fund" ? 700 : 400 }}>
                ↻ Sinking Fund
              </button>
            </div>

            {newGoalType === "sinking_fund" && (
              <div style={{ padding: "12px", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: "10px", marginBottom: "16px", fontSize: "11px", color: "#64748b", lineHeight: 1.6 }}>
                A sinking fund is a recurring savings bucket. Set a monthly target, contribute throughout the month, then reset at month end. Your all-time cumulative total is always preserved.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              <div>
                <label style={labelStyle}>GOAL NAME</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={newGoalType === "sinking_fund" ? "e.g. Groceries, Car Maintenance, Medical..." : "e.g. Emergency Fund, Vacation, Down Payment..."} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = newGoalType === "sinking_fund" ? "rgba(168,85,247,0.4)" : "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              {newGoalType === "sinking_fund" && (
                <div>
                  <label style={labelStyle}>MONTHLY TARGET</label>
                  <input type="number" value={newMonthlyTarget} onChange={(e) => setNewMonthlyTarget(e.target.value)} placeholder="Amount to save each month" style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(168,85,247,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
              )}

              <div>
                <label style={labelStyle}>TARGET AMOUNT (optional)</label>
                <input type="number" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} placeholder="Leave blank for ongoing" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              {newGoalType === "one_time" && (
                <div>
                  <label style={labelStyle}>TARGET DATE (optional)</label>
                  <input type="date" value={newTargetDate} onChange={(e) => setNewTargetDate(e.target.value)} style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
              )}

              <div>
                <label style={labelStyle}>DESCRIPTION (optional)</label>
                <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What are you saving for?" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowAddGoal(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={addGoal} disabled={savingGoal || !newName.trim()}
                  style={{ flex: 1, padding: "11px", background: newGoalType === "sinking_fund" ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "linear-gradient(135deg, #16a34a, #15803d)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: savingGoal ? "not-allowed" : "pointer", opacity: savingGoal ? 0.7 : 1 }}>
                  {savingGoal ? "Creating..." : newGoalType === "sinking_fund" ? "Create Sinking Fund" : "Create Goal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTRIBUTE/WITHDRAW MODAL ── */}
      {goalAction && (
        <div style={modalOverlay} onClick={() => setGoalAction(null)}>
          <div style={{ ...modalBox, maxWidth: "360px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              {goalAction.type === "contribute" ? "💚 Add Contribution" : "🟡 Withdraw Funds"}
            </h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 4px" }}>{goalAction.goal.name}</p>
            <p style={{ fontSize: "11px", color: "#334155", margin: "0 0 20px" }}>
              Current: <strong style={{ color: "#22c55e" }}>{fmt(goalAction.goal.current_amount)}</strong>
              {goalAction.goal.goal_type === "sinking_fund" && Number(goalAction.goal.monthly_target) > 0 && (
                <span style={{ color: "#475569" }}> · Monthly target: {fmt(goalAction.goal.monthly_target!)}</span>
              )}
            </p>
            <input type="number" value={actionAmount} onChange={(e) => setActionAmount(e.target.value)} placeholder="0.00" autoFocus
              style={{ ...inputStyle, fontSize: "22px", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}
              onFocus={(e) => e.target.style.borderColor = goalAction.type === "contribute" ? "rgba(34,197,94,0.4)" : "rgba(245,158,11,0.4)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setGoalAction(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAction} disabled={actionSaving || !actionAmount}
                style={{ flex: 1, padding: "11px", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700,
                  background: goalAction.type === "contribute" ? "linear-gradient(135deg, #16a34a, #15803d)" : "linear-gradient(135deg, #d97706, #b45309)",
                  cursor: actionSaving || !actionAmount ? "not-allowed" : "pointer",
                  opacity: actionSaving || !actionAmount ? 0.7 : 1,
                }}>
                {actionSaving ? "Saving..." : goalAction.type === "contribute" ? "Add to Goal" : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET GOAL MODAL ── */}
      {resetTarget && (
        <div style={modalOverlay} onClick={() => setResetTarget(null)}>
          <div style={{ ...modalBox, maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>↺ Reset {resetTarget.name}</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 20px" }}>Choose how to reset this goal.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => resetPeriod(resetTarget)}
                style={{ padding: "16px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.14)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.08)"}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#6366f1", marginBottom: "4px" }}>↺ Reset Period</div>
                <div style={{ fontSize: "11px", color: "#475569" }}>
                  Clears this period's balance to $0.
                  {resetTarget.goal_type === "sinking_fund" && ` Adds ${fmt(resetTarget.current_amount)} to your cumulative all-time total.`}
                  Ring resets to 0% for the new period.
                </div>
              </button>
              <button onClick={() => resetEverything(resetTarget)}
                style={{ padding: "16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.14)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#ef4444", marginBottom: "4px" }}>🔴 Reset Everything</div>
                <div style={{ fontSize: "11px", color: "#475569" }}>Clears this period AND cumulative all-time total to $0. Full clean slate.</div>
              </button>
              <button onClick={() => setResetTarget(null)}
                style={{ padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET ALL MODAL ── */}
      {showResetTotal && (
        <div style={modalOverlay} onClick={() => setShowResetTotal(false)}>
          <div style={{ ...modalBox, maxWidth: "360px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>↺ Reset All Savings</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 20px" }}>
              Resets current period balance to $0 on all active goals. Cumulative totals on sinking funds are preserved. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowResetTotal(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
              <button onClick={resetAllSaved} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #dc2626, #b91c1c)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                Reset All to $0
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

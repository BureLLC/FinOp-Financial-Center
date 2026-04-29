"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../src/lib/supabase";

interface Alert {
  id: string;
  alert_type: string;
  alert_source: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  triggered_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

const ALERT_TYPES = [
  { value: "budget_exceeded",   label: "Budget Exceeded",     icon: "📊", color: "#f97316", rgb: "249,115,22" },
  { value: "tax_underpayment",  label: "Tax Underpayment",    icon: "🧾", color: "#ef4444", rgb: "239,68,68" },
  { value: "cash_flow_warning", label: "Cash Flow Warning",   icon: "💸", color: "#f59e0b", rgb: "245,158,11" },
  { value: "margin_risk",       label: "Margin Risk",         icon: "⚡", color: "#ef4444", rgb: "239,68,68" },
  { value: "leverage_warning",  label: "Leverage Warning",    icon: "📈", color: "#f97316", rgb: "249,115,22" },
  { value: "spending_anomaly",  label: "Spending Anomaly",    icon: "🔍", color: "#a855f7", rgb: "168,85,247" },
  { value: "ai_insight",        label: "AI Insight",          icon: "🤖", color: "#38bdf8", rgb: "56,189,248" },
  { value: "other",             label: "Other",               icon: "🔔", color: "#64748b", rgb: "100,116,139" },
];

const SEVERITIES = [
  { value: "low",      label: "Low",      color: "#22c55e", rgb: "34,197,94",  bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.25)" },
  { value: "moderate", label: "Moderate", color: "#f59e0b", rgb: "245,158,11", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  { value: "high",     label: "High",     color: "#f97316", rgb: "249,115,22", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)" },
  { value: "critical", label: "Critical", color: "#ef4444", rgb: "239,68,68",  bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)" },
];

const SOURCES = [
  { value: "rule_engine", label: "Rule Engine" },
  { value: "ai_engine",   label: "AI Engine" },
  { value: "system",      label: "System" },
];

function getAlertType(value: string) {
  return ALERT_TYPES.find((a) => a.value === value) ?? ALERT_TYPES[ALERT_TYPES.length - 1];
}
function getSeverity(value: string) {
  return SEVERITIES.find((s) => s.value === value) ?? SEVERITIES[0];
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}
function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n ?? 0);
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
};

export default function AlertsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");

  // Add alert modal
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState("budget_exceeded");
  const [newSeverity, setNewSeverity] = useState("moderate");
  const [newSource, setNewSource] = useState("system");
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("alerts")
      .select("id, alert_type, alert_source, severity, status, title, message, triggered_at, acknowledged_at, resolved_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setAlerts(data ?? []);
    setLoading(false);
  };

  // ── Auto-generate alerts from real data ───────────────────────────────────
  const generateAlerts = async () => {
    setGenerating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setGenerating(false); return; }

    const now = new Date().toISOString();
    const newAlerts: Omit<Alert, "id" | "acknowledged_at" | "resolved_at">[] = [];

    // Pull data needed for checks
    const [snapRes, budgetCatRes, budgetRecRes, tradesRes, taxRes, txRes] = await Promise.all([
      supabase.from("portfolio_snapshots").select("total_cash").eq("user_id", user.id).order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("budget_categories").select("id, name, monthly_limit").eq("user_id", user.id).eq("is_active", true),
      supabase.from("budget_records").select("category_id, actual_spent").eq("user_id", user.id),
      supabase.from("trades").select("symbol, stop_loss, asset_type").eq("user_id", user.id).eq("status", "open").is("deleted_at", null),
      supabase.from("tax_estimates").select("total_tax_liability, balance_due").eq("user_id", user.id).eq("period_type", "quarterly").eq("quarter", Math.ceil((new Date().getMonth() + 1) / 3)).order("calculated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("transactions").select("amount, direction, transaction_date").eq("user_id", user.id).is("deleted_at", null).order("transaction_date", { ascending: false }).limit(200),
    ]);

    // Get existing active alert titles to avoid duplicates
    const { data: existingAlerts } = await supabase
      .from("alerts")
      .select("title, alert_type")
      .eq("user_id", user.id)
      .eq("status", "active");
    const existingTitles = new Set((existingAlerts ?? []).map((a) => a.title));

    // ── CHECK 1: Budget exceeded ──────────────────────────────────────────
    const cats = budgetCatRes.data ?? [];
    const recs = budgetRecRes.data ?? [];
    for (const cat of cats) {
      if (!cat.monthly_limit || Number(cat.monthly_limit) === 0) continue;
      const rec = recs.find((r) => r.category_id === cat.id);
      const spent = Number(rec?.actual_spent ?? 0);
      const limit = Number(cat.monthly_limit);
      if (spent > limit) {
        const title = `Budget Exceeded: ${cat.name}`;
        if (!existingTitles.has(title)) {
          const pct = ((spent - limit) / limit * 100).toFixed(0);
          newAlerts.push({
            alert_type: "budget_exceeded",
            alert_source: "rule_engine",
            severity: spent > limit * 1.5 ? "critical" : "high",
            status: "active",
            title,
            message: `Your ${cat.name} category is ${pct}% over budget. Spent ${fmt(spent)} vs limit of ${fmt(limit)}. Consider adjusting your spending or reallocating funds from another category.`,
            triggered_at: now,
            created_at: now,
          });
        }
      } else if (spent > limit * 0.85) {
        const title = `Budget Warning: ${cat.name} at ${Math.round(spent/limit*100)}%`;
        if (!existingTitles.has(title)) {
          newAlerts.push({
            alert_type: "budget_exceeded",
            alert_source: "rule_engine",
            severity: "moderate",
            status: "active",
            title,
            message: `Your ${cat.name} budget is ${Math.round(spent/limit*100)}% used with ${fmt(limit - spent)} remaining for the month.`,
            triggered_at: now,
            created_at: now,
          });
        }
      }
    }

    // ── CHECK 2: Cash flow warning ────────────────────────────────────────
    const cashBalance = Number(snapRes.data?.total_cash ?? 0);
    if (cashBalance < 500 && cashBalance > 0) {
      const title = "Low Cash Balance Warning";
      if (!existingTitles.has(title)) {
        newAlerts.push({
          alert_type: "cash_flow_warning",
          alert_source: "rule_engine",
          severity: cashBalance < 100 ? "critical" : "high",
          status: "active",
          title,
          message: `Your total cash balance is ${fmt(cashBalance)}, which is below the recommended minimum of $500. Consider transferring funds or reducing discretionary spending.`,
          triggered_at: now,
          created_at: now,
        });
      }
    }

    // ── CHECK 3: Open trades with no stop loss ────────────────────────────
    const tradesNoStop = (tradesRes.data ?? []).filter((t) => !t.stop_loss);
    if (tradesNoStop.length > 0) {
      const title = `${tradesNoStop.length} Open Trade${tradesNoStop.length > 1 ? "s" : ""} Without Stop Loss`;
      if (!existingTitles.has(title)) {
        newAlerts.push({
          alert_type: "margin_risk",
          alert_source: "rule_engine",
          severity: "high",
          status: "active",
          title,
          message: `You have ${tradesNoStop.length} open trade${tradesNoStop.length > 1 ? "s" : ""} (${tradesNoStop.map((t) => t.symbol).join(", ")}) without a stop loss. This exposes you to unlimited downside risk. Set stop losses immediately to protect your capital.`,
          triggered_at: now,
          created_at: now,
        });
      }
    }

    // ── CHECK 4: Quarterly tax payment due ────────────────────────────────
    const taxBalance = Number(taxRes.data?.balance_due ?? 0);
    const currentMonth = new Date().getMonth() + 1;
    const quarterlyDueDates = [
      { month: 4, day: 15, quarter: 1, label: "Q1" },
      { month: 6, day: 16, quarter: 2, label: "Q2" },
      { month: 9, day: 15, quarter: 3, label: "Q3" },
      { month: 1, day: 15, quarter: 4, label: "Q4" },
    ];
    for (const due of quarterlyDueDates) {
      const dueDate = new Date(new Date().getFullYear(), due.month - 1, due.day);
      const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil > 0 && daysUntil <= 30 && taxBalance > 0) {
        const title = `${due.label} Estimated Tax Payment Due in ${daysUntil} Days`;
        if (!existingTitles.has(title)) {
          newAlerts.push({
            alert_type: "tax_underpayment",
            alert_source: "rule_engine",
            severity: daysUntil <= 7 ? "critical" : daysUntil <= 14 ? "high" : "moderate",
            status: "active",
            title,
            message: `Your ${due.label} estimated tax payment of ${fmt(taxBalance)} is due on ${dueDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. Pay on time to avoid IRS underpayment penalties of up to 8% annually.`,
            triggered_at: now,
            created_at: now,
          });
        }
      }
    }

    // ── CHECK 5: Spending anomaly ─────────────────────────────────────────
    const txs = txRes.data ?? [];
    const thisMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const thisMonthSpend = txs
      .filter((t) => t.direction === "debit" && new Date(t.transaction_date).getMonth() === thisMonth.getMonth())
      .reduce((s, t) => s + Number(t.amount), 0);
    const lastMonthSpend = txs
      .filter((t) => t.direction === "debit" && new Date(t.transaction_date).getMonth() === lastMonth.getMonth())
      .reduce((s, t) => s + Number(t.amount), 0);
    if (lastMonthSpend > 0 && thisMonthSpend > lastMonthSpend * 1.2) {
      const pct = Math.round((thisMonthSpend - lastMonthSpend) / lastMonthSpend * 100);
      const title = `Spending Spike: ${pct}% Above Last Month`;
      if (!existingTitles.has(title)) {
        newAlerts.push({
          alert_type: "spending_anomaly",
          alert_source: "rule_engine",
          severity: pct > 50 ? "high" : "moderate",
          status: "active",
          title,
          message: `Your spending this month (${fmt(thisMonthSpend)}) is ${pct}% higher than last month (${fmt(lastMonthSpend)}). Review your transactions to identify unexpected expenses.`,
          triggered_at: now,
          created_at: now,
        });
      }
    }

    // ── CHECK 6: AI insight (weekly) ──────────────────────────────────────
    const lastAiInsight = (existingAlerts ?? []).find((a) => a.alert_type === "ai_insight");
    const daysSinceInsight = lastAiInsight ? Math.floor((Date.now() - new Date((alerts.find((a) => a.alert_type === "ai_insight")?.created_at ?? "1970")).getTime()) / (1000 * 60 * 60 * 24)) : 999;

    if (daysSinceInsight >= 7) {
      const insights = [
        { title: "💡 Tip: Automate Your Savings", message: "Set up automatic transfers to your savings goals on payday. Paying yourself first ensures consistent progress without relying on willpower. Even $50/week adds up to $2,600/year." },
        { title: "💡 Tip: Review Your Write-Offs", message: "Make sure you're capturing all eligible business deductions. Home office, vehicle mileage, equipment, and professional development are commonly missed. Each $1,000 in deductions saves ~$250 in taxes at a 25% rate." },
        { title: "💡 Tip: Diversify Your Portfolio", message: "A well-diversified portfolio reduces risk without sacrificing returns. Consider spreading investments across equities, bonds, and alternative assets based on your risk tolerance and time horizon." },
        { title: "💡 Tip: Check Your R/R Ratios", message: "Profitable traders consistently maintain risk/reward ratios of at least 2:1. This means you can be right only 40% of the time and still be profitable. Review your closed trades to track your average R/R." },
      ];
      const insight = insights[Math.floor(Math.random() * insights.length)];
      newAlerts.push({
        alert_type: "ai_insight",
        alert_source: "ai_engine",
        severity: "low",
        status: "active",
        title: insight.title,
        message: insight.message,
        triggered_at: now,
        created_at: now,
      });
    }

    // ── Insert all new alerts ─────────────────────────────────────────────
    if (newAlerts.length > 0) {
      await supabase.from("alerts").insert(
        newAlerts.map((a) => ({ ...a, user_id: user.id }))
      );
    }

    await loadData();
    setGenerating(false);
  };

  const acknowledge = async (id: string) => {
    await supabase.from("alerts").update({ status: "acknowledged", acknowledged_at: new Date().toISOString() }).eq("id", id);
    await loadData();
  };

  const resolve = async (id: string) => {
    await supabase.from("alerts").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", id);
    await loadData();
  };

  const dismiss = async (id: string) => {
    await supabase.from("alerts").update({ status: "dismissed" }).eq("id", id);
    await loadData();
  };

  const deleteAlert = async (id: string) => {
    if (!confirm("Delete this alert permanently?")) return;
    await supabase.from("alerts").delete().eq("id", id);
    await loadData();
  };

  const deleteAllDismissed = async () => {
    if (!confirm("Delete all dismissed alerts?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("alerts").delete().eq("user_id", user.id).eq("status", "dismissed");
    await loadData();
  };

  const addAlert = async () => {
    if (!newTitle.trim() || !newMessage.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("alerts").insert({
      user_id: user.id,
      alert_type: newType,
      alert_source: newSource,
      severity: newSeverity,
      status: "active",
      title: newTitle.trim(),
      message: newMessage.trim(),
      triggered_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
    setNewTitle(""); setNewMessage("");
    setShowAdd(false); setSaving(false);
    await loadData();
  };

  const filtered = alerts.filter((a) => {
    const statusMatch = filterStatus === "all" || a.status === filterStatus;
    const severityMatch = filterSeverity === "all" || a.severity === filterSeverity;
    return statusMatch && severityMatch;
  });

  const activeCount = alerts.filter((a) => a.status === "active").length;
  const criticalCount = alerts.filter((a) => a.severity === "critical" && a.status === "active").length;
  const acknowledgedCount = alerts.filter((a) => a.status === "acknowledged").length;
  const resolvedCount = alerts.filter((a) => a.status === "resolved").length;

  return (
    <div style={{ maxWidth: "1000px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Alert Center</h1>
          <p style={{ color: "#475569", fontSize: "13.5px", margin: 0 }}>
            Automatic alerts from budget, tax, trading, and AI engines — plus custom manual alerts.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {alerts.filter((a) => a.status === "dismissed").length > 0 && (
            <button onClick={deleteAllDismissed}
              style={{ padding: "9px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#334155", fontSize: "12px", cursor: "pointer" }}>
              Clear Dismissed
            </button>
          )}
          <button onClick={generateAlerts} disabled={generating}
            style={{ padding: "10px 18px", background: generating ? "rgba(168,85,247,0.1)" : "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "9px", color: "#a855f7", fontSize: "13px", fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.7 : 1 }}>
            {generating ? "⚡ Scanning..." : "⚡ Run Auto-Scan"}
          </button>
          <button onClick={() => setShowAdd(true)}
            style={{ padding: "10px 18px", background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "9px", color: "#38bdf8", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            + Create Alert
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Active",       value: String(activeCount),       color: "#ef4444", rgb: "239,68,68",   sub: "Needs attention" },
          { label: "Critical",     value: String(criticalCount),     color: "#ef4444", rgb: "239,68,68",   sub: "Highest priority" },
          { label: "Acknowledged", value: String(acknowledgedCount), color: "#f59e0b", rgb: "245,158,11",  sub: "In progress" },
          { label: "Resolved",     value: String(resolvedCount),     color: "#22c55e", rgb: "34,197,94",   sub: "Completed" },
          { label: "Total",        value: String(alerts.length),     color: "#38bdf8", rgb: "56,189,248",  sub: "All time" },
        ].map((k, i) => (
          <div key={i} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: `1px solid rgba(${k.rgb},0.15)`, borderRadius: "12px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-14px", right: "-14px", width: "50px", height: "50px", borderRadius: "50%", background: `radial-gradient(circle, rgba(${k.rgb},0.15) 0%, transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ fontSize: "9px", color: "#475569", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "5px" }}>{k.label}</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: "10px", color: "#334155", marginTop: "2px" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Critical banner */}
      {criticalCount > 0 && (
        <div style={{ marginBottom: "20px", padding: "14px 18px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px", display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "20px" }}>🚨</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#ef4444", marginBottom: "2px" }}>{criticalCount} Critical Alert{criticalCount !== 1 ? "s" : ""} Require Immediate Attention</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>Review and resolve these alerts to protect your financial health.</div>
          </div>
        </div>
      )}

      {/* Auto-scan info banner */}
      {alerts.length === 0 && !loading && (
        <div style={{ marginBottom: "20px", padding: "14px 18px", background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: "12px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "20px", flexShrink: 0 }}>⚡</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#a855f7", marginBottom: "4px" }}>Auto-Scan Your Financial Data</div>
            <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6 }}>
              Click <strong style={{ color: "#a855f7" }}>Run Auto-Scan</strong> to automatically check your budget categories, cash balance, open trades, tax payments, spending patterns, and generate AI insights tailored to your financial data.
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "3px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "3px" }}>
          {["all", "active", "acknowledged", "resolved", "dismissed"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ padding: "5px 11px", borderRadius: "7px", border: "none", cursor: "pointer", background: filterStatus === s ? "rgba(37,99,235,0.2)" : "transparent", color: filterStatus === s ? "#38bdf8" : "#475569", fontSize: "11px", fontWeight: filterStatus === s ? 700 : 400, textTransform: "capitalize" }}>
              {s}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button onClick={() => setFilterSeverity("all")}
            style={{ padding: "5px 11px", borderRadius: "7px", border: `1px solid ${filterSeverity === "all" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)"}`, background: filterSeverity === "all" ? "rgba(255,255,255,0.08)" : "transparent", color: filterSeverity === "all" ? "#f8fafc" : "#475569", fontSize: "11px", cursor: "pointer" }}>
            All
          </button>
          {SEVERITIES.map((s) => (
            <button key={s.value} onClick={() => setFilterSeverity(filterSeverity === s.value ? "all" : s.value)}
              style={{ padding: "5px 11px", borderRadius: "7px", border: `1px solid ${filterSeverity === s.value ? s.border : "rgba(255,255,255,0.07)"}`, background: filterSeverity === s.value ? s.bg : "transparent", color: filterSeverity === s.value ? s.color : "#475569", fontSize: "11px", cursor: "pointer", fontWeight: filterSeverity === s.value ? 700 : 400 }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts list */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>Loading alerts...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "48px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔔</div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
            {filterStatus === "all" && filterSeverity === "all" ? "No alerts yet" : "No alerts match your filters"}
          </div>
          <div style={{ fontSize: "12px", color: "#334155" }}>
            {filterStatus === "all" && filterSeverity === "all"
              ? "Run Auto-Scan to check your financial data for issues and generate AI insights."
              : "Try adjusting your filters."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((alert) => {
            const type = getAlertType(alert.alert_type);
            const sev = getSeverity(alert.severity);
            const isActive = alert.status === "active";
            const isDismissed = alert.status === "dismissed";
            const isResolved = alert.status === "resolved";
            const isAcknowledged = alert.status === "acknowledged";

            return (
              <div key={alert.id} style={{
                padding: "16px 18px",
                background: isDismissed ? "rgba(255,255,255,0.01)" : `rgba(${type.rgb},0.03)`,
                border: `1px solid ${isDismissed ? "rgba(255,255,255,0.04)" : isActive ? sev.border : "rgba(255,255,255,0.06)"}`,
                borderRadius: "14px",
                opacity: isDismissed ? 0.45 : 1,
                transition: "all 0.15s ease",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: isResolved ? "#22c55e" : isDismissed ? "#1e293b" : sev.color, borderRadius: "14px 0 0 14px", boxShadow: isActive ? `0 0 8px ${sev.color}55` : "none" }} />

                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", paddingLeft: "8px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: `linear-gradient(145deg, rgba(${type.rgb},0.2), rgba(${type.rgb},0.4))`, border: `1px solid rgba(${type.rgb},0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "19px", flexShrink: 0, boxShadow: `0 4px 12px rgba(${type.rgb},0.2)` }}>
                    {type.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px", gap: "8px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: isDismissed ? "#334155" : "#f8fafc" }}>{alert.title}</div>
                        <span style={{ fontSize: "9px", padding: "2px 6px", background: sev.bg, border: `1px solid ${sev.border}`, borderRadius: "99px", color: sev.color, fontWeight: 700 }}>{sev.label.toUpperCase()}</span>
                        <span style={{ fontSize: "9px", padding: "2px 6px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "99px", color: "#475569" }}>{type.label}</span>
                        <span style={{ fontSize: "9px", padding: "2px 6px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "99px", color: "#334155" }}>{alert.alert_source.replace("_", " ")}</span>
                        {!isActive && (
                          <span style={{ fontSize: "9px", padding: "2px 6px", background: isResolved ? "rgba(34,197,94,0.1)" : isAcknowledged ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${isResolved ? "rgba(34,197,94,0.2)" : isAcknowledged ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: "99px", color: isResolved ? "#22c55e" : isAcknowledged ? "#f59e0b" : "#475569", fontWeight: 600, textTransform: "capitalize" }}>
                            {alert.status}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "10px", color: "#334155", flexShrink: 0 }}>{timeAgo(alert.created_at)}</div>
                    </div>

                    <div style={{ fontSize: "12px", color: isDismissed ? "#334155" : "#64748b", lineHeight: 1.6, marginBottom: "10px" }}>{alert.message}</div>

                    <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
                      {isActive && (
                        <>
                          <button onClick={() => acknowledge(alert.id)}
                            style={{ padding: "4px 10px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "6px", color: "#f59e0b", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>
                            Acknowledge
                          </button>
                          <button onClick={() => resolve(alert.id)}
                            style={{ padding: "4px 10px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "6px", color: "#22c55e", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>
                            Resolve
                          </button>
                          <button onClick={() => dismiss(alert.id)}
                            style={{ padding: "4px 10px", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "6px", color: "#475569", fontSize: "10px", cursor: "pointer" }}>
                            Dismiss
                          </button>
                        </>
                      )}
                      {isAcknowledged && (
                        <button onClick={() => resolve(alert.id)}
                          style={{ padding: "4px 10px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "6px", color: "#22c55e", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>
                          Mark Resolved
                        </button>
                      )}
                      <button onClick={() => deleteAlert(alert.id)}
                        style={{ padding: "4px 10px", background: "transparent", border: "1px solid rgba(239,68,68,0.12)", borderRadius: "6px", color: "#334155", fontSize: "10px", cursor: "pointer", marginLeft: "auto", transition: "all 0.15s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#334155"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.12)"; }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD ALERT MODAL ── */}
      {showAdd && (
        <div style={modalOverlay} onClick={() => setShowAdd(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Create Manual Alert</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 20px" }}>Create a custom alert for any financial event or reminder.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>ALERT TYPE</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {ALERT_TYPES.map((a) => <option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>SEVERITY</label>
                  <select value={newSeverity} onChange={(e) => setNewSeverity(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>TITLE <span style={{ color: "#ef4444" }}>*</span></label>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Review insurance renewal" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              <div>
                <label style={labelStyle}>MESSAGE <span style={{ color: "#ef4444" }}>*</span></label>
                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Describe the alert..." rows={3}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={addAlert} disabled={saving || !newTitle.trim() || !newMessage.trim()}
                  style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Creating..." : "Create Alert"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../src/lib/supabase";
import {
  calcTotalIncome,
  calcTotalExpenses,
  toNum,
} from "../../../src/lib/financialCalculations";
import { getCanonicalActivePostedTransactions, getCanonicalAccountBalances, getCanonicalInvestments } from "../../../src/lib/canonicalFinancialData";

interface AccountData {
  id: string;
  account_type: string;
  account_subtype: string;
  current_balance: number;
  account_name: string;
  institution_name: string | null;
  mask: string | null;
}

interface FinancialData {
  netWorth: number;
  totalCash: number;
  totalInvestments: number;
  totalLiabilities: number;
  totalIncome: number;
  totalExpenses: number;
  estimatedTax: number;
  savings: number;
  cd: number;
  checking: number;
  accounts: AccountData[];
  debtByType: { label: string; value: number; color: string; rgb: string }[];
  paidOffAmount: number;
  /** true when investments total came from positions table */
  investmentsFromPositions: boolean;
}

function fmt(n: number, compact = false) {
  if (compact && Math.abs(n) >= 1000) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

const DEBT_CATEGORIES: Record<string, { color: string; rgb: string; icon: string }> = {
  "credit card":    { color: "#ef4444", rgb: "239,68,68",   icon: "💳" },
  "auto":           { color: "#f97316", rgb: "249,115,22",  icon: "🚗" },
  "car":            { color: "#f97316", rgb: "249,115,22",  icon: "🚗" },
  "personal":       { color: "#a855f7", rgb: "168,85,247",  icon: "👤" },
  "student":        { color: "#38bdf8", rgb: "56,189,248",  icon: "🎓" },
  "line of credit": { color: "#f59e0b", rgb: "245,158,11",  icon: "📋" },
  "mortgage":       { color: "#6366f1", rgb: "99,102,241",  icon: "🏠" },
  "home equity":    { color: "#8b5cf6", rgb: "139,92,246",  icon: "🏡" },
  "other":          { color: "#64748b", rgb: "100,116,139", icon: "📄" },
};

function getDebtColor(subtype: string) {
  const lower = subtype.toLowerCase();
  for (const [key, val] of Object.entries(DEBT_CATEGORIES)) {
    if (lower.includes(key)) return val;
  }
  return DEBT_CATEGORIES["other"];
}

function RingChart({ segments, size = 180, thickness = 28, label, value, subtitle }: {
  segments: { value: number; color: string; label: string }[];
  size?: number; thickness?: number; label: string; value: string; subtitle?: string;
}) {
  const total = segments.reduce((s, seg) => s + Math.max(seg.value, 0), 0);
  const r = (size - thickness) / 2;
  const cx = size / 2; const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", filter: "drop-shadow(0 0 12px rgba(56,189,248,0.15))" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={thickness} />
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} strokeDasharray={`${circumference * 0.98} ${circumference * 0.02}`} strokeLinecap="round" />
        ) : segments.map((seg, i) => {
          const pct = Math.max(seg.value, 0) / total;
          const dash = pct * circumference * 0.98;
          const gap = circumference - dash;
          const currentOffset = offset;
          offset += dash + circumference * 0.02;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${seg.color}88)` }}
            />
          );
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "10px", color: "#475569", fontWeight: 700, letterSpacing: "0.08em", textAlign: "center" }}>{label}</div>
        <div style={{ fontSize: size > 150 ? "18px" : "14px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em", marginTop: "2px" }}>{value}</div>
        {subtitle && <div style={{ fontSize: "9px", color: "#334155", marginTop: "2px" }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function BarChart3D({ bars }: { bars: { label: string; value: number; color: string; rgb: string }[] }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "110px", padding: "0 4px" }}>
      {bars.map((bar, i) => {
        const pct = (bar.value / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
            <div style={{ fontSize: "9px", color: bar.color, fontWeight: 700 }}>{fmt(bar.value, true)}</div>
            <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "flex-end" }}>
              <div style={{
                width: "100%", height: `${Math.max(pct, 4)}%`,
                background: `linear-gradient(180deg, ${bar.color} 0%, rgba(${bar.rgb},0.4) 100%)`,
                borderRadius: "6px 6px 3px 3px",
                boxShadow: `0 0 14px rgba(${bar.rgb},0.4)`,
                border: `1px solid rgba(${bar.rgb},0.3)`,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)", borderRadius: "6px 6px 0 0" }} />
              </div>
            </div>
            <div style={{ fontSize: "9px", color: "#334155", textAlign: "center" }}>{bar.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function AreaChart({ data, color, rgb }: { data: number[]; color: string; rgb: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 400; const h = 90;
  const pts = data.map((v, i) => ({ x: data.length > 1 ? (i / (data.length - 1)) * w : w / 2, y: h - ((v - min) / range) * (h - 10) - 5 }));
  const pathD = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;
  const uid = rgb.replace(/,/g, "");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "90px", overflow: "visible" }}>
      <defs>
        <linearGradient id={`ag-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#ag-${uid})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />)}
    </svg>
  );
}

export default function FinancialSummaryPage() {
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use canonical sources for all financial data
    const [postedTransactions, balances, investments, taxRes] = await Promise.all([
      getCanonicalActivePostedTransactions(supabase, user.id),
      getCanonicalAccountBalances(supabase, user.id),
      getCanonicalInvestments(supabase, user.id),
      supabase
        .from("tax_estimates")
        .select("total_tax_liability")
        .eq("user_id", user.id)
        .eq("period_type", "annual")
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const accounts: AccountData[] = balances.accounts as AccountData[];

    const totalIncome = calcTotalIncome(postedTransactions);
    const totalExpenses = calcTotalExpenses(postedTransactions);

    const savings = accounts
      .filter((a) => a.account_subtype === "savings")
      .reduce((s, a) => s + toNum(a.current_balance), 0);
    const cd = accounts
      .filter((a) => a.account_subtype === "cd")
      .reduce((s, a) => s + toNum(a.current_balance), 0);
    const checking = accounts
      .filter((a) => a.account_subtype === "checking")
      .reduce((s, a) => s + toNum(a.current_balance), 0);
    const debtAccounts = accounts.filter(
      (a) => a.account_type === "credit" ||
        ["loan", "mortgage", "line of credit"].includes(a.account_subtype ?? ""),
    );

    // Log investment data status for production observability
    if (investments.warnings.length > 0) {
      console.warn("[Investments]", investments.dataStatus, investments.warnings);
    }

    const totalCash = balances.bankCash;
    const totalInvestments = investments.totalInvestmentValue;
    const investmentsFromPositions = investments.dataStatus === "positions_verified";
    const totalLiabilities = balances.liabilities;
    // Net Worth must use canonical investment total (position-based if available)
    // to match Home and Investments pages
    const netWorth = totalCash + totalInvestments - totalLiabilities;

    const debtByType = debtAccounts.map((a) => {
      const style = getDebtColor(a.account_subtype ?? "other");
      const institution = a.institution_name ?? "";
      const label = institution
        ? `${institution}${a.mask ? ` ••${a.mask}` : ""}`
        : `${a.account_subtype ?? "Credit"}${a.mask ? ` ••${a.mask}` : ""}`;
      return { label, value: toNum(a.current_balance), color: style.color, rgb: style.rgb };
    });

    const paidOffAmount = Math.min(checking + savings, totalLiabilities);

    setData({
      netWorth,
      totalCash,
      totalInvestments,
      totalLiabilities,
      totalIncome,
      totalExpenses,
      estimatedTax: toNum(taxRes.data?.total_tax_liability),
      savings,
      cd,
      checking,
      accounts,
      debtByType,
      paidOffAmount,
      investmentsFromPositions,
    });
    setLoading(false);
  };

  if (loading || !data) {
    return (
      <div style={{ maxWidth: "1100px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Financial Summary</h1>
          <p style={{ color: "#475569", fontSize: "13.5px", margin: 0 }}>Loading your financial overview...</p>
        </div>
      </div>
    );
  }

  const netCashFlow = data.totalIncome - data.totalExpenses;
  const totalAssets = data.totalCash + data.totalInvestments;
  const totalSavings = data.savings + data.cd;

  const kpis = [
    { label: "Net Worth",      value: fmt(data.netWorth),      color: "#38bdf8", rgb: "56,189,248",   icon: "◈", sub: "Assets minus liabilities" },
    { label: "Total Income",   value: fmt(data.totalIncome),   color: "#22c55e", rgb: "34,197,94",    icon: "↑", sub: "Money in" },
    { label: "Total Expenses", value: fmt(data.totalExpenses), color: "#ef4444", rgb: "239,68,68",    icon: "↓", sub: "Money out" },
    { label: "Net Cash Flow",  value: fmt(netCashFlow),        color: netCashFlow >= 0 ? "#22c55e" : "#f59e0b", rgb: netCashFlow >= 0 ? "34,197,94" : "245,158,11", icon: "⟷", sub: "Income minus expenses" },
    { label: "Investments",    value: fmt(data.totalInvestments), color: "#a855f7", rgb: "168,85,247", icon: "📈", sub: "Portfolio value" },
    { label: "Est. Tax",       value: data.estimatedTax > 0 ? fmt(data.estimatedTax) : "—", color: "#f59e0b", rgb: "245,158,11", icon: "⚡", sub: data.estimatedTax > 0 ? "2026 estimate" : "Tag income first" },
  ];

  const assetSegments = [
    { label: "Checking", value: data.checking, color: "#38bdf8" },
    { label: "Savings",  value: data.savings,  color: "#22c55e" },
    { label: "CD",       value: data.cd,        color: "#6366f1" },
    { label: "Investments", value: data.totalInvestments, color: "#a855f7" },
  ];

  const debtSegments = [
    ...data.debtByType,
    { label: "Paid", value: data.paidOffAmount, color: "#22c55e", rgb: "34,197,94" },
  ];

  const savingsSegments = [
    { label: "Savings", value: data.savings, color: "#22c55e" },
    { label: "CD",      value: data.cd,       color: "#6366f1" },
  ];

  // Mortgage — 0 if no mortgage account connected
  const mortgageBalance = data.accounts
    .filter((a) => (a.account_subtype ?? "").toLowerCase().includes("mortgage"))
    .reduce((s, a) => s + toNum(a.current_balance), 0);

  // Charts show only the current data point; historical snapshots require a
  // portfolio_snapshots time-series query (not yet implemented).
  const currentMonth = new Date().toLocaleDateString("en-US", { month: "short" });
  const monthLabels = [currentMonth];
  const netWorthTrend = [Math.max(data.netWorth, 0)];
  const expenseTrend = [data.totalExpenses];

  const barData = [
    {
      label: currentMonth,
      value: data.totalExpenses,
      color: "#ef4444",
      rgb: "239,68,68",
    },
  ];

  const card = (content: React.ReactNode, style?: React.CSSProperties) => (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "20px", backdropFilter: "blur(12px)", ...style }}>
      {content}
    </div>
  );

  const sectionTitle = (t: string) => (
    <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: "14px" }}>{t}</div>
  );

  const legend = (items: { label: string; value: number; color: string }[]) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginTop: "14px" }}>
      {items.filter((s) => s.value > 0).map((s, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: s.color, boxShadow: `0 0 5px ${s.color}` }} />
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>{s.label}</span>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: s.color }}>{fmt(s.value, true)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Financial Summary</h1>
        <p style={{ color: "#475569", fontSize: "13.5px", margin: 0 }}>Your complete financial picture — income, expenses, investments, savings, and debt.</p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{ padding: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", transition: "all 0.2s ease", position: "relative", overflow: "hidden" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.055)"; e.currentTarget.style.borderColor = `rgba(${kpi.rgb},0.3)`; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "70px", height: "70px", borderRadius: "50%", background: `radial-gradient(circle, rgba(${kpi.rgb},0.12) 0%, transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ fontSize: "16px", marginBottom: "7px" }}>{kpi.icon}</div>
            <div style={{ fontSize: "10px", color: "#475569", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "5px" }}>{kpi.label.toUpperCase()}</div>
            <div style={{ fontSize: "19px", fontWeight: 800, color: kpi.color, letterSpacing: "-0.02em", marginBottom: "3px" }}>{kpi.value}</div>
            <div style={{ fontSize: "10px", color: "#334155" }}>{kpi.sub}</div>
            <div style={{ marginTop: "10px", height: "2px", background: `rgba(${kpi.rgb},0.3)`, borderRadius: "1px" }} />
          </div>
        ))}
      </div>

      {/* Ring Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px", marginBottom: "18px" }}>

        {/* Asset Allocation */}
        {card(<>
          {sectionTitle("ASSET ALLOCATION")}
          <RingChart segments={assetSegments} size={160} thickness={24} label="TOTAL ASSETS" value={fmt(totalAssets, true)} />
          {legend(assetSegments)}
        </>)}

        {/* Debt */}
        {card(<>
          {sectionTitle("DEBT TRACKER")}
          <RingChart segments={debtSegments} size={160} thickness={24} label="TOTAL DEBT" value={fmt(data.totalLiabilities, true)} subtitle={`${fmt(data.paidOffAmount, true)} paid`} />
          {legend(debtSegments)}
          {data.debtByType.length === 0 && (
            <div style={{ fontSize: "11px", color: "#334155", textAlign: "center", marginTop: "8px" }}>
              No debt accounts connected
            </div>
          )}
        </>)}

        {/* Savings */}
        {card(<>
          {sectionTitle("SAVINGS")}
          <RingChart segments={savingsSegments} size={160} thickness={24} label="TOTAL SAVED" value={fmt(totalSavings, true)} />
          {legend(savingsSegments)}
          <div style={{ marginTop: "10px", padding: "8px 10px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "8px" }}>
            <div style={{ fontSize: "10px", color: "#475569", marginBottom: "2px" }}>SAVINGS RATE</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>
              {data.totalIncome > 0 ? `${((totalSavings / data.totalIncome) * 100).toFixed(1)}%` : "—"}
            </div>
          </div>
        </>)}

        {/* Mortgage */}
        {card(<>
          {sectionTitle("MORTGAGE")}
          {mortgageBalance > 0 ? (
            <>
              <RingChart
                segments={[{ label: "Balance", value: mortgageBalance, color: "#6366f1" }]}
                size={160} thickness={24} label="BALANCE" value={fmt(mortgageBalance, true)}
              />
              {legend([{ label: "Mortgage Balance", value: mortgageBalance, color: "#6366f1" }])}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "160px", gap: "10px" }}>
              <div style={{ fontSize: "32px" }}>🏠</div>
              <div style={{ fontSize: "12px", color: "#334155", textAlign: "center" }}>No mortgage connected</div>
              <div style={{ fontSize: "10px", color: "#1e293b", textAlign: "center" }}>Connect your lender to track your mortgage balance</div>
            </div>
          )}
        </>)}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "18px" }}>
        {card(<>
          {sectionTitle("NET WORTH TREND")}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#38bdf8", letterSpacing: "-0.02em" }}>{fmt(data.netWorth, true)}</span>
            <span style={{ fontSize: "10px", color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 8px", borderRadius: "99px", border: "1px solid rgba(34,197,94,0.2)" }}>6 months</span>
          </div>
          <AreaChart data={netWorthTrend} color="#38bdf8" rgb="56,189,248" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            {monthLabels.map((m) => <span key={m} style={{ fontSize: "9px", color: "#334155" }}>{m}</span>)}
          </div>
        </>)}

        {card(<>
          {sectionTitle("INCOME vs EXPENSES")}
          <div style={{ display: "flex", gap: "14px", marginBottom: "10px" }}>
            <div>
              <div style={{ fontSize: "9px", color: "#22c55e", fontWeight: 700 }}>INCOME</div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#22c55e" }}>{fmt(data.totalIncome, true)}</div>
            </div>
            <div>
              <div style={{ fontSize: "9px", color: "#ef4444", fontWeight: 700 }}>EXPENSES</div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#ef4444" }}>{fmt(data.totalExpenses, true)}</div>
            </div>
          </div>
          <AreaChart data={expenseTrend} color="#ef4444" rgb="239,68,68" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            {monthLabels.map((m) => <span key={m} style={{ fontSize: "9px", color: "#334155" }}>{m}</span>)}
          </div>
        </>)}

        {card(<>
          {sectionTitle("MONTHLY SPENDING")}
          <BarChart3D bars={barData} />
        </>)}
      </div>

      {/* Financial Health */}
      {card(
        <div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: "14px" }}>FINANCIAL HEALTH SNAPSHOT</div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {[
              { label: "Cash Ratio",   value: data.totalLiabilities > 0 ? (data.totalCash / data.totalLiabilities).toFixed(2) : "∞", good: true },
              { label: "Net Position", value: netCashFlow >= 0 ? "Positive" : "Negative", good: netCashFlow >= 0 },
              { label: "Debt Load",    value: data.totalLiabilities > 0 ? fmt(data.totalLiabilities, true) : "Clear", good: data.totalLiabilities === 0 },
              { label: "Savings",      value: totalSavings > 0 ? fmt(totalSavings, true) : "None", good: totalSavings > 0 },
              { label: "Tax Status",   value: data.estimatedTax > 0 ? "Estimated" : "Pending", good: data.estimatedTax > 0 },
            ].map((h, i) => (
              <div key={i}>
                <div style={{ fontSize: "9px", color: "#334155", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "4px" }}>{h.label.toUpperCase()}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: h.good ? "#22c55e" : "#ef4444", background: h.good ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${h.good ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, padding: "4px 10px", borderRadius: "6px" }}>{h.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

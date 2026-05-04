"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "../../src/lib/supabase";
import { calcTotalOut } from "../../src/lib/financialCalculations";
import { getCanonicalActivePostedTransactions, getCanonicalAccountBalances, getCanonicalInvestments } from "../../src/lib/canonicalFinancialData";

interface KPIData {
  netWorth: number;
  totalCash: number;
  totalExpenses: number;
  totalInvestments: number;
  accountCount: number;
  lastSynced: string | null;
}

const defaultKPI: KPIData = {
  netWorth: 0, totalCash: 0, totalExpenses: 0,
  totalInvestments: 0, accountCount: 0, lastSynced: null,
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

export default function DashboardHome() {
  const supabase = useMemo(() => createClient(), []);
  const [kpi, setKpi] = useState<KPIData>(defaultKPI);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Use canonical sources for all financial data - no stale snapshots
        const [balances, investments, postedTransactions] = await Promise.all([
          getCanonicalAccountBalances(supabase, user.id),
          getCanonicalInvestments(supabase, user.id),
          getCanonicalActivePostedTransactions(supabase, user.id),
        ]);

        const totalExpenses = calcTotalOut(postedTransactions);

        // Log investment data status for production observability
        if (investments.warnings.length > 0) {
          console.warn("[Investments]", investments.dataStatus, investments.warnings);
        }

        // Net Worth must use the same investment total as the Investments card
        // balances.netWorth uses account-based investments which may differ from position-based
        const canonicalNetWorth = balances.bankCash + investments.totalInvestmentValue - balances.liabilities;

        setKpi({
          netWorth: canonicalNetWorth,
          totalCash: balances.bankCash,
          totalExpenses,
          totalInvestments: investments.totalInvestmentValue,
          accountCount: balances.accounts.length,
          lastSynced: new Date().toISOString(),
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const cards = [
    { label: "Net Worth", value: fmt(kpi.netWorth), sub: "Total assets minus liabilities", color: "#38bdf8", rgb: "56,189,248" },
    { label: "Total Cash", value: fmt(kpi.totalCash), sub: `${kpi.accountCount} connected account${kpi.accountCount !== 1 ? "s" : ""}`, color: "#22c55e", rgb: "34,197,94" },
    { label: "Expenses", value: fmt(kpi.totalExpenses), sub: "Total debit transactions", color: "#ef4444", rgb: "239,68,68" },
    { label: "Investments", value: fmt(kpi.totalInvestments), sub: "Portfolio value", color: "#a855f7", rgb: "168,85,247" },
  ];

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Page header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: 0, letterSpacing: "-0.02em" }}>
              {greeting}
            </h1>
            <p style={{ color: "#475569", marginTop: "4px", fontSize: "13.5px" }}>
              {kpi.lastSynced
                ? `Last synced ${new Date(kpi.lastSynced).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
                : "Connect a bank account to get started"}
            </p>
          </div>
          <div style={{
            padding: "8px 16px",
            background: "rgba(37,99,235,0.1)",
            border: "1px solid rgba(37,99,235,0.2)",
            borderRadius: "8px",
            fontSize: "12px", color: "#38bdf8", fontWeight: 600, letterSpacing: "0.03em",
          }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        {loading
          ? [...Array(4)].map((_, i) => (
              <div key={i} style={{
                height: "120px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
              }} />
            ))
          : cards.map((card, i) => (
              <div
                key={i}
                style={{
                  padding: "22px",
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "12px",
                  backdropFilter: "blur(12px)",
                  transition: "all 0.2s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.055)";
                  e.currentTarget.style.borderColor = `rgba(${card.rgb},0.25)`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.035)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ fontSize: "11px", color: "#475569", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>
                  {card.label}
                </div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#f8fafc", marginBottom: "6px", letterSpacing: "-0.02em" }}>
                  {card.value}
                </div>
                <div style={{ fontSize: "11.5px", color: "#334155" }}>{card.sub}</div>
                <div style={{ marginTop: "14px", height: "2px", background: `rgba(${card.rgb},0.3)`, borderRadius: "1px" }} />
              </div>
            ))
        }
      </div>

      {/* Quick actions */}
      <div>
        <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "14px" }}>
          QUICK ACTIONS
        </h2>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {[
            { label: "Connect Bank", icon: "⇄", path: "/dashboard/connections", primary: true },
            { label: "View Transactions", icon: "≡", path: "/dashboard/transactions", primary: false },
            { label: "Tax Center", icon: "⚡", path: "/dashboard/tax", primary: false },
            { label: "Ask LevelUP", icon: "◉", path: "/dashboard/levelup", primary: false },
          ].map((action) => (
            <a
              key={action.label}
              href={action.path}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: action.primary ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${action.primary ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: "8px",
                fontSize: "13.5px", fontWeight: 500,
                color: action.primary ? "#38bdf8" : "#64748b",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = action.primary ? "rgba(37,99,235,0.22)" : "rgba(255,255,255,0.07)";
                e.currentTarget.style.color = action.primary ? "#38bdf8" : "#94a3b8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = action.primary ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = action.primary ? "#38bdf8" : "#64748b";
              }}
            >
              <span>{action.icon}</span>
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { getMarketStatus } from "../../../src/lib/marketHours";
import { createClient } from "../../../src/lib/supabase";
import { getCanonicalInvestments } from "../../../src/lib/canonicalFinancialData";
import type { InvestmentDataStatus } from "../../../src/lib/canonicalFinancialData";

interface Position {
  financial_account_id: string | null;
  id: string;
  asset_symbol: string;
  asset_name: string;
  asset_type: string;
  calculated_quantity: number;
  last_price: number;
  last_valuation: number;
  total_cost_basis: number;
  unrealized_gain: number;
  average_cost_basis: number;
  is_short: boolean;
  last_price_updated_at: string | null;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n ?? 0);
}
function fmtCompact(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n ?? 0);
}
function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

const ASSET_COLORS: Record<string, { color: string; rgb: string; icon: string }> = {
  "equity":     { color: "#38bdf8", rgb: "56,189,248",  icon: "📈" },
  "etf":        { color: "#22c55e", rgb: "34,197,94",   icon: "🏦" },
  "future":     { color: "#a855f7", rgb: "168,85,247",  icon: "📊" },
  "bond":       { color: "#f59e0b", rgb: "245,158,11",  icon: "🏛️" },
  "option":     { color: "#f97316", rgb: "249,115,22",  icon: "⚡" },
  "crypto":     { color: "#ec4899", rgb: "236,72,153",  icon: "₿" },
  "cash":       { color: "#64748b", rgb: "100,116,139", icon: "💵" },
  "other":      { color: "#6366f1", rgb: "99,102,241",  icon: "💼" },
};

const ASSET_TYPE_OPTIONS = [
  { value: "equity",      label: "Stock / Equity" },
  { value: "etf",         label: "ETF" },
  { value: "future",      label: "Future" },
  { value: "bond",        label: "Bond" },
  { value: "option",      label: "Option" },
  { value: "crypto",      label: "Crypto" },
  { value: "other",       label: "Other" },
];

function getAssetStyle(type: string) {
  return ASSET_COLORS[type.toLowerCase()] ?? ASSET_COLORS["other"];
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
  width: "100%", maxWidth: "440px",
  background: "rgba(8,11,18,0.98)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "20px", padding: "28px",
  boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
  maxHeight: "90vh", overflowY: "auto",
};

const MOCK_TICKERS = [
  { symbol: "SPY",  price: "584.21", change: "+1.24%" },
  { symbol: "QQQ",  price: "482.10", change: "+0.87%" },
  { symbol: "AAPL", price: "211.45", change: "+2.10%" },
  { symbol: "MSFT", price: "419.80", change: "-0.34%" },
  { symbol: "NVDA", price: "897.22", change: "+3.45%" },
  { symbol: "TSLA", price: "178.90", change: "-1.22%" },
  { symbol: "AMZN", price: "198.64", change: "+0.56%" },
  { symbol: "GOOGL",price: "172.40", change: "+0.98%" },
  { symbol: "META", price: "521.30", change: "+1.67%" },
  { symbol: "BTC",  price: "67,420", change: "+2.89%" },
];

function TickerBar() {
  const items = [...MOCK_TICKERS, ...MOCK_TICKERS];
  return (
    <div style={{ overflow: "hidden", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "10px 0", marginBottom: "24px" }}>
      <div style={{ display: "flex", gap: "32px", animation: "ticker 30s linear infinite", width: "max-content" }}>
        {items.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.05em" }}>{t.symbol}</span>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#f8fafc" }}>${t.price}</span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: t.change.startsWith("+") ? "#22c55e" : "#ef4444" }}>{t.change}</span>
            <span style={{ fontSize: "10px", color: "#1e293b" }}>|</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

function CandlestickChart({ width = 600, height = 180 }: { width?: number; height?: number }) {
  const candles = useMemo(() => {
    const data = [];
    let price = 480;
    for (let i = 0; i < 40; i++) {
      const open = price;
      const change = (Math.random() - 0.48) * 12;
      const close = Math.max(400, Math.min(580, open + change));
      const high = Math.max(open, close) + Math.random() * 6;
      const low = Math.min(open, close) - Math.random() * 6;
      data.push({ open, close, high, low });
      price = close;
    }
    return data;
  }, []);

  const minP = Math.min(...candles.map((c) => c.low));
  const maxP = Math.max(...candles.map((c) => c.high));
  const range = maxP - minP;
  const pad = 10;
  const chartH = height - pad * 2;
  const candleW = (width - 20) / candles.length;
  const toY = (p: number) => pad + chartH - ((p - minP) / range) * chartH;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ filter: "drop-shadow(0 4px 20px rgba(56,189,248,0.15))" }}>
      {[0.25, 0.5, 0.75].map((t, i) => (
        <line key={i} x1="0" y1={pad + chartH * (1 - t)} x2={width} y2={pad + chartH * (1 - t)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      {candles.map((c, i) => {
        const x = 10 + i * candleW + candleW / 2;
        const isGreen = c.close >= c.open;
        const color = isGreen ? "#22c55e" : "#ef4444";
        const bodyTop = toY(Math.max(c.open, c.close));
        const bodyBot = toY(Math.min(c.open, c.close));
        const bodyH = Math.max(1, bodyBot - bodyTop);
        return (
          <g key={i}>
            <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={color} strokeWidth="1" opacity="0.6" />
            <rect x={x - candleW * 0.3} y={bodyTop} width={candleW * 0.6} height={bodyH} fill={color} opacity="0.85" rx="1" style={{ filter: `drop-shadow(0 0 3px ${color}88)` }} />
          </g>
        );
      })}
      <defs>
        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(56,189,248,0.08)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} fill="url(#chartGlow)" />
    </svg>
  );
}

function AllocationRing({ segments }: { segments: { label: string; value: number; color: string; rgb: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const size = 180; const strokeW = 22;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2; const cy = size / 2;
  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = total > 0 ? seg.value / total : 0;
    const dash = pct * circ;
    const arc = { ...seg, dash, offset, pct };
    offset += dash + 2;
    return arc;
  });
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.4))" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeW} />
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={arc.color} strokeWidth={strokeW}
            strokeDasharray={`${arc.dash - 2} ${circ - arc.dash + 2}`}
            strokeDashoffset={-arc.offset} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px rgba(${arc.rgb},0.6))` }}
          />
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "11px", color: "#475569", fontWeight: 700, letterSpacing: "0.06em" }}>PORTFOLIO</div>
        <div style={{ fontSize: "10px", color: "#334155" }}>{segments.length} assets</div>
      </div>
    </div>
  );
}

function PositionCard({ pos, onDelete }: { pos: Position; onDelete: (id: string) => void }) {
  const style = getAssetStyle(pos.asset_type);
  const gainPct = pos.total_cost_basis > 0 ? (pos.unrealized_gain / pos.total_cost_basis) * 100 : 0;
  const isGain = pos.unrealized_gain >= 0;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "20px",
        background: hovered ? `rgba(${style.rgb},0.07)` : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? `rgba(${style.rgb},0.3)` : `rgba(${style.rgb},0.12)`}`,
        borderRadius: "18px", transition: "all 0.2s ease",
        transform: hovered ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)",
        boxShadow: hovered ? `0 16px 40px rgba(${style.rgb},0.15)` : "none",
        position: "relative", overflow: "hidden", cursor: "default",
      }}
    >
      <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: `radial-gradient(circle, rgba(${style.rgb},0.12) 0%, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: `linear-gradient(145deg, rgba(${style.rgb},0.3), rgba(${style.rgb},0.6))`, border: `1px solid rgba(${style.rgb},0.4)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 24px rgba(${style.rgb},0.3), inset 0 1px 0 rgba(255,255,255,0.2)`, fontSize: "22px" }}>
            {style.icon}
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>{pos.asset_symbol}</div>
            <div style={{ fontSize: "11px", color: "#475569", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pos.asset_name}</div>
            <div style={{ fontSize: "10px", padding: "2px 7px", background: `rgba(${style.rgb},0.15)`, border: `1px solid rgba(${style.rgb},0.25)`, borderRadius: "99px", color: style.color, display: "inline-block", marginTop: "4px", textTransform: "capitalize" }}>
              {pos.asset_type.replace("_", " ")}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#f8fafc" }}>{fmt(pos.last_valuation)}</div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: isGain ? "#22c55e" : "#ef4444" }}>{isGain ? "▲" : "▼"} {fmt(Math.abs(pos.unrealized_gain))}</div>
          <div style={{ fontSize: "11px", color: isGain ? "#22c55e" : "#ef4444" }}>{fmtPct(gainPct)}</div>
        </div>
      </div>

      {/* Mini sparkline */}
      <div style={{ height: "40px", marginBottom: "14px", borderRadius: "8px", overflow: "hidden" }}>
        <svg width="100%" height="40" viewBox="0 0 200 40">
          <defs>
            <linearGradient id={`spark-${pos.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isGain ? "#22c55e" : "#ef4444"} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isGain ? "#22c55e" : "#ef4444"} stopOpacity="0" />
            </linearGradient>
          </defs>
          {(() => {
            const pts = Array.from({ length: 20 }, (_, i) => {
              const x = (i / 19) * 200;
              const y = 20 + (Math.random() - (isGain ? 0.45 : 0.55)) * 18;
              return `${x},${Math.max(2, Math.min(38, y))}`;
            });
            const path = `M${pts.join(" L")}`;
            const area = `M0,40 L${pts.join(" L")} L200,40 Z`;
            return (
              <>
                <path d={area} fill={`url(#spark-${pos.id})`} />
                <path d={path} fill="none" stroke={isGain ? "#22c55e" : "#ef4444"} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 4px ${isGain ? "#22c55e" : "#ef4444"}88)` }} />
              </>
            );
          })()}
        </svg>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "10px" }}>
        {[
          { label: "Quantity",   value: Number(pos.calculated_quantity).toLocaleString("en-US", { maximumFractionDigits: 4 }) },
          { label: "Avg Cost",   value: fmt(pos.average_cost_basis) },
          { label: "Last Price", value: fmt(pos.last_price) },
        ].map((stat, i) => (
          <div key={i} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}>
            <div style={{ fontSize: "8px", color: "#334155", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "3px" }}>{stat.label.toUpperCase()}</div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Delete */}
      <button onClick={() => onDelete(pos.id)}
        style={{ width: "100%", padding: "7px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: "8px", color: "#475569", fontSize: "11px", cursor: "pointer", transition: "all 0.15s ease" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.05)"; e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.12)"; }}
      >
        Remove Position
      </button>
    </div>
  );
}

export default function InvestmentsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());
  useEffect(() => {
    const interval = setInterval(() => setMarketStatus(getMarketStatus()), 60000);
    return () => clearInterval(interval);
  }, []);
  const [filterType, setFilterType] = useState("all");

  // Add position modal
  const [showAdd, setShowAdd] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("equity");
  const [newQty, setNewQty] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCost, setNewCost] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addMsg, setAddMsg] = useState<string | null>(null);

  const [investmentDataStatus, setInvestmentDataStatus] = useState<InvestmentDataStatus>("no_brokerage_connection");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use the same canonical investment source as Home and Financial Summary pages
    // This ensures all pages show consistent investment data
    const canonical = await getCanonicalInvestments(supabase, user.id);

    // Log warnings for production observability
    if (canonical.warnings.length > 0) {
      console.warn("[Investments]", canonical.dataStatus, canonical.warnings);
    }
    setInvestmentDataStatus(canonical.dataStatus);

    // The canonical function returns positions already filtered to investment accounts only.
    // We need the full position fields for display, so re-fetch using the canonical account filter.
    const investmentAccountIds = [...new Set(canonical.positions.map((p: any) => p.financial_account_id))];
    if (investmentAccountIds.length > 0) {
      const { data } = await supabase
        .from("positions")
        .select("id, financial_account_id, asset_symbol, asset_name, asset_type, calculated_quantity, last_price, last_valuation, total_cost_basis, unrealized_gain, average_cost_basis, is_short, last_price_updated_at")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .in("financial_account_id", investmentAccountIds)
        .order("last_valuation", { ascending: false, nullsFirst: false });
      setPositions(data ?? []);
    } else {
      setPositions([]);
    }
    setLoading(false);
  };

  const deletePosition = async (id: string) => {
    if (!confirm("Remove this position from your portfolio?")) return;
    await supabase.from("positions").update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    await loadData();
  };

  const addPosition = async () => {
    if (!newSymbol.trim() || !newQty || !newPrice) return;
    setAddSaving(true); setAddMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: acct } = await supabase.from("financial_accounts")
      .select("id").eq("user_id", user.id).eq("is_active", true).is("deleted_at", null).eq("account_type", "investment").limit(1).maybeSingle();
    if (!acct) { setAddMsg("No investment account found. Please connect a brokerage first."); setAddSaving(false); return; }

    const qty = Number(newQty);
    const price = Number(newPrice);
    const costBasis = newCost ? Number(newCost) : price;
    const valuation = price * qty;
    const totalCost = costBasis * qty;
    const unrealizedGain = valuation - totalCost;

    const { error } = await supabase.from("positions").insert({
      user_id: user.id,
      financial_account_id: acct.id,
      asset_symbol: newSymbol.toUpperCase().trim(),
      asset_name: newName.trim() || newSymbol.toUpperCase().trim(),
      asset_type: newType,
      calculated_quantity: qty,
      average_cost_basis: costBasis,
      total_cost_basis: totalCost,
      last_price: price,
      last_valuation: valuation,
      unrealized_gain: unrealizedGain,
      currency: "USD",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setAddMsg("Failed to add position. Please try again.");
    } else {
      setNewSymbol(""); setNewName(""); setNewType("stock");
      setNewQty(""); setNewPrice(""); setNewCost("");
      setShowAdd(false); setAddMsg(null);
      await loadData();
    }
    setAddSaving(false);
  };

  const nonCash = positions.filter((p) => p.asset_type !== "cash");
  const cash = positions.filter((p) => p.asset_type === "cash");
  const filtered = filterType === "all" ? nonCash : nonCash.filter((p) => p.asset_type === filterType);

  const totalValue = positions.reduce((s, p) => s + Number(p.last_valuation ?? 0), 0);
  const totalCost = nonCash.reduce((s, p) => s + Number(p.total_cost_basis ?? 0), 0);
  const totalGain = nonCash.reduce((s, p) => s + Number(p.unrealized_gain ?? 0), 0);
  const totalCashValue = cash.reduce((s, p) => s + Number(p.last_valuation ?? 0), 0);
  const gainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const assetTypes = [...new Set(nonCash.map((p) => p.asset_type))];

  const byType = Object.entries(
    positions.reduce((acc, p) => {
      const key = p.asset_type;
      acc[key] = (acc[key] ?? 0) + Number(p.last_valuation ?? 0);
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, value]) => ({ label: type, value, ...getAssetStyle(type) }))
    .sort((a, b) => b.value - a.value);

  const qty = Number(newQty);
  const price = Number(newPrice);
  const costBasis = newCost ? Number(newCost) : price;
  const previewValuation = qty * price;
  const previewGain = previewValuation - qty * costBasis;

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Investment Portfolio</h1>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Real-time positions, performance tracking, and portfolio analytics.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={() => setShowAdd(true)}
            style={{ padding: "10px 18px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "9px", color: "#22c55e", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            + Add Position
          </button>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
            <div style={{ padding: "6px 12px", background: marketStatus.bg, border: `1px solid ${marketStatus.border}`, borderRadius: "99px", fontSize: "11px", color: marketStatus.color, fontWeight: 600 }}>● {marketStatus.label}</div>
            <div style={{ fontSize: "9px", color: "#334155" }}>{marketStatus.detail}</div>
          </div>
        </div>
      </div>
      <TickerBar />

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Portfolio Value", value: fmtCompact(totalValue),    color: "#38bdf8", rgb: "56,189,248",   sub: `${positions.length} positions` },
          { label: "Total Invested",         value: fmtCompact(totalCost),    color: "#a855f7", rgb: "168,85,247",   sub: "Cost basis" },
          { label: "Unrealized Gain/Loss",   value: fmtCompact(totalGain),    color: totalGain >= 0 ? "#22c55e" : "#ef4444", rgb: totalGain >= 0 ? "34,197,94" : "239,68,68", sub: fmtPct(gainPct) },
          { label: "Cash & Equivalents",     value: fmtCompact(totalCashValue), color: "#64748b", rgb: "100,116,139", sub: `${cash.length} accounts` },
          { label: "Positions",              value: String(nonCash.length),    color: "#f59e0b", rgb: "245,158,11",  sub: `${assetTypes.length} asset types` },
        ].map((k, i) => (
          <div key={i} style={{ padding: "16px 18px", background: "rgba(255,255,255,0.03)", border: `1px solid rgba(${k.rgb},0.15)`, borderRadius: "14px", position: "relative", overflow: "hidden", boxShadow: `0 4px 24px rgba(${k.rgb},0.06), inset 0 1px 0 rgba(255,255,255,0.04)` }}>
            <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: `radial-gradient(circle, rgba(${k.rgb},0.15) 0%, transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ fontSize: "9px", color: "#475569", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "6px" }}>{k.label}</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: k.color, letterSpacing: "-0.02em" }}>{k.value}</div>
            <div style={{ fontSize: "10px", color: "#334155", marginTop: "3px" }}>{k.sub}</div>
            <div style={{ marginTop: "10px", height: "2px", background: `rgba(${k.rgb},0.3)`, borderRadius: "1px" }} />
          </div>
        ))}
      </div>

      {/* Chart + Ring */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", marginBottom: "24px" }}>
        <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, rgba(56,189,248,0.04) 0%, transparent 60%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>Market Overview</div>
              <div style={{ fontSize: "10px", color: "#334155" }}>S&P 500 — Live simulation</div>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["1D", "1W", "1M", "3M", "1Y"].map((t) => (
                <button key={t} style={{ padding: "4px 10px", background: t === "1M" ? "rgba(56,189,248,0.15)" : "transparent", border: `1px solid ${t === "1M" ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: "6px", color: t === "1M" ? "#38bdf8" : "#475569", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>{t}</button>
              ))}
            </div>
          </div>
          <CandlestickChart width={620} height={180} />
        </div>

        <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc", marginBottom: "16px" }}>Asset Allocation</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <AllocationRing segments={byType.length > 0 ? byType : [{ label: "Cash", value: 1, color: "#64748b", rgb: "100,116,139" }]} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {byType.map((seg, i) => {
              const total = byType.reduce((s, x) => s + x.value, 0);
              const pct = total > 0 ? (seg.value / total) * 100 : 0;
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: seg.color, boxShadow: `0 0 6px ${seg.color}88` }} />
                    <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "capitalize" }}>{seg.label.replace("_", " ")}</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", color: "#475569" }}>{pct.toFixed(1)}%</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: seg.color }}>{fmtCompact(seg.value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Positions */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em" }}>POSITIONS ({filtered.length})</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button onClick={() => setFilterType("all")}
              style={{ padding: "5px 12px", background: filterType === "all" ? "rgba(56,189,248,0.15)" : "transparent", border: `1px solid ${filterType === "all" ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: "99px", color: filterType === "all" ? "#38bdf8" : "#475569", fontSize: "11px", fontWeight: filterType === "all" ? 700 : 400, cursor: "pointer" }}>
              All
            </button>
            {assetTypes.map((type) => {
              const s = getAssetStyle(type);
              return (
                <button key={type} onClick={() => setFilterType(filterType === type ? "all" : type)}
                  style={{ padding: "5px 12px", background: filterType === type ? `rgba(${s.rgb},0.15)` : "transparent", border: `1px solid ${filterType === type ? `rgba(${s.rgb},0.3)` : "rgba(255,255,255,0.07)"}`, borderRadius: "99px", color: filterType === type ? s.color : "#475569", fontSize: "11px", fontWeight: filterType === type ? 700 : 400, cursor: "pointer", textTransform: "capitalize" }}>
                  {s.icon} {type.replace("_", " ")}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>Loading positions...</div>
        ) : nonCash.length === 0 ? (
          <div style={{ padding: "56px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📈</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>No Investment Positions Yet</div>
            <div style={{ fontSize: "13px", color: "#334155", marginBottom: "20px", maxWidth: "400px", margin: "0 auto 20px" }}>
              Connect a brokerage or add positions manually to start tracking your portfolio.
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button onClick={() => setShowAdd(true)}
                style={{ padding: "11px 20px", background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                + Add Position Manually
              </button>
              <a href="/dashboard/connections"
                style={{ padding: "11px 20px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
                Connect Brokerage →
              </a>
            </div>
            {cash.length > 0 && (
              <div style={{ marginTop: "32px", textAlign: "left" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: "12px" }}>CASH POSITIONS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                  {cash.map((pos) => (
                    <div key={pos.id} style={{ padding: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(100,116,139,0.2)", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#94a3b8" }}>💵 {pos.asset_symbol}</div>
                        <div style={{ fontSize: "10px", color: "#334155" }}>{pos.asset_name}</div>
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#64748b" }}>{fmt(pos.last_valuation)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {filtered.map((pos) => <PositionCard key={pos.id} pos={pos} onDelete={deletePosition} />)}
          </div>
        )}
      </div>

      {/* ── ADD POSITION MODAL ── */}
      {showAdd && (
        <div style={modalOverlay} onClick={() => setShowAdd(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Add Position</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 20px" }}>
              Manually add a stock, ETF, bond, or any other investment to your portfolio.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              <div>
                <label style={labelStyle}>ASSET TYPE</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  {ASSET_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{getAssetStyle(o.value).icon} {o.label}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>TICKER SYMBOL <span style={{ color: "#ef4444" }}>*</span></label>
                  <input value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} placeholder="e.g. AAPL" style={{ ...inputStyle, textTransform: "uppercase" }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(56,189,248,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
                <div>
                  <label style={labelStyle}>ASSET NAME</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Apple Inc." style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(56,189,248,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>QUANTITY <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} placeholder="0" style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(56,189,248,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
                <div>
                  <label style={labelStyle}>CURRENT PRICE <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(56,189,248,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>AVERAGE COST BASIS (optional — defaults to current price)</label>
                <input type="number" value={newCost} onChange={(e) => setNewCost(e.target.value)} placeholder="Price you paid per share" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(56,189,248,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              {/* Preview */}
              {newQty && newPrice && (
                <div style={{ padding: "12px", background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: "10px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.08em", marginBottom: "8px" }}>PREVIEW</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {[
                      { label: "Market Value", value: fmt(previewValuation), color: "#38bdf8" },
                      { label: "Total Cost",   value: fmt(qty * costBasis),  color: "#a855f7" },
                      { label: "Unreal. G/L",  value: fmt(previewGain),      color: previewGain >= 0 ? "#22c55e" : "#ef4444" },
                    ].map((s, i) => (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "8px", color: "#334155", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "3px" }}>{s.label}</div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {addMsg && (
                <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", fontSize: "12px", color: "#ef4444" }}>{addMsg}</div>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => { setShowAdd(false); setAddMsg(null); }} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={addPosition} disabled={addSaving || !newSymbol.trim() || !newQty || !newPrice}
                  style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: addSaving || !newSymbol.trim() || !newQty || !newPrice ? "not-allowed" : "pointer", opacity: addSaving || !newSymbol.trim() || !newQty || !newPrice ? 0.7 : 1 }}>
                  {addSaving ? "Adding..." : "Add to Portfolio"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

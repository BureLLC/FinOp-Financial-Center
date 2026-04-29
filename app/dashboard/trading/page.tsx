"use client";

import { useEffect, useMemo, useState } from "react";
import { getMarketStatus } from "../../../src/lib/marketHours";
import { createClient } from "../../../src/lib/supabase";

interface Trade {
  id: string;
  symbol: string;
  asset_type: string;
  trade_type: string;
  direction: string;
  quantity: number;
  entry_price: number;
  exit_price: number | null;
  entry_date: string;
  exit_date: string | null;
  stop_loss: number | null;
  take_profit: number | null;
  realized_pnl: number | null;
  commission: number;
  status: string;
  strategy: string | null;
  timeframe: string | null;
  setup_type: string | null;
  risk_amount: number | null;
  risk_reward_ratio: number | null;
  tax_year: number | null;
  notes: string | null;
  contract_type: string | null;
  option_type: string | null;
  strike_price: number | null;
  expiration_date: string | null;
  premium: number | null;
  lot_size: string | null;
  pip_value: number | null;
  margin_required: number | null;
  contract_multiplier: number | null;
  deleted_at: string | null;
}

interface JournalEntry {
  id: string;
  trade_id: string;
  entry_type: string;
  content: string;
  mood: string | null;
  created_at: string;
  deleted_at: string | null;
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

const ASSET_TYPES = [
  { value: "equity",  label: "Equity / Stock", icon: "📈", color: "#38bdf8", rgb: "56,189,248",  desc: "Stocks — buy/sell shares same day or hold" },
  { value: "future",  label: "Futures",         icon: "⚡", color: "#f97316", rgb: "249,115,22",  desc: "ES, NQ, CL, GC — leveraged contracts" },
  { value: "option",  label: "Options",          icon: "🎯", color: "#a855f7", rgb: "168,85,247",  desc: "Calls & puts — rights to buy/sell" },
  { value: "forex",   label: "Forex",            icon: "💱", color: "#22c55e", rgb: "34,197,94",   desc: "Currency pairs — EUR/USD, GBP/JPY" },
  { value: "index",   label: "Index",            icon: "🏛️", color: "#f59e0b", rgb: "245,158,11", desc: "SPX, NDX, DJI index instruments" },
  { value: "crypto",  label: "Crypto",           icon: "₿",  color: "#ec4899", rgb: "236,72,153",  desc: "BTC, ETH — 24/7 digital assets" },
];

const TRADE_TYPES = [
  { value: "day_trade",   label: "Day Trade",   icon: "⚡", desc: "Opened and closed same day" },
  { value: "swing_trade", label: "Swing Trade", icon: "🔄", desc: "Held overnight to weeks" },
  { value: "scalp",       label: "Scalp",       icon: "🎯", desc: "Seconds to minutes" },
];

const TIMEFRAMES = ["1m","5m","15m","30m","1h","4h","1d","1w"];
const SETUP_TYPES = [
  { value: "breakout",       label: "Breakout" },
  { value: "momentum",       label: "Momentum" },
  { value: "reversal",       label: "Reversal" },
  { value: "scalp",          label: "Scalp" },
  { value: "trend_follow",   label: "Trend Follow" },
  { value: "mean_reversion", label: "Mean Reversion" },
  { value: "vwap",           label: "VWAP Play" },
  { value: "gap_fill",       label: "Gap Fill" },
  { value: "other",          label: "Other" },
];

const MOODS = [
  { value: "confident", label: "Confident", emoji: "😎" },
  { value: "neutral",   label: "Neutral",   emoji: "😐" },
  { value: "anxious",   label: "Anxious",   emoji: "😰" },
  { value: "fearful",   label: "Fearful",   emoji: "😨" },
  { value: "greedy",    label: "Greedy",    emoji: "🤑" },
];

const ENTRY_TYPES = [
  { value: "pre_trade",    label: "Pre-Trade Plan",     icon: "📋" },
  { value: "during_trade", label: "During Trade",       icon: "📡" },
  { value: "post_trade",   label: "Post-Trade Review",  icon: "✅" },
  { value: "review",       label: "Weekly Review",      icon: "📊" },
];

const FUTURES_CONTRACTS = ["ES","NQ","RTY","YM","MES","MNQ","MYM","MRTY","CL","GC","SI","NG","ZB","ZN","6E","6J","6B"];
const FOREX_MAJORS = ["EUR/USD","GBP/USD","USD/JPY","USD/CHF","AUD/USD","USD/CAD","NZD/USD","EUR/GBP","EUR/JPY","GBP/JPY"];
const LOT_SIZES = ["Micro (0.01)","Mini (0.1)","Standard (1.0)","2 Lots","5 Lots","10 Lots"];
const CRYPTO_PAIRS = ["BTC/USD","ETH/USD","SOL/USD","BNB/USD","XRP/USD","ADA/USD","DOGE/USD","AVAX/USD"];

const MOCK_TICKERS = [
  { symbol: "ES",     price: "5,842.10", change: "+0.42%" },
  { symbol: "NQ",     price: "20,314.50",change: "+0.67%" },
  { symbol: "EUR/USD",price: "1.0892",   change: "+0.12%" },
  { symbol: "GBP/USD",price: "1.2741",   change: "-0.08%" },
  { symbol: "AAPL",   price: "211.45",   change: "+2.10%" },
  { symbol: "NVDA",   price: "897.22",   change: "+3.45%" },
  { symbol: "BTC",    price: "67,420",   change: "+2.89%" },
  { symbol: "GC",     price: "2,341.80", change: "+0.31%" },
  { symbol: "CL",     price: "78.42",    change: "-0.54%" },
  { symbol: "SPX",    price: "5,840.30", change: "+0.39%" },
];

function getAssetStyle(type: string) {
  return ASSET_TYPES.find((a) => a.value === type) ?? ASSET_TYPES[0];
}

function calcRR(entry: number, stop: number, target: number, direction: string): string | null {
  if (!entry || !stop || !target) return null;
  const risk = direction === "long" ? entry - stop : stop - entry;
  const reward = direction === "long" ? target - entry : entry - target;
  if (risk <= 0) return null;
  return (reward / risk).toFixed(2);
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
  background: "rgba(0,0,0,0.92)", backdropFilter: "blur(10px)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
};

const modalBox: React.CSSProperties = {
  width: "100%", maxWidth: "580px",
  background: "rgba(6,9,16,0.99)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "20px", padding: "28px",
  boxShadow: "0 24px 80px rgba(0,0,0,0.9)",
  maxHeight: "93vh", overflowY: "auto",
};

function TickerBar() {
  const items = [...MOCK_TICKERS, ...MOCK_TICKERS];
  return (
    <div style={{ overflow: "hidden", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "9px 0", marginBottom: "20px" }}>
      <div style={{ display: "flex", gap: "28px", animation: "ticker 28s linear infinite", width: "max-content" }}>
        {items.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px", flexShrink: 0 }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", letterSpacing: "0.05em" }}>{t.symbol}</span>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#f8fafc" }}>{t.price}</span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: t.change.startsWith("+") ? "#22c55e" : "#ef4444", padding: "1px 5px", background: t.change.startsWith("+") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", borderRadius: "4px" }}>{t.change}</span>
            <span style={{ fontSize: "10px", color: "#1e293b" }}>│</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

export default function TradingPage() {
  const supabase = useMemo(() => createClient(), []);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());
  useEffect(() => {
    const interval = setInterval(() => setMarketStatus(getMarketStatus()), 60000);
    return () => clearInterval(interval);
  }, []);
  const [activeTab, setActiveTab] = useState<"open"|"closed"|"journal">("open");
  const [filterAsset, setFilterAsset] = useState("all");

  // Add trade
  const [showAdd, setShowAdd] = useState(false);
  const [addAssetType, setAddAssetType] = useState("equity");

  // Shared fields
  const [newSymbol, setNewSymbol] = useState("");
  const [newTradeType, setNewTradeType] = useState("day_trade");
  const [newDirection, setNewDirection] = useState("long");
  const [newQty, setNewQty] = useState("");
  const [newEntryPrice, setNewEntryPrice] = useState("");
  const [newEntryDate, setNewEntryDate] = useState(new Date().toISOString().slice(0,16));
  const [newStopLoss, setNewStopLoss] = useState("");
  const [newTakeProfit, setNewTakeProfit] = useState("");
  const [newRiskAmount, setNewRiskAmount] = useState("");
  const [newTimeframe, setNewTimeframe] = useState("1h");
  const [newSetupType, setNewSetupType] = useState("breakout");
  const [newStrategy, setNewStrategy] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Futures fields
  const [newContractType, setNewContractType] = useState("E-mini");
  const [newMarginRequired, setNewMarginRequired] = useState("");
  const [newContractMultiplier, setNewContractMultiplier] = useState("50");

  // Options fields
  const [newOptionType, setNewOptionType] = useState("call");
  const [newStrikePrice, setNewStrikePrice] = useState("");
  const [newExpiration, setNewExpiration] = useState("");
  const [newPremium, setNewPremium] = useState("");

  // Forex fields
  const [newLotSize, setNewLotSize] = useState("Mini (0.1)");
  const [newPipValue, setNewPipValue] = useState("1.00");

  const [addSaving, setAddSaving] = useState(false);
  const [addMsg, setAddMsg] = useState<string|null>(null);

  // Close trade
  const [showClose, setShowClose] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade|null>(null);
  const [closeExitPrice, setCloseExitPrice] = useState("");
  const [closeExitDate, setCloseExitDate] = useState(new Date().toISOString().slice(0,16));
  const [closeCommission, setCloseCommission] = useState("");
  const [closeSaving, setCloseSaving] = useState(false);
  const [showJournalPrompt, setShowJournalPrompt] = useState(false);
  const [justClosedTradeId, setJustClosedTradeId] = useState<string|null>(null);

  // Journal
  const [showJournal, setShowJournal] = useState(false);
  const [journalTradeId, setJournalTradeId] = useState<string|null>(null);
  const [journalContent, setJournalContent] = useState("");
  const [journalEntryType, setJournalEntryType] = useState("post_trade");
  const [journalMood, setJournalMood] = useState("neutral");
  const [journalSaving, setJournalSaving] = useState(false);

  // Edit trade
  const [showEdit, setShowEdit] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [editSymbol, setEditSymbol] = useState("");
  const [editEntryPrice, setEditEntryPrice] = useState("");
  const [editStopLoss, setEditStopLoss] = useState("");
  const [editTakeProfit, setEditTakeProfit] = useState("");
  const [editStrategy, setEditStrategy] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [tradesRes, journalRes] = await Promise.all([
      supabase.from("trades").select("*").eq("user_id", user.id).is("deleted_at", null).order("entry_date", { ascending: false }),
      supabase.from("trade_journal").select("*").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }),
    ]);
    setTrades(tradesRes.data ?? []);
    setJournal(journalRes.data ?? []);
    setLoading(false);
  };

  const openAddModal = (assetType: string) => {
    setAddAssetType(assetType);
    setNewSymbol(""); setNewQty(""); setNewEntryPrice("");
    setNewStopLoss(""); setNewTakeProfit(""); setNewRiskAmount("");
    setNewStrategy(""); setNewNotes(""); setNewPremium("");
    setNewStrikePrice(""); setNewExpiration("");
    setNewDirection("long"); setNewTradeType("day_trade");
    setNewTimeframe("1h"); setNewSetupType("breakout");
    setNewEntryDate(new Date().toISOString().slice(0,16));
    setAddMsg(null);
    setShowAdd(true);
  };

  const addTrade = async () => {
    if (!newSymbol.trim() || !newQty || !newEntryPrice) return;
    setAddSaving(true); setAddMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const entry = Number(newEntryPrice);
    const stop = newStopLoss ? Number(newStopLoss) : null;
    const target = newTakeProfit ? Number(newTakeProfit) : null;
    const rrRatio = stop && target ? Number(calcRR(entry, stop, target, newDirection)) : null;

    const { error } = await supabase.from("trades").insert({
      user_id: user.id,
      symbol: newSymbol.toUpperCase().trim(),
      asset_type: addAssetType,
      trade_type: newTradeType,
      direction: newDirection,
      quantity: Number(newQty),
      entry_price: entry,
      entry_date: new Date(newEntryDate).toISOString(),
      stop_loss: stop,
      take_profit: target,
      risk_amount: newRiskAmount ? Number(newRiskAmount) : null,
      risk_reward_ratio: rrRatio,
      strategy: newStrategy || null,
      timeframe: newTimeframe,
      setup_type: newSetupType,
      notes: newNotes || null,
      status: "open",
      commission: 0,
      tax_year: new Date().getFullYear(),
      // Asset-specific
      contract_type: addAssetType === "future" ? newContractType : null,
      margin_required: addAssetType === "future" && newMarginRequired ? Number(newMarginRequired) : null,
      contract_multiplier: addAssetType === "future" && newContractMultiplier ? Number(newContractMultiplier) : null,
      option_type: addAssetType === "option" ? newOptionType : null,
      strike_price: addAssetType === "option" && newStrikePrice ? Number(newStrikePrice) : null,
      expiration_date: addAssetType === "option" && newExpiration ? newExpiration : null,
      premium: addAssetType === "option" && newPremium ? Number(newPremium) : null,
      lot_size: addAssetType === "forex" ? newLotSize : null,
      pip_value: addAssetType === "forex" && newPipValue ? Number(newPipValue) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setAddMsg("Failed to log trade: " + error.message);
    } else {
      setShowAdd(false); setAddMsg(null);
      await loadData();
    }
    setAddSaving(false);
  };

  const closeTrade = async () => {
    if (!selectedTrade || !closeExitPrice) return;
    setCloseSaving(true);
    const exitPrice = Number(closeExitPrice);
    const commission = closeCommission ? Number(closeCommission) : 0;
    const qty = Number(selectedTrade.quantity);
    const multiplier = Number(selectedTrade.contract_multiplier ?? 1);
    const pnl = selectedTrade.asset_type === "future"
      ? (selectedTrade.direction === "long" ? exitPrice - Number(selectedTrade.entry_price) : Number(selectedTrade.entry_price) - exitPrice) * qty * multiplier - commission
      : selectedTrade.asset_type === "option"
      ? (exitPrice - Number(selectedTrade.premium ?? selectedTrade.entry_price)) * qty * 100 - commission
      : (selectedTrade.direction === "long" ? exitPrice - Number(selectedTrade.entry_price) : Number(selectedTrade.entry_price) - exitPrice) * qty - commission;

    const { data: closedTrade } = await supabase.from("trades").update({
      exit_price: exitPrice,
      exit_date: new Date(closeExitDate).toISOString(),
      realized_pnl: pnl,
      commission: commission,
      status: "closed",
      updated_at: new Date().toISOString(),
    }).eq("id", selectedTrade.id).select("id").single();

    setShowClose(false);
    setCloseExitPrice(""); setCloseCommission("");
    setCloseSaving(false);

    // Prompt for post-trade journal
    if (closedTrade) {
      setJustClosedTradeId(selectedTrade.id);
      setShowJournalPrompt(true);
    }
    setSelectedTrade(null);
    await loadData();
  };

  const deleteTrade = async (id: string) => {
    if (!confirm("Delete this trade and all its journal entries?")) return;
    await supabase.from("trades").update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
    await loadData();
  };

  const openEditTrade = (trade: Trade) => {
    setEditTrade(trade);
    setEditSymbol(trade.symbol);
    setEditEntryPrice(String(trade.entry_price));
    setEditStopLoss(trade.stop_loss ? String(trade.stop_loss) : "");
    setEditTakeProfit(trade.take_profit ? String(trade.take_profit) : "");
    setEditStrategy(trade.strategy ?? "");
    setEditNotes(trade.notes ?? "");
    setEditMsg(null);
    setShowEdit(true);
  };

  const saveEditTrade = async () => {
    if (!editTrade || !editEntryPrice) return;
    setEditSaving(true); setEditMsg(null);
    const { error } = await supabase.from("trades").update({
      symbol: editSymbol.toUpperCase().trim(),
      entry_price: Number(editEntryPrice),
      stop_loss: editStopLoss ? Number(editStopLoss) : null,
      take_profit: editTakeProfit ? Number(editTakeProfit) : null,
      strategy: editStrategy || null,
      notes: editNotes || null,
      updated_at: new Date().toISOString(),
    }).eq("id", editTrade.id);
    if (error) { setEditMsg("Failed to save."); } else { setShowEdit(false); setEditTrade(null); await loadData(); }
    setEditSaving(false);
  };

  const deleteJournalEntry = async (id: string) => {
    if (!confirm("Delete this journal entry?")) return;
    await supabase.from("trade_journal").update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
    await loadData();
  };

  const addJournalEntry = async () => {
    if (!journalContent.trim() || !journalTradeId) return;
    setJournalSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("trade_journal").insert({
      trade_id: journalTradeId,
      user_id: user.id,
      entry_type: journalEntryType,
      content: journalContent,
      mood: journalMood,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setJournalContent(""); setShowJournal(false); setShowJournalPrompt(false);
    setJournalSaving(false);
    await loadData();
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const openTrades = trades.filter((t) => t.status === "open");
  const closedTrades = trades.filter((t) => t.status === "closed");
  const totalPnl = closedTrades.reduce((s, t) => s + Number(t.realized_pnl ?? 0), 0);
  const winners = closedTrades.filter((t) => Number(t.realized_pnl ?? 0) > 0);
  const losers = closedTrades.filter((t) => Number(t.realized_pnl ?? 0) < 0);
  const winRate = closedTrades.length > 0 ? (winners.length / closedTrades.length) * 100 : 0;
  const avgWin = winners.length > 0 ? winners.reduce((s, t) => s + Number(t.realized_pnl ?? 0), 0) / winners.length : 0;
  const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((s, t) => s + Number(t.realized_pnl ?? 0), 0) / losers.length) : 0;
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
  const avgRR = closedTrades.filter((t) => t.risk_reward_ratio).length > 0
    ? closedTrades.filter((t) => t.risk_reward_ratio).reduce((s, t) => s + Number(t.risk_reward_ratio ?? 0), 0) / closedTrades.filter((t) => t.risk_reward_ratio).length
    : 0;

  const displayTrades = activeTab === "open"
    ? (filterAsset === "all" ? openTrades : openTrades.filter((t) => t.asset_type === filterAsset))
    : (filterAsset === "all" ? closedTrades : closedTrades.filter((t) => t.asset_type === filterAsset));

  const getTradeJournal = (tradeId: string) => journal.filter((j) => j.trade_id === tradeId);

  const rr = newStopLoss && newTakeProfit && newEntryPrice
    ? calcRR(Number(newEntryPrice), Number(newStopLoss), Number(newTakeProfit), newDirection)
    : null;

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Trading Dashboard</h1>
          <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Futures · Options · Forex · Equities · Crypto — Track, journal, and manage risk.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => loadData()}
            style={{ padding: "9px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "12px", cursor: "pointer" }}>
            ↺ Refresh
          </button>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
            <div style={{ padding: "6px 12px", background: marketStatus.bg, border: `1px solid ${marketStatus.border}`, borderRadius: "99px", fontSize: "11px", color: marketStatus.color, fontWeight: 600 }}>● {marketStatus.label}</div>
            <div style={{ fontSize: "9px", color: "#334155" }}>{marketStatus.detail}</div>
          </div>
        </div>
      </div>

      <TickerBar />

      {/* Asset type quick-log buttons */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: "10px" }}>LOG TRADE BY ASSET CLASS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
          {ASSET_TYPES.map((a) => (
            <button key={a.value} onClick={() => openAddModal(a.value)}
              style={{ padding: "14px 16px", background: `rgba(${a.rgb},0.06)`, border: `1px solid rgba(${a.rgb},0.2)`, borderRadius: "14px", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease", position: "relative", overflow: "hidden" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(${a.rgb},0.12)`; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px rgba(${a.rgb},0.15)`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `rgba(${a.rgb},0.06)`; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "70px", height: "70px", borderRadius: "50%", background: `radial-gradient(circle, rgba(${a.rgb},0.15) 0%, transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ fontSize: "22px", marginBottom: "6px" }}>{a.icon}</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: a.color, marginBottom: "2px" }}>{a.label}</div>
              <div style={{ fontSize: "10px", color: "#334155", lineHeight: 1.4 }}>{a.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", marginBottom: "20px" }}>
        {[
          { label: "Total P&L",    value: fmtCompact(totalPnl), color: totalPnl >= 0 ? "#22c55e" : "#ef4444", rgb: totalPnl >= 0 ? "34,197,94" : "239,68,68", sub: `${closedTrades.length} closed` },
          { label: "Win Rate",     value: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? "#22c55e" : "#ef4444", rgb: winRate >= 50 ? "34,197,94" : "239,68,68", sub: `${winners.length}W / ${losers.length}L` },
          { label: "Profit Factor",value: profitFactor.toFixed(2), color: profitFactor >= 1.5 ? "#22c55e" : profitFactor >= 1 ? "#f59e0b" : "#ef4444", rgb: "245,158,11", sub: "Win/loss ratio" },
          { label: "Avg Win",      value: fmt(avgWin),  color: "#22c55e", rgb: "34,197,94", sub: "Per winner" },
          { label: "Avg Loss",     value: fmt(-avgLoss), color: "#ef4444", rgb: "239,68,68", sub: "Per loser" },
          { label: "Avg R/R",      value: avgRR > 0 ? `${avgRR.toFixed(2)}:1` : "—", color: avgRR >= 2 ? "#22c55e" : "#f59e0b", rgb: "245,158,11", sub: "Risk/reward" },
          { label: "Open Trades",  value: String(openTrades.length), color: "#38bdf8", rgb: "56,189,248", sub: "Active now" },
        ].map((k, i) => (
          <div key={i} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid rgba(${k.rgb},0.12)`, borderRadius: "12px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-14px", right: "-14px", width: "50px", height: "50px", borderRadius: "50%", background: `radial-gradient(circle, rgba(${k.rgb},0.15) 0%, transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ fontSize: "9px", color: "#475569", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "4px" }}>{k.label}</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: "10px", color: "#334155", marginTop: "2px" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Risk management banner */}
      <div style={{ marginBottom: "20px", padding: "12px 16px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: "10px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: "16px" }}>⚠️</span>
        <div style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.6 }}>
          <strong style={{ color: "#ef4444" }}>Risk Rules:</strong> Max 1-2% account risk per trade · Always set stop loss before entry · Target min 2:1 R/R · Never average down on losers · Day traders must close all futures positions before market close to avoid margin calls
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "4px", marginBottom: "16px", width: "fit-content" }}>
        {[
          { key: "open",    label: `📂 Open (${openTrades.length})` },
          { key: "closed",  label: `✅ Closed (${closedTrades.length})` },
          { key: "journal", label: `📓 Journal (${journal.length})` },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as "open"|"closed"|"journal")}
            style={{ padding: "8px 18px", borderRadius: "9px", border: "none", cursor: "pointer", background: activeTab === tab.key ? "rgba(37,99,235,0.2)" : "transparent", color: activeTab === tab.key ? "#38bdf8" : "#475569", fontSize: "12px", fontWeight: activeTab === tab.key ? 700 : 400, transition: "all 0.15s ease" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Asset filter pills */}
      {activeTab !== "journal" && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
          <button onClick={() => setFilterAsset("all")}
            style={{ padding: "4px 11px", background: filterAsset === "all" ? "rgba(56,189,248,0.15)" : "transparent", border: `1px solid ${filterAsset === "all" ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: "99px", color: filterAsset === "all" ? "#38bdf8" : "#475569", fontSize: "11px", fontWeight: filterAsset === "all" ? 700 : 400, cursor: "pointer" }}>All</button>
          {ASSET_TYPES.map((a) => (
            <button key={a.value} onClick={() => setFilterAsset(filterAsset === a.value ? "all" : a.value)}
              style={{ padding: "4px 11px", background: filterAsset === a.value ? `rgba(${a.rgb},0.15)` : "transparent", border: `1px solid ${filterAsset === a.value ? `rgba(${a.rgb},0.3)` : "rgba(255,255,255,0.07)"}`, borderRadius: "99px", color: filterAsset === a.value ? a.color : "#475569", fontSize: "11px", fontWeight: filterAsset === a.value ? 700 : 400, cursor: "pointer" }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      )}

      {/* ── TRADES LIST ── */}
      {activeTab !== "journal" && (
        loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>Loading trades...</div>
        ) : displayTrades.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>{activeTab === "open" ? "📂" : "✅"}</div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>No {activeTab} trades yet</div>
            <div style={{ fontSize: "12px", color: "#334155", marginBottom: "16px" }}>Use the asset class buttons above to log your first trade.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {displayTrades.map((trade) => {
              const asset = getAssetStyle(trade.asset_type);
              const isLong = trade.direction === "long";
              const pnl = Number(trade.realized_pnl ?? 0);
              const isWin = pnl > 0;
              const tradeJournal = getTradeJournal(trade.id);
              const rrCalc = trade.stop_loss && trade.take_profit
                ? calcRR(Number(trade.entry_price), Number(trade.stop_loss), Number(trade.take_profit), trade.direction)
                : null;

              return (
                <div key={trade.id} style={{ padding: "16px 18px", background: "rgba(255,255,255,0.03)", border: `1px solid rgba(${asset.rgb},0.1)`, borderRadius: "14px", transition: "all 0.15s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(${asset.rgb},0.04)`; e.currentTarget.style.borderColor = `rgba(${asset.rgb},0.2)`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = `rgba(${asset.rgb},0.1)`; }}
                >
                  <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
                    {/* Icon + symbol */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "160px" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "13px", background: `linear-gradient(145deg, rgba(${asset.rgb},0.2), rgba(${asset.rgb},0.45))`, border: `1px solid rgba(${asset.rgb},0.35)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0, boxShadow: `0 4px 14px rgba(${asset.rgb},0.25), inset 0 1px 0 rgba(255,255,255,0.15)` }}>
                        {asset.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#f8fafc" }}>{trade.symbol}</div>
                        <div style={{ display: "flex", gap: "4px", marginTop: "2px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "9px", padding: "1px 6px", background: isLong ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${isLong ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: "99px", color: isLong ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                            {isLong ? "▲ LONG" : "▼ SHORT"}
                          </span>
                          <span style={{ fontSize: "9px", padding: "1px 6px", background: `rgba(${asset.rgb},0.1)`, border: `1px solid rgba(${asset.rgb},0.2)`, borderRadius: "99px", color: asset.color }}>
                            {asset.label}
                          </span>
                          <span style={{ fontSize: "9px", color: "#334155" }}>
                            {TRADE_TYPES.find((t) => t.value === trade.trade_type)?.icon} {trade.trade_type.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price grid */}
                    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: "8px", minWidth: "280px" }}>
                      <div>
                        <div style={{ fontSize: "8px", color: "#334155", fontWeight: 700, letterSpacing: "0.08em" }}>ENTRY</div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>{fmt(trade.entry_price)}</div>
                        <div style={{ fontSize: "9px", color: "#334155" }}>{new Date(trade.entry_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      </div>
                      {trade.exit_price ? (
                        <div>
                          <div style={{ fontSize: "8px", color: "#334155", fontWeight: 700, letterSpacing: "0.08em" }}>EXIT</div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>{fmt(trade.exit_price)}</div>
                          <div style={{ fontSize: "9px", color: "#334155" }}>{trade.exit_date ? new Date(trade.exit_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: "8px", color: "#334155", fontWeight: 700, letterSpacing: "0.08em" }}>STATUS</div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#22c55e" }}>● Open</div>
                        </div>
                      )}
                      {trade.stop_loss && (
                        <div>
                          <div style={{ fontSize: "8px", color: "#ef4444", fontWeight: 700, letterSpacing: "0.08em" }}>STOP</div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#ef4444" }}>{fmt(trade.stop_loss)}</div>
                          {trade.risk_amount && <div style={{ fontSize: "9px", color: "#334155" }}>{fmt(trade.risk_amount)} risk</div>}
                        </div>
                      )}
                      {trade.take_profit && (
                        <div>
                          <div style={{ fontSize: "8px", color: "#22c55e", fontWeight: 700, letterSpacing: "0.08em" }}>TARGET</div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>{fmt(trade.take_profit)}</div>
                          {rrCalc && <div style={{ fontSize: "9px", color: "#22c55e" }}>{rrCalc}:1 R/R</div>}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: "8px", color: "#334155", fontWeight: 700, letterSpacing: "0.08em" }}>QTY</div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#94a3b8" }}>{Number(trade.quantity).toLocaleString()}</div>
                        {trade.timeframe && <div style={{ fontSize: "9px", color: "#334155" }}>{trade.timeframe}</div>}
                      </div>
                      {/* Asset-specific extra fields */}
                      {trade.asset_type === "future" && trade.contract_multiplier && (
                        <div>
                          <div style={{ fontSize: "8px", color: "#f97316", fontWeight: 700, letterSpacing: "0.08em" }}>MULTIPLIER</div>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#f97316" }}>×{trade.contract_multiplier}</div>
                          {trade.margin_required && <div style={{ fontSize: "9px", color: "#334155" }}>Margin: {fmt(trade.margin_required)}</div>}
                        </div>
                      )}
                      {trade.asset_type === "option" && trade.option_type && (
                        <div>
                          <div style={{ fontSize: "8px", color: "#a855f7", fontWeight: 700, letterSpacing: "0.08em" }}>OPTION</div>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#a855f7" }}>{trade.option_type.toUpperCase()}</div>
                          {trade.strike_price && <div style={{ fontSize: "9px", color: "#334155" }}>Strike: {fmt(trade.strike_price)}</div>}
                        </div>
                      )}
                      {trade.asset_type === "forex" && trade.lot_size && (
                        <div>
                          <div style={{ fontSize: "8px", color: "#22c55e", fontWeight: 700, letterSpacing: "0.08em" }}>LOT</div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#22c55e" }}>{trade.lot_size}</div>
                          {trade.pip_value && <div style={{ fontSize: "9px", color: "#334155" }}>Pip: ${trade.pip_value}</div>}
                        </div>
                      )}
                    </div>

                    {/* P&L */}
                    <div style={{ textAlign: "right", minWidth: "90px" }}>
                      {trade.status === "closed" ? (
                        <>
                          <div style={{ fontSize: "18px", fontWeight: 800, color: isWin ? "#22c55e" : "#ef4444" }}>{fmt(pnl)}</div>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: isWin ? "#22c55e" : "#ef4444", padding: "1px 8px", background: isWin ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", borderRadius: "99px", display: "inline-block", marginTop: "2px" }}>{isWin ? "WIN" : "LOSS"}</div>
                          {trade.commission > 0 && <div style={{ fontSize: "9px", color: "#334155", marginTop: "2px" }}>Fees: {fmt(trade.commission)}</div>}
                        </>
                      ) : <div style={{ fontSize: "13px", color: "#475569" }}>Open</div>}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", flexShrink: 0 }}>
                      {trade.status === "open" && (
                        <button onClick={() => { setSelectedTrade(trade); setCloseExitDate(new Date().toISOString().slice(0,16)); setShowClose(true); }}
                          style={{ padding: "5px 11px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "7px", color: "#22c55e", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                          Close
                        </button>
                      )}
                      <button onClick={() => { setJournalTradeId(trade.id); setJournalEntryType(trade.status === "open" ? "pre_trade" : "post_trade"); setJournalContent(""); setShowJournal(true); }}
                        style={{ padding: "5px 11px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: "7px", color: "#a855f7", fontSize: "11px", cursor: "pointer" }}>
                        📓 {tradeJournal.length > 0 ? `(${tradeJournal.length})` : "Journal"}
                      </button>
                      <button onClick={() => openEditTrade(trade)}
                        style={{ padding: "5px 11px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "7px", color: "#38bdf8", fontSize: "11px", cursor: "pointer" }}>
                        Edit
                      </button>
                      <button onClick={() => deleteTrade(trade.id)}
                        style={{ padding: "5px 11px", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "7px", color: "#334155", fontSize: "11px", cursor: "pointer" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#334155"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Tags row */}
                  {(trade.setup_type || trade.strategy || trade.notes) && (
                    <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                      {trade.setup_type && <span style={{ fontSize: "9px", padding: "2px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "99px", color: "#475569" }}>📐 {trade.setup_type.replace("_", " ")}</span>}
                      {trade.strategy && <span style={{ fontSize: "9px", padding: "2px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "99px", color: "#475569" }}>🎯 {trade.strategy}</span>}
                      {trade.notes && <span style={{ fontSize: "10px", color: "#1e293b", fontStyle: "italic" }}>{trade.notes.substring(0, 80)}{trade.notes.length > 80 ? "..." : ""}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── JOURNAL TAB ── */}
      {activeTab === "journal" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em" }}>ALL JOURNAL ENTRIES ({journal.length})</div>
            <button onClick={() => { setJournalTradeId(trades[0]?.id ?? null); setJournalEntryType("review"); setJournalContent(""); setShowJournal(true); }}
              disabled={trades.length === 0}
              style={{ padding: "7px 14px", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "8px", color: "#a855f7", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: trades.length === 0 ? 0.5 : 1 }}>
              + Weekly Review
            </button>
          </div>
          {journal.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📓</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>No journal entries yet</div>
              <div style={{ fontSize: "12px", color: "#334155" }}>Journal entries are created when you log a pre-trade plan, close a trade, or add a weekly review.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {journal.map((entry) => {
                const trade = trades.find((t) => t.id === entry.trade_id);
                const mood = MOODS.find((m) => m.value === entry.mood);
                const et = ENTRY_TYPES.find((e) => e.value === entry.entry_type);
                return (
                  <div key={entry.id} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.1)", borderRadius: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "16px" }}>{et?.icon}</span>
                        {mood && <span style={{ fontSize: "16px" }}>{mood.emoji}</span>}
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#a855f7" }}>{et?.label}</div>
                          {trade && <div style={{ fontSize: "10px", color: "#475569" }}>{trade.symbol} · {trade.direction.toUpperCase()} · {trade.trade_type.replace("_", " ")}</div>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div style={{ fontSize: "10px", color: "#334155" }}>{new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                        <button onClick={() => deleteJournalEntry(entry.id)}
                          style={{ background: "transparent", border: "none", color: "#334155", cursor: "pointer", fontSize: "11px", padding: "2px 6px" }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6 }}>{entry.content}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ADD TRADE MODAL ── */}
      {showAdd && (
        <div style={modalOverlay} onClick={() => setShowAdd(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            {(() => {
              const asset = getAssetStyle(addAssetType);
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `linear-gradient(145deg, rgba(${asset.rgb},0.3), rgba(${asset.rgb},0.5))`, border: `1px solid rgba(${asset.rgb},0.4)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: `0 4px 14px rgba(${asset.rgb},0.3)` }}>{asset.icon}</div>
                    <div>
                      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: 0, letterSpacing: "-0.02em" }}>Log {asset.label} Trade</h2>
                      <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>{asset.desc}</p>
                    </div>
                  </div>
                  <div style={{ height: "1px", background: `linear-gradient(90deg, rgba(${asset.rgb},0.4), transparent)`, margin: "14px 0" }} />
                </>
              );
            })()}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Trade type + Direction */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>TRADE TYPE</label>
                  <select value={newTradeType} onChange={(e) => setNewTradeType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {TRADE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label} — {t.desc}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>DIRECTION</label>
                  <div style={{ display: "flex", gap: "6px", height: "42px" }}>
                    {["long", "short"].map((d) => (
                      <button key={d} onClick={() => setNewDirection(d)}
                        style={{ flex: 1, border: `1px solid ${newDirection === d ? (d === "long" ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)") : "rgba(255,255,255,0.08)"}`, borderRadius: "9px", background: newDirection === d ? (d === "long" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)") : "rgba(255,255,255,0.04)", color: newDirection === d ? (d === "long" ? "#22c55e" : "#ef4444") : "#475569", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                        {d === "long" ? "▲ Long" : "▼ Short"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Symbol */}
              <div>
                <label style={labelStyle}>
                  {addAssetType === "future" ? "CONTRACT" : addAssetType === "forex" ? "CURRENCY PAIR" : "SYMBOL"} <span style={{ color: "#ef4444" }}>*</span>
                </label>
                {addAssetType === "future" ? (
                  <select value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">Select contract...</option>
                    {FUTURES_CONTRACTS.map((c) => <option key={c} value={c}>{c}</option>)}
                    <option value="custom">Custom...</option>
                  </select>
                ) : addAssetType === "forex" ? (
                  <select value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">Select pair...</option>
                    {FOREX_MAJORS.map((p) => <option key={p} value={p}>{p}</option>)}
                    <option value="custom">Custom pair...</option>
                  </select>
                ) : addAssetType === "crypto" ? (
                  <select value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">Select asset...</option>
                    {CRYPTO_PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
                    <option value="custom">Custom...</option>
                  </select>
                ) : (
                  <input value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} placeholder={addAssetType === "option" ? "e.g. AAPL, SPY, QQQ" : "e.g. AAPL, MSFT, SPY"} style={{ ...inputStyle, textTransform: "uppercase" }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(56,189,248,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                )}
                {(newSymbol === "custom" || !FUTURES_CONTRACTS.includes(newSymbol) && addAssetType === "future" && newSymbol) && addAssetType === "future" && newSymbol !== "custom" ? null :
                  newSymbol === "custom" ? (
                    <input value="" onChange={(e) => setNewSymbol(e.target.value)} placeholder="Enter custom symbol..." style={{ ...inputStyle, marginTop: "8px" }}
                      onFocus={(e) => e.target.style.borderColor = "rgba(56,189,248,0.4)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                    />
                  ) : null
                }
              </div>

              {/* Qty + Entry */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>{addAssetType === "forex" ? "LOT SIZE" : addAssetType === "future" ? "CONTRACTS" : "QUANTITY"} <span style={{ color: "#ef4444" }}>*</span></label>
                  {addAssetType === "forex" ? (
                    <select value={newLotSize} onChange={(e) => setNewLotSize(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                      {LOT_SIZES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  ) : (
                    <input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} placeholder={addAssetType === "future" ? "# of contracts" : "# of shares"} style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = "rgba(56,189,248,0.4)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                    />
                  )}
                </div>
                <div>
                  <label style={labelStyle}>ENTRY PRICE <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="number" value={newEntryPrice} onChange={(e) => setNewEntryPrice(e.target.value)} placeholder={addAssetType === "forex" ? "e.g. 1.0892" : "0.00"} style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(56,189,248,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
              </div>

              {/* Stop + Target */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>STOP LOSS</label>
                  <input type="number" value={newStopLoss} onChange={(e) => setNewStopLoss(e.target.value)} placeholder="0.00" style={{ ...inputStyle, borderColor: newStopLoss ? "rgba(239,68,68,0.3)" : undefined }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(239,68,68,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = newStopLoss ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}
                  />
                </div>
                <div>
                  <label style={labelStyle}>TAKE PROFIT</label>
                  <input type="number" value={newTakeProfit} onChange={(e) => setNewTakeProfit(e.target.value)} placeholder="0.00" style={{ ...inputStyle, borderColor: newTakeProfit ? "rgba(34,197,94,0.3)" : undefined }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = newTakeProfit ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"}
                  />
                </div>
              </div>

              {/* R/R preview */}
              {rr && (
                <div style={{ padding: "10px 14px", background: `rgba(${Number(rr) >= 2 ? "34,197,94" : "245,158,11"},0.06)`, border: `1px solid rgba(${Number(rr) >= 2 ? "34,197,94" : "245,158,11"},0.2)`, borderRadius: "9px", display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ fontSize: "10px", color: "#334155", fontWeight: 700 }}>R/R RATIO</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: Number(rr) >= 2 ? "#22c55e" : "#f59e0b" }}>{rr}:1</div>
                  {Number(rr) < 2 && <div style={{ fontSize: "10px", color: "#f59e0b" }}>⚠️ Below recommended 2:1 minimum</div>}
                  {Number(rr) >= 2 && <div style={{ fontSize: "10px", color: "#22c55e" }}>✓ Good R/R ratio</div>}
                </div>
              )}

              {/* Asset-specific fields */}
              {addAssetType === "future" && (
                <div style={{ padding: "12px", background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: "10px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#f97316", letterSpacing: "0.08em", marginBottom: "10px" }}>⚡ FUTURES DETAILS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    <div>
                      <label style={labelStyle}>CONTRACT TYPE</label>
                      <select value={newContractType} onChange={(e) => setNewContractType(e.target.value)} style={{ ...inputStyle, cursor: "pointer", fontSize: "11px" }}>
                        <option value="E-mini">E-mini</option>
                        <option value="Micro">Micro (1/10th)</option>
                        <option value="Standard">Standard</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>MULTIPLIER</label>
                      <input type="number" value={newContractMultiplier} onChange={(e) => setNewContractMultiplier(e.target.value)} placeholder="50" style={{ ...inputStyle, fontSize: "11px" }}
                        onFocus={(e) => e.target.style.borderColor = "rgba(249,115,22,0.4)"}
                        onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>MARGIN REQ.</label>
                      <input type="number" value={newMarginRequired} onChange={(e) => setNewMarginRequired(e.target.value)} placeholder="500" style={{ ...inputStyle, fontSize: "11px" }}
                        onFocus={(e) => e.target.style.borderColor = "rgba(249,115,22,0.4)"}
                        onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                      />
                    </div>
                  </div>
                  {newContractMultiplier && newQty && newEntryPrice && (
                    <div style={{ marginTop: "8px", fontSize: "10px", color: "#f97316" }}>
                      Contract value: {fmt(Number(newEntryPrice) * Number(newQty) * Number(newContractMultiplier))} · 1 point = {fmt(Number(newContractMultiplier) * Number(newQty))}
                    </div>
                  )}
                </div>
              )}

              {addAssetType === "option" && (
                <div style={{ padding: "12px", background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: "10px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#a855f7", letterSpacing: "0.08em", marginBottom: "10px" }}>🎯 OPTIONS DETAILS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                    <div>
                      <label style={labelStyle}>OPTION TYPE</label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {["call", "put"].map((t) => (
                          <button key={t} onClick={() => setNewOptionType(t)}
                            style={{ flex: 1, padding: "8px", border: `1px solid ${newOptionType === t ? (t === "call" ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)") : "rgba(255,255,255,0.08)"}`, borderRadius: "8px", background: newOptionType === t ? (t === "call" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)") : "rgba(255,255,255,0.04)", color: newOptionType === t ? (t === "call" ? "#22c55e" : "#ef4444") : "#475569", fontSize: "11px", fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>
                            {t === "call" ? "📈 Call" : "📉 Put"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>STRIKE PRICE</label>
                      <input type="number" value={newStrikePrice} onChange={(e) => setNewStrikePrice(e.target.value)} placeholder="0.00" style={{ ...inputStyle, fontSize: "11px" }}
                        onFocus={(e) => e.target.style.borderColor = "rgba(168,85,247,0.4)"}
                        onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <label style={labelStyle}>EXPIRATION DATE</label>
                      <input type="date" value={newExpiration} onChange={(e) => setNewExpiration(e.target.value)} style={{ ...inputStyle, fontSize: "11px" }}
                        onFocus={(e) => e.target.style.borderColor = "rgba(168,85,247,0.4)"}
                        onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>PREMIUM (per contract)</label>
                      <input type="number" value={newPremium} onChange={(e) => setNewPremium(e.target.value)} placeholder="0.00" style={{ ...inputStyle, fontSize: "11px" }}
                        onFocus={(e) => e.target.style.borderColor = "rgba(168,85,247,0.4)"}
                        onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                      />
                    </div>
                  </div>
                  {newPremium && newQty && (
                    <div style={{ marginTop: "8px", fontSize: "10px", color: "#a855f7" }}>
                      Total premium paid: {fmt(Number(newPremium) * Number(newQty) * 100)} (100 shares per contract)
                    </div>
                  )}
                </div>
              )}

              {addAssetType === "forex" && (
                <div style={{ padding: "12px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "10px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#22c55e", letterSpacing: "0.08em", marginBottom: "10px" }}>💱 FOREX DETAILS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <label style={labelStyle}>QUANTITY (lots)</label>
                      <input type="number" value={newQty || ""} onChange={(e) => setNewQty(e.target.value)} placeholder="e.g. 1" style={{ ...inputStyle, fontSize: "11px" }}
                        onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                        onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>PIP VALUE ($)</label>
                      <input type="number" value={newPipValue} onChange={(e) => setNewPipValue(e.target.value)} placeholder="1.00" style={{ ...inputStyle, fontSize: "11px" }}
                        onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                        onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                      />
                    </div>
                  </div>
                  {newStopLoss && newEntryPrice && newPipValue && (
                    <div style={{ marginTop: "8px", fontSize: "10px", color: "#22c55e" }}>
                      Est. risk: {fmt(Math.abs(Number(newEntryPrice) - Number(newStopLoss)) * 10000 * Number(newPipValue))} ({Math.abs(Number(newEntryPrice) - Number(newStopLoss)) * 10000} pips × ${newPipValue}/pip)
                    </div>
                  )}
                </div>
              )}

              {/* Risk + Timeframe + Setup */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={labelStyle}>RISK ($)</label>
                  <input type="number" value={newRiskAmount} onChange={(e) => setNewRiskAmount(e.target.value)} placeholder="Amount at risk" style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
                <div>
                  <label style={labelStyle}>TIMEFRAME</label>
                  <select value={newTimeframe} onChange={(e) => setNewTimeframe(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {TIMEFRAMES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>SETUP</label>
                  <select value={newSetupType} onChange={(e) => setNewSetupType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {SETUP_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={labelStyle}>ENTRY DATE/TIME</label>
                  <input type="datetime-local" value={newEntryDate} onChange={(e) => setNewEntryDate(e.target.value)} style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
                <div>
                  <label style={labelStyle}>STRATEGY / SETUP NOTE</label>
                  <input value={newStrategy} onChange={(e) => setNewStrategy(e.target.value)} placeholder="e.g. VWAP reclaim, gap fill..." style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
              </div>

              {addMsg && (
                <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", fontSize: "12px", color: "#ef4444" }}>{addMsg}</div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => { setShowAdd(false); setAddMsg(null); }} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={addTrade} disabled={addSaving || !newSymbol.trim() || !newEntryPrice || (!newQty && addAssetType !== "forex")}
                  style={{ flex: 2, padding: "11px", background: `linear-gradient(135deg, rgba(${getAssetStyle(addAssetType).rgb},0.8), rgba(${getAssetStyle(addAssetType).rgb},1))`, border: "none", borderRadius: "9px", color: "#000", fontSize: "13px", fontWeight: 800, cursor: addSaving ? "not-allowed" : "pointer", opacity: addSaving ? 0.7 : 1, boxShadow: `0 4px 16px rgba(${getAssetStyle(addAssetType).rgb},0.3)` }}>
                  {addSaving ? "Logging..." : `Log ${getAssetStyle(addAssetType).label} Trade`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CLOSE TRADE MODAL ── */}
      {showClose && selectedTrade && (
        <div style={modalOverlay} onClick={() => setShowClose(false)}>
          <div style={{ ...modalBox, maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Close Trade</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 4px" }}>{selectedTrade.symbol} · {selectedTrade.direction.toUpperCase()} · Qty: {Number(selectedTrade.quantity).toLocaleString()}</p>
            <p style={{ fontSize: "11px", color: "#334155", margin: "0 0 18px" }}>
              Entry: <strong style={{ color: "#38bdf8" }}>{fmt(selectedTrade.entry_price)}</strong>
              {selectedTrade.stop_loss && <> · Stop: <strong style={{ color: "#ef4444" }}>{fmt(selectedTrade.stop_loss)}</strong></>}
              {selectedTrade.take_profit && <> · Target: <strong style={{ color: "#22c55e" }}>{fmt(selectedTrade.take_profit)}</strong></>}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={labelStyle}>EXIT PRICE <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="number" value={closeExitPrice} onChange={(e) => setCloseExitPrice(e.target.value)} placeholder="0.00" autoFocus
                  style={{ ...inputStyle, fontSize: "20px", fontWeight: 700 }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>EXIT DATE/TIME</label>
                  <input type="datetime-local" value={closeExitDate} onChange={(e) => setCloseExitDate(e.target.value)} style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
                <div>
                  <label style={labelStyle}>COMMISSION / FEES</label>
                  <input type="number" value={closeCommission} onChange={(e) => setCloseCommission(e.target.value)} placeholder="0.00" style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
              </div>

              {closeExitPrice && (() => {
                const exit = Number(closeExitPrice);
                const entry = Number(selectedTrade.entry_price);
                const qty = Number(selectedTrade.quantity);
                const mult = Number(selectedTrade.contract_multiplier ?? 1);
                const comm = closeCommission ? Number(closeCommission) : 0;
                const pnl = selectedTrade.asset_type === "future"
                  ? (selectedTrade.direction === "long" ? exit - entry : entry - exit) * qty * mult - comm
                  : selectedTrade.asset_type === "option"
                  ? (exit - Number(selectedTrade.premium ?? entry)) * qty * 100 - comm
                  : (selectedTrade.direction === "long" ? exit - entry : entry - exit) * qty - comm;
                const isW = pnl > 0;
                return (
                  <div style={{ padding: "12px", background: isW ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${isW ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#334155", fontWeight: 700, marginBottom: "2px" }}>ESTIMATED P&L</div>
                      {selectedTrade.asset_type === "future" && <div style={{ fontSize: "10px", color: "#334155" }}>×{mult} multiplier · {qty} contracts</div>}
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: isW ? "#22c55e" : "#ef4444" }}>{fmt(pnl)}</div>
                  </div>
                );
              })()}

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowClose(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={closeTrade} disabled={closeSaving || !closeExitPrice}
                  style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: closeSaving || !closeExitPrice ? "not-allowed" : "pointer", opacity: closeSaving || !closeExitPrice ? 0.7 : 1 }}>
                  {closeSaving ? "Closing..." : "Close & Calculate P&L"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── POST-TRADE JOURNAL PROMPT ── */}
      {showJournalPrompt && justClosedTradeId && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: "420px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📓</div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 8px" }}>Trade Closed — Journal Your Review?</h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 20px", lineHeight: 1.6 }}>
              Writing a post-trade review is one of the most powerful habits in trading. Document what happened, what worked, what did not, and what you would do differently.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowJournalPrompt(false)}
                style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>
                Skip
              </button>
              <button onClick={() => { setJournalTradeId(justClosedTradeId); setJournalEntryType("post_trade"); setJournalContent(""); setShowJournalPrompt(false); setShowJournal(true); }}
                style={{ flex: 2, padding: "11px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                📓 Write Review Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── JOURNAL MODAL ── */}
      {showJournal && journalTradeId && (
        <div style={modalOverlay} onClick={() => setShowJournal(false)}>
          <div style={{ ...modalBox, maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>📓 Trade Journal</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 16px" }}>
              {trades.find((t) => t.id === journalTradeId)?.symbol} — {ENTRY_TYPES.find((e) => e.value === journalEntryType)?.label}
            </p>

            {/* Existing entries */}
            {getTradeJournal(journalTradeId).length > 0 && (
              <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "180px", overflowY: "auto" }}>
                {getTradeJournal(journalTradeId).map((entry) => {
                  const mood = MOODS.find((m) => m.value === entry.mood);
                  const et = ENTRY_TYPES.find((e) => e.value === entry.entry_type);
                  return (
                    <div key={entry.id} style={{ padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.1)", borderRadius: "9px" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                        {mood && <span style={{ fontSize: "13px" }}>{mood.emoji}</span>}
                        <span style={{ fontSize: "10px", color: "#a855f7", fontWeight: 700 }}>{et?.label}</span>
                        <span style={{ fontSize: "10px", color: "#334155", marginLeft: "auto" }}>{new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <button onClick={() => deleteJournalEntry(entry.id)}
                          style={{ background: "transparent", border: "none", color: "#334155", cursor: "pointer", fontSize: "10px" }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}>Delete</button>
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>{entry.content}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>ENTRY TYPE</label>
                  <select value={journalEntryType} onChange={(e) => setJournalEntryType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {ENTRY_TYPES.map((e) => <option key={e.value} value={e.value}>{e.icon} {e.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>MOOD / EMOTION</label>
                  <select value={journalMood} onChange={(e) => setJournalMood(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {MOODS.map((m) => <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Prompts based on entry type */}
              <div style={{ fontSize: "10px", color: "#334155", padding: "8px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px" }}>
                {journalEntryType === "pre_trade" && "💡 What is your thesis? Entry criteria met? Risk defined? What would invalidate the setup?"}
                {journalEntryType === "during_trade" && "💡 Is price behaving as expected? Any reason to adjust stop or target?"}
                {journalEntryType === "post_trade" && "💡 Did you follow your plan? What worked? What would you do differently? Emotional state?"}
                {journalEntryType === "review" && "💡 Weekly stats, patterns noticed, rules violated, improvements for next week?"}
              </div>

              <div>
                <label style={labelStyle}>NOTES</label>
                <textarea value={journalContent} onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="Write your trade notes here..."
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(168,85,247,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowJournal(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={addJournalEntry} disabled={journalSaving || !journalContent.trim()}
                  style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: journalSaving || !journalContent.trim() ? "not-allowed" : "pointer", opacity: journalSaving || !journalContent.trim() ? 0.7 : 1 }}>
                  {journalSaving ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEdit && editTrade && (
        <div style={modalOverlay} onClick={() => setShowEdit(false)}>
          <div style={{ ...modalBox, maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Edit Trade</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 20px" }}>{editTrade.symbol} · {editTrade.asset_type} · {editTrade.direction.toUpperCase()}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              <div>
                <label style={labelStyle}>SYMBOL</label>
                <input value={editSymbol} onChange={(e) => setEditSymbol(e.target.value)} style={{ ...inputStyle, textTransform: "uppercase" }} onFocus={(e) => e.target.style.borderColor = "rgba(56,189,248,0.4)"} onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>ENTRY PRICE</label>
                  <input type="number" value={editEntryPrice} onChange={(e) => setEditEntryPrice(e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = "rgba(56,189,248,0.4)"} onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
                </div>
                <div>
                  <label style={labelStyle}>STOP LOSS</label>
                  <input type="number" value={editStopLoss} onChange={(e) => setEditStopLoss(e.target.value)} placeholder="Optional" style={{ ...inputStyle, borderColor: editStopLoss ? "rgba(239,68,68,0.3)" : undefined }} onFocus={(e) => e.target.style.borderColor = "rgba(239,68,68,0.4)"} onBlur={(e) => e.target.style.borderColor = editStopLoss ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>TAKE PROFIT</label>
                  <input type="number" value={editTakeProfit} onChange={(e) => setEditTakeProfit(e.target.value)} placeholder="Optional" style={{ ...inputStyle, borderColor: editTakeProfit ? "rgba(34,197,94,0.3)" : undefined }} onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"} onBlur={(e) => e.target.style.borderColor = editTakeProfit ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"} />
                </div>
                <div>
                  <label style={labelStyle}>STRATEGY</label>
                  <input value={editStrategy} onChange={(e) => setEditStrategy(e.target.value)} placeholder="Optional" style={inputStyle} onFocus={(e) => e.target.style.borderColor = "rgba(56,189,248,0.4)"} onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>NOTES</label>
                <input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Optional" style={inputStyle} onFocus={(e) => e.target.style.borderColor = "rgba(56,189,248,0.4)"} onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
              </div>
              {editMsg && <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", fontSize: "12px", color: "#ef4444" }}>{editMsg}</div>}
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowEdit(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={saveEditTrade} disabled={editSaving || !editEntryPrice} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: editSaving ? "not-allowed" : "pointer", opacity: editSaving ? 0.7 : 1 }}>{editSaving ? "Saving..." : "Save Changes"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

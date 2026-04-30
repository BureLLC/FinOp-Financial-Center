"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../../../src/lib/supabase";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface FinancialContext {
  netWorth: number;
  totalCash: number;
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  openTradesCount: number;
  activeGoalsCount: number;
  totalSaved: number;
  totalTaxLiability: number;
  totalWriteOffs: number;
  budgetCategories: { name: string; spent: number; limit: number }[];
  recentTransactions: { description: string; amount: number; direction: string; date: string }[];
  openTrades: { symbol: string; direction: string; asset_type: string; entry_price: number }[];
  savings: { name: string; current: number; target: number }[];
  taxProfile: { filing_status: string; entity_type: string } | null;
}

const SUGGESTED_QUESTIONS = [
  { icon: "💰", text: "How is my net worth trending?" },
  { icon: "📊", text: "Am I on track with my budget?" },
  { icon: "📈", text: "Review my open trading positions" },
  { icon: "🧾", text: "What write-offs should I be capturing?" },
  { icon: "🎯", text: "How can I reach my savings goals faster?" },
  { icon: "⚡", text: "Explain futures day trading margin" },
  { icon: "💱", text: "What is the best forex trading strategy?" },
  { icon: "🛡️", text: "How do I reduce my tax liability?" },
  { icon: "📅", text: "When are my quarterly tax payments due?" },
  { icon: "📉", text: "What is a good risk/reward ratio for trading?" },
  { icon: "🏠", text: "What home office expenses are deductible?" },
  { icon: "💡", text: "Explain the envelope budgeting system" },
];

const TOPICS = [
  { icon: "💰", label: "Budgeting" },
  { icon: "📈", label: "Investing" },
  { icon: "⚡", label: "Trading" },
  { icon: "🧾", label: "Taxes" },
  { icon: "🎯", label: "Savings" },
  { icon: "📰", label: "Markets" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n ?? 0);
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "12px 16px" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: "7px", height: "7px", borderRadius: "50%",
          background: "#38bdf8",
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          boxShadow: "0 0 6px rgba(56,189,248,0.6)",
        }} />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}

function MessageBubble({ msg, viewport }: { msg: Message; viewport: "mobile" | "tablet" | "desktop" }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: "16px" }}>
      {!isUser && (
        <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #1e3a5f, #0a0f1a)", border: "1px solid rgba(56,189,248,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: "10px", alignSelf: "flex-end", boxShadow: "0 0 12px rgba(37,99,235,0.3)" }}>
          <div style={{ display: "flex", gap: "3px" }}>
            <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "1px", boxShadow: "0 0 4px rgba(56,189,248,0.8)" }} />
            <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "1px", boxShadow: "0 0 4px rgba(56,189,248,0.8)" }} />
          </div>
        </div>
      )}
      <div style={{
        maxWidth: viewport === "mobile" ? "88%" : "75%",
        padding: "12px 16px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser
          ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
          : "rgba(255,255,255,0.04)",
        border: isUser ? "none" : "1px solid rgba(255,255,255,0.07)",
        color: "#f8fafc",
        fontSize: "13.5px",
        lineHeight: 1.65,
        boxShadow: isUser ? "0 4px 16px rgba(37,99,235,0.3)" : "none",
        whiteSpace: "pre-wrap",
      }}>
        {msg.content}
        <div style={{ fontSize: "10px", color: isUser ? "rgba(255,255,255,0.5)" : "#334155", marginTop: "6px", textAlign: "right" }}>
          {msg.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

export default function LevelUpPage() {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(true);
  const [context, setContext] = useState<FinancialContext | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">("desktop");

  useEffect(() => { loadContext(); }, []);

  useEffect(() => {
    const updateViewport = () => {
      const w = window.innerWidth;
      if (w < 768) setViewport("mobile");
      else if (w < 1100) setViewport("tablet");
      else setViewport("desktop");
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadContext = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [snapRes, txRes, budgetRes, envRes, goalsRes, tradesRes, taxRes, writeOffRes, profileRes] = await Promise.all([
      supabase.from("portfolio_snapshots").select("total_net_worth, total_cash, total_investments").eq("user_id", user.id).order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("transactions").select("description, amount, direction, transaction_date").eq("user_id", user.id).is("deleted_at", null).order("transaction_date", { ascending: false }).limit(10),
      supabase.from("budget_records").select("category_id, actual_spent, budget_amount").eq("user_id", user.id),
      supabase.from("budget_categories").select("id, name, monthly_limit").eq("user_id", user.id).eq("is_active", true),
      supabase.from("savings_goals").select("name, current_amount, target_amount").eq("user_id", user.id).eq("status", "active"),
      supabase.from("trades").select("symbol, direction, asset_type, entry_price").eq("user_id", user.id).eq("status", "open").is("deleted_at", null),
      supabase.from("tax_estimates").select("total_tax_liability").eq("user_id", user.id).eq("period_type", "annual").order("calculated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("write_offs").select("amount").eq("user_id", user.id).eq("tax_year", new Date().getFullYear()),
      supabase.from("tax_profiles").select("filing_status, entity_type").eq("user_id", user.id).eq("is_primary", true).eq("is_active", true).maybeSingle(),
    ]);

    const cats = envRes.data ?? [];
    const recs = budgetRes.data ?? [];
    const budgetCategories = cats.map((cat) => {
      const rec = recs.find((r) => r.category_id === cat.id);
      return { name: cat.name, spent: Number(rec?.actual_spent ?? 0), limit: Number(cat.monthly_limit ?? 0) };
    });

    const txs = txRes.data ?? [];
    const totalIncome = txs.filter((t) => t.direction === "credit").reduce((s, t) => s + Number(t.amount), 0);
    const totalExpenses = txs.filter((t) => t.direction === "debit").reduce((s, t) => s + Number(t.amount), 0);

    setContext({
      netWorth: Number(snapRes.data?.total_net_worth ?? 0),
      totalCash: Number(snapRes.data?.total_cash ?? 0),
      totalInvestments: Number(snapRes.data?.total_investments ?? 0),
      totalIncome,
      totalExpenses,
      openTradesCount: tradesRes.data?.length ?? 0,
      activeGoalsCount: goalsRes.data?.length ?? 0,
      totalSaved: (goalsRes.data ?? []).reduce((s, g) => s + Number(g.current_amount), 0),
      totalTaxLiability: Number(taxRes.data?.total_tax_liability ?? 0),
      totalWriteOffs: (writeOffRes.data ?? []).reduce((s, w) => s + Number(w.amount), 0),
      budgetCategories,
      recentTransactions: txs.slice(0, 5).map((t) => ({ description: t.description, amount: Number(t.amount), direction: t.direction, date: t.transaction_date })),
      openTrades: tradesRes.data ?? [],
      savings: (goalsRes.data ?? []).map((g) => ({ name: g.name, current: Number(g.current_amount), target: Number(g.target_amount) })),
      taxProfile: profileRes.data ?? null,
    });

    // Initial greeting
    setMessages([{
      role: "assistant",
      content: `Hey! I'm LevelUP, your AI-powered financial advisor inside FinOps. I have full access to your financial data and I'm ready to help.\n\nHere's a quick snapshot:\n• Net Worth: ${fmt(Number(snapRes.data?.total_net_worth ?? 0))}\n• Open Trades: ${tradesRes.data?.length ?? 0}\n• Active Savings Goals: ${goalsRes.data?.length ?? 0}\n• Est. Tax Liability: ${fmt(Number(taxRes.data?.total_tax_liability ?? 0))}\n\nWhat would you like to explore?`,
      timestamp: new Date(),
    }]);

    setContextLoading(false);
  };

  const buildSystemPrompt = () => {
    if (!context) return "";
    const overBudget = context.budgetCategories.filter((c) => c.limit > 0 && c.spent > c.limit);
    const openTradesSummary = context.openTrades.map((t) => `${t.symbol} (${t.direction} ${t.asset_type} @ $${t.entry_price})`).join(", ");

    return `You are LevelUP, a highly intelligent AI financial advisor embedded inside FinOps Financial Center — a professional-grade personal finance platform.

PERSONALITY: You are confident, knowledgeable, warm, and direct. You speak like a seasoned financial advisor who also understands trading, taxes, and markets deeply. You never give vague answers. You use the user's actual data to give personalized, specific guidance.

USER'S CURRENT FINANCIAL SNAPSHOT:
- Net Worth: ${fmt(context.netWorth)}
- Total Cash: ${fmt(context.totalCash)}
- Total Investments: ${fmt(context.totalInvestments)}
- Recent Income (10 tx): ${fmt(context.totalIncome)}
- Recent Expenses (10 tx): ${fmt(context.totalExpenses)}
- Open Trades: ${context.openTradesCount} (${openTradesSummary || "none"})
- Active Savings Goals: ${context.activeGoalsCount} — Total Saved: ${fmt(context.totalSaved)}
- Est. Tax Liability: ${fmt(context.totalTaxLiability)}
- Total Write-Offs This Year: ${fmt(context.totalWriteOffs)}
- Tax Profile: ${context.taxProfile ? `${context.taxProfile.filing_status} / ${context.taxProfile.entity_type}` : "Not set up"}
- Budget Categories Over Limit: ${overBudget.length > 0 ? overBudget.map((c) => `${c.name} ($${c.spent} / $${c.limit})`).join(", ") : "None"}
- Savings Goals: ${context.savings.map((g) => `${g.name}: $${g.current}${g.target > 0 ? ` / $${g.target}` : " (ongoing)"}`).join(", ") || "None"}

EXPERTISE AREAS:
1. BUDGETING — Zero-based budgeting, envelope system, 50/30/20 rule, budget reallocation strategies
2. SAVINGS — Emergency funds (3-6 months expenses), sinking funds, high-yield savings, compound interest
3. INVESTING — ETFs, index funds, stocks, bonds, portfolio allocation, dollar cost averaging, rebalancing
4. TRADING — Futures (ES, NQ, MES, MNQ), Options (calls, puts, spreads, Greeks), Forex (majors, pip value, lot sizing), day trading rules, PDT rule, risk management (1-2% rule), R/R ratios, technical analysis, candlestick patterns, VWAP, support/resistance
5. TAXES — Self-employment tax (15.3%), Section 1256 (60/40 rule for futures), wash sale rule, qualified dividends, capital gains (short vs long term), quarterly estimates, deductions, SEP-IRA, Solo 401k
6. MARKETS — US equities (NYSE, NASDAQ), futures markets (CME), forex (24/5), crypto (24/7), market hours, economic indicators, Fed policy, interest rates
7. DAILY NEWS — Reference current market conditions, Fed decisions, economic data as context for advice
8. APP NAVIGATION — Know every feature of FinOps: transactions, budget tracker, envelope system, savings goals (one-time + sinking funds), tax center, write-offs, investments, trading journal

RULES:
- Always use the user's actual data when answering. Never give generic advice when you have specific numbers.
- Keep responses concise (under 200 words) unless asked for detail
- Use bullet points for lists, bold for key numbers
- Always add: "Not professional financial advice — consult a licensed advisor for your specific situation" at the end when giving specific financial recommendations
- Never refuse to discuss financial topics — you are a financial AI, this is your purpose
- If asked about current news/prices, note that your data is from your training cutoff but give context based on market knowledge
- You are page-aware: the user is on /dashboard/levelup — the dedicated AI assistant page`;
  };

  const sendMessage = async (text?: string) => {
    const userMsg = text ?? input.trim();
    if (!userMsg || loading) return;
    setInput("");

    const newUserMsg: Message = { role: "user", content: userMsg, timestamp: new Date() };
    setMessages((prev) => [...prev, newUserMsg]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg },
          ],
        }),
      });

      const data = await response.json();
      const reply = data?.content?.[0]?.text ?? data?.error ?? "I'm sorry, I couldn't process that. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply, timestamp: new Date() }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again shortly.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    if (!context) return;
    setMessages([{
      role: "assistant",
      content: `Conversation cleared. I still have your full financial context loaded. What would you like to talk about?`,
      timestamp: new Date(),
    }]);
  };

  return (
    <div style={{ maxWidth: "1100px", display: "flex", flexDirection: viewport === "desktop" ? "row" : "column", gap: viewport === "mobile" ? "12px" : "20px", alignItems: "stretch", height: viewport === "desktop" ? "calc(100vh - 120px)" : "auto", paddingBottom: viewport === "mobile" ? "92px" : "0" }}>

      {/* Left sidebar — context + topics */}
      <div style={{ width: viewport === "desktop" ? "260px" : "100%", flexShrink: 0, display: "flex", flexDirection: viewport === "mobile" ? "column" : "row", gap: "12px", overflowX: viewport === "mobile" ? "visible" : "auto" }}>

        {/* Financial snapshot */}
        <div style={{ padding: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: "12px" }}>YOUR SNAPSHOT</div>
          {contextLoading ? (
            <div style={{ fontSize: "12px", color: "#334155" }}>Loading...</div>
          ) : context ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { label: "Net Worth",    value: fmt(context.netWorth),          color: "#38bdf8" },
                { label: "Cash",         value: fmt(context.totalCash),         color: "#22c55e" },
                { label: "Investments",  value: fmt(context.totalInvestments),  color: "#a855f7" },
                { label: "Saved",        value: fmt(context.totalSaved),        color: "#f59e0b" },
                { label: "Tax Est.",     value: fmt(context.totalTaxLiability), color: "#ef4444" },
                { label: "Write-Offs",   value: fmt(context.totalWriteOffs),    color: "#22c55e" },
                { label: "Open Trades",  value: String(context.openTradesCount), color: "#f97316" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#475569" }}>{item.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Topics */}
        <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: "10px" }}>TOPICS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {TOPICS.map((t) => (
              <button key={t.label} onClick={() => { setActiveTopic(activeTopic === t.label ? null : t.label); sendMessage(`Tell me about ${t.label} based on my financial data`); }}
                style={{ padding: "5px 10px", background: activeTopic === t.label ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${activeTopic === t.label ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: "8px", color: activeTopic === t.label ? "#38bdf8" : "#475569", fontSize: "11px", cursor: "pointer", transition: "all 0.15s ease" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Suggested questions */}
        <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", flex: 1, overflowY: viewport === "desktop" ? "auto" : "visible", minWidth: viewport === "desktop" ? "0" : "100%" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: "10px" }}>SUGGESTED</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button key={i} onClick={() => sendMessage(q.text)}
                style={{ padding: "8px 10px", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "9px", color: "#475569", fontSize: "11px", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease", display: "flex", gap: "7px", alignItems: "flex-start" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(37,99,235,0.08)"; e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(37,99,235,0.2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                <span style={{ flexShrink: 0 }}>{q.icon}</span>
                <span>{q.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", overflow: "hidden", height: viewport === "desktop" ? "100%" : "min(78vh, 760px)", minHeight: viewport === "mobile" ? "560px" : "auto" }}>
        {/* Chat header */}
        <div style={{ padding: "16px 20px", background: "rgba(37,99,235,0.08)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "12px", flexWrap: viewport === "mobile" ? "wrap" : "nowrap" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #1e3a5f, #0a1628)", border: "1px solid rgba(56,189,248,0.4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(37,99,235,0.4)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                <div style={{ width: "6px", height: "6px", background: "#38bdf8", borderRadius: "2px", boxShadow: "0 0 6px rgba(56,189,248,0.8)" }} />
                <div style={{ width: "6px", height: "6px", background: "#38bdf8", borderRadius: "2px", boxShadow: "0 0 6px rgba(56,189,248,0.8)" }} />
              </div>
              <div style={{ width: "14px", height: "2px", background: "rgba(56,189,248,0.5)", borderRadius: "1px" }} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>LevelUP Financial AI</div>
            <div style={{ fontSize: "11px", color: "#475569" }}>
              {contextLoading ? "Loading your financial context..." : "Full financial context loaded · Personalized advice ready"}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={clearConversation}
              style={{ padding: "6px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#334155", fontSize: "11px", cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#94a3b8"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}>
              Clear
            </button>
            <div style={{ padding: "6px 12px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "8px", fontSize: "11px", color: "#22c55e", fontWeight: 600 }}>
              ● Online
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {contextLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #1e3a5f, #0a1628)", border: "1px solid rgba(56,189,248,0.3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(37,99,235,0.3)" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[0,1,2].map((i) => <div key={i} style={{ width: "6px", height: "6px", background: "#38bdf8", borderRadius: "1px", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`, boxShadow: "0 0 4px rgba(56,189,248,0.8)" }} />)}
                </div>
              </div>
              <div style={{ fontSize: "13px", color: "#475569" }}>Loading your financial context...</div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} viewport={viewport} />)}
              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #1e3a5f, #0a0f1a)", border: "1px solid rgba(56,189,248,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: "10px", alignSelf: "flex-end" }}>
                    <div style={{ display: "flex", gap: "3px" }}>
                      <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "1px" }} />
                      <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "1px" }} />
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px 18px 18px 4px" }}>
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your finances, markets, trading, taxes..."
                rows={1}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  color: "#e2e8f0",
                  fontSize: "13.5px",
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.5,
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  maxHeight: "120px",
                  overflowY: "auto",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 120) + "px";
                }}
                disabled={loading || contextLoading}
              />
            </div>
            <button onClick={() => sendMessage()} disabled={loading || !input.trim() || contextLoading}
              style={{
                width: "44px", height: "44px",
                background: loading || !input.trim() ? "rgba(37,99,235,0.2)" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                border: "none", borderRadius: "12px",
                color: "#fff", fontSize: "18px", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: loading || !input.trim() ? "none" : "0 4px 16px rgba(37,99,235,0.4)",
                transition: "all 0.15s ease",
              }}>
              ↑
            </button>
          </div>
          <div style={{ fontSize: "10px", color: "#1e293b", marginTop: "8px", textAlign: "center" }}>
            Enter to send · Shift+Enter for new line · LevelUP has access to your full financial profile
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "../../src/lib/supabase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PAGE_TIPS: Record<string, string> = {
  "/dashboard":              "I can explain your net worth, cash flow, or any metric on this page.",
  "/dashboard/summary":      "Ask me to interpret any chart or financial trend.",
  "/dashboard/income":       "I can help categorize income or analyze your sources.",
  "/dashboard/budget":       "Ask about spending vs budget or savings strategies.",
  "/dashboard/savings":      "I can help you reach savings goals faster.",
  "/dashboard/write-offs":   "Ask what qualifies as a deduction for your situation.",
  "/dashboard/tax":          "I can explain tax estimates or quarterly payment planning.",
  "/dashboard/investments":  "Ask about portfolio allocation, performance, or rebalancing.",
  "/dashboard/trading":      "I can review positions, R/R ratios, or trading strategies.",
  "/dashboard/transactions":  "Need help tagging or categorizing transactions?",
  "/dashboard/connections":  "I can help troubleshoot account connections.",
  "/dashboard/alerts":       "I can explain what any alert means and what action to take.",
  "/dashboard/levelup":      "You're on my full page — ask me anything!",
  "/dashboard/settings":     "Need help with any setting or configuration?",
};

function RobotIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="6" y="10" width="20" height="16" rx="4" fill="#2563eb" opacity="0.9" />
      <rect x="10" y="14" width="4" height="4" rx="1" fill="white" />
      <rect x="18" y="14" width="4" height="4" rx="1" fill="white" />
      <rect x="12" y="20" width="8" height="2" rx="1" fill="white" opacity="0.7" />
      <rect x="14" y="6" width="4" height="5" rx="2" fill="#2563eb" />
      <circle cx="16" cy="5" r="2" fill="#22c55e" />
      <rect x="2" y="13" width="4" height="6" rx="2" fill="#2563eb" opacity="0.7" />
      <rect x="26" y="13" width="4" height="6" rx="2" fill="#2563eb" opacity="0.7" />
    </svg>
  );
}

interface Props { pathname: string; }


const levelUpStateByUser = new Map<string, { openedOnce: boolean; open: boolean; messages: Message[]; lastPopupAt: number | null }>();

function getDefaultLevelUpState() {
  return { openedOnce: false, open: false, messages: [], lastPopupAt: null };
}

function getLevelUpStateForUser(userId: string | null) {
  const key = userId ?? "__anonymous__";
  if (!levelUpStateByUser.has(key)) levelUpStateByUser.set(key, getDefaultLevelUpState());
  return levelUpStateByUser.get(key)!;
}

export default function LevelUpAssistant({ pathname }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const initialState = getLevelUpStateForUser(null);
  const [open, setOpen] = useState(initialState.open);
  const [messages, setMessages] = useState<Message[]>(initialState.messages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);


  useEffect(() => {
    let mounted = true;

    const applyUserScope = (userId: string | null) => {
      if (!mounted) return;
      const scopedState = getLevelUpStateForUser(userId);
      setCurrentUserId(userId);
      setOpen(scopedState.open);
      setMessages(scopedState.messages);
      setShowBubble(false);
    };

    supabase.auth.getUser().then(({ data }) => {
      applyUserScope(data.user?.id ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user?.id ?? null;

      if (event === "SIGNED_OUT") {
        levelUpStateByUser.delete(currentUserId ?? "__anonymous__");
        applyUserScope(null);
        return;
      }

      if ((currentUserId ?? null) !== nextUserId) {
        applyUserScope(nextUserId);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase, currentUserId]);
  // Controlled auto-popup: once per session, then auto-minimize
  useEffect(() => {
    if (pathname === "/") return;
    if (getLevelUpStateForUser(currentUserId).openedOnce) return;
    setShowBubble(true);
    const openTimer = setTimeout(() => {
      setOpen(true);
      const state = getLevelUpStateForUser(currentUserId);
      state.open = true;
      state.openedOnce = true;
      state.lastPopupAt = Date.now();
    }, 800);
    const minimizeTimer = setTimeout(() => {
      setOpen(false);
      getLevelUpStateForUser(currentUserId).open = false;
    }, 18000);
    return () => { clearTimeout(openTimer); clearTimeout(minimizeTimer); };
  }, [pathname, currentUserId]);

  useEffect(() => {
    getLevelUpStateForUser(currentUserId).messages = messages;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    getLevelUpStateForUser(currentUserId).open = open;
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
    setShowBubble(false);
    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: PAGE_TIPS[pathname] ?? "Hey! I'm LevelUP, your financial AI. Ask me anything about your finances.",
      }]);
    }
  };

  const sendMessage = async (text?: string) => {
    const userMsg = text ?? input.trim();
    if (!userMsg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 300,
          system: `You are LevelUP, a concise AI financial assistant inside FinOps Financial Center. The user is on: ${pathname}. Be brief — max 3 sentences unless asked for more. Be helpful, warm, and financially accurate. Not professional financial advice. If asked about MFA/security, provide setup steps for authenticator app, backup codes, and recovery best practices. Never suggest bypasses or disabling MFA.`,
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg },
          ],
        }),
      });
      const data = await response.json();
      const reply = data?.content?.[0]?.text ?? "I'm having trouble connecting. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const tip = PAGE_TIPS[pathname] ?? "Ask me anything about your finances.";
  const bottomOffset = isMobile ? "calc(64px + 16px)" : "24px";
  const chatWidth = isMobile ? "calc(100vw - 24px)" : "340px";
  const chatHeight = isMobile ? "420px" : "460px";
  const right = "12px";

  return (
    <>
      {/* Greeting bubble */}
      {showBubble && !open && (
        <div onClick={handleOpen}
          style={{ position: "fixed", bottom: `calc(${bottomOffset} + 68px)`, right, zIndex: 999, maxWidth: "260px", cursor: "pointer", animation: "fadeInUp 0.3s ease" }}>
          <div style={{ background: "linear-gradient(135deg, #1e3a5f, #0a1628)", border: "1px solid rgba(56,189,248,0.25)", borderRadius: "16px 16px 4px 16px", padding: "12px 14px", boxShadow: "0 0 24px rgba(37,99,235,0.3)" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", margin: "0 0 4px" }}>👋 Hey! I'm LevelUP</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", margin: "0 0 8px", lineHeight: 1.5 }}>{tip}</p>
            <p style={{ fontSize: "11px", color: "#38bdf8", margin: 0, fontWeight: 600 }}>Tap to chat →</p>
          </div>
        </div>
      )}

      {/* Chat window */}
      {open && (
        <div style={{ position: "fixed", bottom: `calc(${bottomOffset} + 72px)`, right, zIndex: 999, width: chatWidth, height: chatHeight, background: "rgba(6,9,16,0.98)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "18px", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 40px rgba(37,99,235,0.15)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", animation: "fadeInUp 0.2s ease" }}>
          {/* Header */}
          <div style={{ padding: "12px 14px", background: "linear-gradient(135deg, rgba(30,58,95,0.8), rgba(10,22,40,0.8))", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px rgba(37,99,235,0.4)", flexShrink: 0 }}>
              <RobotIcon size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>LevelUP</div>
              <div style={{ fontSize: "10px", color: "rgba(56,189,248,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Financial AI · Advisory only</div>
            </div>
            <button onClick={() => { setMessages([]); setMessages([{ role: "assistant", content: tip }]); }}
              title="New chat"
              style={{ width: "26px", height: "26px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "7px", color: "#475569", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ↺
            </button>
            <button onClick={() => setOpen(false)}
              style={{ width: "26px", height: "26px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "7px", color: "#475569", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ×
            </button>
          </div>

          {/* Context tip */}
          <div style={{ padding: "8px 14px", background: "rgba(37,99,235,0.07)", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
            <p style={{ fontSize: "11px", color: "rgba(56,189,248,0.75)", margin: 0, lineHeight: 1.5 }}>{tip}</p>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: "8px", alignItems: "flex-start" }}>
                {m.role === "assistant" && (
                  <div style={{ width: "22px", height: "22px", borderRadius: "7px", background: "linear-gradient(135deg, #1e3a5f, #0a1628)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                    <RobotIcon size={13} />
                  </div>
                )}
                <div style={{ maxWidth: "85%", padding: "9px 12px", borderRadius: m.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px", background: m.role === "user" ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "rgba(255,255,255,0.06)", border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)", color: "#f0f4f8", fontSize: "12px", lineHeight: 1.55, whiteSpace: "pre-wrap", boxShadow: m.role === "user" ? "0 2px 8px rgba(37,99,235,0.3)" : "none" }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "7px", background: "linear-gradient(135deg, #1e3a5f, #0a1628)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <RobotIcon size={13} />
                </div>
                <div style={{ padding: "9px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px 14px 14px 3px", display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0,1,2].map((i) => <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
              <textarea ref={inputRef} value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask LevelUP anything…"
                rows={1}
                style={{ flex: 1, minHeight: "34px", maxHeight: "80px", padding: "8px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#f0f4f8", fontSize: "13px", outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.4, boxSizing: "border-box" }}
                onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.5)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 80) + "px"; }}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                style={{ width: "34px", height: "34px", borderRadius: "10px", background: input.trim() ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "rgba(37,99,235,0.2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() ? "pointer" : "not-allowed", flexShrink: 0, boxShadow: input.trim() ? "0 0 12px rgba(37,99,235,0.4)" : "none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB — always visible */}
      <button onClick={() => open ? setOpen(false) : handleOpen()}
        title="LevelUP AI"
        style={{
          position: "fixed",
          bottom: bottomOffset,
          right,
          zIndex: 1000,
          width: "56px", height: "56px",
          borderRadius: "18px",
          background: open ? "rgba(6,9,16,0.9)" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
          border: "1px solid rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 0 24px rgba(37,99,235,0.4), 0 8px 20px rgba(0,0,0,0.4)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <RobotIcon size={26} />
        )}
      </button>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  );
}

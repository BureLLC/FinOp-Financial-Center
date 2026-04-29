"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const tickerData = [
  { symbol: "BTC", price: "$68,420", change: "+2.4%", up: true },
  { symbol: "ETH", price: "$3,841", change: "+1.8%", up: true },
  { symbol: "TSLA", price: "$248", change: "-1.2%", up: false },
  { symbol: "AAPL", price: "$189", change: "+0.9%", up: true },
  { symbol: "NVDA", price: "$875", change: "+3.1%", up: true },
  { symbol: "VOO", price: "$498", change: "+0.5%", up: true },
  { symbol: "BNB", price: "$412", change: "+1.1%", up: true },
  { symbol: "SPY", price: "$521", change: "+0.7%", up: true },
  { symbol: "MSFT", price: "$415", change: "+1.3%", up: true },
  { symbol: "AMZN", price: "$188", change: "+2.1%", up: true },
  { symbol: "SOL", price: "$142", change: "+4.2%", up: true },
  { symbol: "GOOGL", price: "$178", change: "+1.1%", up: true },
];

const features = [
  { icon: "↗", label: "Live Trading" },
  { icon: "₿", label: "Crypto" },
  { icon: "⚡", label: "Tax Engine" },
  { icon: "◎", label: "LevelUP AI" },
  { icon: "⊕", label: "Secured" },
];

export default function IntroPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoverBtn, setHoverBtn] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const s: Record<string, React.CSSProperties> = {
    root: {
      minHeight: "100vh",
      background: "#080b12",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    },
    grid: {
      position: "absolute",
      inset: 0,
      backgroundImage: `
        linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)
      `,
      backgroundSize: "64px 64px",
      pointerEvents: "none",
    },
    glow1: {
      position: "absolute",
      top: "10%",
      left: "50%",
      transform: "translateX(-50%)",
      width: "700px",
      height: "700px",
      background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 65%)",
      pointerEvents: "none",
    },
    glow2: {
      position: "absolute",
      bottom: "0",
      left: "20%",
      width: "400px",
      height: "400px",
      background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)",
      pointerEvents: "none",
    },
    ticker: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: "38px",
      background: "rgba(6,8,14,0.95)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
      zIndex: 200,
      backdropFilter: "blur(20px)",
    },
    tickerInner: {
      display: "flex",
      gap: "56px",
      animation: "ticker 35s linear infinite",
      whiteSpace: "nowrap",
      paddingLeft: "56px",
    },
    content: {
      flex: 1,
      paddingTop: "86px",
      paddingBottom: "48px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      zIndex: 10,
      padding: "86px 24px 48px",
    },
    robotWrap: {
      marginBottom: "20px",
      animation: "floatY 4s ease-in-out infinite",
      opacity: mounted ? 1 : 0,
      transition: "opacity 0.5s ease",
    },
    robot: {
      width: "76px",
      height: "76px",
      background: "linear-gradient(135deg, #111827, #0a0f1a)",
      border: "2px solid rgba(56,189,248,0.35)",
      borderRadius: "20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 0 30px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
      margin: "0 auto",
      position: "relative",
      overflow: "hidden",
    },
    poweredBy: {
      textAlign: "center",
      marginBottom: "28px",
      opacity: mounted ? 1 : 0,
      transition: "opacity 0.5s ease 0.1s",
    },
    heading: {
      textAlign: "center",
      marginBottom: "20px",
      opacity: mounted ? 1 : 0,
      transform: mounted ? "translateY(0)" : "translateY(16px)",
      transition: "all 0.6s ease 0.15s",
    },
    subtitle: {
      maxWidth: "500px",
      textAlign: "center",
      fontSize: "17px",
      lineHeight: 1.7,
      color: "#94a3b8",
      marginBottom: "28px",
      opacity: mounted ? 1 : 0,
      transition: "opacity 0.6s ease 0.25s",
    },
    pillsRow: {
      display: "flex",
      flexWrap: "wrap" as const,
      gap: "8px",
      justifyContent: "center",
      marginBottom: "40px",
      opacity: mounted ? 1 : 0,
      transition: "opacity 0.6s ease 0.35s",
    },
    previewRow: {
      display: "flex",
      gap: "16px",
      marginBottom: "44px",
      opacity: mounted ? 1 : 0,
      transition: "opacity 0.7s ease 0.45s",
      flexWrap: "wrap" as const,
      justifyContent: "center",
    },
    previewCard: {
      width: "230px",
      padding: "18px",
      background: "rgba(255,255,255,0.035)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "16px",
      backdropFilter: "blur(12px)",
    },
    cta: {
      opacity: mounted ? 1 : 0,
      transition: "opacity 0.7s ease 0.55s",
      textAlign: "center" as const,
    },
    enterBtn: {
      display: "inline-flex",
      flexDirection: "column" as const,
      alignItems: "center",
      padding: "18px 52px",
      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
      border: "1px solid rgba(56,189,248,0.3)",
      borderRadius: "14px",
      cursor: "pointer",
      boxShadow: hoverBtn
        ? "0 0 60px rgba(37,99,235,0.7), 0 0 120px rgba(37,99,235,0.25)"
        : "0 0 40px rgba(37,99,235,0.45), 0 0 80px rgba(37,99,235,0.15)",
      transform: hoverBtn ? "scale(1.04) translateY(-2px)" : "scale(1)",
      transition: "all 0.2s ease",
      animation: "pulseBlueShadow 2.5s ease-in-out infinite",
    },
  };

  return (
    <div style={s.root}>
      <div style={s.grid} />
      <div style={s.glow1} />
      <div style={s.glow2} />

      {/* Ticker */}
      <div style={s.ticker}>
        <div style={s.tickerInner}>
          {[...tickerData, ...tickerData].map((t, i) => (
            <span key={i} style={{ fontSize: "12px", display: "inline-flex", gap: "7px", alignItems: "center" }}>
              <span style={{ color: "#64748b", fontWeight: 700, letterSpacing: "0.05em" }}>{t.symbol}</span>
              <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{t.price}</span>
              <span style={{ color: t.up ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{t.change}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={s.content}>

        {/* LevelUP Robot */}
        <div style={s.robotWrap}>
          <div style={s.robot}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)", animation: "scanLine 2s linear infinite" }} />
            <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", gap: "9px", justifyContent: "center", marginBottom: "9px" }}>
                <div style={{ width: "11px", height: "11px", background: "#38bdf8", borderRadius: "3px", boxShadow: "0 0 8px rgba(56,189,248,0.8)", animation: "blink 2s ease-in-out infinite" }} />
                <div style={{ width: "11px", height: "11px", background: "#38bdf8", borderRadius: "3px", boxShadow: "0 0 8px rgba(56,189,248,0.8)", animation: "blink 2s ease-in-out infinite 0.3s" }} />
              </div>
              <div style={{ width: "26px", height: "3px", background: "rgba(56,189,248,0.5)", borderRadius: "2px", margin: "0 auto" }} />
            </div>
          </div>
        </div>

        {/* Powered by */}
        <div style={s.poweredBy}>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", color: "#38bdf8", textTransform: "uppercase" as const }}>
            POWERED BY LEVELUP AI
          </div>
          <div style={{ fontSize: "12px", color: "#475569", marginTop: "3px", letterSpacing: "0.03em" }}>
            Financial Intelligence Platform
          </div>
        </div>

        {/* Heading */}
        <div style={s.heading}>
          <h1 style={{ fontSize: "clamp(52px,9vw,96px)", fontWeight: 800, color: "#f8fafc", lineHeight: 1.05, letterSpacing: "-0.035em", margin: 0 }}>
            FinOps
          </h1>
          <h2 style={{
            fontSize: "clamp(44px,8vw,84px)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            margin: 0,
            background: "linear-gradient(135deg, #38bdf8 0%, #2563eb 60%, #7c3aed 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Financial Center
          </h2>
        </div>

        {/* Subtitle */}
        <p style={s.subtitle}>
          Your intelligent command center for trading, investing, crypto, taxes, and budgeting — all in one AI-powered platform.
        </p>

        {/* Feature pills */}
        <div style={s.pillsRow}>
          {features.map((f, i) => (
            <div key={i} style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 15px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "999px",
              fontSize: "13px",
              color: "#cbd5e1",
              fontWeight: 500,
              backdropFilter: "blur(8px)",
            }}>
              <span style={{ fontSize: "14px" }}>{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

        {/* Preview charts */}
        <div style={s.previewRow}>
          <div style={s.previewCard}>
            <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#475569", fontWeight: 700, marginBottom: "14px" }}>PORTFOLIO TREND</div>
            <svg viewBox="0 0 200 72" style={{ width: "100%", height: "72px" }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,58 C25,52 50,42 75,36 C100,30 125,46 150,28 C165,18 180,22 200,8 L200,72 L0,72Z" fill="url(#g1)" />
              <path d="M0,58 C25,52 50,42 75,36 C100,30 125,46 150,28 C165,18 180,22 200,8" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
              <path d="M0,66 C30,63 60,58 90,50 C120,42 155,36 200,28 L200,72 L0,72Z" fill="url(#g2)" />
              <path d="M0,66 C30,63 60,58 90,50 C120,42 155,36 200,28" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div style={s.previewCard}>
            <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#475569", fontWeight: 700, marginBottom: "14px" }}>MONTHLY P&amp;L</div>
            <svg viewBox="0 0 200 72" style={{ width: "100%", height: "72px" }}>
              {[18,30,22,42,28,52,38,58,44,62,48,66].map((h, i) => (
                <rect key={i} x={i * 16 + 2} y={72 - h} width="13" height={h}
                  fill={i % 3 === 0 ? "#2563eb" : i % 3 === 1 ? "#38bdf8" : "#7c3aed"}
                  opacity="0.75" rx="3" />
              ))}
            </svg>
          </div>
        </div>

        {/* CTA */}
        <div style={s.cta}>
          <button
            style={s.enterBtn}
            onMouseEnter={() => setHoverBtn(true)}
            onMouseLeave={() => setHoverBtn(false)}
            onClick={() => router.push("/dashboard")}
          >
            <span style={{ fontSize: "19px", fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
              Enter FinOps →
            </span>
          </button>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "10px" }}>
            <a href="/privacy" style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</a>
            <a href="/contact" style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textDecoration: "underline", cursor: "pointer" }}>Contact Us</a>
            <a href="/terms" style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textDecoration: "underline", cursor: "pointer" }}>Terms of Service</a>
          </div>
        </div>
      </div>

      {!isMobile && (
        <>
          <div style={{ position: "fixed", left: "28px", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "14px", zIndex: 20, opacity: mounted ? 1 : 0, transition: "opacity 1s ease 0.8s", animation: "floatCard 5s ease-in-out infinite" }}>
            <SideCard label="BTC" value="$68,420" change="+2.4%" up />
            <SideCard label="P&L" value="+$4,820" change="This Month" up accent />
          </div>
          <div style={{ position: "fixed", right: "28px", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "14px", zIndex: 20, opacity: mounted ? 1 : 0, transition: "opacity 1s ease 1s", animation: "floatCard 5s ease-in-out infinite 1.2s" }}>
            <SideCard label="ETH" value="$3,841" change="+1.8%" up />
            <SideCard label="TSLA" value="$248" change="-1.2%" up={false} />
          </div>
        </>
      )}
    </div>
  );
}

function SideCard({ label, value, change, up, accent }: {
  label: string; value: string; change: string; up: boolean; accent?: boolean;
}) {
  return (
    <div style={{
      padding: "14px 18px",
      background: "rgba(8,11,18,0.92)",
      border: `1px solid ${accent ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: "12px",
      backdropFilter: "blur(16px)",
      minWidth: "136px",
    }}>
      <div style={{ fontSize: "10px", color: "#475569", fontWeight: 700, letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: "19px", fontWeight: 700, color: accent ? "#38bdf8" : "#f8fafc", margin: "3px 0" }}>{value}</div>
      <div style={{ fontSize: "12px", color: up ? "#22c55e" : "#ef4444", fontWeight: 500 }}>{change}</div>
    </div>
  );
}

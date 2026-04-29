"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { group: "OVERVIEW", items: [
    { icon: "⊞", label: "Home",              path: "/dashboard" },
    { icon: "◈", label: "Financial Summary", path: "/dashboard/summary" },
  ]},
  { group: "MONEY", items: [
    { icon: "↑",  label: "Income",     path: "/dashboard/income" },
    { icon: "⊟",  label: "Budget",     path: "/dashboard/budget" },
    { icon: "◇",  label: "Savings",    path: "/dashboard/savings" },
    { icon: "✎",  label: "Write-Offs", path: "/dashboard/write-offs" },
    { icon: "⚡", label: "Tax Center", path: "/dashboard/tax" },
  ]},
  { group: "MARKETS", items: [
    { icon: "↗", label: "Investments", path: "/dashboard/investments" },
    { icon: "◎", label: "Trading",     path: "/dashboard/trading" },
  ]},
  { group: "ACTIVITY", items: [
    { icon: "≡",  label: "Transactions", path: "/dashboard/transactions" },
    { icon: "⇄",  label: "Connections",  path: "/dashboard/connections" },
    { icon: "🔔", label: "Alerts",       path: "/dashboard/alerts" },
  ]},
  { group: "AI & TOOLS", items: [
    { icon: "◉", label: "Ask LevelUP", path: "/dashboard/levelup" },
  ]},
  { group: "SYSTEM", items: [
    { icon: "⚙",  label: "Settings",       path: "/dashboard/settings" },
    { icon: "✉️", label: "Contact Support", path: "/contact" },
  ]},
];

const BOTTOM_NAV = [
  { icon: "⊞",  label: "Home",         path: "/dashboard" },
  { icon: "⊟",  label: "Budget",       path: "/dashboard/budget" },
  { icon: "≡",  label: "Transactions", path: "/dashboard/transactions" },
  { icon: "◎",  label: "Trading",      path: "/dashboard/trading" },
  { icon: "☰",  label: "More",         path: "__more__" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  screenSize: "mobile" | "tablet" | "desktop";
}

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse, screenSize }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const isMobile = screenSize === "mobile";

  const navigate = (path: string) => {
    if (path === "__more__") { setMoreOpen(true); return; }
    router.push(path);
    onClose();
    setMoreOpen(false);
  };

  if (isMobile) {
    return (
      <>
        {moreOpen && (
          <div onClick={() => setMoreOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 198, backdropFilter: "blur(4px)" }} />
        )}
        {moreOpen && (
          <div style={{ position: "fixed", bottom: "64px", left: 0, right: 0, zIndex: 199, background: "rgba(6,8,14,0.99)", borderTop: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px 20px 0 0", padding: "16px 16px 8px", maxHeight: "70vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ width: "36px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", margin: "0 auto 16px" }} />
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: "12px" }}>ALL SECTIONS</div>
            {NAV.map((section) => (
              <div key={section.group} style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#1e293b", letterSpacing: "0.14em", marginBottom: "6px" }}>{section.group}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {section.items.map((item) => {
                    const active = pathname === item.path;
                    return (
                      <button key={item.path} onClick={() => navigate(item.path)}
                        style={{ padding: "12px 14px", background: active ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${active ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", color: active ? "#38bdf8" : "#475569", fontSize: "13px", fontWeight: active ? 600 : 400, textAlign: "left" }}>
                        <span style={{ fontSize: "16px", flexShrink: 0 }}>{item.icon}</span>
                        <span style={{ fontSize: "12px" }}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: "rgba(6,8,14,0.97)", borderTop: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", display: "flex", alignItems: "stretch", height: "64px" }}>
          {BOTTOM_NAV.map((item) => {
            const active = item.path !== "__more__" && pathname === item.path;
            const isMore = item.path === "__more__";
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px", background: "transparent", border: "none", cursor: "pointer", color: active ? "#38bdf8" : isMore && moreOpen ? "#38bdf8" : "#475569", padding: "8px 0", position: "relative" }}>
                {active && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "24px", height: "2px", background: "#2563eb", borderRadius: "0 0 2px 2px" }} />}
                <span style={{ fontSize: "18px", lineHeight: 1 }}>{item.icon}</span>
                <span style={{ fontSize: "10px", fontWeight: active ? 700 : 400 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </>
    );
  }

  const sidebarW = collapsed ? 60 : 240;

  return (
    <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: `${sidebarW}px`, background: "rgba(6,8,14,0.97)", borderRight: "1px solid rgba(255,255,255,0.055)", backdropFilter: "blur(24px)", zIndex: 99, display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden", transition: "width 0.25s ease" }}>
      <div style={{ padding: collapsed ? "18px 0" : "18px 14px", borderBottom: "1px solid rgba(255,255,255,0.055)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: "10px" }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", background: "linear-gradient(135deg, #111827, #080b12)", border: "1.5px solid rgba(56,189,248,0.35)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 14px rgba(37,99,235,0.3)", flexShrink: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div style={{ display: "flex", gap: "3px" }}>
                  <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "2px" }} />
                  <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "2px" }} />
                </div>
                <div style={{ width: "12px", height: "2px", background: "rgba(56,189,248,0.5)", borderRadius: "1px" }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>FinOps</div>
              <div style={{ fontSize: "8px", color: "#38bdf8", letterSpacing: "0.14em", fontWeight: 700 }}>FINANCIAL CENTER</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ width: "34px", height: "34px", background: "linear-gradient(135deg, #111827, #080b12)", border: "1.5px solid rgba(56,189,248,0.35)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", gap: "3px" }}>
              <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "2px" }} />
              <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "2px" }} />
            </div>
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggleCollapse} style={{ width: "24px", height: "24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "6px", color: "#334155", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>‹</button>
        )}
      </div>

      {collapsed && (
        <button onClick={onToggleCollapse} style={{ margin: "8px auto", width: "36px", height: "28px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "6px", color: "#334155", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
      )}

      <nav style={{ flex: 1, padding: collapsed ? "8px 6px" : "10px 8px", overflowY: "auto" }}>
        {NAV.map((section) => (
          <div key={section.group} style={{ marginBottom: collapsed ? "8px" : "16px" }}>
            {!collapsed && <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", color: "#1e293b", padding: "0 8px", marginBottom: "3px" }}>{section.group}</div>}
            {section.items.map((item) => {
              const active = pathname === item.path;
              return (
                <button key={item.path} onClick={() => navigate(item.path)}
                  title={collapsed ? item.label : undefined}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: collapsed ? 0 : "8px", justifyContent: collapsed ? "center" : "flex-start", padding: collapsed ? "10px 0" : "7px 10px", borderRadius: "8px", border: "none", cursor: "pointer", background: active ? "rgba(37,99,235,0.14)" : "transparent", borderLeft: collapsed ? "none" : `2px solid ${active ? "#2563eb" : "transparent"}`, color: active ? "#e2e8f0" : "#4a5568", fontSize: "13px", fontWeight: active ? 600 : 400, textAlign: "left", transition: "all 0.15s ease", marginBottom: "1px", position: "relative" }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#94a3b8"; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4a5568"; } }}>
                  {active && collapsed && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: "3px", height: "20px", background: "#2563eb", borderRadius: "0 2px 2px 0" }} />}
                  <span style={{ fontSize: "16px", width: collapsed ? "auto" : "20px", textAlign: "center", flexShrink: 0, color: active ? "#38bdf8" : "inherit" }}>{item.icon}</span>
                  {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                  {!collapsed && active && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#2563eb", boxShadow: "0 0 6px rgba(37,99,235,0.8)" }} />}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.055)", flexShrink: 0 }}>
          <button onClick={() => navigate("/dashboard/levelup")}
            style={{ width: "100%", padding: "10px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.18)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "9px", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(37,99,235,0.14)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(37,99,235,0.08)"; }}>
            <div style={{ width: "28px", height: "28px", background: "linear-gradient(135deg, #111827, #080b12)", border: "1px solid rgba(56,189,248,0.3)", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "14px" }}>◉</span>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#e2e8f0" }}>LevelUP AI</div>
              <div style={{ fontSize: "10px", color: "#38bdf8" }}>Ask me anything</div>
            </div>
          </button>
        </div>
      )}

      {collapsed && (
        <div style={{ padding: "8px 6px", borderTop: "1px solid rgba(255,255,255,0.055)", flexShrink: 0 }}>
          <button onClick={() => navigate("/dashboard/levelup")} title="Ask LevelUP"
            style={{ width: "100%", padding: "10px 0", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.18)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <span style={{ fontSize: "16px" }}>◉</span>
          </button>
        </div>
      )}
    </aside>
  );
}

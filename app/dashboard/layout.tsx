"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import AlertDropdown from "../components/AlertDropdown";
import UserMenu from "../components/UserMenu";
import LevelUpAssistant from "../components/LevelUpAssistant";
import { createClient } from "../../src/lib/supabase";

type ScreenSize = "mobile" | "tablet" | "desktop";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [screenSize, setScreenSize] = useState<ScreenSize>("desktop");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 768) setScreenSize("mobile");
      else if (w < 1024) { setScreenSize("tablet"); setSidebarCollapsed(true); }
      else setScreenSize("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth"); return; }
      setAuthChecked(true);
    }
    checkAuth();
  }, [supabase, router]);

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: "#080b12", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", margin: "0 auto 16px", border: "2px solid rgba(37,99,235,0.3)", borderTop: "2px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: "13px", color: "#475569" }}>Loading FinOps...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isMobile = screenSize === "mobile";
  const isTablet = screenSize === "tablet";
  const sidebarWidth = isMobile ? 0 : sidebarCollapsed ? 60 : 240;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080b12" }}>
      {/* Sidebar — desktop and tablet only */}
      {!isMobile && (
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          screenSize={screenSize}
        />
      )}

      {/* Main content */}
      <div style={{
        flex: 1,
        marginLeft: isMobile ? 0 : `${sidebarWidth}px`,
        marginBottom: isMobile ? "64px" : 0,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        transition: "margin-left 0.3s ease",
        minWidth: 0,
      }}>
        {/* Header */}
        <header style={{
          height: isMobile ? "54px" : "62px",
          background: "rgba(6,8,14,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.055)",
          backdropFilter: "blur(20px)",
          display: "flex", alignItems: "center",
          padding: isMobile ? "0 12px" : "0 20px",
          gap: "10px",
          position: "sticky", top: 0, zIndex: 50, flexShrink: 0,
        }}>
          {/* Logo on mobile */}
          {isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <div style={{ width: "30px", height: "30px", background: "linear-gradient(135deg, #111827, #080b12)", border: "1.5px solid rgba(56,189,248,0.35)", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px rgba(37,99,235,0.3)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                  <div style={{ display: "flex", gap: "3px" }}>
                    <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "1px" }} />
                    <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "1px" }} />
                  </div>
                  <div style={{ width: "11px", height: "2px", background: "rgba(56,189,248,0.5)", borderRadius: "1px" }} />
                </div>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>FinOps</span>
            </div>
          )}

          {/* Search — hidden on mobile to save space */}
          {!isMobile && (
            <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
              <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#334155", fontSize: "13px", pointerEvents: "none" }}>⊕</span>
              <input placeholder="Search..."
                style={{ width: "100%", padding: "8px 14px 8px 32px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", color: "#e2e8f0", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
              />
            </div>
          )}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: isMobile ? "6px" : "10px" }}>
            {/* Back button */}
            <button onClick={() => window.history.back()} title="Go Back"
              style={{ width: isMobile ? "32px" : "34px", height: isMobile ? "32px" : "34px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", color: "#475569", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              ←
            </button>
            {/* Home button */}
            <button onClick={() => router.push("/dashboard")} title="Home"
              style={{ width: isMobile ? "32px" : "34px", height: isMobile ? "32px" : "34px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", color: "#475569", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              ⊞
            </button>
            <AlertDropdown />
            <UserMenu />
          </div>
        </header>

        {/* Page content */}
        <main style={{
          flex: 1,
          padding: isMobile ? "16px 12px" : "24px",
          overflowX: "hidden",
          maxWidth: "100%",
        }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={false}
          onToggleCollapse={() => {}}
          screenSize="mobile"
        />
      )}

    </div>
  );
}

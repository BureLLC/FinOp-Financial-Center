"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../../src/lib/supabase";

interface Alert {
  id: string;
  title: string;
  message: string;
  created_at: string;
  acknowledged_at: string | null;
  severity: string;
}

export default function AlertDropdown() {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadAlerts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("alerts")
      .select("id, title, message, created_at, acknowledged_at, severity")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setAlerts(data ?? []);
  };

  const dismissAlert = async (id: string) => {
    await supabase
      .from("alerts")
      .update({ acknowledged_at: new Date().toISOString(), status: "acknowledged" })
      .eq("id", id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const unreadCount = alerts.filter((a) => !a.acknowledged_at).length;

  const severityColor = (s: string) => {
    if (s === "critical") return "#ef4444";
    if (s === "high") return "#f59e0b";
    if (s === "medium") return "#38bdf8";
    return "#475569";
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "36px", height: "36px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "8px", color: "#64748b", fontSize: "15px",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0, transition: "all 0.15s ease",
          position: "relative",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#94a3b8"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#64748b"; }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: "-4px", right: "-4px",
            width: "16px", height: "16px",
            background: "#ef4444", borderRadius: "50%",
            fontSize: "10px", fontWeight: 700, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #080b12",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "44px", right: 0,
          width: "320px",
          background: "rgba(8,11,18,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          backdropFilter: "blur(20px)",
          zIndex: 200, overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>Alerts</span>
            {unreadCount > 0 && (
              <span style={{
                fontSize: "11px", color: "#ef4444", fontWeight: 600,
                background: "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: "99px",
              }}>
                {unreadCount} unread
              </span>
            )}
          </div>

          <div style={{ maxHeight: "340px", overflowY: "auto" }}>
            {alerts.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center", color: "#334155", fontSize: "13px" }}>
                No alerts
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  display: "flex", gap: "10px", alignItems: "flex-start",
                  background: !alert.acknowledged_at ? "rgba(37,99,235,0.04)" : "transparent",
                }}>
                  <div style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: severityColor(alert.severity),
                    marginTop: "5px", flexShrink: 0,
                    boxShadow: `0 0 6px ${severityColor(alert.severity)}`,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: alert.acknowledged_at ? "#475569" : "#e2e8f0", marginBottom: "3px" }}>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#334155", lineHeight: 1.4 }}>
                      {alert.message}
                    </div>
                    <div style={{ fontSize: "10px", color: "#1e293b", marginTop: "4px" }}>
                      {new Date(alert.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    style={{
                      background: "transparent", border: "none",
                      color: "#334155", cursor: "pointer", fontSize: "13px",
                      padding: "2px 4px", flexShrink: 0, transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}
                    title="Dismiss"
                  >✕</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

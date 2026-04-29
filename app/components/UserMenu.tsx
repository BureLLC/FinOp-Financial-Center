"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../src/lib/supabase";

export default function UserMenu() {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [initials, setInitials] = useState("?");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;
      const parts = user.email.split("@")[0].split(/[._-]/);
      if (parts.length >= 2) {
        setInitials((parts[0][0] + parts[1][0]).toUpperCase());
      } else {
        setInitials(parts[0].substring(0, 2).toUpperCase());
      }
    }
    loadUser();
  }, [supabase]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const menuItems = [
    { label: "Settings", icon: "⚙️", path: "/dashboard/settings" },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "36px", height: "36px",
          background: "linear-gradient(135deg, #2563eb, #38bdf8)",
          border: "none", borderRadius: "8px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", fontWeight: 800, color: "#fff",
          cursor: "pointer", flexShrink: 0, letterSpacing: "-0.01em",
        }}
      >
        {initials}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "44px", right: 0,
          width: "200px",
          background: "rgba(8,11,18,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          backdropFilter: "blur(20px)",
          zIndex: 200,
          overflow: "hidden",
        }}>
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => { router.push(item.path); setOpen(false); }}
              style={{
                width: "100%", padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", gap: "10px",
                color: "#94a3b8", fontSize: "13px",
                cursor: "pointer", textAlign: "left",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#e2e8f0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button
            onClick={handleSignOut}
            style={{
              width: "100%", padding: "12px 16px",
              background: "transparent", border: "none",
              display: "flex", alignItems: "center", gap: "10px",
              color: "#ef4444", fontSize: "13px",
              cursor: "pointer", textAlign: "left",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <span>🚪</span>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

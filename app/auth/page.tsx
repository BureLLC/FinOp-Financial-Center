"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../src/lib/supabase";

export default function AuthPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("login");
  const [method, setMethod] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [loading, setLoading] = useState(false);

  const showMsg = (msg: string, type: "error" | "success" = "error") => {
    setMessage(msg);
    setMessageType(type);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (method === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) showMsg(error.message);
        else showMsg("Magic link sent. Check your email to sign in.", "success");
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) { showMsg(error.message); return; }
        if (data.session) {
          router.push("/dashboard");
        } else {
          showMsg("Check your email to confirm your account, then sign in.", "success");
          setMode("login");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { showMsg(error.message); return; }
        router.push("/dashboard");
      }
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#080b12",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)`,
        backgroundSize: "64px 64px", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%", maxWidth: "420px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px", padding: "36px",
        backdropFilter: "blur(20px)",
        position: "relative", zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "52px", height: "52px", margin: "0 auto 14px",
            background: "linear-gradient(135deg, #111827, #080b12)",
            border: "1.5px solid rgba(56,189,248,0.35)", borderRadius: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 24px rgba(37,99,235,0.4)",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", gap: "5px", justifyContent: "center", marginBottom: "5px" }}>
                <div style={{ width: "7px", height: "7px", background: "#38bdf8", borderRadius: "2px", boxShadow: "0 0 6px rgba(56,189,248,0.8)" }} />
                <div style={{ width: "7px", height: "7px", background: "#38bdf8", borderRadius: "2px", boxShadow: "0 0 6px rgba(56,189,248,0.8)" }} />
              </div>
              <div style={{ width: "18px", height: "2px", background: "rgba(56,189,248,0.5)", borderRadius: "1px", margin: "0 auto" }} />
            </div>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>FinOps</div>
          <div style={{ fontSize: "11px", color: "#38bdf8", letterSpacing: "0.14em", fontWeight: 700 }}>FINANCIAL CENTER</div>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px",
          padding: "4px", marginBottom: "24px", gap: "4px",
        }}>
          {(["login", "signup"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setMessage(null); }}
              style={{
                flex: 1, padding: "8px", borderRadius: "7px", border: "none",
                background: mode === m ? "rgba(37,99,235,0.2)" : "transparent",
                color: mode === m ? "#38bdf8" : "#475569",
                fontSize: "13px", fontWeight: mode === m ? 600 : 400,
                cursor: "pointer", transition: "all 0.15s ease",
              }}>
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Method toggle */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {(["password", "magic"] as const).map((m) => (
            <button key={m} onClick={() => { setMethod(m); setMessage(null); }}
              style={{
                flex: 1, padding: "7px", borderRadius: "7px",
                background: method === m ? "rgba(255,255,255,0.06)" : "transparent",
                border: `1px solid ${method === m ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)"}`,
                color: method === m ? "#e2e8f0" : "#475569",
                fontSize: "12px", fontWeight: 500, cursor: "pointer",
                transition: "all 0.15s ease",
              }}>
              {m === "password" ? "🔑 Password" : "✉️ Magic Link"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", marginBottom: "6px" }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required
              style={{
                width: "100%", padding: "11px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "9px", color: "#f8fafc", fontSize: "14px",
                outline: "none", transition: "border-color 0.2s ease",
                boxSizing: "border-box",
              }}
              onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.5)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>

          {method === "password" && (
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", marginBottom: "6px" }}>
                PASSWORD
              </label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={8}
                style={{
                  width: "100%", padding: "11px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "9px", color: "#f8fafc", fontSize: "14px",
                  outline: "none", transition: "border-color 0.2s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.5)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{
              width: "100%", padding: "12px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              border: "1px solid rgba(56,189,248,0.25)",
              borderRadius: "9px", color: "#fff",
              fontSize: "14px", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.2s ease",
              boxShadow: "0 0 24px rgba(37,99,235,0.3)",
              marginTop: "4px",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = "0 0 40px rgba(37,99,235,0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 24px rgba(37,99,235,0.3)"; }}
          >
            {loading ? "Processing..." : mode === "signup" ? "Create Account" : method === "magic" ? "Send Magic Link" : "Sign In"}
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: "16px", padding: "12px 14px",
            background: messageType === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${messageType === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
            borderRadius: "8px", fontSize: "13px",
            color: messageType === "success" ? "#22c55e" : "#ef4444",
          }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "11px", color: "#334155" }}>
          Protected by 256-bit encryption · MFA required for financial connections
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../src/lib/supabase";

export default function MFAVerifyPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth"); return; }
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp?.[0];
      if (!totp) { router.push("/auth/mfa-setup"); return; }
      setFactorId(totp.id);
    }
    init();
  }, [supabase, router]);

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return;
    setLoading(true);
    setMessage(null);

    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError || !challenge) {
        setMessage("Failed to create challenge. Please try again.");
        setLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setCode("");
        if (newAttempts >= 3) {
          setShowHelp(true);
          setMessage("Multiple failed attempts. Please read the help below.");
        } else {
          setMessage(`Invalid code. ${3 - newAttempts} attempt${3 - newAttempts !== 1 ? "s" : ""} remaining before help is shown. Wait for the code to refresh and try again.`);
        }
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)`, backgroundSize: "64px 64px", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "400px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "28px", backdropFilter: "blur(20px)", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>🛡️</div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#f8fafc", margin: 0 }}>Two-Factor Verification</h1>
          <p style={{ color: "#475569", fontSize: "13px", marginTop: "6px" }}>Open your authenticator app and enter the 6-digit code for <strong style={{ color: "#38bdf8" }}>FinOps Financial Center</strong></p>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <input type="text" inputMode="numeric" value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setMessage(null); }}
            placeholder="000000" maxLength={6} autoFocus
            style={{ width: "100%", padding: "18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#f8fafc", fontSize: "28px", fontWeight: 700, letterSpacing: "0.4em", textAlign: "center", outline: "none", boxSizing: "border-box" }}
            onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.5)"}
            onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
          />
          <div style={{ fontSize: "11px", color: "#334155", textAlign: "center", marginTop: "8px" }}>⏱ Code refreshes every 30 seconds</div>
        </div>

        <button onClick={handleVerify} disabled={loading || code.length !== 6}
          style={{ width: "100%", padding: "13px", background: code.length === 6 ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "rgba(255,255,255,0.04)", border: `1px solid ${code.length === 6 ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.07)"}`, borderRadius: "9px", color: code.length === 6 ? "#fff" : "#475569", fontSize: "14px", fontWeight: 700, cursor: code.length === 6 && !loading ? "pointer" : "not-allowed", boxShadow: code.length === 6 ? "0 0 24px rgba(37,99,235,0.3)" : "none" }}>
          {loading ? "Verifying..." : "Verify & Enter FinOps →"}
        </button>

        {message && (
          <div style={{ marginTop: "14px", padding: "12px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", fontSize: "12px", color: "#ef4444", lineHeight: 1.6 }}>
            ⚠️ {message}
          </div>
        )}

        {showHelp && (
          <div style={{ marginTop: "14px", padding: "14px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "10px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b", marginBottom: "8px" }}>Having trouble? Try these steps:</div>
            <div style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.8 }}>
              1. Make sure you selected <strong style={{ color: "#94a3b8" }}>FinOps Financial Center</strong> in your authenticator app — not another account<br/>
              2. Go to iPhone Settings → General → Date & Time → enable <strong style={{ color: "#94a3b8" }}>Set Automatically</strong><br/>
              3. Wait for the code to fully refresh (watch the timer circle reset)<br/>
              4. Enter the new code immediately after it refreshes
            </div>
            <button onClick={() => { supabase.auth.signOut(); router.push("/auth"); }}
              style={{ width: "100%", marginTop: "10px", padding: "9px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#ef4444", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              Sign Out & Try Different Account
            </button>
            <div style={{ marginTop: "8px", textAlign: "center" }}>
              <a href="mailto:contact@burellc.com" style={{ fontSize: "11px", color: "#475569", textDecoration: "none" }}>
                Still having trouble? Contact support →
              </a>
            </div>
          </div>
        )}

        {!showHelp && (
          <button onClick={() => { supabase.auth.signOut(); router.push("/auth"); }}
            style={{ width: "100%", marginTop: "14px", padding: "10px", background: "transparent", border: "none", color: "#334155", fontSize: "12px", cursor: "pointer" }}>
            Sign out and use a different account
          </button>
        )}
      </div>
    </div>
  );
}

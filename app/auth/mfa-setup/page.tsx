"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../src/lib/supabase";

export default function MFASetupPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => { startEnroll(); }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    setMessage(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/auth"); return; }

    // Unenroll any existing unverified factors first
    const { data: existing } = await supabase.auth.mfa.listFactors();
    const unverified = existing?.totp?.filter((f: {status: string}) => f.status === "unverified") ?? [];
    for (const f of unverified) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }

    // Check if already verified — redirect to verify page
    const verified = existing?.totp?.filter((f: {status: string}) => f.status === "verified") ?? [];
    if (verified.length > 0) {
      router.push("/auth/mfa-verify");
      return;
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "FinOps Authenticator",
    });

    if (error || !data) {
      setMessage("Failed to generate setup. Error: " + (error?.message ?? "unknown"));
      setEnrolling(false);
      return;
    }

    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setEnrolling(false);
  };

  const copySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return;
    setLoading(true);
    setMessage(null);

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setMessage("Failed to create challenge: " + (challengeError?.message ?? "unknown"));
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
        setMessage("Multiple failures. Switch to Manual Entry tab, copy the key into your authenticator app, then try again. Make sure your phone time is set to Automatic.");
      } else {
        setMessage(`Invalid code (attempt ${newAttempts}/3). Wait for the timer to reset in your authenticator app and try the new code.`);
      }
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  const s: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "9px", color: "#e2e8f0", fontSize: "13px",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "460px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "28px", backdropFilter: "blur(20px)" }}>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔐</div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#f8fafc", margin: 0 }}>Set Up Two-Factor Auth</h1>
          <p style={{ color: "#475569", fontSize: "13px", marginTop: "6px" }}>Required to protect your financial account</p>
        </div>

        {enrolling ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#475569" }}>
            <div style={{ width: "32px", height: "32px", border: "2px solid rgba(37,99,235,0.3)", borderTop: "2px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            Generating secure setup...
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <>
            {/* Step 1 — Install app */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px", marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.1em", marginBottom: "8px" }}>STEP 1 — INSTALL AUTHENTICATOR APP</div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 10px" }}>Download one of these free apps on your phone:</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {["Google Authenticator", "Authy", "Microsoft Authenticator"].map((app) => (
                  <span key={app} style={{ fontSize: "10px", padding: "3px 8px", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "99px", color: "#38bdf8" }}>{app}</span>
                ))}
              </div>
            </div>

            {/* Step 2 — Add account */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px", marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.1em", marginBottom: "10px" }}>STEP 2 — ADD YOUR ACCOUNT</div>

              {/* Tab toggle */}
              <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "3px", marginBottom: "14px" }}>
                {[{ key: false, label: "📷 Scan QR Code" }, { key: true, label: "⌨️ Manual Entry" }].map((tab) => (
                  <button key={String(tab.key)} onClick={() => setShowManual(tab.key)}
                    style={{ flex: 1, padding: "7px", borderRadius: "6px", border: "none", cursor: "pointer", background: showManual === tab.key ? "rgba(37,99,235,0.2)" : "transparent", color: showManual === tab.key ? "#38bdf8" : "#475569", fontSize: "12px", fontWeight: showManual === tab.key ? 700 : 400 }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {!showManual ? (
                <>
                  <div style={{ padding: "10px 12px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", marginBottom: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 600, marginBottom: "2px" }}>📱 Setting up on this phone?</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>You cannot scan a QR code that is on your own screen. Use the <strong style={{ color: "#f59e0b" }}>Manual Entry</strong> tab instead.</div>
                  </div>
                  {qrCode && (
                    <div style={{ textAlign: "center", background: "#fff", borderRadius: "8px", padding: "12px" }}>
                      <img src={qrCode} alt="MFA QR Code" style={{ width: "160px", height: "160px" }} />
                    </div>
                  )}
                  <p style={{ fontSize: "11px", color: "#334155", textAlign: "center", marginTop: "8px", margin: "8px 0 0" }}>
                    Open your authenticator app → tap + → Scan QR code
                  </p>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.7 }}>
                    In your authenticator app:<br/>
                    <strong style={{ color: "#94a3b8" }}>1.</strong> Tap the <strong style={{ color: "#94a3b8" }}>+</strong> button<br/>
                    <strong style={{ color: "#94a3b8" }}>2.</strong> Select <strong style={{ color: "#94a3b8" }}>"Enter a setup key"</strong> or <strong style={{ color: "#94a3b8" }}>"Manual entry"</strong><br/>
                    <strong style={{ color: "#94a3b8" }}>3.</strong> Account name: <strong style={{ color: "#38bdf8" }}>FinOps Financial Center</strong><br/>
                    <strong style={{ color: "#94a3b8" }}>4.</strong> Copy and paste the key below:<br/>
                    <strong style={{ color: "#94a3b8" }}>5.</strong> Select <strong style={{ color: "#94a3b8" }}>Time-based (TOTP)</strong>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "13px", color: "#f8fafc", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", wordBreak: "break-all", letterSpacing: "0.05em" }}>
                    {secret}
                  </div>
                  <button onClick={copySecret}
                    style={{ width: "100%", padding: "11px", background: copied ? "rgba(34,197,94,0.15)" : "rgba(37,99,235,0.15)", border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(37,99,235,0.3)"}`, borderRadius: "8px", color: copied ? "#22c55e" : "#38bdf8", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                    {copied ? "✓ Copied to Clipboard!" : "📋 Copy Setup Key"}
                  </button>
                </div>
              )}
            </div>

            {/* Step 3 — Enter code */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px", marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.1em", marginBottom: "8px" }}>STEP 3 — ENTER 6-DIGIT CODE</div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px" }}>After adding the account to your authenticator app, enter the 6-digit code it shows for FinOps.</p>
              <input type="text" inputMode="numeric" value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setMessage(null); }}
                placeholder="000000" maxLength={6}
                style={{ ...s, fontSize: "22px", fontWeight: 700, letterSpacing: "0.3em", textAlign: "center", padding: "14px" }}
                onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.5)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
              />
            </div>

            {message && (
              <div style={{ marginBottom: "14px", padding: "12px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", fontSize: "12px", color: "#ef4444", lineHeight: 1.6 }}>
                ⚠️ {message}
                {attempts >= 3 && (
                  <div style={{ marginTop: "8px" }}>
                    <button onClick={startEnroll} style={{ fontSize: "12px", color: "#38bdf8", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                      Generate a new setup key →
                    </button>
                  </div>
                )}
              </div>
            )}

            <button onClick={handleVerify} disabled={loading || code.length !== 6}
              style={{ width: "100%", padding: "13px", background: code.length === 6 ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "rgba(255,255,255,0.04)", border: `1px solid ${code.length === 6 ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.07)"}`, borderRadius: "9px", color: code.length === 6 ? "#fff" : "#475569", fontSize: "14px", fontWeight: 700, cursor: code.length === 6 && !loading ? "pointer" : "not-allowed", boxShadow: code.length === 6 ? "0 0 24px rgba(37,99,235,0.3)" : "none" }}>
              {loading ? "Verifying..." : "Activate & Enter FinOps →"}
            </button>

            <div style={{ marginTop: "14px", padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", fontSize: "11px", color: "#334155", lineHeight: 1.6 }}>
              ⏱ Codes refresh every 30 seconds. If a code fails, wait for it to refresh and try the new code. Ensure your phone time is set to automatic.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

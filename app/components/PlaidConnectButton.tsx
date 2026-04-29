"use client";
import { useEffect, useMemo, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { createClient } from "../../src/lib/supabase";

interface Props {
  onSuccess?: () => void;
  onExit?: () => void;
}

export default function PlaidConnectButton({ onSuccess, onExit }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exchanging, setExchanging] = useState(false);
  const [success, setSuccess] = useState(false);

  const { open, ready } = usePlaidLink({
    token: linkToken ?? "",
    onSuccess: async (public_token, metadata) => {
      try {
        setExchanging(true);
        setMessage("Saving your connection...");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { setMessage("Session error. Please log in again."); return; }

        const response = await fetch(
          "https://hxaxmhtkzmfjtaqtcbvk.supabase.co/functions/v1/plaid-exchange-token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              public_token,
              institution_name: metadata?.institution?.name ?? null,
              institution_id: metadata?.institution?.institution_id ?? null,
            }),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          setMessage(data?.error ?? "Failed to save connection. Please try again.");
          return;
        }

        setSuccess(true);
        setMessage("✅ Bank connected successfully!");
        onSuccess?.();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Unknown error.");
      } finally {
        setExchanging(false);
      }
    },
    onExit: (err) => {
      if (err) setMessage(err.display_message ?? err.error_message ?? "Plaid exited with an error.");
      onExit?.();
    },
  });

  // Get link token on mount
  useEffect(() => {
    const getLinkToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { setMessage("No session found. Please log in."); setLoading(false); return; }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) { setMessage("User not found."); setLoading(false); return; }

        const response = await fetch(
          "https://hxaxmhtkzmfjtaqtcbvk.supabase.co/functions/v1/plaid-create-link-token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ user_id: user.id }),
          }
        );

        const data = await response.json();
        if (!response.ok || !data?.link_token) {
          setMessage("Failed to initialize Plaid. Please try again.");
          setLoading(false);
          return;
        }

        sessionStorage.setItem("plaid_link_token", data.link_token);
        setLinkToken(data.link_token);
        setLoading(false);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Unknown error.");
        setLoading(false);
      }
    };
    getLinkToken();
  }, []);

  // Auto-open Plaid Link when ready
  useEffect(() => {
    if (ready && linkToken && !success) {
      open();
    }
  }, [ready, linkToken]);

  return (
    <div style={{ textAlign: "center" }}>
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "20px" }}>
          <div style={{ width: "32px", height: "32px", border: "2px solid rgba(37,99,235,0.3)", borderTop: "2px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: "13px", color: "#475569" }}>Initializing secure connection...</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {exchanging && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "20px" }}>
          <div style={{ width: "32px", height: "32px", border: "2px solid rgba(34,197,94,0.3)", borderTop: "2px solid #22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: "13px", color: "#22c55e" }}>Saving your bank connection...</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {success && (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#22c55e", marginBottom: "6px" }}>Bank Connected!</div>
          <div style={{ fontSize: "13px", color: "#475569" }}>Your account has been linked successfully. Your transactions will sync shortly.</div>
        </div>
      )}

      {message && !exchanging && !success && (
        <div style={{ marginTop: "12px", padding: "12px 14px", background: message.includes("✅") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${message.includes("✅") ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: "8px", fontSize: "13px", color: message.includes("✅") ? "#22c55e" : "#ef4444", lineHeight: 1.5 }}>
          {message}
        </div>
      )}

      {!loading && !exchanging && !success && linkToken && !message && (
        <div>
          <div style={{ fontSize: "13px", color: "#475569", marginBottom: "12px" }}>
            The Plaid connection window should open automatically. If it did not:
          </div>
          <button onClick={() => open()} disabled={!ready}
            style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
            Open Plaid Connection
          </button>
        </div>
      )}

      {!loading && !exchanging && !success && message && !message.includes("✅") && (
        <button onClick={() => { setMessage(null); setLinkToken(null); setLoading(true); }}
          style={{ marginTop: "12px", width: "100%", padding: "10px", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: "9px", color: "#38bdf8", fontSize: "13px", cursor: "pointer" }}>
          Try Again
        </button>
      )}
    </div>
  );
}

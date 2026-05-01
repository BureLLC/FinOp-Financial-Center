"use client";

import { useEffect, useMemo, useState } from "react";
import PlaidConnectButton from "../../components/PlaidConnectButton";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../../src/lib/supabase";
import { functionBase } from "../../../src/lib/function-base";

interface Connection {
  id: string;
  provider: string;
  institution_name: string;
  status: string;
  connection_status: string;
  sync_status: string;
  last_synced: string | null;
  created_at: string;
}

interface Account {
  id: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  current_balance: number;
  available_balance: number;
  mask: string;
  account_currency: string;
  integration_connection_id: string;
}

const PROVIDERS = [
  {
    id: "plaid",
    name: "Banks & Credit Unions",
    subtitle: "10,000+ institutions",
    icon: "🏦",
    color: "#38bdf8",
    rgb: "56,189,248",
    description: "Connect checking, savings, credit cards via Plaid",
    available: true,
  },
  {
    id: "snaptrade",
    name: "Brokerages",
    subtitle: "Fidelity, Schwab, IBKR & more",
    icon: "📈",
    color: "#22c55e",
    rgb: "34,197,94",
    description: "Connect brokerages, Coinbase, Binance & 15,000+ institutions via SnapTrade",
    available: true,

  },
  {
    id: "csv",
    name: "CSV Import",
    subtitle: "Manual upload",
    icon: "📂",
    color: "#a855f7",
    rgb: "168,85,247",
    description: "Import transactions from a CSV file",
    available: false,
    comingSoon: true,
  },
];

export default function ConnectionsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [mfaGate, setMfaGate] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null);
  const [showPlaid, setShowPlaid] = useState(false);
  const [snapTradeLoading, setSnapTradeLoading] = useState(false);
  const [snapTradeMessage, setSnapTradeMessage] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const status = searchParams.get("status");
    const authorizationId = searchParams.get("authorizationId") ?? searchParams.get("connection_id");
    if (status === "SUCCESS" && authorizationId) {
      saveSnapTradeConnection(authorizationId);
    }
  }, [searchParams]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [connRes, acctRes] = await Promise.all([
      supabase
        .from("integration_connections")
        .select("id, provider, institution_name, status, connection_status, sync_status, last_synced, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("financial_accounts")
        .select("id, account_name, account_type, account_subtype, current_balance, available_balance, mask, account_currency, integration_connection_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .is("deleted_at", null),
    ]);

    setConnections(connRes.data ?? []);
    setAccounts(acctRes.data ?? []);
    setLoading(false);
  };

  const checkMFAAndConnect = async (provider: typeof PROVIDERS[0]) => {
    if (!provider.available) return;

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasMFA = factors?.totp && factors.totp.length > 0;

    if (!hasMFA) {
      setMfaGate(true);
      return;
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") {
      router.push("/auth/mfa-verify");
      return;
    }


    if (provider.id === "snaptrade") {
      setSnapTradeLoading(true);
      setSnapTradeMessage(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const headers = {
          "Content-Type": "application/json",
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          "Authorization": `Bearer ${session.access_token}`,
        };
        const regRes = await fetch(`${functionBase}/snaptrade-connect`, { method: "POST", headers, body: JSON.stringify({ action: "register" }) });
        const regData = await regRes.json();
        if (!regRes.ok) { setSnapTradeMessage(regData?.error ?? "Failed to register."); setSnapTradeLoading(false); return; }
        const userSecret = regData?.userSecret;
        if (!userSecret) { setSnapTradeMessage("SnapTrade registration incomplete."); setSnapTradeLoading(false); return; }
        const portalRes = await fetch(`${functionBase}/snaptrade-connect`, { method: "POST", headers, body: JSON.stringify({ action: "portal", userSecret }) });
        const portalData = await portalRes.json();
        if (!portalRes.ok || !portalData?.redirectURL) { setSnapTradeMessage(portalData?.error ?? "Failed to open portal."); setSnapTradeLoading(false); return; }
        window.location.href = portalData.redirectURL;
      } catch { setSnapTradeMessage("Connection error. Please try again."); }
      finally { setSnapTradeLoading(false); }
      return;
    }
    if (provider.id === "plaid") { setShowPlaid(true); return; }


  };
  const saveSnapTradeConnection = async (authorizationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch(
        `${functionBase}/snaptrade-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ authorizationId }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setSyncMessage("Brokerage connected successfully!");
        setTimeout(() => { loadData(); setSyncMessage(null); }, 2000);
      } else {
        setSyncMessage(data?.error ?? "Failed to save brokerage connection.");
      }
    } catch { setSyncMessage("Connection error. Please try again."); }
  };


  const handleSync = async (connectionId: string) => {
    setSyncing(true);
    setSyncMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${functionBase}/orchestrate-refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (response.ok) {
        setSyncMessage("Sync started. Refreshing in a moment...");
        setTimeout(() => { loadData(); setSyncMessage(null); }, 6000);
      } else {
        setSyncMessage("Sync failed. Please try again.");
      }
    } catch {
      setSyncMessage("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };


  const updateConnectionState = async (connectionId: string, mode: "unsync" | "disconnect" | "delete") => {
    const now = new Date().toISOString();
    if (mode === "delete") {
      await supabase.from("financial_accounts").update({ is_active: false, updated_at: now }).eq("integration_connection_id", connectionId);
      await supabase.from("integration_connections").update({ status: "deleted", connection_status: "deleted", sync_status: "never", updated_at: now }).eq("id", connectionId);
    } else if (mode === "disconnect") {
      await supabase.from("integration_connections").update({ status: "inactive", connection_status: "disconnected", sync_status: "never", updated_at: now }).eq("id", connectionId);
      await supabase.from("financial_accounts").update({ is_active: false, updated_at: now }).eq("integration_connection_id", connectionId);
    } else {
      await supabase.from("integration_connections").update({ sync_status: "never", updated_at: now }).eq("id", connectionId);
    }
    setSyncMessage(`${mode} complete. Recalculating totals...`);
    await loadData();
  };

  const syncStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      synced:     { label: "Synced",     color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
      pending:    { label: "Pending",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
      syncing:    { label: "Syncing",    color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
      error:      { label: "Error",      color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
      never:      { label: "Never synced", color: "#475569", bg: "rgba(71,85,105,0.1)" },
    };
    const s = map[status] ?? map.never;
    return (
      <span style={{
        fontSize: "11px", fontWeight: 600,
        color: s.color, background: s.bg,
        padding: "3px 8px", borderRadius: "99px",
        border: `1px solid ${s.color}33`,
      }}>{s.label}</span>
    );
  };

  const accountsForConnection = (connectionId: string) => accounts.filter((a: Account) => a.integration_connection_id === connectionId);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Page header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          Financial Connections
        </h1>
        <p style={{ color: "#475569", fontSize: "13.5px", margin: 0 }}>
          Connect your banks, brokerages, and crypto accounts to sync your complete financial picture.
        </p>
      </div>

      {/* MFA Gate Banner */}
      {mfaGate && (
        <div style={{
          marginBottom: "24px",
          padding: "18px 20px",
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: "12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "12px",
        }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#f59e0b", marginBottom: "3px" }}>
              🔐 Two-Factor Authentication Required
            </div>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              MFA must be enabled to connect financial institutions. This protects your accounts.
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => router.push("/auth/mfa-setup")}
              style={{
                padding: "9px 18px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                border: "none", borderRadius: "8px",
                color: "#000", fontSize: "13px", fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Set Up MFA Now →
            </button>
            <button
              onClick={() => setMfaGate(false)}
              style={{
                padding: "9px 14px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px", color: "#475569",
                fontSize: "13px", cursor: "pointer",
              }}
            >Dismiss</button>
          </div>
        </div>
      )}

      {/* Provider Grid */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "12px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "16px" }}>
          CONNECT A PROVIDER
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px" }}>
          {PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              onClick={() => checkMFAAndConnect(provider)}
              onMouseEnter={() => setHoveredProvider(provider.id)}
              onMouseLeave={() => setHoveredProvider(null)}
              style={{
                padding: "24px 20px",
                background: hoveredProvider === provider.id && provider.available
                  ? `rgba(${provider.rgb},0.08)`
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${hoveredProvider === provider.id && provider.available
                  ? `rgba(${provider.rgb},0.35)`
                  : "rgba(255,255,255,0.07)"}`,
                borderRadius: "16px",
                cursor: provider.available ? "pointer" : "default",
                transition: "all 0.2s ease",
                position: "relative",
                overflow: "hidden",
                transform: hoveredProvider === provider.id && provider.available ? "translateY(-3px)" : "translateY(0)",
                boxShadow: hoveredProvider === provider.id && provider.available
                  ? `0 8px 32px rgba(${provider.rgb},0.15)`
                  : "none",
              }}
            >
              {/* Glow effect */}
              {hoveredProvider === provider.id && provider.available && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                  background: `linear-gradient(90deg, transparent, rgba(${provider.rgb},0.8), transparent)`,
                }} />
              )}

              {/* Coming soon badge */}
              {provider.comingSoon && (
                <div style={{
                  position: "absolute", top: "12px", right: "12px",
                  fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em",
                  color: "#475569", background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  padding: "2px 7px", borderRadius: "99px",
                }}>SOON</div>
              )}

              {/* Icon */}
              <div style={{
                width: "52px", height: "52px",
                background: `rgba(${provider.rgb},0.1)`,
                border: `1px solid rgba(${provider.rgb},0.2)`,
                borderRadius: "14px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "24px", marginBottom: "14px",
                boxShadow: hoveredProvider === provider.id && provider.available
                  ? `0 0 20px rgba(${provider.rgb},0.3)`
                  : "none",
                transition: "box-shadow 0.2s ease",
              }}>
                {provider.icon}
              </div>

              <div style={{ fontSize: "14px", fontWeight: 700, color: provider.available ? "#f8fafc" : "#475569", marginBottom: "4px" }}>
                {provider.name}
              </div>
              <div style={{ fontSize: "11.5px", color: provider.available ? `rgba(${provider.rgb},0.8)` : "#334155", marginBottom: "8px", fontWeight: 500 }}>
                {provider.subtitle}
              </div>
              <div style={{ fontSize: "11px", color: "#334155", lineHeight: 1.4 }}>
                {provider.description}
              </div>

              {provider.available && (
                <div style={{
                  marginTop: "16px",
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  fontSize: "12px", fontWeight: 600,
                  color: `rgba(${provider.rgb},0.9)`,
                }}>
                  Connect → 
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Connected Institutions */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "12px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>
            CONNECTED INSTITUTIONS ({connections.length})
          </h2>
          {syncMessage && (
            <span style={{ fontSize: "12px", color: "#38bdf8" }}>{syncMessage}</span>
          )}
        </div>

        {loading ? (
          <div style={{
            padding: "40px", textAlign: "center", color: "#334155", fontSize: "13px",
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "12px",
          }}>
            Loading connections...
          </div>
        ) : connections.length === 0 ? (
          <div style={{
            padding: "48px", textAlign: "center",
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "12px",
          }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🏦</div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
              No accounts connected yet
            </div>
            <div style={{ fontSize: "13px", color: "#334155" }}>
              Connect a financial institution above to start syncing your data.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {connections.map((conn) => {
              const connAccounts = accountsForConnection(conn.id);
              return (
                <div key={conn.id} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "14px",
                  overflow: "hidden",
                }}>
                  {/* Connection header */}
                  <div style={{
                    padding: "18px 20px",
                    borderBottom: connAccounts.length > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    display: "flex", alignItems: "center", gap: "14px",
                    flexWrap: "wrap",
                  }}>
                    <div style={{
                      width: "42px", height: "42px",
                      background: "rgba(56,189,248,0.1)",
                      border: "1px solid rgba(56,189,248,0.2)",
                      borderRadius: "11px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "20px", flexShrink: 0,
                    }}>🏦</div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc", marginBottom: "3px" }}>
                        {conn.institution_name ?? conn.provider}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", color: "#334155", textTransform: "capitalize" }}>
                          via {conn.provider}
                        </span>
                        <span style={{ color: "#1e293b" }}>·</span>
                        {syncStatusBadge(conn.sync_status)}
                        {conn.last_synced && (
                          <>
                            <span style={{ color: "#1e293b" }}>·</span>
                            <span style={{ fontSize: "11px", color: "#334155" }}>
                              Last synced {new Date(conn.last_synced).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSync(conn.id)}
                      disabled={syncing}
                      style={{
                        padding: "8px 16px",
                        background: "rgba(37,99,235,0.1)",
                        border: "1px solid rgba(37,99,235,0.2)",
                        borderRadius: "8px", color: "#38bdf8",
                        fontSize: "12px", fontWeight: 600,
                        cursor: syncing ? "not-allowed" : "pointer",
                        transition: "all 0.15s ease",
                        opacity: syncing ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(37,99,235,0.18)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(37,99,235,0.1)"; }}
                    >
                      {syncing ? "Syncing..." : "⟳ Sync Now"}
                    </button>
                    <button onClick={() => updateConnectionState(conn.id, "unsync")} style={{ padding:"8px 12px", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:"8px", color:"#f59e0b", fontSize:"12px" }}>Unsync</button>
                    <button onClick={() => updateConnectionState(conn.id, "disconnect")} style={{ padding:"8px 12px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"8px", color:"#ef4444", fontSize:"12px" }}>Disconnect</button>
                    <button onClick={() => updateConnectionState(conn.id, "delete")} style={{ padding:"8px 12px", background:"rgba(127,29,29,0.25)", border:"1px solid rgba(239,68,68,0.35)", borderRadius:"8px", color:"#fca5a5", fontSize:"12px" }}>Delete</button>
                  </div>

                  {/* Accounts under this connection */}
                  {connAccounts.length > 0 && (
                    <div style={{ padding: "12px 20px 16px" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#1e293b", letterSpacing: "0.1em", marginBottom: "10px" }}>
                        ACCOUNTS
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {connAccounts.map((acct) => (
                          <div key={acct.id} style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "10px 14px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.04)",
                            borderRadius: "9px",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{
                                width: "7px", height: "7px", borderRadius: "50%",
                                background: acct.account_type === "credit" ? "#ef4444" : "#22c55e",
                                boxShadow: `0 0 6px ${acct.account_type === "credit" ? "rgba(239,68,68,0.6)" : "rgba(34,197,94,0.6)"}`,
                              }} />
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 500, color: "#e2e8f0" }}>
                                  {acct.account_name}
                                  {acct.mask && <span style={{ color: "#334155", marginLeft: "6px" }}>•••• {acct.mask}</span>}
                                </div>
                                <div style={{ fontSize: "11px", color: "#334155", textTransform: "capitalize" }}>
                                  {acct.account_subtype ?? acct.account_type}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
                                {fmt(acct.current_balance)}
                              </div>
                              {acct.available_balance !== null && acct.available_balance !== acct.current_balance && (
                                <div style={{ fontSize: "11px", color: "#334155" }}>
                                  {fmt(acct.available_balance)} available
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {showPlaid && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} onClick={() => setShowPlaid(false)}>
          <div style={{ width: "100%", maxWidth: "440px", background: "rgba(8,11,18,0.99)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "28px", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: 0 }}>Connect Your Bank</h2>
                <p style={{ fontSize: "12px", color: "#475569", margin: "4px 0 0" }}>Securely connect via Plaid — we never store your credentials</p>
              </div>
              <button onClick={() => setShowPlaid(false)} style={{ width: "28px", height: "28px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "7px", color: "#475569", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <PlaidConnectButton />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

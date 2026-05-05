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

interface PositionCount {
  financial_account_id: string;
  count: number;
}

/** Derive brokerage connection health from child data */
function deriveBrokerageStatus(conn: Connection, connAccounts: Account[], positionCounts: PositionCount[]): {
  label: string;
  color: string;
  bg: string;
  warning?: string;
} {
  if (conn.provider !== "snaptrade") {
    // Non-brokerage connections use sync_status directly
    const map: Record<string, { label: string; color: string; bg: string }> = {
      synced:  { label: "Synced", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
      pending: { label: "Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
      syncing: { label: "Syncing", color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
      error:   { label: "Error", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
      never:   { label: "Never synced", color: "#475569", bg: "rgba(71,85,105,0.1)" },
    };
    return map[conn.sync_status] ?? map.never;
  }

  // Brokerage: derive from child data health
  if (conn.sync_status === "error") {
    return { label: "Sync Error", color: "#ef4444", bg: "rgba(239,68,68,0.1)", warning: "Last sync encountered an error" };
  }
  if (conn.sync_status === "syncing" || conn.sync_status === "pending") {
    return { label: "Syncing…", color: "#38bdf8", bg: "rgba(56,189,248,0.1)" };
  }
  if (connAccounts.length === 0) {
    if (conn.sync_status === "never") {
      return { label: "Pending Sync", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", warning: "Connection exists but accounts have not been synced yet" };
    }
    return { label: "No Accounts", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", warning: "Brokerage returned no accounts — try re-syncing" };
  }

  // Check position health across accounts
  const posCountMap = new Map(positionCounts.map(p => [p.financial_account_id, p.count]));
  const acctIds = connAccounts.map(a => a.id);
  const withPositions = acctIds.filter(id => (posCountMap.get(id) ?? 0) > 0).length;
  const missingPositions = acctIds.length - withPositions;

  if (withPositions > 0 && missingPositions === 0) {
    return { label: "Synced", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
  }
  if (withPositions > 0 && missingPositions > 0) {
    return { label: "Partial", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", warning: `${missingPositions} account(s) missing positions` };
  }
  // No positions at all
  const hasBalance = connAccounts.some(a => (a.current_balance ?? 0) > 0);
  if (hasBalance) {
    return { label: "No Positions", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", warning: "Accounts synced but positions not yet available — using balance fallback" };
  }
  return { label: "Missing Data", color: "#ef4444", bg: "rgba(239,68,68,0.1)", warning: "Accounts synced but no positions or balances found" };
}

interface ConfirmModal {
  connectionId: string;
  mode: "unsync" | "disconnect" | "delete";
  name: string;
  accountCount: number;
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
  const [positionCounts, setPositionCounts] = useState<PositionCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [mfaGate, setMfaGate] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null);
  const [showPlaid, setShowPlaid] = useState(false);
  const [snapTradeLoading, setSnapTradeLoading] = useState(false);
  const [snapTradeMessage, setSnapTradeMessage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

    const [connRes, acctRes, posRes] = await Promise.all([
      supabase
        .from("integration_connections")
        .select("id, provider, institution_name, status, connection_status, sync_status, last_synced, created_at")
        .eq("user_id", user.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: false }),
      supabase
        .from("financial_accounts")
        .select("id, account_name, account_type, account_subtype, current_balance, available_balance, mask, account_currency, integration_connection_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .is("deleted_at", null),
      supabase
        .from("positions")
        .select("financial_account_id")
        .eq("user_id", user.id)
        .is("deleted_at", null),
    ]);

    // Aggregate position counts per account
    const posCounts = new Map<string, number>();
    for (const p of (posRes.data ?? [])) {
      const id = (p as { financial_account_id: string }).financial_account_id;
      posCounts.set(id, (posCounts.get(id) ?? 0) + 1);
    }
    setPositionCounts(Array.from(posCounts.entries()).map(([financial_account_id, count]) => ({ financial_account_id, count })));

    if (connRes.error) console.error("[connections] integration_connections query failed:", connRes.error);
    if (acctRes.error) console.error("[connections] financial_accounts query failed:", acctRes.error);
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


  const handleSync = async (connectionId: string, provider: string) => {
    setSyncingId(connectionId);
    setSyncMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = {
        "Content-Type": "application/json",
        "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        "Authorization": `Bearer ${session.access_token}`,
      };

      // SnapTrade brokerage connections are synced directly via snaptrade-sync.
      // orchestrate-refresh only handles Plaid — it would silently skip SnapTrade.
      const endpoint = provider === "snaptrade"
        ? `${functionBase}/snaptrade-sync`
        : `${functionBase}/orchestrate-refresh`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ connectionId }),
      });

      if (response.ok) {
        const delay = provider === "snaptrade" ? 3000 : 6000;
        setSyncMessage("Sync started. Refreshing in a moment...");
        setTimeout(() => { loadData(); setSyncMessage(null); }, delay);
      } else {
        setSyncMessage("Sync failed. Please try again.");
      }
    } catch {
      setSyncMessage("Sync failed. Please try again.");
    } finally {
      setSyncingId(null);
    }
  };


  const updateConnectionState = async (connectionId: string, mode: "unsync" | "disconnect" | "delete") => {
    setConfirmModal(null);
    setActionLoading(connectionId);
    const now = new Date().toISOString();

    try {
      if (mode === "delete") {
        // Fetch account IDs for this connection
        const { data: accts } = await supabase
          .from("financial_accounts")
          .select("id")
          .eq("integration_connection_id", connectionId);
        const accountIds = (accts ?? []).map((a: { id: string }) => a.id);

        // Cascade soft-delete all transactions and positions belonging to those accounts
        if (accountIds.length > 0) {
          await supabase
            .from("transactions")
            .update({ deleted_at: now })
            .in("financial_account_id", accountIds)
            .is("deleted_at", null);
          await supabase
            .from("positions")
            .update({ deleted_at: now, updated_at: now })
            .in("financial_account_id", accountIds)
            .is("deleted_at", null);
        }

        // Soft-delete the accounts themselves
        await supabase
          .from("financial_accounts")
          .update({ is_active: false, deleted_at: now, updated_at: now })
          .eq("integration_connection_id", connectionId);

        // Mark the connection as deleted
        await supabase
          .from("integration_connections")
          .update({ status: "deleted", connection_status: "deleted", sync_status: "never", updated_at: now })
          .eq("id", connectionId);

        // Remove from local state immediately
        setConnections((prev) => prev.filter((c) => c.id !== connectionId));
        setAccounts((prev) => prev.filter((a) => a.integration_connection_id !== connectionId));
        setSyncMessage("Connection deleted and transactions removed from your dashboard.");
      } else if (mode === "disconnect") {
        await supabase
          .from("integration_connections")
          .update({ status: "inactive", connection_status: "disconnected", sync_status: "never", updated_at: now })
          .eq("id", connectionId);
        await supabase
          .from("financial_accounts")
          .update({ is_active: false, updated_at: now })
          .eq("integration_connection_id", connectionId);

        setConnections((prev) =>
          prev.map((c) =>
            c.id === connectionId
              ? { ...c, status: "inactive", connection_status: "disconnected", sync_status: "never" }
              : c
          )
        );
        setAccounts((prev) => prev.filter((a) => a.integration_connection_id !== connectionId));
        setSyncMessage("Disconnected. New transactions will no longer sync.");
      } else {
        await supabase
          .from("integration_connections")
          .update({ sync_status: "never", updated_at: now })
          .eq("id", connectionId);

        setConnections((prev) =>
          prev.map((c) =>
            c.id === connectionId ? { ...c, sync_status: "never" } : c
          )
        );
        setSyncMessage("Unsynced. This connection is excluded from calculations.");
      }

      setTimeout(() => setSyncMessage(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const openConfirm = (conn: Connection, mode: "unsync" | "disconnect" | "delete") => {
    const connAccounts = accountsForConnection(conn.id);
    setConfirmModal({
      connectionId: conn.id,
      mode,
      name: conn.institution_name ?? conn.provider,
      accountCount: connAccounts.length,
    });
  };

  const statusBadge = (s: { label: string; color: string; bg: string }) => (
    <span style={{
      fontSize: "11px", fontWeight: 600,
      color: s.color, background: s.bg,
      padding: "3px 8px", borderRadius: "99px",
      border: `1px solid ${s.color}33`,
    }}>{s.label}</span>
  );

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
              const derivedStatus = deriveBrokerageStatus(conn, connAccounts, positionCounts);
              const isSyncing = syncingId === conn.id;
              const isActing = actionLoading === conn.id;
              const posCountMap = new Map(positionCounts.map(p => [p.financial_account_id, p.count]));
              return (
                <div key={conn.id} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "14px",
                  overflow: "hidden",
                  opacity: isActing ? 0.6 : 1,
                  transition: "opacity 0.2s ease",
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
                      background: conn.provider === "snaptrade" ? "rgba(34,197,94,0.1)" : "rgba(56,189,248,0.1)",
                      border: `1px solid ${conn.provider === "snaptrade" ? "rgba(34,197,94,0.2)" : "rgba(56,189,248,0.2)"}`,
                      borderRadius: "11px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "20px", flexShrink: 0,
                    }}>{conn.provider === "snaptrade" ? "📈" : "🏦"}</div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc", marginBottom: "3px" }}>
                        {conn.institution_name ?? conn.provider}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", color: "#334155", textTransform: "capitalize" }}>
                          {conn.provider === "snaptrade" ? "Brokerage" : "Bank"} · via {conn.provider}
                        </span>
                        <span style={{ color: "#1e293b" }}>·</span>
                        {statusBadge(derivedStatus)}
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

                    {/* Sync Now */}
                    <button
                      onClick={() => handleSync(conn.id, conn.provider)}
                      disabled={isSyncing || isActing}
                      style={{
                        padding: "8px 16px",
                        background: "rgba(37,99,235,0.1)",
                        border: "1px solid rgba(37,99,235,0.2)",
                        borderRadius: "8px", color: "#38bdf8",
                        fontSize: "12px", fontWeight: 600,
                        cursor: isSyncing || isActing ? "not-allowed" : "pointer",
                        transition: "all 0.15s ease",
                        opacity: isSyncing || isActing ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => { if (!isSyncing && !isActing) e.currentTarget.style.background = "rgba(37,99,235,0.18)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(37,99,235,0.1)"; }}
                    >
                      {isSyncing ? "Syncing..." : "⟳ Sync Now"}
                    </button>

                    {/* Unsync */}
                    <button
                      onClick={() => openConfirm(conn, "unsync")}
                      disabled={isActing}
                      style={{
                        padding: "8px 12px",
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.25)",
                        borderRadius: "8px", color: "#f59e0b",
                        fontSize: "12px", fontWeight: 500,
                        cursor: isActing ? "not-allowed" : "pointer",
                        opacity: isActing ? 0.5 : 1,
                      }}
                    >Unsync</button>

                    {/* Disconnect */}
                    <button
                      onClick={() => openConfirm(conn, "disconnect")}
                      disabled={isActing}
                      style={{
                        padding: "8px 12px",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        borderRadius: "8px", color: "#ef4444",
                        fontSize: "12px", fontWeight: 500,
                        cursor: isActing ? "not-allowed" : "pointer",
                        opacity: isActing ? 0.5 : 1,
                      }}
                    >Disconnect</button>

                    {/* Delete */}
                    <button
                      onClick={() => openConfirm(conn, "delete")}
                      disabled={isActing}
                      style={{
                        padding: "8px 12px",
                        background: "rgba(127,29,29,0.25)",
                        border: "1px solid rgba(239,68,68,0.35)",
                        borderRadius: "8px", color: "#fca5a5",
                        fontSize: "12px", fontWeight: 500,
                        cursor: isActing ? "not-allowed" : "pointer",
                        opacity: isActing ? 0.5 : 1,
                      }}
                    >{isActing ? "Working..." : "Delete"}</button>
                  </div>

                  {/* Warning banner for brokerage connections */}
                  {derivedStatus.warning && (
                    <div style={{
                      padding: "10px 20px",
                      background: `${derivedStatus.bg}`,
                      borderBottom: connAccounts.length > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      display: "flex", alignItems: "center", gap: "8px",
                    }}>
                      <span style={{ fontSize: "13px" }}>⚠️</span>
                      <span style={{ fontSize: "12px", color: derivedStatus.color }}>{derivedStatus.warning}</span>
                    </div>
                  )}

                  {/* Accounts under this connection */}
                  {connAccounts.length > 0 && (
                    <div style={{ padding: "12px 20px 16px" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#1e293b", letterSpacing: "0.1em", marginBottom: "10px" }}>
                        ACCOUNTS ({connAccounts.length})
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
                                <div style={{ fontSize: "11px", color: "#334155", textTransform: "capitalize", display: "flex", alignItems: "center", gap: "6px" }}>
                                  {acct.account_subtype ?? acct.account_type}
                                  {acct.account_type === "investment" && (
                                    <span style={{
                                      fontSize: "10px",
                                      color: (posCountMap.get(acct.id) ?? 0) > 0 ? "#22c55e" : "#f59e0b",
                                      fontWeight: 600,
                                    }}>
                                      {(posCountMap.get(acct.id) ?? 0) > 0
                                        ? `${posCountMap.get(acct.id)} position(s)`
                                        : "no positions"}
                                    </span>
                                  )}
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

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
          }}
          onClick={() => setConfirmModal(null)}
        >
          <div
            style={{
              width: "100%", maxWidth: "420px",
              background: "rgba(8,11,18,0.99)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px", padding: "28px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>
              {confirmModal.mode === "delete" ? "🗑" : confirmModal.mode === "disconnect" ? "🔌" : "⏸"}
            </div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#f8fafc", margin: "0 0 8px" }}>
              {confirmModal.mode === "delete"
                ? `Delete ${confirmModal.name}?`
                : confirmModal.mode === "disconnect"
                ? `Disconnect ${confirmModal.name}?`
                : `Unsync ${confirmModal.name}?`}
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 24px", lineHeight: 1.6 }}>
              {confirmModal.mode === "delete"
                ? `This will permanently remove this connection and soft-delete all ${confirmModal.accountCount > 0 ? `${confirmModal.accountCount} associated account${confirmModal.accountCount === 1 ? "" : "s"} and their ` : ""}transactions from your dashboard. This cannot be undone.`
                : confirmModal.mode === "disconnect"
                ? `New transactions will stop syncing. The ${confirmModal.accountCount} connected account${confirmModal.accountCount === 1 ? "" : "s"} will be deactivated. Existing transactions are preserved. You can reconnect later.`
                : `This connection will be excluded from all calculations (income, expenses, net worth). The connection remains active and can be re-synced at any time.`}
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => updateConnectionState(confirmModal.connectionId, confirmModal.mode)}
                disabled={actionLoading === confirmModal.connectionId}
                style={{
                  flex: 1, padding: "11px",
                  background: confirmModal.mode === "unsync"
                    ? "rgba(245,158,11,0.12)"
                    : "rgba(239,68,68,0.12)",
                  border: `1px solid ${confirmModal.mode === "unsync" ? "rgba(245,158,11,0.35)" : "rgba(239,68,68,0.35)"}`,
                  borderRadius: "9px",
                  color: confirmModal.mode === "unsync" ? "#f59e0b" : "#ef4444",
                  fontSize: "13px", fontWeight: 700,
                  cursor: actionLoading === confirmModal.connectionId ? "not-allowed" : "pointer",
                  opacity: actionLoading === confirmModal.connectionId ? 0.6 : 1,
                }}
              >
                {actionLoading === confirmModal.connectionId
                  ? "Working..."
                  : confirmModal.mode === "delete"
                  ? "Yes, Delete"
                  : confirmModal.mode === "disconnect"
                  ? "Yes, Disconnect"
                  : "Yes, Unsync"}
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  flex: 1, padding: "11px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "9px", color: "#64748b",
                  fontSize: "13px", fontWeight: 600,
                  cursor: "pointer",
                }}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

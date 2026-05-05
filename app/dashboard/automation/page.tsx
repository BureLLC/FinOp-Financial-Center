"use client";

import { useEffect, useState } from "react";
import type { AutomationRule, MerchantNormalizedMatcher, DescriptionPatternMatcher } from "../../../src/lib/automation/types";

function matcherSummary(rule: AutomationRule): string {
  if (rule.matcher_type === "merchant_normalized") {
    const m = rule.matcher_config as MerchantNormalizedMatcher;
    return m.normalized_merchant ? `Merchant: "${m.normalized_merchant}"` : "Merchant (unknown)";
  }
  if (rule.matcher_type === "description_pattern") {
    const m = rule.matcher_config as DescriptionPatternMatcher;
    const tokens = m.description_tokens ?? [];
    return tokens.length > 0 ? `Description tokens: ${tokens.join(", ")}` : "Description pattern";
  }
  return rule.matcher_type;
}

function actionSummary(rule: AutomationRule): string {
  const c = rule.action_config.category ?? "—";
  return rule.action_config.subcategory ? `${c} › ${rule.action_config.subcategory}` : c;
}

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  useEffect(() => { loadRules(); }, []);

  const loadRules = async () => {
    try {
      const res = await fetch("/api/automation/rules");
      if (!res.ok) { setLoading(false); return; }
      const { rules: data } = await res.json();
      setRules(data ?? []);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: "active" | "paused" | "deleted") => {
    setUpdating(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/automation/rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ id, text: data.error ?? "Failed to update rule", ok: false });
      } else if (status === "deleted") {
        setRules((prev) => prev.filter((r) => r.id !== id));
      } else {
        setRules((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
        setMsg({ id, text: status === "active" ? "Rule reactivated" : "Rule paused", ok: true });
      }
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div style={{ maxWidth: "820px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          Automation Rules
        </h1>
        <p style={{ color: "#475569", fontSize: "13.5px", margin: 0 }}>
          Rules are created when you categorize a transaction. They suggest categories for similar future transactions.
          You always review and accept or reject each suggestion — nothing is applied automatically.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>Loading...</div>
      ) : rules.length === 0 ? (
        <div style={{ padding: "48px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>◈</div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>No automation rules yet</div>
          <div style={{ fontSize: "13px", color: "#334155" }}>
            Rules are created automatically when you categorize a transaction on the Transactions page.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {rules.map((rule) => {
            const isActive = rule.status === "active";
            const busy = updating === rule.id;
            return (
              <div key={rule.id} style={{
                padding: "16px 18px",
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${isActive ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "10px",
                opacity: isActive ? 1 : 0.65,
                transition: "all 0.15s ease",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#e2e8f0" }}>
                        {matcherSummary(rule)}
                      </span>
                      <span style={{
                        fontSize: "10px", fontWeight: 700,
                        color: isActive ? "#818cf8" : "#64748b",
                        background: isActive ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.05)",
                        padding: "1px 7px", borderRadius: "99px",
                        border: `1px solid ${isActive ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)"}`,
                      }}>
                        {isActive ? "Active" : "Paused"}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                      Categorize as: <span style={{ color: "#94a3b8", fontWeight: 600 }}>{actionSummary(rule)}</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#334155" }}>
                      Confidence {Math.round(rule.confidence * 100)}%
                      {rule.created_at && (
                        <span style={{ marginLeft: "10px" }}>
                          Created {new Date(rule.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    {isActive ? (
                      <button
                        disabled={busy}
                        onClick={() => updateStatus(rule.id, "paused")}
                        style={{
                          padding: "5px 12px", fontSize: "11px", fontWeight: 600,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "7px", color: "#64748b",
                          cursor: busy ? "not-allowed" : "pointer",
                          opacity: busy ? 0.6 : 1,
                        }}
                      >
                        {busy ? "..." : "Pause"}
                      </button>
                    ) : (
                      <button
                        disabled={busy}
                        onClick={() => updateStatus(rule.id, "active")}
                        style={{
                          padding: "5px 12px", fontSize: "11px", fontWeight: 600,
                          background: "rgba(99,102,241,0.12)",
                          border: "1px solid rgba(99,102,241,0.3)",
                          borderRadius: "7px", color: "#818cf8",
                          cursor: busy ? "not-allowed" : "pointer",
                          opacity: busy ? 0.6 : 1,
                        }}
                      >
                        {busy ? "..." : "Reactivate"}
                      </button>
                    )}
                    <button
                      disabled={busy}
                      onClick={() => {
                        if (!confirm("Delete this rule? It cannot be recovered.")) return;
                        updateStatus(rule.id, "deleted");
                      }}
                      style={{
                        padding: "5px 10px", fontSize: "11px", fontWeight: 600,
                        background: "transparent",
                        border: "1px solid rgba(239,68,68,0.18)",
                        borderRadius: "7px", color: "#ef4444",
                        cursor: busy ? "not-allowed" : "pointer",
                        opacity: busy ? 0.6 : 1,
                      }}
                    >
                      {busy ? "..." : "Delete"}
                    </button>
                  </div>
                </div>

                {msg?.id === rule.id && (
                  <div style={{
                    marginTop: "8px", fontSize: "11px",
                    color: msg.ok ? "#22c55e" : "#ef4444",
                  }}>
                    {msg.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type {
  AutomationRule,
  AutomationAuditEntry,
  MerchantNormalizedMatcher,
  DescriptionPatternMatcher,
} from "../../../src/lib/automation/types";

// ─── Display helpers ──────────────────────────────────────────────────────────

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

function matcherDetail(rule: AutomationRule): string {
  if (rule.matcher_type === "merchant_normalized") {
    const m = rule.matcher_config as MerchantNormalizedMatcher;
    return `Merchant name matches "${m.normalized_merchant}" (debit transactions only)`;
  }
  if (rule.matcher_type === "description_pattern") {
    const m = rule.matcher_config as DescriptionPatternMatcher;
    const tokens = m.description_tokens ?? [];
    const parts: string[] = [`Description contains: ${tokens.join(", ")}`];
    if (m.amount_min != null) parts.push(`min $${m.amount_min}`);
    if (m.amount_max != null) parts.push(`max $${m.amount_max}`);
    return parts.join(" · ");
  }
  return rule.matcher_type;
}

function actionSummary(rule: AutomationRule): string {
  if (rule.action_type === "mark_business_candidate") return "Mark as Business Candidate";
  if (rule.action_type === "mark_writeoff_candidate") return "Mark as Write-Off Candidate";
  const catConfig = rule.action_config as { category?: string; subcategory?: string };
  const c = catConfig.category ?? "—";
  return catConfig.subcategory ? `${c} › ${catConfig.subcategory}` : c;
}

function confidenceTier(c: number): { label: string; color: string } {
  if (c >= 0.80) return { label: "High", color: "#22c55e" };
  if (c >= 0.60) return { label: "Medium", color: "#f59e0b" };
  return { label: "Low", color: "#ef4444" };
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function activityLabel(entry: AutomationAuditEntry): { text: string; color: string; bg: string; border: string } {
  if (entry.action_taken === "user_manual_category") {
    return { text: "Manual", color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)" };
  }
  if (entry.triggered_by === "user_undo") {
    return { text: "Undid", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" };
  }
  if (entry.triggered_by === "user_accept") {
    return { text: "Accepted", color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" };
  }
  return { text: entry.action_taken.replace(/_/g, " "), color: "#64748b", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)" };
}

function activityValue(entry: AutomationAuditEntry): string {
  const prev = (entry.previous_value as Record<string, unknown> | null)?.category as string | null | undefined;
  const next = (entry.new_value as Record<string, unknown> | null)?.category as string | null | undefined;
  if (prev && next && prev !== next) return `${prev} → ${next}`;
  if (next) return `→ ${next}`;
  if (prev) return `${prev} → (cleared)`;
  return "—";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ACTIVITY_DEFAULT_LIMIT = 8;

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [activity, setActivity] = useState<AutomationAuditEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [showAllActivity, setShowAllActivity] = useState(false);

  useEffect(() => { loadRules(); loadActivity(); }, []);

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

  const loadActivity = async () => {
    try {
      const res = await fetch("/api/automation/activity");
      if (!res.ok) { setActivityLoading(false); return; }
      const { activity: data } = await res.json();
      setActivity(data ?? []);
    } catch {
      // non-critical
    } finally {
      setActivityLoading(false);
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
        if (expandedRule === id) setExpandedRule(null);
      } else {
        setRules((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
        setMsg({ id, text: status === "active" ? "Rule reactivated" : "Rule paused", ok: true });
      }
    } finally {
      setUpdating(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRule((prev) => (prev === id ? null : id));
  };

  const visibleActivity = showAllActivity ? activity : activity.slice(0, ACTIVITY_DEFAULT_LIMIT);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: "820px" }}>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          Automation Rules
        </h1>
        <p style={{ color: "#475569", fontSize: "13.5px", margin: 0 }}>
          Rules are created when you categorize a transaction. Matching uncategorized transactions are automatically categorized using the same category.
        </p>
      </div>

      {/* Rules section */}
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
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {rules.map((rule) => {
            const isActive = rule.status === "active";
            const busy = updating === rule.id;
            const isExpanded = expandedRule === rule.id;
            const tier = confidenceTier(rule.confidence);

            return (
              <div key={rule.id} style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${isActive ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "10px",
                opacity: isActive ? 1 : 0.65,
                transition: "border-color 0.15s ease",
                overflow: "hidden",
              }}>

                {/* Row header — always visible, click to expand */}
                <div
                  onClick={() => toggleExpand(rule.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "12px",
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.015)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Expand chevron */}
                  <span style={{
                    fontSize: "11px", color: "#334155",
                    marginTop: "3px", flexShrink: 0,
                    transition: "transform 0.15s ease",
                    display: "inline-block",
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  }}>▸</span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
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
                    <div style={{ fontSize: "11px", color: "#475569" }}>
                      <span>Set to: <strong style={{ color: "#94a3b8" }}>{actionSummary(rule)}</strong></span>
                      <span style={{ margin: "0 8px", color: "#1e293b" }}>·</span>
                      <span style={{ color: tier.color }}>{Math.round(rule.confidence * 100)}% {tier.label}</span>
                      {(rule.apply_count ?? 0) > 0 && (
                        <>
                          <span style={{ margin: "0 8px", color: "#1e293b" }}>·</span>
                          <span>Applied {rule.apply_count}×</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action buttons — stopPropagation so they don't toggle expansion */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: "flex", gap: "6px", flexShrink: 0 }}
                  >
                    {isActive ? (
                      <button
                        disabled={busy}
                        onClick={() => updateStatus(rule.id, "paused")}
                        style={{
                          padding: "5px 12px", fontSize: "11px", fontWeight: 600,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "7px", color: "#64748b",
                          cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
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
                          cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
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
                        cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
                      }}
                    >
                      {busy ? "..." : "Delete"}
                    </button>
                  </div>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div style={{
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    padding: "14px 16px 14px 42px",
                    background: "rgba(0,0,0,0.15)",
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "7px 12px", fontSize: "12px" }}>
                      {[
                        { label: "MATCHER",  value: matcherDetail(rule) },
                        { label: "ACTION",   value: `Set category to: ${actionSummary(rule)}` },
                        { label: "CONFIDENCE", value: `${Math.round(rule.confidence * 100)}% — ${tier.label}` },
                        { label: "APPLIED",  value: (rule.apply_count ?? 0) === 0 ? "Never applied" : `${rule.apply_count} time${rule.apply_count === 1 ? "" : "s"} · Last: ${fmtDate(rule.last_applied_at)}` },
                        { label: "CREATED",  value: fmtDate(rule.created_at) },
                      ].map((row) => (
                        <>
                          <span key={`${row.label}-k`} style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.09em", paddingTop: "1px" }}>
                            {row.label}
                          </span>
                          <span key={`${row.label}-v`} style={{ color: "#94a3b8" }}>{row.value}</span>
                        </>
                      ))}
                    </div>
                    <div style={{
                      marginTop: "12px", padding: "8px 12px",
                      background: "rgba(99,102,241,0.06)",
                      border: "1px solid rgba(99,102,241,0.15)",
                      borderRadius: "7px",
                      fontSize: "11px", color: "#64748b",
                    }}>
                      No suggestions apply automatically — you review each one before it takes effect.
                    </div>
                  </div>
                )}

                {/* Inline status message */}
                {msg?.id === rule.id && (
                  <div style={{
                    padding: "6px 16px 10px 42px", fontSize: "11px",
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

      {/* Recent Activity section */}
      <div style={{ marginTop: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#94a3b8", margin: 0, letterSpacing: "-0.01em" }}>
            Recent Activity
          </h2>
          {activity.length > 0 && (
            <span style={{ fontSize: "11px", color: "#334155" }}>
              {activity.length === 50 ? "Last 50 actions" : `${activity.length} action${activity.length === 1 ? "" : "s"}`}
            </span>
          )}
        </div>

        {activityLoading ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#334155", fontSize: "13px" }}>Loading activity...</div>
        ) : activity.length === 0 ? (
          <div style={{
            padding: "32px", textAlign: "center",
            background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)",
            borderRadius: "10px",
          }}>
            <div style={{ fontSize: "13px", color: "#334155" }}>No automation activity yet.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {visibleActivity.map((entry) => {
                const label = activityLabel(entry);
                const value = activityValue(entry);
                const txShort = entry.entity_id.slice(0, 8) + "…";
                return (
                  <div key={entry.id} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "9px 14px",
                    background: "rgba(255,255,255,0.015)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}>
                    <span style={{ color: "#334155", flexShrink: 0, fontSize: "11px", minWidth: "54px" }}>
                      {fmtDateShort(entry.created_at)}
                    </span>
                    <span style={{
                      fontSize: "10px", fontWeight: 700,
                      color: label.color, background: label.bg,
                      padding: "1px 8px", borderRadius: "99px",
                      border: `1px solid ${label.border}`,
                      flexShrink: 0,
                    }}>
                      {label.text}
                    </span>
                    <span style={{ color: "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {value}
                    </span>
                    <span style={{ color: "#1e293b", fontSize: "10px", flexShrink: 0, fontFamily: "monospace" }}>
                      {txShort}
                    </span>
                  </div>
                );
              })}
            </div>

            {!showAllActivity && activity.length > ACTIVITY_DEFAULT_LIMIT && (
              <button
                onClick={() => setShowAllActivity(true)}
                style={{
                  marginTop: "10px", width: "100%",
                  padding: "9px", fontSize: "12px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px", color: "#475569",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#64748b"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#475569"; }}
              >
                See {activity.length - ACTIVITY_DEFAULT_LIMIT} more
              </button>
            )}
          </>
        )}
      </div>

    </div>
  );
}

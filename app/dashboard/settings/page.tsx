"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../src/lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  mfa_enabled: boolean;
  subscription_plan: string | null;
  notification_preferences: Record<string, boolean | string>;
  app_preferences: Record<string, boolean | number>;
}

interface TaxProfile {
  id: string;
  filing_status: string;
  entity_type: string;
  tax_year: number;
  jurisdiction_id: string;
  state_jurisdiction_id: string | null;
  state_jurisdiction_id_2: string | null;
}

interface Jurisdiction {
  id: string;
  name: string;
  jurisdiction_type: string;
}

const FILING_STATUS_OPTIONS = [
  { value: "single",            label: "Single" },
  { value: "married_joint",     label: "Married Filing Jointly" },
  { value: "married_separate",  label: "Married Filing Separately" },
  { value: "head_of_household", label: "Head of Household" },
  { value: "qualifying_widow",  label: "Qualifying Widow(er)" },
];

const ENTITY_TYPE_OPTIONS = [
  { value: "individual",  label: "Individual / Sole Proprietor" },
  { value: "s_corp",      label: "S Corporation" },
  { value: "c_corp",      label: "C Corporation" },
  { value: "partnership", label: "Partnership" },
  { value: "llc",         label: "LLC" },
];

const NOTIFICATION_OPTIONS = [
  { key: "budget_exceeded",   label: "Budget Exceeded",     icon: "📊", desc: "When spending exceeds a budget category limit" },
  { key: "tax_underpayment",  label: "Tax Underpayment",    icon: "🧾", desc: "When quarterly tax payments are approaching" },
  { key: "cash_flow_warning", label: "Cash Flow Warning",   icon: "💸", desc: "When cash balance drops below safe threshold" },
  { key: "margin_risk",       label: "Margin & Trading Risk", icon: "⚡", desc: "When open trades have no stop loss" },
  { key: "spending_anomaly",  label: "Spending Anomaly",    icon: "🔍", desc: "When monthly spending spikes above normal" },
  { key: "ai_insight",        label: "AI Insights",         icon: "🤖", desc: "Weekly financial tips from LevelUP" },
];

function fmt(n: number) {
  return n.toLocaleString();
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "9px", color: "#e2e8f0", fontSize: "13px",
  outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "10px", fontWeight: 700, color: "#475569",
  letterSpacing: "0.1em", display: "block", marginBottom: "6px",
};

const sectionStyle: React.CSSProperties = {
  padding: "24px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "16px",
  marginBottom: "20px",
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: "13px", fontWeight: 700, color: "#f8fafc",
  marginBottom: "4px", letterSpacing: "-0.01em",
};

const sectionDescStyle: React.CSSProperties = {
  fontSize: "12px", color: "#475569", marginBottom: "20px",
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)}
      style={{
        width: "40px", height: "22px", borderRadius: "11px",
        background: checked ? "#2563eb" : "rgba(255,255,255,0.1)",
        border: `1px solid ${checked ? "rgba(37,99,235,0.5)" : "rgba(255,255,255,0.12)"}`,
        position: "relative", cursor: "pointer", flexShrink: 0,
        transition: "all 0.2s ease",
        boxShadow: checked ? "0 0 10px rgba(37,99,235,0.3)" : "none",
      }}>
      <div style={{
        position: "absolute", top: "2px",
        left: checked ? "20px" : "2px",
        width: "16px", height: "16px", borderRadius: "50%",
        background: "#fff",
        transition: "left 0.2s ease",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </div>
  );
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [taxProfile, setTaxProfile] = useState<TaxProfile | null>(null);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [loading, setLoading] = useState(true);

  // Account fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMsg, setAccountMsg] = useState<string | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  // Tax profile fields
  const [taxFilingStatus, setTaxFilingStatus] = useState("single");
  const [taxEntityType, setTaxEntityType] = useState("individual");
  const [taxYear, setTaxYear] = useState("2026");
  const [taxJurisdictionId, setTaxJurisdictionId] = useState("");
  const [taxStateId1, setTaxStateId1] = useState("");
  const [taxStateId2, setTaxStateId2] = useState("");
  const [taxSaving, setTaxSaving] = useState(false);
  const [taxMsg, setTaxMsg] = useState<string | null>(null);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    budget_exceeded: true,
    tax_underpayment: true,
    cash_flow_warning: true,
    margin_risk: true,
    spending_anomaly: true,
    ai_insight: true,
  });
  const [scanFrequency, setScanFrequency] = useState("weekly");
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState<string | null>(null);

  // App preferences
  const [levelupAutoOpen, setLevelupAutoOpen] = useState(true);
  const [defaultTaxYear, setDefaultTaxYear] = useState(2026);
  const [appSaving, setAppSaving] = useState(false);
  const [appMsg, setAppMsg] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, taxRes, jurisdictionsRes] = await Promise.all([
      supabase.from("user_profiles").select("id, email, full_name, mfa_enabled, subscription_plan, notification_preferences, app_preferences").eq("id", user.id).maybeSingle(),
      supabase.from("tax_profiles").select("id, filing_status, entity_type, tax_year, jurisdiction_id, state_jurisdiction_id, state_jurisdiction_id_2").eq("user_id", user.id).eq("is_primary", true).eq("is_active", true).maybeSingle(),
      supabase.from("jurisdictions").select("id, name, jurisdiction_type").order("jurisdiction_type", { ascending: false }).order("name"),
    ]);

    const p = profileRes.data;
    if (p) {
      setProfile(p);
      const parts = (p.full_name ?? "").split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" ") ?? "");

      const notif = p.notification_preferences ?? {};
      setNotifPrefs({
        budget_exceeded: notif.budget_exceeded !== false,
        tax_underpayment: notif.tax_underpayment !== false,
        cash_flow_warning: notif.cash_flow_warning !== false,
        margin_risk: notif.margin_risk !== false,
        spending_anomaly: notif.spending_anomaly !== false,
        ai_insight: notif.ai_insight !== false,
      });
      setScanFrequency(String(notif.auto_scan_frequency ?? "weekly"));

      const app = p.app_preferences ?? {};
      setLevelupAutoOpen(app.levelup_auto_open !== false);
      setDefaultTaxYear(Number(app.default_tax_year ?? 2026));
    }

    const t = taxRes.data;
    if (t) {
      setTaxProfile(t);
      setTaxFilingStatus(t.filing_status);
      setTaxEntityType(t.entity_type);
      setTaxYear(String(t.tax_year));
      setTaxJurisdictionId(t.jurisdiction_id);
      setTaxStateId1(t.state_jurisdiction_id ?? "");
      setTaxStateId2(t.state_jurisdiction_id_2 ?? "");
    } else {
      const fed = (jurisdictionsRes.data ?? []).find((j) => j.jurisdiction_type === "federal");
      if (fed) setTaxJurisdictionId(fed.id);
    }

    setJurisdictions(jurisdictionsRes.data ?? []);
    setLoading(false);
  };

  const saveAccount = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setAccountMsg("First and last name are required.");
      return;
    }
    setAccountSaving(true); setAccountMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("user_profiles").update({
      full_name: `${firstName.trim()} ${lastName.trim()}`,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    setAccountMsg(error ? "Failed to save." : "Account updated successfully.");
    setAccountSaving(false);
  };

  const changePassword = async () => {
    if (!newPassword || !confirmPassword) { setPasswordMsg("Please fill in all fields."); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg("Passwords do not match."); return; }
    if (newPassword.length < 8) { setPasswordMsg("Password must be at least 8 characters."); return; }
    setPasswordSaving(true); setPasswordMsg(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMsg("Failed to update password: " + error.message);
    } else {
      setPasswordMsg("Password updated successfully.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    }
    setPasswordSaving(false);
  };

  const saveTaxProfile = async () => {
    if (!taxStateId1) { setTaxMsg("Primary state is required."); return; }
    setTaxSaving(true); setTaxMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (taxProfile) {
      const { error } = await supabase.from("tax_profiles").update({
        filing_status: taxFilingStatus,
        entity_type: taxEntityType,
        tax_year: Number(taxYear),
        jurisdiction_id: taxJurisdictionId,
        state_jurisdiction_id: taxStateId1 || null,
        state_jurisdiction_id_2: taxStateId2 || null,
        updated_at: new Date().toISOString(),
      }).eq("id", taxProfile.id);
      setTaxMsg(error ? "Failed to save." : "Tax profile updated.");
    } else {
      const { error } = await supabase.from("tax_profiles").insert({
        user_id: user.id,
        profile_name: "Primary",
        filing_status: taxFilingStatus,
        entity_type: taxEntityType,
        tax_year: Number(taxYear),
        jurisdiction_id: taxJurisdictionId,
        state_jurisdiction_id: taxStateId1 || null,
        state_jurisdiction_id_2: taxStateId2 || null,
        is_primary: true, is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setTaxMsg(error ? "Failed to create profile." : "Tax profile created.");
    }
    await loadData();
    setTaxSaving(false);
  };

  const saveNotifications = async () => {
    setNotifSaving(true); setNotifMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("user_profiles").update({
      notification_preferences: { ...notifPrefs, auto_scan_frequency: scanFrequency },
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    setNotifMsg(error ? "Failed to save." : "Notification preferences saved.");
    setNotifSaving(false);
  };


  const deleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      setDeleteMsg('Type DELETE to confirm account deletion.');
      return;
    }

    setDeleteBusy(true);
    setDeleteMsg(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setDeleteMsg('No active session found.');
      setDeleteBusy(false);
      return;
    }

    const userId = user.id;

    try {
      const checkedDelete = async (table: string, column: string) => {
        const { error } = await supabase.from(table).delete().eq(column, userId);
        if (error) throw new Error(`${table}: ${error.message}`);
      };

      await checkedDelete("alerts", "user_id");
      await checkedDelete("transactions", "user_id");
      await checkedDelete("positions", "user_id");
      await checkedDelete("financial_accounts", "user_id");
      await checkedDelete("integration_connections", "user_id");
      await checkedDelete("tax_estimates", "user_id");
      await checkedDelete("tax_profiles", "user_id");
      await checkedDelete("trades", "user_id");
      await checkedDelete("trading_journal", "user_id");
      await checkedDelete("write_offs", "user_id");
      await checkedDelete("savings_goals", "user_id");
      await checkedDelete("budget_categories", "user_id");

      const { error: profileDeleteError } = await supabase.from("user_profiles").delete().eq("id", userId);
      if (profileDeleteError) throw new Error(`user_profiles: ${profileDeleteError.message}`);

      await supabase.auth.signOut();
      window.location.href = "/auth";
    } catch (err) {
      setDeleteMsg(`Account deletion failed: ${err instanceof Error ? err.message : "Unknown error"}. Contact admin@burellc.com if this persists.`);
      setDeleteBusy(false);
    }
  };

  const saveAppPreferences = async () => {
    setAppSaving(true); setAppMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("user_profiles").update({
      app_preferences: { levelup_auto_open: levelupAutoOpen, default_tax_year: defaultTaxYear },
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    setAppMsg(error ? "Failed to save." : "Preferences saved.");
    setAppSaving(false);
  };

  const states = jurisdictions.filter((j) => j.jurisdiction_type === "state");
  const federal = jurisdictions.filter((j) => j.jurisdiction_type === "federal");

  if (loading) return (
    <div style={{ maxWidth: "720px" }}>
      <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px" }}>Settings</h1>
      <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ maxWidth: "720px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Settings</h1>
        <p style={{ color: "#475569", fontSize: "13.5px", margin: 0 }}>Manage your account, tax profile, notifications, and app preferences.</p>
      </div>

      {/* ── SECTION 1: ACCOUNT ── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Account Information</div>
        <div style={sectionDescStyle}>Your name is used across the app and in reports.</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>FIRST NAME <span style={{ color: "#ef4444" }}>*</span></label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>
          <div>
            <label style={labelStyle}>LAST NAME <span style={{ color: "#ef4444" }}>*</span></label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>EMAIL ADDRESS</label>
          <input value={profile?.email ?? ""} disabled style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />
          <div style={{ fontSize: "10px", color: "#334155", marginTop: "5px" }}>Email cannot be changed here. Contact support to update your email address.</div>
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>SUBSCRIPTION PLAN</label>
          <div style={{ padding: "10px 14px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "9px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#38bdf8" }}>{profile?.subscription_plan ?? "Free"}</span>
            <span style={{ fontSize: "10px", padding: "2px 8px", background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "99px", color: "#38bdf8", fontWeight: 700 }}>ACTIVE</span>
          </div>
        </div>

        {accountMsg && (
          <div style={{ padding: "10px 12px", background: accountMsg.includes("success") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${accountMsg.includes("success") ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: "8px", fontSize: "12px", color: accountMsg.includes("success") ? "#22c55e" : "#ef4444", marginBottom: "14px" }}>
            {accountMsg}
          </div>
        )}

        <button onClick={saveAccount} disabled={accountSaving}
          style={{ padding: "10px 20px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: accountSaving ? "not-allowed" : "pointer", opacity: accountSaving ? 0.7 : 1 }}>
          {accountSaving ? "Saving..." : "Save Account Info"}
        </button>
      </div>

      {/* ── CHANGE PASSWORD ── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Change Password</div>
        <div style={sectionDescStyle}>Choose a strong password with at least 8 characters.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>NEW PASSWORD</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>
          <div>
            <label style={labelStyle}>CONFIRM NEW PASSWORD</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>
        </div>

        {/* Password strength */}
        {newPassword && (
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontSize: "10px", color: "#334155", marginBottom: "5px" }}>Password strength</div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: newPassword.length >= 12 ? "100%" : newPassword.length >= 8 ? "66%" : "33%",
                background: newPassword.length >= 12 ? "#22c55e" : newPassword.length >= 8 ? "#f59e0b" : "#ef4444",
                borderRadius: "2px", transition: "all 0.3s ease",
              }} />
            </div>
            <div style={{ fontSize: "10px", color: newPassword.length >= 12 ? "#22c55e" : newPassword.length >= 8 ? "#f59e0b" : "#ef4444", marginTop: "4px" }}>
              {newPassword.length >= 12 ? "Strong" : newPassword.length >= 8 ? "Good" : "Too short"}
            </div>
          </div>
        )}

        {passwordMsg && (
          <div style={{ padding: "10px 12px", background: passwordMsg.includes("success") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${passwordMsg.includes("success") ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: "8px", fontSize: "12px", color: passwordMsg.includes("success") ? "#22c55e" : "#ef4444", marginBottom: "14px" }}>
            {passwordMsg}
          </div>
        )}

        <button onClick={changePassword} disabled={passwordSaving || !newPassword || !confirmPassword}
          style={{ padding: "10px 20px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: passwordSaving ? "not-allowed" : "pointer", opacity: passwordSaving || !newPassword || !confirmPassword ? 0.7 : 1 }}>
          {passwordSaving ? "Updating..." : "Update Password"}
        </button>
      </div>

      {/* ── SECTION 2: TAX PROFILE ── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Tax Profile</div>
        <div style={sectionDescStyle}>Used to calculate federal and state tax estimates. Changes trigger automatic recalculation.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: "13px", marginBottom: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>FILING STATUS</label>
              <select value={taxFilingStatus} onChange={(e) => setTaxFilingStatus(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {FILING_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>ENTITY TYPE</label>
              <select value={taxEntityType} onChange={(e) => setTaxEntityType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {ENTITY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>TAX YEAR</label>
              <select value={taxYear} onChange={(e) => setTaxYear(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>FEDERAL JURISDICTION</label>
              <select value={taxJurisdictionId} onChange={(e) => setTaxJurisdictionId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {federal.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>PRIMARY STATE <span style={{ color: "#ef4444" }}>*</span></label>
              <select value={taxStateId1} onChange={(e) => setTaxStateId1(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">Select state...</option>
                {states.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>SECOND STATE (optional)</label>
              <select value={taxStateId2} onChange={(e) => setTaxStateId2(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">None</option>
                {states.filter((j) => j.id !== taxStateId1).map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>
          </div>
          {taxStateId2 && (
            <div style={{ fontSize: "10px", color: "#f59e0b", padding: "8px 12px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "8px" }}>
              ⚠️ Multi-state calculations are estimates. For 3+ states, consult a CPA or dedicated tax software.
            </div>
          )}
        </div>

        {taxMsg && (
          <div style={{ padding: "10px 12px", background: taxMsg.includes("success") || taxMsg.includes("updated") || taxMsg.includes("created") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${taxMsg.includes("updated") || taxMsg.includes("created") ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: "8px", fontSize: "12px", color: taxMsg.includes("updated") || taxMsg.includes("created") ? "#22c55e" : "#ef4444", marginBottom: "14px" }}>
            {taxMsg}
          </div>
        )}

        <button onClick={saveTaxProfile} disabled={taxSaving || !taxStateId1}
          style={{ padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: taxSaving || !taxStateId1 ? "not-allowed" : "pointer", opacity: taxSaving || !taxStateId1 ? 0.7 : 1 }}>
          {taxSaving ? "Saving..." : "Save Tax Profile"}
        </button>
      </div>

      {/* ── SECTION 3: NOTIFICATIONS ── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Alert Preferences</div>
        <div style={sectionDescStyle}>Choose which automatic alerts you want to receive in the Alert Center.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
          {NOTIFICATION_OPTIONS.map((opt) => (
            <div key={opt.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{ fontSize: "16px" }}>{opt.icon}</span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#f8fafc" }}>{opt.label}</div>
                  <div style={{ fontSize: "11px", color: "#475569" }}>{opt.desc}</div>
                </div>
              </div>
              <Toggle checked={notifPrefs[opt.key] !== false} onChange={(v) => setNotifPrefs((prev) => ({ ...prev, [opt.key]: v }))} />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>AUTO-SCAN FREQUENCY</label>
          <div style={{ display: "flex", gap: "6px" }}>
            {["daily", "weekly", "manual"].map((f) => (
              <button key={f} onClick={() => setScanFrequency(f)}
                style={{ flex: 1, padding: "9px", border: `1px solid ${scanFrequency === f ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: "9px", background: scanFrequency === f ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.04)", color: scanFrequency === f ? "#38bdf8" : "#475569", fontSize: "12px", fontWeight: scanFrequency === f ? 700 : 400, cursor: "pointer", textTransform: "capitalize" }}>
                {f}
              </button>
            ))}
          </div>
          <div style={{ fontSize: "10px", color: "#334155", marginTop: "5px" }}>
            {scanFrequency === "daily" ? "Alerts are checked automatically every day" : scanFrequency === "weekly" ? "Alerts are checked automatically once per week" : "You run alert scans manually from the Alert Center"}
          </div>
        </div>

        {notifMsg && (
          <div style={{ padding: "10px 12px", background: notifMsg.includes("saved") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${notifMsg.includes("saved") ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: "8px", fontSize: "12px", color: notifMsg.includes("saved") ? "#22c55e" : "#ef4444", marginBottom: "14px" }}>
            {notifMsg}
          </div>
        )}

        <button onClick={saveNotifications} disabled={notifSaving}
          style={{ padding: "10px 20px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: notifSaving ? "not-allowed" : "pointer", opacity: notifSaving ? 0.7 : 1 }}>
          {notifSaving ? "Saving..." : "Save Notification Preferences"}
        </button>
      </div>

      {/* ── SECTION 4: APP PREFERENCES ── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>App Preferences</div>
        <div style={sectionDescStyle}>Customize how FinOps behaves for you.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#f8fafc" }}>LevelUP Auto-Open</div>
              <div style={{ fontSize: "11px", color: "#475569" }}>Automatically open LevelUP assistant when navigating between pages</div>
            </div>
            <Toggle checked={levelupAutoOpen} onChange={setLevelupAutoOpen} />
          </div>

          <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px" }}>
            <label style={labelStyle}>DEFAULT TAX YEAR</label>
            <select value={defaultTaxYear} onChange={(e) => setDefaultTaxYear(Number(e.target.value))} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
        </div>

        {appMsg && (
          <div style={{ padding: "10px 12px", background: appMsg.includes("saved") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${appMsg.includes("saved") ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: "8px", fontSize: "12px", color: appMsg.includes("saved") ? "#22c55e" : "#ef4444", marginBottom: "14px" }}>
            {appMsg}
          </div>
        )}

        <button onClick={saveAppPreferences} disabled={appSaving}
          style={{ padding: "10px 20px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: appSaving ? "not-allowed" : "pointer", opacity: appSaving ? 0.7 : 1 }}>
          {appSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>


      {/* ── ACCOUNT DELETION ── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Account Deletion</div>
        <div style={sectionDescStyle}>Delete your account and remove financial records from active systems. This action cannot be undone.</div>

        <div style={{ padding: "14px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", marginBottom: "12px" }}>
          <div style={{ fontSize: "12px", color: "#fca5a5", lineHeight: 1.7 }}>
            For App Store and Google Play subscriptions, cancel auto-renew first in your Apple/Google subscription settings.
          </div>
        </div>

        <label style={labelStyle}>TYPE DELETE TO CONFIRM</label>
        <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" style={{ ...inputStyle, marginBottom: "12px" }} />

        {deleteMsg && (
          <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", fontSize: "12px", color: "#ef4444", marginBottom: "14px" }}>
            {deleteMsg}
          </div>
        )}

        <button onClick={deleteAccount} disabled={deleteBusy}
          style={{ padding: "10px 20px", background: "linear-gradient(135deg, #dc2626, #b91c1c)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: deleteBusy ? "not-allowed" : "pointer", opacity: deleteBusy ? 0.7 : 1 }}>
          {deleteBusy ? "Deleting..." : "Delete Account"}
        </button>
      </div>

      {/* ── MFA STATUS ── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Security</div>
        <div style={sectionDescStyle}>Multi-factor authentication is required for all accounts.</div>
        <div style={{ padding: "14px 16px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "10px", display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>🛡️</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e", marginBottom: "2px" }}>Multi-Factor Authentication Active</div>
            <div style={{ fontSize: "11px", color: "#475569" }}>Your account is protected with TOTP-based two-factor authentication. MFA is required and cannot be disabled.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

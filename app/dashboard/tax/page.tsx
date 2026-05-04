"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../src/lib/supabase";
import { functionBase } from "../../../src/lib/function-base";
import { getCanonicalTaggedIncomeCount, getCanonicalTaxableIncome, getCanonicalRealizedGains } from "../../../src/lib/canonicalFinancialData";

interface TaxEstimate {
  id: string;
  period_type: string;
  tax_year: number;
  quarter: number | null;
  taxable_income: number;
  total_tax_liability: number;
  income_tax: number;
  capital_gains_tax: number;
  self_employment_tax: number;
  balance_due: number;
  underpayment_flag: boolean;
  calculated_at: string;
}

interface TaxProfile {
  id: string;
  profile_name: string;
  entity_type: string;
  filing_status: string;
  tax_year: number;
  is_primary: boolean;
  jurisdiction_id: string;
  state_jurisdiction_id: string | null;
  state_jurisdiction_id_2: string | null;
}

interface Jurisdiction {
  id: string;
  name: string;
  code: string;
  jurisdiction_type: string;
}

const QUARTERLY_DUE_DATES: Record<number, string> = {
  1: "April 15, 2026",
  2: "June 16, 2026",
  3: "September 15, 2026",
  4: "January 15, 2027",
};

const QUARTER_LABELS: Record<number, string> = {
  1: "Q1 (Jan–Mar)",
  2: "Q2 (Apr–May)",
  3: "Q3 (Jun–Aug)",
  4: "Q4 (Sep–Dec)",
};

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

const INCOME_SUBTYPES = [
  { value: "business",  label: "Business / Self-Employment" },
  { value: "rental",    label: "Rental Income" },
  { value: "salary",    label: "Salary / W2" },
  { value: "bonus",     label: "Bonus" },
  { value: "dividend",  label: "Dividend" },
  { value: "interest",  label: "Interest" },
  { value: "other",     label: "Other Income" },
];

// ── Styles outside component — always available ───────────────────────────
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

const modalOverlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 500,
  background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
};

const modalBox: React.CSSProperties = {
  width: "100%", maxWidth: "460px",
  background: "rgba(8,11,18,0.98)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "20px", padding: "28px",
  boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
  maxHeight: "90vh", overflowY: "auto",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n ?? 0);
}

function isProfileComplete(p: TaxProfile | null): boolean {
  if (!p) return false;
  return !!(p.filing_status && p.entity_type && p.jurisdiction_id && p.state_jurisdiction_id);
}

export default function TaxCenterPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [estimates, setEstimates] = useState<TaxEstimate[]>([]);
  const [profile, setProfile] = useState<TaxProfile | null>(null);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [taggedIncomeCount, setTaggedIncomeCount] = useState(0);
  const [profileComplete, setProfileComplete] = useState(false);
  const [canonicalTaxableIncome, setCanonicalTaxableIncome] = useState<{ businessIncome: number; deductibleExpenses: number; taxableProfit: number } | null>(null);
  const [realizedGains, setRealizedGains] = useState<any[]>([]);

  // Profile modal
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFilingStatus, setEditFilingStatus] = useState("single");
  const [editEntityType, setEditEntityType] = useState("individual");
  const [editTaxYear, setEditTaxYear] = useState("2026");
  const [editJurisdictionId, setEditJurisdictionId] = useState("");
  const [editStateId1, setEditStateId1] = useState("");
  const [editStateId2, setEditStateId2] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Manual income modal
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split("T")[0]);
  const [incomeDesc, setIncomeDesc] = useState("");
  const [incomeSubtype, setIncomeSubtype] = useState("business");
  const [savingIncome, setSavingIncome] = useState(false);
  const [incomeMsg, setIncomeMsg] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentYear = new Date().getFullYear();
    const [estimatesRes, profileRes, taggedCount, jurisdictionsRes, canonicalTaxable, gains] = await Promise.all([
      supabase.from("tax_estimates")
        .select("id, period_type, tax_year, quarter, taxable_income, total_tax_liability, income_tax, capital_gains_tax, self_employment_tax, balance_due, underpayment_flag, calculated_at")
        .eq("user_id", user.id)
        .order("tax_year", { ascending: false })
        .order("period_type")
        .order("quarter"),
      supabase.from("tax_profiles")
        .select("id, profile_name, entity_type, filing_status, tax_year, is_primary, jurisdiction_id, state_jurisdiction_id, state_jurisdiction_id_2")
        .eq("user_id", user.id).eq("is_primary", true).eq("is_active", true).maybeSingle(),
      getCanonicalTaggedIncomeCount(supabase, user.id),
      supabase.from("jurisdictions")
        .select("id, name, code, jurisdiction_type")
        .order("jurisdiction_type", { ascending: false })
        .order("name"),
      getCanonicalTaxableIncome(supabase, user.id, currentYear),
      getCanonicalRealizedGains(supabase, user.id, currentYear),
    ]);

    const jData = jurisdictionsRes.data ?? [];
    setEstimates(estimatesRes.data ?? []);
    setTaggedIncomeCount(taggedCount);
    setJurisdictions(jData);
    setRealizedGains(gains);

    const p = profileRes.data ?? null;
    setProfile(p);
    setProfileComplete(isProfileComplete(p));

    // Pre-fill edit form
    const fed = jData.find((j) => j.jurisdiction_type === "federal");
    setEditFilingStatus(p?.filing_status ?? "single");
    setEditEntityType(p?.entity_type ?? "individual");
    setEditTaxYear(String(p?.tax_year ?? 2026));
    setEditJurisdictionId(p?.jurisdiction_id ?? fed?.id ?? "");
    setEditStateId1(p?.state_jurisdiction_id ?? "");
    setEditStateId2(p?.state_jurisdiction_id_2 ?? "");

    // Store canonical taxable income for reference
    setCanonicalTaxableIncome(canonicalTaxable);

    setLoading(false);
  };

  const handleSync = async () => {
    setSyncing(true); setSyncMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `${functionBase}/orchestrate-refresh`,
        { method: "POST", headers: { "Content-Type": "application/json", "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, "Authorization": `Bearer ${session.access_token}` }, body: JSON.stringify({}) }
      );
      if (res.ok) {
        setSyncMsg("Tax recalculation started. Refreshing in 8 seconds...");
        setTimeout(() => { loadData(); setSyncMsg(null); }, 8000);
      } else setSyncMsg("Sync failed. Please try again.");
    } catch { setSyncMsg("Sync failed."); }
    finally { setSyncing(false); }
  };

  const saveProfile = async () => {
    if (!editStateId1) { setProfileMsg("Please select a primary state."); return; }
    setSavingProfile(true); setProfileMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (profile) {
      const { error } = await supabase.from("tax_profiles").update({
        filing_status: editFilingStatus, entity_type: editEntityType,
        tax_year: Number(editTaxYear), jurisdiction_id: editJurisdictionId,
        state_jurisdiction_id: editStateId1 || null,
        state_jurisdiction_id_2: editStateId2 || null,
        updated_at: new Date().toISOString(),
      }).eq("id", profile.id);
      if (error) { setProfileMsg("Failed to save."); setSavingProfile(false); return; }
    } else {
      const { error } = await supabase.from("tax_profiles").insert({
        user_id: user.id, profile_name: "Primary",
        filing_status: editFilingStatus, entity_type: editEntityType,
        tax_year: Number(editTaxYear), jurisdiction_id: editJurisdictionId,
        state_jurisdiction_id: editStateId1 || null,
        state_jurisdiction_id_2: editStateId2 || null,
        is_primary: true, is_active: true,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
      if (error) { setProfileMsg("Failed to create profile."); setSavingProfile(false); return; }
    }

    setProfileMsg("Profile saved. Recalculating...");
    await loadData();
    setTimeout(() => { handleSync(); setShowEditProfile(false); setProfileMsg(null); }, 1000);
    setSavingProfile(false);
  };

  const addManualIncome = async () => {
    if (!incomeAmount || !incomeDate) return;
    setSavingIncome(true); setIncomeMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: acctData } = await supabase.from("financial_accounts")
      .select("id").eq("user_id", user.id).eq("is_active", true).limit(1).maybeSingle();

    if (!acctData) { setIncomeMsg("No connected account found. Please connect a bank account first."); setSavingIncome(false); return; }

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id, financial_account_id: acctData.id,
      transaction_type: "income", direction: "credit", status: "posted",
      income_subtype: incomeSubtype, amount: Number(incomeAmount), currency: "USD",
      description: incomeDesc || `Manual ${incomeSubtype} income`,
      merchant_name: null, category: "Income",
      transaction_date: incomeDate, provider: "manual",
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });

    if (error) {
      setIncomeMsg("Failed to add income.");
    } else {
      setIncomeMsg("Income added. Recalculating tax...");
      setIncomeAmount(""); setIncomeDesc(""); setIncomeSubtype("business");
      setIncomeDate(new Date().toISOString().split("T")[0]);
      await loadData();
      setTimeout(() => { handleSync(); setShowAddIncome(false); setIncomeMsg(null); }, 1500);
    }
    setSavingIncome(false);
  };

  // ── Computed values — always run, regardless of gate ─────────────────────
  const states = jurisdictions.filter((j) => j.jurisdiction_type === "state");
  const federal = jurisdictions.filter((j) => j.jurisdiction_type === "federal");
  const getJurisdictionName = (id: string | null) => id ? jurisdictions.find((j) => j.id === id)?.name ?? "—" : "—";
  const annual = estimates.find((e) => e.period_type === "annual");
  const quarterly = estimates.filter((e) => e.period_type === "quarterly").sort((a, b) => (a.quarter ?? 0) - (b.quarter ?? 0));
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  const staleLiability = annual?.total_tax_liability ?? 0;
  // Use canonical taxable income for display; fall back to stale estimate only if canonical not loaded
  const cti = canonicalTaxableIncome ?? { businessIncome: 0, deductibleExpenses: 0, taxableProfit: 0 };
  const displayTaxableIncome = cti.taxableProfit > 0
    ? cti.taxableProfit
    : Number(annual?.taxable_income ?? 0);
  // Recalculate total tax liability from canonical taxable income when available
  // SE tax = 15.3% of 92.35% of profit; income tax ~22% marginal estimate
  const totalLiability = cti.taxableProfit > 0
    ? Math.round((cti.taxableProfit * 0.9235 * 0.153) + (cti.taxableProfit * 0.22))
    : staleLiability;
  const effectiveRate = displayTaxableIncome > 0
    ? (totalLiability / displayTaxableIncome) * 100 : 0;
  const taxBreakdown = annual ? [
    { label: "Federal Income Tax",  value: Number(annual.income_tax),         color: "#38bdf8", rgb: "56,189,248" },
    { label: "Self-Employment Tax", value: Number(annual.self_employment_tax), color: "#a855f7", rgb: "168,85,247" },
    { label: "Capital Gains Tax",   value: Number(annual.capital_gains_tax),   color: "#f59e0b", rgb: "245,158,11" },
  ].filter((t) => t.value > 0) : [];

  // ── Profile form — renders inside any modal ───────────────────────────────
  const ProfileForm = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <label style={labelStyle}>FILING STATUS</label>
        <select value={editFilingStatus} onChange={(e) => setEditFilingStatus(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          {FILING_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>ENTITY TYPE</label>
        <select value={editEntityType} onChange={(e) => setEditEntityType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          {ENTITY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>TAX YEAR</label>
        <select value={editTaxYear} onChange={(e) => setEditTaxYear(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>FEDERAL JURISDICTION</label>
        <select value={editJurisdictionId} onChange={(e) => setEditJurisdictionId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">Select...</option>
          {federal.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>PRIMARY STATE <span style={{ color: "#ef4444" }}>*</span></label>
        <select value={editStateId1} onChange={(e) => setEditStateId1(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">Select your primary state...</option>
          {states.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>SECOND STATE (optional)</label>
        <select value={editStateId2} onChange={(e) => setEditStateId2(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">None</option>
          {states.filter((j) => j.id !== editStateId1).map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
        </select>
        {editStateId2 && (
          <div style={{ fontSize: "10px", color: "#f59e0b", marginTop: "5px" }}>
            ⚠️ Multi-state calculations are estimates only. For 3+ states, consult a CPA or use dedicated multi-state tax software.
          </div>
        )}
      </div>
      {profileMsg && (
        <div style={{ padding: "10px 12px", background: profileMsg.includes("Failed") ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", border: `1px solid ${profileMsg.includes("Failed") ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`, borderRadius: "8px", fontSize: "12px", color: profileMsg.includes("Failed") ? "#ef4444" : "#22c55e" }}>
          {profileMsg}
        </div>
      )}
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={() => { setShowEditProfile(false); setProfileMsg(null); }} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
        <button onClick={saveProfile} disabled={savingProfile || !editStateId1}
          style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: savingProfile || !editStateId1 ? "not-allowed" : "pointer", opacity: savingProfile || !editStateId1 ? 0.7 : 1 }}>
          {savingProfile ? "Saving..." : "Save & Recalculate"}
        </button>
      </div>
    </div>
  );

  // ── Single return — gate is a conditional overlay ─────────────────────────
  return (
    <div style={{ maxWidth: "1100px" }}>

      {/* ── PROFILE INCOMPLETE GATE — full page overlay ── */}
      {!loading && !profileComplete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ width: "100%", maxWidth: "560px", background: "rgba(8,11,18,0.98)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "20px", padding: "40px", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚡</div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#f8fafc", margin: "0 0 10px", letterSpacing: "-0.02em" }}>Complete Your Tax Profile First</h2>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.7, margin: "0 0 24px" }}>
              FinOps needs your filing status, entity type, and the state(s) where you file taxes to generate accurate tax estimates.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "left", marginBottom: "24px" }}>
              {[
                { icon: "📋", label: "Filing Status", desc: "Single, married jointly, head of household, etc." },
                { icon: "🏢", label: "Entity Type", desc: "Individual, LLC, S-Corp, partnership, etc." },
                { icon: "🗺️", label: "Primary State (required)", desc: "The state where you primarily file taxes" },
                { icon: "🗺️", label: "Second State (optional)", desc: "If you file taxes in a second state" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px" }}>
                  <span style={{ fontSize: "16px", flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#e2e8f0", marginBottom: "2px" }}>{item.label}</div>
                    <div style={{ fontSize: "11px", color: "#475569" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowEditProfile(true)}
              style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", borderRadius: "12px", color: "#000", fontSize: "15px", fontWeight: 800, cursor: "pointer", boxShadow: "0 0 24px rgba(245,158,11,0.3)" }}>
              Set Up Tax Profile →
            </button>
            <button onClick={() => router.push("/dashboard")}
              style={{ marginTop: "10px", background: "transparent", border: "none", color: "#334155", fontSize: "12px", cursor: "pointer" }}>
              Go back to dashboard
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ padding: "60px", textAlign: "center", color: "#334155" }}>Loading tax data...</div>
      )}

      {/* ── MAIN CONTENT (always rendered, behind gate overlay if incomplete) ── */}
      {!loading && (
        <>
          {/* Header */}
          <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Tax Center</h1>
              <p style={{ color: "#475569", fontSize: "13.5px", margin: 0 }}>Federal tax estimates, quarterly payments, and income management.</p>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={() => setShowAddIncome(true)}
                style={{ padding: "10px 18px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "9px", color: "#22c55e", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                + Add Income
              </button>
              <button onClick={() => setShowEditProfile(true)}
                style={{ padding: "10px 18px", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "9px", color: "#a855f7", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                ✎ Edit Tax Profile
              </button>
              <button onClick={handleSync} disabled={syncing}
                style={{ padding: "10px 18px", background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "9px", color: "#38bdf8", fontSize: "13px", fontWeight: 600, cursor: syncing ? "not-allowed" : "pointer", opacity: syncing ? 0.7 : 1 }}>
                {syncing ? "Recalculating..." : "⚡ Recalculate"}
              </button>
            </div>
          </div>

          {syncMsg && (
            <div style={{ marginBottom: "16px", padding: "12px 16px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "10px", fontSize: "13px", color: "#38bdf8" }}>{syncMsg}</div>
          )}

          {/* Income tagging notice */}
          {taggedIncomeCount === 0 && (
            <div style={{ marginBottom: "20px", padding: "16px 20px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "12px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ fontSize: "20px", flexShrink: 0 }}>⚡</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b", marginBottom: "4px" }}>Tag Income to Activate Tax Estimates</div>
                <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6 }}>
                  Tag transactions in the <a href="/dashboard/income" style={{ color: "#38bdf8", textDecoration: "none" }}>Income Tracker</a> or use <strong style={{ color: "#22c55e" }}>+ Add Income</strong> above. Only Business and Rental income feed the tax engine.
                </div>
              </div>
            </div>
          )}

          {/* Tax Profile summary bar */}
          {profile && (
            <div style={{ marginBottom: "20px", padding: "16px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: "10px" }}>TAX PROFILE</div>
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                  {[
                    { label: "Filing Status", value: FILING_STATUS_OPTIONS.find((f) => f.value === profile.filing_status)?.label ?? profile.filing_status },
                    { label: "Entity Type",   value: ENTITY_TYPE_OPTIONS.find((e) => e.value === profile.entity_type)?.label ?? profile.entity_type },
                    { label: "Tax Year",      value: String(profile.tax_year) },
                    { label: "Primary State", value: getJurisdictionName(profile.state_jurisdiction_id) },
                    ...(profile.state_jurisdiction_id_2 ? [{ label: "Second State", value: getJurisdictionName(profile.state_jurisdiction_id_2) }] : []),
                  ].map((item, i) => (
                    <div key={i}>
                      <div style={{ fontSize: "9px", color: "#334155", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "3px" }}>{item.label.toUpperCase()}</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowEditProfile(true)}
                style={{ padding: "8px 16px", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: "8px", color: "#a855f7", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                Edit Profile
              </button>
            </div>
          )}

          {/* KPI Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            {[
              { label: "Total Tax Liability", value: fmt(totalLiability),              color: "#ef4444", rgb: "239,68,68",   sub: "2026 annual estimate" },
              { label: "Taxable Income",       value: fmt(displayTaxableIncome),        color: "#38bdf8", rgb: "56,189,248",  sub: "Business & rental only" },
              { label: "Business Income",      value: fmt(cti.businessIncome), color: "#22c55e", rgb: "34,197,94", sub: "Gross business revenue" },
              { label: "Deductible Expenses",  value: fmt(cti.deductibleExpenses), color: "#f97316", rgb: "249,115,22", sub: "Write-offs applied" },
              { label: "Effective Rate",       value: `${effectiveRate.toFixed(1)}%`,   color: "#f59e0b", rgb: "245,158,11", sub: "Of taxable income" },
              { label: "Balance Due",          value: fmt(annual?.balance_due ?? 0),    color: annual?.underpayment_flag ? "#ef4444" : "#22c55e", rgb: annual?.underpayment_flag ? "239,68,68" : "34,197,94", sub: annual?.underpayment_flag ? "⚠️ Underpayment" : "On track" },
              { label: "Tagged Income",        value: String(taggedIncomeCount),         color: "#a855f7", rgb: "168,85,247", sub: "Transactions tagged" },
            ].map((k, i) => (
              <div key={i} style={{ padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "70px", height: "70px", borderRadius: "50%", background: `radial-gradient(circle, rgba(${k.rgb},0.1) 0%, transparent 70%)`, pointerEvents: "none" }} />
                <div style={{ fontSize: "10px", color: "#475569", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "6px" }}>{k.label}</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: "10px", color: "#334155", marginTop: "3px" }}>{k.sub}</div>
                <div style={{ marginTop: "8px", height: "2px", background: `rgba(${k.rgb},0.3)`, borderRadius: "1px" }} />
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            {/* Tax breakdown */}
            <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: "16px" }}>TAX BREAKDOWN</div>
              {taxBreakdown.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>📊</div>
                  <div style={{ fontSize: "12px", color: "#334155" }}>No tax liability yet.</div>
                  <div style={{ fontSize: "11px", color: "#1e293b", marginTop: "4px" }}>Add or tag business income to generate estimates.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {taxBreakdown.map((item, i) => {
                    const pct = totalLiability > 0 ? (item.value / totalLiability) * 100 : 0;
                    return (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{item.label}</span>
                          <div style={{ display: "flex", gap: "12px" }}>
                            <span style={{ fontSize: "11px", color: "#475569" }}>{pct.toFixed(1)}%</span>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: item.color }}>{fmt(item.value)}</span>
                          </div>
                        </div>
                        <div style={{ height: "5px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${item.color}, rgba(${item.rgb},0.5))`, borderRadius: "3px", boxShadow: `0 0 6px rgba(${item.rgb},0.5)` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>Total</span>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "#ef4444" }}>{fmt(totalLiability)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tax tips */}
            <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: "16px" }}>TAX TIPS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                {[
                  { icon: "💼", tip: "Tag business income to calculate self-employment tax (15.3%)", action: "Income Tracker", href: "/dashboard/income" },
                  { icon: "✍️", tip: "Log business write-offs to reduce your taxable income", action: "Write-Offs", href: "/dashboard/write-offs" },
                  { icon: "📅", tip: "Pay quarterly estimated taxes to avoid underpayment penalties" },
                  { icon: "🏦", tip: "Contribute to a SEP-IRA or Solo 401k to reduce self-employment tax" },
                  { icon: "📋", tip: "Keep records of all business expenses — mileage, home office, equipment" },
                ].map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "14px", flexShrink: 0 }}>{tip.icon}</span>
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.5 }}>{tip.tip}</div>
                      {tip.action && tip.href && (
                        <a href={tip.href} style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 600, textDecoration: "none" }}>Go to {tip.action} →</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "14px", padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", fontSize: "10px", color: "#334155", lineHeight: 1.5 }}>
                ⚠️ Estimates are for planning only. Consult a licensed tax professional for advice specific to your situation.
              </div>
            </div>
          </div>

          {/* Quarterly calendar */}
          <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: "16px" }}>
              QUARTERLY ESTIMATED TAX PAYMENTS — 2026
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              {[1, 2, 3, 4].map((q) => {
                const qEst = quarterly.find((e) => e.quarter === q);
                const isCurrentQ = q === currentQuarter;
                const isPastQ = q < currentQuarter;
                const amount = qEst?.total_tax_liability ?? 0;
                return (
                  <div key={q} style={{ padding: "16px", background: isCurrentQ ? "rgba(37,99,235,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${isCurrentQ ? "rgba(37,99,235,0.25)" : "rgba(255,255,255,0.05)"}`, borderRadius: "12px", position: "relative" }}>
                    {isCurrentQ && <div style={{ position: "absolute", top: "10px", right: "10px", padding: "2px 8px", background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "99px", fontSize: "9px", fontWeight: 700, color: "#38bdf8" }}>NOW</div>}
                    <div style={{ fontSize: "10px", fontWeight: 700, color: isCurrentQ ? "#38bdf8" : "#475569", letterSpacing: "0.08em", marginBottom: "6px" }}>{QUARTER_LABELS[q]}</div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: amount > 0 ? "#ef4444" : "#334155", marginBottom: "4px" }}>{fmt(amount)}</div>
                    <div style={{ fontSize: "10px", color: "#334155", marginBottom: "8px" }}>Due: {QUARTERLY_DUE_DATES[q]}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: isPastQ ? "#22c55e" : isCurrentQ ? "#f59e0b" : "#334155", boxShadow: isPastQ ? "0 0 6px rgba(34,197,94,0.6)" : isCurrentQ ? "0 0 6px rgba(245,158,11,0.6)" : "none" }} />
                      <span style={{ fontSize: "10px", color: isPastQ ? "#22c55e" : isCurrentQ ? "#f59e0b" : "#334155" }}>{isPastQ ? "Past" : isCurrentQ ? "Upcoming" : "Future"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: "12px", fontSize: "11px", color: "#1e293b" }}>
              Quarterly estimates equal annual liability ÷ 4. Tag business or self-employment income to generate accurate amounts.
            </div>
          </div>
        </>
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      {showEditProfile && (
        <div style={modalOverlay} onClick={() => { if (profileComplete) { setShowEditProfile(false); setProfileMsg(null); } }}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              {profile ? "Edit Tax Profile" : "Create Tax Profile"}
            </h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 20px" }}>
              {profile ? "Changes will trigger an automatic tax recalculation." : "Required to generate accurate tax estimates."}
            </p>
            <ProfileForm />
          </div>
        </div>
      )}

      {/* ── ADD INCOME MODAL ── */}
      {showAddIncome && (
        <div style={modalOverlay} onClick={() => setShowAddIncome(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Add Manual Income</h2>
            <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 20px" }}>
              Record income not in a connected bank — cash, invoices, PayPal, Venmo, checks. Business and Rental income feed your tax calculations automatically.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>INCOME TYPE</label>
                <select value={incomeSubtype} onChange={(e) => setIncomeSubtype(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  {INCOME_SUBTYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {(incomeSubtype === "business" || incomeSubtype === "rental") && (
                  <div style={{ fontSize: "10px", color: "#22c55e", marginTop: "5px" }}>✓ Included in tax estimates</div>
                )}
              </div>
              <div>
                <label style={labelStyle}>AMOUNT</label>
                <input type="number" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} placeholder="0.00"
                  style={{ ...inputStyle, fontSize: "18px", fontWeight: 700 }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              <div>
                <label style={labelStyle}>DATE RECEIVED</label>
                <input type="date" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              <div>
                <label style={labelStyle}>DESCRIPTION / SOURCE</label>
                <input value={incomeDesc} onChange={(e) => setIncomeDesc(e.target.value)} placeholder="e.g. Client invoice, Airbnb rental, Freelance project..." style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
              {incomeMsg && (
                <div style={{ padding: "10px 12px", background: incomeMsg.includes("added") || incomeMsg.includes("success") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${incomeMsg.includes("added") || incomeMsg.includes("success") ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: "8px", fontSize: "12px", color: incomeMsg.includes("added") || incomeMsg.includes("success") ? "#22c55e" : "#ef4444" }}>
                  {incomeMsg}
                </div>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowAddIncome(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={addManualIncome} disabled={savingIncome || !incomeAmount || !incomeDate}
                  style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: savingIncome || !incomeAmount || !incomeDate ? "not-allowed" : "pointer", opacity: savingIncome || !incomeAmount || !incomeDate ? 0.7 : 1 }}>
                  {savingIncome ? "Adding..." : "Add Income & Recalculate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

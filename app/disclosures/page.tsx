"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DisclosuresPage() {
  const router = useRouter();
  const sections = [{ num:"1", title:"Financial Account Connectivity Disclosure", content:`Use of Plaid
BURE LLC (“BURE,” “we,” “us,” or “our”) uses Plaid Technologies, Inc. (“Plaid”) to enable users to connect bank and brokerage accounts to the FinOps Financial Center platform.

When you connect a financial account:
• You are securely redirected to Plaid’s authentication interface.
• BURE LLC does not receive or store your banking login credentials.
• Authentication is handled directly by Plaid.
• Plaid provides BURE LLC with authorized financial data such as account balances, transaction history, and investment holdings.

Plaid operates as an independent service provider subject to its own privacy policy and security practices.
Plaid Privacy Policy: https://plaid.com/legal

You may disconnect a connected account at any time within the application settings. Upon disconnection, BURE LLC will revoke associated access tokens and cease further data retrieval.

Use of SnapTrade
BURE LLC uses SnapTrade to enable brokerage account connectivity and access to investment account data.

When connecting through SnapTrade:
• Access is granted only with your explicit authorization.
• Brokerage credentials are handled securely by SnapTrade or the brokerage institution.
• BURE LLC does not store brokerage login credentials.
• Access tokens used for brokerage data retrieval are encrypted at rest.
• You may revoke brokerage access at any time.

Upon revocation or account deletion:
• SnapTrade access tokens are invalidated.
• Brokerage data retrieval ceases.
• Associated connection records are deleted in accordance with our retention policies.

Nature of Platform Services
FinOps Financial Center, operated by BURE LLC, is a financial analytics and data aggregation platform.

We:
• Provide read-only financial data access.
• Do not execute trades.
• Do not transfer funds.
• Do not act as a broker-dealer.
• Do not act as a registered investment advisor.
• Do not provide fiduciary services.` }, { num:"2", title:"AI-Powered Insights Disclosure", content:`FinOps includes an AI-powered assistant (“LevelUP”) that provides contextual financial insights.

Important:
• AI-generated content is for informational purposes only.
• AI outputs may contain inaccuracies.
• AI responses do not constitute investment, tax, accounting, or legal advice.
• Users remain solely responsible for financial decisions.

BURE LLC does not guarantee financial outcomes, investment performance, or tax results.` }, { num:"3", title:"Subscription Terms (Apple & Google In-App Purchases)", content:`FinOps Financial Center offers paid subscription plans through Apple App Store and Google Play.

Billing
• Subscriptions are billed to your Apple ID or Google Play account at confirmation of purchase.
• Subscriptions automatically renew unless canceled at least 24 hours before the end of the current billing period.
• Renewal charges occur within 24 hours prior to the end of the current period.

Subscription Management
You may:
• Manage or cancel subscriptions through your Apple App Store or Google Play account settings.
• Restore purchases within the app using the “Restore Purchases” feature.

BURE LLC does not process subscription cancellations directly. All subscription management must occur through the respective app store platform.

Free Trials (If Applicable)
If a free trial is offered:
• Any unused portion of the free trial will be forfeited upon subscription purchase.
• Trial eligibility may be limited to one per user.

Refunds
Refunds are governed by Apple App Store and Google Play policies.
BURE LLC does not directly issue subscription refunds for in-app purchases.` }, { num:"4", title:"Data Retention & Deletion", content:`Financial data is retained:
• While your account remains active.
• In encrypted backups for a limited period not exceeding 90 days for disaster recovery.

Upon account deletion:
• User account data is permanently deleted.
• Financial connection tokens are revoked.
• Financial records are removed from active systems.
• Retrieval of deleted data is not possible once deletion is processed.

Users may request account deletion within the application settings.` }, { num:"5", title:"Security Practices", content:`BURE LLC employs industry-standard safeguards including:
• AES-256 encryption at rest
• TLS 1.2+ encryption in transit
• Encrypted access tokens
• Multi-Factor Authentication (MFA) support
• Role-based data access controls
• Row-Level Security (RLS)
• Structured audit logging` }, { num:"6", title:"Limitation of Role", content:`BURE LLC:
• Is not a bank.
• Is not a broker-dealer.
• Is not a registered investment advisor.
• Does not execute trades.
• Does not provide fiduciary services.
• Does not guarantee financial performance or tax outcomes.

Use of the platform is at your own risk.` }, { num:"7", title:"Contact Information", content:`BURE LLC
admin@burellc.com` }];

  return <div style={{ minHeight:"100vh", background:"linear-gradient(135deg, #060810 0%, #0a0f1a 50%, #060810 100%)", color:"#e2e8f0", fontFamily:"var(--font-geist-sans), system-ui, sans-serif" }}><div style={{ padding:"20px 40px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(8,11,18,0.8)", backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:100 }}><div style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" }} onClick={() => router.push("/")}><div style={{ width:"32px", height:"32px", borderRadius:"9px", background:"linear-gradient(135deg, #1e3a5f, #0a1628)", border:"1px solid rgba(56,189,248,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}><div style={{ display:"flex", gap:"3px" }}><div style={{ width:"5px", height:"5px", background:"#38bdf8", borderRadius:"1px" }} /><div style={{ width:"5px", height:"5px", background:"#38bdf8", borderRadius:"1px" }} /></div></div><span style={{ fontSize:"16px", fontWeight:700, color:"#f8fafc" }}>FinOps Financial Center</span></div><button onClick={() => router.back()} style={{ padding:"8px 16px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", color:"#94a3b8", fontSize:"13px", cursor:"pointer" }}>← Back</button></div><div style={{ maxWidth:"900px", margin:"0 auto", padding:"48px 40px 80px" }}><div style={{ marginBottom:"40px" }}><div style={{ fontSize:"12px", fontWeight:700, color:"#38bdf8", letterSpacing:"0.12em", marginBottom:"12px" }}>LEGAL + SUBSCRIPTIONS</div><h1 style={{ fontSize:"36px", fontWeight:800, color:"#f8fafc", margin:"0 0 12px", letterSpacing:"-0.02em" }}>Financial Connectivity & Subscription Disclosures</h1><p style={{ fontSize:"14px", color:"#475569", margin:0 }}>Effective Date: April 29, 2026 · Last Updated: April 29, 2026</p><p style={{ fontSize:"14px", color:"#475569", margin:"6px 0 0" }}>These disclosures apply to FinOps Financial Center, operated by <strong style={{ color:"#94a3b8" }}>BURE LLC</strong>.</p></div><div style={{ display:"flex", flexDirection:"column", gap:"36px" }}>{sections.map((section) => <div key={section.num}><div style={{ display:"flex", gap:"16px", alignItems:"flex-start" }}><div style={{ width:"32px", height:"32px", borderRadius:"9px", background:"rgba(37,99,235,0.15)", border:"1px solid rgba(37,99,235,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:800, color:"#38bdf8", flexShrink:0, marginTop:"2px" }}>{section.num}</div><div style={{ flex:1 }}><h2 style={{ fontSize:"18px", fontWeight:700, color:"#f8fafc", margin:"0 0 12px", letterSpacing:"-0.01em" }}>{section.title}</h2><div style={{ fontSize:"14px", color:"#64748b", lineHeight:1.8, whiteSpace:"pre-line" }}>{section.content}</div></div></div><div style={{ height:"1px", background:"rgba(255,255,255,0.05)", marginTop:"36px" }} /></div>)}</div><div style={{ marginTop:"24px", textAlign:"center", fontSize:"12px", color:"#1e293b" }}>© {new Date().getFullYear()} BURE LLC · FinOps Financial Center<span style={{ margin:"0 8px" }}>·</span><Link href="/terms" style={{ color:"#334155", textDecoration:"none" }}>Terms</Link><span style={{ margin:"0 8px" }}>·</span><Link href="/privacy" style={{ color:"#334155", textDecoration:"none" }}>Privacy Policy</Link><span style={{ margin:"0 8px" }}>·</span><Link href="/contact" style={{ color:"#334155", textDecoration:"none" }}>Contact Us</Link></div></div></div>;
}

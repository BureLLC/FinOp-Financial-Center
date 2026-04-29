"use client";

import { useRouter } from "next/navigation";

export default function TermsOfServicePage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #060810 0%, #0a0f1a 50%, #060810 100%)",
      color: "#e2e8f0",
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    }}>
      <div style={{ padding: "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(8,11,18,0.8)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => router.push("/")}>
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg, #1e3a5f, #0a1628)", border: "1px solid rgba(56,189,248,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", gap: "3px" }}>
              <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "1px" }} />
              <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "1px" }} />
            </div>
          </div>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc" }}>FinOps Financial Center</span>
        </div>
        <button onClick={() => router.back()} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#94a3b8", fontSize: "13px", cursor: "pointer" }}>← Back</button>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 40px 80px" }}>
        <div style={{ marginBottom: "40px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.12em", marginBottom: "12px" }}>LEGAL</div>
          <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#f8fafc", margin: "0 0 12px", letterSpacing: "-0.02em" }}>Terms of Service</h1>
          <p style={{ fontSize: "14px", color: "#475569", margin: 0 }}>Effective Date: April 26, 2026 · Last Updated: April 26, 2026</p>
          <p style={{ fontSize: "14px", color: "#475569", margin: "6px 0 0" }}>These Terms govern your use of FinOps Financial Center, operated by <strong style={{ color: "#94a3b8" }}>BURE LLC</strong>.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
          {[
            { num: "1", title: "Acceptance of Terms", content: `By accessing or using FinOps Financial Center (the "App"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you may not use the App.\n\nThese Terms constitute a legally binding agreement between you and BURE LLC. We reserve the right to modify these Terms at any time. Continued use after changes constitutes acceptance.\n\nYou must be at least 18 years of age to use this App.` },
            { num: "2", title: "Description of Service", content: `FinOps Financial Center is a personal financial management platform providing:\n\n• Financial account aggregation and transaction tracking\n• Investment portfolio monitoring and performance tracking\n• Trading journal and trade logging capabilities\n• Budget management and expense tracking\n• Tax estimation and write-off tracking\n• AI-powered financial insights through LevelUP\n• Savings goal tracking and management\n\nThe App is for informational purposes only. We do not provide investment advisory services, execute trades, prepare taxes, or act as a financial institution.` },
            { num: "3", title: "Account Registration", content: `To use the App you must provide your legal first and last name and a valid email address. You are responsible for:\n\n• Maintaining the confidentiality of your credentials\n• All activity that occurs under your account\n• Notifying us immediately of unauthorized access at contact@burellc.com\n• Keeping your information accurate\n\nMulti-factor authentication (MFA) is required for all accounts and cannot be disabled. We reserve the right to suspend accounts that violate these Terms.` },
            { num: "4", title: "Financial Data and Third-Party Connections", content: `The App integrates with Plaid Technologies and SnapTrade to connect your financial accounts. By connecting accounts you:\n\n• Authorize us to retrieve your financial data through these providers\n• Agree to the terms of Plaid (plaid.com/legal) and SnapTrade\n• Understand we do not store your bank or brokerage login credentials\n• Acknowledge data accuracy depends on third-party providers\n\nWe are not responsible for errors or inaccuracies from third-party services.` },
            { num: "5", title: "Not Financial, Tax, or Legal Advice", content: `IMPORTANT: FinOps Financial Center and LevelUP do not provide professional financial, investment, tax, or legal advice.\n\nAll content, calculations, estimates, and AI insights are for informational purposes only. This includes:\n\n• Tax estimates — approximations only, not for filing\n• Investment calculations — may not account for all fees or adjustments\n• AI-generated insights — informational, not professional advice\n\nConsult a licensed financial advisor, CPA, or attorney for advice specific to your situation.` },
            { num: "6", title: "Subscription and Payments", content: `Certain features require a paid subscription. By subscribing:\n\n• You authorize recurring charges to your payment method\n• Subscriptions renew automatically unless cancelled before renewal\n• Refunds are evaluated on a case-by-case basis\n• Pricing changes require 30 days advance notice\n\nTo cancel, contact contact@burellc.com. Access continues until the end of your paid period. Payments are processed by Stripe, Inc.` },
            { num: "7", title: "Acceptable Use", content: `You agree not to:\n\n• Violate any applicable law or regulation\n• Provide false or fraudulent information\n• Attempt unauthorized access to any part of the App\n• Reverse engineer or decompile the App\n• Use automated tools to scrape or extract data\n• Upload malicious code or harmful content\n• Use the App for illegal financial activity or money laundering\n• Share your account with others\n\nViolation may result in immediate account termination without refund.` },
            { num: "8", title: "Intellectual Property", content: `All content, features, design, and code in the App are owned by BURE LLC and protected by intellectual property laws.\n\nYou are granted a limited, non-exclusive license to use the App for personal financial management. This does not include the right to copy, distribute, create derivative works, or sell access to the App.\n\nYour user-generated content (journal entries, notes, goals) remains your property. By submitting content you grant us a license to store and display it to provide the service.` },
            { num: "9", title: "Privacy", content: `Your use of the App is governed by our Privacy Policy at finopsfinancialcenter.vercel.app/privacy. Key points:\n\n• We do not sell your personal data\n• We use industry-standard security including encryption and MFA\n• You may request deletion of your data at any time\n• LevelUP conversation context is processed by Anthropic per their privacy policy` },
            { num: "10", title: "Disclaimers and Limitation of Liability", content: `THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.\n\nBURE LLC DOES NOT WARRANT THAT the App will be uninterrupted or error-free, financial data will be accurate, or tax estimates will be compliant with tax law.\n\nTO THE MAXIMUM EXTENT PERMITTED BY LAW, BURE LLC SHALL NOT BE LIABLE FOR any indirect, incidental, or consequential damages, financial losses from reliance on App calculations or AI insights, or third-party service failures.\n\nOur total liability shall not exceed the amount you paid us in the 12 months preceding the claim, or $100, whichever is greater.` },
            { num: "11", title: "Indemnification", content: `You agree to indemnify and hold harmless BURE LLC, its officers, directors, employees, and agents from any claims, liabilities, damages, and expenses arising from your use of the App, your violation of these Terms, or your violation of any applicable laws.` },
            { num: "12", title: "Termination", content: `Either party may terminate this agreement at any time.\n\nYou may terminate by contacting contact@burellc.com to delete your account.\n\nWe may suspend or terminate your access immediately if you violate these Terms, engage in fraudulent activity, or fail to pay subscription fees.\n\nUpon termination your data will be retained for 90 days then permanently deleted, except where required by law.` },
            { num: "13", title: "Governing Law and Disputes", content: `These Terms are governed by the laws of the United States and the state in which BURE LLC is registered.\n\nDisputes shall first be attempted through informal negotiation at contact@burellc.com. If unresolved, disputes shall be resolved through binding arbitration per the American Arbitration Association's rules. You waive the right to participate in class action lawsuits against BURE LLC.` },
            { num: "14", title: "Changes to Terms", content: `We may update these Terms at any time. For material changes we will:\n\n• Update the "Last Updated" date\n• Notify you via email or in-app notification at least 14 days before changes take effect\n• Require re-acceptance for significant changes\n\nContinued use after the effective date constitutes acceptance.` },
            { num: "15", title: "Contact Information", content: `For questions about these Terms:\n\nBURE LLC\nEmail: contact@burellc.com\n\nPrivacy inquiries: privacy@burellc.com\n\nWe aim to respond to all inquiries within 5 business days.` },
          ].map((section) => (
            <div key={section.num}>
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "#38bdf8", flexShrink: 0, marginTop: "2px" }}>
                  {section.num}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 12px", letterSpacing: "-0.01em" }}>{section.title}</h2>
                  <div style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.8, whiteSpace: "pre-line" }}>{section.content}</div>
                </div>
              </div>
              <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", marginTop: "36px" }} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: "48px", padding: "24px", background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: "14px", textAlign: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#f8fafc", marginBottom: "8px" }}>Questions about our Terms?</div>
          <div style={{ fontSize: "13px", color: "#475569", marginBottom: "16px" }}>We are happy to clarify anything in these Terms of Service.</div>
          <a href="mailto:contact@burellc.com" style={{ padding: "10px 24px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, textDecoration: "none", display: "inline-block" }}>Contact Us</a>
        </div>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "12px", color: "#1e293b" }}>
          © {new Date().getFullYear()} BURE LLC · FinOps Financial Center
          <span style={{ margin: "0 8px" }}>·</span>
          <a href="/privacy" style={{ color: "#334155", textDecoration: "none" }}>Privacy Policy</a>
          <span style={{ margin: "0 8px" }}>·</span>
          <a href="/contact" style={{ color: "#334155", textDecoration: "none" }}>Contact Us</a>
        </div>
      </div>
    </div>
  );
}

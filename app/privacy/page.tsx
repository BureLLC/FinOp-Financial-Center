"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #060810 0%, #0a0f1a 50%, #060810 100%)",
      color: "#e2e8f0",
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 40px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "rgba(8,11,18,0.8)", backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "9px",
            background: "linear-gradient(135deg, #1e3a5f, #0a1628)",
            border: "1px solid rgba(56,189,248,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ display: "flex", gap: "3px" }}>
              <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "1px" }} />
              <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "1px" }} />
            </div>
          </div>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc" }}>FinOps Financial Center</span>
        </div>
        <button onClick={() => router.back()}
          style={{ padding: "8px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#94a3b8", fontSize: "13px", cursor: "pointer" }}>
          ← Back
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 40px 80px" }}>
        {/* Title */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.12em", marginBottom: "12px" }}>LEGAL</div>
          <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#f8fafc", margin: "0 0 12px", letterSpacing: "-0.02em" }}>Privacy Policy</h1>
          <p style={{ fontSize: "14px", color: "#475569", margin: 0 }}>
            Effective Date: April 26, 2026 · Last Updated: April 26, 2026
          </p>
          <p style={{ fontSize: "14px", color: "#475569", margin: "6px 0 0" }}>
            This Privacy Policy applies to FinOps Financial Center, operated by <strong style={{ color: "#94a3b8" }}>BURE LLC</strong>.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>

          {/* Section helper */}
          {[
            {
              num: "1",
              title: "Introduction",
              content: `BURE LLC ("we," "us," or "our") operates FinOps Financial Center (the "App"), a personal financial management platform. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our App.

By creating an account or using the App, you agree to the terms of this Privacy Policy. If you do not agree, please discontinue use of the App immediately.`,
            },
            {
              num: "2",
              title: "Information We Collect",
              content: `We collect the following categories of information:

A. Information You Provide Directly
- Account information: First name, last name, email address, and password when you register
- Tax profile: Filing status, entity type, tax year, and jurisdiction information
- Financial goals: Savings goals, budget categories, and envelope allocations you create manually
- Trade logs: Trading journal entries, positions, and notes you enter manually
- Write-offs: Business expense records you create
- Income records: Manual income entries you submit

B. Financial Data from Third-Party Connections
When you connect financial institutions through Plaid, SnapTrade, or other authorized providers, we receive:
- Account balances and account types
- Transaction history (descriptions, amounts, dates, categories)
- Investment positions and portfolio data
- Brokerage account data

We do not store your bank login credentials. All financial connections use secure, tokenized access through our licensed data partners.

C. Automatically Collected Information
- Device type, browser type, and operating system
- IP address and approximate geographic location
- Pages visited, features used, and time spent in the App
- Authentication events and session data

D. Communications
- Support requests or feedback you send us`,
            },
            {
              num: "3",
              title: "How We Use Your Information",
              content: `We use your information to:

- Provide, operate, and improve the App and its features
- Display your financial data, calculate net worth, budgets, tax estimates, and investment performance
- Generate automatic alerts and AI-powered insights through LevelUP
- Process and display transaction data from connected accounts
- Calculate and display tax estimates based on your profile and income
- Personalize your experience and remember your preferences
- Send you important account and security notifications
- Respond to your support requests
- Comply with legal obligations
- Prevent fraud and protect the security of our platform

We do not use your personal financial data for advertising or sell your data to third parties.`,
            },
            {
              num: "4",
              title: "How We Share Your Information",
              content: `We do not sell, rent, or trade your personal information. We share information only in the following limited circumstances:

A. Service Providers
We share data with trusted third-party service providers who help operate the App, including:
- Supabase (database and authentication infrastructure)
- Vercel (hosting and deployment)
- Plaid Technologies, Inc. (bank and financial account connectivity)
- SnapTrade (brokerage and investment account connectivity)
- Anthropic, PBC (AI assistant — LevelUP — processes anonymized query context)
- Stripe, Inc. (payment processing for subscriptions, if applicable)

All service providers are contractually required to protect your data and may only use it to provide services on our behalf.

B. Legal Requirements
We may disclose your information if required by law, court order, or governmental authority, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.

C. Business Transfers
If BURE LLC is involved in a merger, acquisition, or sale of assets, your information may be transferred. We will notify you via email or prominent notice in the App before your data is transferred and becomes subject to a different privacy policy.

D. With Your Consent
We may share your information with third parties when you have given us explicit permission to do so.`,
            },
            {
              num: "5",
              title: "Data Security",
              content: `We implement industry-standard security measures to protect your personal information, including:

- AES-256 encryption for data at rest
- TLS 1.3 encryption for all data in transit
- Multi-factor authentication (TOTP) required for all accounts
- Row-level security on all database tables — your data is only accessible by you
- Secure tokenized connections to financial institutions (we never store bank credentials)
- Regular security audits and vulnerability assessments

While we take extensive measures to protect your data, no method of electronic storage or transmission over the internet is 100% secure. We cannot guarantee absolute security.`,
            },
            {
              num: "6",
              title: "Data Retention",
              content: `We retain your personal information for as long as your account is active or as needed to provide you services. Specifically:

- Account data: Retained while your account is active and for 90 days after deletion
- Financial transaction data: Retained for 7 years to comply with financial record-keeping requirements
- Tax-related data: Retained for 7 years in accordance with IRS record-keeping guidelines
- Trade journal entries: Retained while your account is active
- Audit logs: Retained for 12 months

You may request deletion of your account and associated data at any time. Some data may be retained longer if required by law.`,
            },
            {
              num: "7",
              title: "Your Rights and Choices",
              content: `Depending on your location, you may have the following rights regarding your personal information:

- Access: Request a copy of the personal information we hold about you
- Correction: Request correction of inaccurate or incomplete information
- Deletion: Request deletion of your account and personal data
- Portability: Request your data in a portable format
- Opt-out: Opt out of non-essential communications
- Restriction: Request that we limit how we process your data

To exercise any of these rights, contact us at privacy@burellc.com. We will respond to all requests within 30 days.

California Residents (CCPA): You have the right to know what personal information we collect, request deletion, and opt out of any sale of personal information. We do not sell personal information.

European Residents (GDPR): You have additional rights including the right to object to processing and the right to lodge a complaint with a supervisory authority.`,
            },
            {
              num: "8",
              title: "Third-Party Financial Connections",
              content: `When you connect financial institutions through our App:

Plaid Technologies, Inc.: We use Plaid to connect your bank and financial accounts. When you link an account, you are also subject to Plaid's Privacy Policy (plaid.com/legal). Plaid's End User Privacy Policy is available at plaid.com/legal/#end-user-privacy-policy.

SnapTrade: We use SnapTrade to connect brokerage and investment accounts. Your use of this connection is also subject to SnapTrade's Privacy Policy.

You may disconnect any financial institution at any time through the Connections page in the App. Disconnecting will stop new data from being pulled but may not immediately delete historical data already synced.`,
            },
            {
              num: "9",
              title: "AI-Powered Features",
              content: `Our LevelUP AI assistant is powered by Anthropic's Claude API. When you interact with LevelUP:

- Your financial snapshot data (net worth, balances, goals, trades) is included in the context sent to the AI to provide personalized responses
- Conversation content may be processed by Anthropic in accordance with their privacy policy (anthropic.com/privacy)
- We do not store your LevelUP conversations permanently — sessions are ephemeral
- Do not share sensitive identification information (Social Security numbers, full account numbers) in chat

AI-generated responses are for informational purposes only and do not constitute professional financial, tax, legal, or investment advice.`,
            },
            {
              num: "10",
              title: "Children's Privacy",
              content: `FinOps Financial Center is not directed to children under the age of 18. We do not knowingly collect personal information from minors. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately at privacy@burellc.com and we will delete the information promptly.`,
            },
            {
              num: "11",
              title: "Cookies and Tracking",
              content: `We use essential cookies and local storage to:

- Maintain your authenticated session
- Remember your preferences and settings
- Ensure the App functions correctly

We do not use advertising cookies or track you across third-party websites. You may disable cookies in your browser settings, but this may affect the functionality of the App.`,
            },
            {
              num: "12",
              title: "International Data Transfers",
              content: `BURE LLC is based in the United States. If you are accessing the App from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States. By using the App, you consent to this transfer.

We ensure that appropriate safeguards are in place for any international transfers of personal data in accordance with applicable data protection laws.`,
            },
            {
              num: "13",
              title: "Changes to This Privacy Policy",
              content: `We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. When we make material changes, we will:

- Update the "Last Updated" date at the top of this page
- Notify you via email or an in-app notification
- Require re-acceptance if the changes are significant

Your continued use of the App after changes become effective constitutes your acceptance of the updated Privacy Policy.`,
            },
            {
              num: "14",
              title: "Contact Us",
              content: `If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

BURE LLC
Privacy Officer
Email: privacy@burellc.com

For data deletion requests, account inquiries, or to exercise your privacy rights, please email privacy@burellc.com with the subject line "Privacy Request" and we will respond within 30 days.`,
            },
          ].map((section) => (
            <div key={section.num}>
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "#38bdf8", flexShrink: 0, marginTop: "2px" }}>
                  {section.num}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 12px", letterSpacing: "-0.01em" }}>
                    {section.title}
                  </h2>
                  <div style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                    {section.content}
                  </div>
                </div>
              </div>
              <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", marginTop: "36px" }} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "48px", padding: "24px", background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: "14px", textAlign: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#f8fafc", marginBottom: "8px" }}>Questions about your privacy?</div>
          <div style={{ fontSize: "13px", color: "#475569", marginBottom: "16px" }}>We are committed to protecting your data and being transparent about our practices.</div>
          <a href="mailto:privacy@burellc.com"
            style={{ padding: "10px 24px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
            Contact Privacy Team
          </a>
        </div>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "12px", color: "#1e293b" }}>
          © {new Date().getFullYear()} BURE LLC. All rights reserved. · FinOps Financial Center · <a href="/terms" style={{ color: "#334155", textDecoration: "none" }}>Terms of Service</a> · <a href="/disclosures" style={{ color: "#334155", textDecoration: "none" }}>Disclosures</a>
        </div>
      </div>
    </div>
  );
}

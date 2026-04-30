"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ContactPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) return;
    const mailtoLink = `mailto:contact@burellc.com?subject=${encodeURIComponent(subject || "FinOps Contact Request")}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
    window.location.href = mailtoLink;
    setSent(true);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px", color: "#e2e8f0", fontSize: "14px",
    outline: "none", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px", fontWeight: 700, color: "#475569",
    letterSpacing: "0.08em", display: "block", marginBottom: "6px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #060810 0%, #0a0f1a 50%, #060810 100%)", color: "#e2e8f0", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(8,11,18,0.8)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => router.push("/")}>
          <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: "linear-gradient(135deg, #1e3a5f, #0a1628)", border: "1px solid rgba(56,189,248,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", gap: "3px" }}>
              <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "1px" }} />
              <div style={{ width: "5px", height: "5px", background: "#38bdf8", borderRadius: "1px" }} />
            </div>
          </div>
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>FinOps</span>
        </div>
        <button onClick={() => router.back()} style={{ padding: "7px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#94a3b8", fontSize: "13px", cursor: "pointer" }}>← Back</button>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 16px 80px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.12em", marginBottom: "10px" }}>CONTACT US</div>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 800, color: "#f8fafc", margin: "0 0 12px", letterSpacing: "-0.02em" }}>We're Here to Help</h1>
          <p style={{ fontSize: "14px", color: "#475569", margin: "0 auto", maxWidth: "420px", lineHeight: 1.7 }}>
            Have a question or need support? Reach out and we'll get back to you within 24 hours.
          </p>
        </div>

        {/* Direct contact pills */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "28px", flexWrap: "wrap" }}>
          {[
            { icon: "✉️", label: "General", value: "contact@burellc.com", href: "mailto:contact@burellc.com" },
            { icon: "🔒", label: "Privacy", value: "privacy@burellc.com", href: "mailto:privacy@burellc.com" },
          ].map((item, i) => (
            <a key={i} href={item.href} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "99px", textDecoration: "none" }}>
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: "10px", color: "#475569", fontWeight: 700 }}>{item.label.toUpperCase()}</div>
                <div style={{ fontSize: "12px", color: "#38bdf8", fontWeight: 600 }}>{item.value}</div>
              </div>
            </a>
          ))}
        </div>

        {/* Contact form */}
        <div style={{ padding: "24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px" }}>Send a Message</h2>
          <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 20px" }}>We'll respond within 24 hours on business days.</p>

          {sent ? (
            <div style={{ padding: "24px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>✅</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#22c55e", marginBottom: "6px" }}>Message Ready to Send</div>
              <div style={{ fontSize: "13px", color: "#475569" }}>Your email client has opened. Send it to complete your request.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>YOUR NAME *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name" style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
                </div>
                <div>
                  <label style={labelStyle}>EMAIL ADDRESS *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>TOPIC</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Select a topic...</option>
                  <option value="General Question">General Question</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Account & Billing">Account & Billing</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Partnership Inquiry">Partnership Inquiry</option>
                  <option value="Privacy Request">Privacy Request</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>MESSAGE *</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help you?" rows={5}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(37,99,235,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
              </div>
              <button onClick={handleSubmit} disabled={!name.trim() || !email.trim() || !message.trim()}
                style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: !name.trim() || !email.trim() || !message.trim() ? "not-allowed" : "pointer", opacity: !name.trim() || !email.trim() || !message.trim() ? 0.6 : 1, boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                Send Message →
              </button>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div style={{ padding: "20px 24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", marginBottom: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc", marginBottom: "14px" }}>Common Questions</div>
          {[
            { q: "How do I connect my bank account?", a: "Go to Financial Connections in the dashboard and select your institution." },
            { q: "Is my financial data secure?", a: "Yes. We use AES-256 encryption, MFA, and never store bank credentials." },
            { q: "How do I cancel my subscription?", a: "For App Store and Google Play subscriptions, manage or cancel in your Apple/Google account settings. Refunds follow Apple/Google policies." },
            { q: "I'm having trouble with MFA.", a: "Make sure your phone's time is set to automatic. Open your authenticator app and select the FinOps entry." },
          ].map((item, i, arr) => (
            <div key={i} style={{ marginBottom: i < arr.length - 1 ? "12px" : 0, paddingBottom: i < arr.length - 1 ? "12px" : 0, borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>{item.q}</div>
              <div style={{ fontSize: "12px", color: "#475569", lineHeight: 1.6 }}>{item.a}</div>
            </div>
          ))}
        </div>

        {/* Company info */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc", marginBottom: "4px" }}>BURE LLC</div>
          <div style={{ fontSize: "12px", color: "#475569", marginBottom: "12px" }}>Operator of FinOps Financial Center</div>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <a href="/privacy" style={{ fontSize: "12px", color: "#38bdf8", textDecoration: "none" }}>Privacy Policy</a>
            <a href="/terms" style={{ fontSize: "12px", color: "#38bdf8", textDecoration: "none" }}>Terms of Service</a>
 codex/conduct-security-and-architecture-audit-qqgarn
            <a href="/disclosures" style={{ fontSize: "12px", color: "#38bdf8", textDecoration: "none" }}>Disclosures</a>

 main
            <Link href="/" style={{ fontSize: "12px", color: "#38bdf8", textDecoration: "none" }}>Homepage</Link>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "20px", textAlign: "center", fontSize: "12px", color: "#1e293b" }}>
        © {new Date().getFullYear()} BURE LLC · FinOps Financial Center
      </div>
    </div>
  );
}

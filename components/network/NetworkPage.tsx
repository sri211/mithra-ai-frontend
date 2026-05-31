"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Search, Building2, Copy, Sparkles, Check,
  TrendingUp, Clock, Star, UserCheck, ExternalLink,
} from "lucide-react";
import { LinkedInIcon } from "@/components/ui/icons";
import { api } from "@/lib/api/client";

// ─── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_CONNECTIONS = [
  {
    id: "c1", name: "Priya Sharma", role: "Engineering Manager", company: "Google",
    avatar: "PS", color: "#7c3aed", type: "hiring_manager", mutual: 12,
    why: "Direct hiring manager for the infrastructure team you're targeting. Has posted about new headcount.",
    draft: "Hi Priya! I noticed your team recently shipped the new Search infrastructure. I'm exploring senior engineering roles at Google and would love a 15-min chat. We're both connected to Rahul Mehta!",
  },
  {
    id: "c2", name: "Arjun Nair", role: "Tech Recruiter", company: "Google",
    avatar: "AN", color: "#06b6d4", type: "recruiter", mutual: 5,
    why: "Active Google recruiter handling engineering hires in Bangalore. Specializes in infra and platform roles.",
    draft: "Hi Arjun, I'm a senior engineer with 6 years in distributed systems (ex-Swiggy). Actively exploring Google Bangalore roles. Would love to connect!",
  },
  {
    id: "c3", name: "Kavya Reddy", role: "Staff Engineer", company: "Google",
    avatar: "KR", color: "#10b981", type: "team_member", mutual: 8,
    why: "Team member who can share inside view of culture and interview process. Runs the internal referral program.",
    draft: "Hi Kavya! Your talk on Kubernetes optimization at KubeCon was brilliant. I'm exploring roles in your space and would love a quick coffee chat about the team culture.",
  },
  {
    id: "c4", name: "Vikram Patel", role: "SDE III → Googler Alumnus", company: "Razorpay",
    avatar: "VP", color: "#f59e0b", type: "alumnus", mutual: 15,
    why: "Former Googler who can give real interview insights and possibly provide a referral through their alumni network.",
    draft: "Hi Vikram! I see you made the transition from Google to fintech. I'm now looking to do the reverse! Would love your perspective on Google's interview process.",
  },
];

const TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  hiring_manager: { label: "Hiring Manager", color: "#ef4444", icon: "👔" },
  recruiter:      { label: "Recruiter",       color: "#06b6d4", icon: "🎯" },
  team_member:    { label: "Team Member",     color: "#10b981", icon: "👥" },
  alumnus:        { label: "Alumnus",         color: "#f59e0b", icon: "🎓" },
  influencer:     { label: "Influencer",      color: "#ec4899", icon: "⭐" },
};

const COMPANY_INSIGHTS = [
  { label: "Hiring Status", value: "Actively Hiring", color: "#10b981", Icon: TrendingUp },
  { label: "Team Size",     value: "200-500 eng.",    color: "#6366f1", Icon: Users },
  { label: "Culture Score", value: "4.3 / 5.0",       color: "#f59e0b", Icon: Star },
  { label: "Time to Hire",  value: "4-6 weeks",       color: "#06b6d4", Icon: Clock },
];

// ─── Styles ──────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "rgba(18,10,36,0.9)",
  border: "1px solid rgba(124,58,237,0.15)",
  borderRadius: "16px",
  padding: "20px",
};
const inputBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "rgba(15,8,30,0.8)",
  border: "1px solid rgba(124,58,237,0.2)",
  borderRadius: "10px",
  padding: "10px 14px",
  flex: 1,
};
const inputStyle: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  fontSize: "13px",
  color: "#f1f5f9",
  fontFamily: "inherit",
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function NetworkPage() {
  const [company, setCompany] = useState("Google");
  const [role, setRole] = useState("Senior Software Engineer");
  const [connections, setConnections] = useState(MOCK_CONNECTIONS);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const findConnections = async () => {
    setIsSearching(true);
    try {
      const { data } = await api.post("/network/find", { company, target_role: role, user_profile: {} });
      if (data.connections?.length) {
        // Normalize field names — backend uses 'draft', frontend mock used 'draft' too
        const normalized = data.connections.map((c: Record<string, string>) => ({
          ...c,
          draft: c.draft || c.message_draft || "",
          linkedin_search: c.linkedin_search || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent((c.role || "") + " " + (c.company || company))}`,
        }));
        setConnections(normalized);
      }
    } catch {
      /* keep mock */
    } finally {
      setIsSearching(false);
    }
  };

  const copyDraft = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#0a0614" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#f1f5f9" }}>Network Intelligence</h2>
            <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Find the right people at target companies and get AI-drafted outreach</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "6px 14px", borderRadius: "20px", border: "1px solid rgba(236,72,153,0.3)", background: "rgba(236,72,153,0.08)", color: "#f472b6" }}>
            <Users style={{ width: "13px", height: "13px" }} />Agent 5 — Network Intel
          </div>
        </div>

        {/* Search bar */}
        <div style={card}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={inputBox}>
                <Building2 style={{ width: "15px", height: "15px", color: "#475569", flexShrink: 0 }} />
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && findConnections()}
                  style={inputStyle}
                  placeholder="Company name (e.g. Google, Flipkart)..."
                />
              </div>
              <div style={inputBox}>
                <Search style={{ width: "15px", height: "15px", color: "#475569", flexShrink: 0 }} />
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && findConnections()}
                  style={inputStyle}
                  placeholder="Target role (e.g. Senior SWE, PM)..."
                />
              </div>
              <button
                onClick={findConnections}
                disabled={isSearching}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: 700, cursor: isSearching ? "not-allowed" : "pointer", flexShrink: 0, boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}
              >
                {isSearching ? (
                  <motion.div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
                ) : (
                  <UserCheck style={{ width: "14px", height: "14px" }} />
                )}
                {isSearching ? "Finding..." : "Find Connections"}
              </button>
            </div>
          </div>
        </div>

        {/* Company insight cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {COMPANY_INSIGHTS.map((s, i) => {
            const { Icon } = s;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{ ...card, padding: "16px", textAlign: "center" }}
              >
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", background: `${s.color}15` }}>
                  <Icon style={{ width: "16px", height: "16px", color: s.color }} />
                </div>
                <div style={{ fontSize: "14px", fontWeight: 900, marginBottom: "4px", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Connections grid */}
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", marginBottom: "16px" }}>
            {connections.length} Key Connections at{" "}
            <span style={{ color: "#a78bfa" }}>{company}</span>
            <span style={{ color: "#475569", fontWeight: 400 }}> for {role}</span>
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            {connections.map((conn, i) => {
              const typeInfo = TYPE_LABELS[conn.type] || { label: conn.type, color: "#94a3b8", icon: "👤" };
              return (
                <motion.div
                  key={conn.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  style={{ ...card, display: "flex", flexDirection: "column", gap: "12px" }}
                >
                  {/* Person header */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "white", flexShrink: 0, background: `${conn.color}22`, border: `1px solid ${conn.color}40` }}>
                      {conn.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const, marginBottom: "4px" }}>
                        <h4 style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "14px" }}>{conn.name}</h4>
                        <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", fontWeight: 600, background: `${typeInfo.color}15`, color: typeInfo.color, border: `1px solid ${typeInfo.color}25` }}>
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>{conn.role}</div>
                      <div style={{ fontSize: "11px", color: "#475569", marginTop: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Users style={{ width: "10px", height: "10px" }} />{conn.mutual} mutual connections
                      </div>
                    </div>
                    <a href={conn.linkedin_search || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(conn.role + ' ' + conn.company)}`} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", flexShrink: 0, textDecoration: "none" }} title="Search on LinkedIn">
                      <ExternalLink style={{ width: "15px", height: "15px" }} />
                    </a>
                  </div>

                  {/* Why connect */}
                  <div style={{ padding: "10px 12px", borderRadius: "10px", fontSize: "12px", color: "#cbd5e1", lineHeight: "1.6", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color: "#a78bfa", fontWeight: 600 }}>Why connect: </span>
                    {conn.why}
                  </div>

                  {/* AI draft */}
                  <div style={{ borderRadius: "10px", padding: "12px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#a78bfa", marginBottom: "8px", fontWeight: 600 }}>
                      <Sparkles style={{ width: "11px", height: "11px" }} />AI-Drafted Message
                    </div>
                    <p style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: "1.6" }}>{conn.draft}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
                      <span style={{ fontSize: "10px", color: "#475569" }}>{conn.draft.length} / 300 chars</span>
                      <button
                        onClick={() => copyDraft(conn.id, conn.draft)}
                        style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, background: "none", border: "none", cursor: "pointer", color: copiedId === conn.id ? "#10b981" : "#a78bfa" }}
                      >
                        {copiedId === conn.id ? (
                          <><Check style={{ width: "12px", height: "12px" }} />Copied!</>
                        ) : (
                          <><Copy style={{ width: "12px", height: "12px" }} />Copy Message</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* LinkedIn button */}
                  {conn.email_pattern && (
                    <div style={{ padding: "8px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "11px", color: "#475569" }}>
                      📧 <span style={{ color: "#64748b" }}>Likely email: </span>
                      <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>{conn.email_pattern}</span>
                    </div>
                  )}
                  <button
                    onClick={() => window.open(conn.linkedin_search || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(conn.role + ' ' + conn.company)}`, "_blank")}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "12px", padding: "10px", borderRadius: "10px", fontWeight: 600, color: "white", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#0a66c2,#1a76c2)", boxShadow: "0 4px 12px rgba(10,102,194,0.3)" }}
                  >
                    <LinkedInIcon style={{ width: "14px", height: "14px" }} />
                    Find on LinkedIn →
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/auth";
import { getLimits } from "@/lib/planLimits";
import {
  Users, Search, Building2, Copy, Sparkles, Check,
  TrendingUp, Clock, Star, UserCheck, ExternalLink,
  MapPin, ChevronDown, ChevronUp,
} from "lucide-react";
import { LinkedInIcon } from "@/components/ui/icons";
import { api } from "@/lib/api/client";

interface Connection {
  id: string; name: string; role: string; company: string;
  avatar: string; color: string; type: string; mutual: number;
  why: string; draft: string;
  linkedin_search?: string; linkedin_url?: string;
  email_pattern?: string; email_verified?: boolean;
  is_real?: boolean; is_search_card?: boolean;
}

const MOCK_CONNECTIONS: Connection[] = [
  { id: "c1", name: "Priya Sharma", role: "Engineering Manager", company: "Google", avatar: "PS", color: "#0F6E55", type: "hiring_manager", mutual: 12, why: "Direct hiring manager for the infrastructure team. Has posted about new headcount.", draft: "Hi Priya! I noticed your team recently shipped new Search infrastructure. I'm exploring senior engineering roles at Google and would love a 15-min chat!", linkedin_search: "https://www.linkedin.com/search/results/people/?keywords=Engineering+Manager+Google+India", email_pattern: "priya.sharma@google.com" },
  { id: "c2", name: "Arjun Nair", role: "Tech Recruiter", company: "Google", avatar: "AN", color: "#06b6d4", type: "recruiter", mutual: 5, why: "Active Google recruiter handling engineering hires in Bangalore.", draft: "Hi Arjun, I'm a senior engineer with 6 years in distributed systems. Actively exploring Google Bangalore roles. Would love to connect!", linkedin_search: "https://www.linkedin.com/search/results/people/?keywords=Technical+Recruiter+Google+Bangalore", email_pattern: "arjun.nair@google.com" },
  { id: "c3", name: "Kavya Reddy", role: "Staff Engineer", company: "Google", avatar: "KR", color: "#10b981", type: "team_member", mutual: 8, why: "Team member who can share inside view of culture and interview process.", draft: "Hi Kavya! Your talk on Kubernetes optimization was brilliant. I'm exploring roles in your space and would love a quick coffee chat!", linkedin_search: "https://www.linkedin.com/search/results/people/?keywords=Staff+Software+Engineer+Google+India", email_pattern: "kavya.reddy@google.com" },
  { id: "c4", name: "Vikram Patel", role: "Senior Engineer", company: "Razorpay", avatar: "VP", color: "#f59e0b", type: "alumnus", mutual: 15, why: "Former Googler who can give real interview insights and possibly provide a referral.", draft: "Hi Vikram! I see you made the Google to fintech move. Would love your perspective on Google's interview process!", linkedin_search: "https://www.linkedin.com/search/results/people/?keywords=Senior+Engineer+ex-Google+India", email_pattern: "vikram.patel@razorpay.com" },
];

const TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  hiring_manager: { label: "Hiring Manager", color: "#ef4444", icon: "👔" },
  recruiter:      { label: "Recruiter",       color: "#06b6d4", icon: "🎯" },
  team_member:    { label: "Team Member",     color: "#10b981", icon: "👥" },
  alumnus:        { label: "Alumnus",         color: "#f59e0b", icon: "🎓" },
  influencer:     { label: "Influencer",      color: "#ec4899", icon: "⭐" },
  search_suggestion: { label: "Search More",  color: "#888888", icon: "🔍" },
};

function ConnectionCard({ conn, copiedId, onCopy }: { conn: Connection; copiedId: string | null; onCopy: (id: string, text: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = TYPE_LABELS[conn.type] || { label: conn.type, color: "#888888", icon: "👤" };
  const linkedinUrl = conn.linkedin_url || conn.linkedin_search || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent((conn.role || "") + " " + conn.company)}`;

  if (conn.is_search_card) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: "rgba(15,9,28,0.7)", border: "1px dashed rgba(15,110,85,0.2)", borderRadius: "16px", padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", background: "rgba(100,116,139,0.1)", flexShrink: 0 }}>🔍</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#888888" }}>{conn.name}</div>
            <div style={{ fontSize: "11px", color: "#888888" }}>{conn.role}</div>
          </div>
        </div>
        <button onClick={() => window.open(linkedinUrl, "_blank")} style={{ width: "100%", padding: "10px", background: "rgba(15,110,85,0.1)", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", color: "#0F6E55", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <LinkedInIcon style={{ width: "14px", height: "14px" }} />Search on LinkedIn
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: "#FFFFFF", border: `1px solid ${conn.is_real ? "rgba(16,185,129,0.2)" : "rgba(15,110,85,0.15)"}`, borderRadius: "16px", overflow: "hidden" }}>

      {/* Header — always visible */}
      <div style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 800, color: "white", flexShrink: 0, background: `${conn.color}25`, border: `1px solid ${conn.color}40` }}>
          {conn.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#111111", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" as const }}>
                {conn.name}
                {conn.is_real && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(16,185,129,0.15)", color: "#10b981", fontWeight: 600 }}>✓ Real</span>}
              </div>
              <div style={{ fontSize: "12px", color: "#888888", marginTop: "2px" }}>{conn.role}</div>
            </div>
            <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, width: "34px", height: "34px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,102,194,0.15)", border: "1px solid rgba(10,102,194,0.25)", color: "#60a5fa", textDecoration: "none" }}>
              <LinkedInIcon style={{ width: "16px", height: "16px" }} />
            </a>
          </div>
          <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", fontWeight: 600, background: `${typeInfo.color}15`, color: typeInfo.color, border: `1px solid ${typeInfo.color}25` }}>
            {typeInfo.icon} {typeInfo.label}
          </span>
        </div>
      </div>

      {/* Why connect — always visible */}
      <div style={{ margin: "0 16px", padding: "10px 12px", borderRadius: "10px", fontSize: "12px", color: "#333333", lineHeight: "1.6", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.08)", marginBottom: "12px" }}>
        <span style={{ color: "#0F6E55", fontWeight: 600 }}>Why connect: </span>{conn.why}
      </div>

      {/* AI draft — expandable */}
      <div style={{ margin: "0 16px 12px" }}>
        <button onClick={() => setExpanded(!expanded)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(15,110,85,0.06)", border: "1px solid rgba(15,110,85,0.2)", borderRadius: "10px", cursor: "pointer", fontSize: "12px", color: "#0F6E55", fontWeight: 600 }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles style={{ width: "11px", height: "11px" }} />AI-Drafted Message
          </span>
          {expanded ? <ChevronUp style={{ width: "14px", height: "14px" }} /> : <ChevronDown style={{ width: "14px", height: "14px" }} />}
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
              <div style={{ padding: "12px", background: "rgba(15,110,85,0.04)", border: "1px solid rgba(15,110,85,0.12)", borderTop: "none", borderRadius: "0 0 10px 10px" }}>
                <p style={{ fontSize: "13px", color: "#333333", lineHeight: "1.65", marginBottom: "10px" }}>{conn.draft}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "10px", color: "#888888" }}>{conn.draft?.length || 0} / 280 chars</span>
                  <button onClick={() => onCopy(conn.id, conn.draft)} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, background: "none", border: "none", cursor: "pointer", color: copiedId === conn.id ? "#10b981" : "#5FAE93", padding: "4px 8px", borderRadius: "6px" }}>
                    {copiedId === conn.id ? <><Check style={{ width: "12px", height: "12px" }} />Copied!</> : <><Copy style={{ width: "12px", height: "12px" }} />Copy</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Email */}
      {conn.email_pattern && !conn.is_search_card && (
        <div style={{ margin: "0 16px 12px", padding: "8px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.08)", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px" }}>📧</span>
          <span style={{ color: conn.email_verified ? "#10b981" : "#64748b" }}>{conn.email_verified ? "✓ Verified:" : "Likely:"}</span>
          <span style={{ color: "#888888", fontFamily: "monospace", fontSize: "11px" }}>{conn.email_pattern}</span>
        </div>
      )}

      {/* CTA button */}
      <div style={{ padding: "0 16px 16px" }}>
        <button onClick={() => window.open(linkedinUrl, "_blank")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "13px", padding: "12px", borderRadius: "12px", fontWeight: 700, color: "white", border: "none", cursor: "pointer", background: conn.is_real ? "linear-gradient(135deg,#0a66c2,#1a76c2)" : "linear-gradient(135deg,#374151,#4b5563)", boxShadow: conn.is_real ? "0 4px 16px rgba(10,102,194,0.3)" : "none" }}>
          <LinkedInIcon style={{ width: "15px", height: "15px" }} />
          {conn.is_real ? "View LinkedIn Profile →" : "Search on LinkedIn →"}
        </button>
      </div>
    </motion.div>
  );
}

export default function NetworkPage() {
  const { user } = useUser();
  const limits = getLimits(user?.plan ?? "free");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("India");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insightData, setInsightData] = useState<{ hiring_status: string; culture: string } | null>(null);

  const findConnections = async () => {
    if (!company.trim() || !role.trim()) return;
    setIsSearching(true);
    setConnections([]);
    setHasSearched(true);
    setInsightData(null);
    try {
      const { data } = await api.post("/network/find", {
        company: company.trim(),
        target_role: role.trim(),
        location: location.trim(),
        user_profile: {},
      });
      if (data.connections?.length) {
        const normalized = data.connections.map((c: Record<string, unknown>) => ({
          ...c,
          draft: (c.draft as string) || (c.message_draft as string) || "",
          linkedin_search: (c.linkedin_url as string) || (c.linkedin_search as string) || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(((c.role as string) || "") + " " + ((c.company as string) || company))}`,
        }));
        setConnections(normalized);
      }
      if (data.company_insights) setInsightData(data.company_insights);
    } catch {
      setConnections(MOCK_CONNECTIONS);
    } finally {
      setIsSearching(false);
    }
  };

  const copyDraft = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const S = {
    page: { height: "100%", overflowY: "auto" as const, background: "#FAF7F1" },
    inner: { maxWidth: "860px", margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column" as const, gap: "20px" },
    card: { background: "#FFFFFF", border: "1px solid rgba(15,110,85,0.2)", borderRadius: "16px", padding: "20px" },
    inputBox: { display: "flex", alignItems: "center", gap: "8px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "12px", padding: "12px 14px" },
    inputEl: { flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "14px", color: "#111111", fontFamily: "inherit" },
  };

  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" as const }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111111", marginBottom: "4px" }}>Network Intelligence</h2>
            <p style={{ fontSize: "13px", color: "#888888" }}>Find the right people at target companies — real profiles, verified emails, AI outreach</p>
          </div>
          <span style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "20px", border: "1px solid rgba(236,72,153,0.3)", background: "rgba(236,72,153,0.08)", color: "#f472b6", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <Users style={{ width: "13px", height: "13px" }} />Network Finder
          </span>
        </div>

        {/* Search card */}
        <div style={S.card}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Row 1: Company + Role */}
            <div className="nw-search-row" style={{ display: "flex", gap: "12px" }}>
              <div style={S.inputBox}>
                <Building2 style={{ width: "16px", height: "16px", color: "#888888", flexShrink: 0 }} />
                <input value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === "Enter" && findConnections()} style={S.inputEl} placeholder="Company (e.g. Glanbia, Flipkart)..." />
              </div>
              <div style={S.inputBox}>
                <Search style={{ width: "16px", height: "16px", color: "#888888", flexShrink: 0 }} />
                <input value={role} onChange={(e) => setRole(e.target.value)} onKeyDown={(e) => e.key === "Enter" && findConnections()} style={S.inputEl} placeholder="Target role (e.g. HR Manager, Ecommerce Lead)..." />
              </div>
            </div>

            {/* Row 2: Location + Button */}
            <div style={{ display: "flex", gap: "12px", alignItems: "stretch" }}>
              <div style={{ ...S.inputBox, flex: 1 }}>
                <MapPin style={{ width: "16px", height: "16px", color: "#888888", flexShrink: 0 }} />
                <input value={location} onChange={(e) => setLocation(e.target.value)} onKeyDown={(e) => e.key === "Enter" && findConnections()} style={S.inputEl} placeholder="Country / City (e.g. India, Bangalore)..." />
              </div>
              <button onClick={findConnections} disabled={isSearching || !company.trim() || !role.trim()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 24px", background: isSearching || !company.trim() || !role.trim() ? "rgba(15,110,85,0.4)" : "linear-gradient(135deg,#0F6E55,#0A523F)", border: "none", borderRadius: "12px", color: "white", fontSize: "14px", fontWeight: 700, cursor: isSearching || !company.trim() || !role.trim() ? "not-allowed" : "pointer", flexShrink: 0, boxShadow: "0 4px 16px rgba(15,110,85,0.3)", minWidth: "140px" }}>
                {isSearching ? <motion.div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} /> : <UserCheck style={{ width: "16px", height: "16px" }} />}
                {isSearching ? "Finding..." : "Find People"}
              </button>
            </div>

            <p style={{ fontSize: "11px", color: "#888888" }}>
              💡 Be specific — "HR Manager" finds recruiters, HRBPs, talent acquisition. "Ecommerce" finds category managers, buyers, digital leads.
            </p>
          </div>
        </div>

        {/* Insights row */}
        {insightData && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }} className="nw-insights-grid">
            {[
              { label: "Hiring Status", value: insightData.hiring_status, color: "#10b981", Icon: TrendingUp },
              { label: "Culture", value: insightData.culture?.slice(0, 40) + (insightData.culture?.length > 40 ? "…" : ""), color: "#f59e0b", Icon: Star },
            ].map((s) => (
              <div key={s.label} style={{ ...S.card, padding: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `${s.color}15` }}>
                  <s.Icon style={{ width: "18px", height: "18px", color: s.color }} />
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "11px", color: "#888888" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading state */}
        {isSearching && (
          <div style={{ ...S.card, textAlign: "center", padding: "40px 20px" }}>
            <motion.div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "3px solid rgba(236,72,153,0.2)", borderTopColor: "#ec4899", margin: "0 auto 16px" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#111111", marginBottom: "6px" }}>Finding real people at {company}</p>
            <p style={{ fontSize: "12px", color: "#888888" }}>Searching LinkedIn profiles, verifying emails, drafting outreach for {role}…</p>
          </div>
        )}

        {/* Empty state */}
        {!isSearching && !hasSearched && (
          <div style={{ ...S.card, textAlign: "center", padding: "48px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤝</div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111111", marginBottom: "8px" }}>Your next colleague exists.</h3>
            <p style={{ fontSize: "13px", color: "#888888", maxWidth: "320px", margin: "0 auto", lineHeight: 1.6 }}>
              Enter a company name, target role, and location above to find real people with verified LinkedIn profiles and email addresses.
            </p>
          </div>
        )}

        {/* Results */}
        {!isSearching && connections.length > 0 && (() => {
          const maxVisible = limits.networkContacts === -1 ? connections.length : limits.networkContacts;
          const visible = connections.slice(0, maxVisible);
          const hidden = connections.length - visible.length;
          return (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111111" }}>
                  {connections.filter(c => !c.is_search_card).length} connections at{" "}
                  <span style={{ color: "#0F6E55" }}>{company}</span>
                  <span style={{ color: "#888888", fontWeight: 400 }}> · {role}</span>
                  {limits.networkContacts !== -1 && (
                    <span style={{ color: "#888888", fontWeight: 400, fontSize: "12px" }}> (showing {Math.min(visible.length, maxVisible)} of {connections.length})</span>
                  )}
                </h3>
                <button onClick={() => { setConnections([]); setHasSearched(false); }} style={{ fontSize: "12px", color: "#888888", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>
                  Clear
                </button>
              </div>
              <div className="nw-connections-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                {visible.map((conn, i) => (
                  <motion.div key={conn.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}>
                    <ConnectionCard conn={conn} copiedId={copiedId} onCopy={copyDraft} />
                  </motion.div>
                ))}
              </div>
              {hidden > 0 && (
                <div style={{ marginTop: "16px", padding: "16px 20px", borderRadius: "14px", background: "rgba(15,110,85,0.06)", border: "1px solid rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" as const }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "3px" }}>+{hidden} more connections hidden</div>
                    <div style={{ fontSize: "12px", color: "#888888" }}>Upgrade to Pro to see all {connections.length} contacts with verified emails.</div>
                  </div>
                  <a href="/pricing" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "linear-gradient(135deg,#0F6E55,#0A523F)", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
                    👑 Upgrade to Pro
                  </a>
                </div>
              )}
            </div>
          );
        })()}

        {/* No results */}
        {!isSearching && hasSearched && connections.length === 0 && (
          <div style={{ ...S.card, textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#111111", marginBottom: "6px" }}>No results found</p>
            <p style={{ fontSize: "12px", color: "#888888" }}>Try a different company name or role. Make sure the company name is exact.</p>
          </div>
        )}
      </div>
    </div>
  );
}




"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, TrendingUp, Crown, BarChart3, RefreshCw, AlertCircle,
  Zap, Activity, Target, FileText, ArrowUpRight, Shield,
  Search, ChevronLeft, ChevronRight, X, Globe, Star,
  Briefcase, Eye, LogIn, SlidersHorizontal,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/auth";

const ADMIN_EMAILS = ["srinathreddy.ksr@gmail.com", "sri@mithraai.in"];
const PLAN_COLORS: Record<string, string> = {
  free: "#10b981", pro: "#7c3aed", elite: "#f59e0b",
};
const FEAT_COLORS = ["#7c3aed","#06b6d4","#10b981","#f59e0b","#f97316","#8b5cf6","#3b82f6","#ec4899"];

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface OverviewData {
  summary: {
    total_users: number; paid_users: number; free_users: number;
    conversion_rate: string; signups_today: number; signups_this_week: number;
    signups_this_month: number; active_users_30d: number; total_events_30d: number;
    upgrade_clicks_30d: number; upgrade_conversion: string;
    google_users: number; email_users: number;
  };
  plans: { free: number; pro: number; elite: number };
  feature_usage_30d: Record<string, number>;
  ats_improvement: { avg_before: number; avg_after: number; avg_lift: number };
  daily_signups: { date: string; count: number }[];
  top_pages_30d: { page: string; views: number }[];
  recent_signups: { id: string; name: string; email: string; plan: string; joined: string; method: string }[];
}

interface UserListItem {
  id: string; name: string; email: string; plan: string; method: string;
  joined: string; last_active: string; resumes_built: number;
  resumes_adapted: number; job_searches: number; total_events: number;
}

interface UserListResponse {
  users: UserListItem[]; total: number; page: number; per_page: number;
}

interface UserJourney {
  user: { id: string; name: string; email: string; plan: string; method: string; joined: string; referral_used: string | null };
  resumes: { name: string; template: string; ats_score: number; date: string }[];
  adaptations: { company: string; role: string; ats_before: number; ats_after: number; date: string }[];
  job_searches: { query: string; location: string; date: string }[];
  saved_jobs: { title: string; company: string; status: string; date: string }[];
  page_visits: { page: string; count: number }[];
  feature_usage: { feature: string; count: number }[];
  recent_events: { event: string; page: string | null; feature: string | null; date: string }[];
  summary: { total_resumes: number; total_adaptations: number; total_searches: number; total_saved_jobs: number; total_events: number; pages_visited: number; features_used: number };
}

// ─── Chart Components ──────────────────────────────────────────────────────────

function LineChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 400, H = 80, pL = 2, pR = 2, pT = 8, pB = 4;
  const pts = data.map((d, i) => ({
    x: pL + (i / (data.length - 1)) * (W - pL - pR),
    y: pT + (1 - d.count / max) * (H - pT - pB),
    ...d,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `M ${pts[0].x.toFixed(1)} ${H - pB} ` + pts.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + ` L ${pts[pts.length - 1].x.toFixed(1)} ${H - pB} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "68px", display: "block" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0.33, 0.66].map(r => (
          <line key={r} x1={pL} y1={pT + (1 - r) * (H - pT - pB)} x2={W - pR} y2={pT + (1 - r) * (H - pT - pB)}
            stroke="rgba(0,0,0,0.04)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill="url(#lg1)" />
        <path d={line} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {pts.filter(p => p.count > 0).map((p, i) => (
          <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2.5" fill="#7c3aed" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        <span style={{ fontSize: "10px", color: "#bbb" }}>{data[0]?.date}</span>
        <span style={{ fontSize: "10px", color: "#bbb" }}>{data[Math.floor(data.length / 2)]?.date}</span>
        <span style={{ fontSize: "10px", color: "#bbb" }}>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function DonutChart({ plans, total }: { plans: { free: number; pro: number; elite: number }; total: number }) {
  const r = 32, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  const items = [
    { key: "free", color: "#10b981", count: plans.free },
    { key: "pro", color: "#7c3aed", count: plans.pro },
    { key: "elite", color: "#f59e0b", count: plans.elite },
  ];
  let off = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <svg viewBox="0 0 100 100" style={{ width: "84px", height: "84px", flexShrink: 0 }}>
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="12" />
        ) : items.map(item => {
          const arc = (item.count / total) * circ;
          const el = (
            <circle key={item.key} cx={cx} cy={cy} r={r} fill="none" stroke={item.color}
              strokeWidth="12" strokeDasharray={`${arc} ${circ}`}
              strokeDashoffset={-off + circ / 4} transform={`rotate(-90 ${cx} ${cy})`} />
          );
          off += arc;
          return el;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: "13px", fontWeight: "900", fill: "#111", fontFamily: "inherit" }}>{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: "7px", fill: "#999", fontFamily: "inherit" }}>users</text>
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px" }}>
        {items.map(item => (
          <div key={item.key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "#555", textTransform: "capitalize", flex: 1 }}>{item.key}</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#111" }}>{item.count}</span>
            <span style={{ fontSize: "10px", color: "#aaa", width: "28px", textAlign: "right" }}>
              {total > 0 ? `${Math.round(item.count / total * 100)}%` : "0%"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", ...style }}>
      {children}
    </div>
  );
}

function SectionHead({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px", cursor: onClick ? "pointer" : "default" }}>
      {icon}
      <span style={{ fontSize: "12px", fontWeight: 800, color: "#111", textTransform: "uppercase", letterSpacing: "0.8px" }}>{title}</span>
      {sub && <span style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }}>{sub}</span>}
    </div>
  );
}

function StatCard({ label, value, sub, color, icon: Icon, onClick }: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ElementType; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} style={{
      background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "14px",
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: "4px",
      position: "relative", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
      cursor: onClick ? "pointer" : "default", transition: "transform 0.12s ease, box-shadow 0.12s ease",
    }}
      onMouseEnter={e => { if (onClick) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; } }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 8px rgba(0,0,0,0.05)"; }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: color, borderRadius: "14px 0 0 14px" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: "0.8px", textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon style={{ width: "13px", height: "13px", color }} />
        </div>
      </div>
      <div style={{ fontSize: "28px", fontWeight: 900, color: "#111", lineHeight: 1 }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{sub}</div>}
    </div>
  );
}

function Bar({ value, max, color, label, count, onClick }: {
  value: number; max: number; color: string; label: string; count: number; onClick?: () => void;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: "11px", cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <span style={{ fontSize: "12px", color: "#444", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#111" }}>{count.toLocaleString()}</span>
      </div>
      <div style={{ height: "6px", background: "rgba(0,0,0,0.05)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.7s ease" }} />
      </div>
    </div>
  );
}

// ─── Journey Section ───────────────────────────────────────────────────────────

function JourneySection({ title, icon, color, children }: {
  title: string; icon: React.ReactNode; color: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.07)" }}>
      <div style={{ padding: "11px 16px 9px", borderBottom: "1px solid rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ fontSize: "10px", fontWeight: 800, color: "#333", textTransform: "uppercase", letterSpacing: "0.7px" }}>{title}</span>
      </div>
      <div style={{ padding: "12px 16px" }}>{children}</div>
    </div>
  );
}

// ─── User Journey Panel ────────────────────────────────────────────────────────

function UserJourneyPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [journey, setJourney] = useState<UserJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setErr(""); setJourney(null);
    api.get(`/analytics/user/${userId}`)
      .then(({ data }) => { if (!cancelled) setJourney(data); })
      .catch(e => { if (!cancelled) setErr(e?.response?.data?.detail ?? "Failed to load journey"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const EV_COLOR: Record<string, string> = {
    page_view: "#3b82f6", feature_use: "#7c3aed", auth_event: "#10b981",
    upgrade_click: "#f59e0b", resume_upload: "#06b6d4", resume_download: "#06b6d4",
  };
  const EV_ICON: Record<string, React.ReactNode> = {
    page_view:       <Eye style={{ width: "11px", height: "11px" }} />,
    feature_use:     <Zap style={{ width: "11px", height: "11px" }} />,
    auth_event:      <LogIn style={{ width: "11px", height: "11px" }} />,
    upgrade_click:   <ArrowUpRight style={{ width: "11px", height: "11px" }} />,
    resume_upload:   <FileText style={{ width: "11px", height: "11px" }} />,
    resume_download: <FileText style={{ width: "11px", height: "11px" }} />,
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.28)", zIndex: 40, backdropFilter: "blur(3px)" }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(520px, 93vw)", background: "#F7F7F5",
        zIndex: 50, display: "flex", flexDirection: "column",
        boxShadow: "-12px 0 48px rgba(0,0,0,0.18)",
        animation: "slideIn 0.28s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Panel header */}
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: "12px", background: "#fff" }}>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "9px", background: "rgba(0,0,0,0.05)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X style={{ width: "14px", height: "14px", color: "#555" }} />
          </button>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#111" }}>Customer Journey</div>
            <div style={{ fontSize: "11px", color: "#888" }}>Complete user profile & activity history</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px 32px" }}>
          {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid rgba(124,58,237,0.1)", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
            </div>
          )}
          {err && <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(239,68,68,0.06)", color: "#dc2626", fontSize: "13px" }}>{err}</div>}

          {journey && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Profile */}
              <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.07)", padding: "18px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: PLAN_COLORS[journey.user.plan] ?? "#888" }} />
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: `${PLAN_COLORS[journey.user.plan] ?? "#888"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px", fontWeight: 900, color: PLAN_COLORS[journey.user.plan] ?? "#888", flexShrink: 0 }}>
                    {(journey.user.name || journey.user.email)[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#111" }}>{journey.user.name || "–"}</div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>{journey.user.email}</div>
                    <div style={{ display: "flex", gap: "7px", marginTop: "10px", flexWrap: "wrap" }}>
                      {[
                        { text: journey.user.plan, bg: `${PLAN_COLORS[journey.user.plan] ?? "#888"}15`, color: PLAN_COLORS[journey.user.plan] ?? "#888", border: `1px solid ${PLAN_COLORS[journey.user.plan] ?? "#888"}25` },
                        { text: journey.user.method, bg: journey.user.method === "Google" ? "rgba(59,130,246,0.08)" : "rgba(0,0,0,0.05)", color: journey.user.method === "Google" ? "#3b82f6" : "#666", border: undefined },
                        { text: `Joined ${journey.user.joined}`, bg: "rgba(0,0,0,0.04)", color: "#666", border: undefined },
                      ].map((b, i) => (
                        <span key={i} style={{ fontSize: "10px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: b.bg, color: b.color, border: b.border, textTransform: "capitalize" }}>{b.text}</span>
                      ))}
                      {journey.user.referral_used && (
                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: "rgba(249,115,22,0.08)", color: "#f97316" }}>Ref: {journey.user.referral_used}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {[
                  { label: "Resumes", value: journey.summary.total_resumes, color: "#06b6d4" },
                  { label: "Adapted", value: journey.summary.total_adaptations, color: "#7c3aed" },
                  { label: "Searches", value: journey.summary.total_searches, color: "#f59e0b" },
                  { label: "Events", value: journey.summary.total_events, color: "#10b981" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#fff", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.07)", padding: "11px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "10px", color: "#888", marginTop: "1px" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Pages visited */}
              {journey.page_visits.length > 0 && (
                <JourneySection title={`Pages Visited (${journey.summary.pages_visited})`} icon={<Globe style={{ width: "13px", height: "13px" }} />} color="#3b82f6">
                  {journey.page_visits.slice(0, 10).map((p, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < Math.min(journey.page_visits.length, 10) - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                      <span style={{ fontSize: "12px", color: "#444", fontFamily: "monospace" }}>{p.page}</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#3b82f6", background: "rgba(59,130,246,0.08)", padding: "2px 8px", borderRadius: "5px" }}>{p.count}×</span>
                    </div>
                  ))}
                </JourneySection>
              )}

              {/* Feature usage */}
              {journey.feature_usage.length > 0 && (
                <JourneySection title={`Feature Usage (${journey.summary.features_used} features)`} icon={<Zap style={{ width: "13px", height: "13px" }} />} color="#7c3aed">
                  {journey.feature_usage.map((f, i) => {
                    const maxCount = journey.feature_usage[0]?.count || 1;
                    return (
                      <div key={i} style={{ marginBottom: "9px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                          <span style={{ fontSize: "12px", color: "#444" }}>{f.feature}</span>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed" }}>{f.count}×</span>
                        </div>
                        <div style={{ height: "5px", background: "rgba(0,0,0,0.05)", borderRadius: "3px" }}>
                          <div style={{ height: "100%", width: `${Math.round((f.count / maxCount) * 100)}%`, background: FEAT_COLORS[i % FEAT_COLORS.length], borderRadius: "3px" }} />
                        </div>
                      </div>
                    );
                  })}
                </JourneySection>
              )}

              {/* Resumes built */}
              {journey.resumes.length > 0 && (
                <JourneySection title={`Resumes Built (${journey.summary.total_resumes})`} icon={<FileText style={{ width: "13px", height: "13px" }} />} color="#06b6d4">
                  {journey.resumes.map((r, i) => (
                    <div key={i} style={{ padding: "7px 0", borderBottom: i < journey.resumes.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#333" }}>{r.name}</span>
                        {r.ats_score > 0 && <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.08)", padding: "2px 8px", borderRadius: "5px" }}>ATS {r.ats_score}</span>}
                      </div>
                      <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{r.template} · {r.date}</div>
                    </div>
                  ))}
                </JourneySection>
              )}

              {/* Adaptations */}
              {journey.adaptations.length > 0 && (
                <JourneySection title={`Resume Adaptations (${journey.summary.total_adaptations})`} icon={<Target style={{ width: "13px", height: "13px" }} />} color="#f59e0b">
                  {journey.adaptations.map((a, i) => (
                    <div key={i} style={{ padding: "7px 0", borderBottom: i < journey.adaptations.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#333" }}>{a.role || "Role"} @ {a.company || "Company"}</span>
                        {a.ats_before > 0 && (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981" }}>
                            {a.ats_before} → {a.ats_after} (+{Math.max(a.ats_after - a.ats_before, 0).toFixed(1)})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "11px", color: "#888", marginTop: "1px" }}>{a.date}</div>
                    </div>
                  ))}
                </JourneySection>
              )}

              {/* Job searches */}
              {journey.job_searches.length > 0 && (
                <JourneySection title={`Job Searches (${journey.summary.total_searches})`} icon={<Briefcase style={{ width: "13px", height: "13px" }} />} color="#f97316">
                  {journey.job_searches.slice(0, 10).map((s, i) => (
                    <div key={i} style={{ padding: "5px 0", borderBottom: i < Math.min(journey.job_searches.length, 10) - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                      <span style={{ fontSize: "12px", color: "#333" }}>{s.query}</span>
                      {s.location && <span style={{ fontSize: "11px", color: "#888" }}> · {s.location}</span>}
                      <div style={{ fontSize: "10px", color: "#bbb", marginTop: "1px" }}>{s.date}</div>
                    </div>
                  ))}
                </JourneySection>
              )}

              {/* Saved jobs */}
              {journey.saved_jobs.length > 0 && (
                <JourneySection title={`Saved Jobs (${journey.summary.total_saved_jobs})`} icon={<Star style={{ width: "13px", height: "13px" }} />} color="#10b981">
                  {journey.saved_jobs.slice(0, 8).map((j, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < Math.min(journey.saved_jobs.length, 8) - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#333" }}>{j.title}</div>
                        <div style={{ fontSize: "11px", color: "#888" }}>{j.company} · {j.date}</div>
                      </div>
                      <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "5px", background: "rgba(0,0,0,0.05)", color: "#666" }}>{j.status}</span>
                    </div>
                  ))}
                </JourneySection>
              )}

              {/* Activity timeline */}
              {journey.recent_events.length > 0 && (
                <JourneySection title="Activity Timeline (last 20 events)" icon={<Activity style={{ width: "13px", height: "13px" }} />} color="#888">
                  <div style={{ position: "relative", paddingLeft: "4px" }}>
                    <div style={{ position: "absolute", left: "11px", top: 0, bottom: 0, width: "1px", background: "rgba(0,0,0,0.07)" }} />
                    {journey.recent_events.slice(0, 20).map((ev, i) => {
                      const color = EV_COLOR[ev.event] ?? "#888";
                      const icon = EV_ICON[ev.event] ?? <Activity style={{ width: "11px", height: "11px" }} />;
                      const label = ev.feature || ev.page || ev.event.replace(/_/g, " ");
                      return (
                        <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
                          <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#F7F7F5", border: `1.5px solid ${color}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color, zIndex: 1 }}>
                            {icon}
                          </div>
                          <div style={{ flex: 1, paddingTop: "2px" }}>
                            <span style={{ fontSize: "12px", color: "#333" }}>{label}</span>
                            <div style={{ fontSize: "10px", color: "#bbb", marginTop: "1px" }}>{ev.date}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </JourneySection>
              )}

              {journey.summary.total_events === 0 && journey.resumes.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px", color: "#888", fontSize: "13px" }}>No activity recorded yet for this user.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user } = useUser();
  const isAdmin = ADMIN_EMAILS.includes(user?.email ?? "");

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [ovLoading, setOvLoading] = useState(true);
  const [ovError, setOvError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "pages">("overview");

  const [userList, setUserList] = useState<UserListResponse | null>(null);
  const [usrLoading, setUsrLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [usrPage, setUsrPage] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Load overview
  const loadOverview = useCallback(async () => {
    setOvLoading(true); setOvError("");
    try {
      const { data } = await api.get("/analytics/overview");
      setOverview(data); setLastRefresh(new Date());
    } catch (e: unknown) {
      setOvError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to load analytics");
    } finally {
      setOvLoading(false);
    }
  }, []);

  // Load user list
  const loadUsers = useCallback(async (s: string, plan: string, method: string, page: number) => {
    setUsrLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "25" });
      if (s) params.set("search", s);
      if (plan) params.set("plan", plan);
      if (method) params.set("method", method);
      const { data } = await api.get(`/analytics/users?${params}`);
      setUserList(data);
    } catch {
      setUserList(null);
    } finally {
      setUsrLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadOverview();
    else setOvLoading(false);
  }, [isAdmin, loadOverview]);

  useEffect(() => {
    if (activeTab === "users" && isAdmin) loadUsers(search, planFilter, methodFilter, usrPage);
  }, [activeTab, search, planFilter, methodFilter, usrPage, isAdmin, loadUsers]);

  const handleSearch = (val: string) => {
    setSearch(val); setUsrPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadUsers(val, planFilter, methodFilter, 1), 420);
  };

  // ── Guard ──
  if (!isAdmin) return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F7F5" }}>
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Shield style={{ width: "28px", height: "28px", color: "#ef4444" }} />
        </div>
        <div style={{ fontSize: "18px", fontWeight: 800, color: "#111" }}>Admin Access Only</div>
        <div style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>You don&apos;t have permission to view this page.</div>
      </div>
    </div>
  );

  if (ovLoading) return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F7F5" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid rgba(124,58,237,0.1)", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ fontSize: "13px", color: "#888" }}>Loading analytics...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    </div>
  );

  const featureMax = overview ? Math.max(...Object.values(overview.feature_usage_30d), 1) : 1;
  const pageMax = overview?.top_pages_30d?.length ? Math.max(...overview.top_pages_30d.map(p => p.views), 1) : 1;
  const totalPages = userList ? Math.ceil(userList.total / (userList.per_page || 25)) : 1;

  return (
    <div style={{ minHeight: "100%", background: "#F7F7F5", overflowY: "auto" }}>
      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "24px 20px 48px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg,#7c3aed,#5b21b6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart3 style={{ width: "15px", height: "15px", color: "#fff" }} />
              </div>
              <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#111" }}>Admin Dashboard</h1>
            </div>
            <p style={{ fontSize: "11px", color: "#aaa", marginLeft: "42px" }}>Mithra AI · Refreshed {lastRefresh.toLocaleTimeString()}</p>
          </div>
          <button onClick={loadOverview} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "10px", color: "#444", fontSize: "12px", fontWeight: 600, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <RefreshCw style={{ width: "12px", height: "12px" }} /> Refresh
          </button>
        </div>

        {ovError && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", display: "flex", gap: "10px", alignItems: "center", fontSize: "13px", color: "#dc2626" }}>
            <AlertCircle style={{ width: "15px", height: "15px", flexShrink: 0 }} />{ovError}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "22px", background: "rgba(0,0,0,0.04)", borderRadius: "12px", padding: "4px", width: "fit-content" }}>
          {(["overview", "users", "pages"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "8px 20px", borderRadius: "9px", border: "none", cursor: "pointer",
              fontSize: "12px", fontWeight: 700, textTransform: "capitalize",
              background: activeTab === tab ? "#fff" : "transparent",
              color: activeTab === tab ? "#111" : "#666",
              boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s ease",
            }}>
              {tab === "overview" ? "Overview" : tab === "users" ? `Users${overview ? ` (${overview.summary.total_users})` : ""}` : "Pages"}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {activeTab === "overview" && overview && (
          <>
            {/* KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "12px", marginBottom: "16px" }}>
              <StatCard label="Total Users" value={overview.summary.total_users} sub={`Free: ${overview.summary.free_users} · Paid: ${overview.summary.paid_users}`} color="#7c3aed" icon={Users} onClick={() => setActiveTab("users")} />
              <StatCard label="Paid Subscribers" value={overview.summary.paid_users} sub={`Conv: ${overview.summary.conversion_rate}`} color="#f59e0b" icon={Crown} onClick={() => { setPlanFilter("pro"); setActiveTab("users"); }} />
              <StatCard label="Active (30d)" value={overview.summary.active_users_30d} sub="Users with tracked events" color="#10b981" icon={Activity} onClick={() => setActiveTab("users")} />
              <StatCard label="Signups Today" value={overview.summary.signups_today} sub={`7d: ${overview.summary.signups_this_week} · 30d: ${overview.summary.signups_this_month}`} color="#3b82f6" icon={TrendingUp} />
              <StatCard label="Events (30d)" value={overview.summary.total_events_30d} sub="Page views + feature events" color="#06b6d4" icon={Zap} />
              <StatCard label="Upgrade Clicks" value={overview.summary.upgrade_clicks_30d} sub={`Clicked→Paid: ${overview.summary.upgrade_conversion}`} color="#f97316" icon={ArrowUpRight} />
            </div>

            {/* Signup trend + Plan distribution */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <Card style={{ padding: "20px 22px" }}>
                <SectionHead icon={<TrendingUp style={{ width: "14px", height: "14px", color: "#7c3aed" }} />} title="Signup Trend — Last 30 Days" />
                <LineChart data={overview.daily_signups} />
              </Card>
              <Card style={{ padding: "20px 22px" }}>
                <SectionHead icon={<Users style={{ width: "14px", height: "14px", color: "#888" }} />} title="Plan Distribution" />
                <DonutChart plans={overview.plans} total={overview.summary.total_users} />
                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#666" }}>Auth method split</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span style={{ fontSize: "10px", padding: "2px 9px", borderRadius: "6px", background: "rgba(59,130,246,0.08)", color: "#3b82f6", fontWeight: 700 }}>Google: {overview.summary.google_users}</span>
                    <span style={{ fontSize: "10px", padding: "2px 9px", borderRadius: "6px", background: "rgba(0,0,0,0.05)", color: "#555", fontWeight: 700 }}>Email: {overview.summary.email_users}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Feature utilization */}
            <Card style={{ padding: "20px 22px", marginBottom: "14px" }}>
              <SectionHead icon={<Target style={{ width: "14px", height: "14px", color: "#7c3aed" }} />} title="Feature Utilization — Last 30 Days" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 36px" }}>
                {Object.entries(overview.feature_usage_30d).sort(([, a], [, b]) => b - a).map(([feat, count], i) => (
                  <Bar key={feat} label={feat} value={count} max={featureMax} color={FEAT_COLORS[i % FEAT_COLORS.length]} count={count} />
                ))}
              </div>
            </Card>

            {/* ATS + Top pages */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <Card style={{ padding: "20px 22px" }}>
                <SectionHead icon={<FileText style={{ width: "14px", height: "14px", color: "#06b6d4" }} />} title="Avg ATS Improvement" />
                <div style={{ display: "flex", gap: "16px", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "34px", fontWeight: 900, color: "#888" }}>{overview.ats_improvement.avg_before}</div>
                    <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>Before</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    <span style={{ fontSize: "20px", color: "#10b981" }}>→</span>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#10b981" }}>{overview.ats_improvement.avg_lift > 0 ? `+${overview.ats_improvement.avg_lift}` : overview.ats_improvement.avg_lift}</span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "34px", fontWeight: 900, color: "#10b981" }}>{overview.ats_improvement.avg_after}</div>
                    <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>After</div>
                  </div>
                </div>
                {overview.ats_improvement.avg_before === 0 && (
                  <div style={{ marginTop: "12px", padding: "10px", background: "rgba(0,0,0,0.03)", borderRadius: "8px", fontSize: "11px", color: "#888", textAlign: "center" }}>Data available after users adapt resumes</div>
                )}
              </Card>
              <Card style={{ padding: "20px 22px" }}>
                <SectionHead icon={<Activity style={{ width: "14px", height: "14px", color: "#f97316" }} />} title="Top Pages (30d)" onClick={() => setActiveTab("pages")} />
                {overview.top_pages_30d.length === 0 ? (
                  <div style={{ padding: "16px", background: "rgba(0,0,0,0.03)", borderRadius: "8px", fontSize: "12px", color: "#888", textAlign: "center" }}>Page view data accumulates after deploy</div>
                ) : overview.top_pages_30d.slice(0, 7).map(p => (
                  <Bar key={p.page} label={p.page} value={p.views} max={pageMax} color="#f97316" count={p.views} />
                ))}
              </Card>
            </div>

            {/* Conversion funnel */}
            <Card style={{ padding: "20px 22px", marginBottom: "14px" }}>
              <SectionHead icon={<ArrowUpRight style={{ width: "14px", height: "14px", color: "#f59e0b" }} />} title="Conversion Funnel" />
              <div style={{ display: "flex", gap: "0", alignItems: "stretch" }}>
                {[
                  { label: "All Users",     value: overview.summary.total_users,          color: "#3b82f6" },
                  { label: "Signups 30d",   value: overview.summary.signups_this_month,   color: "#7c3aed" },
                  { label: "Active 30d",    value: overview.summary.active_users_30d,     color: "#06b6d4" },
                  { label: "Upgrade Clicks",value: overview.summary.upgrade_clicks_30d,   color: "#f97316" },
                  { label: "Paid",          value: overview.summary.paid_users,           color: "#f59e0b" },
                ].map((step, i, arr) => {
                  const pct = overview.summary.total_users > 0 ? Math.round(step.value / overview.summary.total_users * 100) : 0;
                  return (
                    <div key={step.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                      <div style={{ width: "100%", height: "54px", background: `${step.color}10`, border: `1.5px solid ${step.color}28`, borderRadius: i === 0 ? "10px 0 0 10px" : i === arr.length - 1 ? "0 10px 10px 0" : "0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "17px", fontWeight: 900, color: step.color }}>{step.value.toLocaleString()}</div>
                          <div style={{ fontSize: "9px", color: "#999", fontWeight: 700 }}>{pct}%</div>
                        </div>
                        {i < arr.length - 1 && <div style={{ position: "absolute", right: "-7px", zIndex: 2, fontSize: "16px", color: "#ccc" }}>›</div>}
                      </div>
                      <div style={{ fontSize: "10px", color: "#666", fontWeight: 600, marginTop: "5px", textAlign: "center" }}>{step.label}</div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Recent signups */}
            <Card style={{ overflow: "hidden" }}>
              <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Users style={{ width: "14px", height: "14px", color: "#7c3aed" }} />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#111", textTransform: "uppercase", letterSpacing: "0.8px" }}>Recent Signups</span>
                <span style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }}>Click any row for full journey</span>
                <button onClick={() => setActiveTab("users")} style={{ fontSize: "11px", color: "#7c3aed", background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: "0 4px" }}>View all →</button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                      {["Name", "Email", "Plan", "Auth", "Joined"].map(h => (
                        <th key={h} style={{ padding: "9px 18px", textAlign: "left", fontSize: "10px", fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recent_signups.map((u, i) => (
                      <tr key={i} onClick={() => setSelectedUserId(u.id)} style={{ borderTop: "1px solid rgba(0,0,0,0.04)", cursor: "pointer", transition: "background 0.1s ease" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.03)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "10px 18px", fontWeight: 600, color: "#111" }}>{u.name || "–"}</td>
                        <td style={{ padding: "10px 18px", color: "#555" }}>{u.email}</td>
                        <td style={{ padding: "10px 18px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: `${PLAN_COLORS[u.plan] ?? "#888"}14`, color: PLAN_COLORS[u.plan] ?? "#888", textTransform: "uppercase", border: `1px solid ${PLAN_COLORS[u.plan] ?? "#888"}22` }}>{u.plan}</span>
                        </td>
                        <td style={{ padding: "10px 18px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: u.method === "Google" ? "rgba(59,130,246,0.08)" : "rgba(0,0,0,0.05)", color: u.method === "Google" ? "#3b82f6" : "#555" }}>{u.method}</span>
                        </td>
                        <td style={{ padding: "10px 18px", color: "#888", fontSize: "11px" }}>{u.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* ── USERS TAB ────────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <>
            {/* Filters */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: "1 1 220px" }}>
                <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "13px", height: "13px", color: "#aaa" }} />
                <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search name or email…"
                  style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "10px", fontSize: "13px", background: "#fff", color: "#111", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <SlidersHorizontal style={{ width: "13px", height: "13px", color: "#aaa" }} />
                {(["", "free", "pro", "elite"] as const).map(p => (
                  <button key={p} onClick={() => { setPlanFilter(p); setUsrPage(1); }} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid", fontSize: "11px", fontWeight: 700, cursor: "pointer", transition: "all 0.1s ease", background: planFilter === p ? (PLAN_COLORS[p] ?? "#111") : "#fff", color: planFilter === p ? "#fff" : (PLAN_COLORS[p] ?? "#666"), borderColor: planFilter === p ? (PLAN_COLORS[p] ?? "#111") : "rgba(0,0,0,0.1)", textTransform: "capitalize" }}>
                    {p || "All"}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["", "Google", "Email"] as const).map(m => (
                  <button key={m} onClick={() => { setMethodFilter(m); setUsrPage(1); }} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid", fontSize: "11px", fontWeight: 700, cursor: "pointer", background: methodFilter === m ? "#111" : "#fff", color: methodFilter === m ? "#fff" : "#666", borderColor: methodFilter === m ? "#111" : "rgba(0,0,0,0.1)" }}>
                    {m || "All Auth"}
                  </button>
                ))}
              </div>
            </div>

            {usrLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid rgba(124,58,237,0.1)", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : userList ? (
              <>
                <div style={{ marginBottom: "10px", fontSize: "12px", color: "#888" }}>
                  {userList.total} user{userList.total !== 1 ? "s" : ""} · click any row for journey
                </div>
                <Card style={{ overflow: "hidden", marginBottom: "14px" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                          {["Name", "Email", "Plan", "Auth", "Joined", "Last Active", "Resumes", "Adapted", "Searches", "Events"].map(h => (
                            <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: "10px", fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: "0.7px", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {userList.users.map((u, i) => (
                          <tr key={u.id} onClick={() => setSelectedUserId(u.id)} style={{ borderTop: "1px solid rgba(0,0,0,0.04)", cursor: "pointer", transition: "background 0.1s ease" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.03)")}
                            onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)")}>
                            <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111", whiteSpace: "nowrap" }}>{u.name || "–"}</td>
                            <td style={{ padding: "10px 14px", color: "#555", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: `${PLAN_COLORS[u.plan] ?? "#888"}14`, color: PLAN_COLORS[u.plan] ?? "#888", textTransform: "uppercase" }}>{u.plan}</span>
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: u.method === "Google" ? "rgba(59,130,246,0.08)" : "rgba(0,0,0,0.05)", color: u.method === "Google" ? "#3b82f6" : "#555" }}>{u.method}</span>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#888", whiteSpace: "nowrap" }}>{u.joined}</td>
                            <td style={{ padding: "10px 14px", color: "#888", whiteSpace: "nowrap" }}>{u.last_active}</td>
                            <td style={{ padding: "10px 14px", textAlign: "center", color: u.resumes_built > 0 ? "#06b6d4" : "#ccc", fontWeight: u.resumes_built > 0 ? 700 : 400 }}>{u.resumes_built}</td>
                            <td style={{ padding: "10px 14px", textAlign: "center", color: u.resumes_adapted > 0 ? "#7c3aed" : "#ccc", fontWeight: u.resumes_adapted > 0 ? 700 : 400 }}>{u.resumes_adapted}</td>
                            <td style={{ padding: "10px 14px", textAlign: "center", color: u.job_searches > 0 ? "#f59e0b" : "#ccc", fontWeight: u.job_searches > 0 ? 700 : 400 }}>{u.job_searches}</td>
                            <td style={{ padding: "10px 14px", textAlign: "center", color: u.total_events > 0 ? "#10b981" : "#ccc", fontWeight: u.total_events > 0 ? 700 : 400 }}>{u.total_events}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "center" }}>
                    <button onClick={() => setUsrPage(p => Math.max(1, p - 1))} disabled={usrPage === 1} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", cursor: usrPage === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: usrPage === 1 ? 0.4 : 1 }}>
                      <ChevronLeft style={{ width: "14px", height: "14px" }} />
                    </button>
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      const p = usrPage <= 4 ? i + 1 : usrPage >= totalPages - 3 ? totalPages - 6 + i : usrPage - 3 + i;
                      if (p < 1 || p > totalPages) return null;
                      return (
                        <button key={p} onClick={() => setUsrPage(p)} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid", fontSize: "12px", fontWeight: 700, cursor: "pointer", background: usrPage === p ? "#7c3aed" : "#fff", color: usrPage === p ? "#fff" : "#555", borderColor: usrPage === p ? "#7c3aed" : "rgba(0,0,0,0.1)" }}>{p}</button>
                      );
                    })}
                    <button onClick={() => setUsrPage(p => Math.min(totalPages, p + 1))} disabled={usrPage === totalPages} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", cursor: usrPage === totalPages ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: usrPage === totalPages ? 0.4 : 1 }}>
                      <ChevronRight style={{ width: "14px", height: "14px" }} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Card style={{ padding: "32px", textAlign: "center" }}>
                <div style={{ fontSize: "13px", color: "#888" }}>No users found. Try adjusting your filters.</div>
              </Card>
            )}
          </>
        )}

        {/* ── PAGES TAB ────────────────────────────────────────────────────── */}
        {activeTab === "pages" && overview && (
          <>
            <Card style={{ overflow: "hidden" }}>
              <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Globe style={{ width: "14px", height: "14px", color: "#f97316" }} />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#111", textTransform: "uppercase", letterSpacing: "0.8px" }}>Page Analytics — Last 30 Days</span>
              </div>
              {overview.top_pages_30d.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#888", fontSize: "13px" }}>
                  Page tracking data accumulates after deploy. Make sure <code style={{ fontSize: "12px", background: "rgba(0,0,0,0.05)", padding: "1px 5px", borderRadius: "4px" }}>trackPage()</code> is called.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                        {["#", "Page", "Views (30d)", "Share", "Trend"].map(h => (
                          <th key={h} style={{ padding: "9px 18px", textAlign: "left", fontSize: "10px", fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: "0.7px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {overview.top_pages_30d.map((p, i) => {
                        const pct = pageMax > 0 ? Math.round(p.views / pageMax * 100) : 0;
                        const total30d = overview.top_pages_30d.reduce((sum, x) => sum + x.views, 0);
                        const share = total30d > 0 ? Math.round(p.views / total30d * 100) : 0;
                        return (
                          <tr key={p.page} style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                            <td style={{ padding: "11px 18px", color: "#aaa", fontSize: "11px" }}>{i + 1}</td>
                            <td style={{ padding: "11px 18px", color: "#333", fontFamily: "monospace", fontSize: "12px" }}>{p.page}</td>
                            <td style={{ padding: "11px 18px", fontWeight: 700, color: "#111" }}>{p.views.toLocaleString()}</td>
                            <td style={{ padding: "11px 18px", color: "#f97316", fontWeight: 700 }}>{share}%</td>
                            <td style={{ padding: "11px 18px", width: "180px" }}>
                              <div style={{ height: "6px", background: "rgba(0,0,0,0.05)", borderRadius: "3px" }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, #f97316, #f59e0b)`, borderRadius: "3px" }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>

      {/* User Journey Overlay */}
      {selectedUserId && (
        <UserJourneyPanel userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}

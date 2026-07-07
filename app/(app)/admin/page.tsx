"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, TrendingUp, Crown, BarChart3, RefreshCw, AlertCircle,
  Zap, Activity, Target, FileText, ArrowUpRight, Shield,
  Search, ChevronLeft, ChevronRight, X, Globe, Star,
  Briefcase, Eye, LogIn, SlidersHorizontal, AlertTriangle,
  Flame, Clock, DollarSign, TrendingDown, CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/auth";

const ADMIN_EMAILS = ["srinathreddy.ksr@gmail.com", "sri@mithraai.in"];
const PLAN_COLORS: Record<string, string> = { free: "#10b981", pro: "#0F6E55", elite: "#f59e0b" };
const FEAT_COLORS = ["#0F6E55","#06b6d4","#10b981","#f59e0b","#f97316","#2E8B6F","#3b82f6","#ec4899"];

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface OverviewData {
  summary: {
    total_users: number; paid_users: number; free_users: number;
    conversion_rate: string; signups_today: number; signups_this_week: number;
    signups_this_month: number; active_users_30d: number; total_events_30d: number;
    upgrade_clicks_30d: number; upgrade_conversion: string; google_users: number; email_users: number;
  };
  plans: { free: number; pro: number; elite: number };
  feature_usage_30d: Record<string, number>;
  ats_improvement: { avg_before: number; avg_after: number; avg_lift: number };
  daily_signups: { date: string; count: number }[];
  top_pages_30d: { page: string; views: number }[];
  recent_signups: { id: string; name: string; email: string; plan: string; joined: string; method: string }[];
}

interface EngagementData {
  activation: {
    total_users: number; activated_count: number; activation_rate: number; never_activated: number;
    feature_adoption: Record<string, { count: number; rate: number }>;
  };
  retention: Record<string, { count: number; rate: number }>;
  at_risk: { count: number; rate: number; examples: { id: string; name: string; email: string; days_since_signup: number; plan: string }[] };
  power_users: { id: string; name: string; email: string; plan: string; total_events: number; resumes: number; adaptations: number }[];
  usage_depth: { total_resumes: number; total_adaptations: number; total_searches: number; total_saved_jobs: number; avg_resumes_per_user: number; avg_adaptations_per_user: number; avg_searches_per_user: number };
  templates: Record<string, number>;
  job_statuses: Record<string, number>;
  top_searches: { query: string; count: number }[];
  recent_activity: { user_id: string; user_name: string; user_email: string; event: string; page: string | null; feature: string | null; date: string }[];
}

interface RevenueData {
  snapshot: {
    mrr: number; arr: number; paid_users: number; total_users: number; arpu_paid: number;
    plan_breakdown: { pro: { users: number; monthly: number; share_pct: number }; elite: { users: number; monthly: number; share_pct: number } };
  };
  cost_estimates: { resume_builds: { count: number; unit_cost_inr: number; total: number }; adaptations: { count: number; unit_cost_inr: number; total: number }; job_searches: { count: number; unit_cost_inr: number; total: number }; total_estimated: number; net_margin: number; margin_rate: number };
  cohorts: Record<string, { new_pro: number; new_elite: number; new_paid: number; new_revenue: number }>;
  monthly_trend: { month: string; revenue: number; new_pro: number; new_elite: number }[];
}

interface UserListItem {
  id: string; name: string; email: string; plan: string; method: string;
  joined: string; last_active: string; resumes_built: number; resumes_adapted: number; job_searches: number; total_events: number;
}
interface UserListResponse { users: UserListItem[]; total: number; page: number; per_page: number }

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

// ─── Tiny reusable components ──────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", ...style }}>
      {children}
    </div>
  );
}

function SectionHead({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub?: string | React.ReactNode; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", cursor: onClick ? "pointer" : "default" }}>
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
      padding: "16px 18px", display: "flex", flexDirection: "column", gap: "4px",
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
      <div style={{ fontSize: "26px", fontWeight: 900, color: "#111", lineHeight: 1 }}>
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
    <div style={{ marginBottom: "10px", cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", color: "#444", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#111" }}>{count.toLocaleString()}</span>
      </div>
      <div style={{ height: "6px", background: "rgba(0,0,0,0.05)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.7s ease" }} />
      </div>
    </div>
  );
}

function LineChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 400, H = 80, pL = 2, pR = 2, pT = 8, pB = 4;
  const pts = data.map((d, i) => ({
    x: pL + (i / (data.length - 1)) * (W - pL - pR),
    y: pT + (1 - d.count / max) * (H - pT - pB), ...d,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `M ${pts[0].x.toFixed(1)} ${H - pB} ` + pts.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + ` L ${pts[pts.length - 1].x.toFixed(1)} ${H - pB} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "68px", display: "block" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F6E55" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0F6E55" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0.33, 0.66].map(r => (
          <line key={r} x1={pL} y1={pT + (1 - r) * (H - pT - pB)} x2={W - pR} y2={pT + (1 - r) * (H - pT - pB)} stroke="rgba(0,0,0,0.04)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill="url(#lg1)" />
        <path d={line} fill="none" stroke="#0F6E55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {pts.filter(p => p.count > 0).map((p, i) => (
          <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2.5" fill="#0F6E55" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
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
    { key: "pro", color: "#0F6E55", count: plans.pro },
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
          const el = <circle key={item.key} cx={cx} cy={cy} r={r} fill="none" stroke={item.color} strokeWidth="12" strokeDasharray={`${arc} ${circ}`} strokeDashoffset={-off + circ / 4} transform={`rotate(-90 ${cx} ${cy})`} />;
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
            <span style={{ fontSize: "10px", color: "#aaa", width: "28px", textAlign: "right" }}>{total > 0 ? `${Math.round(item.count / total * 100)}%` : "0%"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Journey Panel ─────────────────────────────────────────────────────────────

function JourneySection({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
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

  const EV_COLOR: Record<string, string> = { page_view: "#3b82f6", feature_use: "#0F6E55", auth_event: "#10b981", upgrade_click: "#f59e0b", resume_upload: "#06b6d4", resume_download: "#06b6d4" };
  const EV_ICON: Record<string, React.ReactNode> = { page_view: <Eye style={{ width: "11px", height: "11px" }} />, feature_use: <Zap style={{ width: "11px", height: "11px" }} />, auth_event: <LogIn style={{ width: "11px", height: "11px" }} />, upgrade_click: <ArrowUpRight style={{ width: "11px", height: "11px" }} />, resume_upload: <FileText style={{ width: "11px", height: "11px" }} />, resume_download: <FileText style={{ width: "11px", height: "11px" }} /> };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.28)", zIndex: 40, backdropFilter: "blur(3px)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 93vw)", background: "#FAF7F1", zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "-12px 0 48px rgba(0,0,0,0.18)", animation: "slideIn 0.28s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: "12px", background: "#fff" }}>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "9px", background: "rgba(0,0,0,0.05)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X style={{ width: "14px", height: "14px", color: "#555" }} />
          </button>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#111" }}>Customer Journey</div>
            <div style={{ fontSize: "11px", color: "#888" }}>Complete user profile & activity history</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px 32px" }}>
          {loading && <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}><div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid rgba(15,110,85,0.1)", borderTopColor: "#0F6E55", animation: "spin 0.8s linear infinite" }} /></div>}
          {err && <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(239,68,68,0.06)", color: "#dc2626", fontSize: "13px" }}>{err}</div>}
          {journey && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: `${PLAN_COLORS[journey.user.plan] ?? "#888"}15`, color: PLAN_COLORS[journey.user.plan] ?? "#888", textTransform: "capitalize" }}>{journey.user.plan}</span>
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: journey.user.method === "Google" ? "rgba(59,130,246,0.08)" : "rgba(0,0,0,0.05)", color: journey.user.method === "Google" ? "#3b82f6" : "#666" }}>{journey.user.method}</span>
                      <span style={{ fontSize: "10px", color: "#666", padding: "2px 9px", borderRadius: "20px", background: "rgba(0,0,0,0.04)" }}>Joined {journey.user.joined}</span>
                      {journey.user.referral_used && <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: "rgba(249,115,22,0.08)", color: "#f97316" }}>Ref: {journey.user.referral_used}</span>}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {[{ label: "Resumes", value: journey.summary.total_resumes, color: "#06b6d4" }, { label: "Adapted", value: journey.summary.total_adaptations, color: "#0F6E55" }, { label: "Searches", value: journey.summary.total_searches, color: "#f59e0b" }, { label: "Events", value: journey.summary.total_events, color: "#10b981" }].map(s => (
                  <div key={s.label} style={{ background: "#fff", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.07)", padding: "11px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "10px", color: "#888", marginTop: "1px" }}>{s.label}</div>
                  </div>
                ))}
              </div>
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
              {journey.feature_usage.length > 0 && (
                <JourneySection title={`Feature Usage (${journey.summary.features_used} features)`} icon={<Zap style={{ width: "13px", height: "13px" }} />} color="#0F6E55">
                  {journey.feature_usage.map((f, i) => (
                    <div key={i} style={{ marginBottom: "9px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                        <span style={{ fontSize: "12px", color: "#444" }}>{f.feature}</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#0F6E55" }}>{f.count}×</span>
                      </div>
                      <div style={{ height: "5px", background: "rgba(0,0,0,0.05)", borderRadius: "3px" }}>
                        <div style={{ height: "100%", width: `${Math.round((f.count / (journey.feature_usage[0]?.count || 1)) * 100)}%`, background: FEAT_COLORS[i % FEAT_COLORS.length], borderRadius: "3px" }} />
                      </div>
                    </div>
                  ))}
                </JourneySection>
              )}
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
              {journey.adaptations.length > 0 && (
                <JourneySection title={`Adaptations (${journey.summary.total_adaptations})`} icon={<Target style={{ width: "13px", height: "13px" }} />} color="#f59e0b">
                  {journey.adaptations.map((a, i) => (
                    <div key={i} style={{ padding: "7px 0", borderBottom: i < journey.adaptations.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#333" }}>{a.role || "Role"} @ {a.company || "Company"}</span>
                        {a.ats_before > 0 && <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981" }}>{a.ats_before} → {a.ats_after} (+{Math.max(a.ats_after - a.ats_before, 0).toFixed(1)})</span>}
                      </div>
                      <div style={{ fontSize: "11px", color: "#888", marginTop: "1px" }}>{a.date}</div>
                    </div>
                  ))}
                </JourneySection>
              )}
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
              {journey.saved_jobs.length > 0 && (
                <JourneySection title={`Saved Jobs (${journey.summary.total_saved_jobs})`} icon={<Star style={{ width: "13px", height: "13px" }} />} color="#10b981">
                  {journey.saved_jobs.slice(0, 8).map((j, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < Math.min(journey.saved_jobs.length, 8) - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                      <div><div style={{ fontSize: "12px", fontWeight: 600, color: "#333" }}>{j.title}</div><div style={{ fontSize: "11px", color: "#888" }}>{j.company} · {j.date}</div></div>
                      <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "5px", background: "rgba(0,0,0,0.05)", color: "#666" }}>{j.status}</span>
                    </div>
                  ))}
                </JourneySection>
              )}
              {journey.recent_events.length > 0 && (
                <JourneySection title="Activity Timeline (last 20)" icon={<Activity style={{ width: "13px", height: "13px" }} />} color="#888">
                  <div style={{ position: "relative", paddingLeft: "4px" }}>
                    <div style={{ position: "absolute", left: "11px", top: 0, bottom: 0, width: "1px", background: "rgba(0,0,0,0.07)" }} />
                    {journey.recent_events.slice(0, 20).map((ev, i) => {
                      const color = EV_COLOR[ev.event] ?? "#888";
                      const icon = EV_ICON[ev.event] ?? <Activity style={{ width: "11px", height: "11px" }} />;
                      const label = ev.feature || ev.page || ev.event.replace(/_/g, " ");
                      return (
                        <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
                          <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#FAF7F1", border: `1.5px solid ${color}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color, zIndex: 1 }}>{icon}</div>
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

// ─── Revenue bar chart ─────────────────────────────────────────────────────────
function RevBarChart({ data }: { data: { month: string; revenue: number }[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "90px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
          <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div style={{ width: "100%", height: `${Math.max((d.revenue / max) * 100, d.revenue > 0 ? 5 : 0)}%`, background: i === data.length - 1 ? "linear-gradient(180deg,#10b981,#059669)" : "linear-gradient(180deg,#0F6E55,#084434)", borderRadius: "4px 4px 0 0", transition: "height 0.6s ease" }} />
          </div>
          <span style={{ fontSize: "8px", color: "#aaa", textAlign: "center", lineHeight: 1.2 }}>{d.month.split(" ")[0]}</span>
          <span style={{ fontSize: "9px", fontWeight: 700, color: d.revenue > 0 ? "#0F6E55" : "#ccc" }}>
            {d.revenue > 0 ? `₹${(d.revenue / 1000).toFixed(1)}k` : "–"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user } = useUser();
  const isAdmin = ADMIN_EMAILS.includes(user?.email ?? "");

  // Overview data
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [ovLoading, setOvLoading] = useState(true);
  const [ovError, setOvError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Engagement data
  const [engagement, setEngagement] = useState<EngagementData | null>(null);
  const [engLoading, setEngLoading] = useState(true);

  // Revenue data
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [revLoading, setRevLoading] = useState(false);
  const [revLoaded, setRevLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "pages" | "revenue">("overview");

  // Users tab
  const [userList, setUserList] = useState<UserListResponse | null>(null);
  const [usrLoading, setUsrLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [usrPage, setUsrPage] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setOvLoading(true); setEngLoading(true); setOvError("");
    try {
      const [ovRes, engRes] = await Promise.all([
        api.get("/analytics/overview"),
        api.get("/analytics/engagement"),
      ]);
      setOverview(ovRes.data);
      setEngagement(engRes.data);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setOvError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to load analytics");
    } finally {
      setOvLoading(false); setEngLoading(false);
    }
  }, []);

  const loadRevenue = useCallback(async () => {
    if (revLoaded) return;
    setRevLoading(true);
    try {
      const { data } = await api.get("/analytics/revenue");
      setRevenue(data); setRevLoaded(true);
    } catch { /* silent */ } finally { setRevLoading(false); }
  }, [revLoaded]);

  const loadUsers = useCallback(async (s: string, plan: string, method: string, page: number) => {
    setUsrLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "25" });
      if (s) params.set("search", s);
      if (plan) params.set("plan", plan);
      if (method) params.set("method", method);
      const { data } = await api.get(`/analytics/users?${params}`);
      setUserList(data);
    } catch { setUserList(null); } finally { setUsrLoading(false); }
  }, []);

  useEffect(() => { if (isAdmin) loadAll(); else { setOvLoading(false); setEngLoading(false); } }, [isAdmin, loadAll]);
  useEffect(() => { if (activeTab === "users" && isAdmin) loadUsers(search, planFilter, methodFilter, usrPage); }, [activeTab, search, planFilter, methodFilter, usrPage, isAdmin, loadUsers]);
  useEffect(() => { if (activeTab === "revenue" && isAdmin) loadRevenue(); }, [activeTab, isAdmin, loadRevenue]);

  const handleSearch = (val: string) => {
    setSearch(val); setUsrPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadUsers(val, planFilter, methodFilter, 1), 420);
  };

  if (!isAdmin) return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF7F1" }}>
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Shield style={{ width: "28px", height: "28px", color: "#ef4444" }} />
        </div>
        <div style={{ fontSize: "18px", fontWeight: 800, color: "#111" }}>Admin Access Only</div>
        <div style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>You don&apos;t have permission to view this page.</div>
      </div>
    </div>
  );

  if (ovLoading || engLoading) return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF7F1" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid rgba(15,110,85,0.1)", borderTopColor: "#0F6E55", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ fontSize: "13px", color: "#888" }}>Loading analytics...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    </div>
  );

  const featureMax = overview ? Math.max(...Object.values(overview.feature_usage_30d), 1) : 1;
  const pageMax = overview?.top_pages_30d?.length ? Math.max(...overview.top_pages_30d.map(p => p.views), 1) : 1;
  const totalUsrPages = userList ? Math.ceil(userList.total / (userList.per_page || 25)) : 1;

  // Retention color helper
  const retColor = (rate: number) => rate >= 50 ? "#10b981" : rate >= 25 ? "#f59e0b" : "#ef4444";
  const retLabel = (rate: number) => rate >= 50 ? "Healthy" : rate >= 25 ? "Moderate" : "At Risk";

  return (
    <div style={{ minHeight: "100%", background: "#FAF7F1", overflowY: "auto" }}>
      <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "24px 20px 56px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg,#0F6E55,#084434)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart3 style={{ width: "15px", height: "15px", color: "#fff" }} />
              </div>
              <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#111" }}>Admin Dashboard</h1>
            </div>
            <p style={{ fontSize: "11px", color: "#aaa", marginLeft: "42px" }}>Mithra AI · Refreshed {lastRefresh.toLocaleTimeString()}</p>
          </div>
          <button onClick={loadAll} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "10px", color: "#444", fontSize: "12px", fontWeight: 600, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <RefreshCw style={{ width: "12px", height: "12px" }} /> Refresh All
          </button>
        </div>

        {ovError && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", display: "flex", gap: "10px", alignItems: "center", fontSize: "13px", color: "#dc2626" }}>
            <AlertCircle style={{ width: "15px", height: "15px", flexShrink: 0 }} />{ovError}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "22px", background: "rgba(0,0,0,0.04)", borderRadius: "12px", padding: "4px", width: "fit-content" }}>
          {([["overview","Overview"],["users",`Users${overview ? ` (${overview.summary.total_users})` : ""}`],["pages","Pages"],["revenue","Revenue & Cost"]] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "8px 18px", borderRadius: "9px", border: "none", cursor: "pointer",
              fontSize: "12px", fontWeight: 700,
              background: activeTab === tab ? "#fff" : "transparent",
              color: activeTab === tab ? "#111" : "#666",
              boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s ease",
            }}>{label}</button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            OVERVIEW TAB
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && overview && engagement && (
          <>
            {/* ── KPI Row ──────────────────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: "12px", marginBottom: "16px" }}>
              <StatCard label="Total Users" value={overview.summary.total_users} sub={`Free: ${overview.summary.free_users} · Paid: ${overview.summary.paid_users}`} color="#0F6E55" icon={Users} onClick={() => setActiveTab("users")} />
              <StatCard label="Activated Users" value={engagement.activation.activated_count} sub={`${engagement.activation.activation_rate}% activation rate`} color="#10b981" icon={CheckCircle2} />
              <StatCard label="Active 30d" value={overview.summary.active_users_30d} sub="Users with tracked events" color="#06b6d4" icon={Activity} />
              <StatCard label="Paid Subscribers" value={overview.summary.paid_users} sub={`Conv: ${overview.summary.conversion_rate}`} color="#f59e0b" icon={Crown} onClick={() => { setPlanFilter("pro"); setActiveTab("users"); }} />
              <StatCard label="Signups Today" value={overview.summary.signups_today} sub={`7d: ${overview.summary.signups_this_week} · 30d: ${overview.summary.signups_this_month}`} color="#3b82f6" icon={TrendingUp} />
              <StatCard label="Upgrade Clicks" value={overview.summary.upgrade_clicks_30d} sub={`→ Paid: ${overview.summary.upgrade_conversion}`} color="#f97316" icon={ArrowUpRight} />
            </div>

            {/* ── Signup trend + Plan distribution ─────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <Card style={{ padding: "20px 22px" }}>
                <SectionHead icon={<TrendingUp style={{ width: "14px", height: "14px", color: "#0F6E55" }} />} title="Signup Trend — Last 30 Days" sub={`+${overview.summary.signups_this_week} this week`} />
                <LineChart data={overview.daily_signups} />
              </Card>
              <Card style={{ padding: "20px 22px" }}>
                <SectionHead icon={<Users style={{ width: "14px", height: "14px", color: "#888" }} />} title="Plan Distribution" />
                <DonutChart plans={overview.plans} total={overview.summary.total_users} />
                <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#666" }}>Auth method</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span style={{ fontSize: "10px", padding: "2px 9px", borderRadius: "6px", background: "rgba(59,130,246,0.08)", color: "#3b82f6", fontWeight: 700 }}>Google: {overview.summary.google_users}</span>
                    <span style={{ fontSize: "10px", padding: "2px 9px", borderRadius: "6px", background: "rgba(0,0,0,0.05)", color: "#555", fontWeight: 700 }}>Email: {overview.summary.email_users}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Activation & Feature Adoption ────────────────────────────── */}
            <Card style={{ padding: "20px 22px", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 style={{ width: "14px", height: "14px", color: "#10b981" }} />
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#111", textTransform: "uppercase", letterSpacing: "0.8px" }}>Activation & Feature Adoption</span>
                </div>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: 900, color: "#10b981" }}>{engagement.activation.activation_rate}%</div>
                    <div style={{ fontSize: "10px", color: "#888" }}>activation rate</div>
                  </div>
                  {engagement.activation.never_activated > 0 && (
                    <div style={{ textAlign: "center", padding: "8px 14px", borderRadius: "10px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                      <div style={{ fontSize: "20px", fontWeight: 900, color: "#ef4444" }}>{engagement.activation.never_activated}</div>
                      <div style={{ fontSize: "10px", color: "#ef4444" }}>never activated</div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {Object.entries(engagement.activation.feature_adoption).map(([feature, { count, rate }], i) => (
                  <div key={feature} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", color: "#444", width: "140px", flexShrink: 0 }}>{feature}</span>
                    <div style={{ flex: 1, height: "10px", background: "rgba(0,0,0,0.05)", borderRadius: "5px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(rate, 100)}%`, background: FEAT_COLORS[i % FEAT_COLORS.length], borderRadius: "5px", transition: "width 0.8s ease" }} />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#111", width: "40px", textAlign: "right" }}>{rate}%</span>
                    <span style={{ fontSize: "11px", color: "#aaa", width: "50px", textAlign: "right" }}>{count} users</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* ── Retention Health ──────────────────────────────────────────── */}
            <Card style={{ padding: "20px 22px", marginBottom: "14px" }}>
              <SectionHead icon={<Clock style={{ width: "14px", height: "14px", color: "#3b82f6" }} />} title="Retention Health" sub="Active users across time windows" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "16px" }}>
                {(["7d","14d","30d","60d","90d"] as const).map(window => {
                  const d = engagement.retention[window];
                  const col = retColor(d?.rate ?? 0);
                  return (
                    <div key={window} style={{ background: `${col}08`, border: `1px solid ${col}22`, borderRadius: "12px", padding: "14px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: "22px", fontWeight: 900, color: col }}>{d?.count ?? 0}</div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: col, marginTop: "2px" }}>{d?.rate ?? 0}%</div>
                      <div style={{ fontSize: "10px", color: "#888", marginTop: "3px" }}>Active {window}</div>
                      <div style={{ fontSize: "9px", color: col, marginTop: "2px", fontWeight: 600 }}>{retLabel(d?.rate ?? 0)}</div>
                    </div>
                  );
                })}
              </div>
              {/* At-risk warning */}
              {engagement.at_risk.count > 0 && (
                <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <AlertTriangle style={{ width: "16px", height: "16px", color: "#ef4444", flexShrink: 0, marginTop: "1px" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#ef4444", marginBottom: "4px" }}>
                      {engagement.at_risk.count} at-risk users — signed up &gt;7 days ago, never activated ({engagement.at_risk.rate}% of base)
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {engagement.at_risk.examples.slice(0, 5).map(u => (
                        <button key={u.id} onClick={() => setSelectedUserId(u.id)} style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "20px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626", cursor: "pointer", fontWeight: 600 }}>
                          {u.email.split("@")[0]} · {u.days_since_signup}d ago
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* ── Usage Depth + Template + Job Pipeline ────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              {/* Usage depth */}
              <Card style={{ padding: "20px 22px" }}>
                <SectionHead icon={<Activity style={{ width: "14px", height: "14px", color: "#06b6d4" }} />} title="Usage Depth" />
                {[
                  { label: "Total Resumes Built",  value: engagement.usage_depth.total_resumes,     avg: engagement.usage_depth.avg_resumes_per_user,     color: "#06b6d4" },
                  { label: "Total Adaptations",     value: engagement.usage_depth.total_adaptations, avg: engagement.usage_depth.avg_adaptations_per_user, color: "#0F6E55" },
                  { label: "Total Job Searches",    value: engagement.usage_depth.total_searches,    avg: engagement.usage_depth.avg_searches_per_user,    color: "#f59e0b" },
                  { label: "Total Saved Jobs",      value: engagement.usage_depth.total_saved_jobs,  avg: null,                                            color: "#10b981" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#666" }}>{item.label}</div>
                      {item.avg !== null && <div style={{ fontSize: "10px", color: "#aaa" }}>Avg {item.avg}/user</div>}
                    </div>
                    <span style={{ fontSize: "18px", fontWeight: 900, color: item.color }}>{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </Card>

              {/* Template popularity */}
              <Card style={{ padding: "20px 22px" }}>
                <SectionHead icon={<FileText style={{ width: "14px", height: "14px", color: "#2E8B6F" }} />} title="Template Popularity" />
                {Object.keys(engagement.templates).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", fontSize: "12px", color: "#aaa" }}>No data yet</div>
                ) : (() => {
                  const tmplMax = Math.max(...Object.values(engagement.templates), 1);
                  const colors = ["#2E8B6F","#0F6E55","#06b6d4","#10b981","#f59e0b","#f97316"];
                  return Object.entries(engagement.templates).map(([tmpl, cnt], i) => (
                    <Bar key={tmpl} label={tmpl.charAt(0).toUpperCase() + tmpl.slice(1)} value={cnt} max={tmplMax} color={colors[i % colors.length]} count={cnt} />
                  ));
                })()}
              </Card>

              {/* Job pipeline */}
              <Card style={{ padding: "20px 22px" }}>
                <SectionHead icon={<Briefcase style={{ width: "14px", height: "14px", color: "#f97316" }} />} title="Job Pipeline Status" />
                {Object.keys(engagement.job_statuses).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", fontSize: "12px", color: "#aaa" }}>No data yet</div>
                ) : (() => {
                  const jobMax = Math.max(...Object.values(engagement.job_statuses), 1);
                  const statusColors: Record<string, string> = { bookmarked: "#3b82f6", applied: "#0F6E55", interviewing: "#f59e0b", offer: "#10b981", rejected: "#ef4444" };
                  return Object.entries(engagement.job_statuses).map(([status, cnt]) => (
                    <Bar key={status} label={status.charAt(0).toUpperCase() + status.slice(1)} value={cnt} max={jobMax} color={statusColors[status] ?? "#888"} count={cnt} />
                  ));
                })()}
              </Card>
            </div>

            {/* ── Feature Utilization (30d) ─────────────────────────────────── */}
            <Card style={{ padding: "20px 22px", marginBottom: "14px" }}>
              <SectionHead icon={<Target style={{ width: "14px", height: "14px", color: "#0F6E55" }} />} title="Feature Utilization — Last 30 Days (absolute counts)" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 36px" }}>
                {Object.entries(overview.feature_usage_30d).sort(([,a],[,b]) => b - a).map(([feat, count], i) => (
                  <Bar key={feat} label={feat} value={count} max={featureMax} color={FEAT_COLORS[i % FEAT_COLORS.length]} count={count} />
                ))}
              </div>
            </Card>

            {/* ── ATS Improvement + Top Pages ───────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <Card style={{ padding: "20px 22px" }}>
                <SectionHead icon={<FileText style={{ width: "14px", height: "14px", color: "#06b6d4" }} />} title="Avg ATS Score Improvement" />
                <div style={{ display: "flex", gap: "16px", alignItems: "center", justifyContent: "center", padding: "8px 0" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "36px", fontWeight: 900, color: "#888" }}>{overview.ats_improvement.avg_before}</div>
                    <div style={{ fontSize: "11px", color: "#aaa" }}>Before</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    <span style={{ fontSize: "22px", color: "#10b981" }}>→</span>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#10b981" }}>{overview.ats_improvement.avg_lift > 0 ? `+${overview.ats_improvement.avg_lift}` : overview.ats_improvement.avg_lift}</span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "36px", fontWeight: 900, color: "#10b981" }}>{overview.ats_improvement.avg_after}</div>
                    <div style={{ fontSize: "11px", color: "#aaa" }}>After</div>
                  </div>
                </div>
                {overview.ats_improvement.avg_before === 0 && <div style={{ marginTop: "8px", padding: "10px", background: "rgba(0,0,0,0.03)", borderRadius: "8px", fontSize: "11px", color: "#888", textAlign: "center" }}>Data available after users adapt resumes</div>}
              </Card>
              <Card style={{ padding: "20px 22px" }}>
                <SectionHead icon={<Globe style={{ width: "14px", height: "14px", color: "#f97316" }} />} title="Top Pages (30d)" onClick={() => setActiveTab("pages")} />
                {overview.top_pages_30d.length === 0 ? (
                  <div style={{ padding: "16px", background: "rgba(0,0,0,0.03)", borderRadius: "8px", fontSize: "12px", color: "#888", textAlign: "center" }}>Page view data accumulates after deploy</div>
                ) : overview.top_pages_30d.slice(0, 7).map(p => (
                  <Bar key={p.page} label={p.page} value={p.views} max={pageMax} color="#f97316" count={p.views} />
                ))}
              </Card>
            </div>

            {/* ── Top Job Searches ──────────────────────────────────────────── */}
            {engagement.top_searches.length > 0 && (
              <Card style={{ padding: "20px 22px", marginBottom: "14px" }}>
                <SectionHead icon={<Search style={{ width: "14px", height: "14px", color: "#f59e0b" }} />} title="Top Job Search Queries" sub="All-time frequency" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
                  {engagement.top_searches.map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: "8px", background: i < 3 ? "rgba(245,158,11,0.05)" : "transparent" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: i < 3 ? "#f59e0b" : "#aaa", fontWeight: 700, width: "16px" }}>#{i + 1}</span>
                        <span style={{ fontSize: "12px", color: "#444" }}>{s.query}</span>
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#f59e0b" }}>{s.count}×</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ── Power Users ───────────────────────────────────────────────── */}
            {engagement.power_users.length > 0 && (
              <Card style={{ overflow: "hidden", marginBottom: "14px" }}>
                <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Flame style={{ width: "14px", height: "14px", color: "#f97316" }} />
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#111", textTransform: "uppercase", letterSpacing: "0.8px" }}>Power Users — Most Engaged</span>
                  <span style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }}>Click row for journey</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                        {["#","Name","Email","Plan","Events","Resumes","Adaptations"].map(h => (
                          <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: "10px", fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: "0.7px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {engagement.power_users.map((u, i) => (
                        <tr key={u.id} onClick={() => setSelectedUserId(u.id)} style={{ borderTop: "1px solid rgba(0,0,0,0.04)", cursor: "pointer" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(249,115,22,0.04)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "")}>
                          <td style={{ padding: "9px 14px", color: i < 3 ? "#f97316" : "#aaa", fontWeight: 700 }}>{i + 1}</td>
                          <td style={{ padding: "9px 14px", fontWeight: 600, color: "#111" }}>{u.name || "–"}</td>
                          <td style={{ padding: "9px 14px", color: "#555" }}>{u.email}</td>
                          <td style={{ padding: "9px 14px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: `${PLAN_COLORS[u.plan] ?? "#888"}14`, color: PLAN_COLORS[u.plan] ?? "#888", textTransform: "uppercase" }}>{u.plan}</span>
                          </td>
                          <td style={{ padding: "9px 14px", fontWeight: 900, color: "#f97316", fontSize: "13px" }}>{u.total_events}</td>
                          <td style={{ padding: "9px 14px", color: "#06b6d4", fontWeight: 700 }}>{u.resumes}</td>
                          <td style={{ padding: "9px 14px", color: "#0F6E55", fontWeight: 700 }}>{u.adaptations}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ── Conversion Funnel ─────────────────────────────────────────── */}
            <Card style={{ padding: "20px 22px", marginBottom: "14px" }}>
              <SectionHead icon={<ArrowUpRight style={{ width: "14px", height: "14px", color: "#f59e0b" }} />} title="Conversion Funnel" />
              <div style={{ display: "flex", gap: "0", alignItems: "stretch" }}>
                {[
                  { label: "All Users",     value: overview.summary.total_users,                         color: "#3b82f6" },
                  { label: "Activated",     value: engagement.activation.activated_count,                color: "#10b981" },
                  { label: "Active 30d",    value: overview.summary.active_users_30d,                   color: "#06b6d4" },
                  { label: "Upgrade Click", value: overview.summary.upgrade_clicks_30d,                 color: "#f97316" },
                  { label: "Paid",          value: overview.summary.paid_users,                         color: "#f59e0b" },
                ].map((step, i, arr) => {
                  const pct = overview.summary.total_users > 0 ? Math.round(step.value / overview.summary.total_users * 100) : 0;
                  const dropOff = i > 0 ? Math.round((1 - step.value / (arr[i - 1].value || 1)) * 100) : 0;
                  return (
                    <div key={step.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                      <div style={{ width: "100%", height: "56px", background: `${step.color}10`, border: `1.5px solid ${step.color}28`, borderRadius: i === 0 ? "10px 0 0 10px" : i === arr.length - 1 ? "0 10px 10px 0" : "0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "18px", fontWeight: 900, color: step.color }}>{step.value.toLocaleString()}</div>
                          <div style={{ fontSize: "9px", color: "#999", fontWeight: 700 }}>{pct}% of total</div>
                        </div>
                        {i < arr.length - 1 && <div style={{ position: "absolute", right: "-7px", zIndex: 2, fontSize: "16px", color: "#ccc" }}>›</div>}
                      </div>
                      <div style={{ fontSize: "10px", color: "#666", fontWeight: 600, marginTop: "5px", textAlign: "center" }}>{step.label}</div>
                      {i > 0 && dropOff > 0 && <div style={{ fontSize: "9px", color: "#ef4444", marginTop: "2px" }}>-{dropOff}% drop</div>}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* ── Live Activity Feed ────────────────────────────────────────── */}
            {engagement.recent_activity.length > 0 && (
              <Card style={{ overflow: "hidden", marginBottom: "14px" }}>
                <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Activity style={{ width: "14px", height: "14px", color: "#10b981" }} />
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#111", textTransform: "uppercase", letterSpacing: "0.8px" }}>Live Activity Feed</span>
                  <span style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }}>Last 25 events · click user for journey</span>
                </div>
                <div style={{ padding: "8px 0" }}>
                  {engagement.recent_activity.map((ev, i) => {
                    const evColors: Record<string, string> = { page_view: "#3b82f6", feature_use: "#0F6E55", auth_event: "#10b981", upgrade_click: "#f59e0b" };
                    const col = evColors[ev.event] ?? "#888";
                    const label = ev.feature || ev.page || ev.event.replace(/_/g, " ");
                    return (
                      <div key={i} onClick={() => setSelectedUserId(ev.user_id)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "7px 22px", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.02)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "")}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: col, flexShrink: 0 }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#333", width: "130px", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.user_name || ev.user_email.split("@")[0]}</span>
                        <span style={{ fontSize: "11px", color: col, fontWeight: 600, width: "90px", flexShrink: 0, textTransform: "capitalize" }}>{ev.event.replace(/_/g, " ")}</span>
                        <span style={{ fontSize: "11px", color: "#666", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
                        <span style={{ fontSize: "10px", color: "#bbb", flexShrink: 0 }}>{ev.date}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* ── Recent Signups ────────────────────────────────────────────── */}
            <Card style={{ overflow: "hidden" }}>
              <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Users style={{ width: "14px", height: "14px", color: "#0F6E55" }} />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#111", textTransform: "uppercase", letterSpacing: "0.8px" }}>Recent Signups</span>
                <span style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }}>Click row for full journey</span>
                <button onClick={() => setActiveTab("users")} style={{ fontSize: "11px", color: "#0F6E55", background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: "0 4px" }}>View all →</button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                      {["Name","Email","Plan","Auth","Joined"].map(h => (
                        <th key={h} style={{ padding: "9px 18px", textAlign: "left", fontSize: "10px", fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recent_signups.map((u, i) => (
                      <tr key={i} onClick={() => setSelectedUserId(u.id)} style={{ borderTop: "1px solid rgba(0,0,0,0.04)", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(15,110,85,0.03)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "10px 18px", fontWeight: 600, color: "#111" }}>{u.name || "–"}</td>
                        <td style={{ padding: "10px 18px", color: "#555" }}>{u.email}</td>
                        <td style={{ padding: "10px 18px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px", background: `${PLAN_COLORS[u.plan] ?? "#888"}14`, color: PLAN_COLORS[u.plan] ?? "#888", textTransform: "uppercase" }}>{u.plan}</span>
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

        {/* ═══════════════════════════════════════════════════════════════════
            USERS TAB (unchanged structure)
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: "1 1 220px" }}>
                <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "13px", height: "13px", color: "#aaa" }} />
                <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search name or email…" style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "10px", fontSize: "13px", background: "#fff", color: "#111", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <SlidersHorizontal style={{ width: "13px", height: "13px", color: "#aaa" }} />
                {(["","free","pro","elite"] as const).map(p => (
                  <button key={p} onClick={() => { setPlanFilter(p); setUsrPage(1); }} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid", fontSize: "11px", fontWeight: 700, cursor: "pointer", background: planFilter === p ? (PLAN_COLORS[p] ?? "#111") : "#fff", color: planFilter === p ? "#fff" : (PLAN_COLORS[p] ?? "#666"), borderColor: planFilter === p ? (PLAN_COLORS[p] ?? "#111") : "rgba(0,0,0,0.1)", textTransform: "capitalize" }}>
                    {p || "All"}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["","Google","Email"] as const).map(m => (
                  <button key={m} onClick={() => { setMethodFilter(m); setUsrPage(1); }} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid", fontSize: "11px", fontWeight: 700, cursor: "pointer", background: methodFilter === m ? "#111" : "#fff", color: methodFilter === m ? "#fff" : "#666", borderColor: methodFilter === m ? "#111" : "rgba(0,0,0,0.1)" }}>
                    {m || "All Auth"}
                  </button>
                ))}
              </div>
            </div>
            {usrLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}><div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid rgba(15,110,85,0.1)", borderTopColor: "#0F6E55", animation: "spin 0.8s linear infinite" }} /></div>
            ) : userList ? (
              <>
                <div style={{ marginBottom: "10px", fontSize: "12px", color: "#888" }}>{userList.total} user{userList.total !== 1 ? "s" : ""} · click any row for journey</div>
                <Card style={{ overflow: "hidden", marginBottom: "14px" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                          {["Name","Email","Plan","Auth","Joined","Last Active","Resumes","Adapted","Searches","Events"].map(h => (
                            <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: "10px", fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: "0.7px", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {userList.users.map((u, i) => (
                          <tr key={u.id} onClick={() => setSelectedUserId(u.id)} style={{ borderTop: "1px solid rgba(0,0,0,0.04)", cursor: "pointer" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(15,110,85,0.03)")}
                            onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)")}>
                            <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111", whiteSpace: "nowrap" }}>{u.name || "–"}</td>
                            <td style={{ padding: "10px 14px", color: "#555", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</td>
                            <td style={{ padding: "10px 14px" }}><span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: `${PLAN_COLORS[u.plan] ?? "#888"}14`, color: PLAN_COLORS[u.plan] ?? "#888", textTransform: "uppercase" }}>{u.plan}</span></td>
                            <td style={{ padding: "10px 14px" }}><span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: u.method === "Google" ? "rgba(59,130,246,0.08)" : "rgba(0,0,0,0.05)", color: u.method === "Google" ? "#3b82f6" : "#555" }}>{u.method}</span></td>
                            <td style={{ padding: "10px 14px", color: "#888", whiteSpace: "nowrap" }}>{u.joined}</td>
                            <td style={{ padding: "10px 14px", color: "#888", whiteSpace: "nowrap" }}>{u.last_active}</td>
                            <td style={{ padding: "10px 14px", textAlign: "center", color: u.resumes_built > 0 ? "#06b6d4" : "#ccc", fontWeight: u.resumes_built > 0 ? 700 : 400 }}>{u.resumes_built}</td>
                            <td style={{ padding: "10px 14px", textAlign: "center", color: u.resumes_adapted > 0 ? "#0F6E55" : "#ccc", fontWeight: u.resumes_adapted > 0 ? 700 : 400 }}>{u.resumes_adapted}</td>
                            <td style={{ padding: "10px 14px", textAlign: "center", color: u.job_searches > 0 ? "#f59e0b" : "#ccc", fontWeight: u.job_searches > 0 ? 700 : 400 }}>{u.job_searches}</td>
                            <td style={{ padding: "10px 14px", textAlign: "center", color: u.total_events > 0 ? "#10b981" : "#ccc", fontWeight: u.total_events > 0 ? 700 : 400 }}>{u.total_events}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
                {totalUsrPages > 1 && (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "center" }}>
                    <button onClick={() => setUsrPage(p => Math.max(1, p - 1))} disabled={usrPage === 1} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", cursor: usrPage === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: usrPage === 1 ? 0.4 : 1 }}>
                      <ChevronLeft style={{ width: "14px", height: "14px" }} />
                    </button>
                    {Array.from({ length: Math.min(7, totalUsrPages) }, (_, i) => {
                      const p = usrPage <= 4 ? i + 1 : usrPage >= totalUsrPages - 3 ? totalUsrPages - 6 + i : usrPage - 3 + i;
                      if (p < 1 || p > totalUsrPages) return null;
                      return <button key={p} onClick={() => setUsrPage(p)} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid", fontSize: "12px", fontWeight: 700, cursor: "pointer", background: usrPage === p ? "#0F6E55" : "#fff", color: usrPage === p ? "#fff" : "#555", borderColor: usrPage === p ? "#0F6E55" : "rgba(0,0,0,0.1)" }}>{p}</button>;
                    })}
                    <button onClick={() => setUsrPage(p => Math.min(totalUsrPages, p + 1))} disabled={usrPage === totalUsrPages} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", cursor: usrPage === totalUsrPages ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: usrPage === totalUsrPages ? 0.4 : 1 }}>
                      <ChevronRight style={{ width: "14px", height: "14px" }} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Card style={{ padding: "32px", textAlign: "center" }}><div style={{ fontSize: "13px", color: "#888" }}>No users found.</div></Card>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            PAGES TAB (unchanged)
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "pages" && overview && (
          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Globe style={{ width: "14px", height: "14px", color: "#f97316" }} />
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#111", textTransform: "uppercase", letterSpacing: "0.8px" }}>Page Analytics — Last 30 Days</span>
            </div>
            {overview.top_pages_30d.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#888", fontSize: "13px" }}>Page tracking accumulates after deploy.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                      {["#","Page","Views (30d)","Share","Trend"].map(h => (
                        <th key={h} style={{ padding: "9px 18px", textAlign: "left", fontSize: "10px", fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: "0.7px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overview.top_pages_30d.map((p, i) => {
                      const total30d = overview.top_pages_30d.reduce((s, x) => s + x.views, 0);
                      const share = total30d > 0 ? Math.round(p.views / total30d * 100) : 0;
                      return (
                        <tr key={p.page} style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                          <td style={{ padding: "11px 18px", color: "#aaa", fontSize: "11px" }}>{i + 1}</td>
                          <td style={{ padding: "11px 18px", color: "#333", fontFamily: "monospace", fontSize: "12px" }}>{p.page}</td>
                          <td style={{ padding: "11px 18px", fontWeight: 700, color: "#111" }}>{p.views.toLocaleString()}</td>
                          <td style={{ padding: "11px 18px", color: "#f97316", fontWeight: 700 }}>{share}%</td>
                          <td style={{ padding: "11px 18px", width: "180px" }}>
                            <div style={{ height: "6px", background: "rgba(0,0,0,0.05)", borderRadius: "3px" }}>
                              <div style={{ height: "100%", width: `${pageMax > 0 ? Math.round(p.views / pageMax * 100) : 0}%`, background: "linear-gradient(90deg,#f97316,#f59e0b)", borderRadius: "3px" }} />
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
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            REVENUE & COST TAB
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "revenue" && (
          revLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid rgba(16,185,129,0.1)", borderTopColor: "#10b981", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : revenue ? (
            <>
              {/* ── MRR / ARR top row ─────────────────────────────────────── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: "12px", marginBottom: "16px" }}>
                <StatCard label="Monthly Recurring Revenue" value={`₹${revenue.snapshot.mrr.toLocaleString("en-IN")}`} sub={`ARR: ₹${revenue.snapshot.arr.toLocaleString("en-IN")}`} color="#10b981" icon={TrendingUp} />
                <StatCard label="Annualized Revenue (ARR)" value={`₹${revenue.snapshot.arr.toLocaleString("en-IN")}`} sub="MRR × 12 projection" color="#0F6E55" icon={BarChart3} />
                <StatCard label="Paid Subscribers" value={revenue.snapshot.paid_users} sub={`of ${revenue.snapshot.total_users} total users`} color="#f59e0b" icon={Crown} />
                <StatCard label="ARPU (Paid)" value={`₹${revenue.snapshot.arpu_paid.toLocaleString("en-IN")}`} sub="Avg revenue per paying user" color="#06b6d4" icon={DollarSign} />
                <StatCard label="Estimated Total Cost" value={`₹${revenue.cost_estimates.total_estimated.toLocaleString("en-IN")}`} sub="All-time cumulative (estimated)" color="#f97316" icon={TrendingDown} />
                <StatCard label="Net Margin (MRR)" value={`${revenue.cost_estimates.margin_rate}%`} sub={`₹${Math.max(revenue.cost_estimates.net_margin, 0).toLocaleString("en-IN")} net`} color={revenue.cost_estimates.margin_rate > 50 ? "#10b981" : "#ef4444"} icon={Activity} />
              </div>

              {/* ── Revenue trend + Plan breakdown ────────────────────────── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <Card style={{ padding: "20px 22px" }}>
                  <SectionHead icon={<TrendingUp style={{ width: "14px", height: "14px", color: "#10b981" }} />} title="Monthly Revenue Trend — Last 6 Months" />
                  <RevBarChart data={revenue.monthly_trend} />
                  <div style={{ marginTop: "14px", display: "flex", gap: "8px", justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#0F6E55" }} /><span style={{ fontSize: "11px", color: "#666" }}>Previous months</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#10b981" }} /><span style={{ fontSize: "11px", color: "#666" }}>Current month</span></div>
                  </div>
                </Card>
                <Card style={{ padding: "20px 22px" }}>
                  <SectionHead icon={<Crown style={{ width: "14px", height: "14px", color: "#f59e0b" }} />} title="Plan Revenue Breakdown" />
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {(["pro","elite"] as const).map(plan => {
                      const pd = revenue.snapshot.plan_breakdown[plan];
                      const color = PLAN_COLORS[plan];
                      return (
                        <div key={plan} style={{ background: `${color}06`, border: `1px solid ${color}20`, borderRadius: "12px", padding: "14px 16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 800, color, textTransform: "capitalize" }}>{plan} Plan</div>
                              <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{pd.users} users × ₹{plan === "pro" ? "198" : "498"}/mo</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "20px", fontWeight: 900, color }}>₹{pd.monthly.toLocaleString("en-IN")}</div>
                              <div style={{ fontSize: "10px", color: "#888" }}>{pd.share_pct}% of MRR</div>
                            </div>
                          </div>
                          <div style={{ height: "8px", background: "rgba(0,0,0,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pd.share_pct}%`, background: color, borderRadius: "4px" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* ── New revenue by time window ─────────────────────────────── */}
              <Card style={{ padding: "20px 22px", marginBottom: "14px" }}>
                <SectionHead icon={<TrendingUp style={{ width: "14px", height: "14px", color: "#3b82f6" }} />} title="New Paid Users & Revenue by Time Window" sub="Users who signed up with a paid plan in each window" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
                  {(["7d","30d","60d","90d"] as const).map(window => {
                    const c = revenue.cohorts[window];
                    return (
                      <div key={window} style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "#888", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "8px" }}>Last {window}</div>
                        <div style={{ fontSize: "22px", fontWeight: 900, color: "#3b82f6" }}>{c?.new_paid ?? 0}</div>
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>new paid users</div>
                        <div style={{ marginTop: "8px", fontSize: "14px", fontWeight: 800, color: "#10b981" }}>₹{(c?.new_revenue ?? 0).toLocaleString("en-IN")}</div>
                        <div style={{ fontSize: "10px", color: "#888" }}>revenue added</div>
                        {c && c.new_paid > 0 && (
                          <div style={{ marginTop: "6px", display: "flex", gap: "4px", justifyContent: "center" }}>
                            {c.new_pro > 0 && <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "rgba(15,110,85,0.1)", color: "#0F6E55", fontWeight: 700 }}>{c.new_pro} Pro</span>}
                            {c.new_elite > 0 && <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontWeight: 700 }}>{c.new_elite} Elite</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* ── Cost Estimates ────────────────────────────────────────── */}
              <Card style={{ padding: "20px 22px" }}>
                <SectionHead icon={<TrendingDown style={{ width: "14px", height: "14px", color: "#f97316" }} />} title="Cost Estimates (All-time Cumulative)" sub="Estimated LLM + API cost per operation" />
                <div style={{ background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.12)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", fontSize: "12px", color: "#666" }}>
                  ℹ️ Estimates based on average Claude API + infrastructure costs. Resume build ≈ ₹2.50, Adaptation ≈ ₹8.00 (longer context), Job search ≈ ₹0.50 (external API + compute).
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  {[
                    { label: "Resume Builds", data: revenue.cost_estimates.resume_builds, color: "#06b6d4" },
                    { label: "Adaptations", data: revenue.cost_estimates.adaptations, color: "#0F6E55" },
                    { label: "Job Searches", data: revenue.cost_estimates.job_searches, color: "#f59e0b" },
                  ].map(item => (
                    <div key={item.label} style={{ background: `${item.color}06`, border: `1px solid ${item.color}18`, borderRadius: "12px", padding: "14px 16px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#888", marginBottom: "6px" }}>{item.label}</div>
                      <div style={{ fontSize: "20px", fontWeight: 900, color: item.color }}>{item.data.count.toLocaleString()}</div>
                      <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>operations</div>
                      <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "10px", color: "#888" }}>₹{item.data.unit_cost_inr} each</span>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#f97316" }}>₹{item.data.total.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  {[
                    { label: "Total Estimated Cost", value: `₹${revenue.cost_estimates.total_estimated.toLocaleString("en-IN")}`, color: "#f97316", sub: "All-time cumulative" },
                    { label: "Current MRR", value: `₹${revenue.snapshot.mrr.toLocaleString("en-IN")}`, color: "#10b981", sub: "Monthly recurring" },
                    { label: "Estimated Net Margin", value: `${revenue.cost_estimates.margin_rate}%`, color: revenue.cost_estimates.margin_rate > 50 ? "#10b981" : "#ef4444", sub: `₹${Math.max(revenue.cost_estimates.net_margin, 0).toLocaleString("en-IN")} net` },
                  ].map(item => (
                    <div key={item.label} style={{ textAlign: "center", padding: "20px", background: `${item.color}06`, border: `1px solid ${item.color}18`, borderRadius: "12px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#888", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</div>
                      <div style={{ fontSize: "26px", fontWeight: 900, color: item.color }}>{item.value}</div>
                      <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>{item.sub}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card style={{ padding: "40px", textAlign: "center" }}><div style={{ fontSize: "13px", color: "#888" }}>Failed to load revenue data.</div></Card>
          )
        )}
      </div>

      {selectedUserId && <UserJourneyPanel userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}

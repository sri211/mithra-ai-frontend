"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, MapPin, Briefcase, Target, ChevronRight, ChevronDown,
  ExternalLink, Check, Clock, BarChart2, RefreshCw, Trash2,
  AlertCircle, Plus, ArrowLeft, Loader2, TrendingUp,
  Building2, IndianRupee, Star, X,
} from "lucide-react";
import { api, API_BASE } from "@/lib/api/client";
import { useResumeStore } from "@/lib/stores/resumeStore";
import { useUser } from "@/lib/auth";
import { getLimits } from "@/lib/planLimits";
import UpgradeGate from "@/components/ui/UpgradeGate";

// ── Types ──────────────────────────────────────────────────────────────────

interface Job {
  id: string;
  title: string;
  company: string;
  company_logo: string;
  location: string;
  remote: string;
  salary_min: number;
  salary_max: number;
  experience_required: string;
  posted_date: string;
  description: string;
  skills: string[];
  portal: string;
  portal_url: string;
  url: string;
  job_type: string;
  seniority: string;
  match_score: number;
}

interface JobWithState extends Job {
  uiStatus: "idle" | "preparing" | "ready" | "confirming" | "done" | "skipped";
  adaptedCoverLetter?: string;
  linkOpened?: boolean;
}

interface Application {
  id: string;
  job_id: string;
  company: string;
  role: string;
  job_url: string | null;
  platform: string | null;
  match_score: number;
  status: string;
  applied_at: string | null;
  cover_letter: string | null;
}

interface Campaign {
  role: string;
  location: string;
  ctc_min: number;
  ctc_max: number;
  experience_level: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const AMBER = "#f59e0b";
const VIOLET = "#7c3aed";
const GREEN = "#10b981";

const LOCATIONS = [
  "Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Chennai",
  "Pune", "Kolkata", "Ahmedabad", "Remote", "Any",
];

const EXP_LEVELS = [
  { value: "entry", label: "0–2 yrs", sub: "Fresher / Entry" },
  { value: "mid", label: "2–5 yrs", sub: "Mid Level" },
  { value: "senior", label: "5–10 yrs", sub: "Senior" },
  { value: "lead", label: "10+ yrs", sub: "Lead / Director" },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  applied:     { label: "Applied",      color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  viewed:      { label: "Viewed",       color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  shortlisted: { label: "Shortlisted",  color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  interview:   { label: "Interview",    color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  offer:       { label: "Offer 🎉",     color: "#10b981", bg: "rgba(16,185,129,0.18)" },
  rejected:    { label: "Rejected",     color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 80) return GREEN;
  if (s >= 60) return AMBER;
  return "#ef4444";
}

function formatCtc(min: number, max: number) {
  const fmt = (n: number) => n >= 100_000 ? `${(n / 100_000).toFixed(0)}L` : `${(n / 1_000).toFixed(0)}K`;
  return `₹${fmt(min)}–${fmt(max)}`;
}

function daysAgo(dateStr: string) {
  try {
    const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    return `${d}d ago`;
  } catch { return ""; }
}

// ── Match Score Ring ───────────────────────────────────────────────────────

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ flexShrink: 0, transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={4} strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: size * 0.28, fontWeight: 700, fill: color, transform: `rotate(90deg)`, transformOrigin: "50% 50%", fontFamily: "inherit" }}>
        {score}%
      </text>
    </svg>
  );
}

// ── Job Card ───────────────────────────────────────────────────────────────

function JobCard({
  job, accessToken, resume, onApplied, onSkip,
}: {
  job: JobWithState;
  accessToken: string | null;
  resume: unknown;
  onApplied: (job: Job, coverLetter: string) => void;
  onSkip: (id: string) => void;
}) {
  const [state, setState] = useState<JobWithState>(job);
  const [expanded, setExpanded] = useState(false);

  const prepare = async () => {
    setState((p) => ({ ...p, uiStatus: "preparing" }));
    setExpanded(true);
    try {
      const { data } = await api.post("/resume/adapt", {
        resume,
        jd_text: state.description,
        company_name: state.company,
        role_name: state.title,
      });
      setState((p) => ({
        ...p,
        uiStatus: "ready",
        adaptedCoverLetter: data.cover_letter_hook || "",
      }));
    } catch {
      setState((p) => ({ ...p, uiStatus: "ready", adaptedCoverLetter: "" }));
    }
  };

  const openLink = () => {
    window.open(state.url || state.portal_url, "_blank", "noopener");
    setState((p) => ({ ...p, uiStatus: "confirming", linkOpened: true }));
  };

  const markApplied = async () => {
    setState((p) => ({ ...p, uiStatus: "done" }));
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      await fetch(`${API_BASE}/auto-apply/mark-applied`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          job_id: state.id,
          company: state.company,
          role: state.title,
          job_url: state.url || state.portal_url,
          platform: state.portal,
          match_score: state.match_score,
          cover_letter: state.adaptedCoverLetter || "",
          jd_snippet: state.description?.slice(0, 300),
        }),
      });
    } catch { /* best effort */ }
    setTimeout(() => onApplied(state, state.adaptedCoverLetter || ""), 600);
  };

  const isDone = state.uiStatus === "done" || state.uiStatus === "skipped";

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40, height: 0 }}
          style={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.08)", overflow: "hidden" }}
        >
          {/* Main row */}
          <div style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
            {/* Logo */}
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {state.company_logo ? (
                <img src={state.company_logo} alt="" style={{ width: "32px", height: "32px", objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <Building2 style={{ width: "20px", height: "20px", color: VIOLET, opacity: 0.6 }} />
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#111111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{state.title}</p>
                  <p style={{ fontSize: "12px", color: "#555555", margin: "2px 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>{state.company}</span>
                    <span style={{ color: "#cccccc" }}>·</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><MapPin style={{ width: "11px", height: "11px" }} />{state.location}</span>
                  </p>
                </div>
                <ScoreRing score={state.match_score} size={44} />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px", marginTop: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(16,185,129,0.1)", color: GREEN, fontWeight: 600 }}>
                  {formatCtc(state.salary_min, state.salary_max)}
                </span>
                <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(0,0,0,0.05)", color: "#555555" }}>
                  {state.experience_required}
                </span>
                <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(0,0,0,0.05)", color: "#555555" }}>
                  {state.remote}
                </span>
                <span style={{ fontSize: "11px", color: "#aaaaaa", marginLeft: "auto" }}>{daysAgo(state.posted_date)}</span>
              </div>

              {/* Skills */}
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px", marginTop: "8px" }}>
                {(state.skills || []).slice(0, 5).map((sk) => (
                  <span key={sk} style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "20px", background: "rgba(124,58,237,0.07)", color: VIOLET, border: "1px solid rgba(124,58,237,0.15)" }}>{sk}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Action row */}
          <div style={{ padding: "0 16px 14px", display: "flex", gap: "8px", alignItems: "center" }}>
            {state.uiStatus === "idle" && (
              <>
                <button onClick={prepare} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: `linear-gradient(135deg, ${AMBER}, #e67e22)`, color: "#FFFFFF", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <Zap style={{ width: "14px", height: "14px" }} /> Quick Apply
                </button>
                <button onClick={() => setExpanded((p) => !p)} title="View JD" style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", background: "#FFFFFF", cursor: "pointer", color: "#555555", display: "flex", alignItems: "center" }}>
                  <ChevronDown style={{ width: "16px", height: "16px", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                <button onClick={() => onSkip(state.id)} title="Skip" style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", background: "#FFFFFF", cursor: "pointer", color: "#aaaaaa", display: "flex", alignItems: "center" }}>
                  <X style={{ width: "14px", height: "14px" }} />
                </button>
              </>
            )}

            {state.uiStatus === "preparing" && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "10px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <Loader2 style={{ width: "15px", height: "15px", color: AMBER, animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: "13px", color: AMBER, fontWeight: 600 }}>Adapting resume for this role…</span>
              </div>
            )}

            {state.uiStatus === "ready" && (
              <>
                <button onClick={openLink} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: `linear-gradient(135deg, ${GREEN}, #059669)`, color: "#FFFFFF", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <ExternalLink style={{ width: "14px", height: "14px" }} /> Open Application →
                </button>
                <button onClick={() => setState((p) => ({ ...p, uiStatus: "idle" }))} style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", background: "#FFFFFF", cursor: "pointer", color: "#aaaaaa", fontSize: "12px" }}>
                  Back
                </button>
              </>
            )}

            {state.uiStatus === "confirming" && (
              <div style={{ flex: 1, display: "flex", gap: "8px" }}>
                <button onClick={markApplied} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: `linear-gradient(135deg, ${GREEN}, #059669)`, color: "#FFFFFF", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <Check style={{ width: "14px", height: "14px" }} /> Yes, I Applied!
                </button>
                <button onClick={openLink} style={{ padding: "10px 12px", borderRadius: "10px", border: `1px solid ${GREEN}`, background: "#FFFFFF", cursor: "pointer", color: GREEN, fontSize: "12px", fontWeight: 600 }}>
                  Re-open
                </button>
                <button onClick={() => setState((p) => ({ ...p, uiStatus: "idle" }))} style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", background: "#FFFFFF", cursor: "pointer", color: "#aaaaaa", fontSize: "12px" }}>
                  Not yet
                </button>
              </div>
            )}
          </div>

          {/* Expanded: JD + Cover Letter */}
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* JD snippet */}
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#888888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Job Description</p>
                    <p style={{ fontSize: "12px", color: "#444444", lineHeight: "1.6", margin: 0 }}>
                      {state.description?.slice(0, 280)}{state.description?.length > 280 ? "…" : ""}
                    </p>
                  </div>

                  {/* Cover letter hook */}
                  {state.adaptedCoverLetter && (
                    <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}>
                      <p style={{ fontSize: "11px", fontWeight: 700, color: VIOLET, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>✨ AI Cover Letter Hook</p>
                      <p style={{ fontSize: "12px", color: "#444444", lineHeight: "1.6", fontStyle: "italic", margin: 0 }}>
                        "{state.adaptedCoverLetter}"
                      </p>
                      <button onClick={() => navigator.clipboard.writeText(state.adaptedCoverLetter || "")}
                        style={{ marginTop: "8px", fontSize: "11px", color: VIOLET, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>
                        Copy →
                      </button>
                    </div>
                  )}

                  {state.uiStatus === "ready" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: GREEN }}>
                      <Check style={{ width: "13px", height: "13px" }} />
                      <span>Resume adapted for {state.company} — ready to go!</span>
                    </div>
                  )}

                  {state.uiStatus === "confirming" && (
                    <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", fontSize: "12px", color: "#555555" }}>
                      You opened the application. Once you submit their form, click <strong>"Yes, I Applied!"</strong> to track it.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function JobApplicationPage() {
  const { user, accessToken } = useUser();
  const limits = getLimits(user?.plan ?? "free");
  const { resume } = useResumeStore();

  const hasResume = Boolean(resume?.personal?.name || resume?.experience?.length);

  // ── Gate ──
  if (!limits.autoApplyAccess) {
    return (
      <div style={{ height: "100%", overflowY: "auto", background: "#F7F7F5", padding: "24px" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto 24px", display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderRadius: "14px", background: `linear-gradient(135deg, rgba(245,158,11,0.08), rgba(124,58,237,0.08))`, border: "1px solid rgba(245,158,11,0.25)" }}>
          <span style={{ fontSize: "20px" }}>⚡</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#111111", marginBottom: "2px" }}>
              Auto-Apply <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "20px", background: "rgba(245,158,11,0.2)", color: AMBER, marginLeft: "4px" }}>BETA</span>
            </div>
            <p style={{ fontSize: "12px", color: "#888888", margin: 0 }}>AI discovers jobs, adapts your resume per role, and tracks every application.</p>
          </div>
        </div>
        <div style={{ maxWidth: "420px", margin: "0 auto" }}>
          <UpgradeGate requiredPlan="elite" featureName="Auto-Apply"
            description="AI finds matching jobs, tailors your resume per role, and tracks all applications in one dashboard. Available on Elite plan." />
        </div>
      </div>
    );
  }

  // ── State ──
  const [view, setView] = useState<"setup" | "dashboard">("setup");
  const [setupStep, setSetupStep] = useState(1);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<"queue" | "applied">("queue");

  // Setup form
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("Bangalore");
  const [ctcMin, setCtcMin] = useState(10);
  const [ctcMax, setCtcMax] = useState(40);
  const [expLevel, setExpLevel] = useState("mid");

  // Jobs
  const [jobs, setJobs] = useState<JobWithState[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [appliedList, setAppliedList] = useState<Application[]>([]);
  const [isLoadingApplied, setIsLoadingApplied] = useState(false);

  // Load campaign + applications on mount
  useEffect(() => {
    if (!accessToken) return;
    loadCampaign();
    loadApplications();
  }, [accessToken]);

  const loadCampaign = async () => {
    try {
      const { data } = await api.get("/auto-apply/campaign");
      if (data.campaign) {
        const c = data.campaign.criteria as Campaign;
        setCampaign(c);
        setRole(c.role || "");
        setLocation(c.location || "Bangalore");
        setCtcMin(c.ctc_min || 10);
        setCtcMax(c.ctc_max || 40);
        setExpLevel(c.experience_level || "mid");
        setView("dashboard");
        discoverJobs(c.role, c.location);
      }
    } catch { /* no campaign yet */ }
  };

  const loadApplications = async () => {
    if (!accessToken) return;
    setIsLoadingApplied(true);
    try {
      const { data } = await api.get("/auto-apply/applications");
      setAppliedList(data.applications || []);
    } catch { /* ignore */ } finally {
      setIsLoadingApplied(false);
    }
  };

  const discoverJobs = async (r: string, l: string) => {
    setIsLoadingJobs(true);
    setJobsError("");
    try {
      const { data } = await api.post("/jobs/search", {
        query: r,
        location: l === "Any" ? "" : l,
        experience_years: 0,
        salary_min: 0,
        job_type: "fulltime",
        remote: "",
        portals: [],
      });
      const rawJobs: Job[] = data.jobs || [];
      setJobs(rawJobs.map((j) => ({ ...j, uiStatus: "idle" })));
    } catch {
      setJobsError("Could not load jobs. Please try again.");
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const saveCampaign = async () => {
    const c: Campaign = { role, location, ctc_min: ctcMin, ctc_max: ctcMax, experience_level: expLevel };
    setCampaign(c);
    setView("dashboard");
    discoverJobs(role, location);
    try {
      await api.post("/auto-apply/campaign", { role, location, ctc_min: ctcMin, ctc_max: ctcMax, experience_level: expLevel });
    } catch { /* best effort */ }
  };

  const resetCampaign = async () => {
    setCampaign(null);
    setView("setup");
    setSetupStep(1);
    setJobs([]);
    try { await api.delete("/auto-apply/campaign"); } catch { /* ignore */ }
  };

  const handleApplied = (job: Job, coverLetter: string) => {
    setAppliedList((prev) => [{
      id: `local-${Date.now()}`,
      job_id: job.id,
      company: job.company,
      role: job.title,
      job_url: job.url || job.portal_url,
      platform: job.portal,
      match_score: job.match_score,
      status: "applied",
      applied_at: new Date().toISOString(),
      cover_letter: coverLetter,
    }, ...prev]);
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
  };

  const handleSkip = (id: string) => setJobs((prev) => prev.filter((j) => j.id !== id));

  const updateAppStatus = async (appId: string, newStatus: string) => {
    setAppliedList((prev) => prev.map((a) => a.id === appId ? { ...a, status: newStatus } : a));
    try { await api.patch(`/auto-apply/applications/${appId}/status`, { status: newStatus }); } catch { /* best effort */ }
  };

  const deleteApp = async (appId: string) => {
    setAppliedList((prev) => prev.filter((a) => a.id !== appId));
    try { await api.delete(`/auto-apply/applications/${appId}`); } catch { /* best effort */ }
  };

  const queueCount = jobs.length;
  const appliedCount = appliedList.length;
  const avgScore = jobs.length ? Math.round(jobs.reduce((s, j) => s + j.match_score, 0) / jobs.length) : 0;

  // ── Setup Wizard ──────────────────────────────────────────────────────────

  if (view === "setup") {
    return (
      <div style={{ height: "100%", overflowY: "auto", background: "#F7F7F5" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 20px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: `linear-gradient(135deg, ${AMBER}, #e67e22)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Zap style={{ width: "28px", height: "28px", color: "#FFFFFF" }} />
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#111111", margin: "0 0 8px" }}>Set up Auto-Apply</h1>
            <p style={{ fontSize: "14px", color: "#888888", margin: 0 }}>Tell Mithra what you're looking for. It'll find matching jobs, adapt your resume, and track every application.</p>
          </div>

          {/* No resume warning */}
          {!hasResume && (
            <div style={{ marginBottom: "20px", padding: "14px 16px", borderRadius: "12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <AlertCircle style={{ width: "16px", height: "16px", color: AMBER, flexShrink: 0, marginTop: "1px" }} />
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#111111", margin: "0 0 2px" }}>No resume detected</p>
                <p style={{ fontSize: "12px", color: "#888888", margin: 0 }}>Build your resume first for AI to adapt it per job. You can still browse jobs.</p>
              </div>
            </div>
          )}

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "28px" }}>
            {[1, 2, 3].map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: setupStep >= s ? AMBER : "rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.3s" }}>
                  {setupStep > s ? <Check style={{ width: "13px", height: "13px", color: "#FFFFFF" }} /> : <span style={{ fontSize: "12px", fontWeight: 700, color: setupStep >= s ? "#FFFFFF" : "#aaaaaa" }}>{s}</span>}
                </div>
                {i < 2 && <div style={{ flex: 1, height: "2px", background: setupStep > s ? AMBER : "rgba(0,0,0,0.08)", transition: "background 0.3s" }} />}
              </div>
            ))}
          </div>

          {/* Step 1: Role + Location */}
          {setupStep === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "24px", border: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "8px" }}>What role are you targeting?</label>
                  <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Product Manager, Senior Software Engineer, Data Analyst"
                    style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "14px", color: "#111111", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                    onFocus={(e) => (e.target.style.borderColor = AMBER)}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "8px" }}>Preferred location</label>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px" }}>
                    {LOCATIONS.map((loc) => (
                      <button key={loc} onClick={() => setLocation(loc)}
                        style={{ padding: "7px 14px", borderRadius: "20px", border: `1.5px solid ${location === loc ? AMBER : "rgba(0,0,0,0.12)"}`, background: location === loc ? `rgba(245,158,11,0.1)` : "#FFFFFF", color: location === loc ? AMBER : "#555555", fontSize: "12px", fontWeight: location === loc ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => role.trim() && setSetupStep(2)} disabled={!role.trim()}
                style={{ width: "100%", marginTop: "16px", padding: "14px", borderRadius: "12px", border: "none", background: role.trim() ? `linear-gradient(135deg, ${AMBER}, #e67e22)` : "rgba(0,0,0,0.08)", color: role.trim() ? "#FFFFFF" : "#aaaaaa", fontSize: "14px", fontWeight: 700, cursor: role.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                Next: Your Preferences <ChevronRight style={{ width: "16px", height: "16px" }} />
              </button>
            </motion.div>
          )}

          {/* Step 2: CTC + Experience */}
          {setupStep === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "24px", border: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "24px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 700, color: "#111111" }}>Expected CTC (LPA)</label>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: AMBER }}>₹{ctcMin}L – ₹{ctcMax}L</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "11px", color: "#888888", display: "block", marginBottom: "4px" }}>Min</label>
                      <input type="range" min={3} max={ctcMax - 5} value={ctcMin} onChange={(e) => setCtcMin(Number(e.target.value))} style={{ width: "100%", accentColor: AMBER }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "11px", color: "#888888", display: "block", marginBottom: "4px" }}>Max</label>
                      <input type="range" min={ctcMin + 5} max={200} value={ctcMax} onChange={(e) => setCtcMax(Number(e.target.value))} style={{ width: "100%", accentColor: AMBER }} />
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "12px" }}>Experience level</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {EXP_LEVELS.map((lv) => (
                      <button key={lv.value} onClick={() => setExpLevel(lv.value)}
                        style={{ padding: "12px", borderRadius: "10px", border: `1.5px solid ${expLevel === lv.value ? AMBER : "rgba(0,0,0,0.1)"}`, background: expLevel === lv.value ? "rgba(245,158,11,0.08)" : "#FFFFFF", cursor: "pointer", textAlign: "left" as const, transition: "all 0.15s" }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: expLevel === lv.value ? AMBER : "#111111", margin: "0 0 2px" }}>{lv.label}</p>
                        <p style={{ fontSize: "11px", color: "#888888", margin: 0 }}>{lv.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button onClick={() => setSetupStep(1)} style={{ padding: "14px 20px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.12)", background: "#FFFFFF", color: "#555555", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ArrowLeft style={{ width: "15px", height: "15px" }} /> Back
                </button>
                <button onClick={() => setSetupStep(3)} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg, ${AMBER}, #e67e22)`, color: "#FFFFFF", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  Next: Review & Launch <ChevronRight style={{ width: "16px", height: "16px" }} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review + Launch */}
          {setupStep === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "24px", border: "1px solid rgba(0,0,0,0.08)" }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#888888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>Your Campaign Summary</p>
                {[
                  { icon: <Briefcase style={{ width: "15px", height: "15px", color: AMBER }} />, label: "Role", value: role },
                  { icon: <MapPin style={{ width: "15px", height: "15px", color: AMBER }} />, label: "Location", value: location },
                  { icon: <IndianRupee style={{ width: "15px", height: "15px", color: AMBER }} />, label: "CTC Range", value: `₹${ctcMin}L – ₹${ctcMax}L per annum` },
                  { icon: <TrendingUp style={{ width: "15px", height: "15px", color: AMBER }} />, label: "Experience", value: EXP_LEVELS.find((l) => l.value === expLevel)?.sub || expLevel },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    {row.icon}
                    <span style={{ fontSize: "12px", color: "#888888", width: "80px", flexShrink: 0 }}>{row.label}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#111111" }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: "16px", padding: "12px 14px", borderRadius: "10px", background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <p style={{ fontSize: "12px", color: "#444444", margin: 0, lineHeight: "1.6" }}>
                    Mithra will find matching jobs, show you AI match scores, adapt your resume per role, and track every application you make.
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button onClick={() => setSetupStep(2)} style={{ padding: "14px 20px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.12)", background: "#FFFFFF", color: "#555555", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ArrowLeft style={{ width: "15px", height: "15px" }} /> Back
                </button>
                <button onClick={saveCampaign} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg, ${AMBER}, #e67e22)`, color: "#FFFFFF", fontSize: "15px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <Zap style={{ width: "18px", height: "18px" }} /> Start Discovering Jobs
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#F7F7F5" }}>
      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "20px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap" as const, gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111111", margin: 0 }}>Auto-Apply</h2>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: `rgba(245,158,11,0.15)`, color: AMBER }}>BETA</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              <Zap style={{ width: "12px", height: "12px", color: AMBER }} />
              <span style={{ fontSize: "12px", color: "#888888" }}>{campaign?.role} · {campaign?.location}</span>
              <button onClick={resetCampaign} style={{ fontSize: "11px", color: VIOLET, background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: "4px", fontWeight: 600 }}>
                Edit
              </button>
            </div>
          </div>
          <button onClick={() => discoverJobs(campaign?.role || "", campaign?.location || "")}
            style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.12)", background: "#FFFFFF", color: "#555555", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <RefreshCw style={{ width: "13px", height: "13px" }} /> Refresh Jobs
          </button>
        </div>

        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          {[
            { icon: <Target style={{ width: "16px", height: "16px", color: AMBER }} />, label: "In Queue", value: queueCount, color: AMBER },
            { icon: <Check style={{ width: "16px", height: "16px", color: GREEN }} />, label: "Applied", value: appliedCount, color: GREEN },
            { icon: <BarChart2 style={{ width: "16px", height: "16px", color: VIOLET }} />, label: "Avg Match", value: `${avgScore}%`, color: VIOLET },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#FFFFFF", borderRadius: "12px", padding: "14px 16px", border: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: `${stat.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ fontSize: "18px", fontWeight: 800, color: "#111111", margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: "11px", color: "#888888", margin: 0 }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: "0", marginBottom: "16px", background: "rgba(0,0,0,0.05)", borderRadius: "12px", padding: "4px" }}>
          {(["queue", "applied"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ flex: 1, padding: "9px", borderRadius: "9px", border: "none", background: activeTab === tab ? "#FFFFFF" : "transparent", color: activeTab === tab ? "#111111" : "#888888", fontSize: "13px", fontWeight: activeTab === tab ? 700 : 400, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              {tab === "queue" ? <><Target style={{ width: "14px", height: "14px" }} /> Job Queue {queueCount > 0 && <span style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "20px", background: AMBER, color: "#FFFFFF", fontWeight: 700 }}>{queueCount}</span>}</> : <><Check style={{ width: "14px", height: "14px" }} /> Applied {appliedCount > 0 && <span style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "20px", background: GREEN, color: "#FFFFFF", fontWeight: 700 }}>{appliedCount}</span>}</>}
            </button>
          ))}
        </div>

        {/* Queue Tab */}
        {activeTab === "queue" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {isLoadingJobs && (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <Loader2 style={{ width: "28px", height: "28px", color: AMBER, animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ fontSize: "14px", color: "#888888", margin: 0 }}>Searching matching jobs for <strong>{campaign?.role}</strong> in <strong>{campaign?.location}</strong>…</p>
              </div>
            )}

            {jobsError && (
              <div style={{ padding: "20px", borderRadius: "14px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", textAlign: "center" }}>
                <AlertCircle style={{ width: "20px", height: "20px", color: "#ef4444", margin: "0 auto 8px" }} />
                <p style={{ fontSize: "13px", color: "#ef4444", margin: "0 0 12px" }}>{jobsError}</p>
                <button onClick={() => discoverJobs(campaign?.role || "", campaign?.location || "")}
                  style={{ padding: "8px 18px", borderRadius: "10px", border: "none", background: "#ef4444", color: "#FFFFFF", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>
                  Try Again
                </button>
              </div>
            )}

            {!isLoadingJobs && !jobsError && jobs.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔍</div>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#111111", margin: "0 0 6px" }}>No jobs in queue</p>
                <p style={{ fontSize: "13px", color: "#888888", margin: "0 0 16px" }}>All caught up! Refresh to discover more jobs or update your campaign.</p>
                <button onClick={() => discoverJobs(campaign?.role || "", campaign?.location || "")}
                  style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: AMBER, color: "#FFFFFF", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                  Discover More Jobs
                </button>
              </div>
            )}

            {!isLoadingJobs && jobs.map((job) => (
              <JobCard key={job.id} job={job} accessToken={accessToken ?? null} resume={resume}
                onApplied={handleApplied} onSkip={handleSkip} />
            ))}
          </div>
        )}

        {/* Applied Tab */}
        {activeTab === "applied" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {isLoadingApplied && (
              <div style={{ textAlign: "center", padding: "32px" }}>
                <Loader2 style={{ width: "22px", height: "22px", color: AMBER, animation: "spin 1s linear infinite", margin: "0 auto" }} />
              </div>
            )}

            {!isLoadingApplied && appliedList.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>📋</div>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#111111", margin: "0 0 6px" }}>No applications yet</p>
                <p style={{ fontSize: "13px", color: "#888888", margin: "0 0 16px" }}>Apply to jobs from the queue and they'll appear here with full tracking.</p>
                <button onClick={() => setActiveTab("queue")}
                  style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: AMBER, color: "#FFFFFF", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                  Go to Queue
                </button>
              </div>
            )}

            {appliedList.map((app) => {
              const sm = STATUS_META[app.status] || STATUS_META.applied;
              return (
                <motion.div key={app.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: "#FFFFFF", borderRadius: "14px", padding: "14px 16px", border: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" as const }}>
                  {/* Score */}
                  <ScoreRing score={app.match_score} size={40} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: "120px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#111111", margin: "0 0 2px" }}>{app.role}</p>
                    <p style={{ fontSize: "12px", color: "#888888", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{app.company}</span>
                      {app.platform && <><span style={{ color: "#ccc" }}>·</span><span>{app.platform}</span></>}
                    </p>
                  </div>

                  {/* Applied date */}
                  <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                    <div style={{ padding: "4px 10px", borderRadius: "20px", background: sm.bg, color: sm.color, fontSize: "11px", fontWeight: 700, marginBottom: "4px", display: "inline-block" }}>
                      {sm.label}
                    </div>
                    <p style={{ fontSize: "10px", color: "#aaaaaa", margin: 0 }}>
                      {app.applied_at ? daysAgo(app.applied_at) : ""}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", width: "100%", flexShrink: 0 }}>
                    <select value={app.status} onChange={(e) => updateAppStatus(app.id, e.target.value)}
                      style={{ flex: 1, padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "12px", color: "#555555", background: "#FFFFFF", cursor: "pointer", fontFamily: "inherit" }}>
                      {Object.entries(STATUS_META).map(([val, meta]) => (
                        <option key={val} value={val}>{meta.label}</option>
                      ))}
                    </select>
                    {app.job_url && (
                      <a href={app.job_url} target="_blank" rel="noopener" style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", background: "#FFFFFF", color: "#555555", display: "flex", alignItems: "center", textDecoration: "none" }}>
                        <ExternalLink style={{ width: "13px", height: "13px" }} />
                      </a>
                    )}
                    <button onClick={() => deleteApp(app.id)}
                      style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)", background: "#FFFFFF", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <Trash2 style={{ width: "13px", height: "13px" }} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Spacer */}
        <div style={{ height: "40px" }} />
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

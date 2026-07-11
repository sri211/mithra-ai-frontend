"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, MapPin, Briefcase, Target, ChevronRight, ChevronDown,
  ExternalLink, Check, BarChart2, RefreshCw, Trash2,
  AlertCircle, ArrowLeft, Loader2, TrendingUp, Bot,
  Building2, IndianRupee, X, Camera, KeyRound, Shield, Lock,
} from "lucide-react";
import { api } from "@/lib/api/client";
import CoinCost from "@/components/ui/CoinCost";
import { useAuthStore } from "@/lib/stores/authStore";
import { useJobStore } from "@/lib/stores/jobStore";
import { useResumeStore } from "@/lib/stores/resumeStore";
import { useUser } from "@/lib/auth";
import { getLimits } from "@/lib/planLimits";
import UpgradeGate from "@/components/ui/UpgradeGate";
import { ResumeData } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Job {
  id: string; title: string; company: string; company_logo: string;
  location: string; remote: string; salary_min: number; salary_max: number;
  experience_required: string; posted_date: string; description: string;
  skills: string[]; portal: string; portal_url: string; url: string;
  job_type: string; seniority: string; match_score: number;
}

type CardStatus =
  | "idle" | "preparing" | "ready"
  | "autosubmitting" | "waiting_input" | "needs_credentials" | "autoresult"
  | "confirming" | "done" | "skipped";

interface JobWithState extends Job {
  uiStatus: CardStatus;
  adaptedCoverLetter?: string;
  autoResult?: AutoSubmitResult;
}

interface AutoSubmitResult {
  success: boolean; portal: string; fields_filled: number;
  message: string; screenshot?: string; apply_url: string;
}

interface Application {
  id: string; job_id: string; company: string; role: string;
  job_url: string | null; platform: string | null;
  match_score: number; status: string; applied_at: string | null;
  cover_letter: string | null; _local?: boolean;
}

interface Campaign {
  role: string; location: string; ctc_min: number;
  ctc_max: number; experience_level: string;
}

interface PortalCred { portal: string; username: string; }

// ── Constants ──────────────────────────────────────────────────────────────────

const AMBER  = "#f59e0b";
const VIOLET = "#0F6E55";
const GREEN  = "#10b981";
const LS_APPS_KEY = "mithra-applied-apps";
const LS_CAMP_KEY = "mithra-campaign";
const API_BASE    = "/api/backend";

const PORTALS = [
  { id: "linkedin",   label: "LinkedIn",    url: "linkedin.com"   },
  { id: "naukri",     label: "Naukri",      url: "naukri.com"     },
  { id: "instahyre",  label: "Instahyre",   url: "instahyre.com"  },
  { id: "indeed",     label: "Indeed",      url: "indeed.com"     },
];

const LOCATIONS = [
  "Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Chennai",
  "Pune", "Kolkata", "Ahmedabad", "Remote", "Any",
];

const EXP_LEVELS = [
  { value: "entry", label: "0–2 yrs",  sub: "Fresher / Entry" },
  { value: "mid",   label: "2–5 yrs",  sub: "Mid Level" },
  { value: "senior",label: "5–10 yrs", sub: "Senior" },
  { value: "lead",  label: "10+ yrs",  sub: "Lead / Director" },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  applied:     { label: "Applied",      color: "#6366f1", bg: "rgba(99,102,241,0.12)"  },
  viewed:      { label: "Viewed",       color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  shortlisted: { label: "Shortlisted",  color: "#2E8B6F", bg: "rgba(139,92,246,0.12)"  },
  interview:   { label: "Interview",    color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
  offer:       { label: "Offer 🎉",     color: "#10b981", bg: "rgba(16,185,129,0.18)"  },
  rejected:    { label: "Rejected",     color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
};

// ── LocalStorage helpers ───────────────────────────────────────────────────────

function saveAppsLocally(apps: Application[]) {
  try { localStorage.setItem(LS_APPS_KEY, JSON.stringify(apps)); } catch { }
}
function loadAppsLocally(): Application[] {
  try { const r = localStorage.getItem(LS_APPS_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function mergeApps(backend: Application[], local: Application[]): Application[] {
  const ids = new Set(backend.map((a) => a.job_id));
  return [...backend, ...local.filter((a) => !ids.has(a.job_id)).map((a) => ({ ...a, _local: true }))];
}
function saveCampaignLocally(c: Campaign) {
  try { localStorage.setItem(LS_CAMP_KEY, JSON.stringify(c)); } catch { }
}
function loadCampaignLocally(): Campaign | null {
  try { const r = localStorage.getItem(LS_CAMP_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreColor(s: number) { return s >= 80 ? GREEN : s >= 60 ? AMBER : "#ef4444"; }
function formatCtc(min: number, max: number) {
  const f = (n: number) => n >= 100_000 ? `${(n / 100_000).toFixed(0)}L` : `${(n / 1_000).toFixed(0)}K`;
  return `₹${f(min)}–${f(max)}`;
}
function daysAgo(d: string) {
  try {
    const t = new Date(d).getTime();
    if (!d || Number.isNaN(t)) return "";
    const n = Math.floor((Date.now() - t) / 86_400_000);
    if (n < 0) return "";
    if (n < 30) return n === 0 ? "Today" : n === 1 ? "Yesterday" : `${n}d ago`;
    if (n < 365) return `${Math.floor(n / 30)}mo ago`;
    return `${Math.floor(n / 365)}y ago`;
  } catch { return ""; }
}
function getAuthToken(): string {
  try { return (useAuthStore.getState() as any).accessToken || ""; } catch { return ""; }
}

// ── Score Ring ─────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 46 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ flexShrink: 0, transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={4}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={4} strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"/>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: size * 0.26, fontWeight: 700, fill: color,
          transform: "rotate(90deg)", transformOrigin: "50% 50%", fontFamily: "inherit" }}>
        {score}%
      </text>
    </svg>
  );
}

// ── Portal Credentials Modal ───────────────────────────────────────────────────

function PortalCredentialsModal({
  initialPortal = "linkedin",
  onClose,
  onSaved,
}: {
  initialPortal?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [portal, setPortal]     = useState(initialPortal);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const save = async () => {
    if (!username.trim() || !password.trim()) return;
    setSaving(true); setError("");
    try {
      await api.post("/auto-apply/credentials", { portal, username: username.trim(), password });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to save. Try again.");
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", maxWidth: "420px", width: "100%", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "#888" }}>
          <X style={{ width: "18px", height: "18px" }} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(15,110,85,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Lock style={{ width: "20px", height: "20px", color: VIOLET }} />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111", margin: 0 }}>Save Portal Login</h3>
            <p style={{ fontSize: "12px", color: "#888", margin: "2px 0 0" }}>Used only for Auto Submit — encrypted at rest</p>
          </div>
        </div>

        {/* Portal selector */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
          {PORTALS.map((p) => (
            <button key={p.id} onClick={() => setPortal(p.id)}
              style={{ padding: "6px 14px", borderRadius: "20px", border: `1.5px solid ${portal === p.id ? VIOLET : "rgba(0,0,0,0.12)"}`, background: portal === p.id ? "rgba(15,110,85,0.08)" : "#fff", color: portal === p.id ? VIOLET : "#555", fontSize: "12px", fontWeight: portal === p.id ? 700 : 400, cursor: "pointer" }}>
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "18px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px" }}>
              Email / Username
            </label>
            <input
              type="email" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder={`Your ${PORTALS.find(p => p.id === portal)?.label} email`}
              style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "14px", color: "#111", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              onFocus={(e) => (e.target.style.borderColor = VIOLET)}
              onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px" }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "14px", color: "#111", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              onFocus={(e) => (e.target.style.borderColor = VIOLET)}
              onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
          </div>
        </div>

        {error && <p style={{ fontSize: "12px", color: "#ef4444", margin: "0 0 12px" }}>{error}</p>}

        <button onClick={save} disabled={saving || !username.trim() || !password.trim()}
          style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: username.trim() && password.trim() ? `linear-gradient(135deg,${VIOLET},#084434)` : "rgba(0,0,0,0.07)", color: username.trim() && password.trim() ? "#fff" : "#bbb", fontSize: "14px", fontWeight: 700, cursor: username.trim() && password.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          {saving ? <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} /> : <Shield style={{ width: "14px", height: "14px" }} />}
          {saving ? "Saving…" : "Save Credentials"}
        </button>

        <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "10px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <p style={{ fontSize: "11px", color: "#555", margin: 0, lineHeight: "1.7" }}>
            <strong>Privacy:</strong> Your password is encrypted before storage and never returned to the browser.
            It's used only by the Mithra AI server to log in on your behalf during Auto Submit.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Job Card ───────────────────────────────────────────────────────────────────

interface JobCardProps {
  job: JobWithState;
  resume: ResumeData;
  savedPortals: string[];
  onNeedsCredentials: (portal: string) => void;
  onApplied: (job: Job, opts: { coverLetter: string; autoSubmitted: boolean }) => void;
  onSkip: (id: string) => void;
}

function JobCard({ job, resume, savedPortals, onNeedsCredentials, onApplied, onSkip }: JobCardProps) {
  const [st, setSt]                   = useState<JobWithState>(job);
  const [expanded, setExpanded]       = useState(false);
  const [autoMsg, setAutoMsg]         = useState("");
  const [liveScreenshot, setLiveScreenshot] = useState<string | undefined>();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [waitingField, setWaitingField] = useState("");
  const [waitingMsg, setWaitingMsg]   = useState("");
  const [neededPortal, setNeededPortal] = useState("");
  const [otpValue, setOtpValue]       = useState("");

  const isActive = st.uiStatus === "autosubmitting" || st.uiStatus === "waiting_input";

  const prepare = async () => {
    setSt((p) => ({ ...p, uiStatus: "preparing" }));
    setExpanded(true);
    try {
      const { data } = await api.post("/resume/adapt", {
        resume, jd_text: st.description,
        company_name: st.company, role_name: st.title,
      });
      setSt((p) => ({ ...p, uiStatus: "ready", adaptedCoverLetter: data.cover_letter_hook || "" }));
    } catch {
      setSt((p) => ({ ...p, uiStatus: "ready", adaptedCoverLetter: "" }));
    }
  };

  const openLink = () => {
    window.open(st.url || st.portal_url, "_blank", "noopener");
    setSt((p) => ({ ...p, uiStatus: "confirming" }));
  };

  // SSE-based auto-submit — everything runs on the server
  const autoSubmit = async () => {
    setSt((p) => ({ ...p, uiStatus: "autosubmitting" }));
    setExpanded(true);
    setLiveScreenshot(undefined);
    setAutoMsg("Starting…");

    const profile = {
      name:     resume?.personal?.name     || "",
      email:    resume?.personal?.email    || "",
      phone:    resume?.personal?.phone    || "",
      location: resume?.personal?.location || "",
      linkedin: resume?.personal?.linkedin || "",
    };

    try {
      // Start session
      const { data } = await api.post("/auto-apply/submit/start", {
        job_url: st.url || st.portal_url, job_id: st.id,
        company: st.company, role: st.title,
        match_score: st.match_score, profile,
        resume: resume || {},
      });
      const sid: string = data.session_id;
      setActiveSessionId(sid);

      // Open SSE stream with auth header
      const token = getAuthToken();
      const resp = await fetch(`${API_BASE}/auto-apply/submit/stream/${sid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "keepalive") continue;

            if (event.type === "status") {
              setAutoMsg(event.message);
            } else if (event.type === "screenshot") {
              setLiveScreenshot(event.data);
            } else if (event.type === "input_needed") {
              setWaitingField(event.field || "otp");
              setWaitingMsg(event.message || "");
              if (event.screenshot) setLiveScreenshot(event.screenshot);
              setSt((p) => ({ ...p, uiStatus: "waiting_input" }));
            } else if (event.type === "needs_credentials") {
              setNeededPortal(event.portal || "");
              if (event.screenshot) setLiveScreenshot(event.screenshot);
              setSt((p) => ({ ...p, uiStatus: "needs_credentials" }));
            } else if (event.type === "done") {
              if (event.needs_credentials) {
                // Session ended because portal login is required — show the
                // credentials prompt instead of a generic failure card
                setNeededPortal(event.needs_credentials);
                if (event.screenshot) setLiveScreenshot(event.screenshot);
                setWaitingMsg(event.message || "");
                setSt((p) => ({ ...p, uiStatus: "needs_credentials" }));
              } else {
                if (event.success) window.dispatchEvent(new Event("mithra:tracker-changed"));
                setSt((p) => ({
                  ...p,
                  uiStatus: "autoresult",
                  autoResult: {
                    success:      event.success ?? false,
                    portal:       event.portal  || "",
                    fields_filled: event.fields_filled || 0,
                    message:      event.message || "",
                    screenshot:   event.screenshot,
                    apply_url:    event.apply_url || st.url || st.portal_url,
                  },
                }));
              }
            }
          } catch { /* malformed SSE line */ }
        }
      }
    } catch {
      setSt((p) => ({ ...p, uiStatus: "idle" }));
    }
  };

  const submitOtp = async () => {
    if (!activeSessionId || !otpValue.trim()) return;
    try {
      await api.post(`/auto-apply/submit/input/${activeSessionId}`, { value: otpValue.trim() });
      setSt((p) => ({ ...p, uiStatus: "autosubmitting" }));
      setAutoMsg(waitingField === "otp" ? "OTP submitted — logging in…" : "Detail sent — continuing the form…");
      setOtpValue("");
    } catch { /* ignore, stream will handle timeout */ }
  };

  const confirmApplied = (autoSubmitted = false) => {
    setSt((p) => ({ ...p, uiStatus: "done" }));
    onApplied(st, { coverLetter: st.adaptedCoverLetter || "", autoSubmitted });
  };

  if (st.uiStatus === "done" || st.uiStatus === "skipped") return null;

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      style={{ background: "#fff", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.08)", overflow: "hidden" }}>

      {/* Top row */}
      <div style={{ padding: "14px 16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(15,110,85,0.06)", border: "1px solid rgba(15,110,85,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          {st.company_logo
            ? <img src={st.company_logo} alt="" style={{ width: "30px", height: "30px", objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            : <Building2 style={{ width: "18px", height: "18px", color: VIOLET, opacity: 0.5 }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.title}</p>
              <p style={{ fontSize: "12px", color: "#666", margin: "2px 0 0", display: "flex", alignItems: "center", gap: "5px" }}>
                {st.company}<span style={{ color: "#ccc" }}>·</span>
                <MapPin style={{ width: "11px", height: "11px" }} />{st.location}
              </p>
            </div>
            <ScoreRing score={st.match_score} size={42} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "7px" }}>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(16,185,129,0.1)", color: GREEN, fontWeight: 600 }}>{formatCtc(st.salary_min, st.salary_max)}</span>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(0,0,0,0.05)", color: "#555" }}>{st.experience_required}</span>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(0,0,0,0.05)", color: "#555" }}>{st.remote}</span>
            <span style={{ fontSize: "11px", color: "#aaa", marginLeft: "auto" }}>{daysAgo(st.posted_date)}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "7px" }}>
            {(st.skills || []).slice(0, 5).map((sk) => (
              <span key={sk} style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "20px", background: "rgba(15,110,85,0.07)", color: VIOLET, border: "1px solid rgba(15,110,85,0.15)" }}>{sk}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div style={{ padding: "0 14px 14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>

        {st.uiStatus === "idle" && (
          <>
            <button onClick={prepare} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: `linear-gradient(135deg,${AMBER},#e67e22)`, color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Zap style={{ width: "13px", height: "13px" }} /> Quick Apply
            </button>
            <button onClick={autoSubmit}
              title="Server opens the job page, logs in with your saved credentials, and auto-fills the form"
              style={{ padding: "10px 12px", borderRadius: "10px", border: `1.5px solid ${VIOLET}`, background: "rgba(15,110,85,0.06)", color: VIOLET, fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
              <Bot style={{ width: "13px", height: "13px" }} /> Auto Submit <CoinCost n={8} onDark />
            </button>
            <button onClick={() => setExpanded((p) => !p)} style={{ padding: "10px 11px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", cursor: "pointer", color: "#666" }}>
              <ChevronDown style={{ width: "15px", height: "15px", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            <button onClick={() => onSkip(st.id)} style={{ padding: "10px 11px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", cursor: "pointer", color: "#bbb" }}>
              <X style={{ width: "13px", height: "13px" }} />
            </button>
          </>
        )}

        {st.uiStatus === "preparing" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "10px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <Loader2 style={{ width: "14px", height: "14px", color: AMBER, animation: "spin 1s linear infinite", flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: AMBER, fontWeight: 600 }}>Adapting resume for {st.company}…</span>
          </div>
        )}

        {st.uiStatus === "ready" && (
          <>
            <button onClick={openLink} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: `linear-gradient(135deg,${GREEN},#059669)`, color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <ExternalLink style={{ width: "13px", height: "13px" }} /> Open Application
            </button>
            <button onClick={autoSubmit} style={{ padding: "10px 12px", borderRadius: "10px", border: `1.5px solid ${VIOLET}`, background: "rgba(15,110,85,0.06)", color: VIOLET, fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
              <Bot style={{ width: "13px", height: "13px" }} /> Auto
            </button>
            <button onClick={() => setSt((p) => ({ ...p, uiStatus: "idle" }))} style={{ padding: "10px 11px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", cursor: "pointer", color: "#999", fontSize: "12px" }}>Back</button>
          </>
        )}

        {st.uiStatus === "autosubmitting" && (
          <div style={{ flex: 1, padding: "12px 14px", borderRadius: "10px", background: "rgba(15,110,85,0.06)", border: "1px solid rgba(15,110,85,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Loader2 style={{ width: "14px", height: "14px", color: VIOLET, animation: "spin 1s linear infinite", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: VIOLET, fontWeight: 600 }}>{autoMsg}</span>
            </div>
          </div>
        )}

        {/* OTP / input needed */}
        {st.uiStatus === "waiting_input" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ padding: "12px 14px", borderRadius: "10px", background: waitingField === "confirm_submit" ? "rgba(16,185,129,0.07)" : "rgba(245,158,11,0.07)", border: waitingField === "confirm_submit" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(245,158,11,0.3)" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#111", margin: "0 0 4px" }}>
                {waitingField === "confirm_submit" ? "✅ Ready to submit"
                  : waitingField === "otp" ? "🔐 OTP required"
                  : waitingField === "missing_info" ? "✍️ One more detail needed"
                  : "⚠️ Login issue"}
              </p>
              <p style={{ fontSize: "12px", color: "#666", margin: 0, lineHeight: "1.6" }}>{waitingMsg}</p>
            </div>
            {waitingField === "confirm_submit" && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={async () => {
                    if (!activeSessionId) return;
                    try {
                      await api.post(`/auto-apply/submit/input/${activeSessionId}`, { value: "submit" });
                      setSt((p) => ({ ...p, uiStatus: "autosubmitting" }));
                      setAutoMsg("Submitting application…");
                    } catch { /* stream handles timeout */ }
                  }}
                  style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: `linear-gradient(135deg,${GREEN},#059669)`, color: "#fff", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>
                  ✓ Confirm & Submit
                </button>
                <button
                  onClick={async () => {
                    if (!activeSessionId) return;
                    try {
                      await api.post(`/auto-apply/submit/input/${activeSessionId}`, { value: "cancel" });
                      setSt((p) => ({ ...p, uiStatus: "autosubmitting" }));
                      setAutoMsg("Finishing up…");
                    } catch { /* ignore */ }
                  }}
                  style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.15)", background: "#fff", color: "#555", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  I'll submit manually
                </button>
              </div>
            )}
            {(waitingField === "otp" || waitingField === "missing_info") && (
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text" value={otpValue} onChange={(e) => setOtpValue(e.target.value)}
                  placeholder={waitingField === "otp" ? "Enter OTP…" : "Type the requested detail…"}
                  maxLength={waitingField === "otp" ? 10 : 120}
                  onKeyDown={(e) => e.key === "Enter" && submitOtp()}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", border: "1.5px solid rgba(15,110,85,0.4)", fontSize: waitingField === "otp" ? "16px" : "14px", color: "#111", outline: "none", fontFamily: "inherit", letterSpacing: waitingField === "otp" ? "0.15em" : "normal", textAlign: waitingField === "otp" ? "center" : "left" }}
                />
                <button onClick={submitOtp} disabled={!otpValue.trim()}
                  style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: otpValue.trim() ? `linear-gradient(135deg,${VIOLET},#084434)` : "rgba(0,0,0,0.07)", color: otpValue.trim() ? "#fff" : "#bbb", fontSize: "13px", fontWeight: 700, cursor: otpValue.trim() ? "pointer" : "not-allowed" }}>
                  Send
                </button>
              </div>
            )}
          </div>
        )}

        {/* Needs credentials */}
        {st.uiStatus === "needs_credentials" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(15,110,85,0.05)", border: "1px solid rgba(15,110,85,0.2)" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#111", margin: "0 0 4px" }}>
                🔑 {neededPortal ? `${neededPortal.charAt(0).toUpperCase() + neededPortal.slice(1)} login required` : "Login required"}
              </p>
              <p style={{ fontSize: "12px", color: "#666", margin: 0, lineHeight: "1.6" }}>
                Save your {neededPortal || "portal"} credentials so Mithra can log in automatically. This is a one-time setup.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => { onNeedsCredentials(neededPortal); setSt((p) => ({ ...p, uiStatus: "idle" })); }}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: `linear-gradient(135deg,${VIOLET},#084434)`, color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <KeyRound style={{ width: "13px", height: "13px" }} /> Add Credentials
              </button>
              <a href={st.url || st.portal_url} target="_blank" rel="noopener"
                style={{ padding: "10px 12px", borderRadius: "10px", border: `1px solid ${GREEN}`, background: "#fff", color: GREEN, display: "flex", alignItems: "center", textDecoration: "none" }}>
                <ExternalLink style={{ width: "13px", height: "13px" }} />
              </a>
            </div>
          </div>
        )}

        {/* Auto result */}
        {st.uiStatus === "autoresult" && st.autoResult && (
          <div style={{ flex: 1, display: "flex", gap: "8px" }}>
            <button onClick={() => confirmApplied(st.autoResult!.success)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: `linear-gradient(135deg,${GREEN},#059669)`, color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Check style={{ width: "13px", height: "13px" }} /> {st.autoResult.success ? "Confirm Applied ✓" : "Mark Applied"}
            </button>
            {st.autoResult.apply_url && (
              <a href={st.autoResult.apply_url} target="_blank" rel="noopener" style={{ padding: "10px 12px", borderRadius: "10px", border: `1px solid ${GREEN}`, background: "#fff", color: GREEN, display: "flex", alignItems: "center", textDecoration: "none" }}>
                <ExternalLink style={{ width: "13px", height: "13px" }} />
              </a>
            )}
            <button onClick={() => setSt((p) => ({ ...p, uiStatus: "idle", autoResult: undefined }))} style={{ padding: "10px 11px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", cursor: "pointer", color: "#999", fontSize: "12px" }}>Back</button>
          </div>
        )}

        {/* Manual confirming */}
        {st.uiStatus === "confirming" && (
          <div style={{ flex: 1, display: "flex", gap: "8px" }}>
            <button onClick={() => confirmApplied(false)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: `linear-gradient(135deg,${GREEN},#059669)`, color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Check style={{ width: "13px", height: "13px" }} /> Yes, I Applied!
            </button>
            <button onClick={openLink} style={{ padding: "10px 12px", borderRadius: "10px", border: `1px solid ${GREEN}`, background: "#fff", cursor: "pointer", color: GREEN, fontSize: "12px", fontWeight: 600 }}>Re-open</button>
            <button onClick={() => setSt((p) => ({ ...p, uiStatus: "idle" }))} style={{ padding: "10px 11px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", cursor: "pointer", color: "#999", fontSize: "12px" }}>Back</button>
          </div>
        )}
      </div>

      {/* Expanded panel */}
      <AnimatePresence>
        {(expanded || isActive || st.uiStatus === "autoresult" || st.uiStatus === "needs_credentials" || st.uiStatus === "waiting_input") && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* Live screenshot */}
              {(liveScreenshot || st.autoResult?.screenshot) && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <Camera style={{ width: "13px", height: "13px", color: VIOLET }} />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: VIOLET, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {st.uiStatus === "waiting_input"
                        ? (waitingField === "otp" ? "Browser — OTP required"
                           : waitingField === "missing_info" ? "Browser — info needed"
                           : "Browser — review & confirm")
                        : "Server Browser View"}
                    </span>
                    {(st.autoResult?.fields_filled || 0) > 0 && (
                      <span style={{ marginLeft: "auto", fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(16,185,129,0.1)", color: GREEN, fontWeight: 600 }}>
                        {st.autoResult!.fields_filled} fields filled ✓
                      </span>
                    )}
                  </div>
                  <div style={{ borderRadius: "10px", overflow: "hidden", border: st.uiStatus === "waiting_input" ? "2px solid rgba(245,158,11,0.5)" : "1px solid rgba(0,0,0,0.1)" }}>
                    <img
                      src={`data:image/jpeg;base64,${liveScreenshot || st.autoResult?.screenshot}`}
                      alt="Server browser view"
                      style={{ width: "100%", display: "block", maxHeight: "260px", objectFit: "cover", objectPosition: "top" }}
                    />
                  </div>
                </div>
              )}

              {/* Result message */}
              {st.autoResult?.message && (
                <p style={{ fontSize: "12px", color: "#555", margin: 0, lineHeight: "1.6" }}>{st.autoResult.message}</p>
              )}

              {/* Cover letter */}
              {st.adaptedCoverLetter && (
                <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(15,110,85,0.04)", border: "1px solid rgba(15,110,85,0.14)" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: VIOLET, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>✨ AI Cover Letter Hook</p>
                  <p style={{ fontSize: "12px", color: "#444", lineHeight: "1.6", fontStyle: "italic", margin: 0 }}>"{st.adaptedCoverLetter}"</p>
                  <button onClick={() => navigator.clipboard.writeText(st.adaptedCoverLetter || "")} style={{ marginTop: "8px", fontSize: "11px", color: VIOLET, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>Copy →</button>
                </div>
              )}

              {/* JD snippet */}
              {!st.autoResult && !st.adaptedCoverLetter && !isActive && st.uiStatus !== "needs_credentials" && (
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 5px" }}>Job Description</p>
                  <p style={{ fontSize: "12px", color: "#555", lineHeight: "1.6", margin: 0 }}>
                    {st.description?.slice(0, 260)}{(st.description?.length || 0) > 260 ? "…" : ""}
                  </p>
                </div>
              )}

              {st.uiStatus === "confirming" && (
                <div style={{ padding: "9px 13px", borderRadius: "9px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)", fontSize: "12px", color: "#555" }}>
                  Applied on the portal? Click <strong>"Yes, I Applied!"</strong> above to track it.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function JobApplicationPage() {
  const { user }  = useUser();
  const limits    = getLimits(user?.plan ?? "free");
  const { resume } = useResumeStore();
  const hasResume  = Boolean(resume?.personal?.name || resume?.experience?.length);

  // ── State ────────────────────────────────────────────────────────────────────

  const [view, setView]              = useState<"setup" | "dashboard">("setup");
  const [setupStep, setSetupStep]    = useState(1);
  const [campaign, setCampaign]      = useState<Campaign | null>(null);
  const [activeTab, setActiveTab]    = useState<"queue" | "applied">("queue");
  const [role, setRole]              = useState("");
  const [location, setLocation]      = useState("Bangalore");
  const [ctcMin, setCtcMin]          = useState(10);
  const [ctcMax, setCtcMax]          = useState(40);
  const [expLevel, setExpLevel]      = useState("mid");
  const [jobs, setJobs]              = useState<JobWithState[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [jobsError, setJobsError]    = useState("");
  const [appliedList, setAppliedList] = useState<Application[]>([]);
  const [loadingApplied, setLoadingApplied] = useState(false);

  // Portal credentials state
  const [savedCreds, setSavedCreds]        = useState<PortalCred[]>([]);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [modalPortal, setModalPortal]      = useState("linkedin");

  // ── Init ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const localApps = loadAppsLocally();
    if (localApps.length) setAppliedList(localApps);
    const localCamp = loadCampaignLocally();

    // Job handed over from Job Finder's "Auto-Apply" button — apply to THAT job,
    // shown alone at the top of the queue, regardless of campaign state
    const handedOver = useJobStore.getState().selectedJob;
    if (handedOver) {
      useJobStore.getState().clearSelectedJob();
      setView("dashboard");
      setJobs([{ ...(handedOver as unknown as Job), uiStatus: "idle" as CardStatus } as JobWithState]);
      if (localCamp) {
        setCampaign(localCamp); setRole(localCamp.role); setLocation(localCamp.location);
        setCtcMin(localCamp.ctc_min); setCtcMax(localCamp.ctc_max); setExpLevel(localCamp.experience_level);
      } else {
        // Minimal implicit campaign so the dashboard renders
        const c: Campaign = { role: handedOver.title, location: handedOver.location || "Any", ctc_min: 5, ctc_max: 50, experience_level: "mid" };
        setCampaign(c);
      }
      syncFromBackend(localApps, localCamp || ({} as Campaign));
      loadCredentials();
      return;
    }

    if (localCamp) {
      setCampaign(localCamp); setRole(localCamp.role); setLocation(localCamp.location);
      setCtcMin(localCamp.ctc_min); setCtcMax(localCamp.ctc_max); setExpLevel(localCamp.experience_level);
      setView("dashboard"); discoverJobs(localCamp.role, localCamp.location);
    }
    syncFromBackend(localApps, localCamp);
    loadCredentials();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCredentials = async () => {
    try {
      const { data } = await api.get("/auto-apply/credentials");
      setSavedCreds(data.credentials || []);
    } catch { /* ignore */ }
  };

  const syncFromBackend = async (localApps: Application[], localCamp: Campaign | null) => {
    try {
      setLoadingApplied(true);
      const { data } = await api.get("/auto-apply/applications");
      const merged = mergeApps(data.applications || [], localApps);
      setAppliedList(merged); saveAppsLocally(merged); setLoadingApplied(false);
      if (!localCamp) {
        const { data: cd } = await api.get("/auto-apply/campaign");
        if (cd.campaign) {
          const c = cd.campaign.criteria as Campaign;
          setCampaign(c); setRole(c.role); setLocation(c.location);
          setCtcMin(c.ctc_min); setCtcMax(c.ctc_max); setExpLevel(c.experience_level);
          setView("dashboard"); discoverJobs(c.role, c.location); saveCampaignLocally(c);
        }
      }
    } catch { setLoadingApplied(false); }
  };

  const discoverJobs = async (r: string, l: string) => {
    setIsLoadingJobs(true); setJobsError("");
    try {
      const { data } = await api.post("/jobs/search", {
        query: r, location: l === "Any" ? "" : l,
        experience_years: 0, salary_min: 0, job_type: "fulltime", remote: "", portals: [],
      });
      setJobs((data.jobs || []).map((j: Job) => ({ ...j, uiStatus: "idle" as CardStatus })));
    } catch { setJobsError("Could not load jobs. Check your connection."); }
    finally { setIsLoadingJobs(false); }
  };

  const saveCampaign = async () => {
    const c: Campaign = { role, location, ctc_min: ctcMin, ctc_max: ctcMax, experience_level: expLevel };
    setCampaign(c); saveCampaignLocally(c); setView("dashboard"); discoverJobs(role, location);
    try { await api.post("/auto-apply/campaign", c); } catch { }
  };

  const resetCampaign = async () => {
    setCampaign(null); setView("setup"); setSetupStep(1); setJobs([]);
    try { localStorage.removeItem(LS_CAMP_KEY); } catch { }
    try { await api.delete("/auto-apply/campaign"); } catch { }
  };

  const handleApplied = async (job: Job, opts: { coverLetter: string; autoSubmitted: boolean }) => {
    const newApp: Application = {
      id: `local-${Date.now()}`, job_id: job.id, company: job.company, role: job.title,
      job_url: job.url || job.portal_url, platform: job.portal,
      match_score: job.match_score, status: "applied",
      applied_at: new Date().toISOString(), cover_letter: opts.coverLetter, _local: true,
    };
    setAppliedList((prev) => { const next = [newApp, ...prev.filter((a) => a.job_id !== job.id)]; saveAppsLocally(next); return next; });
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
    setActiveTab("applied");
    try {
      const { data } = await api.post("/auto-apply/mark-applied", {
        job_id: job.id, company: job.company, role: job.title,
        job_url: job.url || job.portal_url, platform: job.portal,
        match_score: job.match_score, cover_letter: opts.coverLetter,
        jd_snippet: job.description?.slice(0, 300), auto_submitted: opts.autoSubmitted,
      });
      if (data.id) {
        setAppliedList((prev) => { const next = prev.map((a) => a.job_id === job.id ? { ...a, id: data.id, _local: false } : a); saveAppsLocally(next); return next; });
      }
      // Tell Tracker + Dashboard to refetch immediately
      window.dispatchEvent(new Event("mithra:tracker-changed"));
    } catch { /* localStorage saved */ }
  };

  const handleSkip         = (id: string) => setJobs((prev) => prev.filter((j) => j.id !== id));
  const handleNeedsCreds   = (portal: string) => { setModalPortal(portal || "linkedin"); setShowCredsModal(true); };

  const updateAppStatus = async (appId: string, jobId: string, newStatus: string) => {
    setAppliedList((prev) => { const next = prev.map((a) => (a.id === appId || a.job_id === jobId) ? { ...a, status: newStatus } : a); saveAppsLocally(next); return next; });
    try { await api.patch(`/auto-apply/applications/${appId}/status`, { status: newStatus }); } catch { }
  };

  const deleteApp = async (appId: string, jobId: string) => {
    setAppliedList((prev) => { const next = prev.filter((a) => a.id !== appId && a.job_id !== jobId); saveAppsLocally(next); return next; });
    if (!appId.startsWith("local-")) { try { await api.delete(`/auto-apply/applications/${appId}`); } catch { } }
  };

  const removeCred = async (portal: string) => {
    try { await api.delete(`/auto-apply/credentials/${portal}`); loadCredentials(); } catch { }
  };

  const queueCount   = jobs.length;
  const appliedCount = appliedList.length;
  const avgScore     = jobs.length ? Math.round(jobs.reduce((s, j) => s + j.match_score, 0) / jobs.length) : 0;
  const savedPortalIds = savedCreds.map((c) => c.portal);

  if (!limits.autoApplyAccess) {
    return (
      <div style={{ height: "100%", overflowY: "auto", background: "#FAF7F1", padding: "24px" }}>
        <div style={{ maxWidth: "420px", margin: "0 auto" }}>
          <UpgradeGate requiredPlan="elite" featureName="Auto-Apply"
            description="AI finds matching jobs, tailors your resume per role, auto-submits applications, and tracks all of them." />
        </div>
      </div>
    );
  }

  // ── Setup Wizard ─────────────────────────────────────────────────────────────

  if (view === "setup") {
    return (
      <div style={{ height: "100%", overflowY: "auto", background: "#FAF7F1" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: `linear-gradient(135deg,${AMBER},#e67e22)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Zap style={{ width: "28px", height: "28px", color: "#fff" }} />
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#111", margin: "0 0 8px" }}>Set up Auto-Apply</h1>
            <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>Mithra finds matching jobs, adapts your resume, and tracks every application.</p>
          </div>

          {!hasResume && (
            <div style={{ marginBottom: "20px", padding: "14px 16px", borderRadius: "12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", display: "flex", gap: "10px" }}>
              <AlertCircle style={{ width: "16px", height: "16px", color: AMBER, flexShrink: 0, marginTop: "1px" }} />
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#111", margin: "0 0 2px" }}>No resume detected</p>
                <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>Build your resume first so AI can tailor it per job and auto-fill application forms.</p>
              </div>
            </div>
          )}

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "28px" }}>
            {[1, 2, 3].map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: setupStep >= s ? AMBER : "rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.3s" }}>
                  {setupStep > s ? <Check style={{ width: "13px", height: "13px", color: "#fff" }} /> : <span style={{ fontSize: "12px", fontWeight: 700, color: setupStep >= s ? "#fff" : "#aaa" }}>{s}</span>}
                </div>
                {i < 2 && <div style={{ flex: 1, height: "2px", background: setupStep > s ? AMBER : "rgba(0,0,0,0.07)", transition: "background 0.3s" }} />}
              </div>
            ))}
          </div>

          {setupStep === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#111", marginBottom: "8px" }}>What role are you targeting?</label>
                  <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Product Manager, Senior SDE, Data Analyst"
                    style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "14px", color: "#111", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                    onFocus={(e) => (e.target.style.borderColor = AMBER)} onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#111", marginBottom: "8px" }}>Preferred location</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {LOCATIONS.map((loc) => (
                      <button key={loc} onClick={() => setLocation(loc)}
                        style={{ padding: "7px 14px", borderRadius: "20px", border: `1.5px solid ${location === loc ? AMBER : "rgba(0,0,0,0.12)"}`, background: location === loc ? "rgba(245,158,11,0.1)" : "#fff", color: location === loc ? AMBER : "#555", fontSize: "12px", fontWeight: location === loc ? 700 : 400, cursor: "pointer" }}>
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => role.trim() && setSetupStep(2)} disabled={!role.trim()}
                style={{ width: "100%", marginTop: "16px", padding: "14px", borderRadius: "12px", border: "none", background: role.trim() ? `linear-gradient(135deg,${AMBER},#e67e22)` : "rgba(0,0,0,0.07)", color: role.trim() ? "#fff" : "#bbb", fontSize: "14px", fontWeight: 700, cursor: role.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                Next <ChevronRight style={{ width: "16px", height: "16px" }} />
              </button>
            </motion.div>
          )}

          {setupStep === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "24px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 700, color: "#111" }}>Expected CTC (LPA)</label>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: AMBER }}>₹{ctcMin}L – ₹{ctcMax}L</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "11px", color: "#888", display: "block", marginBottom: "4px" }}>Min</label>
                      <input type="range" min={3} max={ctcMax - 5} value={ctcMin} onChange={(e) => setCtcMin(Number(e.target.value))} style={{ width: "100%", accentColor: AMBER }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "11px", color: "#888", display: "block", marginBottom: "4px" }}>Max</label>
                      <input type="range" min={ctcMin + 5} max={200} value={ctcMax} onChange={(e) => setCtcMax(Number(e.target.value))} style={{ width: "100%", accentColor: AMBER }} />
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#111", marginBottom: "12px" }}>Experience level</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {EXP_LEVELS.map((lv) => (
                      <button key={lv.value} onClick={() => setExpLevel(lv.value)}
                        style={{ padding: "12px", borderRadius: "10px", border: `1.5px solid ${expLevel === lv.value ? AMBER : "rgba(0,0,0,0.1)"}`, background: expLevel === lv.value ? "rgba(245,158,11,0.07)" : "#fff", cursor: "pointer", textAlign: "left" }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: expLevel === lv.value ? AMBER : "#111", margin: "0 0 2px" }}>{lv.label}</p>
                        <p style={{ fontSize: "11px", color: "#888", margin: 0 }}>{lv.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button onClick={() => setSetupStep(1)} style={{ padding: "14px 20px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.12)", background: "#fff", color: "#555", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ArrowLeft style={{ width: "15px", height: "15px" }} /> Back
                </button>
                <button onClick={() => setSetupStep(3)} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg,${AMBER},#e67e22)`, color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  Next <ChevronRight style={{ width: "16px", height: "16px" }} />
                </button>
              </div>
            </motion.div>
          )}

          {setupStep === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid rgba(0,0,0,0.08)" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>Campaign Summary</p>
                {[
                  { icon: <Briefcase style={{ width: "14px", height: "14px", color: AMBER }} />, label: "Role", value: role },
                  { icon: <MapPin style={{ width: "14px", height: "14px", color: AMBER }} />, label: "Location", value: location },
                  { icon: <IndianRupee style={{ width: "14px", height: "14px", color: AMBER }} />, label: "CTC", value: `₹${ctcMin}L – ₹${ctcMax}L per annum` },
                  { icon: <TrendingUp style={{ width: "14px", height: "14px", color: AMBER }} />, label: "Experience", value: EXP_LEVELS.find((l) => l.value === expLevel)?.sub || expLevel },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    {row.icon}
                    <span style={{ fontSize: "12px", color: "#888", width: "80px", flexShrink: 0 }}>{row.label}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button onClick={() => setSetupStep(2)} style={{ padding: "14px 20px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.12)", background: "#fff", color: "#555", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ArrowLeft style={{ width: "15px", height: "15px" }} /> Back
                </button>
                <button onClick={saveCampaign} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg,${AMBER},#e67e22)`, color: "#fff", fontSize: "15px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <Zap style={{ width: "18px", height: "18px" }} /> Start Discovering Jobs
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#FAF7F1" }}>
      {showCredsModal && (
        <PortalCredentialsModal
          initialPortal={modalPortal}
          onClose={() => setShowCredsModal(false)}
          onSaved={loadCredentials}
        />
      )}

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "20px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111", margin: 0 }}>Auto-Apply</h2>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: "rgba(245,158,11,0.15)", color: AMBER }}>BETA</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              <Zap style={{ width: "12px", height: "12px", color: AMBER }} />
              <span style={{ fontSize: "12px", color: "#888" }}>{campaign?.role} · {campaign?.location}</span>
              <button onClick={resetCampaign} style={{ fontSize: "11px", color: VIOLET, background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: "4px", fontWeight: 600 }}>Edit</button>
            </div>
          </div>
          <button onClick={() => discoverJobs(campaign?.role || "", campaign?.location || "")} disabled={isLoadingJobs}
            style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.12)", background: "#fff", color: "#555", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: isLoadingJobs ? 0.6 : 1 }}>
            <RefreshCw style={{ width: "13px", height: "13px" }} /> Refresh
          </button>
        </div>

        {/* Portal Credentials Banner */}
        <div style={{ background: "#fff", borderRadius: "14px", padding: "14px 16px", border: "1px solid rgba(0,0,0,0.07)", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield style={{ width: "14px", height: "14px", color: VIOLET }} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#111" }}>Portal Auto-Login</span>
              <span style={{ fontSize: "10px", color: "#888", fontWeight: 400 }}>Saved once, used automatically</span>
            </div>
            <button onClick={() => { setModalPortal("linkedin"); setShowCredsModal(true); }}
              style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "20px", border: `1px solid ${VIOLET}`, background: "rgba(15,110,85,0.06)", color: VIOLET, cursor: "pointer", fontWeight: 600 }}>
              + Add
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {PORTALS.map((p) => {
              const saved = savedCreds.find((c) => c.portal === p.id);
              return (
                <div key={p.id}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "20px", border: `1px solid ${saved ? "rgba(16,185,129,0.3)" : "rgba(0,0,0,0.1)"}`, background: saved ? "rgba(16,185,129,0.06)" : "rgba(0,0,0,0.03)" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: saved ? GREEN : "#ddd" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: saved ? GREEN : "#888" }}>{p.label}</span>
                  {saved && (
                    <button onClick={() => removeCred(p.id)} title="Remove"
                      style={{ marginLeft: "2px", padding: 0, background: "none", border: "none", cursor: "pointer", color: "#bbb", display: "flex", lineHeight: 1 }}>
                      <X style={{ width: "10px", height: "10px" }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: "10px", color: "#aaa", margin: "8px 0 0" }}>
            Credentials are encrypted at rest. Auto Submit uses them to log in before filling your application.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "18px" }}>
          {[
            { icon: <Target style={{ width: "15px", height: "15px", color: AMBER }} />, label: "In Queue", value: queueCount, color: AMBER },
            { icon: <Check style={{ width: "15px", height: "15px", color: GREEN }} />, label: "Applied", value: appliedCount, color: GREEN },
            { icon: <BarChart2 style={{ width: "15px", height: "15px", color: VIOLET }} />, label: "Avg Match", value: `${avgScore}%`, color: VIOLET },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", borderRadius: "12px", padding: "12px 14px", border: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: "9px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
              <div>
                <p style={{ fontSize: "18px", fontWeight: 800, color: "#111", margin: 0 }}>{s.value}</p>
                <p style={{ fontSize: "11px", color: "#888", margin: 0 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", marginBottom: "16px", background: "rgba(0,0,0,0.04)", borderRadius: "12px", padding: "4px" }}>
          {(["queue", "applied"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ flex: 1, padding: "9px", borderRadius: "9px", border: "none", background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? "#111" : "#888", fontSize: "13px", fontWeight: activeTab === tab ? 700 : 400, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              {tab === "queue"
                ? <><Target style={{ width: "13px", height: "13px" }} /> Job Queue {queueCount > 0 && <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "20px", background: AMBER, color: "#fff", fontWeight: 700 }}>{queueCount}</span>}</>
                : <><Check style={{ width: "13px", height: "13px" }} /> Applied {appliedCount > 0 && <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "20px", background: GREEN, color: "#fff", fontWeight: 700 }}>{appliedCount}</span>}</>
              }
            </button>
          ))}
        </div>

        {/* Queue Tab */}
        {activeTab === "queue" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {isLoadingJobs && (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <Loader2 style={{ width: "26px", height: "26px", color: AMBER, animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>Searching <strong>{campaign?.role}</strong> in <strong>{campaign?.location}</strong>…</p>
              </div>
            )}
            {jobsError && !isLoadingJobs && (
              <div style={{ padding: "20px", borderRadius: "14px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.2)", textAlign: "center" }}>
                <AlertCircle style={{ width: "20px", height: "20px", color: "#ef4444", margin: "0 auto 8px" }} />
                <p style={{ fontSize: "13px", color: "#ef4444", margin: "0 0 12px" }}>{jobsError}</p>
                <button onClick={() => discoverJobs(campaign?.role || "", campaign?.location || "")}
                  style={{ padding: "8px 18px", borderRadius: "10px", border: "none", background: "#ef4444", color: "#fff", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>Try Again</button>
              </div>
            )}
            {!isLoadingJobs && !jobsError && jobs.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "#fff", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔍</div>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#111", margin: "0 0 6px" }}>No jobs in queue</p>
                <p style={{ fontSize: "13px", color: "#888", margin: "0 0 16px" }}>All caught up! Refresh to find new listings.</p>
                <button onClick={() => discoverJobs(campaign?.role || "", campaign?.location || "")}
                  style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: AMBER, color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Discover More</button>
              </div>
            )}
            <AnimatePresence>
              {!isLoadingJobs && jobs.map((job) => (
                <JobCard
                  key={job.id} job={job} resume={resume}
                  savedPortals={savedPortalIds}
                  onNeedsCredentials={handleNeedsCreds}
                  onApplied={handleApplied}
                  onSkip={handleSkip}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Applied Tab */}
        {activeTab === "applied" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {loadingApplied && appliedList.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px" }}>
                <Loader2 style={{ width: "22px", height: "22px", color: AMBER, animation: "spin 1s linear infinite", margin: "0 auto" }} />
              </div>
            )}
            {!loadingApplied && appliedList.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "#fff", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>📋</div>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#111", margin: "0 0 6px" }}>No applications yet</p>
                <p style={{ fontSize: "13px", color: "#888", margin: "0 0 16px" }}>Click "Quick Apply" or "Auto Submit" on a job — it'll appear here instantly.</p>
                <button onClick={() => setActiveTab("queue")} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: AMBER, color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Go to Queue</button>
              </div>
            )}
            {appliedList.map((app) => {
              const sm = STATUS_META[app.status] || STATUS_META.applied;
              return (
                <motion.div key={app.id || app.job_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: "#fff", borderRadius: "14px", padding: "14px 16px", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <ScoreRing score={app.match_score} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "#111", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.role}</p>
                      <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>{app.company}{app.platform ? ` · ${app.platform}` : ""}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ padding: "3px 9px", borderRadius: "20px", background: sm.bg, color: sm.color, fontSize: "11px", fontWeight: 700, display: "inline-block" }}>{sm.label}</div>
                      {app._local ? <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>Syncing…</div>
                        : app.applied_at ? <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>{daysAgo(app.applied_at)}</div> : null}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <select value={app.status} onChange={(e) => updateAppStatus(app.id, app.job_id, e.target.value)}
                      style={{ flex: 1, padding: "7px 10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "12px", color: "#555", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                      {Object.entries(STATUS_META).map(([val, meta]) => (
                        <option key={val} value={val}>{meta.label}</option>
                      ))}
                    </select>
                    {app.job_url && (
                      <a href={app.job_url} target="_blank" rel="noopener" style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", background: "#fff", color: "#555", display: "flex", alignItems: "center", textDecoration: "none" }}>
                        <ExternalLink style={{ width: "13px", height: "13px" }} />
                      </a>
                    )}
                    <button onClick={() => deleteApp(app.id, app.job_id)}
                      style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)", background: "#fff", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <Trash2 style={{ width: "13px", height: "13px" }} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        <div style={{ height: "40px" }} />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

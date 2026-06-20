"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, MapPin, Briefcase, Target, ChevronRight, ChevronDown,
  ExternalLink, Check, BarChart2, RefreshCw, Trash2,
  AlertCircle, ArrowLeft, Loader2, TrendingUp, Bot,
  Building2, IndianRupee, X, Camera, Play, Terminal,
} from "lucide-react";
import { api } from "@/lib/api/client";
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
  | "autosubmitting" | "waiting_user" | "autoresult"
  | "confirming" | "done" | "skipped";

interface JobWithState extends Job {
  uiStatus: CardStatus;
  adaptedCoverLetter?: string;
  autoResult?: AutoSubmitResult;
}

interface AutoSubmitResult {
  success: boolean; portal: string; title: string;
  fields_filled: number; message: string;
  screenshot?: string; apply_url: string;
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

interface CompanionCallbacks {
  onStatus: (msg: string) => void;
  onScreenshot: (b64: string) => void;
  onWaiting: (reason: string, msg: string, screenshot?: string) => void;
  onDone: (result: AutoSubmitResult) => void;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const AMBER = "#f59e0b";
const VIOLET = "#7c3aed";
const GREEN = "#10b981";
const LS_APPS_KEY = "mithra-applied-apps";
const LS_CAMP_KEY = "mithra-campaign";
const COMPANION_WS = "ws://localhost:7777";

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
  applied:     { label: "Applied",      color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  viewed:      { label: "Viewed",       color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  shortlisted: { label: "Shortlisted",  color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  interview:   { label: "Interview",    color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  offer:       { label: "Offer 🎉",     color: "#10b981", bg: "rgba(16,185,129,0.18)" },
  rejected:    { label: "Rejected",     color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

// ── LocalStorage helpers ───────────────────────────────────────────────────────

function saveAppsLocally(apps: Application[]) {
  try { localStorage.setItem(LS_APPS_KEY, JSON.stringify(apps)); } catch { /* ignore */ }
}
function loadAppsLocally(): Application[] {
  try { const r = localStorage.getItem(LS_APPS_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function mergeApps(backend: Application[], local: Application[]): Application[] {
  const ids = new Set(backend.map((a) => a.job_id));
  return [...backend, ...local.filter((a) => !ids.has(a.job_id)).map((a) => ({ ...a, _local: true }))];
}
function saveCampaignLocally(c: Campaign) {
  try { localStorage.setItem(LS_CAMP_KEY, JSON.stringify(c)); } catch { /* ignore */ }
}
function loadCampaignLocally(): Campaign | null {
  try { const r = localStorage.getItem(LS_CAMP_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  return s >= 80 ? GREEN : s >= 60 ? AMBER : "#ef4444";
}
function formatCtc(min: number, max: number) {
  const f = (n: number) => n >= 100_000 ? `${(n / 100_000).toFixed(0)}L` : `${(n / 1_000).toFixed(0)}K`;
  return `₹${f(min)}–${f(max)}`;
}
function daysAgo(d: string) {
  try {
    const n = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
    return n === 0 ? "Today" : n === 1 ? "Yesterday" : `${n}d ago`;
  } catch { return ""; }
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

// ── Companion Setup Modal ──────────────────────────────────────────────────────

function CompanionSetupModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", maxWidth: "500px", width: "100%", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "#888" }}>
          <X style={{ width: "18px", height: "18px" }} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Bot style={{ width: "22px", height: "22px", color: VIOLET }} />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111", margin: 0 }}>Enable Live Browser Mode</h3>
            <p style={{ fontSize: "12px", color: "#888", margin: "2px 0 0" }}>Opens a real Chrome window on your screen — bot fills forms, you handle login</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            {
              n: "1",
              title: "Install (run once in terminal)",
              code: ["pip install playwright websockets", "playwright install chromium"],
            },
            {
              n: "2",
              title: "Download & run the companion",
              code: ["python mithra_companion.py"],
              note: "Download mithra_companion.py from the Mithra AI settings page",
            },
            {
              n: "3",
              title: "Come back here — green dot appears on Auto Submit",
              code: [],
              note: "The companion reconnects automatically every time you run it.",
            },
          ].map((s) => (
            <div key={s.n} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: VIOLET, color: "#fff", fontSize: "12px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>{s.n}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#111", margin: "0 0 6px" }}>{s.title}</p>
                {s.code.length > 0 && (
                  <div style={{ background: "#1a1a2e", borderRadius: "8px", padding: "10px 14px" }}>
                    {s.code.map((line, i) => (
                      <p key={i} style={{ fontSize: "12px", color: "#a8e6cf", margin: 0, fontFamily: "monospace", lineHeight: "1.8" }}>{line}</p>
                    ))}
                  </div>
                )}
                {s.note && <p style={{ fontSize: "11px", color: "#888", margin: "5px 0 0" }}>{s.note}</p>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "20px", padding: "12px 14px", borderRadius: "10px", background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}>
          <p style={{ fontSize: "12px", color: "#555", margin: 0, lineHeight: "1.7" }}>
            <strong>How it works:</strong> Chrome opens on your screen. The bot navigates and fills your details automatically.
            When it hits a login or captcha, it <strong>pauses and tells you</strong>. You complete it in the browser,
            then click <strong>"I'm done — Continue"</strong> and the bot takes over again.
          </p>
        </div>
        <p style={{ fontSize: "11px", color: "#aaa", margin: "10px 0 0", textAlign: "center" }}>
          Runs only on your machine. Your credentials never leave your browser.
        </p>
      </div>
    </div>
  );
}

// ── Job Card ───────────────────────────────────────────────────────────────────

interface JobCardProps {
  job: JobWithState;
  resume: ResumeData;
  companionReady: boolean;
  companionBusy: boolean;
  onCompanionSubmit: (jobUrl: string, profile: object, cbs: CompanionCallbacks) => void;
  onCompanionContinue: () => void;
  onApplied: (job: Job, opts: { coverLetter: string; autoSubmitted: boolean }) => void;
  onSkip: (id: string) => void;
}

function JobCard({
  job, resume, companionReady, companionBusy,
  onCompanionSubmit, onCompanionContinue, onApplied, onSkip,
}: JobCardProps) {
  const [st, setSt] = useState<JobWithState>(job);
  const [expanded, setExpanded] = useState(false);
  const [autoMsg, setAutoMsg] = useState("");
  const [liveScreenshot, setLiveScreenshot] = useState<string | undefined>();
  const [waitingMsg, setWaitingMsg] = useState("");
  const [waitingReason, setWaitingReason] = useState("");

  const isActive = st.uiStatus === "autosubmitting" || st.uiStatus === "waiting_user";

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

  // Companion: real visible browser on user's machine
  const autoSubmitCompanion = () => {
    setSt((p) => ({ ...p, uiStatus: "autosubmitting" }));
    setExpanded(true);
    setLiveScreenshot(undefined);
    setAutoMsg("Opening browser on your screen…");

    onCompanionSubmit(
      st.url || st.portal_url,
      {
        name: resume?.personal?.name || "",
        email: resume?.personal?.email || "",
        phone: resume?.personal?.phone || "",
        location: resume?.personal?.location || "",
        linkedin: resume?.personal?.linkedin || "",
      },
      {
        onStatus: (msg) => setAutoMsg(msg),
        onScreenshot: (b64) => setLiveScreenshot(b64),
        onWaiting: (reason, msg, ss) => {
          setWaitingReason(reason);
          setWaitingMsg(msg);
          if (ss) setLiveScreenshot(ss);
          setSt((p) => ({ ...p, uiStatus: "waiting_user" }));
        },
        onDone: (result) => {
          setSt((p) => ({ ...p, uiStatus: "autoresult", autoResult: result }));
        },
      }
    );
  };

  // Server fallback: headless screenshot only
  const autoSubmitServer = async () => {
    setSt((p) => ({ ...p, uiStatus: "autosubmitting" }));
    setExpanded(true);
    setAutoMsg("Connecting to server browser…");
    const msgs = [
      "Opening job portal…", "Loading page…", "Scanning form fields…", "Pre-filling details…",
    ];
    let i = 0;
    const ticker = setInterval(() => { i = Math.min(i + 1, msgs.length - 1); setAutoMsg(msgs[i]); }, 3000);
    try {
      const { data } = await api.post("/auto-apply/submit", {
        job_url: st.url || st.portal_url, job_id: st.id,
        company: st.company, role: st.title, match_score: st.match_score,
        profile: {
          name: resume?.personal?.name || "",
          email: resume?.personal?.email || "",
          phone: resume?.personal?.phone || "",
          location: resume?.personal?.location || "",
          linkedin: resume?.personal?.linkedin || "",
        },
      });
      clearInterval(ticker);
      setSt((p) => ({ ...p, uiStatus: "autoresult", autoResult: data }));
    } catch {
      clearInterval(ticker);
      setSt((p) => ({ ...p, uiStatus: "idle" }));
    }
  };

  const autoSubmit = () => {
    if (companionReady && !companionBusy) {
      autoSubmitCompanion();
    } else {
      autoSubmitServer();
    }
  };

  const handleContinue = () => {
    setSt((p) => ({ ...p, uiStatus: "autosubmitting" }));
    setAutoMsg("Resuming — bot is taking over…");
    onCompanionContinue();
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
        <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
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
              <span key={sk} style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "20px", background: "rgba(124,58,237,0.07)", color: VIOLET, border: "1px solid rgba(124,58,237,0.15)" }}>{sk}</span>
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
              title={companionReady ? "Opens real Chrome on your screen — bot fills forms, you handle login" : "Server mode: takes a screenshot of the job page"}
              style={{ padding: "10px 12px", borderRadius: "10px", border: `1.5px solid ${VIOLET}`, background: "rgba(124,58,237,0.06)", color: VIOLET, fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", position: "relative" }}>
              <Bot style={{ width: "13px", height: "13px" }} /> Auto Submit
              {companionReady && (
                <span style={{ position: "absolute", top: "-5px", right: "-5px", width: "9px", height: "9px", borderRadius: "50%", background: GREEN, border: "2px solid #fff" }} />
              )}
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
            <button onClick={autoSubmit} style={{ padding: "10px 12px", borderRadius: "10px", border: `1.5px solid ${VIOLET}`, background: "rgba(124,58,237,0.06)", color: VIOLET, fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
              <Bot style={{ width: "13px", height: "13px" }} /> Auto
            </button>
            <button onClick={() => setSt((p) => ({ ...p, uiStatus: "idle" }))} style={{ padding: "10px 11px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", cursor: "pointer", color: "#999", fontSize: "12px" }}>Back</button>
          </>
        )}

        {/* LOADING */}
        {st.uiStatus === "autosubmitting" && (
          <div style={{ flex: 1, padding: "12px 14px", borderRadius: "10px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Loader2 style={{ width: "14px", height: "14px", color: VIOLET, animation: "spin 1s linear infinite", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: VIOLET, fontWeight: 600 }}>{autoMsg}</span>
            </div>
            {companionReady && (
              <p style={{ fontSize: "11px", color: "#888", margin: "6px 0 0" }}>
                Watch the Chrome window that just opened on your screen.
              </p>
            )}
          </div>
        )}

        {/* WAITING FOR USER */}
        {st.uiStatus === "waiting_user" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "22px", flexShrink: 0 }}>
                  {waitingReason === "captcha" ? "🤖" : "🔐"}
                </span>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#111", margin: "0 0 4px" }}>
                    {waitingReason === "captcha" ? "Captcha detected" : "Login required in browser"}
                  </p>
                  <p style={{ fontSize: "12px", color: "#666", margin: 0, lineHeight: "1.7", whiteSpace: "pre-line" }}>
                    {waitingMsg || "Please complete the step in the Chrome window on your screen, then click Continue."}
                  </p>
                </div>
              </div>
            </div>
            <button onClick={handleContinue}
              style={{ padding: "12px", borderRadius: "10px", border: "none", background: `linear-gradient(135deg,${VIOLET},#5b21b6)`, color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Play style={{ width: "14px", height: "14px" }} /> I'm done — Continue
            </button>
          </div>
        )}

        {/* AUTO RESULT */}
        {st.uiStatus === "autoresult" && st.autoResult && (
          <div style={{ flex: 1, display: "flex", gap: "8px" }}>
            <button onClick={() => confirmApplied(true)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: `linear-gradient(135deg,${GREEN},#059669)`, color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Check style={{ width: "13px", height: "13px" }} /> Confirm Applied ✓
            </button>
            {st.autoResult.apply_url && (
              <a href={st.autoResult.apply_url} target="_blank" rel="noopener" style={{ padding: "10px 12px", borderRadius: "10px", border: `1px solid ${GREEN}`, background: "#fff", color: GREEN, display: "flex", alignItems: "center", textDecoration: "none" }}>
                <ExternalLink style={{ width: "13px", height: "13px" }} />
              </a>
            )}
            <button onClick={() => setSt((p) => ({ ...p, uiStatus: "idle", autoResult: undefined }))} style={{ padding: "10px 11px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff", cursor: "pointer", color: "#999", fontSize: "12px" }}>Back</button>
          </div>
        )}

        {/* CONFIRMING manual */}
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
        {(expanded || isActive || st.uiStatus === "autoresult") && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* Live screenshot */}
              {(liveScreenshot || st.autoResult?.screenshot) && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <Camera style={{ width: "13px", height: "13px", color: VIOLET }} />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: VIOLET, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {st.uiStatus === "waiting_user" ? "Browser — waiting for you" : "Live Screenshot"}
                    </span>
                    {st.autoResult?.fields_filled ? (
                      <span style={{ marginLeft: "auto", fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(16,185,129,0.1)", color: GREEN, fontWeight: 600 }}>
                        {st.autoResult.fields_filled} fields filled ✓
                      </span>
                    ) : null}
                  </div>
                  <div style={{ borderRadius: "10px", overflow: "hidden", border: st.uiStatus === "waiting_user" ? "2px solid rgba(245,158,11,0.5)" : "1px solid rgba(0,0,0,0.1)", position: "relative" }}>
                    <img
                      src={`data:image/jpeg;base64,${liveScreenshot || st.autoResult?.screenshot}`}
                      alt="Browser view"
                      style={{ width: "100%", display: "block", maxHeight: "260px", objectFit: "cover", objectPosition: "top" }}
                    />
                    {st.uiStatus === "waiting_user" && (
                      <div style={{ position: "absolute", bottom: "8px", left: "8px", padding: "4px 10px", borderRadius: "20px", background: "rgba(245,158,11,0.9)", fontSize: "10px", color: "#fff", fontWeight: 700 }}>
                        ⏸ Bot paused — complete the step above
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Result message */}
              {st.autoResult?.message && (
                <p style={{ fontSize: "12px", color: "#555", margin: 0, lineHeight: "1.6" }}>{st.autoResult.message}</p>
              )}

              {/* Cover letter */}
              {st.adaptedCoverLetter && (
                <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.14)" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: VIOLET, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>✨ AI Cover Letter Hook</p>
                  <p style={{ fontSize: "12px", color: "#444", lineHeight: "1.6", fontStyle: "italic", margin: 0 }}>"{st.adaptedCoverLetter}"</p>
                  <button onClick={() => navigator.clipboard.writeText(st.adaptedCoverLetter || "")} style={{ marginTop: "8px", fontSize: "11px", color: VIOLET, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>Copy →</button>
                </div>
              )}

              {/* JD snippet when just expanded */}
              {!st.autoResult && !st.adaptedCoverLetter && !isActive && (
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
  const { user } = useUser();
  const limits = getLimits(user?.plan ?? "free");
  const { resume } = useResumeStore();
  const hasResume = Boolean(resume?.personal?.name || resume?.experience?.length);

  // ── Companion WebSocket ──────────────────────────────────────────────────────
  const wsRef = useRef<WebSocket | null>(null);
  const companionCallbacksRef = useRef<CompanionCallbacks | null>(null);
  const [companionReady, setCompanionReady] = useState(false);
  const [companionBusy, setCompanionBusy] = useState(false);
  const [showCompanionSetup, setShowCompanionSetup] = useState(false);

  const connectCompanion = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const ws = new WebSocket(COMPANION_WS);
      ws.onopen = () => {
        wsRef.current = ws;
        setCompanionReady(true);
        ws.send(JSON.stringify({ type: "ping" }));
      };
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "pong") return;
          const cbs = companionCallbacksRef.current;
          if (!cbs) return;
          if (data.type === "status") cbs.onStatus(data.message);
          else if (data.type === "screenshot") cbs.onScreenshot(data.data);
          else if (data.type === "waiting") cbs.onWaiting(data.reason || "login", data.message, data.screenshot);
          else if (data.type === "done") {
            setCompanionBusy(false);
            companionCallbacksRef.current = null;
            cbs.onDone({
              success: data.success ?? true,
              portal: "Local Browser",
              title: "",
              fields_filled: data.fields_filled || 0,
              message: data.message || "",
              screenshot: data.screenshot,
              apply_url: "",
            });
          }
        } catch { /* ignore */ }
      };
      ws.onerror = () => {};
      ws.onclose = () => {
        setCompanionReady(false);
        wsRef.current = null;
        setTimeout(connectCompanion, 5000);
      };
    } catch { /* ignore in SSR */ }
  }, []);

  useEffect(() => {
    connectCompanion();
    return () => { wsRef.current?.close(); };
  }, [connectCompanion]);

  const startCompanionSubmit = useCallback((
    jobUrl: string, profile: object, cbs: CompanionCallbacks
  ) => {
    if (!wsRef.current || companionBusy) return;
    setCompanionBusy(true);
    companionCallbacksRef.current = cbs;
    wsRef.current.send(JSON.stringify({ type: "submit", job_url: jobUrl, profile }));
  }, [companionBusy]);

  const sendContinue = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "continue" }));
  }, []);

  // ── App state ────────────────────────────────────────────────────────────────

  const [view, setView]             = useState<"setup" | "dashboard">("setup");
  const [setupStep, setSetupStep]   = useState(1);
  const [campaign, setCampaign]     = useState<Campaign | null>(null);
  const [activeTab, setActiveTab]   = useState<"queue" | "applied">("queue");
  const [role, setRole]             = useState("");
  const [location, setLocation]     = useState("Bangalore");
  const [ctcMin, setCtcMin]         = useState(10);
  const [ctcMax, setCtcMax]         = useState(40);
  const [expLevel, setExpLevel]     = useState("mid");
  const [jobs, setJobs]             = useState<JobWithState[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [jobsError, setJobsError]   = useState("");
  const [appliedList, setAppliedList] = useState<Application[]>([]);
  const [loadingApplied, setLoadingApplied] = useState(false);

  useEffect(() => {
    const localApps = loadAppsLocally();
    if (localApps.length) setAppliedList(localApps);
    const localCamp = loadCampaignLocally();
    if (localCamp) {
      setCampaign(localCamp); setRole(localCamp.role); setLocation(localCamp.location);
      setCtcMin(localCamp.ctc_min); setCtcMax(localCamp.ctc_max); setExpLevel(localCamp.experience_level);
      setView("dashboard"); discoverJobs(localCamp.role, localCamp.location);
    }
    syncFromBackend(localApps, localCamp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    try { await api.post("/auto-apply/campaign", c); } catch { /* best effort */ }
  };

  const resetCampaign = async () => {
    setCampaign(null); setView("setup"); setSetupStep(1); setJobs([]);
    try { localStorage.removeItem(LS_CAMP_KEY); } catch { /* ignore */ }
    try { await api.delete("/auto-apply/campaign"); } catch { /* ignore */ }
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
    } catch { /* localStorage saved */ }
  };

  const handleSkip = (id: string) => setJobs((prev) => prev.filter((j) => j.id !== id));

  const updateAppStatus = async (appId: string, jobId: string, newStatus: string) => {
    setAppliedList((prev) => { const next = prev.map((a) => (a.id === appId || a.job_id === jobId) ? { ...a, status: newStatus } : a); saveAppsLocally(next); return next; });
    try { await api.patch(`/auto-apply/applications/${appId}/status`, { status: newStatus }); } catch { /* ignore */ }
  };

  const deleteApp = async (appId: string, jobId: string) => {
    setAppliedList((prev) => { const next = prev.filter((a) => a.id !== appId && a.job_id !== jobId); saveAppsLocally(next); return next; });
    if (!appId.startsWith("local-")) { try { await api.delete(`/auto-apply/applications/${appId}`); } catch { /* ignore */ } }
  };

  const queueCount   = jobs.length;
  const appliedCount = appliedList.length;
  const avgScore     = jobs.length ? Math.round(jobs.reduce((s, j) => s + j.match_score, 0) / jobs.length) : 0;

  if (!limits.autoApplyAccess) {
    return (
      <div style={{ height: "100%", overflowY: "auto", background: "#F7F7F5", padding: "24px" }}>
        <div style={{ maxWidth: "420px", margin: "0 auto" }}>
          <UpgradeGate requiredPlan="elite" featureName="Auto-Apply"
            description="AI finds matching jobs, tailors your resume per role, auto-submits applications, and tracks all of them." />
        </div>
      </div>
    );
  }

  // ── Setup Wizard ───────────────────────────────────────────────────────────

  if (view === "setup") {
    return (
      <div style={{ height: "100%", overflowY: "auto", background: "#F7F7F5" }}>
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

  // ── Dashboard ──────────────────────────────────────────────────────────────

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#F7F7F5" }}>
      {showCompanionSetup && <CompanionSetupModal onClose={() => setShowCompanionSetup(false)} />}

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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {companionReady ? (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: GREEN }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: GREEN }}>Companion Active</span>
              </div>
            ) : (
              <button onClick={() => setShowCompanionSetup(true)}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.12)", cursor: "pointer" }}>
                <Terminal style={{ width: "11px", height: "11px", color: "#888" }} />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#666" }}>Enable Live Browser</span>
              </button>
            )}
            <button onClick={() => discoverJobs(campaign?.role || "", campaign?.location || "")} disabled={isLoadingJobs}
              style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.12)", background: "#fff", color: "#555", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: isLoadingJobs ? 0.6 : 1 }}>
              <RefreshCw style={{ width: "13px", height: "13px" }} /> Refresh
            </button>
          </div>
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
                <JobCard key={job.id} job={job} resume={resume}
                  companionReady={companionReady}
                  companionBusy={companionBusy}
                  onCompanionSubmit={startCompanionSubmit}
                  onCompanionContinue={sendContinue}
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

"use client";
import CoinCost from "@/components/ui/CoinCost";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Link2, Building2, Wand2, FileText, Sparkles,
  TrendingUp, AlertCircle, Check, Copy, Download, Upload,
  ChevronRight, BookOpen, Eye, Edit3, Briefcase, X, Save, Cloud,
  ChevronDown,
} from "lucide-react";
import { api, API_BASE } from "@/lib/api/client";
import { useResumeStore } from "@/lib/stores/resumeStore";
import { useAgentStore } from "@/lib/stores/agentStore";
import { useJobStore } from "@/lib/stores/jobStore";
import { FileUploadModal } from "@/components/ui/FileUploadModal";
import { ResumeData } from "@/lib/types";
import { useUser } from "@/lib/auth";
import { getLimits } from "@/lib/planLimits";
import { useUsageTracker } from "@/lib/useUsageTracker";
import { UsageProgressNudge, CelebrationNudge, TeaserNudge } from "@/components/ui/UpgradeNudge";

type InputMode = "paste" | "url" | "company";
type RightTab = "results" | "changes" | "preview";

interface SuggestedChange {
  section: string;
  lens?: string;
  original: string;
  suggested: string;
  reason: string;
}

const LENS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  "ATS":            { bg: "rgba(59,130,246,0.15)",  color: "#60a5fa", border: "rgba(59,130,246,0.4)" },
  "HR Screener":    { bg: "rgba(16,185,129,0.15)",  color: "#34d399", border: "rgba(16,185,129,0.4)" },
  "Hiring Manager": { bg: "rgba(15,110,85,0.15)",  color: "#0F6E55", border: "rgba(15,110,85,0.4)" },
  "Domain Expert":  { bg: "rgba(245,158,11,0.15)",  color: "#fbbf24", border: "rgba(245,158,11,0.4)" },
  "Cultural Fit":   { bg: "rgba(236,72,153,0.15)",  color: "#f472b6", border: "rgba(236,72,153,0.4)" },
};

const SCORE_COLOR = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444";

const S = {
  page: { height: "100%", display: "flex", overflow: "hidden" } as React.CSSProperties,
  leftPanel: { width: "420px", flexShrink: 0, display: "flex", flexDirection: "column" as const, borderRight: "1px solid rgba(0,0,0,0.08)", overflow: "auto" } as React.CSSProperties,
  leftHeader: { padding: "20px 24px 16px", borderBottom: "1px solid rgba(0,0,0,0.08)", flexShrink: 0 } as React.CSSProperties,
  h3: { fontSize: "15px", fontWeight: 700, color: "#111111", marginBottom: "4px" } as React.CSSProperties,
  tabRow: { display: "flex", gap: "4px", padding: "4px", borderRadius: "12px", background: "rgba(0,0,0,0.04)", margin: "16px 16px 0", flexShrink: 0 } as React.CSSProperties,
  tabActive: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px 4px", fontSize: "12px", fontWeight: 600, borderRadius: "8px", border: "none", cursor: "pointer", background: "#0F6E55", color: "white", boxShadow: "0 2px 8px rgba(15,110,85,0.25)" } as React.CSSProperties,
  tabInactive: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px 4px", fontSize: "12px", fontWeight: 600, borderRadius: "8px", border: "none", cursor: "pointer", background: "transparent", color: "#888888" } as React.CSSProperties,
  inputArea: { flex: 1, overflowY: "auto" as const, padding: "12px 16px" } as React.CSSProperties,
  textarea: { width: "100%", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "12px", color: "#111111", fontSize: "13px", lineHeight: "1.6", resize: "none" as const, outline: "none", fontFamily: "inherit" } as React.CSSProperties,
  input: { width: "100%", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 12px", color: "#111111", fontSize: "13px", outline: "none", fontFamily: "inherit" } as React.CSSProperties,
  label: { fontSize: "11px", color: "#888888", display: "block", marginBottom: "6px" } as React.CSSProperties,
  bottomSection: { padding: "16px", borderTop: "1px solid rgba(0,0,0,0.08)", flexShrink: 0, display: "flex", flexDirection: "column" as const, gap: "12px" } as React.CSSProperties,
  resumeCard: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.09)", background: "#FAF7F1" } as React.CSSProperties,
  btnPrimary: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", background: "#0F6E55", border: "none", borderRadius: "12px", color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(15,110,85,0.25)" } as React.CSSProperties,
  btnPrimaryDisabled: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", background: "rgba(15,110,85,0.15)", border: "none", borderRadius: "12px", color: "rgba(0,0,0,0.3)", fontSize: "14px", fontWeight: 700, cursor: "not-allowed" } as React.CSSProperties,
  rightPanel: { flex: 1, display: "flex", flexDirection: "column" as const, overflow: "hidden" } as React.CSSProperties,
  card: { borderRadius: "16px", padding: "20px", border: "1px solid rgba(0,0,0,0.09)", background: "#FFFFFF" } as React.CSSProperties,
  chip: (color: string) => ({ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", fontWeight: 500, background: `${color}15`, color, border: `1px solid ${color}30` }) as React.CSSProperties,
};

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = SCORE_COLOR(score);
  const r = 38; const circ = 2 * Math.PI * r; const dash = (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div style={{ position: "relative", width: "96px", height: "96px" }}>
        <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 92 92">
          <circle cx="46" cy="46" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8" />
          <motion.circle cx="46" cy="46" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - dash }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color }}>{score}</span>
          <span style={{ fontSize: "10px", color: "#888888" }}>/ 100</span>
        </div>
      </div>
      <span style={{ fontSize: "12px", fontWeight: 600, color: "#888888" }}>{label}</span>
    </div>
  );
}

// Template-aware resume preview — matches the builder templates
function AdaptedResumePreview({ resume, template = "modern" }: { resume: ResumeData; template?: string }) {
  const r = resume;
  const contact = [r.personal.email, r.personal.phone, r.personal.location, r.personal.linkedin?.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")].filter(Boolean);

  const Section = ({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) => (
    <div style={{ marginBottom: "14px" }}>
      <h2 style={{ fontSize: "9px", fontWeight: 800, color: accent, textTransform: "uppercase" as const, letterSpacing: "1.5px", margin: "0 0 4px" }}>{title}</h2>
      <div style={{ borderTop: `1px solid ${accent}33`, marginBottom: "8px" }} />
      {children}
    </div>
  );

  const ExpList = ({ accent }: { accent: string }) => (
    <>
      {r.experience.map((exp, i) => (
        <div key={i} style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div><strong style={{ color: "#111827" }}>{exp.role}</strong><span style={{ color: accent }}> · {exp.company}</span></div>
            <span style={{ color: "#9ca3af", fontSize: "10px", flexShrink: 0 }}>{exp.start}{exp.current ? " – Present" : exp.end ? ` – ${exp.end}` : ""}</span>
          </div>
          <ul style={{ margin: "3px 0 0", paddingLeft: 0, listStyle: "none" }}>
            {exp.bullets.filter(Boolean).map((b, j) => (
              <li key={j} style={{ display: "flex", gap: "6px", color: "#374151", lineHeight: 1.5, marginBottom: "2px", fontSize: "10.5px" }}><span style={{ color: accent, flexShrink: 0 }}>▸</span><span>{b}</span></li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );

  const EduList = () => (
    <>
      {r.education.map((ed, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
          <div><strong>{ed.degree}{ed.field ? ` in ${ed.field}` : ""}</strong> · {ed.institution}</div>
          <span style={{ color: "#9ca3af", fontSize: "10px" }}>{ed.end || ed.start}</span>
        </div>
      ))}
    </>
  );

  if (template === "minimal" || template === "classic") {
    return (
      <div style={{ width: "100%", background: "white", fontFamily: template === "classic" ? "Georgia, serif" : "Arial, sans-serif", fontSize: "11px", padding: "36px 48px", color: "#1f2937" }}>
        <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "1px solid #d1d5db", paddingBottom: "16px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase" as const, letterSpacing: "2px" }}>{r.personal.name}</h1>
          {r.personal.title && <p style={{ margin: "0 0 8px", color: "#6b7280", fontSize: "12px" }}>{r.personal.title}</p>}
          <div style={{ fontSize: "10px", color: "#6b7280" }}>{contact.join(" | ")}</div>
        </div>
        {r.summary && <Section title="Professional Summary" accent="#374151"><p style={{ color: "#374151", lineHeight: 1.6, margin: 0 }}>{r.summary}</p></Section>}
        {r.experience.length > 0 && <Section title="Work Experience" accent="#374151"><ExpList accent="#374151" /></Section>}
        {(r.skills.technical?.length > 0) && <Section title="Skills" accent="#374151"><p style={{ margin: 0, color: "#374151" }}>{[r.skills.technical, r.skills.soft, r.skills.certifications].flat().filter(Boolean).join(" • ")}</p></Section>}
        {r.education.length > 0 && <Section title="Education" accent="#374151"><EduList /></Section>}
      </div>
    );
  }

  if (template === "tech" || template === "bold") {
    const accent = template === "tech" ? "#0ea5e9" : "#ef4444";
    return (
      <div style={{ width: "100%", background: template === "tech" ? "#0f172a" : "white", fontFamily: template === "tech" ? "'Courier New', monospace" : "Inter, sans-serif", fontSize: "11px", color: template === "tech" ? "#e2e8f0" : "#1f2937", display: "flex", minHeight: "1000px" }}>
        <div style={{ width: "200px", flexShrink: 0, background: accent, padding: "28px 16px", color: "white", fontSize: "10px" }}>
          <h1 style={{ fontSize: "15px", fontWeight: 900, margin: "0 0 4px", lineHeight: 1.2 }}>{r.personal.name}</h1>
          {r.personal.title && <p style={{ margin: "0 0 16px", opacity: 0.85, fontSize: "10px" }}>{r.personal.title}</p>}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.3)", paddingTop: "12px", display: "flex", flexDirection: "column" as const, gap: "6px" }}>
            {r.personal.email && <span style={{ wordBreak: "break-all" as const }}>{r.personal.email}</span>}
            {r.personal.phone && <span>{r.personal.phone}</span>}
            {r.personal.location && <span>{r.personal.location}</span>}
          </div>
          {r.skills.technical?.length > 0 && <div style={{ marginTop: "20px" }}><div style={{ fontWeight: 700, marginBottom: "6px", textTransform: "uppercase" as const, fontSize: "9px", letterSpacing: "1px" }}>Skills</div>{[r.skills.technical, r.skills.soft].flat().filter(Boolean).map((s, i) => <div key={i} style={{ marginBottom: "3px", opacity: 0.9 }}>• {s}</div>)}</div>}
        </div>
        <div style={{ flex: 1, padding: "28px 24px", color: template === "tech" ? "#e2e8f0" : "#1f2937" }}>
          {r.summary && <div style={{ marginBottom: "16px" }}><p style={{ lineHeight: 1.6, margin: 0, color: template === "tech" ? "#cbd5e1" : "#374151" }}>{r.summary}</p></div>}
          {r.experience.length > 0 && <Section title="Experience" accent={accent}><ExpList accent={accent} /></Section>}
          {r.education.length > 0 && <Section title="Education" accent={accent}><EduList /></Section>}
        </div>
      </div>
    );
  }

  // Default: modern (violet)
  const accent = "#0F6E55";
  return (
    <div style={{ width: "100%", background: "white", fontFamily: "Inter, sans-serif", fontSize: "11px", padding: "32px 40px" }}>
      <div style={{ borderBottom: `2.5px solid ${accent}`, paddingBottom: "14px", marginBottom: "16px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#111827", margin: "0 0 3px" }}>{r.personal.name || "Your Name"}</h1>
        {r.personal.title && <p style={{ fontSize: "12px", color: accent, fontWeight: 700, margin: "0 0 8px" }}>{r.personal.title}</p>}
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "12px", fontSize: "10px", color: "#6b7280" }}>{contact.map((c, i) => <span key={i}>{c}</span>)}</div>
      </div>
      {r.summary && <Section title="Summary" accent={accent}><p style={{ color: "#374151", lineHeight: 1.6, margin: 0 }}>{r.summary}</p></Section>}
      {r.experience.length > 0 && <Section title="Experience" accent={accent}><ExpList accent={accent} /></Section>}
      {(r.skills.technical?.length > 0) && <Section title="Skills" accent={accent}><p style={{ margin: 0, color: "#374151" }}>{[r.skills.technical, r.skills.soft, r.skills.certifications].flat().filter(Boolean).join(" · ")}</p></Section>}
      {r.education.length > 0 && <Section title="Education" accent={accent}><EduList /></Section>}
    </div>
  );
}

interface AdaptedResumeCard {
  id: string;
  company: string | null;
  role: string | null;
  template: string;
  ats_before: number;
  ats_after: number;
  adapted_json: ResumeData;
  created_at: string;
}

export default function ResumeAdaptorPage() {
  const router = useRouter();
  const { resume, setResume, setAtsScore, selectedTemplate } = useResumeStore();
  const { pendingAction, clearAction } = useAgentStore();
  const { selectedJob, clearSelectedJob } = useJobStore();
  const { user, accessToken } = useUser();
  const limits = getLimits(user?.plan ?? "free");
  const usage = useUsageTracker(user?.id ?? "guest");
  const [showAdaptNudge, setShowAdaptNudge] = useState(false);
  const [showSuccessNudge, setShowSuccessNudge] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [jdText, setJdText] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedHook, setCopiedHook] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("results");
  const [adaptedResume, setAdaptedResume] = useState<ResumeData | null>(null);
  const [suggestedChanges, setSuggestedChanges] = useState<SuggestedChange[]>([]);
  const [selectedChangeIdxs, setSelectedChangeIdxs] = useState<Set<number>>(new Set());
  // Template always preserved from source — no toggle
  const previewTemplate = selectedTemplate || "modern";
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [jobBanner, setJobBanner] = useState<{ title: string; company: string } | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [isSavingAdapted, setIsSavingAdapted] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [savedAdaptedId, setSavedAdaptedId] = useState<string | null>(null);
  const [myAdaptedResumes, setMyAdaptedResumes] = useState<AdaptedResumeCard[]>([]);
  const [showMyAdapted, setShowMyAdapted] = useState(false);
  const [result, setResult] = useState<{
    ats_score_before: number; ats_score_after: number;
    perspective_scores?: { ats: number; hr_screener: number; hiring_manager: number; domain_expert: number; cultural_fit: number };
    missing_keywords: string[]; matched_keywords: string[];
    suggested_changes?: SuggestedChange[];
    changes_made: ({ before: string; after: string } | string)[];
    cover_letter_hook: string; interview_prep_tip: string;
    adapted_resume?: ResumeData;
    style_preserved?: boolean;
  } | null>(null);

  // Auto-populate from Job Finder store
  useEffect(() => {
    if (selectedJob) {
      const jd = [
        `Job Title: ${selectedJob.title}`,
        `Company: ${selectedJob.company}`,
        `Location: ${selectedJob.location}`,
        `Experience Required: ${selectedJob.experience_required}`,
        `Job Type: ${selectedJob.remote} | ${selectedJob.job_type}`,
        `Skills Required: ${selectedJob.skills.join(", ")}`,
        "",
        `Description:`,
        selectedJob.description,
        selectedJob.requirements ? `\nRequirements:\n${selectedJob.requirements}` : "",
      ].filter(Boolean).join("\n");
      setJdText(jd);
      setInputMode("paste");
      setJobBanner({ title: selectedJob.title, company: selectedJob.company });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pendingAction) return;
    if (pendingAction.type === "adapt_resume" && pendingAction.jd) {
      setJdText(pendingAction.jd); setInputMode("paste"); clearAction();
    } else if (pendingAction.type === "fill_jd") {
      setJdText(pendingAction.jd); setInputMode("paste"); clearAction();
    } else if (pendingAction.type === "fill_company_role") {
      setCompanyName(pendingAction.company); setRoleName(pendingAction.role); setInputMode("company"); clearAction();
    } else if (pendingAction.type === "trigger_adapt") {
      clearAction();
      analyze();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction]);

  const fetchJD = async () => {
    if (!jobUrl.trim()) return;
    setIsFetching(true); setFetchError("");
    try {
      const { data } = await api.post("/resume/fetch-jd", { url: jobUrl.trim() });
      if (data.text) { setJdText(data.text); setInputMode("paste"); }
      else setFetchError("No text content found at this URL.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setFetchError(msg || "Failed to fetch job description.");
    } finally { setIsFetching(false); }
  };

  const jdForRequest = () =>
    inputMode === "paste" ? jdText
    : inputMode === "url" ? `Job URL: ${jobUrl}`
    : `Company: ${companyName}, Role: ${roleName}${additionalContext ? `, Context: ${additionalContext}` : ""}`;

  // ATS Score check — always free/unlimited, uses the cheap scoring endpoint
  const checkScore = async () => {
    const jd = jdForRequest();
    if (!jd.trim()) return;
    setIsAnalyzing(true); setResult(null); setLoadingStep("Scoring your resume...");
    try {
      const { data } = await api.post("/resume/score", { resume });
      // Show score-only result (no adapted resume, no rewrite)
      setResult({
        ats_score_before: data.overall_score ?? 0,
        ats_score_after: data.overall_score ?? 0,
        missing_keywords: data.missing_keywords ?? [],
        matched_keywords: data.matched_keywords ?? [],
        suggested_changes: [],
        changes_made: [],
        cover_letter_hook: "",
        interview_prep_tip: data.improvement_tips?.join(" ") ?? "",
        adapted_resume: undefined,
        style_preserved: true,
      });
      setRightTab("results");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Score check failed.";
      setLoadingStep(msg);
    } finally { setIsAnalyzing(false); setLoadingStep(""); }
  };

  // Full adaptation — gated at 3/month for free users
  const analyze = async () => {
    const jd = jdForRequest();
    // Company mode needs a company or role; other modes need JD text.
    if (inputMode === "company") {
      if (!companyName.trim() && !roleName.trim()) { setLoadingStep("Enter a company and/or role first."); return; }
    } else if (!jd.trim()) {
      return;
    }

    // Gate: check cap before calling API (but only increment on success)
    if (limits.resumeAdaptations !== -1) {
      const currentCount = usage.adaptationsUsed;
      if (currentCount >= limits.resumeAdaptations) {
        setResult({
          ats_score_before: 0, ats_score_after: 0,
          missing_keywords: [], matched_keywords: [],
          suggested_changes: [], changes_made: [],
          cover_letter_hook: "",
          interview_prep_tip: `__UPGRADE_WALL__You've used all ${limits.resumeAdaptations} free adaptations this month. Upgrade to Pro for unlimited rewrites. Your ATS Score check above is still free and unlimited.`,
          adapted_resume: undefined, style_preserved: true,
        });
        setRightTab("results");
        return;
      }
    }

    // Validate resume has content
    const hasResume = resume && (resume.personal?.name || (resume.experience?.length ?? 0) > 0 || resume.summary);
    if (!hasResume) {
      setResult({
        ats_score_before: 0, ats_score_after: 0,
        missing_keywords: [], matched_keywords: [],
        suggested_changes: [], changes_made: [],
        cover_letter_hook: "",
        interview_prep_tip: "No resume loaded. Please build or upload your resume in the Resume Builder first, then come back to adapt it.",
        adapted_resume: undefined, style_preserved: true,
      });
      setRightTab("results");
      return;
    }

    setIsAnalyzing(true); setResult(null); setAdaptedResume(null); setSuggestedChanges([]); setSelectedChangeIdxs(new Set());
    // In Company+Role mode send an EMPTY jd_text so the backend generates a full
    // job description from the company + role. Sending the synthesized
    // "Company: X, Role: Y" string here would make the backend adapt against those
    // few words instead of a real JD.
    const requestBody: Record<string, unknown> = {
      resume,
      jd_text: inputMode === "company" ? "" : jd,
    };
    if (inputMode === "company" && (companyName.trim() || roleName.trim())) {
      requestBody.company_name = companyName.trim();
      requestBody.role_name = roleName.trim();
      setLoadingStep(`Researching ${companyName.trim() || roleName.trim()} hiring patterns...`);
      await new Promise((r) => setTimeout(r, 800));
    }
    setLoadingStep("Adapting your resume — this takes ~30s...");

    try {
      const { data } = await api.post("/resume/adapt", requestBody);
      // Only count a successful adaptation
      if (limits.resumeAdaptations !== -1) {
        const newCount = usage.incrementAdaptations();
        if (newCount >= limits.resumeAdaptations - 1) setShowAdaptNudge(true);
      }
      setResult(data);
      if (data.suggested_changes && Array.isArray(data.suggested_changes)) {
        const changes = data.suggested_changes as SuggestedChange[];
        setSuggestedChanges(changes);
        setSelectedChangeIdxs(new Set(changes.map((_: SuggestedChange, i: number) => i)));
        setRightTab("changes");
      } else if (data.adapted_resume) {
        setAdaptedResume(data.adapted_resume as ResumeData);
        setRightTab("results");
      }
      if ((data.ats_score_after ?? 0) >= 70) {
        setShowSuccessNudge(true);
        setTimeout(() => setShowSuccessNudge(false), 8000);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        || (err as Error)?.message || "Failed to adapt resume. Please try again.";
      setResult({
        ats_score_before: 0, ats_score_after: 0,
        missing_keywords: [], matched_keywords: [],
        suggested_changes: [], changes_made: [],
        cover_letter_hook: "",
        interview_prep_tip: msg,
        adapted_resume: resume, style_preserved: true,
      });
      setRightTab("results");
    } finally { setIsAnalyzing(false); setLoadingStep(""); }
  };

  const applySelectedChanges = () => {
    if (!result?.adapted_resume) return;
    setAdaptedResume({ ...result.adapted_resume });
    if (result) setAtsScore(result.ats_score_after);
    setRightTab("results");
  };

  const saveAdaptedResume = async () => {
    if (!adaptedResume || !accessToken) return;
    setIsSavingAdapted(true);
    try {
      const { data } = await api.post(
        "/user/adapted-resumes",
        {
          jd_text: jdText.slice(0, 2000),
          company: companyName || jobBanner?.company || null,
          role: roleName || jobBanner?.title || null,
          adapted_json: adaptedResume,
          template: previewTemplate,
          ats_before: result?.ats_score_before || 0,
          ats_after: result?.ats_score_after || 0,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSavedAdaptedId(data.id);
      setTimeout(() => setSavedAdaptedId(null), 3000);
    } catch (err) {
      console.error("Failed to save adapted resume:", err);
    } finally {
      setIsSavingAdapted(false);
    }
  };

  const loadMyAdaptedResumes = async () => {
    if (!accessToken) return;
    try {
      const { data } = await api.get("/user/adapted-resumes", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setMyAdaptedResumes(data || []);
      setShowMyAdapted(true);
    } catch (err) {
      console.error("Failed to load adapted resumes:", err);
    }
  };

  const toggleChange = (idx: number) => {
    setSelectedChangeIdxs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const loadInBuilder = () => {
    if (!adaptedResume) return;
    setResume(adaptedResume);
    if (result) setAtsScore(result.ats_score_after);
    router.push("/resume-builder");
  };

  const downloadTXT = () => {
    const r = adaptedResume || resume;
    const lines = [
      r.personal.name, r.personal.title, "",
      [r.personal.email, r.personal.phone, r.personal.location, r.personal.linkedin].filter(Boolean).join(" | "), "",
      "PROFESSIONAL SUMMARY", r.summary, "",
      "WORK EXPERIENCE",
      ...r.experience.flatMap((e) => [`${e.role} — ${e.company} (${e.start}–${e.current ? "Present" : e.end})`, ...e.bullets.map((b) => `  • ${b}`), ""]),
      "SKILLS", r.skills.technical.join(", "), "",
      "EDUCATION",
      ...r.education.map((e) => `${e.degree}${e.field ? " in " + e.field : ""} — ${e.institution} (${e.end || e.start})`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${r.personal.name || "adapted"}_resume.txt`;
    a.click();
  };

  const downloadPDF = async () => {
    const previewEl = document.getElementById("adapted-resume-preview");
    if (!previewEl) { setRightTab("preview"); setTimeout(downloadPDF, 400); return; }
    const name = (adaptedResume || resume).personal.name || "adapted_resume";
    setIsPdfLoading(true);
    try {
      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  @page { margin: 0; size: A4 portrait; }
  html, body { margin: 0; padding: 0; }
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, 'Segoe UI', Arial, sans-serif; }
</style>
</head>
<body>${previewEl.outerHTML}</body>
</html>`;
      const res = await fetch(`${API_BASE}/resume/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ html, name }),
      });
      if (!res.ok) throw new Error("PDF generation failed on server");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}_resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("PDF export failed. Please try again.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  const tabs = [
    { id: "paste" as InputMode, Icon: FileText, label: "Paste JD" },
    { id: "url" as InputMode, Icon: Link2, label: "Job URL" },
    { id: "company" as InputMode, Icon: Building2, label: "Company + Role" },
  ];

  return (
    <div className="ra-page-layout" style={S.page}>
      {/* LEFT PANEL */}
      <div className="ra-left-panel" style={S.leftPanel}>
        <div style={S.leftHeader}>
          <h3 style={S.h3}>Job Details</h3>
          <div style={{ width: "32px", height: "2px", background: "linear-gradient(90deg,#0F6E55,transparent)", borderRadius: "2px" }} />
        </div>

        {/* Job loaded banner */}
        {jobBanner && (
          <div style={{ margin: "0 16px 0", padding: "10px 12px", borderRadius: "10px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <Briefcase style={{ width: "14px", height: "14px", color: "#10b981", flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: "12px", color: "#10b981", fontWeight: 600 }}>
              Job loaded: {jobBanner.title} at {jobBanner.company}
            </span>
            <button onClick={() => { setJobBanner(null); clearSelectedJob(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#10b981", padding: "2px", display: "flex" }}>
              <X style={{ width: "12px", height: "12px" }} />
            </button>
          </div>
        )}

        <div style={S.tabRow}>
          {tabs.map(({ id, Icon, label }) => (
            <button key={id} onClick={() => setInputMode(id)} style={inputMode === id ? S.tabActive : S.tabInactive}>
              <Icon style={{ width: "14px", height: "14px" }} />{label}
            </button>
          ))}
        </div>
        <div style={S.inputArea}>
          {inputMode === "paste" && (
            <textarea rows={10} value={jdText} onChange={(e) => setJdText(e.target.value)} style={S.textarea}
              placeholder={`Paste the full job description here...\n\nWe're looking for a Senior Software Engineer...\n• 5+ years of backend experience\n• Proficiency in Go, Python, or Java...`} />
          )}
          {inputMode === "url" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchJD()}
                  style={{ ...S.input, flex: 1 }} placeholder="https://linkedin.com/jobs/view/..." />
                <button onClick={fetchJD} disabled={isFetching || !jobUrl.trim()} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, border: "1px solid rgba(15,110,85,0.4)", background: isFetching ? "rgba(15,110,85,0.1)" : "#0F6E55", color: isFetching ? "rgba(15,110,85,0.5)" : "white", cursor: isFetching || !jobUrl.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {isFetching ? <motion.div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} /> : <Link2 style={{ width: "14px", height: "14px" }} />}
                  {isFetching ? "Fetching..." : "Fetch"}
                </button>
              </div>
              {fetchError && <div style={{ fontSize: "12px", color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "8px 12px" }}>{fetchError}</div>}
              {jdText && <div style={{ fontSize: "12px", color: "#10b981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", padding: "8px 12px" }}>JD fetched! Switch to &quot;Paste JD&quot; to review.</div>}
            </div>
          )}
          {inputMode === "company" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div><label style={S.label}>Company Name</label><input value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={S.input} placeholder="Google, Microsoft, Flipkart..." /></div>
              <div><label style={S.label}>Role / Job Title</label><input value={roleName} onChange={(e) => setRoleName(e.target.value)} style={S.input} placeholder="Senior Software Engineer, PM..." /></div>
              <div><label style={S.label}>Additional context (optional)</label><textarea rows={4} value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} style={S.textarea} placeholder="Team, location, specific requirements..." /></div>
            </div>
          )}
        </div>

        <div style={{ height: "1px", background: "rgba(15,110,85,0.1)", margin: "0 16px" }} />
        <div style={S.bottomSection}>
          <div>
            <p style={{ fontSize: "11px", color: "#888888", marginBottom: "8px", fontWeight: 600 }}>YOUR RESUME</p>
            <div style={S.resumeCard}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(15,110,85,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText style={{ width: "16px", height: "16px", color: "#0F6E55" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{resume.personal.name || "No resume loaded"}</div>
                <div style={{ fontSize: "12px", color: "#888888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{resume.personal.title || "Build or upload a resume first"}</div>
              </div>
              <button onClick={() => setUploadOpen(true)} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#0F6E55", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "6px", flexShrink: 0 }}>
                <Upload style={{ width: "12px", height: "12px" }} />Change
              </button>
            </div>
          </div>
          {/* Template chip — always uses source template */}
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#888888" }}>Template</span>
              <button
                onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(15,110,85,0.3)", background: "rgba(15,110,85,0.1)", color: "#0F6E55", cursor: "pointer" }}
              >
                {(previewTemplate.charAt(0).toUpperCase() + previewTemplate.slice(1))}
                <ChevronDown style={{ width: "12px", height: "12px" }} />
              </button>
            </div>
            {showTemplateDropdown && (
              <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 0, background: "rgba(20,10,40,0.98)", border: "1px solid rgba(15,110,85,0.3)", borderRadius: "10px", overflow: "hidden", zIndex: 10, minWidth: "140px" }}>
                {["modern", "classic", "minimal", "bold", "tech"].map((t) => (
                  <button
                    key={t}
                    onClick={() => { useResumeStore.getState().setTemplate(t); setShowTemplateDropdown(false); }}
                    style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: "12px", background: previewTemplate === t ? "rgba(15,110,85,0.2)" : "transparent", color: previewTemplate === t ? "#5FAE93" : "#94a3b8", border: "none", cursor: "pointer" }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Two-button layout: ATS Score (always free) + Adapt (gated) */}
          <div style={{ display: "flex", gap: "10px" }}>
            {/* ATS Score — always free, unlimited */}
            <button
              onClick={checkScore}
              disabled={isAnalyzing}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px 16px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: "10px", color: "#10b981", fontSize: "13px", fontWeight: 700, cursor: isAnalyzing ? "not-allowed" : "pointer", opacity: isAnalyzing ? 0.6 : 1 }}>
              <TrendingUp style={{ width: "15px", height: "15px" }} />
              Check ATS Score
              <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "10px", background: "rgba(16,185,129,0.2)", fontWeight: 800 }}>FREE</span>
            </button>

            {/* Adapt — gated at 3/month for free */}
            {(() => {
              const adaptCap = limits.resumeAdaptations;
              const adaptUsed = usage.adaptationsUsed;
              const adaptLocked = adaptCap !== -1 && adaptUsed >= adaptCap;
              return adaptLocked ? (
                <button
                  onClick={() => window.location.href = "/pricing"}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px 16px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: "10px", color: "#f59e0b", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                  🔒 Adapt Resume — Upgrade to Pro
                </button>
              ) : (
                <button
                  onClick={analyze}
                  disabled={isAnalyzing}
                  style={isAnalyzing ? { ...S.btnPrimaryDisabled, flex: 1 } : { ...S.btnPrimary, flex: 1 }}>
                  {isAnalyzing ? (
                    <><motion.div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />{loadingStep || "Adapting..."}</>
                  ) : (
                    <><Wand2 style={{ width: "16px", height: "16px" }} />
                      Adapt My Resume <CoinCost n={25} onDark />
                      {adaptCap !== -1 && <span style={{ fontSize: "10px", opacity: 0.7, marginLeft: "4px" }}>({adaptCap - adaptUsed} left)</span>}
                    </>
                  )}
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="ra-right-panel" style={S.rightPanel}>
        {/* Upgrade nudges */}
        {limits.resumeAdaptations !== -1 && showAdaptNudge && (
          <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(15,110,85,0.08)" }}>
            <UsageProgressNudge
              used={usage.adaptationsUsed}
              total={limits.resumeAdaptations}
              noun="adaptations"
              period="this month"
              onDismiss={() => setShowAdaptNudge(false)}
            />
          </div>
        )}
        {/* Right panel tabs — only show when result exists */}
        {result && (
          <div style={{ display: "flex", gap: "0", borderBottom: "1px solid rgba(0,0,0,0.08)", flexShrink: 0 }}>
            {[
              { id: "changes" as RightTab, icon: <Sparkles style={{ width: "13px", height: "13px" }} />, label: `Proposed Changes${suggestedChanges.length ? ` (${suggestedChanges.length})` : ""}` },
              { id: "results" as RightTab, icon: <TrendingUp style={{ width: "13px", height: "13px" }} />, label: "Results & Score" },
              { id: "preview" as RightTab, icon: <Eye style={{ width: "13px", height: "13px" }} />, label: "Preview" },
            ].map((t) => (
              <button key={t.id} onClick={() => setRightTab(t.id)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px 16px", fontSize: "13px", fontWeight: 600, border: "none", borderBottom: `2px solid ${rightTab === t.id ? "#0F6E55" : "transparent"}`, background: "transparent", color: rightTab === t.id ? "#5FAE93" : "#475569", cursor: "pointer" }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto" }}>
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
                <div style={{ textAlign: "center", maxWidth: "280px" }}>
                  <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "rgba(15,110,85,0.1)", border: "1px solid rgba(15,110,85,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <Target style={{ width: "40px", height: "40px", color: "#0F6E55" }} />
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111111", marginBottom: "8px" }}>Speak their language</h3>
                  <p style={{ fontSize: "13px", color: "#888888", lineHeight: "1.6" }}>A single role, seen through a thousand lenses — yours, theirs, and the one that matters most. Add a job description to begin.</p>
                </div>
              </motion.div>
            ) : rightTab === "changes" ? (
              <motion.div key="changes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ ...S.card }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#111111", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Sparkles style={{ width: "16px", height: "16px", color: "#0F6E55" }} />
                      Proposed Changes
                    </h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => setSelectedChangeIdxs(new Set(suggestedChanges.map((_, i) => i)))} style={{ fontSize: "11px", color: "#0F6E55", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Select all</button>
                      <button onClick={() => setSelectedChangeIdxs(new Set())} style={{ fontSize: "11px", color: "#888888", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Deselect all</button>
                    </div>
                  </div>
                  <p style={{ fontSize: "12px", color: "#888888", marginBottom: "16px" }}>
                    Review and select which changes to apply. Uncheck any you want to keep as-is.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {suggestedChanges.map((c, i) => (
                      <div key={i} style={{ borderRadius: "10px", padding: "12px", background: selectedChangeIdxs.has(i) ? "rgba(15,110,85,0.06)" : "rgba(0,0,0,0.02)", border: `1px solid ${selectedChangeIdxs.has(i) ? "rgba(15,110,85,0.25)" : "rgba(0,0,0,0.07)"}`, transition: "all 0.15s" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          <input
                            type="checkbox"
                            checked={selectedChangeIdxs.has(i)}
                            onChange={() => toggleChange(i)}
                            style={{ marginTop: "2px", accentColor: "#0F6E55", width: "14px", height: "14px", flexShrink: 0, cursor: "pointer" }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", flexWrap: "wrap" as const }}>
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "#0F6E55", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{c.section}</span>
                              {c.lens && (() => {
                                const lc = LENS_COLORS[c.lens] || { bg: "rgba(100,116,139,0.15)", color: "#888888", border: "rgba(100,116,139,0.3)" };
                                return <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "20px", background: lc.bg, color: lc.color, border: `1px solid ${lc.border}` }}>{c.lens}</span>;
                              })()}
                            </div>
                            <div style={{ display: "flex", gap: "6px", fontSize: "12px", color: "#888888", marginBottom: "4px" }}>
                              <span style={{ flexShrink: 0, color: "rgba(239,68,68,0.8)", fontWeight: 600 }}>Before:</span>
                              <span style={{ wordBreak: "break-word" }}>{c.original && c.original.length > 120 ? c.original.slice(0, 120) + "..." : c.original}</span>
                            </div>
                            <div style={{ display: "flex", gap: "6px", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" }}>
                              <span style={{ flexShrink: 0, color: "#34d399", fontWeight: 600 }}>After:</span>
                              <span style={{ wordBreak: "break-word" }}>{c.suggested}</span>
                            </div>
                            <div style={{ fontSize: "11px", color: "#888888", fontStyle: "italic" }}>{c.reason}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={applySelectedChanges}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "13px", background: "linear-gradient(135deg,#0F6E55,#0A523F)", border: "none", borderRadius: "12px", color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(15,110,85,0.3)" }}
                >
                  <Check style={{ width: "16px", height: "16px" }} />
                  Apply {selectedChangeIdxs.size} of {suggestedChanges.length} Changes
                </button>
              </motion.div>
            ) : rightTab === "results" ? (
              <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Score rings */}
                <div style={S.card}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                    <TrendingUp style={{ width: "16px", height: "16px", color: "#0F6E55" }} />
                    <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#111111" }}>ATS Score Improvement</h3>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
                    <ScoreRing score={result.ats_score_before} label="Before" />
                    <div style={{ textAlign: "center" }}>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring" }}
                        style={{ fontSize: "32px", fontWeight: 900, background: "linear-gradient(135deg,#5FAE93,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        +{result.ats_score_after - result.ats_score_before}
                      </motion.div>
                      <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>points</div>
                    </div>
                    <ScoreRing score={result.ats_score_after} label="After" />
                  </div>
                </div>

                {/* Perspective scores */}
                {result.perspective_scores && (
                  <div style={S.card}>
                    <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "14px" }}>5-Perspective Analysis</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {(
                        [
                          { key: "ats", label: "ATS Algorithm", ...LENS_COLORS["ATS"] },
                          { key: "hr_screener", label: "HR Screener", ...LENS_COLORS["HR Screener"] },
                          { key: "hiring_manager", label: "Hiring Manager", ...LENS_COLORS["Hiring Manager"] },
                          { key: "domain_expert", label: "Domain Expert", ...LENS_COLORS["Domain Expert"] },
                          { key: "cultural_fit", label: "Cultural Fit", ...LENS_COLORS["Cultural Fit"] },
                        ] as { key: keyof NonNullable<typeof result.perspective_scores>; label: string; bg: string; color: string; border: string }[]
                      ).map(({ key, label, color }) => {
                        const score = result.perspective_scores![key];
                        return (
                          <div key={key}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "#888888" }}>{label}</span>
                              <span style={{ fontSize: "11px", fontWeight: 700, color }}>{score}</span>
                            </div>
                            <div style={{ height: "6px", borderRadius: "4px", background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                                style={{ height: "100%", borderRadius: "4px", background: color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Keywords */}
                <div style={S.card}>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "16px" }}>Keyword Analysis</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#34d399", marginBottom: "8px", fontWeight: 600 }}>
                        <Check style={{ width: "14px", height: "14px" }} />Matched ({result.matched_keywords.length})
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>{result.matched_keywords.map((k) => <span key={k} style={S.chip("#10b981")}>{k}</span>)}</div>
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#fbbf24", marginBottom: "8px", fontWeight: 600 }}>
                        <AlertCircle style={{ width: "14px", height: "14px" }} />Missing ({result.missing_keywords.length})
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>{result.missing_keywords.map((k) => <span key={k} style={S.chip("#f59e0b")}>{k}</span>)}</div>
                    </div>
                  </div>
                </div>

                {/* Changes */}
                <div style={S.card}>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sparkles style={{ width: "16px", height: "16px", color: "#0F6E55" }} />Changes Made
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {result.changes_made.map((c, i) => {
                      const change = typeof c === "string" ? { before: null, after: c } : c;
                      return (
                        <div key={i} style={{ borderRadius: "10px", padding: "12px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: "6px" }}>
                          {change.before && <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: "#888888" }}><span style={{ flexShrink: 0, color: "rgba(239,68,68,0.7)", fontWeight: 600 }}>Before:</span><span>{change.before}</span></div>}
                          <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: "#cbd5e1" }}>
                            {change.before ? <span style={{ flexShrink: 0, color: "#34d399", fontWeight: 600 }}>After:</span> : <ChevronRight style={{ width: "14px", height: "14px", color: "#0F6E55", flexShrink: 0, marginTop: "1px" }} />}
                            <span>{change.after}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cover letter hook */}
                <div style={{ ...S.card, background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.2)", borderLeft: "3px solid #f59e0b" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <BookOpen style={{ width: "16px", height: "16px" }} />Cover Letter Hook
                  </h3>
                  <p style={{ fontSize: "13px", color: "#cbd5e1", fontStyle: "italic", lineHeight: "1.6" }}>&ldquo;{result.cover_letter_hook}&rdquo;</p>
                  <button onClick={() => { navigator.clipboard.writeText(result.cover_letter_hook); setCopiedHook(true); setTimeout(() => setCopiedHook(false), 2000); }}
                    style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, background: "none", border: "none", cursor: "pointer", color: copiedHook ? "#10b981" : "#f59e0b" }}>
                    {copiedHook ? <><Check style={{ width: "12px", height: "12px" }} />Copied!</> : <><Copy style={{ width: "12px", height: "12px" }} />Copy Hook</>}
                  </button>
                </div>

                {/* Interview tip / upgrade wall */}
                {result.interview_prep_tip.startsWith("__UPGRADE_WALL__") ? (
                  <div style={{ textAlign: "center", padding: "24px 16px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "16px" }}>
                    <div style={{ fontSize: "28px", marginBottom: "10px" }}>🔒</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#111111", marginBottom: "8px" }}>Monthly adaptation limit reached</div>
                    <div style={{ fontSize: "13px", color: "#888888", marginBottom: "16px", lineHeight: 1.6 }}>
                      {result.interview_prep_tip.replace("__UPGRADE_WALL__", "")}
                    </div>
                    <button onClick={() => window.location.href = "/pricing"}
                      style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 28px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: "10px", color: "#0a0614", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                      Upgrade to Pro — Unlimited Adaptations →
                    </button>
                  </div>
                ) : (
                  <div style={{ ...S.card, background: "rgba(15,110,85,0.05)", borderColor: "rgba(15,110,85,0.2)", borderLeft: "3px solid #0F6E55" }}>
                    <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#0F6E55", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Target style={{ width: "16px", height: "16px" }} />Interview Prep Tip
                    </h3>
                    <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: "1.6" }}>{result.interview_prep_tip}</p>
                  </div>
                )}

                {/* Upgrade nudge — free users only, after seeing their result */}
                {limits.resumeAdaptations !== -1 && result.ats_score_after > 0 && (
                  <div>
                    {usage.adaptationsUsed >= limits.resumeAdaptations ? (
                      <UsageProgressNudge
                        used={usage.adaptationsUsed}
                        total={limits.resumeAdaptations}
                        noun="adaptations"
                        period="this month"
                      />
                    ) : result.ats_score_after >= 70 ? (
                      <CelebrationNudge
                        emoji="🎯"
                        headline={`ATS score ${result.ats_score_after} — great result!`}
                        subtext="Get unlimited adaptations + all 6 templates + Interview Prep with Pro plan."
                        ctaLabel="Upgrade to Pro"
                        accentColor="#0F6E55"
                        onDismiss={() => setShowSuccessNudge(false)}
                      />
                    ) : (
                      <TeaserNudge plan="pro" compact features={[
                        "Unlimited adaptations", "All templates", "Interview Prep"
                      ]} />
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "10px", paddingBottom: "8px", flexWrap: "wrap" as const }}>
                  <button onClick={() => setRightTab("preview")}
                    style={{ flex: 1, minWidth: "140px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", background: "rgba(15,110,85,0.07)", border: "1px solid rgba(15,110,85,0.25)", borderRadius: "12px", color: "#0F6E55", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                    <Eye style={{ width: "15px", height: "15px" }} />View Resume
                  </button>
                  <button onClick={loadInBuilder}
                    style={{ flex: 1, minWidth: "140px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", background: "linear-gradient(135deg,#0F6E55,#0A523F)", border: "none", borderRadius: "12px", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(15,110,85,0.3)" }}>
                    <Edit3 style={{ width: "15px", height: "15px" }} />Edit in Builder
                  </button>
                  <button onClick={downloadPDF} disabled={isPdfLoading}
                    style={{ flex: 1, minWidth: "140px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: "12px", color: "#0f0a1e", fontSize: "13px", fontWeight: 700, cursor: isPdfLoading ? "not-allowed" : "pointer", opacity: isPdfLoading ? 0.7 : 1 }}>
                    <Download style={{ width: "15px", height: "15px" }} />{isPdfLoading ? "Generating…" : "Export PDF"}
                  </button>
                  <button onClick={downloadTXT}
                    style={{ flex: 1, minWidth: "140px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "12px", color: "#555555", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                    <Download style={{ width: "15px", height: "15px" }} />TXT
                  </button>
                  {user && adaptedResume && (
                    <button onClick={saveAdaptedResume} disabled={isSavingAdapted}
                      style={{ flex: 1, minWidth: "140px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", background: savedAdaptedId ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.1)", border: `1px solid ${savedAdaptedId ? "rgba(16,185,129,0.5)" : "rgba(16,185,129,0.3)"}`, borderRadius: "12px", color: savedAdaptedId ? "#34d399" : "#10b981", fontSize: "13px", fontWeight: 600, cursor: isSavingAdapted ? "not-allowed" : "pointer" }}>
                      {isSavingAdapted ? <><Cloud style={{ width: "15px", height: "15px" }} />Saving...</> : savedAdaptedId ? <><Check style={{ width: "15px", height: "15px" }} />Saved!</> : <><Save style={{ width: "15px", height: "15px" }} />Save to Account</>}
                    </button>
                  )}
                </div>

                {/* My Adapted Resumes panel */}
                {user && (
                  <div style={{ ...S.card }}>
                    <button onClick={loadMyAdaptedResumes}
                      style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: showMyAdapted ? "12px" : 0 }}>
                      <Cloud style={{ width: "14px", height: "14px", color: "#0F6E55" }} />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#111111", flex: 1, textAlign: "left" }}>My Adapted Resumes</span>
                      <ChevronDown style={{ width: "14px", height: "14px", color: "#888888", transform: showMyAdapted ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                    </button>
                    {showMyAdapted && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {myAdaptedResumes.length === 0 ? (
                          <p style={{ fontSize: "12px", color: "#888888" }}>No saved adaptations yet.</p>
                        ) : myAdaptedResumes.map((ar) => (
                          <div key={ar.id}
                            onClick={() => {
                              setAdaptedResume(ar.adapted_json);
                              if (ar.template) useResumeStore.getState().setTemplate(ar.template);
                              setRightTab("preview");
                            }}
                            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", background: "rgba(15,110,85,0.06)", border: "1px solid rgba(15,110,85,0.15)", cursor: "pointer" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "13px", fontWeight: 600, color: "#111111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {ar.role || "Resume"}{ar.company ? ` @ ${ar.company}` : ""}
                              </div>
                              <div style={{ fontSize: "11px", color: "#888888" }}>
                                {ar.template && <span style={{ textTransform: "capitalize" }}>{ar.template} · </span>}
                                ATS {ar.ats_before}% → {ar.ats_after}% · {new Date(ar.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: ar.ats_after >= 80 ? "#10b981" : ar.ats_after >= 60 ? "#f59e0b" : "#ef4444" }}>
                              {ar.ats_after}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              /* PREVIEW TAB — adapted resume rendered live */
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div style={{ fontSize: "13px", color: "#888888", flex: 1 }}>ATS-adapted resume — ready to download or edit</div>
                  <button onClick={downloadPDF} disabled={isPdfLoading} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: "8px", color: "#0f0a1e", fontSize: "12px", fontWeight: 700, cursor: isPdfLoading ? "not-allowed" : "pointer", opacity: isPdfLoading ? 0.7 : 1 }}>
                    <Download style={{ width: "13px", height: "13px" }} />{isPdfLoading ? "Generating…" : "Export PDF"}
                  </button>
                  <button onClick={loadInBuilder} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "rgba(15,110,85,0.2)", border: "1px solid rgba(15,110,85,0.4)", borderRadius: "8px", color: "#0F6E55", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    <Edit3 style={{ width: "13px", height: "13px" }} />Edit in Builder
                  </button>
                </div>
                <div id="adapted-resume-preview" style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                  <AdaptedResumePreview resume={adaptedResume || resume} template={previewTemplate} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <FileUploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)}
        onResumeParsed={(parsed: ResumeData) => { setResume(parsed); setUploadOpen(false); }} />
    </div>
  );
}

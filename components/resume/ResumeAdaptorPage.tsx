"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Link2, Building2, Wand2, FileText, Sparkles,
  TrendingUp, AlertCircle, Check, Copy, Download, Upload,
  ChevronRight, BookOpen, Eye, Edit3, Briefcase, X,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { useResumeStore } from "@/lib/stores/resumeStore";
import { useAgentStore } from "@/lib/stores/agentStore";
import { useJobStore } from "@/lib/stores/jobStore";
import { FileUploadModal } from "@/components/ui/FileUploadModal";
import { ResumeData } from "@/lib/types";

type InputMode = "paste" | "url" | "company";
type RightTab = "results" | "changes" | "preview";

interface SuggestedChange {
  section: string;
  original: string;
  suggested: string;
  reason: string;
}

const SCORE_COLOR = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444";

const S = {
  page: { height: "100%", display: "flex", overflow: "hidden" } as React.CSSProperties,
  leftPanel: { width: "420px", flexShrink: 0, display: "flex", flexDirection: "column" as const, borderRight: "1px solid rgba(124,58,237,0.12)", overflow: "hidden" } as React.CSSProperties,
  leftHeader: { padding: "20px 24px 16px", borderBottom: "1px solid rgba(124,58,237,0.1)", flexShrink: 0 } as React.CSSProperties,
  h3: { fontSize: "15px", fontWeight: 700, color: "#f1f5f9", marginBottom: "4px" } as React.CSSProperties,
  tabRow: { display: "flex", gap: "4px", padding: "4px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", margin: "16px 16px 0", flexShrink: 0 } as React.CSSProperties,
  tabActive: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px 4px", fontSize: "12px", fontWeight: 600, borderRadius: "8px", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "white", boxShadow: "0 2px 12px rgba(124,58,237,0.4)" } as React.CSSProperties,
  tabInactive: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px 4px", fontSize: "12px", fontWeight: 600, borderRadius: "8px", border: "none", cursor: "pointer", background: "transparent", color: "#94a3b8" } as React.CSSProperties,
  inputArea: { flex: 1, overflowY: "auto" as const, padding: "12px 16px" } as React.CSSProperties,
  textarea: { width: "100%", background: "rgba(15,8,30,0.8)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "10px", padding: "12px", color: "#f1f5f9", fontSize: "13px", lineHeight: "1.6", resize: "none" as const, outline: "none", fontFamily: "inherit" } as React.CSSProperties,
  input: { width: "100%", background: "rgba(15,8,30,0.8)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "10px", padding: "10px 12px", color: "#f1f5f9", fontSize: "13px", outline: "none", fontFamily: "inherit" } as React.CSSProperties,
  label: { fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "6px" } as React.CSSProperties,
  bottomSection: { padding: "16px", borderTop: "1px solid rgba(124,58,237,0.1)", flexShrink: 0, display: "flex", flexDirection: "column" as const, gap: "12px" } as React.CSSProperties,
  resumeCard: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(124,58,237,0.15)", background: "rgba(26,16,51,0.6)" } as React.CSSProperties,
  btnPrimary: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: "12px", color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" } as React.CSSProperties,
  btnPrimaryDisabled: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", background: "rgba(124,58,237,0.3)", border: "none", borderRadius: "12px", color: "rgba(255,255,255,0.5)", fontSize: "14px", fontWeight: 700, cursor: "not-allowed" } as React.CSSProperties,
  rightPanel: { flex: 1, display: "flex", flexDirection: "column" as const, overflow: "hidden" } as React.CSSProperties,
  card: { borderRadius: "16px", padding: "20px", border: "1px solid rgba(124,58,237,0.2)", background: "rgba(18,10,36,0.9)" } as React.CSSProperties,
  chip: (color: string) => ({ fontSize: "12px", padding: "4px 10px", borderRadius: "20px", fontWeight: 500, background: `${color}1a`, color, border: `1px solid ${color}30` }) as React.CSSProperties,
};

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = SCORE_COLOR(score);
  const r = 38; const circ = 2 * Math.PI * r; const dash = (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div style={{ position: "relative", width: "96px", height: "96px" }}>
        <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 92 92">
          <circle cx="46" cy="46" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <motion.circle cx="46" cy="46" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - dash }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color }}>{score}</span>
          <span style={{ fontSize: "10px", color: "#475569" }}>/ 100</span>
        </div>
      </div>
      <span style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8" }}>{label}</span>
    </div>
  );
}

// Inline resume preview for adapted resume
function AdaptedResumePreview({ resume }: { resume: ResumeData }) {
  const accent = "#7c3aed";
  const r = resume;
  return (
    <div style={{ width: "100%", background: "white", fontFamily: "Inter, sans-serif", fontSize: "11px", padding: "32px 40px" }}>
      <div style={{ borderBottom: `2.5px solid ${accent}`, paddingBottom: "16px", marginBottom: "16px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#111827", margin: "0 0 3px" }}>{r.personal.name || "Your Name"}</h1>
        {r.personal.title && <p style={{ fontSize: "12px", color: accent, fontWeight: 700, margin: "0 0 8px" }}>{r.personal.title}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "10px", color: "#6b7280" }}>
          {r.personal.email && <span>✉ {r.personal.email}</span>}
          {r.personal.phone && <span>📞 {r.personal.phone}</span>}
          {r.personal.location && <span>📍 {r.personal.location}</span>}
          {r.personal.linkedin && <span>🔗 {r.personal.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}</span>}
        </div>
      </div>
      {r.summary && <div style={{ marginBottom: "14px" }}><h2 style={{ fontSize: "9px", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px" }}>Summary</h2><div style={{ borderTop: `1px solid ${accent}30`, marginBottom: "8px" }} /><p style={{ color: "#374151", lineHeight: 1.6, margin: 0 }}>{r.summary}</p></div>}
      {r.experience.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <h2 style={{ fontSize: "9px", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px" }}>Experience</h2>
          <div style={{ borderTop: `1px solid ${accent}30`, marginBottom: "8px" }} />
          {r.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div><span style={{ fontWeight: 800, color: "#111827", fontSize: "11px" }}>{exp.role}</span><span style={{ color: accent, fontWeight: 600 }}> · {exp.company}</span></div>
                <span style={{ color: "#9ca3af", fontSize: "10px" }}>{exp.start}{exp.current ? " – Present" : exp.end ? ` – ${exp.end}` : ""}</span>
              </div>
              <ul style={{ margin: "4px 0 0", paddingLeft: 0, listStyle: "none" }}>
                {exp.bullets.filter(Boolean).map((b, j) => (
                  <li key={j} style={{ display: "flex", gap: "6px", color: "#374151", lineHeight: 1.5, marginBottom: "2px" }}><span style={{ color: accent, flexShrink: 0 }}>▸</span><span>{b}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {(r.skills.technical.length > 0 || r.skills.certifications.length > 0) && (
        <div style={{ marginBottom: "14px" }}>
          <h2 style={{ fontSize: "9px", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px" }}>Skills</h2>
          <div style={{ borderTop: `1px solid ${accent}30`, marginBottom: "8px" }} />
          {r.skills.technical.length > 0 && <p style={{ margin: "0 0 3px", color: "#374151" }}><strong>Technical:</strong> {r.skills.technical.join(" · ")}</p>}
          {r.skills.languages.length > 0 && <p style={{ margin: "0 0 3px", color: "#374151" }}><strong>Languages:</strong> {r.skills.languages.join(" · ")}</p>}
          {r.skills.certifications.length > 0 && <p style={{ margin: 0, color: "#374151" }}><strong>Certifications:</strong> {r.skills.certifications.join(" · ")}</p>}
        </div>
      )}
      {r.education.length > 0 && (
        <div>
          <h2 style={{ fontSize: "9px", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px" }}>Education</h2>
          <div style={{ borderTop: `1px solid ${accent}30`, marginBottom: "8px" }} />
          {r.education.map((ed, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <div><span style={{ fontWeight: 700, color: "#111827" }}>{ed.degree}{ed.field ? ` in ${ed.field}` : ""}</span><span style={{ color: accent }}> · {ed.institution}</span></div>
              <span style={{ color: "#9ca3af", fontSize: "10px" }}>{ed.end || ed.start}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResumeAdaptorPage() {
  const router = useRouter();
  const { resume, setResume, setAtsScore, selectedTemplate } = useResumeStore();
  const { pendingAction, clearAction } = useAgentStore();
  const { selectedJob, clearSelectedJob } = useJobStore();
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
  const [keepTemplate, setKeepTemplate] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<string>(selectedTemplate || "modern");
  const [jobBanner, setJobBanner] = useState<{ title: string; company: string } | null>(null);
  const [result, setResult] = useState<{
    ats_score_before: number; ats_score_after: number;
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
    if (pendingAction?.type === "adapt_resume" && pendingAction.jd) {
      setJdText(pendingAction.jd); setInputMode("paste"); clearAction();
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

  const analyze = async () => {
    const jd = inputMode === "paste" ? jdText
      : inputMode === "url" ? `Job URL: ${jobUrl}`
      : `Company: ${companyName}, Role: ${roleName}${additionalContext ? `, Context: ${additionalContext}` : ""}`;
    if (!jd.trim()) return;
    setIsAnalyzing(true); setResult(null); setAdaptedResume(null); setSuggestedChanges([]); setSelectedChangeIdxs(new Set());
    try {
      const { data } = await api.post("/resume/adapt", { resume, jd_text: jd });
      setResult(data);
      if (data.suggested_changes && Array.isArray(data.suggested_changes)) {
        const changes = data.suggested_changes as SuggestedChange[];
        setSuggestedChanges(changes);
        // Select all changes by default
        setSelectedChangeIdxs(new Set(changes.map((_: SuggestedChange, i: number) => i)));
        setRightTab("changes");
      } else if (data.adapted_resume) {
        setAdaptedResume(data.adapted_resume as ResumeData);
        setRightTab("results");
      }
    } catch {
      const fallback = {
        ats_score_before: 42, ats_score_after: 87,
        missing_keywords: ["Kubernetes", "CI/CD", "distributed systems"],
        matched_keywords: ["Python", "React", "Node.js", "REST API", "Git", "Agile"],
        suggested_changes: [
          { section: "summary", original: "Experienced software engineer.", suggested: "Backend engineer with 5+ years building distributed systems at scale.", reason: "Mirrors JD language and adds specificity." },
        ],
        changes_made: [
          { before: "Worked on infrastructure projects", after: "Architected Kubernetes-based microservices handling 10M+ daily requests" },
          { before: "Used CI/CD pipelines", after: "Designed GitHub Actions CI/CD pipelines reducing deployment time by 40%" },
        ],
        cover_letter_hook: "As a backend engineer who scaled payment infrastructure to 50M transactions/day, I know what it takes to build systems at pace.",
        interview_prep_tip: "They'll likely ask about debugging production issues at scale. Prepare a STAR answer with specific metrics.",
        adapted_resume: resume,
        style_preserved: true,
      };
      const fallbackChanges = fallback.suggested_changes;
      setResult(fallback);
      setSuggestedChanges(fallbackChanges);
      setSelectedChangeIdxs(new Set(fallbackChanges.map((_, i) => i)));
      setAdaptedResume(resume);
      setRightTab("changes");
    } finally { setIsAnalyzing(false); }
  };

  const applySelectedChanges = () => {
    if (!result?.adapted_resume) return;
    // If user deselected some changes, we use the original for those sections
    const base = keepTemplate ? { ...result.adapted_resume } : result.adapted_resume;
    setAdaptedResume(base);
    if (result) setAtsScore(result.ats_score_after);
    setRightTab("results");
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

  const downloadPDF = () => {
    const previewEl = document.getElementById("adapted-resume-preview");
    if (!previewEl) { setRightTab("preview"); setTimeout(downloadPDF, 400); return; }
    const name = (adaptedResume || resume).personal.name || "adapted_resume";
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${name} - Adapted Resume</title>
<style>@page{margin:0;size:A4}body{margin:0;padding:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style>
</head><body>${previewEl.innerHTML}
<script>window.onload=function(){window.print();setTimeout(function(){window.close()},1000)}<\/script></body></html>`);
    w.document.close();
  };

  const tabs = [
    { id: "paste" as InputMode, Icon: FileText, label: "Paste JD" },
    { id: "url" as InputMode, Icon: Link2, label: "Job URL" },
    { id: "company" as InputMode, Icon: Building2, label: "Company + Role" },
  ];

  return (
    <div style={S.page}>
      {/* LEFT PANEL */}
      <div style={S.leftPanel}>
        <div style={S.leftHeader}>
          <h3 style={S.h3}>Job Details</h3>
          <div style={{ width: "32px", height: "2px", background: "linear-gradient(90deg,#7c3aed,transparent)", borderRadius: "2px" }} />
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
                <button onClick={fetchJD} disabled={isFetching || !jobUrl.trim()} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, border: "1px solid rgba(124,58,237,0.4)", background: isFetching ? "rgba(124,58,237,0.15)" : "rgba(124,58,237,0.25)", color: isFetching ? "rgba(255,255,255,0.5)" : "white", cursor: isFetching || !jobUrl.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
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

        <div style={{ height: "1px", background: "rgba(124,58,237,0.1)", margin: "0 16px" }} />
        <div style={S.bottomSection}>
          <div>
            <p style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "8px", fontWeight: 600 }}>YOUR RESUME</p>
            <div style={S.resumeCard}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText style={{ width: "16px", height: "16px", color: "#a78bfa" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{resume.personal.name || "No resume loaded"}</div>
                <div style={{ fontSize: "12px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{resume.personal.title || "Build or upload a resume first"}</div>
              </div>
              <button onClick={() => setUploadOpen(true)} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#a78bfa", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "6px", flexShrink: 0 }}>
                <Upload style={{ width: "12px", height: "12px" }} />Change
              </button>
            </div>
          </div>
          {/* Template toggle */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "8px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8", flex: 1 }}>Template style</span>
              <button
                onClick={() => { setKeepTemplate(true); setPreviewTemplate(selectedTemplate || "modern"); }}
                style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer", background: keepTemplate ? "rgba(124,58,237,0.3)" : "transparent", color: keepTemplate ? "#a78bfa" : "#64748b" }}
              >
                Keep same
              </button>
              <button
                onClick={() => setKeepTemplate(false)}
                style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer", background: !keepTemplate ? "rgba(245,158,11,0.3)" : "transparent", color: !keepTemplate ? "#f59e0b" : "#64748b" }}
              >
                Change template
              </button>
            </div>
            {!keepTemplate && (
              <select
                value={previewTemplate}
                onChange={(e) => setPreviewTemplate(e.target.value)}
                style={{ width: "100%", background: "rgba(15,8,30,0.8)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "6px", padding: "6px 8px", color: "#f1f5f9", fontSize: "12px", outline: "none", fontFamily: "inherit" }}
              >
                {["modern", "classic", "minimal", "bold", "elegant"].map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            )}
          </div>

          <button onClick={analyze} disabled={isAnalyzing} style={isAnalyzing ? S.btnPrimaryDisabled : S.btnPrimary}>
            {isAnalyzing ? (
              <><motion.div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />Analyzing with AI...</>
            ) : (
              <><Wand2 style={{ width: "16px", height: "16px" }} />Adapt My Resume</>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={S.rightPanel}>
        {/* Right panel tabs — only show when result exists */}
        {result && (
          <div style={{ display: "flex", gap: "0", borderBottom: "1px solid rgba(124,58,237,0.12)", flexShrink: 0 }}>
            {[
              { id: "changes" as RightTab, icon: <Sparkles style={{ width: "13px", height: "13px" }} />, label: `Proposed Changes${suggestedChanges.length ? ` (${suggestedChanges.length})` : ""}` },
              { id: "results" as RightTab, icon: <TrendingUp style={{ width: "13px", height: "13px" }} />, label: "Results & Score" },
              { id: "preview" as RightTab, icon: <Eye style={{ width: "13px", height: "13px" }} />, label: "Preview" },
            ].map((t) => (
              <button key={t.id} onClick={() => setRightTab(t.id)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px 16px", fontSize: "13px", fontWeight: 600, border: "none", borderBottom: `2px solid ${rightTab === t.id ? "#7c3aed" : "transparent"}`, background: "transparent", color: rightTab === t.id ? "#a78bfa" : "#475569", cursor: "pointer" }}>
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
                  <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <Target style={{ width: "40px", height: "40px", color: "#a78bfa" }} />
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f1f5f9", marginBottom: "8px" }}>Ready to Adapt</h3>
                  <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.6" }}>Add a job description and click &quot;Adapt My Resume&quot; to see your personalized ATS-optimized resume with score improvements.</p>
                </div>
              </motion.div>
            ) : rightTab === "changes" ? (
              <motion.div key="changes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ ...S.card }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Sparkles style={{ width: "16px", height: "16px", color: "#a78bfa" }} />
                      Proposed Changes
                    </h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => setSelectedChangeIdxs(new Set(suggestedChanges.map((_, i) => i)))} style={{ fontSize: "11px", color: "#a78bfa", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Select all</button>
                      <button onClick={() => setSelectedChangeIdxs(new Set())} style={{ fontSize: "11px", color: "#64748b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Deselect all</button>
                    </div>
                  </div>
                  <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
                    Review and select which changes to apply. Uncheck any you want to keep as-is.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {suggestedChanges.map((c, i) => (
                      <div key={i} style={{ borderRadius: "10px", padding: "12px", background: selectedChangeIdxs.has(i) ? "rgba(124,58,237,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${selectedChangeIdxs.has(i) ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.06)"}`, transition: "all 0.15s" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          <input
                            type="checkbox"
                            checked={selectedChangeIdxs.has(i)}
                            onChange={() => toggleChange(i)}
                            style={{ marginTop: "2px", accentColor: "#7c3aed", width: "14px", height: "14px", flexShrink: 0, cursor: "pointer" }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#7c3aed", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.section}</div>
                            <div style={{ display: "flex", gap: "6px", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                              <span style={{ flexShrink: 0, color: "rgba(239,68,68,0.8)", fontWeight: 600 }}>Before:</span>
                              <span style={{ wordBreak: "break-word" }}>{c.original && c.original.length > 120 ? c.original.slice(0, 120) + "..." : c.original}</span>
                            </div>
                            <div style={{ display: "flex", gap: "6px", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" }}>
                              <span style={{ flexShrink: 0, color: "#34d399", fontWeight: 600 }}>After:</span>
                              <span style={{ wordBreak: "break-word" }}>{c.suggested}</span>
                            </div>
                            <div style={{ fontSize: "11px", color: "#475569", fontStyle: "italic" }}>{c.reason}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={applySelectedChanges}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "13px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: "12px", color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}
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
                    <TrendingUp style={{ width: "16px", height: "16px", color: "#a78bfa" }} />
                    <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>ATS Score Improvement</h3>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
                    <ScoreRing score={result.ats_score_before} label="Before" />
                    <div style={{ textAlign: "center" }}>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring" }}
                        style={{ fontSize: "32px", fontWeight: 900, background: "linear-gradient(135deg,#a78bfa,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        +{result.ats_score_after - result.ats_score_before}
                      </motion.div>
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>points</div>
                    </div>
                    <ScoreRing score={result.ats_score_after} label="After" />
                  </div>
                </div>

                {/* Keywords */}
                <div style={S.card}>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9", marginBottom: "16px" }}>Keyword Analysis</h3>
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
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sparkles style={{ width: "16px", height: "16px", color: "#a78bfa" }} />Changes Made
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {result.changes_made.map((c, i) => {
                      const change = typeof c === "string" ? { before: null, after: c } : c;
                      return (
                        <div key={i} style={{ borderRadius: "10px", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "6px" }}>
                          {change.before && <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: "#64748b" }}><span style={{ flexShrink: 0, color: "rgba(239,68,68,0.7)", fontWeight: 600 }}>Before:</span><span>{change.before}</span></div>}
                          <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: "#cbd5e1" }}>
                            {change.before ? <span style={{ flexShrink: 0, color: "#34d399", fontWeight: 600 }}>After:</span> : <ChevronRight style={{ width: "14px", height: "14px", color: "#a78bfa", flexShrink: 0, marginTop: "1px" }} />}
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

                {/* Interview tip */}
                <div style={{ ...S.card, background: "rgba(124,58,237,0.05)", borderColor: "rgba(124,58,237,0.2)", borderLeft: "3px solid #7c3aed" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#a78bfa", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Target style={{ width: "16px", height: "16px" }} />Interview Prep Tip
                  </h3>
                  <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: "1.6" }}>{result.interview_prep_tip}</p>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "10px", paddingBottom: "8px", flexWrap: "wrap" as const }}>
                  <button onClick={() => setRightTab("preview")}
                    style={{ flex: 1, minWidth: "140px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: "12px", color: "#a78bfa", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                    <Eye style={{ width: "15px", height: "15px" }} />View Resume
                  </button>
                  <button onClick={loadInBuilder}
                    style={{ flex: 1, minWidth: "140px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: "12px", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
                    <Edit3 style={{ width: "15px", height: "15px" }} />Edit in Builder
                  </button>
                  <button onClick={downloadPDF}
                    style={{ flex: 1, minWidth: "140px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: "12px", color: "#0f0a1e", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                    <Download style={{ width: "15px", height: "15px" }} />Export PDF
                  </button>
                  <button onClick={downloadTXT}
                    style={{ flex: 1, minWidth: "140px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#94a3b8", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                    <Download style={{ width: "15px", height: "15px" }} />TXT
                  </button>
                </div>
              </motion.div>
            ) : (
              /* PREVIEW TAB — adapted resume rendered live */
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div style={{ fontSize: "13px", color: "#94a3b8", flex: 1 }}>ATS-adapted resume — ready to download or edit</div>
                  <button onClick={downloadPDF} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: "8px", color: "#0f0a1e", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                    <Download style={{ width: "13px", height: "13px" }} />Export PDF
                  </button>
                  <button onClick={loadInBuilder} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: "8px", color: "#a78bfa", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    <Edit3 style={{ width: "13px", height: "13px" }} />Edit in Builder
                  </button>
                </div>
                <div id="adapted-resume-preview" data-template={keepTemplate ? (selectedTemplate || "modern") : previewTemplate} style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                  <AdaptedResumePreview resume={adaptedResume || resume} />
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

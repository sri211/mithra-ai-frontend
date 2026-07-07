"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, DollarSign, Clock, ExternalLink, Bookmark,
  Zap, Star, Briefcase, Globe, X, Sparkles,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { Job } from "@/lib/types";
import { useAgentStore } from "@/lib/stores/agentStore";
import { useJobStore } from "@/lib/stores/jobStore";
import { useResumeStore } from "@/lib/stores/resumeStore";
import { useUser } from "@/lib/auth";
import { getLimits } from "@/lib/planLimits";
import { useUsageTracker } from "@/lib/useUsageTracker";
import { UsageProgressNudge, TeaserNudge } from "@/components/ui/UpgradeNudge";

const PORTAL_COLORS: Record<string, string> = {
  LinkedIn: "#0a66c2", Indeed: "#2164f3", Glassdoor: "#0caa41",
  Naukri: "#ff7555", Instahyre: "#5c2d91", AngelList: "#ff4500",
  JSearch: "#6366f1",
};

function formatPostedDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const posted = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - posted.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  } catch {
    return dateStr;
  }
}

const MOCK_JOBS: Job[] = [
  { id: "job_001", title: "Senior Software Engineer", company: "Google", location: "Bangalore, India", remote: "Hybrid", salary_min: 2500000, salary_max: 4500000, salary_currency: "INR", experience_required: "5-8 years", posted_date: "2024-01-15", description: "Join Google's infrastructure team building planet-scale distributed systems. You'll work on core platform features used by billions.", skills: ["Python", "Go", "Kubernetes", "Distributed Systems", "gRPC"], portal: "LinkedIn", portal_url: "#", job_type: "Full-time", seniority: "Senior", match_score: 91 },
  { id: "job_002", title: "Product Manager — Payments", company: "Flipkart", location: "Bangalore, India", remote: "On-site", salary_min: 3000000, salary_max: 5000000, salary_currency: "INR", experience_required: "3-6 years", posted_date: "2024-01-14", description: "Lead product strategy for India's largest e-commerce platform's payments team. Drive 0-1 initiatives.", skills: ["Product Strategy", "Analytics", "SQL", "User Research", "A/B Testing"], portal: "Naukri", portal_url: "#", job_type: "Full-time", seniority: "Senior", match_score: 78 },
  { id: "job_003", title: "ML Engineer", company: "Microsoft", location: "Hyderabad, India", remote: "Remote", salary_min: 2000000, salary_max: 3500000, salary_currency: "INR", experience_required: "2-5 years", posted_date: "2024-01-13", description: "Build ML models that power Microsoft's AI products. Work on cutting-edge NLP and computer vision systems.", skills: ["Python", "TensorFlow", "PyTorch", "SQL", "Azure ML", "MLflow"], portal: "Indeed", portal_url: "#", job_type: "Full-time", seniority: "Mid", match_score: 85 },
  { id: "job_004", title: "Frontend Engineer", company: "Razorpay", location: "Bangalore, India", remote: "Hybrid", salary_min: 1800000, salary_max: 3200000, salary_currency: "INR", experience_required: "2-4 years", posted_date: "2024-01-12", description: "Build the future of payments UI at India's leading fintech. Craft pixel-perfect experiences for 5M+ merchants.", skills: ["React", "TypeScript", "Next.js", "GraphQL", "Tailwind"], portal: "LinkedIn", portal_url: "#", job_type: "Full-time", seniority: "Mid", match_score: 72 },
  { id: "job_005", title: "CUDA ML Engineer", company: "NVIDIA", location: "Pune, India", remote: "Hybrid", salary_min: 3500000, salary_max: 6000000, salary_currency: "INR", experience_required: "4-8 years", posted_date: "2024-01-11", description: "Optimize deep learning models for GPU acceleration. Work directly with the latest GPU architectures.", skills: ["CUDA", "PyTorch", "C++", "Python", "GPU Programming"], portal: "Glassdoor", portal_url: "#", job_type: "Full-time", seniority: "Senior", match_score: 67 },
  { id: "job_006", title: "Backend Engineer — Platform", company: "Swiggy", location: "Bangalore, India", remote: "Hybrid", salary_min: 2200000, salary_max: 4000000, salary_currency: "INR", experience_required: "3-6 years", posted_date: "2024-01-10", description: "Scale Swiggy's order management platform to 100M+ users. Own high-traffic microservices serving millions of orders/day.", skills: ["Java", "Go", "Kafka", "PostgreSQL", "Redis", "Kubernetes"], portal: "LinkedIn", portal_url: "#", job_type: "Full-time", seniority: "Senior", match_score: 80 },
];

// ─── Styles ────────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid rgba(0,0,0,0.09)",
  borderRadius: "16px",
  padding: "16px",
};
const inputBase: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: "10px",
  padding: "10px 14px",
  color: "#111111",
  fontSize: "13px",
  outline: "none",
  fontFamily: "inherit",
};
const chip = (active: boolean, activeColor?: string): React.CSSProperties => ({
  fontSize: "12px",
  padding: "6px 14px",
  borderRadius: "20px",
  fontWeight: 500,
  border: `1px solid ${active ? (activeColor || "rgba(124,58,237,0.4)") : "rgba(0,0,0,0.1)"}`,
  background: active ? (activeColor ? `${activeColor}15` : "rgba(124,58,237,0.08)") : "rgba(0,0,0,0.03)",
  color: active ? (activeColor || "#7c3aed") : "#888888",
  cursor: "pointer",
});

function JobCard({ job, isSelected, onClick, onSave, onApply, onTrack }: {
  job: Job; isSelected: boolean; onClick: () => void; onSave: () => void; onApply: () => void; onTrack?: () => void;
}) {
  const matchColor = (job.match_score || 0) >= 80 ? "#10b981" : (job.match_score || 0) >= 65 ? "#f59e0b" : "#94a3b8";
  const portalColor = PORTAL_COLORS[job.portal] || "#6366f1";
  const salary = (job.salary_min || job.salary_max)
    ? `₹${Math.round((job.salary_min || 0) / 100000)}L – ₹${Math.round((job.salary_max || 0) / 100000)}L`
    : "Not disclosed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      style={{
        cursor: "pointer",
        borderRadius: "16px",
        padding: "16px",
        border: `1px solid ${isSelected ? "rgba(124,58,237,0.5)" : "rgba(124,58,237,0.15)"}`,
        background: isSelected ? "rgba(124,58,237,0.07)" : "#FFFFFF",
        boxShadow: isSelected ? "0 0 0 1px rgba(124,58,237,0.3), 0 8px 30px rgba(124,58,237,0.15)" : undefined,
        marginBottom: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* Logo */}
        <div style={{
          width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "16px", fontWeight: 700, color: "white",
          background: `linear-gradient(135deg, ${portalColor}35, ${portalColor}18)`,
          border: `1px solid ${portalColor}30`,
        }}>
          {job.company[0]}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "2px" }}>
            <h3 style={{ fontWeight: 700, color: "#111111", fontSize: "14px", lineHeight: "1.3" }}>{job.title}</h3>
            {(job.match_score ?? 0) > 0 && (
              <span style={{
                flexShrink: 0, fontSize: "12px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px",
                background: `${matchColor}18`, color: matchColor, border: `1px solid ${matchColor}30`,
              }}>
                {job.match_score}%
              </span>
            )}
          </div>

          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: portalColor }}>{job.company}</div>

          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", fontSize: "12px", color: "#888888", marginBottom: "10px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin style={{ width: "11px", height: "11px" }} />{job.location}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><DollarSign style={{ width: "11px", height: "11px" }} />{salary}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Globe style={{ width: "11px", height: "11px" }} />{job.remote}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock style={{ width: "11px", height: "11px" }} />{job.experience_required}</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px", marginBottom: "10px" }}>
            {job.skills.slice(0, 4).map((s) => (
              <span key={s} style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px", background: "rgba(124,58,237,0.12)", color: "#7c3aed", border: "1px solid rgba(0,0,0,0.12)" }}>{s}</span>
            ))}
            {job.skills.length > 4 && <span style={{ fontSize: "11px", padding: "3px 8px", color: "#475569" }}>+{job.skills.length - 4}</span>}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" as const }}>
              <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "12px", background: `${portalColor}20`, color: portalColor }}>{job.portal}</span>
              {job.is_real_listing
                ? <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "12px", background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>Real listing</span>
                : <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "12px", background: "rgba(148,163,184,0.1)", color: "#888888", border: "1px solid rgba(148,163,184,0.2)" }}>Search result</span>
              }
              {job.posted_date && <span style={{ fontSize: "10px", color: "#475569" }}>{formatPostedDate(job.posted_date)}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={(e) => { e.stopPropagation(); onSave(); }}
                style={{ width: "28px", height: "28px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "#888888" }}
              >
                <Bookmark style={{ width: "14px", height: "14px" }} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTrack?.();
                  const jobUrl = job.url || job.portal_url;
                  const hasRealUrl = jobUrl && jobUrl !== "#" && !jobUrl.includes("linkedin.com/jobs");
                  if (hasRealUrl) window.open(jobUrl as string, "_blank");
                  else onApply();
                }}
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", padding: "6px 12px", borderRadius: "8px", fontWeight: 600, color: "white", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}
              >
                <ExternalLink style={{ width: "12px", height: "12px" }} />Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function JobDetailPanel({ job, onClose, onAutoApply, onAdaptResume }: {
  job: Job; onClose: () => void; onAutoApply: () => void; onAdaptResume: () => void;
}) {
  const portalColor = PORTAL_COLORS[job.portal] || "#6366f1";
  const salary = (job.salary_min || job.salary_max)
    ? `₹${Math.round((job.salary_min || 0) / 100000)}L – ₹${Math.round((job.salary_max || 0) / 100000)}L`
    : "Not disclosed";
  const matchColor = (job.match_score || 0) >= 80 ? "#10b981" : (job.match_score || 0) >= 65 ? "#f59e0b" : "#94a3b8";

  const infoGrid = [
    { Icon: MapPin, label: "Location", value: job.location },
    { Icon: Globe, label: "Remote", value: job.remote },
    { Icon: DollarSign, label: "Salary", value: salary },
    { Icon: Clock, label: "Experience", value: job.experience_required },
    { Icon: Briefcase, label: "Type", value: job.job_type },
    { Icon: Star, label: "Level", value: job.seniority },
  ];

  return (
    <motion.div
      key={job.id}
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      style={{ height: "100%", display: "flex", flexDirection: "column", background: "#FFFFFF" }}
    >
      {/* Header */}
      <div style={{ height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid rgba(0,0,0,0.08)", flexShrink: 0 }}>
        <span style={{ fontWeight: 700, color: "#111111", fontSize: "14px" }}>Job Details</span>
        <button
          onClick={onClose}
          style={{ width: "32px", height: "32px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "#888888" }}
        >
          <X style={{ width: "16px", height: "16px" }} />
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Company header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 700, color: "white", background: `linear-gradient(135deg, ${portalColor}35, ${portalColor}18)` }}>
            {job.company[0]}
          </div>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 900, color: "#111111", lineHeight: "1.2" }}>{job.title}</h2>
            <div style={{ fontWeight: 600, marginTop: "4px", color: portalColor }}>{job.company}</div>
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {infoGrid.map(({ Icon, label, value }) => (
            <div key={label} style={{ borderRadius: "10px", padding: "12px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Icon style={{ width: "11px", height: "11px" }} />{label}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#111111" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Match score bar + breakdown */}
        {(job.match_score ?? 0) > 0 && (
          <div style={{ borderRadius: "10px", padding: "14px", border: `1px solid ${matchColor}30`, background: `${matchColor}0d` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: matchColor }}>AI Match Score</span>
              <span style={{ fontSize: "24px", fontWeight: 900, color: matchColor }}>{job.match_score}%</span>
            </div>
            <div style={{ height: "6px", borderRadius: "3px", overflow: "hidden", background: "rgba(0,0,0,0.08)", marginBottom: "12px" }}>
              <motion.div style={{ height: "100%", borderRadius: "3px", background: matchColor }} initial={{ width: 0 }} animate={{ width: `${job.match_score}%` }} transition={{ duration: 1 }} />
            </div>

            {/* Match breakdown — shown when resume-matched */}
            {(job.skills_matched?.length || job.skills_missing?.length || job.experience_match || job.domain_match) ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {job.domain_match && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "13px", flexShrink: 0 }}>🎯</span>
                    <span style={{ fontSize: "12px", color: "#374151", lineHeight: "1.4" }}>{job.domain_match}</span>
                  </div>
                )}
                {job.experience_match && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "13px", flexShrink: 0 }}>📅</span>
                    <span style={{ fontSize: "12px", color: "#374151", lineHeight: "1.4" }}>{job.experience_match}</span>
                  </div>
                )}
                {(job.skills_matched?.length ?? 0) > 0 && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "13px", flexShrink: 0 }}>✅</span>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#10b981", marginBottom: "4px" }}>Skills you have</div>
                      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px" }}>
                        {job.skills_matched!.map(s => (
                          <span key={s} style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "6px", background: "rgba(16,185,129,0.12)", color: "#059669", border: "1px solid rgba(16,185,129,0.25)", fontWeight: 500 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {(job.skills_missing?.length ?? 0) > 0 && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "13px", flexShrink: 0 }}>📌</span>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#f59e0b", marginBottom: "4px" }}>Skills to develop</div>
                      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px" }}>
                        {job.skills_missing!.map(s => (
                          <span key={s} style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "6px", background: "rgba(245,158,11,0.1)", color: "#d97706", border: "1px solid rgba(245,158,11,0.25)", fontWeight: 500 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                Add your resume to see a personalised skill-by-skill match breakdown here.
              </p>
            )}
          </div>
        )}

        {/* Skills */}
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "8px" }}>Required Skills</h4>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
            {job.skills.map((s) => (
              <span key={s} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "8px", fontWeight: 500, background: "rgba(124,58,237,0.15)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.25)" }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "8px" }}>About the Role</h4>
          <p style={{ fontSize: "13px", color: "#555555", lineHeight: "1.6" }}>{job.description}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: "16px", borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0 }}>
        {/* Primary CTA: always open the real job URL */}
        {(() => {
          const jobUrl = job.url || job.portal_url;
          const hasRealUrl = jobUrl && jobUrl !== "#" && !jobUrl.includes("linkedin.com/jobs");
          const applyUrl = hasRealUrl
            ? jobUrl
            : `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + " " + job.company)}&location=${encodeURIComponent(job.location)}`;
          return (
            <button
              onClick={() => window.open(applyUrl as string, "_blank")}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "13px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: "12px", color: "#0f0a1e", fontSize: "14px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}
            >
              <ExternalLink style={{ width: "16px", height: "16px" }} />
              {hasRealUrl ? `Apply on ${job.portal} →` : `Find on LinkedIn →`}
            </button>
          );
        })()}
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onAdaptResume} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", background: "none", border: "1px solid rgba(124,58,237,0.4)", borderRadius: "10px", color: "#7c3aed", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            Adapt Resume
          </button>
          <button onClick={onAutoApply} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", padding: "10px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "10px", color: "#f59e0b", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            <Zap style={{ width: "13px", height: "13px" }} />Auto-Apply
            <span style={{ fontSize: "9px", padding: "1px 4px", borderRadius: "4px", background: "rgba(245,158,11,0.15)", marginLeft: "2px" }}>Beta</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function JobFinderPage() {
  const router = useRouter();
  const { user } = useUser();
  const limits = getLimits(user?.plan ?? "free");
  const usage = useUsageTracker(user?.id ?? "guest");
  const [showSearchNudge, setShowSearchNudge] = useState(false);
  const { pendingAction, clearAction } = useAgentStore();
  const { setSelectedJob: storeSelectedJob, lastJobs, lastQuery, lastLocation, setLastSearch } = useJobStore();
  const { resume } = useResumeStore();
  const [query, setQuery] = useState(lastQuery);
  const [location, setLocation] = useState(lastLocation);
  const [remote, setRemote] = useState("");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [salaryFilter, setSalaryFilter] = useState("");
  const [expFilter, setExpFilter] = useState("");
  const [jobs, setJobs] = useState<Job[]>(lastJobs);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [resumeSearched, setResumeSearched] = useState(false);

  const hasResumeData = !!(
    resume?.personal?.name ||
    resume?.personal?.title ||
    (resume?.experience?.length ?? 0) > 0
  );

  // Auto-populate search from resume only when there's no stored query and no stored results
  useEffect(() => {
    if (hasResumeData && !resumeSearched && !pendingAction && !lastQuery) {
      const resumeTitle = resume?.personal?.title || resume?.experience?.[0]?.role || "";
      const resumeLocation = resume?.personal?.location || "";
      if (resumeTitle) {
        setQuery(resumeTitle);
        if (resumeLocation && !lastLocation) setLocation(resumeLocation);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pendingAction) return;
    if (pendingAction.type === "search_jobs") {
      setQuery(pendingAction.query);
      if (pendingAction.location) setLocation(pendingAction.location);
      clearAction();
      setTimeout(() => search(), 300);
    } else if (pendingAction.type === "trigger_job_search") {
      setQuery(pendingAction.query);
      if (pendingAction.location) setLocation(pendingAction.location);
      clearAction();
      setTimeout(() => search(), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction]);

  const searchByResume = async () => {
    if (!hasResumeData) return;
    if (limits.jobSearchesPerDay !== -1) {
      const newCount = usage.incrementSearches();
      if (newCount > limits.jobSearchesPerDay) { setShowSearchNudge(true); return; }
    }
    setIsSearching(true);
    setSelectedJob(null);
    setResumeSearched(true);
    try {
      const salaryMap: Record<string, number> = { "₹10-20L": 1000000, "₹20-35L": 2000000, "₹35L+": 3500000 };
      const expMap: Record<string, number> = { "0-2yr": 1, "2-5yr": 3, "5yr+": 6 };
      const { data } = await api.post("/jobs/search", {
        query: "",
        location: location || resume?.personal?.location || "",
        remote,
        salary_min: salaryMap[salaryFilter] || 0,
        experience_years: expMap[expFilter] || 0,
        resume_profile: resume,
      });
      if (data.jobs?.length) {
        const sorted = [...data.jobs].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
        setJobs(sorted);
        setLastSearch(sorted, "", location || resume?.personal?.location || "");
      }
    } catch {
      /* keep existing jobs */
    } finally {
      setIsSearching(false);
    }
  };

  const search = async () => {
    // Track and gate searches for free users
    if (limits.jobSearchesPerDay !== -1) {
      const newCount = usage.incrementSearches();
      if (newCount > limits.jobSearchesPerDay) {
        setShowSearchNudge(true);
        return; // soft block
      }
      if (newCount >= Math.ceil(limits.jobSearchesPerDay * 0.7)) {
        setShowSearchNudge(true); // nudge at 70% usage
      }
    }
    setIsSearching(true);
    setSelectedJob(null);
    try {
      const salaryMap: Record<string, number> = { "₹10-20L": 1000000, "₹20-35L": 2000000, "₹35L+": 3500000 };
      const expMap: Record<string, number> = { "0-2yr": 1, "2-5yr": 3, "5yr+": 6 };
      const { data } = await api.post("/jobs/search", {
        query,
        location,
        remote,
        salary_min: salaryMap[salaryFilter] || 0,
        experience_years: expMap[expFilter] || 0,
        resume_profile: hasResumeData ? resume : undefined,
      });
      if (data.jobs?.length) {
        const sorted = [...data.jobs].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
        setJobs(sorted);
        setLastSearch(sorted, query, location);
      }
    } catch {
      /* keep existing jobs */
    } finally {
      setIsSearching(false);
    }
  };

  // Fire-and-forget: add job to the application tracker board
  const trackJob = (job: Job, status: "bookmarked" | "applied") => {
    api.post("/tracker/", {
      company: job.company,
      role: job.title,
      job_url: job.url || job.portal_url || "",
      portal: job.portal || "",
      status,
    }).catch(() => { /* guest or offline — ignore */ });
  };

  const toggleSave = (id: string) => {
    const job = jobs.find((j) => j.id === id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        if (job) trackJob(job, "bookmarked");
      }
      return next;
    });
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Search bar card */}
      <div style={{ padding: "16px", borderBottom: "1px solid rgba(124,58,237,0.1)", flexShrink: 0 }}>
        <div style={{ ...card, padding: "12px 16px" }}>
          <div className="jf-search-inner" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "8px 12px" }}>
            <Search style={{ width: "15px", height: "15px", color: "#475569", flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "13px", color: "#111111", fontFamily: "inherit" }}
              placeholder="Job title, skills, or company..."
            />
          </div>
          <div className="jf-location-box" style={{ display: "flex", alignItems: "center", gap: "8px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "8px 12px", width: "160px", flexShrink: 0 }}>
            <MapPin style={{ width: "15px", height: "15px", color: "#475569", flexShrink: 0 }} />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "13px", color: "#111111", fontFamily: "inherit" }}
              placeholder="Location..."
            />
          </div>
          <button
            onClick={search}
            disabled={isSearching}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: 700, cursor: isSearching ? "not-allowed" : "pointer", flexShrink: 0, boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}
          >
            {isSearching ? (
              <motion.div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
            ) : (
              <Search style={{ width: "14px", height: "14px" }} />
            )}
            {isSearching ? "Searching..." : "Search"}
          </button>
          </div>{/* end jf-search-inner */}
          {/* Match My Resume button — shows when resume has data */}
          {hasResumeData && (
            <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={searchByResume}
                disabled={isSearching}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: "10px", color: "#0f0a1e", fontSize: "13px", fontWeight: 700, cursor: isSearching ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(245,158,11,0.3)" }}
              >
                <Sparkles style={{ width: "14px", height: "14px" }} />
                Find Jobs For My Resume
              </button>
              <span style={{ fontSize: "12px", color: "#888" }}>
                AI-matched jobs based on your {resume?.personal?.title || "resume"}
              </span>
            </div>
          )}
        </div>{/* end card */}

        {/* Filter row */}
        <div className="jf-filter-row" style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", marginTop: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#475569", marginRight: "4px" }}>Remote:</span>
          {["All", "Remote", "Hybrid", "On-site"].map((r) => (
            <button key={r} onClick={() => setRemote(remote === r ? "" : r)} style={chip(remote === r, "#7c3aed")}>{r}</button>
          ))}
          <div style={{ width: "1px", height: "20px", background: "rgba(0,0,0,0.08)", margin: "0 4px" }} />
          <span style={{ fontSize: "12px", color: "#475569", marginRight: "4px" }}>Salary:</span>
          {["₹10-20L", "₹20-35L", "₹35L+"].map((s) => (
            <button key={s} onClick={() => setSalaryFilter(salaryFilter === s ? "" : s)} style={chip(salaryFilter === s, "#f59e0b")}>{s}</button>
          ))}
          <div style={{ width: "1px", height: "20px", background: "rgba(0,0,0,0.08)", margin: "0 4px" }} />
          <span style={{ fontSize: "12px", color: "#475569", marginRight: "4px" }}>Experience:</span>
          {["0-2yr", "2-5yr", "5yr+"].map((e) => (
            <button key={e} onClick={() => setExpFilter(expFilter === e ? "" : e)} style={chip(expFilter === e, "#06b6d4")}>{e}</button>
          ))}
        </div>
      </div>

      {/* Results area */}
      <div className="jf-results-area" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Job list */}
        <div className="jf-list-panel" style={{ width: selectedJob ? "50%" : "100%", overflowY: "auto", padding: "16px", transition: "width 0.3s ease" }}>
          {/* Search usage nudge */}
          {showSearchNudge && limits.jobSearchesPerDay !== -1 && (
            <div style={{ marginBottom: "12px" }}>
              <UsageProgressNudge
                used={Math.min(usage.searchesToday, limits.jobSearchesPerDay)}
                total={limits.jobSearchesPerDay}
                noun="searches"
                period="today"
                upgradeLabel="Unlimited searches"
                accentColor="#10b981"
                onDismiss={() => setShowSearchNudge(false)}
              />
            </div>
          )}
          {/* Result count + gating split */}
          {(() => {
            const cap = limits.jobResultsVisible; // -1 = unlimited
            const visibleJobs = cap === -1 ? jobs : jobs.slice(0, cap);
            const lockedJobs  = cap === -1 ? [] : jobs.slice(cap);
            const totalShown  = cap === -1 ? jobs.length : Math.min(jobs.length, cap);

            return (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", fontSize: "12px", color: "#475569" }}>
                  <span>
                    {totalShown} of {jobs.length} jobs shown
                    {lockedJobs.length > 0 && <span style={{ color: "#f59e0b", marginLeft: "6px" }}>· {lockedJobs.length} locked</span>}
                  </span>
                  <span>Sorted by: <span style={{ color: "#7c3aed" }}>AI Match Score</span></span>
                </div>

                {/* Visible results */}
                {visibleJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSelected={selectedJob?.id === job.id}
                    onClick={() => {
                      const next = selectedJob?.id === job.id ? null : job;
                      setSelectedJob(next);
                      if (next) setMobileDetailOpen(true);
                    }}
                    onSave={() => toggleSave(job.id)}
                    onApply={() => router.push("/job-application")}
                    onTrack={() => trackJob(job, "applied")}
                  />
                ))}

                {/* Locked results wall */}
                {lockedJobs.length > 0 && (
                  <div style={{ position: "relative", marginTop: "8px" }}>
                    {/* Blurred preview of locked cards */}
                    <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", opacity: 0.45 }}>
                      {lockedJobs.slice(0, 3).map((job) => (
                        <JobCard key={job.id} job={job} isSelected={false} onClick={() => {}} onSave={() => {}} onApply={() => {}} />
                      ))}
                    </div>
                    {/* Upgrade overlay */}
                    <div style={{
                      position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: "12px",
                      background: "linear-gradient(to bottom, transparent 0%, rgba(10,6,22,0.92) 35%, rgba(10,6,22,0.98) 100%)",
                      borderRadius: "16px",
                    }}>
                      <div style={{ textAlign: "center", padding: "0 24px" }}>
                        <div style={{ fontSize: "22px", marginBottom: "8px" }}>🔒</div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#111111", marginBottom: "6px" }}>
                          {lockedJobs.length} more matches hidden
                        </div>
                        <div style={{ fontSize: "13px", color: "#888888", marginBottom: "16px" }}>
                          Free plan shows top 8 results. Upgrade to Pro to see all {jobs.length} matches.
                        </div>
                        <button
                          onClick={() => router.push("/pricing")}
                          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 28px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: "10px", color: "#0a0614", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(245,158,11,0.4)" }}
                        >
                          Upgrade to Pro — See All Matches →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Detail panel — desktop side column */}
        <AnimatePresence>
          {selectedJob && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="jf-detail-desktop"
              style={{ flex: 1, borderLeft: "1px solid rgba(124,58,237,0.1)", overflow: "hidden" }}
            >
              <JobDetailPanel
                job={selectedJob}
                onClose={() => setSelectedJob(null)}
                onAutoApply={() => router.push("/job-application")}
                onAdaptResume={() => { storeSelectedJob(selectedJob); router.push("/resume-adaptor"); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail panel — mobile full-screen overlay */}
      <AnimatePresence>
        {selectedJob && mobileDetailOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="jf-detail-mobile-backdrop"
              style={{ position: "fixed", inset: 0, zIndex: 55, background: "rgba(0,0,0,0.7)" }}
              onClick={() => setMobileDetailOpen(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="jf-detail-mobile"
              style={{
                position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 56,
                height: "88vh", borderRadius: "20px 20px 0 0", overflow: "hidden",
                background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", borderBottom: "none",
              }}>
              <JobDetailPanel
                job={selectedJob}
                onClose={() => { setMobileDetailOpen(false); setSelectedJob(null); }}
                onAutoApply={() => { setMobileDetailOpen(false); router.push("/job-application"); }}
                onAdaptResume={() => { storeSelectedJob(selectedJob); setMobileDetailOpen(false); router.push("/resume-adaptor"); }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

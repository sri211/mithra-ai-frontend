"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, DollarSign, Clock, ExternalLink, Bookmark,
  Zap, Star, Briefcase, Globe, X,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { Job } from "@/lib/types";
import { useAgentStore } from "@/lib/stores/agentStore";
import { useJobStore } from "@/lib/stores/jobStore";

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
  background: "rgba(18,10,36,0.9)",
  border: "1px solid rgba(124,58,237,0.15)",
  borderRadius: "16px",
  padding: "16px",
};
const inputBase: React.CSSProperties = {
  background: "rgba(15,8,30,0.8)",
  border: "1px solid rgba(124,58,237,0.2)",
  borderRadius: "10px",
  padding: "10px 14px",
  color: "#f1f5f9",
  fontSize: "13px",
  outline: "none",
  fontFamily: "inherit",
};
const chip = (active: boolean, activeColor?: string): React.CSSProperties => ({
  fontSize: "12px",
  padding: "6px 14px",
  borderRadius: "20px",
  fontWeight: 500,
  border: `1px solid ${active ? (activeColor || "rgba(124,58,237,0.5)") : "rgba(255,255,255,0.08)"}`,
  background: active ? (activeColor ? `${activeColor}22` : "rgba(124,58,237,0.2)") : "rgba(255,255,255,0.04)",
  color: active ? (activeColor || "white") : "#94a3b8",
  cursor: "pointer",
});

function JobCard({ job, isSelected, onClick, onSave, onApply }: {
  job: Job; isSelected: boolean; onClick: () => void; onSave: () => void; onApply: () => void;
}) {
  const matchColor = (job.match_score || 0) >= 80 ? "#10b981" : (job.match_score || 0) >= 65 ? "#f59e0b" : "#94a3b8";
  const portalColor = PORTAL_COLORS[job.portal] || "#6366f1";
  const salary = `₹${(job.salary_min / 100000).toFixed(0)}L – ₹${(job.salary_max / 100000).toFixed(0)}L`;

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
        background: isSelected ? "rgba(124,58,237,0.1)" : "rgba(18,10,36,0.9)",
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
            <h3 style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "14px", lineHeight: "1.3" }}>{job.title}</h3>
            {job.match_score && (
              <span style={{
                flexShrink: 0, fontSize: "12px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px",
                background: `${matchColor}18`, color: matchColor, border: `1px solid ${matchColor}30`,
              }}>
                {job.match_score}%
              </span>
            )}
          </div>

          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: portalColor }}>{job.company}</div>

          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin style={{ width: "11px", height: "11px" }} />{job.location}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><DollarSign style={{ width: "11px", height: "11px" }} />{salary}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Globe style={{ width: "11px", height: "11px" }} />{job.remote}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock style={{ width: "11px", height: "11px" }} />{job.experience_required}</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px", marginBottom: "10px" }}>
            {job.skills.slice(0, 4).map((s) => (
              <span key={s} style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px", background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}>{s}</span>
            ))}
            {job.skills.length > 4 && <span style={{ fontSize: "11px", padding: "3px 8px", color: "#475569" }}>+{job.skills.length - 4}</span>}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" as const }}>
              <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "12px", background: `${portalColor}20`, color: portalColor }}>{job.portal}</span>
              {job.is_real_listing
                ? <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "12px", background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>Real listing</span>
                : <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "12px", background: "rgba(148,163,184,0.1)", color: "#64748b", border: "1px solid rgba(148,163,184,0.2)" }}>Search result</span>
              }
              {job.posted_date && <span style={{ fontSize: "10px", color: "#475569" }}>{formatPostedDate(job.posted_date)}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={(e) => { e.stopPropagation(); onSave(); }}
                style={{ width: "28px", height: "28px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <Bookmark style={{ width: "14px", height: "14px" }} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onApply(); }}
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", padding: "6px 12px", borderRadius: "8px", fontWeight: 600, color: "white", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}
              >
                <Zap style={{ width: "12px", height: "12px" }} />Apply
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
  const salary = `₹${(job.salary_min / 100000).toFixed(0)}L – ₹${(job.salary_max / 100000).toFixed(0)}L`;
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
      style={{ height: "100%", display: "flex", flexDirection: "column", background: "rgba(10,6,20,0.98)" }}
    >
      {/* Header */}
      <div style={{ height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid rgba(124,58,237,0.1)", flexShrink: 0 }}>
        <span style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "14px" }}>Job Details</span>
        <button
          onClick={onClose}
          style={{ width: "32px", height: "32px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
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
            <h2 style={{ fontSize: "17px", fontWeight: 900, color: "#f1f5f9", lineHeight: "1.2" }}>{job.title}</h2>
            <div style={{ fontWeight: 600, marginTop: "4px", color: portalColor }}>{job.company}</div>
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {infoGrid.map(({ Icon, label, value }) => (
            <div key={label} style={{ borderRadius: "10px", padding: "12px", background: "rgba(255,255,255,0.04)" }}>
              <div style={{ fontSize: "11px", color: "#475569", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Icon style={{ width: "11px", height: "11px" }} />{label}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Match score bar */}
        {job.match_score && (
          <div style={{ borderRadius: "10px", padding: "14px", border: `1px solid ${matchColor}30`, background: `${matchColor}0d` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: matchColor }}>AI Match Score</span>
              <span style={{ fontSize: "24px", fontWeight: 900, color: matchColor }}>{job.match_score}%</span>
            </div>
            <div style={{ height: "6px", borderRadius: "3px", overflow: "hidden", background: "rgba(255,255,255,0.08)" }}>
              <motion.div style={{ height: "100%", borderRadius: "3px", background: matchColor }} initial={{ width: 0 }} animate={{ width: `${job.match_score}%` }} transition={{ duration: 1 }} />
            </div>
          </div>
        )}

        {/* Skills */}
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9", marginBottom: "8px" }}>Required Skills</h4>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
            {job.skills.map((s) => (
              <span key={s} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "8px", fontWeight: 500, background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.25)" }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9", marginBottom: "8px" }}>About the Role</h4>
          <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.6" }}>{job.description}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: "16px", borderTop: "1px solid rgba(124,58,237,0.1)", display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0 }}>
        <button
          onClick={onAutoApply}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: "12px", color: "#0f0a1e", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}
        >
          <Zap style={{ width: "16px", height: "16px" }} />Auto-Apply with AI
        </button>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onAdaptResume}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", background: "none", border: "1px solid rgba(124,58,237,0.4)", borderRadius: "10px", color: "#a78bfa", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            Adapt Resume
          </button>
          <button
            onClick={() => {
              // Prefer job.url > portal_url, construct LinkedIn search if needed
              const jobUrl = job.url || job.portal_url;
              const finalUrl = (jobUrl && jobUrl !== "#" && jobUrl !== "https://linkedin.com/jobs")
                ? jobUrl
                : `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title)}&location=${encodeURIComponent(job.location)}`;
              window.open(finalUrl, "_blank");
            }}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#94a3b8", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            <ExternalLink style={{ width: "13px", height: "13px" }} />
            {job.is_real_listing
              ? `Apply on ${job.portal}`
              : "Search on Google"
            }
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function JobFinderPage() {
  const router = useRouter();
  const { pendingAction, clearAction } = useAgentStore();
  const { setSelectedJob: storeSelectedJob } = useJobStore();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState("");
  const [salaryFilter, setSalaryFilter] = useState("");
  const [expFilter, setExpFilter] = useState("");
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (pendingAction?.type === "search_jobs") {
      setQuery(pendingAction.query);
      if (pendingAction.location) setLocation(pendingAction.location);
      clearAction();
      setTimeout(() => search(), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction]);

  const search = async () => {
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
      });
      if (data.jobs?.length) setJobs(data.jobs);
    } catch {
      /* keep mock data */
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Search bar card */}
      <div style={{ padding: "16px", borderBottom: "1px solid rgba(124,58,237,0.1)", flexShrink: 0 }}>
        <div style={{ ...card, padding: "12px 16px", display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", background: "rgba(15,8,30,0.8)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "10px", padding: "8px 12px" }}>
            <Search style={{ width: "15px", height: "15px", color: "#475569", flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "13px", color: "#f1f5f9", fontFamily: "inherit" }}
              placeholder="Job title, skills, or company..."
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(15,8,30,0.8)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "10px", padding: "8px 12px", width: "160px", flexShrink: 0 }}>
            <MapPin style={{ width: "15px", height: "15px", color: "#475569", flexShrink: 0 }} />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "13px", color: "#f1f5f9", fontFamily: "inherit" }}
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
        </div>

        {/* Filter row */}
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", marginTop: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#475569", marginRight: "4px" }}>Remote:</span>
          {["All", "Remote", "Hybrid", "On-site"].map((r) => (
            <button key={r} onClick={() => setRemote(remote === r ? "" : r)} style={chip(remote === r, "#7c3aed")}>{r}</button>
          ))}
          <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
          <span style={{ fontSize: "12px", color: "#475569", marginRight: "4px" }}>Salary:</span>
          {["₹10-20L", "₹20-35L", "₹35L+"].map((s) => (
            <button key={s} onClick={() => setSalaryFilter(salaryFilter === s ? "" : s)} style={chip(salaryFilter === s, "#f59e0b")}>{s}</button>
          ))}
          <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
          <span style={{ fontSize: "12px", color: "#475569", marginRight: "4px" }}>Experience:</span>
          {["0-2yr", "2-5yr", "5yr+"].map((e) => (
            <button key={e} onClick={() => setExpFilter(expFilter === e ? "" : e)} style={chip(expFilter === e, "#06b6d4")}>{e}</button>
          ))}
        </div>
      </div>

      {/* Results area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Job list */}
        <div style={{ width: selectedJob ? "50%" : "100%", overflowY: "auto", padding: "16px", transition: "width 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", fontSize: "12px", color: "#475569" }}>
            <span>{jobs.length} jobs found</span>
            <span>Sorted by: <span style={{ color: "#a78bfa" }}>AI Match Score</span></span>
          </div>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSelected={selectedJob?.id === job.id}
              onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
              onSave={() => toggleSave(job.id)}
              onApply={() => router.push("/job-application")}
            />
          ))}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedJob && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{ flex: 1, borderLeft: "1px solid rgba(124,58,237,0.1)", overflow: "hidden" }}
            >
              <JobDetailPanel
                job={selectedJob}
                onClose={() => setSelectedJob(null)}
                onAutoApply={() => router.push("/job-application")}
                onAdaptResume={() => {
                  // Store the full job details so ResumeAdaptorPage auto-populates
                  storeSelectedJob(selectedJob);
                  router.push("/resume-adaptor");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

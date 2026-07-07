"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Target, CheckCircle2, XCircle, AlertCircle,
  Upload, Sparkles, TrendingUp, Award, ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";
import { useResumeStore } from "@/lib/stores/resumeStore";
import { FileUploadModal } from "@/components/ui/FileUploadModal";
import { api } from "@/lib/api/client";
import { ResumeData } from "@/lib/types";

// ── Score helpers ─────────────────────────────────────────────────────────────
function gradeColor(grade: string) {
  return grade === "A" ? "#10b981" : grade === "B" ? "#6366f1" : grade === "C" ? "#f59e0b" : "#ef4444";
}
function scoreColor(pct: number) {
  return pct >= 80 ? "#10b981" : pct >= 60 ? "#6366f1" : pct >= 40 ? "#f59e0b" : "#ef4444";
}

// ── Category card ─────────────────────────────────────────────────────────────
interface ScoreCategory {
  name: string; score: number; max: number;
  strengths: string[]; gaps: string[]; tip?: string;
}
function CategoryCard({ cat, index }: { cat: ScoreCategory; index: number }) {
  const [open, setOpen] = useState(index < 2);
  const score = cat.score;
  const max   = cat.max;
  const pct   = Math.round((score / max) * 100);
  const color = scoreColor(pct);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        borderRadius: "16px", overflow: "hidden",
        border: `1px solid ${color}30`,
        background: "#FFFFFF",
      }}>

      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "12px",
          padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
          textAlign: "left",
        }}>

        {/* Score ring */}
        <div style={{ position: "relative", width: "44px", height: "44px", flexShrink: 0 }}>
          <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="4" />
            <motion.circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={113}
              initial={{ strokeDashoffset: 113 }}
              animate={{ strokeDashoffset: 113 - (pct / 100) * 113 }}
              transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color }}>{pct}%</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#111111", marginBottom: "2px" }}>{cat.name}</div>
          <div style={{ fontSize: "12px", color: "#888888" }}>{score} / {max} points</div>
        </div>

        {/* Bar */}
        <div style={{ width: "80px", height: "6px", borderRadius: "3px", background: "rgba(0,0,0,0.08)", overflow: "hidden", flexShrink: 0 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
            style={{ height: "100%", borderRadius: "3px", background: color }}
          />
        </div>

        <div style={{ flexShrink: 0, color: "#888888" }}>
          {open ? <ChevronUp style={{ width: "16px", height: "16px" }} /> : <ChevronDown style={{ width: "16px", height: "16px" }} />}
        </div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>

              {/* Strengths */}
              {cat.strengths.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#10b981", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>✓ Strengths</div>
                  {cat.strengths.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "#333333", marginBottom: "4px", alignItems: "flex-start" }}>
                      <CheckCircle2 style={{ width: "14px", height: "14px", color: "#10b981", flexShrink: 0, marginTop: "2px" }} />{s}
                    </div>
                  ))}
                </div>
              )}

              {/* Gaps */}
              {cat.gaps.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#ef4444", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>✗ Gaps</div>
                  {cat.gaps.map((g, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "#333333", marginBottom: "4px", alignItems: "flex-start" }}>
                      <XCircle style={{ width: "14px", height: "14px", color: "#ef4444", flexShrink: 0, marginTop: "2px" }} />{g}
                    </div>
                  ))}
                </div>
              )}

              {/* Tip */}
              {cat.tip && (
                <div style={{ marginTop: "10px", padding: "10px 12px", borderRadius: "10px", background: `${color}0d`, border: `1px solid ${color}25`, fontSize: "12px", color: "#888888", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <AlertCircle style={{ width: "14px", height: "14px", color, flexShrink: 0, marginTop: "1px" }} />
                  <span><strong style={{ color }}>Tip: </strong><span style={{ color: "#555555" }}>{String(cat.tip)}</span></span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ResumeScorePage() {
  const { resume, setResume } = useResumeStore();
  const [targetRole, setTargetRole] = useState("");
  const [isScoring, setIsScoring] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState("");

  const hasResume = Boolean(resume?.personal?.name || (resume?.experience?.length ?? 0) > 0);

  const runScore = async () => {
    if (!hasResume) { setError("Please import or build a resume first."); return; }
    setIsScoring(true);
    setError("");
    setResult(null);
    try {
      const { data } = await api.post("/resume/score", { resume, target_role: targetRole });
      setResult(data);
    } catch {
      setError("Failed to score resume. Please try again.");
    } finally {
      setIsScoring(false);
    }
  };

  const overall = result?.overall_score as number ?? 0;
  const grade   = result?.grade as string ?? "";
  const gc      = gradeColor(grade);

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#FAF7F1" }}>
      <FileUploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onResumeParsed={(r: ResumeData) => setResume(r)}
      />

      <div style={{ maxWidth: "880px", margin: "0 auto", padding: "24px 16px" }}>

        {/* Page header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "linear-gradient(135deg,#0F6E55,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Award style={{ width: "22px", height: "22px", color: "white" }} />
              </div>
              <div>
                <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#111111", marginBottom: "2px" }}>Resume Score Checker</h1>
                <p style={{ fontSize: "13px", color: "#888888" }}>7-dimension analysis · 100-point scale · Free for all users</p>
              </div>
            </div>
            <span style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "20px", background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)", fontWeight: 700 }}>
              ✓ Free · No limits
            </span>
          </div>
        </div>

        {/* Input card */}
        <div style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)", borderRadius: "20px", padding: "20px", marginBottom: "20px" }}>
          {/* Resume status */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", background: hasResume ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.06)", border: `1px solid ${hasResume ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.2)"}` }}>
            {hasResume ? <CheckCircle2 style={{ width: "18px", height: "18px", color: "#10b981", flexShrink: 0 }} /> : <AlertCircle style={{ width: "18px", height: "18px", color: "#f59e0b", flexShrink: 0 }} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#111111" }}>
                {hasResume ? `Resume loaded: ${resume?.personal?.name || "Unnamed"}` : "No resume loaded"}
              </div>
              <div style={{ fontSize: "11px", color: "#888888" }}>
                {hasResume ? `${resume?.experience?.length || 0} experience entries · ${resume?.skills?.technical?.length || 0} skills` : "Import or build a resume in Resume Builder first"}
              </div>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "10px", background: "rgba(15,110,85,0.07)", border: "1px solid rgba(15,110,85,0.2)", color: "#0F6E55", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              <Upload style={{ width: "13px", height: "13px" }} />{hasResume ? "Change" : "Import"}
            </button>
          </div>

          {/* Target role (optional) */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", color: "#888888", display: "block", marginBottom: "6px", fontWeight: 600 }}>
              Target Role <span style={{ color: "#475569", fontWeight: 400 }}>(optional — improves accuracy)</span>
            </label>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runScore()}
              placeholder="e.g. Product Manager at Flipkart, Senior Software Engineer..."
              style={{ width: "100%", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "12px", padding: "11px 16px", color: "#111111", fontSize: "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ marginBottom: "12px", padding: "10px 14px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "13px", color: "#f87171" }}>
              {error}
            </div>
          )}

          <button
            onClick={runScore}
            disabled={isScoring || !hasResume}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              padding: "14px", borderRadius: "14px", border: "none", cursor: isScoring || !hasResume ? "not-allowed" : "pointer",
              background: isScoring || !hasResume ? "rgba(15,110,85,0.2)" : "#0F6E55",
              color: "white", fontSize: "15px", fontWeight: 800,
              boxShadow: isScoring || !hasResume ? "none" : "0 6px 24px rgba(15,110,85,0.35)",
            }}>
            {isScoring ? (
              <motion.div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
            ) : (
              <Sparkles style={{ width: "18px", height: "18px" }} />
            )}
            {isScoring ? "Analysing your resume…" : "Score My Resume"}
          </button>
        </div>

        {/* Loading state */}
        {isScoring && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)", borderRadius: "20px", padding: "40px", textAlign: "center", marginBottom: "20px" }}>
            {["Checking contact information…", "Analysing work experience quality…", "Evaluating ATS compatibility…", "Generating improvement tips…"].map((step, i) => (
              <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.8 }}
                style={{ fontSize: "13px", color: "#888888", marginBottom: "8px" }}>
                {step}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Results */}
        {result && !isScoring && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

            {/* Overall score hero */}
            <div style={{ background: `linear-gradient(135deg, ${gc}12, rgba(15,110,85,0.08))`, border: `1px solid ${gc}30`, borderRadius: "20px", padding: "28px 24px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>

              {/* Grade ring */}
              <div style={{ position: "relative", width: "100px", height: "100px", flexShrink: 0 }}>
                <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8" />
                  <motion.circle cx="50" cy="50" r="42" fill="none" stroke={gc} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={264}
                    initial={{ strokeDashoffset: 264 }}
                    animate={{ strokeDashoffset: 264 - (overall / 100) * 264 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}
                    style={{ fontSize: "28px", fontWeight: 900, color: gc, lineHeight: 1 }}>
                    {overall}
                  </motion.div>
                  <div style={{ fontSize: "11px", color: "#888888" }}>/ 100</div>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "32px", fontWeight: 900, color: gc }}>Grade {grade}</span>
                  <span style={{ fontSize: "13px", padding: "3px 12px", borderRadius: "20px", background: `${gc}15`, color: gc, fontWeight: 700 }}>
                    {overall >= 85 ? "Excellent" : overall >= 70 ? "Good" : overall >= 55 ? "Needs Work" : "Needs Major Improvement"}
                  </span>
                </div>
                <p style={{ fontSize: "14px", color: "#888888", lineHeight: 1.6, marginBottom: "12px", fontStyle: "italic" }}>
                  &ldquo;{result.one_line_verdict as string}&rdquo;
                </p>
                <button onClick={runScore} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "10px", padding: "7px 14px", color: "#888888", fontSize: "12px", cursor: "pointer" }}>
                  <RefreshCw style={{ width: "13px", height: "13px" }} />Re-score
                </button>
              </div>
            </div>

            {/* Top 3 improvements */}
            {(result.top_improvements as unknown[])?.length > 0 && (
              <div style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.09)", borderRadius: "20px", padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#111111", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <TrendingUp style={{ width: "16px", height: "16px", color: "#f59e0b" }} />Top 3 Improvements
                </h3>
                {(result.top_improvements as Array<{ title: string; detail: string }>).map((imp, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "14px", alignItems: "flex-start" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#0F6E55,#0A523F)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "12px", fontWeight: 900, color: "white" }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#111111", marginBottom: "3px" }}>{imp.title}</div>
                      <div style={{ fontSize: "13px", color: "#888888", lineHeight: 1.55 }}>{imp.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Category breakdown */}
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#111111", marginBottom: "12px" }}>
              Detailed Breakdown
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(result.categories as ScoreCategory[]).map((cat, i) => (
                <CategoryCard key={i} cat={cat} index={i} />
              ))}
            </div>

            {/* CTA for non-Pro */}
            <div style={{ marginTop: "24px", padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, rgba(15,110,85,0.1), rgba(245,158,11,0.06))", border: "1px solid rgba(15,110,85,0.2)", textAlign: "center" }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#111111", marginBottom: "4px" }}>
                Ready to fix these issues?
              </p>
              <p style={{ fontSize: "13px", color: "#888888", marginBottom: "14px" }}>
                Use Resume Adaptor to auto-fix gaps for a specific job description.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                <a href="/resume-adaptor" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", background: "linear-gradient(135deg,#0F6E55,#0A523F)", borderRadius: "12px", color: "white", textDecoration: "none", fontSize: "13px", fontWeight: 700 }}>
                  <Target style={{ width: "14px", height: "14px" }} />Adapt Resume
                </a>
                <a href="/resume-builder" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "12px", color: "#555555", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
                  <FileText style={{ width: "14px", height: "14px" }} />Edit Resume
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

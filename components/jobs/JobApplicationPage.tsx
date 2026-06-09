"use client";
import { useState, useRef } from "react";
import { API_BASE } from "@/lib/api/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Globe, Upload, FileText, Check, Clock,
  ChevronRight, Play, Bell, AlertCircle, ExternalLink,
} from "lucide-react";
import { useUser } from "@/lib/auth";
import { getLimits } from "@/lib/planLimits";
import UpgradeGate from "@/components/ui/UpgradeGate";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  applied:   { label: "Applied",    color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  screening: { label: "Screening",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  interview: { label: "Interview",  color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  offer:     { label: "Offer 🎉",   color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  rejected:  { label: "Rejected",   color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

const DOCS = [
  { name: "Resume_v3_Tailored.pdf",  type: "Resume",       defaultActive: true  },
  { name: "Cover_Letter.pdf",         type: "Cover Letter", defaultActive: true  },
  { name: "Portfolio.pdf",            type: "Portfolio",    defaultActive: false },
];

interface ApplyStep {
  status: string;
  message: string;
  detail?: string;
  progress: number;
}

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid rgba(124,58,237,0.2)",
  borderRadius: "16px",
  padding: "20px",
};

const inputRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "#FFFFFF",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: "10px",
  padding: "10px 14px",
  flex: 1,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  fontSize: "13px",
  color: "#111111",
  fontFamily: "inherit",
};

export default function JobApplicationPage() {
  const { user } = useUser();
  const limits = getLimits(user?.plan ?? "free");
  const [jobUrl, setJobUrl] = useState("");

  if (!limits.autoApplyAccess) {
    return (
      <div style={{ height: "100%", overflowY: "auto", background: "#F7F7F5", padding: "24px" }}>
        {/* Beta banner still visible */}
        <div style={{ maxWidth: "560px", margin: "0 auto 24px", display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderRadius: "14px", background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(124,58,237,0.08))", border: "1px solid rgba(245,158,11,0.25)" }}>
          <span style={{ fontSize: "18px" }}>⚗️</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "2px" }}>
              Auto-Apply <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "20px", background: "rgba(245,158,11,0.2)", color: "#f59e0b", marginLeft: "4px" }}>BETA</span>
            </div>
            <p style={{ fontSize: "12px", color: "#888888" }}>Launching fully with Elite plan. Currently in development.</p>
          </div>
        </div>
        <div style={{ maxWidth: "420px", margin: "0 auto" }}>
          <UpgradeGate
            requiredPlan="elite"
            featureName="Auto-Apply"
            description="AI opens, analyzes, fills and submits job applications automatically across all major portals. Available on the Elite plan when fully launched."
          />
        </div>
      </div>
    );
  }
  const [isApplying, setIsApplying] = useState(false);
  const [steps, setSteps] = useState<ApplyStep[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [applyDone, setApplyDone] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [docActive, setDocActive] = useState<Record<string, boolean>>({
    "Resume_v3_Tailored.pdf": true,
    "Cover_Letter.pdf": true,
    "Portfolio.pdf": false,
  });
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const saveToTracker = async (url: string, confirmId: string) => {
    try {
      // Extract company name from URL
      let company = "Applied Company";
      try {
        const domain = new URL(url).hostname.replace("www.", "").split(".")[0];
        company = domain.charAt(0).toUpperCase() + domain.slice(1);
      } catch { /* ignore */ }

      await fetch(
        `${API_BASE}/tracker/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company,
            role: "Applied Role",
            job_url: url,
            status: "applied",
            notes: `Auto-applied via Mithra AI. Confirmation: ${confirmId}`,
          }),
        }
      );
    } catch { /* tracker save is best-effort */ }
  };

  const startApply = async () => {
    if (!jobUrl.trim() || isApplying) return;
    setIsApplying(true);
    setSteps([]);
    setCurrentProgress(0);
    setApplyDone(false);
    setApplyError("");
    setConfirmation("");

    try {
      const response = await fetch(
        `${API_BASE}/apply/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_url: jobUrl,
            job_id: "manual",
            user_profile: { name: "Your Name", email: "your@email.com", phone: "+91-XXXXXXXXXX", location: "Bangalore, India" },
            resume_path: "",
            cover_letter: "",
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") {
              setApplyDone(true);
              setIsApplying(false);
              return;
            }
            try {
              const step: ApplyStep = JSON.parse(raw);
              setSteps((prev) => {
                const existing = prev.find((s) => s.status === step.status);
                if (existing) return prev.map((s) => s.status === step.status ? step : s);
                return [...prev, step];
              });
              setCurrentProgress(step.progress || 0);
              if (step.status === "done") {
                setApplyDone(true);
                setIsApplying(false);
                // Extract confirmation from detail
                const match = step.detail?.match(/Confirmation ID: ([A-Z0-9-]+)/);
                const confirmId = match ? match[1] : `APP-${Date.now().toString().slice(-6)}`;
                if (match) setConfirmation(confirmId);
                // Save to tracker
                saveToTracker(jobUrl, confirmId);
                return;
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
      setApplyDone(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setApplyError(`Failed to connect to backend: ${msg}. Make sure the backend is running on port 8000.`);
    } finally {
      setIsApplying(false);
    }
  };

  const cancelApply = () => {
    readerRef.current?.cancel();
    setIsApplying(false);
    setApplyError("Application cancelled.");
  };

  const toggleDoc = (name: string) => setDocActive((prev) => ({ ...prev, [name]: !prev[name] }));

  const doneSteps = steps.filter((s) => s.progress === 100 || (applyDone && s.status !== "done")).length;

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#F7F7F5" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Beta banner */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderRadius: "14px", background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(124,58,237,0.08))", border: "1px solid rgba(245,158,11,0.25)" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "18px" }}>⚗️</span>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "#111111" }}>Auto-Apply</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: "rgba(245,158,11,0.2)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)", letterSpacing: "0.5px" }}>BETA</span>
            </div>
            <p style={{ fontSize: "12px", color: "#888888" }}>
              Auto-Apply is in active development. Available on all plans — results are simulated until browser automation is fully deployed.
            </p>
          </div>
        </div>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111111" }}>Auto-Apply</h2>
            <p style={{ fontSize: "13px", color: "#888888", marginTop: "4px" }}>AI opens, analyzes, fills and submits job applications on your behalf</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "6px 14px", borderRadius: "20px", border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>
            <Zap style={{ width: "13px", height: "13px" }} />Auto-Apply
          </div>
        </div>

        <div className="ja-content-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

          {/* ── LEFT: Apply form ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={card}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111111" }}>Apply to a Job</h3>
                <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#fbbf24" }}>Demo Mode</span>
              </div>
              <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", fontSize: "11px", color: "#888888", lineHeight: 1.5, marginBottom: "14px" }}>
                ⚠️ <strong style={{ color: "#fbbf24" }}>Note:</strong> Auto-Apply currently simulates the process and does not submit real applications. All steps are shown for demonstration. Real Playwright-based submission requires browser access on a server. Applications are tracked in your Tracker tab.
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "11px", color: "#888888", display: "block", marginBottom: "8px" }}>Job Application URL</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={inputRow}>
                    <Globe style={{ width: "15px", height: "15px", color: "#888888", flexShrink: 0 }} />
                    <input value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && startApply()} style={inputStyle} placeholder="https://careers.google.com/apply/..." />
                  </div>
                  <button onClick={isApplying ? cancelApply : startApply} disabled={!jobUrl.trim() && !isApplying}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", border: "none", fontSize: "13px", fontWeight: 700, background: isApplying ? "rgba(239,68,68,0.8)" : (!jobUrl.trim() ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg,#7c3aed,#6d28d9)"), color: !jobUrl.trim() && !isApplying ? "rgba(255,255,255,0.4)" : "white", cursor: !jobUrl.trim() && !isApplying ? "not-allowed" : "pointer", flexShrink: 0 }}>
                    {isApplying ? (
                      <><motion.div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />Cancel</>
                    ) : (
                      <><Play style={{ width: "14px", height: "14px" }} />Apply</>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "#888888", display: "block", marginBottom: "8px" }}>Documents to Submit</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {DOCS.map((doc) => {
                    const active = docActive[doc.name] ?? doc.defaultActive;
                    return (
                      <div key={doc.name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${active ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.06)"}`, background: "rgba(0,0,0,0.02)" }}>
                        <FileText style={{ width: "16px", height: "16px", color: "#7c3aed", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12px", fontWeight: 500, color: "#111111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{doc.name}</div>
                          <div style={{ fontSize: "10px", color: "#888888" }}>{doc.type}</div>
                        </div>
                        <button onClick={() => toggleDoc(doc.name)} style={{ width: "20px", height: "20px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", background: active ? "#7c3aed" : "rgba(255,255,255,0.1)", flexShrink: 0 }}>
                          {active && <Check style={{ width: "12px", height: "12px", color: "white" }} />}
                        </button>
                      </div>
                    );
                  })}
                  <button style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.1)", background: "transparent", color: "#888888", fontSize: "12px", cursor: "pointer" }}>
                    <Upload style={{ width: "14px", height: "14px" }} />Upload New Document
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk apply */}
            <div style={{ ...card, borderColor: "rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.04)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f59e0b", marginBottom: "8px" }}>Bulk Apply</h3>
              <p style={{ fontSize: "12px", color: "#888888", marginBottom: "14px", lineHeight: "1.5" }}>Apply to multiple bookmarked jobs at once. AI tailors each application automatically.</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)" }}>
                <span style={{ fontSize: "13px", color: "#333333" }}>4 bookmarked jobs ready</span>
                <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#0f0a1e", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  <Zap style={{ width: "13px", height: "13px" }} />Apply All
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Live progress + history ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Error state */}
            {applyError && (
              <div style={{ ...card, borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", display: "flex", gap: "10px" }}>
                <AlertCircle style={{ width: "20px", height: "20px", color: "#ef4444", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#f87171", marginBottom: "4px" }}>Application Error</div>
                  <div style={{ fontSize: "12px", color: "#888888" }}>{applyError}</div>
                </div>
              </div>
            )}

            {/* Live progress panel */}
            <AnimatePresence>
              {(isApplying || (steps.length > 0)) && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={card}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111111" }}>Live Application Progress</h3>
                    <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "12px", fontWeight: 600, ...(applyDone ? { color: "#10b981", background: "rgba(16,185,129,0.15)" } : { color: "#7c3aed", background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", gap: "4px" }) }}>
                      {applyDone ? "Submitted ✓" : (
                        <><motion.div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a78bfa" }} animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} />Live</>
                      )}
                    </span>
                  </div>

                  {/* Overall progress bar */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#888888", marginBottom: "6px" }}>
                      <span>Progress</span>
                      <span>{currentProgress}%</span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "3px", background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                      <motion.div style={{ height: "100%", borderRadius: "3px", background: "linear-gradient(to right, #7c3aed, #06b6d4)" }} animate={{ width: `${currentProgress}%` }} transition={{ duration: 0.5 }} />
                    </div>
                  </div>

                  {/* Step-by-step log */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "300px", overflowY: "auto" }}>
                    {steps.map((step, i) => {
                      const isLast = i === steps.length - 1;
                      const isDone = step.status === "done" || (!isLast);
                      return (
                        <div key={step.status} style={{ padding: "8px 12px", borderRadius: "10px", border: isLast && isApplying ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent", background: isLast && isApplying ? "rgba(124,58,237,0.1)" : "transparent", transition: "all 0.3s" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: isDone ? "#10b981" : isLast && isApplying ? "#7c3aed" : "rgba(255,255,255,0.05)" }}>
                              {isDone ? (
                                <Check style={{ width: "12px", height: "12px", color: "white" }} />
                              ) : isLast && isApplying ? (
                                <motion.div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "white" }} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} />
                              ) : (
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "12px", color: isDone ? "#34d399" : isLast && isApplying ? "#f1f5f9" : "#475569", fontWeight: isLast && isApplying ? 600 : 400 }}>
                                {step.message}
                              </div>
                              {step.detail && (
                                <div style={{ fontSize: "11px", color: "#888888", marginTop: "2px" }}>{step.detail}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {applyDone && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: "16px", padding: "14px", borderRadius: "12px", textAlign: "center", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <div style={{ fontSize: "24px", marginBottom: "6px" }}>🎉</div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#10b981" }}>Application Submitted!</div>
                      {confirmation && <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>Confirmation: {confirmation}</div>}
                      <div style={{ fontSize: "12px", color: "#888888", marginTop: "6px" }}>Check your email for a confirmation from the company</div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Gmail email tracking tip */}
            <div style={{ ...card, borderColor: "rgba(66,133,244,0.2)", background: "rgba(66,133,244,0.04)" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#60a5fa", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Bell style={{ width: "14px", height: "14px" }} />Email Status Tracking
              </h3>
              <p style={{ fontSize: "12px", color: "#888888", lineHeight: 1.6, marginBottom: "12px" }}>
                Connect your Gmail to automatically detect company responses, interview invitations, and offer letters from your applied companies.
              </p>
              <button onClick={() => {}} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(66,133,244,0.3)", background: "rgba(66,133,244,0.08)", color: "#60a5fa", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                <ExternalLink style={{ width: "12px", height: "12px" }} />Connect Gmail (coming soon)
              </button>
            </div>

            {/* Recent applications widget */}
            {steps.length === 0 && !isApplying && (
              <div style={card}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111111", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock style={{ width: "15px", height: "15px", color: "#7c3aed" }} />How It Works
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { icon: "🔗", title: "Paste Job URL", desc: "Any job portal: LinkedIn, Naukri, Glassdoor, company careers page" },
                    { icon: "🤖", title: "AI Analyzes Form", desc: "Claude reads the application form structure and identifies all required fields" },
                    { icon: "✍️", title: "Auto-Fill", desc: "Your resume data fills name, email, phone, experience, education automatically" },
                    { icon: "📎", title: "Upload Documents", desc: "Tailored resume PDF and cover letter uploaded to the form" },
                    { icon: "✅", title: "Submit & Track", desc: "Application submitted. Check your email for the company's response" },
                  ].map((item) => (
                    <div key={item.title} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "18px", flexShrink: 0 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#111111" }}>{item.title}</div>
                        <div style={{ fontSize: "11px", color: "#888888", marginTop: "2px" }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";
import CoinCost from "@/components/ui/CoinCost";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Play, ChevronRight, Check, X, Sparkles,
  MessageSquare, Mic, Lightbulb, AlertCircle,
  Clock, Download, Code, Trophy, Target, GraduationCap,
} from "lucide-react";
import { api, streamSSE } from "@/lib/api/client";
import { useUser } from "@/lib/auth";

type Phase = "setup" | "loading" | "practice" | "feedback" | "report";

const QUESTION_TYPES = [
  { label: "Mixed", value: "mixed" },
  { label: "Behavioral", value: "behavioral" },
  { label: "Technical", value: "technical" },
  { label: "Aptitude", value: "aptitude" },
  { label: "System Design", value: "system_design" },
  { label: "Case Study", value: "case" },
  { label: "HR / Culture", value: "hr" },
];
const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];
const EXPERIENCE = [
  { label: "Fresher / Placement", value: "fresher" },
  { label: "Experienced", value: "experienced" },
];
const TIERS = [
  { label: "Dream", value: "dream", hint: "FAANG / top product" },
  { label: "Core", value: "core", hint: "strong product/CS" },
  { label: "Mass", value: "mass", hint: "service / bulk hiring" },
];
const COUNTS = [5, 8, 12];
const FORMATS = [
  { label: "Open (speak/type)", value: "open" },
  { label: "MCQ", value: "mcq" },
  { label: "Coding", value: "coding" },
];

interface Question {
  id: string;
  question: string;
  type: string;
  format?: "open" | "mcq" | "coding";
  difficulty: string;
  category: string;
  topic?: string;
  what_they_evaluate?: string;
  ideal_answer_structure?: string;
  time_limit_seconds?: number;
  options?: string[];
  correct_option?: number;
  explanation?: string;
  model_answer?: string;
}

interface Feedback {
  overall_score: number;
  star_breakdown: Record<string, { present: boolean; quality: number; feedback: string }>;
  strengths: string[];
  improvements: string[];
  ideal_answer_snippet: string;
  follow_up_prediction?: string;
}

interface SessionResult {
  id: string; question: string; type: string; topic: string;
  format: string; score: number; correct?: boolean; time_taken: number;
}

interface Report {
  readiness_score: number;
  band: string;
  headline?: string;
  summary?: string;
  dimensions: Record<string, number>;
  strengths: string[];
  improvements: string[];
  topic_performance: { topic: string; score: number; note?: string }[];
  study_plan: { title: string; detail: string }[];
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "#FFFFFF", border: "1px solid rgba(15,110,85,0.2)", borderRadius: "16px", padding: "20px",
};
const inputStyle: React.CSSProperties = {
  width: "100%", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px",
  padding: "10px 14px", color: "#111111", fontSize: "13px", outline: "none", fontFamily: "inherit",
};
const label: React.CSSProperties = { fontSize: "11px", color: "#888888", display: "block", marginBottom: "6px" };
const btnPrimary: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 24px",
  background: "linear-gradient(135deg,#0F6E55,#0A523F)", border: "none", borderRadius: "12px",
  color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(15,110,85,0.3)",
};
const btnOutline: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 20px",
  background: "none", border: "1px solid rgba(15,110,85,0.4)", borderRadius: "12px",
  color: "#0F6E55", fontSize: "13px", fontWeight: 600, cursor: "pointer",
};

// small pill toggle helper
function pill(active: boolean): React.CSSProperties {
  return {
    fontSize: "12px", padding: "7px 13px", borderRadius: "8px", fontWeight: 500, cursor: "pointer",
    border: `1px solid ${active ? "rgba(249,115,22,0.45)" : "rgba(0,0,0,0.08)"}`,
    background: active ? "rgba(249,115,22,0.2)" : "rgba(0,0,0,0.04)",
    color: active ? "#c2410c" : "#888888",
  };
}

function ScoreBar({ label: lbl, score }: { label: string; score: number }) {
  const color = score >= 8 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
        <span style={{ color: "#888888" }}>{lbl}</span>
        <span style={{ fontWeight: 700, color }}>{score}/10</span>
      </div>
      <div style={{ height: "6px", borderRadius: "3px", overflow: "hidden", background: "rgba(0,0,0,0.04)" }}>
        <motion.div style={{ height: "100%", borderRadius: "3px", background: color }} initial={{ width: 0 }} animate={{ width: `${score * 10}%` }} transition={{ duration: 0.8 }} />
      </div>
    </div>
  );
}

function DimBar({ label: lbl, score }: { label: string; score: number }) {
  const color = score >= 75 ? "#10b981" : score >= 55 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
        <span style={{ color: "#333333", fontWeight: 600 }}>{lbl}</span>
        <span style={{ fontWeight: 700, color }}>{score}</span>
      </div>
      <div style={{ height: "8px", borderRadius: "4px", overflow: "hidden", background: "rgba(0,0,0,0.05)" }}>
        <motion.div style={{ height: "100%", borderRadius: "4px", background: color }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, score)}%` }} transition={{ duration: 0.9 }} />
      </div>
    </div>
  );
}

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function InterviewPrepPage() {
  useUser();
  const [phase, setPhase] = useState<Phase>("setup");

  // setup inputs
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [selectedType, setSelectedType] = useState("mixed");
  const [difficulty, setDifficulty] = useState("Medium");
  const [topic, setTopic] = useState("");
  const [experience, setExperience] = useState("fresher");
  const [degree, setDegree] = useState("");
  const [companyTier, setCompanyTier] = useState("core");
  const [count, setCount] = useState(8);
  const [formats, setFormats] = useState<string[]>(["open", "mcq"]);

  // session
  const [questions, setQuestions] = useState<Question[]>([]);
  const [interviewTips, setInterviewTips] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [report, setReport] = useState<Report | null>(null);

  // per-question interactive state
  const [timeLeft, setTimeLeft] = useState(0);
  const [mcqChoice, setMcqChoice] = useState<number | null>(null);
  const [mcqSubmitted, setMcqSubmitted] = useState(false);
  const [revealModel, setRevealModel] = useState(false);
  const [selfScore, setSelfScore] = useState<number | null>(null);

  // coach
  const [coachMessages, setCoachMessages] = useState<{ role: string; content: string }[]>([]);
  const [coachInput, setCoachInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // voice
  const [isRecording, setIsRecording] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  useEffect(() => () => { try { recRef.current?.stop(); } catch { /* noop */ } }, []);

  const q = questions[currentQ];
  const qFormat = q?.format || "open";

  // ── timer: reset + tick per question while practicing ────────────────────────
  useEffect(() => {
    if (phase !== "practice" || !q) return;
    setTimeLeft(q.time_limit_seconds || 120);
    const iv = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [phase, currentQ, q]);

  const stopRec = () => { if (isRecording) { try { recRef.current?.stop(); } catch { /* noop */ } setIsRecording(false); } };

  const toggleRecord = () => {
    if (isRecording) { stopRec(); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { alert("Voice input isn't supported here. Use Chrome/Edge/Safari — or type your answer."); return; }
    const r = new SR();
    r.lang = "en-US"; r.continuous = true; r.interimResults = true;
    const prefix = answer ? answer.replace(/\s*$/, "") + " " : "";
    let finalChunk = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalChunk += t + " "; else interim += t;
      }
      setAnswer((prefix + finalChunk + interim).trimStart());
    };
    r.onerror = () => setIsRecording(false);
    r.onend = () => setIsRecording(false);
    recRef.current = r;
    try { r.start(); setIsRecording(true); } catch { setIsRecording(false); }
  };

  const startSession = async () => {
    if (!role.trim()) { setLoadError("Please enter the target role to generate relevant questions."); return; }
    if (formats.length === 0) { setLoadError("Pick at least one answer format."); return; }
    setLoadError(""); setPhase("loading");
    try {
      const { data } = await api.post("/interview/questions", {
        role: role.trim(), company: company.trim(), interview_type: selectedType,
        difficulty: difficulty.toLowerCase(), count, topic: topic.trim(),
        experience_level: experience, degree: degree.trim(), company_tier: companyTier, formats,
      });
      const qs: Question[] = data.questions || [];
      if (qs.length === 0) throw new Error("No questions returned");
      setQuestions(qs);
      setInterviewTips(data.interview_tips || "");
      setSessionResults([]); setReport(null);
      setCurrentQ(0); resetPerQuestion();
      setPhase("practice");
    } catch {
      setLoadError("Failed to generate questions. Please try again in a moment.");
      setPhase("setup");
    }
  };

  const resetPerQuestion = () => {
    setAnswer(""); setFeedback(null); setShowHints(false);
    setMcqChoice(null); setMcqSubmitted(false); setRevealModel(false); setSelfScore(null);
    stopRec();
  };

  // advance to next question or finish the session, recording this question's result
  const advanceWith = (res: SessionResult) => {
    const updated = [...sessionResults, res];
    setSessionResults(updated);
    if (currentQ < questions.length - 1) {
      setCurrentQ((p) => p + 1);
      resetPerQuestion();
      setPhase("practice");
    } else {
      finishSession(updated);
    }
  };

  const timeTaken = () => Math.max(0, (q?.time_limit_seconds || 120) - timeLeft);
  const baseResult = (score: number, extra?: Partial<SessionResult>): SessionResult => ({
    id: q.id, question: q.question, type: q.type, topic: q.topic || "General",
    format: qFormat, score, time_taken: timeTaken(), ...extra,
  });

  // OPEN: AI evaluation → feedback phase
  const evaluateAnswer = async () => {
    if (!answer.trim() || isEvaluating) return;
    stopRec(); setIsEvaluating(true);
    try {
      const { data } = await api.post("/interview/evaluate", {
        question: q.question, answer, role: role || "Software Engineer",
      });
      setFeedback(data); setPhase("feedback");
    } catch {
      setFeedback({
        overall_score: 72,
        star_breakdown: {
          Situation: { present: true, quality: 7, feedback: "Context was clear" },
          Task: { present: true, quality: 7, feedback: "Responsibility stated" },
          Action: { present: true, quality: 7, feedback: "Good actions described" },
          Result: { present: false, quality: 4, feedback: "Add a quantified outcome" },
        },
        strengths: ["Clear structure", "Specific example"],
        improvements: ["End with a metric", "Trim the setup"],
        ideal_answer_snippet: "...which improved the outcome measurably.",
        follow_up_prediction: "What would you do differently next time?",
      });
      setPhase("feedback");
    } finally { setIsEvaluating(false); }
  };

  const finishSession = async (results: SessionResult[]) => {
    setPhase("report"); setReport(null); stopRec();
    try {
      const { data } = await api.post("/interview/report", {
        role: role || "candidate", company, experience_level: experience, results,
      });
      setReport(data);
    } catch {
      const scored = results.filter((r) => typeof r.score === "number");
      const avg = scored.length ? Math.round(scored.reduce((a, r) => a + r.score, 0) / scored.length) : 60;
      setReport({
        readiness_score: avg,
        band: avg >= 78 ? "Placement Ready" : avg >= 55 ? "Almost There" : "Needs Work",
        headline: "Solid effort — keep drilling and your score will climb.",
        summary: "You completed the full session. Tighten structure, quantify results, and practice aloud.",
        dimensions: { Communication: avg, Structure: Math.max(40, avg - 8), Technical: avg, Confidence: Math.max(40, avg - 5), Domain: avg },
        strengths: ["Finished the full session", "Engaged with tough questions"],
        improvements: ["Use STAR and end with a metric", "Practice aloud to cut filler words", "Prepare 3 strong project stories"],
        topic_performance: [],
        study_plan: [
          { title: "Master your resume stories", detail: "Write STAR answers for your top 3 projects." },
          { title: "Drill fundamentals daily", detail: "30 min/day of aptitude + core-subject MCQs." },
          { title: "Mock aloud", detail: "Do 2 more timed voice mocks this week." },
        ],
      });
    }
  };

  const sendCoach = async () => {
    if (!coachInput.trim() || isStreaming) return;
    const msg = coachInput; setCoachInput("");
    setCoachMessages((prev) => [...prev, { role: "user", content: msg }]);
    setIsStreaming(true);
    setCoachMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    try {
      await streamSSE("/interview/coach/stream",
        { question: q?.question || "", answer, history: coachMessages },
        (chunk) => setCoachMessages((prev) => {
          const m = [...prev]; m[m.length - 1] = { ...m[m.length - 1], content: m[m.length - 1].content + chunk }; return m;
        }));
    } catch {
      setCoachMessages((prev) => { const m = [...prev]; m[m.length - 1] = { ...m[m.length - 1], content: "Connection error." }; return m; });
    } finally { setIsStreaming(false); }
  };

  const backToSetup = () => {
    stopRec(); setPhase("setup"); setQuestions([]); setCurrentQ(0);
    resetPerQuestion(); setSessionResults([]); setReport(null); setCoachMessages([]);
  };

  const bandColor = (b: string) => b === "Placement Ready" ? "#10b981" : b === "Almost There" ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#FAF7F1" }}>
      {/* print CSS — isolates the report card for "Download PDF" */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #ip-report-print, #ip-report-print * { visibility: visible !important; }
          #ip-report-print { position: absolute; left: 0; top: 0; width: 100%; padding: 12px; }
          .ip-noprint { display: none !important; }
        }
      `}</style>
      <div className="ip-page" style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Header */}
        <div className="ip-noprint" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111111" }}>Interview Prep</h2>
            <p style={{ fontSize: "13px", color: "#888888", marginTop: "4px" }}>
              Timed mock interviews with voice, MCQs, coding & a placement-readiness report
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {phase !== "setup" && (
              <button onClick={backToSetup} style={{ ...btnOutline, fontSize: "12px", padding: "7px 14px" }}>← New Session</button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "6px 14px", borderRadius: "20px", border: "1px solid rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.08)", color: "#c2410c" }}>
              <Brain style={{ width: "13px", height: "13px" }} />Interview Coach
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── SETUP ── */}
          {phase === "setup" && (
            <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="ip-setup-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px" }}>
                <div style={card}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111111", marginBottom: "4px" }}>Session Setup</h3>
                  <p style={{ fontSize: "12px", color: "#888888", marginBottom: "16px" }}>Tune it to exactly the interview you&apos;re preparing for.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={label}>Target Role *</label>
                      <input value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle} placeholder="Data Analyst, SDE, Product Manager..." />
                    </div>

                    <div>
                      <label style={label}>I am a…</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {EXPERIENCE.map((e) => (
                          <button key={e.value} onClick={() => setExperience(e.value)} style={{ ...pill(experience === e.value), flex: 1 }}>{e.label}</button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={label}>Degree & branch (optional)</label>
                        <input value={degree} onChange={(e) => setDegree(e.target.value)} style={inputStyle} placeholder="B.Tech CSE, MBA-Finance..." />
                      </div>
                      <div>
                        <label style={label}>Target company (optional)</label>
                        <input value={company} onChange={(e) => setCompany(e.target.value)} style={inputStyle} placeholder="Google, Deloitte, TCS..." />
                      </div>
                    </div>

                    <div>
                      <label style={label}>Company tier</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {TIERS.map((t) => (
                          <button key={t.value} onClick={() => setCompanyTier(t.value)} title={t.hint} style={{ ...pill(companyTier === t.value), flex: 1 }}>{t.label}</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={label}>Focus topic <span style={{ color: "#c2410c" }}>(optional — target a specific area)</span></label>
                      <input value={topic} onChange={(e) => setTopic(e.target.value)} style={inputStyle} placeholder="e.g. SQL joins, DSA - trees, guesstimates, DCF modeling" />
                    </div>

                    <div>
                      <label style={label}>Question focus</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {QUESTION_TYPES.map((t) => (
                          <button key={t.value} onClick={() => setSelectedType(t.value)} style={pill(selectedType === t.value)}>{t.label}</button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={label}>Difficulty</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {DIFFICULTY_LEVELS.map((d) => (
                            <button key={d} onClick={() => setDifficulty(d)} style={{ ...pill(difficulty === d), flex: 1 }}>{d}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={label}>Questions</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {COUNTS.map((c) => (
                            <button key={c} onClick={() => setCount(c)} style={{ ...pill(count === c), flex: 1 }}>{c}</button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={label}>Answer formats</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {FORMATS.map((f) => {
                          const on = formats.includes(f.value);
                          return (
                            <button key={f.value}
                              onClick={() => setFormats((prev) => on ? prev.filter((x) => x !== f.value) : [...prev, f.value])}
                              style={pill(on)}>
                              {on ? "✓ " : ""}{f.label}
                            </button>
                          );
                        })}
                      </div>
                      <p style={{ fontSize: "11px", color: "#888888", marginTop: "6px" }}>MCQs are auto-graded instantly · Coding shows a model answer to self-check.</p>
                    </div>

                    {loadError && (
                      <div style={{ display: "flex", gap: "8px", padding: "10px 12px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "12px", color: "#dc2626" }}>
                        <AlertCircle style={{ width: "14px", height: "14px", flexShrink: 0, marginTop: "1px" }} />{loadError}
                      </div>
                    )}

                    <button onClick={startSession} style={{ ...btnPrimary, width: "100%" }}>
                      <Play style={{ width: "16px", height: "16px" }} />
                      Generate Questions & Start <CoinCost n={15} onDark />
                    </button>
                  </div>
                </div>

                {/* Info panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={card}>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111111", marginBottom: "14px" }}>What you get</h3>
                    {[
                      { emoji: "⏱️", title: "Timed & realistic", desc: "A countdown per question simulates real interview pressure." },
                      { emoji: "🎙️", title: "Speak or type", desc: "Answer aloud with live transcription — the #1 placement skill." },
                      { emoji: "✅", title: "Auto-graded MCQs", desc: "Instant scoring + explanations for aptitude & fundamentals." },
                      { emoji: "💻", title: "Coding rounds", desc: "Solve, then compare against a model answer and self-score." },
                      { emoji: "📊", title: "Readiness report", desc: "Final score, dimension breakdown, study plan + PDF at the end." },
                    ].map((item) => (
                      <div key={item.title} style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
                        <span style={{ fontSize: "20px", flexShrink: 0 }}>{item.emoji}</span>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#111111" }}>{item.title}</div>
                          <div style={{ fontSize: "12px", color: "#888888", marginTop: "2px" }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ ...card, borderColor: "rgba(249,115,22,0.2)", background: "rgba(249,115,22,0.04)" }}>
                    <p style={{ fontSize: "12px", color: "#c2410c", fontWeight: 600, marginBottom: "6px" }}>💡 For placements</p>
                    <p style={{ fontSize: "12px", color: "#888888", lineHeight: 1.6 }}>
                      Pick <strong>Fresher</strong>, add your <strong>branch</strong>, keep <strong>MCQ + Open</strong> on, and set a <strong>focus topic</strong> from your target company&apos;s pattern (e.g. &ldquo;guesstimates&rdquo; for consulting, &ldquo;DSA - arrays&rdquo; for product).
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── LOADING ── */}
          {phase === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ ...card, textAlign: "center", padding: "60px 40px" }}>
                <motion.div style={{ width: "60px", height: "60px", borderRadius: "50%", border: "3px solid rgba(249,115,22,0.2)", borderTopColor: "#f97316", margin: "0 auto 20px" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111111", marginBottom: "8px" }}>Building your interview…</h3>
                <p style={{ fontSize: "13px", color: "#888888" }}>
                  {count} {difficulty.toLowerCase()} questions{topic ? ` on ${topic}` : ""}{role ? ` for ${role}` : ""}{company ? ` at ${company}` : ""}.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── PRACTICE ── */}
          {phase === "practice" && q && (
            <motion.div key="practice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {interviewTips && (
                <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)", fontSize: "12px", color: "#c2410c", marginBottom: "20px", lineHeight: 1.6 }}>
                  <strong>💡 Tips for {company || "this role"}:</strong> {interviewTips}
                </div>
              )}

              <div className="ip-practice-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Progress + timer */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1, height: "6px", borderRadius: "3px", overflow: "hidden", background: "rgba(0,0,0,0.06)" }}>
                      <div style={{ height: "100%", borderRadius: "3px", background: "#f97316", width: `${((currentQ + 1) / questions.length) * 100}%`, transition: "width 0.3s ease" }} />
                    </div>
                    <span style={{ fontSize: "12px", color: "#888888", flexShrink: 0 }}>{currentQ + 1} / {questions.length}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700, flexShrink: 0, color: timeLeft <= 15 ? "#ef4444" : timeLeft <= 30 ? "#f59e0b" : "#0F6E55" }}>
                      <Clock style={{ width: "14px", height: "14px" }} />{fmtTime(timeLeft)}
                    </span>
                  </div>

                  <div style={card}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "12px", fontWeight: 600, background: "rgba(249,115,22,0.15)", color: "#c2410c" }}>
                        {(q.type || "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      {qFormat !== "open" && (
                        <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "12px", fontWeight: 700, background: qFormat === "mcq" ? "rgba(59,130,246,0.15)" : "rgba(124,58,237,0.15)", color: qFormat === "mcq" ? "#2563eb" : "#7c3aed", display: "flex", alignItems: "center", gap: "4px" }}>
                          {qFormat === "coding" ? <Code style={{ width: "11px", height: "11px" }} /> : null}{qFormat.toUpperCase()}
                        </span>
                      )}
                      <span style={{ fontSize: "12px", color: "#888888" }}>{q.topic ? `${q.topic} · ` : ""}{q.difficulty}</span>
                      {q.what_they_evaluate && (
                        <button onClick={() => setShowHints(!showHints)} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", background: "none", border: "none", cursor: "pointer", color: showHints ? "#c2410c" : "#475569" }}>
                          <Lightbulb style={{ width: "12px", height: "12px" }} />{showHints ? "Hide hints" : "Show hints"}
                        </button>
                      )}
                    </div>

                    <p style={{ color: "#111111", fontSize: "15px", lineHeight: "1.6", fontWeight: 600, marginBottom: "12px" }}>{q.question}</p>

                    {showHints && q.what_they_evaluate && (
                      <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)", marginBottom: "12px" }}>
                        <div style={{ fontSize: "11px", color: "#c2410c", fontWeight: 600, marginBottom: "4px" }}>What they evaluate:</div>
                        <div style={{ fontSize: "12px", color: "#888888" }}>{q.what_they_evaluate}</div>
                        {q.ideal_answer_structure && (
                          <>
                            <div style={{ fontSize: "11px", color: "#c2410c", fontWeight: 600, marginTop: "8px", marginBottom: "4px" }}>Ideal structure:</div>
                            <div style={{ fontSize: "12px", color: "#888888" }}>{q.ideal_answer_structure}</div>
                          </>
                        )}
                      </div>
                    )}

                    {/* ── MCQ ── */}
                    {qFormat === "mcq" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {(q.options || []).map((opt, i) => {
                          const chosen = mcqChoice === i;
                          const correct = q.correct_option === i;
                          let bg = "rgba(0,0,0,0.02)", bd = "rgba(0,0,0,0.1)", col = "#333333";
                          if (mcqSubmitted) {
                            if (correct) { bg = "rgba(16,185,129,0.1)"; bd = "rgba(16,185,129,0.5)"; col = "#059669"; }
                            else if (chosen) { bg = "rgba(239,68,68,0.08)"; bd = "rgba(239,68,68,0.4)"; col = "#dc2626"; }
                          } else if (chosen) { bg = "rgba(59,130,246,0.08)"; bd = "rgba(59,130,246,0.5)"; col = "#2563eb"; }
                          return (
                            <button key={i} disabled={mcqSubmitted} onClick={() => setMcqChoice(i)}
                              style={{ textAlign: "left", padding: "11px 14px", borderRadius: "10px", border: `1px solid ${bd}`, background: bg, color: col, fontSize: "13px", fontWeight: chosen || (mcqSubmitted && correct) ? 700 : 500, cursor: mcqSubmitted ? "default" : "pointer", display: "flex", gap: "8px", alignItems: "center" }}>
                              <span style={{ fontWeight: 700 }}>{String.fromCharCode(65 + i)}.</span>{opt}
                              {mcqSubmitted && correct && <Check style={{ width: "15px", height: "15px", marginLeft: "auto" }} />}
                              {mcqSubmitted && chosen && !correct && <X style={{ width: "15px", height: "15px", marginLeft: "auto" }} />}
                            </button>
                          );
                        })}
                        {mcqSubmitted && q.explanation && (
                          <div style={{ marginTop: "6px", padding: "10px 12px", borderRadius: "10px", background: "rgba(15,110,85,0.05)", border: "1px solid rgba(15,110,85,0.2)", fontSize: "12px", color: "#333333", lineHeight: 1.6 }}>
                            <strong style={{ color: "#0F6E55" }}>Why:</strong> {q.explanation}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                          {!mcqSubmitted ? (
                            <button onClick={() => { if (mcqChoice !== null) setMcqSubmitted(true); }} disabled={mcqChoice === null}
                              style={{ ...btnPrimary, opacity: mcqChoice === null ? 0.6 : 1, cursor: mcqChoice === null ? "not-allowed" : "pointer" }}>
                              <Check style={{ width: "16px", height: "16px" }} />Submit
                            </button>
                          ) : (
                            <button onClick={() => advanceWith(baseResult(mcqChoice === q.correct_option ? 100 : 0, { correct: mcqChoice === q.correct_option }))} style={btnPrimary}>
                              {currentQ < questions.length - 1 ? "Next →" : "See my report →"}
                            </button>
                          )}
                          {!mcqSubmitted && (
                            <button onClick={() => advanceWith(baseResult(0, { correct: false }))} style={{ ...btnOutline, color: "#888888", borderColor: "rgba(0,0,0,0.12)" }}>Skip</button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── CODING ── */}
                    {qFormat === "coding" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <label style={label}>Your solution</label>
                        <textarea rows={10} value={answer} onChange={(e) => setAnswer(e.target.value)}
                          spellCheck={false}
                          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "13px", background: "#0f172a", color: "#e2e8f0", border: "1px solid #1e293b" }}
                          placeholder="// write your approach or code here" />
                        {!revealModel ? (
                          <button onClick={() => setRevealModel(true)} style={{ ...btnOutline, alignSelf: "flex-start" }}>
                            <Lightbulb style={{ width: "15px", height: "15px" }} />Reveal model answer
                          </button>
                        ) : (
                          <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.2)" }}>
                            <div style={{ fontSize: "11px", color: "#7c3aed", fontWeight: 700, marginBottom: "6px" }}>MODEL ANSWER</div>
                            <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px", color: "#333333", fontFamily: "ui-monospace, Menlo, monospace", lineHeight: 1.6, margin: 0 }}>{q.model_answer || q.ideal_answer_structure || "Compare your approach against the optimal time/space complexity."}</pre>
                          </div>
                        )}
                        {revealModel && (
                          <>
                            <label style={label}>How did you do?</label>
                            <div style={{ display: "flex", gap: "8px" }}>
                              {[{ l: "Nailed it", v: 100, c: "#10b981" }, { l: "Partial", v: 60, c: "#f59e0b" }, { l: "Missed it", v: 20, c: "#ef4444" }].map((o) => (
                                <button key={o.v} onClick={() => setSelfScore(o.v)} style={{ flex: 1, padding: "9px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: `1px solid ${selfScore === o.v ? o.c : "rgba(0,0,0,0.12)"}`, background: selfScore === o.v ? `${o.c}18` : "rgba(0,0,0,0.02)", color: selfScore === o.v ? o.c : "#888888" }}>{o.l}</button>
                              ))}
                            </div>
                            <button onClick={() => advanceWith(baseResult(selfScore ?? 40))} disabled={selfScore === null}
                              style={{ ...btnPrimary, opacity: selfScore === null ? 0.6 : 1, cursor: selfScore === null ? "not-allowed" : "pointer", marginTop: "4px" }}>
                              {currentQ < questions.length - 1 ? "Next →" : "See my report →"}
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* ── OPEN ── */}
                    {qFormat === "open" && (
                      <>
                        <label style={label}>Your answer {q.type === "behavioral" ? "(use STAR)" : ""}</label>
                        <textarea rows={8} value={answer} onChange={(e) => setAnswer(e.target.value)}
                          style={{ ...inputStyle, resize: "none", lineHeight: "1.7" }}
                          placeholder={"Speak it aloud with Record, or type here.\nSituation → Task → Action → Result (with a metric)."} />
                        <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
                          <button onClick={evaluateAnswer} disabled={!answer.trim() || isEvaluating}
                            style={{ ...btnPrimary, opacity: !answer.trim() || isEvaluating ? 0.6 : 1, cursor: !answer.trim() || isEvaluating ? "not-allowed" : "pointer" }}>
                            {isEvaluating ? <motion.div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} /> : <Sparkles style={{ width: "16px", height: "16px" }} />}
                            {isEvaluating ? "Evaluating…" : "Get AI Feedback"}
                          </button>
                          <button onClick={toggleRecord} style={{ ...btnOutline, ...(isRecording ? { color: "#DC2626", borderColor: "rgba(220,38,38,0.4)", background: "rgba(220,38,38,0.06)" } : {}) }} title={isRecording ? "Stop recording" : "Record by voice"}>
                            {isRecording ? (<><motion.span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#DC2626", display: "inline-block" }} animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} />Stop</>) : (<><Mic style={{ width: "15px", height: "15px" }} />Record</>)}
                          </button>
                          <button onClick={() => advanceWith(baseResult(0))} style={{ ...btnOutline, color: "#888888", borderColor: "rgba(0,0,0,0.12)" }}>Skip →</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Coach panel */}
                <div style={{ ...card, display: "flex", flexDirection: "column", minHeight: "400px" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <MessageSquare style={{ width: "15px", height: "15px", color: "#c2410c" }} />Ask Coach
                  </h3>
                  <div style={{ flex: 1, overflowY: "auto", marginBottom: "12px", maxHeight: "320px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {coachMessages.length === 0 && (
                      <div style={{ textAlign: "center", padding: "24px 16px" }}>
                        <Brain style={{ width: "36px", height: "36px", color: "#888888", margin: "0 auto 10px" }} />
                        <p style={{ fontSize: "12px", color: "#888888" }}>Ask your coach anything about this question</p>
                        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                          {["How do I structure a STAR answer?", "What follow-ups should I expect?", "How long should I speak?"].map((s) => (
                            <button key={s} onClick={() => setCoachInput(s)} style={{ width: "100%", textAlign: "left", fontSize: "11px", padding: "8px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)", color: "#888888", cursor: "pointer" }}>{s}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {coachMessages.map((m, i) => (
                      <div key={i} style={{ fontSize: "12px", lineHeight: "1.6", padding: "8px 12px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role === "user" ? "linear-gradient(135deg,#0F6E55,#0A523F)" : "rgba(0,0,0,0.04)", border: m.role === "user" ? "none" : "1px solid rgba(0,0,0,0.08)", color: m.role === "user" ? "white" : "#333333" }}>{m.content || "…"}</div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input value={coachInput} onChange={(e) => setCoachInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendCoach()} style={{ ...inputStyle, fontSize: "12px", padding: "8px 12px" }} placeholder="Ask coach…" />
                    <button onClick={sendCoach} disabled={isStreaming} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 12px", background: "linear-gradient(135deg,#0F6E55,#0A523F)", border: "none", borderRadius: "10px", cursor: "pointer", flexShrink: 0 }}>
                      <ChevronRight style={{ width: "14px", height: "14px", color: "white" }} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── FEEDBACK (open questions) ── */}
          {phase === "feedback" && feedback && (
            <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ marginBottom: "12px", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", fontSize: "13px", color: "#888888", border: "1px solid rgba(0,0,0,0.08)" }}>
                <strong style={{ color: "#333333" }}>Q{currentQ + 1}:</strong> {q?.question}
              </div>
              <div className="ip-feedback-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ ...card, textAlign: "center" }}>
                    <div style={{ fontSize: "56px", fontWeight: 900, marginBottom: "8px", color: feedback.overall_score >= 80 ? "#10b981" : feedback.overall_score >= 60 ? "#f59e0b" : "#ef4444" }}>{feedback.overall_score}</div>
                    <div style={{ fontSize: "13px", color: "#888888", marginBottom: "20px" }}>Answer Score</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
                      {Object.entries(feedback.star_breakdown).map(([lbl, data]) => (<ScoreBar key={lbl} label={lbl} score={data.quality} />))}
                    </div>
                  </div>
                  {feedback.follow_up_prediction && (
                    <div style={{ ...card, borderColor: "rgba(249,115,22,0.2)", background: "rgba(249,115,22,0.04)" }}>
                      <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#c2410c", marginBottom: "6px" }}>🎯 Likely Follow-up</h4>
                      <p style={{ fontSize: "12px", color: "#888888", lineHeight: 1.6 }}>{feedback.follow_up_prediction}</p>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={() => advanceWith(baseResult(feedback.overall_score))} style={{ ...btnPrimary, flex: 1 }}>
                      {currentQ < questions.length - 1 ? "Next Question →" : "See my report →"}
                    </button>
                    <button onClick={() => { setFeedback(null); setPhase("practice"); }} style={{ ...btnOutline, flex: 1 }}>Retry</button>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={card}>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#10b981", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}><Check style={{ width: "15px", height: "15px" }} />Strengths</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {feedback.strengths.map((s, i) => (<div key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "#333333" }}><Check style={{ width: "15px", height: "15px", color: "#10b981", flexShrink: 0, marginTop: "2px" }} />{s}</div>))}
                    </div>
                  </div>
                  <div style={card}>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}><Sparkles style={{ width: "15px", height: "15px" }} />Improvements</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {feedback.improvements.map((s, i) => (<div key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "#333333" }}><ChevronRight style={{ width: "15px", height: "15px", color: "#f59e0b", flexShrink: 0, marginTop: "2px" }} />{s}</div>))}
                    </div>
                  </div>
                  <div style={{ ...card, borderColor: "rgba(15,110,85,0.25)", background: "rgba(15,110,85,0.05)" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0F6E55", marginBottom: "8px" }}>Ideal Closing Line</h4>
                    <p style={{ fontSize: "13px", color: "#333333", fontStyle: "italic", lineHeight: "1.6" }}>&ldquo;{feedback.ideal_answer_snippet}&rdquo;</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── REPORT ── */}
          {phase === "report" && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {!report ? (
                <div style={{ ...card, textAlign: "center", padding: "60px 40px" }}>
                  <motion.div style={{ width: "56px", height: "56px", borderRadius: "50%", border: "3px solid rgba(15,110,85,0.2)", borderTopColor: "#0F6E55", margin: "0 auto 18px" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111111" }}>Analysing your session…</h3>
                  <p style={{ fontSize: "13px", color: "#888888", marginTop: "6px" }}>Scoring your answers and building your readiness report.</p>
                </div>
              ) : (
                <div id="ip-report-print">
                  {/* Hero */}
                  <div style={{ ...card, background: "linear-gradient(135deg,#0F6E55,#0A523F)", border: "none", color: "white", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
                    <div style={{ width: "128px", height: "128px", borderRadius: "50%", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `conic-gradient(${bandColor(report.band)} ${report.readiness_score * 3.6}deg, rgba(255,255,255,0.15) 0deg)` }}>
                      <div style={{ width: "104px", height: "104px", borderRadius: "50%", background: "#0c5745", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "34px", fontWeight: 900, lineHeight: 1 }}>{report.readiness_score}</span>
                        <span style={{ fontSize: "10px", opacity: 0.8 }}>/ 100</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: "240px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", background: "rgba(255,255,255,0.15)", marginBottom: "8px" }}>
                        <Trophy style={{ width: "13px", height: "13px" }} />{report.band}
                      </div>
                      <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "6px" }}>Placement Readiness Report</h2>
                      <p style={{ fontSize: "13px", opacity: 0.92, lineHeight: 1.6 }}>{report.headline || report.summary}</p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }} className="ip-feedback-grid">
                    {/* Dimensions */}
                    <div style={card}>
                      <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}><Target style={{ width: "15px", height: "15px", color: "#0F6E55" }} />Skill breakdown</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {Object.entries(report.dimensions || {}).map(([k, v]) => (<DimBar key={k} label={k} score={v} />))}
                      </div>
                      {report.summary && report.headline && (
                        <p style={{ fontSize: "12px", color: "#888888", lineHeight: 1.6, marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>{report.summary}</p>
                      )}
                    </div>

                    {/* Topic performance */}
                    <div style={card}>
                      <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "14px" }}>Topic performance</h4>
                      {report.topic_performance && report.topic_performance.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {report.topic_performance.map((t, i) => (<DimBar key={i} label={t.topic} score={t.score} />))}
                        </div>
                      ) : (
                        <p style={{ fontSize: "12px", color: "#888888" }}>Topic-level scores appear here once you answer topic-tagged questions.</p>
                      )}
                    </div>

                    {/* Strengths */}
                    <div style={card}>
                      <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#10b981", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}><Check style={{ width: "15px", height: "15px" }} />What&apos;s working</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {(report.strengths || []).map((s, i) => (<div key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "#333333" }}><Check style={{ width: "15px", height: "15px", color: "#10b981", flexShrink: 0, marginTop: "2px" }} />{s}</div>))}
                      </div>
                    </div>

                    {/* Improvements */}
                    <div style={card}>
                      <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}><Sparkles style={{ width: "15px", height: "15px" }} />Fix these first</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {(report.improvements || []).map((s, i) => (<div key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "#333333" }}><ChevronRight style={{ width: "15px", height: "15px", color: "#f59e0b", flexShrink: 0, marginTop: "2px" }} />{s}</div>))}
                      </div>
                    </div>
                  </div>

                  {/* Study plan */}
                  <div style={{ ...card, marginTop: "24px" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}><GraduationCap style={{ width: "16px", height: "16px", color: "#0F6E55" }} />Your study plan</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "12px" }}>
                      {(report.study_plan || []).map((s, i) => (
                        <div key={i} style={{ padding: "14px", borderRadius: "12px", border: "1px solid rgba(15,110,85,0.18)", background: "rgba(15,110,85,0.04)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#0F6E55", color: "white", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#111111" }}>{s.title}</span>
                          </div>
                          <p style={{ fontSize: "12px", color: "#888888", lineHeight: 1.6 }}>{s.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ip-noprint" style={{ display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap" }}>
                    <button onClick={() => window.print()} style={btnPrimary}><Download style={{ width: "16px", height: "16px" }} />Download PDF</button>
                    <button onClick={backToSetup} style={btnOutline}><Play style={{ width: "15px", height: "15px" }} />Practice again</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

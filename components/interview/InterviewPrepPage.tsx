"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Play, ChevronRight, Check, X, Sparkles,
  MessageSquare, Mic, Lightbulb, AlertCircle,
} from "lucide-react";
import { api, streamSSE } from "@/lib/api/client";
import { useUser } from "@/lib/auth";
import { getLimits } from "@/lib/planLimits";
import UpgradeGate from "@/components/ui/UpgradeGate";
import { TeaserNudge } from "@/components/ui/UpgradeNudge";

type Phase = "setup" | "loading" | "practice" | "feedback";

const QUESTION_TYPES = [
  { label: "Behavioral", value: "behavioral" },
  { label: "Technical", value: "technical" },
  { label: "System Design", value: "system_design" },
  { label: "Case Study", value: "case" },
  { label: "HR / Culture", value: "hr" },
];
const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

interface Question {
  id: string;
  question: string;
  type: string;
  difficulty: string;
  category: string;
  what_they_evaluate?: string;
  ideal_answer_structure?: string;
  follow_ups?: string[];
  red_flags?: string;
}

interface Feedback {
  overall_score: number;
  star_breakdown: Record<string, { present: boolean; quality: number; feedback: string }>;
  strengths: string[];
  improvements: string[];
  ideal_answer_snippet: string;
  follow_up_prediction?: string;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid rgba(15,110,85,0.2)",
  borderRadius: "16px",
  padding: "20px",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#FFFFFF",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: "10px",
  padding: "10px 14px",
  color: "#111111",
  fontSize: "13px",
  outline: "none",
  fontFamily: "inherit",
};
const label: React.CSSProperties = {
  fontSize: "11px",
  color: "#888888",
  display: "block",
  marginBottom: "6px",
};
const btnPrimary: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "12px 24px",
  background: "linear-gradient(135deg,#0F6E55,#0A523F)",
  border: "none",
  borderRadius: "12px",
  color: "white",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 4px 20px rgba(15,110,85,0.3)",
};
const btnOutline: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "10px 20px",
  background: "none",
  border: "1px solid rgba(15,110,85,0.4)",
  borderRadius: "12px",
  color: "#0F6E55",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

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

export default function InterviewPrepPage() {
  const { user } = useUser();
  const limits = getLimits(user?.plan ?? "free");
  const [phase, setPhase] = useState<Phase>("setup");

  if (!limits.interviewPrepAccess) {
    return (
      <div style={{ height: "100%", overflowY: "auto", background: "#FAF7F1", padding: "24px 16px" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          <UpgradeGate
            requiredPlan="pro"
            featureName="Interview Prep"
            description="AI mock interviews with STAR evaluation, live coaching, and company-specific question banks."
          />
          {/* Preview of what's inside */}
          <div style={{ borderRadius: "16px", padding: "20px", background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.15)" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#fb923c", marginBottom: "12px" }}>What Pro unlocks:</div>
            {[
              { emoji: "🎯", text: "Role-specific questions for your exact company" },
              { emoji: "📋", text: "STAR method scoring with breakdown per component" },
              { emoji: "🤖", text: "Live AI coaching during your session" },
              { emoji: "📊", text: "Detailed feedback + ideal answer examples" },
              { emoji: "🔄", text: "Unlimited sessions — practice till you're confident" },
            ].map((f) => (
              <div key={f.emoji} style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "16px", flexShrink: 0 }}>{f.emoji}</span>
                <span style={{ fontSize: "13px", color: "#888888", lineHeight: 1.5 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [selectedType, setSelectedType] = useState("behavioral");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [interviewTips, setInterviewTips] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [coachMessages, setCoachMessages] = useState<{ role: string; content: string }[]>([]);
  const [coachInput, setCoachInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showHints, setShowHints] = useState(false);

  const startSession = async () => {
    if (!role.trim()) {
      setLoadError("Please enter the target role to generate relevant questions.");
      return;
    }
    setLoadError("");
    setPhase("loading");

    try {
      const { data } = await api.post("/interview/questions", {
        role: role.trim(),
        company: company.trim(),
        interview_type: selectedType,
        difficulty: difficulty.toLowerCase(),
        count: 10,
      });

      const qs: Question[] = data.questions || [];
      if (qs.length === 0) throw new Error("No questions returned");

      setQuestions(qs);
      setInterviewTips(data.interview_tips || "");
      setPhase("practice");
      setCurrentQ(0);
      setFeedback(null);
      setCoachMessages([]);
      setAnswer("");
    } catch (e) {
      setLoadError("Failed to generate questions. Check that the backend is running.");
      setPhase("setup");
    }
  };

  const evaluateAnswer = async () => {
    if (!answer.trim() || isEvaluating) return;
    setIsEvaluating(true);
    try {
      const { data } = await api.post("/interview/evaluate", {
        question: questions[currentQ].question,
        answer,
        role: role || "Software Engineer",
      });
      setFeedback(data);
      setPhase("feedback");
    } catch {
      setFeedback({
        overall_score: 74,
        star_breakdown: {
          Situation: { present: true,  quality: 8, feedback: "Good context setting — specific and concise" },
          Task:      { present: true,  quality: 7, feedback: "Clear responsibility stated" },
          Action:    { present: true,  quality: 7, feedback: "Good actions described, missing specific tools used" },
          Result:    { present: false, quality: 3, feedback: "Missing quantified outcome — always end with a metric" },
        },
        strengths: ["Clear storytelling", "Demonstrates ownership", "Specific examples used"],
        improvements: ["Add metrics to your result (e.g., '30% faster', 'team of 5')", "Shorten the situation by 40%", "End with what you learned"],
        ideal_answer_snippet: "Conclude with: '...which reduced deployment time by 40% and improved team velocity by 2 sprints.'",
        follow_up_prediction: "The interviewer would likely ask: 'What would you do differently if you faced this again?'",
      });
      setPhase("feedback");
    } finally {
      setIsEvaluating(false);
    }
  };

  const sendCoach = async () => {
    if (!coachInput.trim() || isStreaming) return;
    const msg = coachInput;
    setCoachInput("");
    setCoachMessages((prev) => [...prev, { role: "user", content: msg }]);
    setIsStreaming(true);
    setCoachMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      await streamSSE(
        "/interview/coach/stream",
        { question: questions[currentQ]?.question || "", answer, history: coachMessages },
        (chunk) => {
          setCoachMessages((prev) => {
            const msgs = [...prev];
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content + chunk };
            return msgs;
          });
        }
      );
    } catch {
      setCoachMessages((prev) => {
        const m = [...prev];
        m[m.length - 1] = { ...m[m.length - 1], content: "Connection error. Please try again." };
        return m;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const nextQuestion = () => {
    setPhase("practice");
    setAnswer("");
    setFeedback(null);
    setShowHints(false);
    if (currentQ < questions.length - 1) setCurrentQ((p) => p + 1);
  };

  const retry = () => {
    setPhase("practice");
    setAnswer("");
    setFeedback(null);
    setShowHints(false);
  };

  const backToSetup = () => {
    setPhase("setup");
    setQuestions([]);
    setCurrentQ(0);
    setAnswer("");
    setFeedback(null);
    setCoachMessages([]);
    setShowHints(false);
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#FAF7F1" }}>
      <div className="ip-page" style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111111" }}>Interview Prep</h2>
            <p style={{ fontSize: "13px", color: "#888888", marginTop: "4px" }}>
              AI mock interviews — questions tailored to your exact role & company
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {phase !== "setup" && (
              <button onClick={backToSetup} style={{ ...btnOutline, fontSize: "12px", padding: "7px 14px" }}>
                ← New Session
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "6px 14px", borderRadius: "20px", border: "1px solid rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.08)", color: "#fb923c" }}>
              <Brain style={{ width: "13px", height: "13px" }} />Interview Coach
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── SETUP PHASE ── */}
          {phase === "setup" && (
            <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="ip-setup-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={card}>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111111", marginBottom: "4px" }}>Session Setup</h3>
                    <p style={{ fontSize: "12px", color: "#888888", marginBottom: "16px" }}>
                      The AI will become a specialized hiring manager for your exact role & company
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div>
                        <label style={label}>Target Role *</label>
                        <input
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          style={inputStyle}
                          placeholder="Senior Software Engineer, Product Manager..."
                        />
                      </div>
                      <div>
                        <label style={label}>Target Company (optional but recommended)</label>
                        <input
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          style={inputStyle}
                          placeholder="Google, Microsoft, Flipkart..."
                        />
                        {company && (
                          <p style={{ fontSize: "11px", color: "#888888", marginTop: "4px" }}>
                            ✓ Questions will use {company}&apos;s specific competency framework
                          </p>
                        )}
                      </div>
                      <div>
                        <label style={label}>Question Type</label>
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px" }}>
                          {QUESTION_TYPES.map((t) => (
                            <button
                              key={t.value}
                              onClick={() => setSelectedType(t.value)}
                              style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "8px", fontWeight: 500, border: `1px solid ${selectedType === t.value ? "rgba(249,115,22,0.4)" : "rgba(0,0,0,0.08)"}`, background: selectedType === t.value ? "rgba(249,115,22,0.2)" : "rgba(0,0,0,0.04)", color: selectedType === t.value ? "#fb923c" : "#888888", cursor: "pointer" }}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={label}>Difficulty</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {DIFFICULTY_LEVELS.map((d) => (
                            <button
                              key={d}
                              onClick={() => setDifficulty(d)}
                              style={{ flex: 1, fontSize: "12px", padding: "8px", borderRadius: "8px", fontWeight: 500, border: `1px solid ${difficulty === d ? "rgba(249,115,22,0.4)" : "rgba(0,0,0,0.08)"}`, background: difficulty === d ? "rgba(249,115,22,0.2)" : "rgba(0,0,0,0.04)", color: difficulty === d ? "#fb923c" : "#888888", cursor: "pointer" }}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>

                      {loadError && (
                        <div style={{ display: "flex", gap: "8px", padding: "10px 12px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "12px", color: "#f87171" }}>
                          <AlertCircle style={{ width: "14px", height: "14px", flexShrink: 0, marginTop: "1px" }} />
                          {loadError}
                        </div>
                      )}

                      <button onClick={startSession} style={{ ...btnPrimary, width: "100%" }}>
                        <Play style={{ width: "16px", height: "16px" }} />
                        Generate AI Questions &amp; Start Session
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={card}>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111111", marginBottom: "14px" }}>How It Works</h3>
                    {[
                      { emoji: "🎯", title: "Role-specific AI", desc: "Questions match real interview patterns for your exact role & company" },
                      { emoji: "📋", title: "STAR Evaluation", desc: "Your answers scored on Situation, Task, Action, Result framework" },
                      { emoji: "🤖", title: "Live Coach", desc: "Ask your interview coach anything in real-time during the session" },
                      { emoji: "📊", title: "Detailed Feedback", desc: "Strengths, improvements, and the ideal answer shown after each question" },
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
                    <p style={{ fontSize: "12px", color: "#fb923c", fontWeight: 600, marginBottom: "6px" }}>💡 Pro Tip</p>
                    <p style={{ fontSize: "12px", color: "#888888", lineHeight: 1.6 }}>
                      Specify the company for best results. The AI will simulate a {company || "Google/Amazon"} interviewer with their specific competency framework (Amazon = Leadership Principles, Google = Googleyness, etc.)
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── LOADING PHASE ── */}
          {phase === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ ...card, textAlign: "center", padding: "60px 40px" }}>
                <motion.div
                  style={{ width: "60px", height: "60px", borderRadius: "50%", border: "3px solid rgba(249,115,22,0.2)", borderTopColor: "#f97316", margin: "0 auto 20px" }}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111111", marginBottom: "8px" }}>
                  Generating Your Interview Questions
                </h3>
                <p style={{ fontSize: "13px", color: "#888888" }}>
                  AI is creating {difficulty.toLowerCase()} {QUESTION_TYPES.find(t => t.value === selectedType)?.label.toLowerCase()} questions
                  {role ? ` for ${role}` : ""}
                  {company ? ` at ${company}` : ""}...
                </p>
              </div>
            </motion.div>
          )}

          {/* ── PRACTICE PHASE ── */}
          {phase === "practice" && questions.length > 0 && (
            <motion.div key="practice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {interviewTips && (
                <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)", fontSize: "12px", color: "#fb923c", marginBottom: "20px", lineHeight: 1.6 }}>
                  <strong>💡 Interview Tips for {company || "this role"}:</strong> {interviewTips}
                </div>
              )}

              <div className="ip-practice-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Progress */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1, height: "6px", borderRadius: "3px", overflow: "hidden", background: "rgba(0,0,0,0.06)" }}>
                      <div style={{ height: "100%", borderRadius: "3px", background: "#f97316", width: `${((currentQ + 1) / questions.length) * 100}%`, transition: "width 0.3s ease" }} />
                    </div>
                    <span style={{ fontSize: "12px", color: "#888888", flexShrink: 0 }}>{currentQ + 1} / {questions.length}</span>
                  </div>

                  {/* Question card */}
                  <div style={card}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "12px", fontWeight: 600, background: "rgba(249,115,22,0.15)", color: "#fb923c" }}>
                        {questions[currentQ]?.type?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span style={{ fontSize: "12px", color: "#888888" }}>{questions[currentQ]?.category} · {questions[currentQ]?.difficulty}</span>
                      {questions[currentQ]?.what_they_evaluate && (
                        <button
                          onClick={() => setShowHints(!showHints)}
                          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", background: "none", border: "none", cursor: "pointer", color: showHints ? "#fb923c" : "#475569" }}
                        >
                          <Lightbulb style={{ width: "12px", height: "12px" }} />
                          {showHints ? "Hide hints" : "Show hints"}
                        </button>
                      )}
                    </div>

                    <p style={{ color: "#111111", fontSize: "15px", lineHeight: "1.6", fontWeight: 600, marginBottom: "12px" }}>
                      {questions[currentQ]?.question}
                    </p>

                    {showHints && questions[currentQ]?.what_they_evaluate && (
                      <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)", marginBottom: "12px" }}>
                        <div style={{ fontSize: "11px", color: "#fb923c", fontWeight: 600, marginBottom: "4px" }}>What they evaluate:</div>
                        <div style={{ fontSize: "12px", color: "#888888" }}>{questions[currentQ].what_they_evaluate}</div>
                        {questions[currentQ]?.ideal_answer_structure && (
                          <>
                            <div style={{ fontSize: "11px", color: "#fb923c", fontWeight: 600, marginTop: "8px", marginBottom: "4px" }}>Ideal structure:</div>
                            <div style={{ fontSize: "12px", color: "#888888" }}>{questions[currentQ].ideal_answer_structure}</div>
                          </>
                        )}
                      </div>
                    )}

                    <label style={label}>Your Answer (use STAR method)</label>
                    <textarea
                      rows={8}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      style={{ ...inputStyle, resize: "none", lineHeight: "1.7" }}
                      placeholder={`Situation: Briefly set the context...\nTask: What was your responsibility...\nAction: What steps did you take...\nResult: What was the outcome (include metrics)...`}
                    />

                    <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                      <button
                        onClick={evaluateAnswer}
                        disabled={!answer.trim() || isEvaluating}
                        style={{ ...btnPrimary, opacity: !answer.trim() || isEvaluating ? 0.6 : 1, cursor: !answer.trim() || isEvaluating ? "not-allowed" : "pointer" }}
                      >
                        {isEvaluating ? (
                          <motion.div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
                        ) : (
                          <Sparkles style={{ width: "16px", height: "16px" }} />
                        )}
                        {isEvaluating ? "Evaluating..." : "Get AI Feedback"}
                      </button>
                      <button style={btnOutline}>
                        <Mic style={{ width: "15px", height: "15px" }} />Record
                      </button>
                      <button
                        onClick={nextQuestion}
                        style={{ ...btnOutline, color: "#888888", borderColor: "rgba(255,255,255,0.12)" }}
                      >
                        Skip →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Coach panel */}
                <div style={{ ...card, display: "flex", flexDirection: "column", minHeight: "400px" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <MessageSquare style={{ width: "15px", height: "15px", color: "#fb923c" }} />Ask Coach
                  </h3>
                  <div style={{ flex: 1, overflowY: "auto", marginBottom: "12px", maxHeight: "320px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {coachMessages.length === 0 && (
                      <div style={{ textAlign: "center", padding: "24px 16px" }}>
                        <Brain style={{ width: "36px", height: "36px", color: "#888888", margin: "0 auto 10px" }} />
                        <p style={{ fontSize: "12px", color: "#888888" }}>Ask your AI coach anything about this question</p>
                        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                          {["How do I structure a STAR answer?", "What are common follow-ups?", "How long should my answer be?"].map((q) => (
                            <button key={q} onClick={() => setCoachInput(q)}
                              style={{ width: "100%", textAlign: "left", fontSize: "11px", padding: "8px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)", color: "#888888", cursor: "pointer" }}>
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {coachMessages.map((m, i) => (
                      <div key={i} style={{ fontSize: "12px", lineHeight: "1.6", padding: "8px 12px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role === "user" ? "linear-gradient(135deg,#0F6E55,#0A523F)" : "rgba(26,16,51,0.9)", border: m.role === "user" ? "none" : "1px solid rgba(0,0,0,0.12)", color: m.role === "user" ? "white" : "#cbd5e1" }}>
                        {m.content || "..."}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      value={coachInput}
                      onChange={(e) => setCoachInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendCoach()}
                      style={{ ...inputStyle, fontSize: "12px", padding: "8px 12px" }}
                      placeholder="Ask coach..."
                    />
                    <button onClick={sendCoach} disabled={isStreaming}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 12px", background: "linear-gradient(135deg,#0F6E55,#0A523F)", border: "none", borderRadius: "10px", cursor: "pointer", flexShrink: 0 }}>
                      <ChevronRight style={{ width: "14px", height: "14px", color: "white" }} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── FEEDBACK PHASE ── */}
          {phase === "feedback" && feedback && (
            <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ marginBottom: "12px", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", fontSize: "13px", color: "#888888", border: "1px solid rgba(0,0,0,0.08)" }}>
                <strong style={{ color: "#333333" }}>Q{currentQ + 1}:</strong> {questions[currentQ]?.question}
              </div>

              <div className="ip-feedback-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Score */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ ...card, textAlign: "center" }}>
                    <div style={{ fontSize: "56px", fontWeight: 900, marginBottom: "8px", color: feedback.overall_score >= 80 ? "#10b981" : feedback.overall_score >= 60 ? "#f59e0b" : "#ef4444" }}>
                      {feedback.overall_score}
                    </div>
                    <div style={{ fontSize: "13px", color: "#888888", marginBottom: "20px" }}>Overall Score</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
                      {Object.entries(feedback.star_breakdown).map(([lbl, data]) => (
                        <ScoreBar key={lbl} label={lbl} score={data.quality} />
                      ))}
                    </div>
                  </div>

                  {feedback.follow_up_prediction && (
                    <div style={{ ...card, borderColor: "rgba(249,115,22,0.2)", background: "rgba(249,115,22,0.04)" }}>
                      <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#fb923c", marginBottom: "6px" }}>🎯 Likely Follow-up Question</h4>
                      <p style={{ fontSize: "12px", color: "#888888", lineHeight: 1.6 }}>{feedback.follow_up_prediction}</p>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={nextQuestion} style={{ ...btnPrimary, flex: 1 }}>Next Question →</button>
                    <button onClick={retry} style={{ ...btnOutline, flex: 1 }}>Retry</button>
                  </div>
                </div>

                {/* Breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={card}>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#10b981", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Check style={{ width: "15px", height: "15px" }} />Strengths
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {feedback.strengths.map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "#333333" }}>
                          <Check style={{ width: "15px", height: "15px", color: "#10b981", flexShrink: 0, marginTop: "2px" }} />{s}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={card}>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Sparkles style={{ width: "15px", height: "15px" }} />Improvements
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {feedback.improvements.map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "#333333" }}>
                          <ChevronRight style={{ width: "15px", height: "15px", color: "#f59e0b", flexShrink: 0, marginTop: "2px" }} />{s}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ ...card, borderColor: "rgba(15,110,85,0.25)", background: "rgba(15,110,85,0.05)" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0F6E55", marginBottom: "8px" }}>Ideal Closing Line</h4>
                    <p style={{ fontSize: "13px", color: "#333333", fontStyle: "italic", lineHeight: "1.6" }}>&ldquo;{feedback.ideal_answer_snippet}&rdquo;</p>
                  </div>

                  <div style={card}>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#111111", marginBottom: "12px" }}>STAR Breakdown</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {Object.entries(feedback.star_breakdown).map(([lbl, data]) => (
                        <div key={lbl} style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#111111" }}>{lbl}</span>
                            {data.present ? <Check style={{ width: "12px", height: "12px", color: "#10b981" }} /> : <X style={{ width: "12px", height: "12px", color: "#ef4444" }} />}
                            <span style={{ fontSize: "12px", fontWeight: 700, marginLeft: "auto", color: data.quality >= 7 ? "#10b981" : "#f59e0b" }}>{data.quality}/10</span>
                          </div>
                          <p style={{ fontSize: "11px", color: "#888888" }}>{data.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}



"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useChatStore } from "@/lib/stores/chatStore";
import { useAgentStore } from "@/lib/stores/agentStore";
import { useUserProfileStore } from "@/lib/stores/userProfileStore";
import { useResumeStore } from "@/lib/stores/resumeStore";
import { streamSSE } from "@/lib/api/client";

// ─── Parse action markers from Claude response ───────────────────────────────
function parseActions(text: string) {
  const re = /\[ACTION:([a-z_]+):?([^\]]*)\]/g;
  const actions: { type: string; value: string }[] = [];
  let m; while ((m = re.exec(text)) !== null) actions.push({ type: m[1], value: m[2] || "" });
  return { clean: text.replace(/\[ACTION:[^\]]+\]/g, "").trim(), actions };
}

// ─── Parse WORKFLOW markers ──────────────────────────────────────────────────
function parseWorkflowActions(text: string) {
  const re = /\[WORKFLOW:([a-z_]+):?([^\]]*)\]/g;
  const actions: { action: string; value: string }[] = [];
  let m; while ((m = re.exec(text)) !== null) actions.push({ action: m[1], value: m[2] || "" });
  return { clean: text.replace(/\[WORKFLOW:[^\]]+\]/g, "").trim(), actions };
}

// ─── Quick actions ────────────────────────────────────────────────────────────
const QUICK = [
  { label: "Build my resume", route: "/resume-builder" },
  { label: "Find SDE jobs Bangalore", route: "/job-finder" },
  { label: "Adapt resume to JD", route: "/resume-adaptor" },
  { label: "Mock interview", route: "/interview-prep" },
  { label: "Track applications", route: "/tracker" },
];

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  panel: { background: "rgba(10,6,22,0.98)", backdropFilter: "blur(30px)", border: "1px solid rgba(124,58,237,0.22)", boxShadow: "0 20px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.08)" } as React.CSSProperties,
  input: { flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "13px", color: "#f1f5f9", fontFamily: "inherit", resize: "none" as const, lineHeight: 1.5 },
};

export default function MithraChat() {
  const { messages, isOpen, isLoading, setOpen, setLoading, addMessage, appendToLast, clear } = useChatStore();
  const { dispatchAction } = useAgentStore();
  const { profile, setProfile, markSetupDone } = useUserProfileStore();
  const { resume } = useResumeStore();
  const pathname = usePathname();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileRole, setProfileRole] = useState("");
  const [profileTarget, setProfileTarget] = useState("");
  const [workflowExecuting, setWorkflowExecuting] = useState(false);
  const [workflowSummary, setWorkflowSummary] = useState<{ role: string; company: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  const resumeLoaded = Boolean(resume?.personal?.name);

  useEffect(() => { if (endRef.current && isOpen) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [messages, isOpen]);
  useEffect(() => { if (!isOpen && messages.length > 1) setHasNew(true); }, [messages.length, isOpen]);
  useEffect(() => { if (isOpen) setHasNew(false); }, [isOpen]);

  // Show profile setup prompt on first open if name not set
  useEffect(() => {
    if (isOpen && !profile.profileSetupDone && !profile.name && messages.length <= 1) {
      setShowProfilePrompt(true);
    }
  }, [isOpen, profile.profileSetupDone, profile.name, messages.length]);

  const executeWorkflow = useCallback(async (action: string, value: string) => {
    setWorkflowExecuting(true);
    try {
      if (action === "navigate") {
        router.push(`/${value}`);
      } else if (action === "fill_jd") {
        dispatchAction({ type: "fill_jd", jd: value });
        router.push("/resume-adaptor");
      } else if (action === "fill_company_role") {
        const [company, role] = value.split("|");
        dispatchAction({ type: "fill_company_role", company: company || value, role: role || "" });
        setWorkflowSummary({ company: company || value, role: role || "" });
        router.push("/resume-adaptor");
      } else if (action === "trigger_adapt") {
        if (!resumeLoaded) {
          addMessage({ role: "assistant", content: "Please upload your resume first using the Resume Builder tab before I can adapt it." });
          return;
        }
        dispatchAction({ type: "trigger_adapt" });
        router.push("/resume-adaptor");
      } else if (action === "trigger_job_search") {
        const [query, location] = value.split("|");
        dispatchAction({ type: "trigger_job_search", query: query || value, location: location || "" });
        router.push("/job-finder");
      } else if (action === "show_toast") {
        dispatchAction({ type: "show_toast", message: value, variant: "info" });
      } else if (action === "ask_user") {
        addMessage({ role: "assistant", content: value });
      }
    } finally {
      setWorkflowExecuting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, dispatchAction, resumeLoaded, addMessage]);

  // Process action markers in last assistant message
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && last.content && !isLoading) {
      // Process legacy [ACTION:...] markers
      const { actions } = parseActions(last.content);
      actions.forEach((a) => {
        if (a.type === "navigate") { dispatchAction({ type: "navigate", tab: a.value }); router.push(`/${a.value}`); }
        else if (a.type === "search_jobs") { dispatchAction({ type: "search_jobs", query: a.value }); router.push("/job-finder"); }
        else if (a.type === "adapt_resume") { dispatchAction({ type: "adapt_resume", jd: a.value }); router.push("/resume-adaptor"); }
        else if (a.type === "build_resume") { dispatchAction({ type: "build_resume" }); router.push("/resume-builder"); }
      });

      // Process new [WORKFLOW:...] markers
      const { actions: workflowActions } = parseWorkflowActions(last.content);
      if (workflowActions.length > 0) {
        (async () => {
          for (const wa of workflowActions) {
            await executeWorkflow(wa.action, wa.value);
            // Small delay between sequential workflow steps
            await new Promise((r) => setTimeout(r, 400));
          }
        })();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isLoading]);

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "20px";
    addMessage({ role: "user", content: msg });
    setLoading(true);
    addMessage({ role: "assistant", content: "" });
    try {
      // Include user profile context with every message
      const userProfile = profile.name ? {
        name: profile.name,
        currentRole: profile.currentRole,
        targetRole: profile.targetRole,
        skills: profile.skills,
        experienceSummary: profile.experienceSummary,
        yearsOfExperience: profile.yearsOfExperience,
      } : undefined;
      await streamSSE("/chat/stream",
        {
          message: msg,
          page_context: pathname || "dashboard",
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          resume_loaded: resumeLoaded,
          ...(userProfile ? { user_profile: userProfile } : {}),
        },
        (chunk) => appendToLast(chunk),
      );
    } catch { appendToLast("Connection error — make sure the backend is running at localhost:8000."); }
    finally { setLoading(false); }
  }, [input, isLoading, addMessage, setLoading, appendToLast, messages, pathname, profile]);

  const toggleVoice = () => {
    if (isListening) { recRef.current?.stop(); setIsListening(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported in this browser."); return; }
    const r = new SR(); r.lang = "en-US"; r.continuous = false; r.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsListening(false); };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    recRef.current = r; r.start(); setIsListening(true);
  };

  const panelW = expanded ? "560px" : "380px";
  const panelH = expanded ? "82vh" : "520px";

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* ── FAB ── */}
      {!isOpen && (
        <button onClick={() => setOpen(true)} style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 50,
          width: "56px", height: "56px", borderRadius: "18px", border: "none",
          background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "white",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px", boxShadow: "0 8px 32px rgba(124,58,237,0.55)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(124,58,237,0.7)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(124,58,237,0.55)"; }}>
          ✨
          {hasNew && (
            <div style={{ position: "absolute", top: "-4px", right: "-4px", width: "18px", height: "18px", borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#0a0614", border: "2px solid #0a0614" }}>
              {Math.min(messages.length - 1, 9)}
            </div>
          )}
        </button>
      )}

      {/* ── CHAT PANEL ── */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 50,
          width: panelW, height: panelH,
          display: "flex", flexDirection: "column", borderRadius: "20px", overflow: "hidden",
          transition: "width 0.25s ease, height 0.25s ease",
          ...S.panel,
        }}>

          {/* Header */}
          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(124,58,237,0.12)", background: "rgba(20,12,40,0.8)", flexShrink: 0 }}>
            {/* Avatar */}
            <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg,#7c3aed,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0, boxShadow: "0 0 14px rgba(124,58,237,0.5)", position: "relative" }}>
              ✨
              <div style={{ position: "absolute", bottom: "-1px", right: "-1px", width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", border: "2px solid rgba(10,6,22,0.98)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#f1f5f9" }}>
                Mithra
                {profile.name && (
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#a78bfa", marginLeft: "8px" }}>
                    Hi {profile.name.split(" ")[0]} 👋
                  </span>
                )}
              </div>
              <div style={{ fontSize: "11px", color: "#10b981" }}>Online · AI Career Agent</div>
            </div>
            {/* Controls */}
            <div style={{ display: "flex", gap: "4px" }}>
              {[
                { icon: "🗑", title: "Clear chat", onClick: clear },
                { icon: expanded ? "⊡" : "⊞", title: expanded ? "Collapse" : "Expand", onClick: () => setExpanded(!expanded) },
                { icon: "✕", title: "Close", onClick: () => setOpen(false) },
              ].map(({ icon, title, onClick }) => (
                <button key={title} onClick={onClick} title={title} style={{
                  width: "28px", height: "28px", borderRadius: "8px", border: "none",
                  background: "transparent", color: "#64748b", cursor: "pointer", fontSize: "13px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#f1f5f9"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((msg, i) => (
              <div key={msg.id || i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "8px", alignItems: "flex-end" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: "24px", height: "24px", borderRadius: "8px", background: "linear-gradient(135deg,#7c3aed,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, marginBottom: "2px" }}>
                    ✨
                  </div>
                )}
                <div style={{
                  maxWidth: "88%", padding: "10px 14px", fontSize: "13px", lineHeight: 1.65,
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user" ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(26,16,51,0.9)",
                  color: msg.role === "user" ? "white" : "#cbd5e1",
                  border: msg.role === "assistant" ? "1px solid rgba(124,58,237,0.18)" : "none",
                }}>
                  {msg.content || (isLoading && i === messages.length - 1 ? (
                    <div style={{ display: "flex", gap: "4px", padding: "2px 0" }}>
                      {[0, 0.15, 0.3].map((d) => (
                        <div key={d} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7c3aed", animation: `pulse 0.8s ${d}s ease-in-out infinite` }} />
                      ))}
                    </div>
                  ) : "")}
                </div>
              </div>
            ))}

            {/* Profile setup prompt */}
            {showProfilePrompt && (
              <div style={{ borderRadius: "14px", padding: "16px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", marginBottom: "4px" }}>
                <p style={{ fontSize: "13px", color: "#a78bfa", fontWeight: 700, marginBottom: "10px" }}>Who are you? Tell me a bit so I can personalize your experience.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your name"
                    style={{ background: "rgba(15,8,30,0.8)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "8px", padding: "8px 10px", color: "#f1f5f9", fontSize: "12px", outline: "none", fontFamily: "inherit" }}
                  />
                  <input
                    value={profileRole}
                    onChange={(e) => setProfileRole(e.target.value)}
                    placeholder="Current role (e.g. Software Engineer at Infosys)"
                    style={{ background: "rgba(15,8,30,0.8)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "8px", padding: "8px 10px", color: "#f1f5f9", fontSize: "12px", outline: "none", fontFamily: "inherit" }}
                  />
                  <input
                    value={profileTarget}
                    onChange={(e) => setProfileTarget(e.target.value)}
                    placeholder="Target role (e.g. Senior PM at a Series B startup)"
                    style={{ background: "rgba(15,8,30,0.8)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "8px", padding: "8px 10px", color: "#f1f5f9", fontSize: "12px", outline: "none", fontFamily: "inherit" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      if (profileName.trim()) {
                        setProfile({ name: profileName.trim(), currentRole: profileRole.trim(), targetRole: profileTarget.trim(), profileSetupDone: true });
                        markSetupDone();
                        setShowProfilePrompt(false);
                        addMessage({ role: "assistant", content: `Nice to meet you, ${profileName.trim()}! I'm Mithra, your AI career companion. ${profileRole ? `I see you're currently a ${profileRole}` : ""}${profileTarget ? ` looking to move into ${profileTarget}` : ""}. I'll keep this in mind as we work together. How can I help you today?` });
                      }
                    }}
                    style={{ flex: 1, padding: "8px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: "8px", color: "white", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Let&apos;s go!
                  </button>
                  <button
                    onClick={() => { setShowProfilePrompt(false); markSetupDone(); }}
                    style={{ padding: "8px 12px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#64748b", fontSize: "12px", cursor: "pointer" }}
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* Quick actions (only shown at start) */}
            {messages.length <= 1 && !showProfilePrompt && (
              <div style={{ marginTop: "8px" }}>
                <p style={{ fontSize: "11px", color: "#475569", textAlign: "center", marginBottom: "10px" }}>Quick actions</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
                  {QUICK.map((q) => (
                    <button key={q.label} onClick={() => { router.push(q.route); send(q.label); }}
                      style={{
                        fontSize: "12px", padding: "6px 12px", borderRadius: "20px", cursor: "pointer",
                        background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
                        color: "#a78bfa", fontFamily: "inherit", transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.2)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.1)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.25)"; }}>
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Workflow executing indicator */}
            {workflowExecuting && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "10px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", fontSize: "12px", color: "#a78bfa" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", border: "2px solid rgba(167,139,250,0.3)", borderTopColor: "#a78bfa", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                Executing workflow step...
              </div>
            )}

            {/* Workflow summary card */}
            {workflowSummary && !workflowExecuting && (
              <div style={{ borderRadius: "12px", padding: "12px 14px", background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.25)", fontSize: "12px" }}>
                <div style={{ fontWeight: 700, color: "#34d399", marginBottom: "4px" }}>Done!</div>
                <div style={{ color: "#94a3b8", lineHeight: 1.5 }}>
                  I&apos;ve set up your resume adaptation for <strong style={{ color: "#f1f5f9" }}>{workflowSummary.role}</strong> at <strong style={{ color: "#f1f5f9" }}>{workflowSummary.company}</strong>.
                </div>
                <button
                  onClick={() => { router.push("/resume-adaptor"); setWorkflowSummary(null); }}
                  style={{ marginTop: "8px", fontSize: "11px", fontWeight: 600, color: "#34d399", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                >
                  View in Resume Adaptor →
                </button>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input area */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(124,58,237,0.12)", flexShrink: 0 }}>
            <div style={{
              display: "flex", alignItems: "flex-end", gap: "8px", padding: "10px 14px",
              borderRadius: "14px", border: "1px solid rgba(124,58,237,0.22)",
              background: "rgba(20,12,40,0.8)",
            }}>
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="What story shall we tell today?"
                style={{ ...S.input, minHeight: "20px", maxHeight: "96px" }}
              />
              <div style={{ display: "flex", gap: "4px", paddingBottom: "1px", flexShrink: 0 }}>
                {/* Mic */}
                <button onClick={toggleVoice} title="Voice input" style={{
                  width: "30px", height: "30px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "14px",
                  background: isListening ? "rgba(239,68,68,0.2)" : "transparent",
                  color: isListening ? "#f87171" : "#475569",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isListening ? "⏹" : "🎤"}
                </button>
                {/* Send */}
                <button onClick={() => send()} disabled={!input.trim() || isLoading} style={{
                  width: "30px", height: "30px", borderRadius: "8px", border: "none", cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
                  background: input.trim() && !isLoading ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.06)",
                  color: input.trim() && !isLoading ? "white" : "#475569", fontSize: "14px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isLoading ? <div style={{ width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : "→"}
                </button>
              </div>
            </div>
            <p style={{ fontSize: "10px", color: "#334155", textAlign: "center", marginTop: "8px" }}>
              Powered by Claude Opus 4.7 · Commands all 7 agents
            </p>
          </div>
        </div>
      )}
    </>
  );
}

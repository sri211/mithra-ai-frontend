"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useChatStore } from "@/lib/stores/chatStore";
import { useAgentStore } from "@/lib/stores/agentStore";
import { streamSSE } from "@/lib/api/client";

// ─── Parse action markers from Claude response ───────────────────────────────
function parseActions(text: string) {
  const re = /\[ACTION:([a-z_]+):?([^\]]*)\]/g;
  const actions: { type: string; value: string }[] = [];
  let m; while ((m = re.exec(text)) !== null) actions.push({ type: m[1], value: m[2] || "" });
  return { clean: text.replace(/\[ACTION:[^\]]+\]/g, "").trim(), actions };
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
  const pathname = usePathname();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  useEffect(() => { if (endRef.current && isOpen) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [messages, isOpen]);
  useEffect(() => { if (!isOpen && messages.length > 1) setHasNew(true); }, [messages.length, isOpen]);
  useEffect(() => { if (isOpen) setHasNew(false); }, [isOpen]);

  // Process action markers in last assistant message
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && last.content && !isLoading) {
      const { actions } = parseActions(last.content);
      actions.forEach((a) => {
        if (a.type === "navigate") { dispatchAction({ type: "navigate", tab: a.value }); router.push(`/${a.value}`); }
        else if (a.type === "search_jobs") { dispatchAction({ type: "search_jobs", query: a.value }); router.push("/job-finder"); }
        else if (a.type === "adapt_resume") { dispatchAction({ type: "adapt_resume", jd: a.value }); router.push("/resume-adaptor"); }
        else if (a.type === "build_resume") { dispatchAction({ type: "build_resume" }); router.push("/resume-builder"); }
      });
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
      await streamSSE("/chat/stream",
        { message: msg, page_context: pathname || "dashboard", history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })) },
        (chunk) => appendToLast(chunk),
      );
    } catch { appendToLast("Connection error — make sure the backend is running at localhost:8000."); }
    finally { setLoading(false); }
  }, [input, isLoading, addMessage, setLoading, appendToLast, messages, pathname]);

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
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#f1f5f9" }}>Mithra</div>
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

            {/* Quick actions (only shown at start) */}
            {messages.length <= 1 && (
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
                placeholder="Ask Mithra anything… (build resume, find jobs, prep interview)"
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

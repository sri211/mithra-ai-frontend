"use client";
import { useState, useRef, useEffect, useId } from "react";
import { useResumeStore } from "@/lib/stores/resumeStore";
import { useAgentStore } from "@/lib/stores/agentStore";
import { FileUploadModal } from "@/components/ui/FileUploadModal";
import ResumeViewerModal from "@/components/ui/ResumeViewerModal";
import { api, streamSSE, API_BASE } from "@/lib/api/client";
import { ResumeData } from "@/lib/types";
import { useUser } from "@/lib/auth";
import { getLimits } from "@/lib/planLimits";
import { useUsageTracker } from "@/lib/useUsageTracker";

// ── Format assistant messages with basic markdown ────────────────────────────
function FormatMsg({ text }: { text: string }) {
  if (!text) return <span>…</span>;
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (line === "") return <div key={i} style={{ height: "5px" }} />;
        // Bold: **text**
        const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = boldParts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j} style={{ color: "#111111", fontWeight: 700 }}>{part.slice(2, -2)}</strong>
            : <span key={j}>{part}</span>
        );
        // Bullet list
        if (line.match(/^[-•*]\s/)) {
          return (
            <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "2px", alignItems: "flex-start" }}>
              <span style={{ color: "#7c3aed", flexShrink: 0, marginTop: "2px", fontSize: "11px" }}>▸</span>
              <span>{boldParts.map((p, j) => p.startsWith("**") && p.endsWith("**") ? <strong key={j} style={{ color: "#f1f5f9" }}>{p.slice(2,-2)}</strong> : <span key={j}>{p}</span>)}</span>
            </div>
          );
        }
        // Numbered list
        if (line.match(/^\d+\./)) {
          return <div key={i} style={{ marginBottom: "3px" }}>{rendered}</div>;
        }
        return <div key={i} style={{ marginBottom: "2px" }}>{rendered}</div>;
      })}
    </>
  );
}

// ─── Templates ──────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: "modern",    name: "Modern",    accent: "#7c3aed", bg: "white",    text: "#111827" },
  { id: "minimal",   name: "Minimal",   accent: "#334155", bg: "white",    text: "#1e293b" },
  { id: "tech",      name: "Tech",      accent: "#06b6d4", bg: "white",    text: "#0f172a" },
  { id: "executive", name: "Executive", accent: "#b45309", bg: "white",    text: "#111827" },
  { id: "creative",  name: "Creative",  accent: "#db2777", bg: "white",    text: "#111827" },
  { id: "classic",   name: "Classic",   accent: "#1e3a5f", bg: "white",    text: "#1e293b" },
];

// ─── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bg: "#F7F7F5",
  panel: "#FFFFFF",
  card: "#FFFFFF",
  border: "rgba(0,0,0,0.09)",
  inputBg: "#FFFFFF",
  violet: "#7c3aed",
  gold: "#f59e0b",
  text: "#111111",
  muted: "#888888",
  secondary: "#555555",
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: C.inputBg, border: `1px solid rgba(0,0,0,0.12)`,
  borderRadius: "10px", color: C.text, padding: "10px 14px",
  fontSize: "13px", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
  background: "#7c3aed", color: "white",
  border: "none", borderRadius: "10px", padding: "11px 20px",
  fontSize: "13px", fontWeight: 700, cursor: "pointer",
  boxShadow: "0 2px 8px rgba(124,58,237,0.25)", width: "100%",
};

const btnGold: React.CSSProperties = {
  ...btnPrimary,
  background: "#f59e0b",
  color: "#111111", boxShadow: "0 2px 8px rgba(245,158,11,0.25)",
};

const btnOutline: React.CSSProperties = {
  ...btnPrimary,
  background: "transparent", border: `1px solid rgba(0,0,0,0.12)`,
  color: "#555555", boxShadow: "none",
};

type BuildMode = "chat" | "linkedin" | "form" | "editor";

// ─── Helper components ──────────────────────────────────────────────────────
function Section({ title, color, bg, children }: { title: string; color: string; bg: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <h2 style={{ fontSize: "10px", fontWeight: 800, color, textTransform: "uppercase" as const, letterSpacing: "1.5px", margin: "0 0 8px" }}>{title}</h2>
      <div style={{ borderTop: `1.5px solid ${color}30`, marginBottom: "10px" }} />
      {children}
    </div>
  );
}

function SkillRow({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
      <span style={{ fontWeight: 700, color: "#374151", minWidth: "90px", fontSize: "11px" }}>{label}:</span>
      <span style={{ color: "#6b7280" }}>{items.join(" · ")}</span>
    </div>
  );
}

// ─── Resume Preview ──────────────────────────────────────────────────────────
function ResumePreview({ resume, template }: { resume: ResumeData; template: string }) {
  const t = TEMPLATES.find((t) => t.id === template) || TEMPLATES[0];
  const r = resume;
  const isEmpty = !r.personal.name && r.experience.length === 0 && !r.summary;

  if (isEmpty) {
    return (
      <div style={{ width: "794px", minHeight: "600px", background: "white", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px", boxShadow: "0 20px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ opacity: 0.15, fontSize: "48px" }}>📄</div>
        <p style={{ color: "#9ca3af", fontSize: "15px", fontWeight: 500 }}>Your resume preview</p>
        <p style={{ color: "#d1d5db", fontSize: "13px" }}>Build on the left to see it appear here</p>
      </div>
    );
  }

  // ── MODERN TEMPLATE (clean, accent header bar) ───────────────────────────
  if (template === "modern") {
    return (
      <div id="resume-preview-content" style={{ width: "794px", minHeight: "1000px", background: "white", fontFamily: "'Inter', 'Helvetica Neue', sans-serif", fontSize: "11px", boxShadow: "0 20px 80px rgba(0,0,0,0.5)", borderRadius: "4px", overflow: "hidden" }}>
        {/* Accent header */}
        <div style={{ background: t.accent, padding: "28px 44px 22px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "white", letterSpacing: "-0.5px", margin: "0 0 4px" }}>{r.personal.name || "Your Name"}</h1>
          {r.personal.title && <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", fontWeight: 600, margin: 0 }}>{r.personal.title}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "10px", fontSize: "10px", color: "rgba(255,255,255,0.75)" }}>
            {r.personal.email && <span>✉ {r.personal.email}</span>}
            {r.personal.phone && <span>📞 {r.personal.phone}</span>}
            {r.personal.location && <span>📍 {r.personal.location}</span>}
            {r.personal.linkedin && <span>🔗 {r.personal.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}</span>}
            {r.personal.github && <span>⌥ {r.personal.github.replace(/^https?:\/\/(www\.)?github\.com\//, "")}</span>}
          </div>
        </div>
        <div style={{ padding: "28px 44px" }}>
          {r.summary && <Section title="Professional Summary" color={t.accent} bg="white"><p style={{ color: "#374151", lineHeight: 1.65, margin: 0 }}>{r.summary}</p></Section>}
          {r.experience.length > 0 && (
            <Section title="Work Experience" color={t.accent} bg="white">
              {r.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div><div style={{ fontWeight: 800, color: "#111827", fontSize: "12px" }}>{exp.role}</div><div style={{ color: t.accent, fontWeight: 600 }}>{exp.company}</div></div>
                    <div style={{ textAlign: "right", color: "#9ca3af", fontSize: "10px", marginLeft: "16px", whiteSpace: "nowrap" }}>
                      {exp.start}{(exp.end || exp.current) ? ` – ${exp.current ? "Present" : exp.end}` : ""}
                      {exp.location && <div>{exp.location}</div>}
                    </div>
                  </div>
                  {exp.bullets.filter(Boolean).length > 0 && (
                    <ul style={{ marginTop: "6px", paddingLeft: 0, listStyle: "none" }}>
                      {exp.bullets.filter(Boolean).map((b, j) => (
                        <li key={j} style={{ display: "flex", gap: "8px", color: "#374151", lineHeight: 1.55, marginBottom: "3px" }}>
                          <span style={{ color: t.accent, flexShrink: 0 }}>▸</span><span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </Section>
          )}
          {(r.skills.technical.length > 0 || r.skills.languages.length > 0 || r.skills.certifications.length > 0) && (
            <Section title="Skills" color={t.accent} bg="white">
              {r.skills.technical.length > 0 && <SkillRow label="Technical" items={r.skills.technical} color={t.accent} />}
              {r.skills.languages.length > 0 && <SkillRow label="Languages" items={r.skills.languages} color={t.accent} />}
              {r.skills.soft.length > 0 && <SkillRow label="Soft Skills" items={r.skills.soft} color={t.accent} />}
              {r.skills.certifications.length > 0 && <SkillRow label="Certifications" items={r.skills.certifications} color={t.accent} />}
            </Section>
          )}
          {r.education.length > 0 && (
            <Section title="Education" color={t.accent} bg="white">
              {r.education.map((ed, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div><div style={{ fontWeight: 800, color: "#111827" }}>{ed.degree}{ed.field ? ` in ${ed.field}` : ""}</div><div style={{ color: t.accent, fontWeight: 600 }}>{ed.institution}</div>{ed.gpa && <div style={{ color: "#9ca3af" }}>GPA: {ed.gpa}</div>}</div>
                  <div style={{ color: "#9ca3af", whiteSpace: "nowrap", marginLeft: "16px" }}>{ed.start}{ed.end ? ` – ${ed.end}` : ""}</div>
                </div>
              ))}
            </Section>
          )}
          {r.projects.filter((p) => p.name).length > 0 && (
            <Section title="Projects" color={t.accent} bg="white">
              {r.projects.filter((p) => p.name).map((p, i) => (
                <div key={i} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 800, color: "#111827" }}>{p.name}</span>{p.tech.length > 0 && <span style={{ color: "#9ca3af", fontSize: "10px" }}>{p.tech.slice(0, 4).join(", ")}</span>}</div>
                  {p.description && <p style={{ color: "#374151", marginTop: "2px" }}>{p.description}</p>}
                </div>
              ))}
            </Section>
          )}
          {r.achievements.filter(Boolean).length > 0 && (
            <Section title="Achievements" color={t.accent} bg="white">
              {r.achievements.filter(Boolean).map((a, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", color: "#374151", marginBottom: "3px" }}><span style={{ color: t.accent }}>▸</span>{a}</div>
              ))}
            </Section>
          )}
        </div>
      </div>
    );
  }

  // ── MINIMAL TEMPLATE (ultra clean, gray, no color header) ────────────────
  if (template === "minimal") {
    return (
      <div id="resume-preview-content" style={{ width: "794px", minHeight: "1000px", background: "white", fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: "11px", padding: "52px 60px", boxShadow: "0 20px 80px rgba(0,0,0,0.5)", borderRadius: "4px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px", paddingBottom: "20px", borderBottom: "1px solid #e5e7eb" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", letterSpacing: "2px", margin: "0 0 6px", textTransform: "uppercase" as const }}>{r.personal.name || "Your Name"}</h1>
          {r.personal.title && <p style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic", margin: "0 0 10px" }}>{r.personal.title}</p>}
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "16px", fontSize: "9px", color: "#9ca3af", letterSpacing: "0.5px" }}>
            {r.personal.email && <span>{r.personal.email}</span>}
            {r.personal.phone && <span>{r.personal.phone}</span>}
            {r.personal.location && <span>{r.personal.location}</span>}
            {r.personal.linkedin && <span>{r.personal.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>}
          </div>
        </div>
        {r.summary && (<div style={{ marginBottom: "22px" }}><p style={{ color: "#374151", lineHeight: 1.8, textAlign: "justify", fontStyle: "italic" }}>{r.summary}</p></div>)}
        {r.experience.length > 0 && (
          <div style={{ marginBottom: "22px" }}>
            <h2 style={{ fontSize: "9px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "2px", margin: "0 0 12px" }}>Experience</h2>
            {r.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div><span style={{ fontWeight: 700, color: "#111827" }}>{exp.role}</span> · <span style={{ color: "#374151" }}>{exp.company}</span></div>
                  <span style={{ color: "#9ca3af", fontSize: "10px" }}>{exp.start}{exp.current ? " – Present" : exp.end ? ` – ${exp.end}` : ""}</span>
                </div>
                <ul style={{ margin: "6px 0 0 14px", padding: 0 }}>
                  {exp.bullets.filter(Boolean).map((b, j) => <li key={j} style={{ color: "#374151", lineHeight: 1.6, marginBottom: "2px" }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
        {(r.skills.technical.length > 0 || r.skills.certifications.length > 0) && (
          <div style={{ marginBottom: "22px" }}>
            <h2 style={{ fontSize: "9px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "2px", margin: "0 0 10px" }}>Skills</h2>
            {r.skills.technical.length > 0 && <p style={{ color: "#374151", margin: "0 0 4px" }}><strong>Technical:</strong> {r.skills.technical.join(", ")}</p>}
            {r.skills.languages.length > 0 && <p style={{ color: "#374151", margin: "0 0 4px" }}><strong>Languages:</strong> {r.skills.languages.join(", ")}</p>}
            {r.skills.certifications.length > 0 && <p style={{ color: "#374151", margin: 0 }}><strong>Certifications:</strong> {r.skills.certifications.join(", ")}</p>}
          </div>
        )}
        {r.education.length > 0 && (
          <div>
            <h2 style={{ fontSize: "9px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "2px", margin: "0 0 10px" }}>Education</h2>
            {r.education.map((ed, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#374151" }}><strong>{ed.degree}{ed.field ? ` in ${ed.field}` : ""}</strong> — {ed.institution}</span>
                <span style={{ color: "#9ca3af" }}>{ed.end || ed.start}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── TECH TEMPLATE (two-column sidebar) ───────────────────────────────────
  if (template === "tech") {
    return (
      <div id="resume-preview-content" style={{ width: "794px", minHeight: "1000px", background: "white", fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: "10.5px", boxShadow: "0 20px 80px rgba(0,0,0,0.5)", borderRadius: "4px", display: "flex" }}>
        {/* Left sidebar */}
        <div style={{ width: "220px", background: "#0f172a", padding: "28px 20px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 900, color: "white", margin: "0 0 4px", lineHeight: 1.2 }}>{r.personal.name || "Your Name"}</h1>
            {r.personal.title && <p style={{ fontSize: "11px", color: t.accent, fontWeight: 700, margin: 0 }}>{r.personal.title}</p>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ fontSize: "9px", color: t.accent, fontWeight: 700, letterSpacing: "1px", marginBottom: "4px" }}>CONTACT</div>
            {r.personal.email && <div style={{ fontSize: "9px", color: "#94a3b8", wordBreak: "break-all" as const }}>✉ {r.personal.email}</div>}
            {r.personal.phone && <div style={{ fontSize: "9px", color: "#94a3b8" }}>📞 {r.personal.phone}</div>}
            {r.personal.location && <div style={{ fontSize: "9px", color: "#94a3b8" }}>📍 {r.personal.location}</div>}
            {r.personal.github && <div style={{ fontSize: "9px", color: "#94a3b8" }}>⌥ {r.personal.github.replace(/^https?:\/\/(www\.)?github\.com\//, "")}</div>}
            {r.personal.linkedin && <div style={{ fontSize: "9px", color: "#94a3b8" }}>🔗 {r.personal.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}</div>}
          </div>
          {(r.skills.technical.length > 0 || r.skills.languages.length > 0) && (
            <div>
              <div style={{ fontSize: "9px", color: t.accent, fontWeight: 700, letterSpacing: "1px", marginBottom: "8px" }}>TECH STACK</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {[...r.skills.languages, ...r.skills.technical].slice(0, 16).map((s) => (
                  <span key={s} style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: `${t.accent}20`, color: t.accent, border: `1px solid ${t.accent}30` }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {r.skills.certifications.length > 0 && (
            <div>
              <div style={{ fontSize: "9px", color: t.accent, fontWeight: 700, letterSpacing: "1px", marginBottom: "6px" }}>CERTIFICATIONS</div>
              {r.skills.certifications.map((c) => <div key={c} style={{ fontSize: "9px", color: "#94a3b8", marginBottom: "3px" }}>✓ {c}</div>)}
            </div>
          )}
          {r.education.length > 0 && (
            <div>
              <div style={{ fontSize: "9px", color: t.accent, fontWeight: 700, letterSpacing: "1px", marginBottom: "6px" }}>EDUCATION</div>
              {r.education.map((ed, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "white" }}>{ed.degree}</div>
                  <div style={{ fontSize: "9px", color: "#94a3b8" }}>{ed.institution}</div>
                  <div style={{ fontSize: "9px", color: "#475569" }}>{ed.end || ed.start}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Right main */}
        <div style={{ flex: 1, padding: "28px 28px 28px 24px" }}>
          {r.summary && (<div style={{ marginBottom: "20px", padding: "12px 14px", background: "#f8fafc", borderLeft: `3px solid ${t.accent}`, borderRadius: "0 6px 6px 0" }}><p style={{ color: "#374151", lineHeight: 1.65, margin: 0 }}>{r.summary}</p></div>)}
          {r.experience.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "9px", fontWeight: 800, color: t.accent, textTransform: "uppercase" as const, letterSpacing: "1.5px", margin: "0 0 12px" }}>Experience</h2>
              {r.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div><span style={{ fontWeight: 800, color: "#111827", fontSize: "12px" }}>{exp.role}</span><span style={{ color: t.accent, fontSize: "11px" }}> @ {exp.company}</span></div>
                    <span style={{ color: "#9ca3af", fontSize: "9px" }}>{exp.start}{exp.current ? " – Present" : exp.end ? ` – ${exp.end}` : ""}</span>
                  </div>
                  <ul style={{ margin: "5px 0 0 0", paddingLeft: "14px" }}>
                    {exp.bullets.filter(Boolean).map((b, j) => <li key={j} style={{ color: "#374151", lineHeight: 1.55, marginBottom: "2px" }}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {r.projects.filter(p => p.name).length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "9px", fontWeight: 800, color: t.accent, textTransform: "uppercase" as const, letterSpacing: "1.5px", margin: "0 0 12px" }}>Projects</h2>
              {r.projects.filter(p => p.name).map((p, i) => (
                <div key={i} style={{ marginBottom: "10px" }}>
                  <span style={{ fontWeight: 700, color: "#111827" }}>{p.name}</span>
                  {p.tech.length > 0 && <span style={{ color: t.accent, fontSize: "9px" }}> [{p.tech.slice(0, 4).join(", ")}]</span>}
                  {p.description && <p style={{ color: "#374151", margin: "2px 0 0", fontSize: "10px" }}>{p.description}</p>}
                </div>
              ))}
            </div>
          )}
          {r.achievements.filter(Boolean).length > 0 && (
            <div>
              <h2 style={{ fontSize: "9px", fontWeight: 800, color: t.accent, textTransform: "uppercase" as const, letterSpacing: "1.5px", margin: "0 0 10px" }}>Achievements</h2>
              {r.achievements.filter(Boolean).map((a, i) => <div key={i} style={{ color: "#374151", marginBottom: "3px" }}>✦ {a}</div>)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── EXECUTIVE TEMPLATE (bold, C-suite, professional) ────────────────────
  if (template === "executive") {
    return (
      <div id="resume-preview-content" style={{ width: "794px", minHeight: "1000px", background: "white", fontFamily: "'Georgia', serif", fontSize: "11px", padding: "44px 52px", boxShadow: "0 20px 80px rgba(0,0,0,0.5)", borderRadius: "4px" }}>
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 700, color: t.accent, letterSpacing: "3px", textTransform: "uppercase" as const, margin: "0 0 6px" }}>{r.personal.name || "Your Name"}</h1>
          {r.personal.title && <p style={{ fontSize: "13px", color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase" as const, margin: 0 }}>{r.personal.title}</p>}
        </div>
        <div style={{ height: "2px", background: `linear-gradient(to right, transparent, ${t.accent}, transparent)`, margin: "14px 0" }} />
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", fontSize: "9px", color: "#9ca3af", marginBottom: "24px", letterSpacing: "0.5px" }}>
          {r.personal.email && <span>{r.personal.email}</span>}
          {r.personal.phone && <span>{r.personal.phone}</span>}
          {r.personal.location && <span>{r.personal.location}</span>}
          {r.personal.linkedin && <span>{r.personal.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>}
        </div>
        {r.summary && (<div style={{ marginBottom: "22px", textAlign: "justify" }}><p style={{ color: "#374151", lineHeight: 1.9, fontStyle: "italic", fontSize: "12px" }}>{r.summary}</p></div>)}
        {r.experience.length > 0 && (
          <div style={{ marginBottom: "22px" }}>
            <h2 style={{ fontSize: "9px", fontWeight: 700, color: t.accent, textTransform: "uppercase" as const, letterSpacing: "3px", margin: "0 0 4px" }}>Professional Experience</h2>
            <div style={{ height: "1px", background: t.accent, marginBottom: "14px" }} />
            {r.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <div><span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{exp.role}</span></div>
                  <span style={{ color: "#9ca3af", fontSize: "10px" }}>{exp.start}{exp.current ? " – Present" : exp.end ? ` – ${exp.end}` : ""}</span>
                </div>
                <div style={{ fontSize: "11px", color: t.accent, fontWeight: 600, marginBottom: "6px" }}>{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                <ul style={{ margin: 0, paddingLeft: "16px" }}>
                  {exp.bullets.filter(Boolean).map((b, j) => <li key={j} style={{ color: "#374151", lineHeight: 1.7, marginBottom: "3px" }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {r.education.length > 0 && (
            <div>
              <h2 style={{ fontSize: "9px", fontWeight: 700, color: t.accent, textTransform: "uppercase" as const, letterSpacing: "3px", margin: "0 0 4px" }}>Education</h2>
              <div style={{ height: "1px", background: t.accent, marginBottom: "10px" }} />
              {r.education.map((ed, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  <div style={{ fontWeight: 700, color: "#111827" }}>{ed.degree}{ed.field ? ` in ${ed.field}` : ""}</div>
                  <div style={{ color: "#6b7280" }}>{ed.institution}</div>
                  <div style={{ color: "#9ca3af", fontSize: "10px" }}>{ed.end || ed.start}</div>
                </div>
              ))}
            </div>
          )}
          {(r.skills.technical.length > 0 || r.skills.certifications.length > 0) && (
            <div>
              <h2 style={{ fontSize: "9px", fontWeight: 700, color: t.accent, textTransform: "uppercase" as const, letterSpacing: "3px", margin: "0 0 4px" }}>Core Competencies</h2>
              <div style={{ height: "1px", background: t.accent, marginBottom: "10px" }} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {[...r.skills.technical, ...r.skills.certifications].slice(0, 12).map((s) => (
                  <span key={s} style={{ fontSize: "9px", padding: "3px 8px", border: `1px solid ${t.accent}40`, borderRadius: "3px", color: "#374151" }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── CREATIVE TEMPLATE (left sidebar with color) ──────────────────────────
  if (template === "creative") {
    return (
      <div id="resume-preview-content" style={{ width: "794px", minHeight: "1000px", background: "white", fontFamily: "'Inter', sans-serif", fontSize: "11px", boxShadow: "0 20px 80px rgba(0,0,0,0.5)", borderRadius: "4px", display: "flex" }}>
        <div style={{ width: "240px", background: `linear-gradient(160deg, ${t.accent}, ${t.accent}cc)`, padding: "32px 22px", flexShrink: 0 }}>
          <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "3px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 900, color: "white", marginBottom: "16px" }}>
            {(r.personal.name || "?")[0]}
          </div>
          <h1 style={{ fontSize: "18px", fontWeight: 900, color: "white", margin: "0 0 4px", lineHeight: 1.2 }}>{r.personal.name || "Your Name"}</h1>
          {r.personal.title && <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", margin: "0 0 20px" }}>{r.personal.title}</p>}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "1.5px", textTransform: "uppercase" as const, marginBottom: "8px" }}>Contact</div>
            {r.personal.email && <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.85)", marginBottom: "4px", wordBreak: "break-all" as const }}>{r.personal.email}</div>}
            {r.personal.phone && <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.85)", marginBottom: "4px" }}>{r.personal.phone}</div>}
            {r.personal.location && <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.85)", marginBottom: "4px" }}>{r.personal.location}</div>}
          </div>
          {r.skills.technical.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "1.5px", textTransform: "uppercase" as const, marginBottom: "8px" }}>Skills</div>
              {[...r.skills.technical, ...r.skills.languages].slice(0, 12).map((s) => (
                <div key={s} style={{ fontSize: "9px", color: "rgba(255,255,255,0.85)", padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>{s}</div>
              ))}
            </div>
          )}
          {r.skills.certifications.length > 0 && (
            <div>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "1.5px", textTransform: "uppercase" as const, marginBottom: "8px" }}>Certifications</div>
              {r.skills.certifications.map((c) => <div key={c} style={{ fontSize: "9px", color: "rgba(255,255,255,0.85)", marginBottom: "3px" }}>✓ {c}</div>)}
            </div>
          )}
        </div>
        <div style={{ flex: 1, padding: "32px 28px" }}>
          {r.summary && (<div style={{ marginBottom: "20px" }}><p style={{ color: "#374151", lineHeight: 1.7, margin: 0 }}>{r.summary}</p></div>)}
          {r.experience.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "10px", fontWeight: 800, color: t.accent, textTransform: "uppercase" as const, letterSpacing: "1.5px", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ height: "2px", flex: "none", width: "20px", background: t.accent, display: "inline-block" }} />Experience
              </h2>
              {r.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div><div style={{ fontWeight: 800, color: "#111827", fontSize: "12px" }}>{exp.role}</div><div style={{ color: t.accent, fontWeight: 600 }}>{exp.company}</div></div>
                    <span style={{ color: "#9ca3af", fontSize: "10px", flexShrink: 0, marginLeft: "8px" }}>{exp.start}{exp.current ? " – Present" : exp.end ? ` – ${exp.end}` : ""}</span>
                  </div>
                  <ul style={{ margin: "6px 0 0", paddingLeft: "14px" }}>
                    {exp.bullets.filter(Boolean).map((b, j) => <li key={j} style={{ color: "#374151", lineHeight: 1.6, marginBottom: "2px" }}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {r.education.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "10px", fontWeight: 800, color: t.accent, textTransform: "uppercase" as const, letterSpacing: "1.5px", margin: "0 0 10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ height: "2px", flex: "none", width: "20px", background: t.accent, display: "inline-block" }} />Education
              </h2>
              {r.education.map((ed, i) => (
                <div key={i} style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                  <div><div style={{ fontWeight: 700, color: "#111827" }}>{ed.degree}{ed.field ? ` in ${ed.field}` : ""}</div><div style={{ color: "#6b7280" }}>{ed.institution}</div></div>
                  <span style={{ color: "#9ca3af", fontSize: "10px" }}>{ed.end || ed.start}</span>
                </div>
              ))}
            </div>
          )}
          {r.achievements.filter(Boolean).length > 0 && (
            <div>
              <h2 style={{ fontSize: "10px", fontWeight: 800, color: t.accent, textTransform: "uppercase" as const, letterSpacing: "1.5px", margin: "0 0 10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ height: "2px", flex: "none", width: "20px", background: t.accent, display: "inline-block" }} />Achievements
              </h2>
              {r.achievements.filter(Boolean).map((a, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", color: "#374151", marginBottom: "3px" }}><span style={{ color: t.accent }}>★</span>{a}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── CLASSIC TEMPLATE (traditional, clean typography) ────────────────────
  return (
    <div id="resume-preview-content" style={{ width: "794px", minHeight: "1000px", background: "white", fontFamily: "'Times New Roman', Times, serif", fontSize: "11.5px", padding: "48px 56px", boxShadow: "0 20px 80px rgba(0,0,0,0.5)", borderRadius: "4px" }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{r.personal.name || "Your Name"}</h1>
        <div style={{ fontSize: "10px", color: "#6b7280", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "12px" }}>
          {r.personal.email && <span>{r.personal.email}</span>}
          {r.personal.phone && <span>{r.personal.phone}</span>}
          {r.personal.location && <span>{r.personal.location}</span>}
        </div>
      </div>
      <hr style={{ border: "none", borderTop: "2px solid #111827", margin: "0 0 16px" }} />
      {r.summary && (<div style={{ marginBottom: "16px" }}><p style={{ color: "#374151", lineHeight: 1.7, textAlign: "justify", margin: 0 }}>{r.summary}</p><hr style={{ border: "none", borderTop: "1px solid #d1d5db", margin: "12px 0 0" }} /></div>)}
      {r.experience.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#111827", margin: "0 0 10px" }}>Work Experience</h2>
          {r.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, color: "#111827" }}>{exp.role} — {exp.company}</span>
                <span style={{ color: "#6b7280", fontSize: "10px" }}>{exp.start}{exp.current ? " – Present" : exp.end ? ` – ${exp.end}` : ""}</span>
              </div>
              <ul style={{ margin: "4px 0 0 16px" }}>
                {exp.bullets.filter(Boolean).map((b, j) => <li key={j} style={{ color: "#374151", lineHeight: 1.6, marginBottom: "2px" }}>{b}</li>)}
              </ul>
            </div>
          ))}
          <hr style={{ border: "none", borderTop: "1px solid #d1d5db" }} />
        </div>
      )}
      {(r.skills.technical.length > 0) && (
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#111827", margin: "0 0 8px" }}>Skills</h2>
          <p style={{ color: "#374151", margin: 0 }}><strong>Technical:</strong> {r.skills.technical.join(", ")}</p>
          {r.skills.certifications.length > 0 && <p style={{ color: "#374151", marginTop: "4px" }}><strong>Certifications:</strong> {r.skills.certifications.join(", ")}</p>}
          <hr style={{ border: "none", borderTop: "1px solid #d1d5db", marginTop: "10px" }} />
        </div>
      )}
      {r.education.length > 0 && (
        <div>
          <h2 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#111827", margin: "0 0 8px" }}>Education</h2>
          {r.education.map((ed, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "#111827" }}><strong>{ed.degree}{ed.field ? ` in ${ed.field}` : ""}</strong> — {ed.institution}</span>
              <span style={{ color: "#6b7280", fontSize: "10px" }}>{ed.end || ed.start}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ATSBar({ score }: { score: number }) {
  if (score === 0) return null;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs work";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: C.card, borderRadius: "10px", border: `1px solid rgba(255,255,255,0.05)` }}>
      <span style={{ fontSize: "12px", color: C.muted, whiteSpace: "nowrap" }}>ATS Score</span>
      <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: "3px", transition: "width 0.8s ease" }} />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 700, color, whiteSpace: "nowrap" }}>{score}% · {label}</span>
    </div>
  );
}

function Spinner() {
  return <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />;
}

function TabPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s", background: active ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "transparent", color: active ? "white" : C.muted, boxShadow: active ? "0 2px 12px rgba(124,58,237,0.35)" : "none" }}>
      {children}
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ResumeBuilderPage() {
  const { resume, selectedTemplate, atsScore, setResume, setTemplate, updateSection, setAtsScore } = useResumeStore();
  const { pendingAction, clearAction } = useAgentStore();
  const { user } = useUser();
  const limits = getLimits(user?.plan ?? "free");
  const usage = useUsageTracker(user?.id ?? "guest");
  const [mode, setMode] = useState<BuildMode>("linkedin");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hi! I'm Mithra. Let's build your perfect resume.\n\nStart with: **What's your full name, current job title, and email?**" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [linkedinInput, setLinkedinInput] = useState("");
  const [linkedinSubMode, setLinkedinSubMode] = useState<"url" | "paste">("paste");
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>("personal");
  const [isFetchingLinkedIn, setIsFetchingLinkedIn] = useState(false);
  const [fetchStatus, setFetchStatus] = useState("");
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [linkedInImportMode, setLinkedInImportMode] = useState<"pdf" | "paste" | "url">("pdf");
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const [pdfUploadStatus, setPdfUploadStatus] = useState("");
  const linkedInPdfRef = useRef<HTMLInputElement>(null);
  const [editorMessages, setEditorMessages] = useState<{ role: string; content: string }[]>([]);
  const [editorInput, setEditorInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const editorEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);
  useEffect(() => { editorEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [editorMessages]);

  useEffect(() => {
    if (pendingAction?.type === "build_resume") { setMode("chat"); clearAction(); }
  }, [pendingAction, clearAction]);

  const fetchLinkedInProfile = async () => {
    if (!linkedinInput.trim() || !linkedinInput.includes("linkedin.com")) return;
    setIsFetchingLinkedIn(true);
    setBuildError("");
    setFetchStatus("");
    setFetchSuccess(false);

    const strategies = [
      "Launching headless browser...",
      "Trying Playwright (Chrome)...",
      "Trying direct HTTP fetch...",
      "Trying Bing cache...",
      "Trying Wayback Machine...",
    ];
    let stratIdx = 0;
    const statusInterval = setInterval(() => {
      if (stratIdx < strategies.length) {
        setFetchStatus(strategies[stratIdx++]);
      }
    }, 2500);

    try {
      // Use the LinkedIn scraper endpoint via the fetch-jd endpoint (which calls our scraper)
      const { data } = await api.post("/resume/build/linkedin", {
        linkedin_text: linkedinInput.trim(),
      });
      clearInterval(statusInterval);

      if (data.resume && data.resume.personal?.name) {
        // Successfully built resume from URL directly
        setResume(data.resume);
        setAtsScore(data.resume.is_url_only ? 35 : 80);
        setFetchSuccess(true);
        setFetchStatus(`✅ Profile fetched! Found: ${data.resume.experience?.length || 0} roles, ${data.resume.education?.length || 0} education entries, ${(data.resume.skills?.technical?.length || 0) + (data.resume.skills?.certifications?.length || 0)} skills`);
        setMode("editor");
      } else {
        throw new Error("Insufficient data extracted");
      }
    } catch {
      clearInterval(statusInterval);
      // Try fetching as raw text first
      try {
        setFetchStatus("Fetching profile content...");
        const { data: fetchData } = await api.post("/resume/fetch-jd", { url: linkedinInput.trim() });
        if (fetchData.text && fetchData.text.length > 200) {
          setLinkedinInput(fetchData.text);
          setLinkedinSubMode("paste");
          setFetchSuccess(true);
          setFetchStatus(`✅ Profile content fetched (${fetchData.text.length} chars). Click "Build Resume" to continue.`);
        } else {
          setBuildError("");
          setLinkedinSubMode("paste");
          setFetchStatus("⚠️ LinkedIn blocked automated access. Paste your profile manually below — it's faster and gives better results.");
        }
      } catch {
        setBuildError("");
        setLinkedinSubMode("paste");
        setFetchStatus("⚠️ Could not access LinkedIn automatically. Use Paste Profile instead.");
      }
    } finally {
      setIsFetchingLinkedIn(false);
    }
  };

  const buildFromLinkedIn = async () => {
    if (!linkedinInput.trim()) return;
    if (limits.resumeRegenerationsPerMonth !== -1) {
      const used = usage.incrementRegenerations();
      if (used > limits.resumeRegenerationsPerMonth) {
        setBuildError(`Free plan: ${limits.resumeRegenerationsPerMonth} AI builds/month used. Upgrade to Pro for unlimited rebuilds.`);
        return;
      }
    }
    setIsBuilding(true); setBuildError("");
    try {
      const { data } = await api.post("/resume/build/linkedin", { linkedin_text: linkedinInput });
      setResume(data.resume);
      setAtsScore(data.resume?.is_url_only ? 30 : 82);
      setMode("editor");
    } catch { setBuildError("Build failed — make sure the backend is running."); }
    finally { setIsBuilding(false); }
  };

  const uploadLinkedInPDF = async (file: File) => {
    if (!file) return;
    setIsUploadingPDF(true);
    setPdfUploadStatus("Reading PDF...");
    setBuildError("");

    const uploadUrl = `${API_BASE}/resume/upload`;

    try {
      const formData = new FormData();
      formData.append("file", file);
      setPdfUploadStatus(`Uploading to backend... (${file.name}, ${(file.size / 1024).toFixed(0)} KB)`);

      const response = await fetch(uploadUrl, { method: "POST", body: formData });

      if (response.status === 404) {
        throw new Error(
          "Endpoint not found (404). The backend needs to be restarted to load the new /upload route. " +
          "Stop the backend (Ctrl+C) and run .\\start-backend.ps1 again."
        );
      }

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const err = await response.json();
          detail = err.detail || detail;
        } catch { /* ignore */ }
        throw new Error(detail);
      }

      const data = await response.json();
      if (!data.resume) throw new Error("Backend returned empty resume data");

      setPdfUploadStatus(`✅ Extracted ${data.chars_extracted?.toLocaleString() || "all"} chars — building resume...`);
      setResume(data.resume);
      setAtsScore(84);
      setTimeout(() => {
        setMode("editor");
        setPdfUploadStatus("");
      }, 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setBuildError(msg);
      setPdfUploadStatus("");
    } finally {
      setIsUploadingPDF(false);
    }
  };

  const buildFromChat = async () => {
    if (chatMessages.length < 3) return;
    if (limits.resumeRegenerationsPerMonth !== -1) {
      const used = usage.incrementRegenerations();
      if (used > limits.resumeRegenerationsPerMonth) {
        setBuildError(`Free plan: ${limits.resumeRegenerationsPerMonth} AI builds/month used. Upgrade to Pro for unlimited rebuilds.`);
        return;
      }
    }
    setIsBuilding(true); setBuildError("");
    try {
      const { data } = await api.post("/resume/build/qa", { conversation: chatMessages });
      setResume(data.resume);
      setAtsScore(82);
      setMode("editor");
    } catch { setBuildError("Build failed."); }
    finally { setIsBuilding(false); }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || isStreaming) return;
    const msg = chatInput.trim(); setChatInput("");
    setChatMessages((p) => [...p, { role: "user", content: msg }]);
    setIsStreaming(true);
    setChatMessages((p) => [...p, { role: "assistant", content: "" }]);
    try {
      await streamSSE("/chat/stream",
        { message: msg, page_context: "resume-builder", history: chatMessages.slice(-8) },
        (chunk) => setChatMessages((p) => { const m = [...p]; m[m.length - 1] = { ...m[m.length - 1], content: m[m.length - 1].content + chunk }; return m; })
      );
    } catch {
      setChatMessages((p) => { const m = [...p]; m[m.length - 1] = { ...m[m.length - 1], content: "Connection error." }; return m; });
    }
    finally { setIsStreaming(false); }
  };

  const sendEditorInstruction = async () => {
    if (!editorInput.trim() || isEditing) return;
    const instruction = editorInput.trim();
    setEditorInput("");
    setEditorMessages((p) => [...p, { role: "user", content: instruction }]);
    setIsEditing(true);
    setEditorMessages((p) => [...p, { role: "assistant", content: "Applying your edit..." }]);

    try {
      const { data } = await api.post("/resume/edit", {
        instruction,
        current_resume: resume,
      });
      if (data.resume) {
        setResume(data.resume);
        setEditorMessages((p) => {
          const m = [...p];
          m[m.length - 1] = { ...m[m.length - 1], content: "✅ Done! Resume updated. Check the preview on the right." };
          return m;
        });
      }
    } catch {
      setEditorMessages((p) => {
        const m = [...p];
        m[m.length - 1] = { ...m[m.length - 1], content: "❌ Edit failed. Make sure the backend is running." };
        return m;
      });
    } finally { setIsEditing(false); }
  };

  const downloadPDF = () => {
    // Gate PDF downloads for free users
    if (limits.pdfDownloadsPerMonth !== -1) {
      const newCount = usage.incrementPdfDownloads();
      if (newCount > limits.pdfDownloadsPerMonth) {
        // Already over limit — don't download
        return;
      }
    }
    const content = document.getElementById("resume-preview-content");
    if (!content) { alert("Build a resume first, then export."); return; }
    const name = resume.personal.name || "resume";
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) return;
    w.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>${name} - Resume</title>
    <style>
      @page { margin: 0; size: A4; }
      body { margin: 0; padding: 0; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style>
  </head>
  <body>${content.outerHTML}
  <script>window.onload=function(){window.print();setTimeout(function(){window.close()},1000);}<\/script>
  </body>
</html>`);
    w.document.close();
  };

  const downloadTXT = () => {
    const r = resume;
    const lines = [
      r.personal.name, r.personal.title, "",
      [r.personal.email, r.personal.phone, r.personal.location].filter(Boolean).join(" | "), "",
      "PROFESSIONAL SUMMARY", r.summary, "",
      "WORK EXPERIENCE",
      ...r.experience.flatMap((e) => [
        `${e.role} — ${e.company} (${e.start}–${e.current ? "Present" : e.end})`,
        ...e.bullets.map((b) => `  • ${b}`), ""
      ]),
      "EDUCATION",
      ...r.education.map((e) => `${e.degree}${e.field ? " in " + e.field : ""} — ${e.institution} (${e.start}–${e.end})`),
      "", "SKILLS", r.skills.technical.join(", "),
      ...(r.skills.certifications.length ? ["", "CERTIFICATIONS", r.skills.certifications.join(", ")] : []),
      ...(r.achievements.length ? ["", "ACHIEVEMENTS", ...r.achievements.map(a => `  • ${a}`)] : []),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${r.personal.name || "resume"}.txt`;
    a.click();
  };

  const resetResume = () => {
    const empty: ResumeData = { personal: { name: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "", title: "" }, summary: "", experience: [], education: [], skills: { technical: [], soft: [], languages: [], certifications: [] }, projects: [], achievements: [], volunteer: [] };
    setResume(empty); setAtsScore(0);
  };

  const AccordionSection = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => {
    const open = expandedSection === id;
    return (
      <div style={{ borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => setExpandedSection(open ? "" : id)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: C.text, fontSize: "13px", fontWeight: 600, textAlign: "left" }}>
          {label}
          <span style={{ color: C.muted, fontSize: "16px" }}>{open ? "−" : "+"}</span>
        </button>
        {open && <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>{children}</div>}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
      <FileUploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} onResumeParsed={(r) => { setResume(r); setAtsScore(70); setMode("editor"); }} />

      {/* Full-screen resume viewer */}
      <ResumeViewerModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title={`Resume — ${selectedTemplate}`}>
        <ResumePreview resume={resume} template={selectedTemplate} />
      </ResumeViewerModal>

      <div className="rb-page-layout" style={{ height: "100%", display: "flex", overflow: "hidden", background: C.bg }}>

        {/* ── LEFT PANEL ── */}
        <div className="rb-left-panel" style={{ width: "420px", flexShrink: 0, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}`, background: C.panel, overflow: "hidden" }}>

          {/* Mode tabs + mobile preview trigger */}
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="rb-mode-tabs" style={{ flex: 1, display: "flex", gap: "3px", background: "rgba(0,0,0,0.04)", borderRadius: "10px", padding: "4px" }}>
              <TabPill active={mode === "chat"} onClick={() => setMode("chat")}>💬 Chat</TabPill>
              <TabPill active={mode === "linkedin"} onClick={() => setMode("linkedin")}>in</TabPill>
              <TabPill active={mode === "form"} onClick={() => setMode("form")}>✏️</TabPill>
              <TabPill active={mode === "editor"} onClick={() => setMode("editor")}>🤖</TabPill>
            </div>
            {/* Mobile-only: open full-screen resume viewer */}
            <button
              onClick={() => setPreviewOpen(true)}
              className="md:hidden"
              style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: "10px", background: "rgba(124,58,237,0.07)", border: `1px solid rgba(124,58,237,0.2)`, color: "#7c3aed", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              📄 Preview
            </button>
          </div>

          {atsScore > 0 && (
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
              <ATSBar score={atsScore} />
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto" }}>

            {/* ── CHAT MODE ── */}
            {mode === "chat" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
                {/* Messages — WhatsApp-style scroll */}
                <div style={{ flex: 1, padding: "12px 14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", WebkitOverflowScrolling: "touch" }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "8px", alignItems: "flex-end" }}>
                      {msg.role === "assistant" && (
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "12px", marginBottom: "2px" }}>✨</div>
                      )}
                      <div style={{
                        maxWidth: "82%", padding: "10px 14px",
                        fontSize: "13px", lineHeight: 1.65,
                        background: msg.role === "user" ? "#7c3aed" : "#F0F0EC",
                        color: msg.role === "user" ? "white" : "#333333",
                        borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        border: msg.role === "assistant" ? `1px solid ${C.border}` : "none",
                        wordBreak: "break-word",
                      }}>
                        {msg.role === "assistant"
                          ? <FormatMsg text={msg.content || (isStreaming && i === chatMessages.length - 1 ? "…" : "")} />
                          : msg.content
                        }
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Sticky input — WhatsApp bar */}
                <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}`, background: C.panel, flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                      style={{ ...inputStyle, flex: 1, borderRadius: "20px", padding: "10px 16px", fontSize: "14px" }}
                      placeholder="Type your answer…"
                    />
                    <button onClick={sendChat} disabled={!chatInput.trim() || isStreaming}
                      style={{ width: "40px", height: "40px", borderRadius: "50%", background: chatInput.trim() ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(124,58,237,0.2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: chatInput.trim() ? "pointer" : "not-allowed", flexShrink: 0, fontSize: "16px", color: "white" }}>
                      {isStreaming ? "⏳" : "→"}
                    </button>
                  </div>
                  <button onClick={buildFromChat} disabled={isBuilding || chatMessages.length < 3}
                    style={{ ...btnGold, opacity: chatMessages.length < 3 ? 0.4 : 1, borderRadius: "12px" }}>
                    {isBuilding ? <><Spinner /> Generating…</> : "✨ Generate Resume from Chat"}
                  </button>
                </div>
              </div>
            )}

            {/* ── LINKEDIN MODE ── */}
            {mode === "linkedin" && (
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: "rgba(10,102,194,0.08)", borderRadius: "12px", border: "1px solid rgba(10,102,194,0.2)" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#0a66c2", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "16px", fontWeight: 900, flexShrink: 0 }}>in</div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>LinkedIn Import</div>
                    <div style={{ fontSize: "11px", color: C.muted }}>3 ways to import your full profile</div>
                  </div>
                </div>

                {/* Tab selector */}
                <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "3px" }}>
                  {([
                    { id: "pdf" as const, label: "📄 PDF Export", badge: "Best" },
                    { id: "paste" as const, label: "📋 Copy & Paste" },
                    { id: "url" as const, label: "🔗 URL" },
                  ]).map((opt) => (
                    <button key={opt.id} onClick={() => setLinkedInImportMode(opt.id)}
                      style={{ flex: 1, padding: "6px 4px", borderRadius: "6px", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer", position: "relative", background: linkedInImportMode === opt.id ? "rgba(10,102,194,0.1)" : "transparent", color: linkedInImportMode === opt.id ? "#0a66c2" : C.muted }}>
                      {opt.label}
                      {opt.badge && linkedInImportMode === opt.id && (
                        <span style={{ marginLeft: "4px", fontSize: "9px", padding: "1px 5px", borderRadius: "8px", background: "#10b981", color: "white", fontWeight: 700 }}>{opt.badge}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* ─── PDF EXPORT TAB (primary) ─── */}
                {linkedInImportMode === "pdf" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                    {/* Why PDF */}
                    <div style={{ padding: "12px 14px", borderRadius: "12px", background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))", border: "1px solid rgba(16,185,129,0.2)", fontSize: "12px", color: C.secondary, lineHeight: 1.7 }}>
                      <div style={{ fontWeight: 700, color: "#34d399", marginBottom: "6px", fontSize: "13px" }}>✅ Why LinkedIn PDF works perfectly</div>
                      LinkedIn generates an <strong style={{ color: C.text }}>official PDF of your entire profile</strong> — experience, education, skills, certifications, projects, and summary. Claude reads it completely, just like a recruiter would.
                    </div>

                    {/* Steps */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {[
                        { n: "1", icon: "🌐", text: "Open your LinkedIn profile in browser" },
                        { n: "2", icon: "⋯", text: 'Click the "More" button (below your name)' },
                        { n: "3", icon: "📥", text: 'Select "Save to PDF" — LinkedIn downloads instantly' },
                        { n: "4", icon: "⬆️", text: "Upload that PDF here ↓" },
                      ].map((step) => (
                        <div key={step.n} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(10,102,194,0.3)", border: "1px solid rgba(10,102,194,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#60a5fa", flexShrink: 0, marginTop: "1px" }}>{step.n}</div>
                          <div style={{ fontSize: "12px", color: C.secondary, lineHeight: 1.5 }}>
                            <span style={{ marginRight: "6px" }}>{step.icon}</span>{step.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Hidden file input */}
                    <input
                      ref={linkedInPdfRef}
                      type="file"
                      accept=".pdf"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadLinkedInPDF(file);
                        e.target.value = "";
                      }}
                    />

                    {/* Upload button */}
                    {pdfUploadStatus ? (
                      <div style={{ padding: "12px 16px", borderRadius: "12px", background: pdfUploadStatus.startsWith("✅") ? "rgba(16,185,129,0.08)" : "rgba(124,58,237,0.08)", border: `1px solid ${pdfUploadStatus.startsWith("✅") ? "rgba(16,185,129,0.2)" : "rgba(124,58,237,0.2)"}`, fontSize: "12px", color: pdfUploadStatus.startsWith("✅") ? "#34d399" : "#a78bfa", display: "flex", alignItems: "center", gap: "10px" }}>
                        {isUploadingPDF && <Spinner />}
                        {pdfUploadStatus}
                      </div>
                    ) : (
                      <button
                        onClick={() => linkedInPdfRef.current?.click()}
                        disabled={isUploadingPDF}
                        style={{ ...btnPrimary, background: "linear-gradient(135deg, #0a66c2, #0856ad)", boxShadow: "0 4px 16px rgba(10,102,194,0.3)", fontSize: "14px", padding: "14px" }}
                      >
                        {isUploadingPDF ? <><Spinner /> Processing PDF…</> : "📤 Upload LinkedIn PDF"}
                      </button>
                    )}

                    {buildError && (
                      <div style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "12px", color: "#f87171" }}>{buildError}</div>
                    )}

                    <div style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", fontSize: "11px", color: "#94a3b8", lineHeight: 1.6 }}>
                      💡 <strong style={{ color: "#fbbf24" }}>Tip:</strong> On mobile LinkedIn app → tap your profile photo → tap the share icon → Save as PDF
                    </div>
                  </div>
                )}

                {/* ─── COPY & PASTE TAB ─── */}
                {linkedInImportMode === "paste" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(10,102,194,0.06)", border: "1px solid rgba(10,102,194,0.15)", fontSize: "12px", color: C.secondary, lineHeight: 1.7 }}>
                      <strong style={{ color: "#60a5fa" }}>Copy these sections from your LinkedIn profile:</strong><br />
                      ✓ <strong>About</strong> section (full summary)<br />
                      ✓ <strong>Experience</strong> — all roles with dates &amp; descriptions<br />
                      ✓ <strong>Education</strong> — all degrees with years<br />
                      ✓ <strong>Skills</strong> — complete list<br />
                      ✓ <strong>Certifications</strong> — with issuing org<br />
                      ✓ <strong>Projects, Honors, Recommendations</strong><br />
                      <em style={{ color: "#475569", fontSize: "11px" }}>Pro tip: Use Ctrl+A on the profile page, then Ctrl+C</em>
                    </div>
                    <textarea
                      rows={14}
                      value={linkedinInput}
                      onChange={(e) => setLinkedinInput(e.target.value)}
                      style={{ ...inputStyle, resize: "vertical" as const, lineHeight: 1.6 }}
                      placeholder={`Paste your LinkedIn profile text here...

Include: About, Experience (with all bullet points), Education, Skills, Certifications, Projects, Achievements, Recommendations...

The more text you paste, the more complete your resume will be.`}
                    />
                    {buildError && <div style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "12px", color: "#f87171" }}>{buildError}</div>}
                    <button onClick={buildFromLinkedIn} disabled={isBuilding || !linkedinInput.trim()} style={{ ...btnPrimary, opacity: !linkedinInput.trim() ? 0.5 : 1 }}>
                      {isBuilding ? <><Spinner /> Building resume…</> : "✨ Build Resume from Pasted Text"}
                    </button>
                  </div>
                )}

                {/* ─── URL TAB ─── */}
                {linkedInImportMode === "url" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", fontSize: "12px", color: "#f87171", lineHeight: 1.6 }}>
                      ⚠️ <strong>URL fetch is limited</strong> — LinkedIn blocks automated access. This may only retrieve your name. Use <strong>PDF Export</strong> (recommended) or <strong>Copy &amp; Paste</strong> for complete data.
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        value={linkedinInput}
                        onChange={(e) => { setLinkedinInput(e.target.value); setFetchStatus(""); setFetchSuccess(false); }}
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="https://linkedin.com/in/your-username"
                        disabled={isFetchingLinkedIn}
                      />
                      <button onClick={fetchLinkedInProfile} disabled={isFetchingLinkedIn || !linkedinInput.trim()}
                        style={{ ...btnOutline, width: "auto", padding: "10px 14px", flexShrink: 0, border: `1px solid rgba(10,102,194,0.4)`, color: "#60a5fa", opacity: isFetchingLinkedIn ? 0.7 : 1 }}>
                        {isFetchingLinkedIn ? <Spinner /> : "Fetch"}
                      </button>
                    </div>
                    {fetchStatus && (
                      <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", fontSize: "12px", color: "#a78bfa", lineHeight: 1.5 }}>
                        {isFetchingLinkedIn && <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#a78bfa", marginRight: "8px", animation: "pulse 1s infinite" }} />}
                        {fetchStatus}
                      </div>
                    )}
                    {buildError && <div style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "12px", color: "#f87171" }}>{buildError}</div>}
                  </div>
                )}
              </div>
            )}

            {/* ── AI EDITOR MODE ── */}
            {mode === "editor" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ padding: "12px 16px", background: "rgba(124,58,237,0.06)", borderBottom: `1px solid ${C.border}`, fontSize: "12px", color: C.secondary, lineHeight: 1.5 }}>
                  <strong style={{ color: "#a78bfa" }}>🤖 AI Resume Editor</strong><br />
                  Tell Mithra what to change — it edits your resume live.
                </div>

                {/* Quick actions */}
                <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
                  {[
                    "Make my summary more impactful",
                    "Add metrics to all bullets",
                    "Improve technical skills section",
                    "Make it more ATS-friendly",
                    "Rewrite summary for a senior role",
                    "Add stronger action verbs",
                  ].map((q) => (
                    <button key={q} onClick={() => setEditorInput(q)} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "16px", border: "1px solid rgba(124,58,237,0.2)", background: "rgba(124,58,237,0.06)", color: "#a78bfa", cursor: "pointer" }}>
                      {q}
                    </button>
                  ))}
                </div>

                {/* Chat thread */}
                <div style={{ flex: 1, padding: "14px 16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {editorMessages.length === 0 && (
                    <div style={{ textAlign: "center", padding: "32px 16px", color: C.muted, fontSize: "13px" }}>
                      <div style={{ fontSize: "32px", marginBottom: "12px" }}>✏️</div>
                      <p>Type an edit instruction or click a quick action above.</p>
                      <p style={{ fontSize: "12px", marginTop: "6px", color: "#475569" }}>Examples: &ldquo;Make my Google bullet more impactful&rdquo; or &ldquo;Add Python to my skills&rdquo;</p>
                    </div>
                  )}
                  {editorMessages.map((msg, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "8px" }}>
                      {msg.role === "assistant" && <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "11px" }}>✨</div>}
                      <div style={{ maxWidth: "86%", padding: "8px 12px", fontSize: "13px", lineHeight: 1.5, background: msg.role === "user" ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(26,16,51,0.9)", color: msg.role === "user" ? "white" : C.secondary, borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", border: msg.role === "assistant" ? `1px solid ${C.border}` : "none" }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={editorEndRef} />
                </div>

                <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", gap: "8px" }}>
                  <input
                    value={editorInput}
                    onChange={(e) => setEditorInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendEditorInstruction()}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="Tell AI what to change…"
                    disabled={isEditing}
                  />
                  <button onClick={sendEditorInstruction} disabled={!editorInput.trim() || isEditing} style={{ ...btnPrimary, width: "42px", flexShrink: 0, opacity: !editorInput.trim() || isEditing ? 0.5 : 1 }}>
                    {isEditing ? <Spinner /> : "→"}
                  </button>
                </div>

                {/* Manual edit hint */}
                <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, fontSize: "11px", color: "#475569", textAlign: "center" }}>
                  Want to edit manually?{" "}
                  <button onClick={() => setMode("form")} style={{ color: C.violet, background: "none", border: "none", cursor: "pointer", fontSize: "11px", textDecoration: "underline" }}>
                    Switch to Form Editor →
                  </button>
                </div>
              </div>
            )}

            {/* ── FORM MODE ── */}
            {mode === "form" && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <AccordionSection id="personal" label="👤 Personal Info">
                  {[["name", "Full Name"], ["title", "Job Title"], ["email", "Email"], ["phone", "Phone"], ["location", "City, Country"], ["linkedin", "LinkedIn URL"], ["github", "GitHub URL"]].map(([f, l]) => (
                    <div key={f}>
                      <label style={{ fontSize: "11px", color: C.muted, display: "block", marginBottom: "4px" }}>{l}</label>
                      <input style={inputStyle} value={(resume.personal as Record<string, string>)[f] || ""} onChange={(e) => updateSection("personal", { ...resume.personal, [f]: e.target.value })} placeholder={l as string} />
                    </div>
                  ))}
                </AccordionSection>

                <AccordionSection id="summary" label="📝 Professional Summary">
                  <textarea rows={5} style={{ ...inputStyle, resize: "vertical" as const, lineHeight: 1.6 }}
                    value={resume.summary} onChange={(e) => updateSection("summary", e.target.value)}
                    placeholder="3 sentences: Who you are + years exp + domain, Top 2-3 achievements, What you seek next." />
                </AccordionSection>

                <AccordionSection id="experience" label="💼 Work Experience">
                  {resume.experience.map((exp, i) => (
                    <div key={i} style={{ padding: "12px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.card, display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <input style={inputStyle} value={exp.company} placeholder="Company" onChange={(e) => { const ex = [...resume.experience]; ex[i] = { ...ex[i], company: e.target.value }; updateSection("experience", ex); }} />
                        <input style={inputStyle} value={exp.role} placeholder="Job Title" onChange={(e) => { const ex = [...resume.experience]; ex[i] = { ...ex[i], role: e.target.value }; updateSection("experience", ex); }} />
                        <input style={inputStyle} value={exp.start} placeholder="Start" onChange={(e) => { const ex = [...resume.experience]; ex[i] = { ...ex[i], start: e.target.value }; updateSection("experience", ex); }} />
                        <input style={inputStyle} value={exp.end} placeholder="End or Present" onChange={(e) => { const ex = [...resume.experience]; ex[i] = { ...ex[i], end: e.target.value }; updateSection("experience", ex); }} />
                      </div>
                      <textarea rows={4} style={{ ...inputStyle, resize: "vertical" as const, lineHeight: 1.6 }}
                        value={exp.bullets.join("\n")} placeholder="• Achieved X by doing Y, resulting in Z%"
                        onChange={(e) => { const ex = [...resume.experience]; ex[i] = { ...ex[i], bullets: e.target.value.split("\n").filter(Boolean) }; updateSection("experience", ex); }} />
                      <button onClick={() => { const ex = resume.experience.filter((_, idx) => idx !== i); updateSection("experience", ex); }}
                        style={{ ...btnOutline, padding: "6px", fontSize: "12px", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}>Remove</button>
                    </div>
                  ))}
                  <button onClick={() => updateSection("experience", [...resume.experience, { company: "", role: "", start: "", end: "", location: "", current: false, bullets: [] }])}
                    style={{ ...btnOutline, borderStyle: "dashed" }}>+ Add Experience</button>
                </AccordionSection>

                <AccordionSection id="skills" label="⚡ Skills">
                  {[["technical", "Technical Skills (comma-separated)"], ["languages", "Programming Languages"], ["certifications", "Certifications (comma-separated)"]].map(([f, l]) => (
                    <div key={f}>
                      <label style={{ fontSize: "11px", color: C.muted, display: "block", marginBottom: "4px" }}>{l}</label>
                      <input style={inputStyle}
                        value={(resume.skills as Record<string, string[]>)[f].join(", ")}
                        onChange={(e) => updateSection("skills", { ...resume.skills, [f]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                        placeholder={l as string} />
                    </div>
                  ))}
                </AccordionSection>

                <AccordionSection id="education" label="🎓 Education">
                  {resume.education.map((ed, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "12px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.card }}>
                      {[["institution", "University / Institution", "col-span-2"], ["degree", "Degree (B.Tech, MBA...)"], ["field", "Field of Study"], ["start", "Start Year"], ["end", "End Year"], ["gpa", "GPA (optional)"]].map(([f, l, span]) => (
                        <div key={f} style={{ gridColumn: span ? "1 / -1" : "auto" }}>
                          <label style={{ fontSize: "11px", color: C.muted, display: "block", marginBottom: "4px" }}>{l}</label>
                          <input style={inputStyle} value={(ed as Record<string, string>)[f] || ""}
                            onChange={(e) => { const edu = [...resume.education]; edu[i] = { ...edu[i], [f]: e.target.value }; updateSection("education", edu); }}
                            placeholder={l as string} />
                        </div>
                      ))}
                    </div>
                  ))}
                  <button onClick={() => updateSection("education", [...resume.education, { institution: "", degree: "", field: "", start: "", end: "", gpa: "" }])}
                    style={{ ...btnOutline, borderStyle: "dashed" }}>+ Add Education</button>
                </AccordionSection>

                <AccordionSection id="achievements" label="🏆 Achievements & Certifications">
                  <textarea rows={4} style={{ ...inputStyle, resize: "vertical" as const, lineHeight: 1.6 }}
                    value={resume.achievements.join("\n")}
                    onChange={(e) => updateSection("achievements", e.target.value.split("\n").filter(Boolean))}
                    placeholder="One achievement per line (awards, patents, publications, hackathon wins...)" />
                </AccordionSection>

                <div style={{ padding: "16px" }}>
                  <button onClick={() => setMode("editor")} style={btnGold}>🤖 Continue Editing with AI</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL (Preview) ── */}
        <div className="rb-right-panel" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Toolbar — desktop full / mobile compact */}
          <div style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(10,6,20,0.7)", flexShrink: 0 }}>
            {/* Desktop toolbar */}
            <div className="rb-toolbar-full" style={{ height: "52px", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button onClick={() => setShowTemplates(!showTemplates)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "8px", border: `1px solid ${showTemplates ? "rgba(124,58,237,0.5)" : C.border}`, background: showTemplates ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)", color: showTemplates ? "#a78bfa" : C.muted, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  🎨 Templates
                </button>
                <span style={{ fontSize: "13px", color: C.muted }}>
                  Current: <span style={{ color: "#a78bfa", textTransform: "capitalize" }}>{selectedTemplate}</span>
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={resetResume} style={{ ...btnOutline, width: "auto", padding: "7px 12px", fontSize: "12px" }}>↺ Reset</button>
                <button onClick={downloadTXT} style={{ ...btnOutline, width: "auto", padding: "7px 12px", fontSize: "12px", color: "#94a3b8" }}>⬇ TXT</button>
                {(() => {
                  const pdfCap = limits.pdfDownloadsPerMonth;
                  const pdfUsed = usage.pdfDownloadsUsed;
                  const locked = pdfCap !== -1 && pdfUsed >= pdfCap;
                  return locked ? (
                    <button
                      onClick={() => window.location.href = "/pricing"}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 16px", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.4)", fontSize: "13px", fontWeight: 700, background: "rgba(245,158,11,0.1)", color: "#f59e0b", cursor: "pointer", position: "relative" }}>
                      🔒 Export PDF — Upgrade to Pro
                    </button>
                  ) : (
                    <button onClick={downloadPDF} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 16px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 700, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "white", cursor: "pointer", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>
                      ⬇ Export PDF {pdfCap !== -1 && <span style={{ fontSize: "10px", opacity: 0.7 }}>({pdfCap - pdfUsed} left)</span>}
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Mobile compact toolbar — icon strip */}
            <div className="rb-toolbar-compact" style={{ height: "44px", alignItems: "center", gap: "8px", padding: "0 12px", overflowX: "auto" }}>
              <button onClick={() => setShowTemplates(!showTemplates)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 10px", borderRadius: "8px", border: `1px solid ${showTemplates ? "rgba(124,58,237,0.5)" : C.border}`, background: showTemplates ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)", color: showTemplates ? "#a78bfa" : C.muted, fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                🎨 <span style={{ color: "#a78bfa", textTransform: "capitalize", fontSize: "11px" }}>{selectedTemplate}</span>
              </button>
              <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
              <button onClick={resetResume} title="Reset" style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, cursor: "pointer", fontSize: "14px", flexShrink: 0 }}>↺</button>
              <button onClick={downloadTXT} title="Export TXT" style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, cursor: "pointer", fontSize: "14px", flexShrink: 0 }}>📄</button>
              {(() => {
                const pdfCap = limits.pdfDownloadsPerMonth;
                const locked = pdfCap !== -1 && usage.pdfDownloadsUsed >= pdfCap;
                return locked ? (
                  <button onClick={() => window.location.href = "/pricing"} title="Upgrade to export PDF" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.4)", fontSize: "12px", fontWeight: 700, background: "rgba(245,158,11,0.1)", color: "#f59e0b", cursor: "pointer", flexShrink: 0 }}>
                    🔒 PDF
                  </button>
                ) : (
                  <button onClick={downloadPDF} title="Export PDF" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: 700, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "white", cursor: "pointer", flexShrink: 0 }}>
                    ⬇ PDF
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Template picker */}
          {showTemplates && (
            <div style={{ display: "flex", gap: "12px", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, overflowX: "auto", background: "rgba(10,6,20,0.5)", flexShrink: 0 }}>
              {TEMPLATES.map((t) => {
                const locked = !limits.templates.includes(t.id);
                return (
                  <button key={t.id}
                    onClick={() => {
                      if (locked) { window.location.href = "/pricing"; return; }
                      setTemplate(t.id); setShowTemplates(false);
                    }}
                    title={locked ? `${t.name} requires Pro plan` : t.name}
                    style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: locked ? "pointer" : "pointer", opacity: locked ? 0.6 : 1, position: "relative" }}>
                    <div style={{ width: "80px", height: "96px", borderRadius: "10px", border: `2px solid ${selectedTemplate === t.id ? t.accent : locked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)"}`, background: selectedTemplate === t.id ? `${t.accent}12` : "rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", padding: "8px", gap: "4px", transform: selectedTemplate === t.id ? "scale(1.06)" : "scale(1)", transition: "all 0.2s", overflow: "hidden" }}>
                      <div style={{ height: "8px", borderRadius: "3px", background: t.accent }} />
                      <div style={{ height: "4px", borderRadius: "2px", background: `${t.accent}60`, width: "70%" }} />
                      {[...Array(4)].map((_, i) => <div key={i} style={{ height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.12)", width: `${60 + i * 8}%` }} />)}
                      {locked && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px" }}>
                          <span style={{ fontSize: "18px" }}>🔒</span>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: selectedTemplate === t.id ? t.accent : locked ? "#334155" : C.muted }}>
                      {t.name}{locked && <span style={{ fontSize: "9px", color: "#a78bfa", marginLeft: "3px" }}>Pro</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Preview area */}
          <div className="rb-preview-outer" style={{ flex: 1, overflowY: "auto", display: "flex", justifyContent: "center", padding: "32px 24px", background: "rgba(8,4,18,0.6)" }}>
            <div className="rb-preview-scaler" style={{ transformOrigin: "top center", transform: "scale(0.72)", marginBottom: "-28%" }}>
              <ResumePreview resume={resume} template={selectedTemplate} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

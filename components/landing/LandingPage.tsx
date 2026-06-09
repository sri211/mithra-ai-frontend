"use client";
import { useState } from "react";
import Link from "next/link";
import {
  FileText, Search, Zap, Users, Brain, BarChart3, Target,
  MessageSquare, ArrowRight, Sparkles, Menu, X, Award, Check, ChevronRight,
} from "lucide-react";

// ─── Annotation components ────────────────────────────────────────────────────

function WavyLine({ color = "#7c3aed" }: { color?: string }) {
  return (
    <svg viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden
      style={{ position: "absolute", bottom: "-5px", left: 0, width: "100%", height: "10px", overflow: "visible" }}>
      <path d="M0 7 Q37.5 1 75 7 Q112.5 13 150 7 Q187.5 1 225 7 Q262.5 13 300 7"
        stroke={color} fill="none" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

function Annotated({ children, color = "#7c3aed" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ position: "relative", display: "inline" }}>
      <span className="lp-annotate" style={{ position: "relative" }}>
        {children}
        <WavyLine color={color} />
      </span>
    </span>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  "Resume Builder", "ATS Score", "Resume Adaptor", "Job Finder",
  "Auto-Apply", "Network Intel", "Interview Prep", "App Tracker",
];

const AGENTS = [
  { num: "01", icon: FileText, label: "Resume Builder",  desc: "Build from LinkedIn, a paste, or a conversation. ATS-ready output, every time.", href: "/resume-builder" },
  { num: "02", icon: Award,    label: "Resume Score",    desc: "Instant AI scoring across 6 dimensions — free always.", href: "/resume-score", badge: "Free" },
  { num: "03", icon: Target,   label: "Resume Adaptor",  desc: "Paste any JD. Mithra rewrites your resume for maximum ATS match in seconds.", href: "/resume-adaptor" },
  { num: "04", icon: Search,   label: "Job Finder",      desc: "50+ portals searched simultaneously. Filters that actually work.", href: "/job-finder" },
  { num: "05", icon: Zap,      label: "Auto-Apply",      desc: "AI fills and submits applications across portals while you sleep.", href: "/job-application" },
  { num: "06", icon: Users,    label: "Network Intel",   desc: "Find decision-makers at target companies. Get AI-drafted outreach that lands.", href: "/network" },
  { num: "07", icon: Brain,    label: "Interview Prep",  desc: "Company-specific mock interviews. Instant feedback on content and delivery.", href: "/interview-prep" },
  { num: "08", icon: BarChart3, label: "App Tracker",   desc: "Track every application from saved to offer. Never let a lead go cold.", href: "/tracker" },
];

const CAREER_FACTS = [
  { label: "AI Specialist Agents", value: "8", highlight: false },
  { label: "ATS Score Check", value: "Always free", highlight: true },
  { label: "Job Portals Searched", value: "50+", highlight: false },
  { label: "Resume Builder", value: "Unlimited preview", highlight: false },
  { label: "Daily Job Searches", value: "5 free / day", highlight: false },
  { label: "Resume Adaptations", value: "3 free / month", highlight: false },
  { label: "PDF Downloads", value: "2 free / month", highlight: false },
  { label: "Interview Practice", value: "Unlimited", highlight: false },
];

const NOT_IN_MITHRA = [
  "No recruiter data selling",
  "No cold email spam",
  "No hidden algorithms",
  "No fake job listings",
];

const STATS = [
  { value: "3×",    label: "More interview calls on average" },
  { value: "91%",   label: "ATS pass rate with adapted resumes" },
  { value: "50+",   label: "Job portals searched at once" },
  { value: "12 hrs", label: "Saved every week per user" },
];

const TESTIMONIALS = [
  {
    quote: "Mithra built my resume, adapted it for Google, and drafted outreach to my future manager. Got the call in 3 days.",
    name: "Arjun Mehta", role: "Software Engineer → Google", initials: "AM",
  },
  {
    quote: "I was applying to 20+ companies manually. Mithra auto-applying let me focus entirely on interview prep. Total game changer.",
    name: "Priya Nair", role: "PM → Flipkart", initials: "PN",
  },
  {
    quote: "ATS score went from 42% to 91% for a Microsoft ML role in under a minute. The adaptor alone pays for itself.",
    name: "Vikram Rao", role: "Data Scientist → Microsoft", initials: "VR",
  },
];

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:      "#FAFAF8",
  white:   "#FFFFFF",
  dark:    "#111111",
  mid:     "#6b6b6b",
  muted:   "#a8a8a8",
  border:  "rgba(0,0,0,0.08)",
  subtle:  "rgba(0,0,0,0.04)",
  violet:  "#7c3aed",
  violetD: "#6d28d9",
  violetL: "rgba(124,58,237,0.08)",
  violetM: "rgba(124,58,237,0.15)",
  gold:    "#f59e0b",
  goldD:   "#d97706",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ background: C.bg, color: C.dark, fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh" }}>

      {/* ════════════════ NAV ════════════════ */}
      <nav className="lp-nav" style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(250,250,248,0.92)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 32px", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: C.violet, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles style={{ width: "15px", height: "15px", color: "white" }} />
          </div>
          <span style={{ fontSize: "17px", fontWeight: 800, color: C.dark, letterSpacing: "-0.4px" }}>Mithra AI</span>
        </Link>

        {/* Desktop links */}
        <div className="lp-nav-links" style={{ display: "flex", alignItems: "center", gap: "36px" }}>
          <div style={{ display: "flex", gap: "28px" }}>
            {[["Features", "#features"], ["How it Works", "#how-it-works"], ["Pricing", "#pricing"]].map(([l, h]) => (
              <a key={l} href={h}
                style={{ fontSize: "14px", color: C.mid, textDecoration: "none", fontWeight: 500, transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.dark)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.mid)}>
                {l}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Link href="/login"
              style={{ fontSize: "14px", color: C.mid, textDecoration: "none", fontWeight: 500, padding: "8px 14px", transition: "color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.dark)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.mid)}>
              Log in
            </Link>
            <Link href="/register" style={{
              background: C.dark, color: "white", textDecoration: "none",
              padding: "9px 18px", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
              display: "flex", alignItems: "center", gap: "6px", transition: "background 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.dark)}>
              Get started <ArrowRight style={{ width: "14px", height: "14px" }} />
            </Link>
          </div>
        </div>

        {/* Mobile */}
        <div className="lp-mob-menu-btn" style={{ gap: "8px" }}>
          <Link href="/register" style={{
            background: C.dark, color: "white", textDecoration: "none",
            padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
          }}>Start Free</Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: C.mid, padding: "4px" }}>
            {mobileMenuOpen ? <X style={{ width: "20px", height: "20px" }} /> : <Menu style={{ width: "20px", height: "20px" }} />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "8px 20px 16px", display: "flex", flexDirection: "column" }}>
          {[["Features", "#features"], ["How it Works", "#how-it-works"], ["Pricing", "#pricing"]].map(([l, h]) => (
            <a key={l} href={h} onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: "15px", color: C.mid, textDecoration: "none", fontWeight: 500, padding: "12px 0", borderBottom: `1px solid ${C.subtle}`, display: "block" }}>
              {l}
            </a>
          ))}
          <Link href="/login" onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: "15px", color: C.violet, textDecoration: "none", fontWeight: 500, padding: "12px 0" }}>
            Log in
          </Link>
        </div>
      )}

      {/* ════════════════ HERO ════════════════ */}
      <section className="lp-hero" style={{ padding: "88px 32px 80px", textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>

        {/* Label */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "36px",
          fontSize: "11px", fontWeight: 700, color: C.violet, letterSpacing: "2px", textTransform: "uppercase",
        }}>
          <span style={{ width: "20px", height: "1px", background: C.violet }} />
          AI Career Platform · 8 Specialist Agents
          <span style={{ width: "20px", height: "1px", background: C.violet }} />
        </div>

        {/* Massive headline */}
        <h1 style={{
          fontSize: "clamp(48px, 8.5vw, 96px)", fontWeight: 900,
          lineHeight: 1.0, marginBottom: "28px", letterSpacing: "-3px", color: C.dark,
        }}>
          The job search,{" "}
          <br />
          done{" "}
          <Annotated color={C.violet}>right.</Annotated>
        </h1>

        <p style={{ fontSize: "18px", color: C.mid, lineHeight: 1.7, maxWidth: "520px", margin: "0 auto 40px", fontWeight: 400 }}>
          Eight AI agents that write your resume, find your jobs, auto-apply, and prep you for every interview — all in one platform.
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={{
            background: C.gold, color: "#111", textDecoration: "none",
            padding: "14px 32px", borderRadius: "9px", fontSize: "15px", fontWeight: 700,
            display: "flex", alignItems: "center", gap: "8px", transition: "background 0.15s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.goldD)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.gold)}>
            Start free today <ArrowRight style={{ width: "16px", height: "16px" }} />
          </Link>
          <a href="#features" style={{
            background: "transparent", color: C.dark,
            border: `1px solid ${C.border}`, padding: "14px 32px", borderRadius: "9px",
            fontSize: "15px", fontWeight: 500, textDecoration: "none",
            display: "flex", alignItems: "center", gap: "8px", transition: "border-color 0.15s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}>
            See what&apos;s inside
          </a>
        </div>

        {/* Trust line */}
        <p style={{ fontSize: "12px", color: C.muted, marginTop: "20px", fontWeight: 500 }}>
          No credit card required · Free plan always available
        </p>
      </section>

      {/* ════════════════ MARQUEE ════════════════ */}
      <div style={{ background: C.dark, borderTop: `1px solid rgba(255,255,255,0.06)`, borderBottom: `1px solid rgba(255,255,255,0.06)`, overflow: "hidden", padding: "14px 0",
        maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}>
        <div className="marquee-track" style={{ display: "flex", gap: "0", width: "max-content" }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: "0", whiteSpace: "nowrap" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "0.3px", padding: "0 32px" }}>
                {item}
              </span>
              <span style={{ color: C.violet, fontSize: "14px", opacity: 0.6 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ════════════════ STATS ════════════════ */}
      <section style={{ padding: "80px 32px", maxWidth: "1000px", margin: "0 auto" }}>
        <div className="lp-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0" }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              textAlign: "center", padding: "32px 24px",
              borderRight: i < STATS.length - 1 ? `1px solid ${C.border}` : "none",
            }}>
              <div style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, color: C.dark, letterSpacing: "-2px", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: C.mid, marginTop: "8px", fontWeight: 500, lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════ CAREER FACTS ════════════════ */}
      {/* ════════════════ RESUME-FORMAT SHOWCASE ════════════════ */}
      <section id="features" style={{ background: "rgba(124,58,237,0.03)", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "80px 32px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: C.dark, letterSpacing: "-1.2px", lineHeight: 1.1, marginBottom: "12px" }}>
              Everything you get.{" "}
              <Annotated color={C.violet}>Laid out clearly.</Annotated>
            </h2>
            <p style={{ fontSize: "14px", color: C.mid, lineHeight: 1.7 }}>
              No hidden tiers. No dark patterns. Read it like a resume — because that&apos;s what you came to build.
            </p>
          </div>

          {/* Resume-format card */}
          <div style={{ background: C.white, border: `1px solid rgba(0,0,0,0.12)`, borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

            {/* Resume header */}
            <div style={{ padding: "28px 32px 20px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "26px", fontWeight: 900, color: C.dark, letterSpacing: "-0.8px", lineHeight: 1 }}>Mithra AI</div>
                  <div style={{ fontSize: "13px", color: C.mid, marginTop: "4px", fontWeight: 500 }}>AI Career Platform · 8 Specialist Agents · Free to start</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: "rgba(16,185,129,0.1)", color: "#10b981", fontWeight: 700, border: "1px solid rgba(16,185,129,0.2)" }}>Free Plan Available</span>
                  <span style={{ fontSize: "11px", color: C.muted }}>mithraai.in</span>
                </div>
              </div>
            </div>

            {/* Summary section */}
            <div style={{ padding: "16px 32px", borderBottom: `1px solid ${C.border}`, background: "rgba(124,58,237,0.03)" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: C.violet, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px" }}>Summary</div>
              <p style={{ fontSize: "13px", color: C.mid, lineHeight: 1.7, margin: 0 }}>
                Built for serious job seekers. Not a job board, not a resume template site — a full AI-powered career co-pilot. Eight agents handle every step from resume to offer letter, working together in one platform.
              </p>
            </div>

            {/* Core capabilities */}
            <div style={{ padding: "20px 32px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: C.violet, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "14px" }}>Core Capabilities (Free Plan)</div>
              {[
                { skill: "Resume Builder",   detail: "Unlimited AI preview · LinkedIn import · Q&A builder",          badge: null },
                { skill: "ATS Score Check",  detail: "7-dimension analysis — always free, no limit",                  badge: "Always Free" },
                { skill: "Resume Adaptor",   detail: "3 AI adaptations/month · 5-lens analysis",                     badge: null },
                { skill: "Job Finder",       detail: "50+ portals · 5 searches/day · 8 results visible",             badge: null },
                { skill: "Interview Prep",   detail: "AI mock interviews · Company-specific questions",              badge: "Now Free" },
                { skill: "App Tracker",      detail: "Kanban board · Full pipeline · Status updates",                badge: "Now Free" },
                { skill: "Network Intel",    detail: "Find decision-makers · AI-drafted outreach",                   badge: null },
                { skill: "AI Chat (Mithra)", detail: "15 messages/day · Commands all 8 agents",                     badge: null },
              ].map((item, i, arr) => (
                <div key={item.skill} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", padding: "9px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: C.dark }}>{item.skill}</span>
                    <span style={{ fontSize: "12px", color: C.mid, marginLeft: "10px" }}>{item.detail}</span>
                  </div>
                  {item.badge && (
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0, background: item.badge === "Always Free" ? "rgba(16,185,129,0.1)" : "rgba(124,58,237,0.1)", color: item.badge === "Always Free" ? "#10b981" : C.violet, border: `1px solid ${item.badge === "Always Free" ? "rgba(16,185,129,0.2)" : "rgba(124,58,237,0.2)"}` }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Commitments */}
            <div style={{ padding: "16px 32px 20px" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: C.violet, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "12px" }}>Our Commitments</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                {NOT_IN_MITHRA.map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Check style={{ width: "14px", height: "14px", color: "#10b981", flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: C.mid, fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p style={{ textAlign: "center", fontSize: "12px", color: C.muted, marginTop: "16px" }}>
            Upgrade to Pro/Elite for unlimited access · <Link href="/pricing" style={{ color: C.violet, textDecoration: "none", fontWeight: 600 }}>See pricing →</Link>
          </p>
        </div>
      </section>

      {/* ════════════════ AGENTS ════════════════ */}
      <section style={{ padding: "80px 32px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: C.violet, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>Eight Agents</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: C.dark, marginBottom: "12px", letterSpacing: "-1.5px", lineHeight: 1.05 }}>
            Every part of the job search.{" "}
            <Annotated color={C.gold}>Handled.</Annotated>
          </h2>
          <p style={{ fontSize: "15px", color: C.mid, maxWidth: "440px", margin: "0 auto", lineHeight: 1.7 }}>
            Eight specialists. One conversation. No tab-switching.
          </p>
        </div>

        <div className="lp-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1px", background: C.border, border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
          {AGENTS.map((a) => {
            const typedA = a as typeof a & { badge?: string };
            return (
              <Link key={a.num} href={a.href} style={{ textDecoration: "none" }}>
                <div style={{
                  background: C.white, padding: "28px 24px",
                  transition: "background 0.15s",
                  cursor: "pointer",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F0FF")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "9px", background: C.violetL, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <a.icon style={{ width: "18px", height: "18px", color: C.violet }} />
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {typedA.badge && (
                        <span style={{ fontSize: "9px", fontWeight: 700, color: "#059669", background: "rgba(5,150,105,0.08)", padding: "2px 7px", borderRadius: "100px", border: "1px solid rgba(5,150,105,0.15)" }}>
                          {typedA.badge}
                        </span>
                      )}
                      <span style={{ fontSize: "10px", fontWeight: 600, color: C.muted, letterSpacing: "0.5px" }}>{a.num}</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: C.dark, marginBottom: "6px" }}>{a.label}</h3>
                  <p style={{ fontSize: "13px", color: C.mid, lineHeight: 1.6, marginBottom: "16px" }}>{a.desc}</p>
                  <span style={{ fontSize: "12px", color: C.violet, fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}>
                    Open <ChevronRight style={{ width: "12px", height: "12px" }} />
                  </span>
                </div>
              </Link>
            );
          })}

          {/* Orchestrator card */}
          <div style={{ background: C.dark, padding: "28px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "9px", background: C.violet, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageSquare style={{ width: "18px", height: "18px", color: "white" }} />
              </div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: C.gold, background: "rgba(245,158,11,0.1)", padding: "2px 8px", borderRadius: "100px", border: "1px solid rgba(245,158,11,0.2)" }}>
                Orchestrator
              </span>
            </div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "6px" }}>Mithra — Your AI</h3>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              Voice or text. One conversation commands all 8 agents — no switching tabs, no copy-pasting, no manual work.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section id="how-it-works" style={{ background: C.dark, padding: "80px 32px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
              The Process
            </p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "white", letterSpacing: "-1.5px", lineHeight: 1.05 }}>
              From zero to <Annotated color={C.gold}>offer.</Annotated>
            </h2>
          </div>

          <div className="lp-how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "40px" }}>
            {[
              { step: "1", title: "Build & Score", desc: "Chat with Mithra or paste your LinkedIn. Instant AI score across 6 resume dimensions — always free." },
              { step: "2", title: "Find & Adapt",  desc: "Search 50+ portals at once. Paste any JD and Mithra rewrites your resume for maximum ATS match." },
              { step: "3", title: "Apply & Network", desc: "Auto-apply via browser AI. Find decision-makers and get AI-drafted outreach that actually lands." },
              { step: "4", title: "Prep & Track", desc: "Company-specific mock interviews. Track every application from bookmark to offer letter." },
            ].map((s) => (
              <div key={s.step} style={{ textAlign: "center" }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "16px", fontWeight: 800, color: "white",
                  margin: "0 auto 18px",
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "10px" }}>{s.title}</h3>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ TESTIMONIALS ════════════════ */}
      <section style={{ padding: "80px 32px", background: C.white, maxWidth: "none" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: C.violet, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>Real results</p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: C.dark, letterSpacing: "-1.5px", lineHeight: 1.05 }}>
              What people are saying.
            </h2>
          </div>

          <div className="lp-testimonials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: "12px", padding: "28px 24px",
              }}>
                <div style={{ display: "flex", gap: "2px", marginBottom: "20px" }}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={C.gold}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  ))}
                </div>
                <p style={{ fontSize: "14px", color: C.mid, lineHeight: 1.75, marginBottom: "24px" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: C.violetL, border: `1px solid ${C.violetM}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: C.violet, flexShrink: 0 }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: C.dark }}>{t.name}</div>
                    <div style={{ fontSize: "12px", color: C.muted }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ CTA ════════════════ */}
      <section style={{ background: C.violet, padding: "80px 32px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 60px)", fontWeight: 900, color: "white", marginBottom: "16px", letterSpacing: "-2px", lineHeight: 1.05 }}>
            Your next offer<br />starts here.
          </h2>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.65)", marginBottom: "36px", lineHeight: 1.6 }}>
            Join thousands of job seekers who stopped applying blindly and started winning with Mithra.
          </p>
          <div className="lp-cta-buttons" style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{
              background: C.gold, color: "#111", textDecoration: "none",
              padding: "14px 32px", borderRadius: "9px", fontSize: "15px", fontWeight: 700,
              display: "flex", alignItems: "center", gap: "8px", transition: "background 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.goldD)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.gold)}>
              Start for free <ArrowRight style={{ width: "16px", height: "16px" }} />
            </Link>
            <Link href="/login" style={{
              background: "rgba(255,255,255,0.1)", color: "white", textDecoration: "none",
              padding: "14px 32px", borderRadius: "9px", fontSize: "15px", fontWeight: 500,
              display: "flex", alignItems: "center", gap: "8px",
              border: "1px solid rgba(255,255,255,0.2)", transition: "background 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}>
              Log in
            </Link>
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "20px" }}>
            No credit card required · Free plan always available
          </p>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="lp-footer" style={{
        background: C.dark,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "16px", maxWidth: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: C.violet, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles style={{ width: "11px", height: "11px", color: "white" }} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "white" }}>Mithra AI</span>
        </div>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.2)" }}>© 2026 Mithra AI. Built for job seekers everywhere.</p>
        <div style={{ display: "flex", gap: "24px" }}>
          {["Privacy", "Terms", "Contact"].map((l) => (
            <a key={l} href="#"
              style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
              {l}
            </a>
          ))}
        </div>
      </footer>

    </div>
  );
}

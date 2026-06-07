"use client";
import { useState } from "react";
import Link from "next/link";
import { FileText, Search, Zap, Users, Brain, BarChart3, Target, MessageSquare, ArrowRight, Star, Check, Sparkles, Menu, X, Award } from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const AGENTS = [
  {
    num: "01", icon: FileText, label: "Resume Builder",
    desc: "Every line you write is a promise to your future self. Build a resume that speaks before you enter the room.",
    color: "#8b5cf6", href: "/resume-builder",
  },
  {
    num: "02", icon: Award, label: "Resume Score",
    desc: "Know exactly where your resume wins and where it loses — instant AI scoring across 6 categories.",
    color: "#10b981", href: "/resume-score", badge: "Free",
  },
  {
    num: "03", icon: Target, label: "Resume Adaptor",
    desc: "A single role, seen through a thousand lenses — yours, theirs, and the one that matters most.",
    color: "#06b6d4", href: "/resume-adaptor",
  },
  {
    num: "04", icon: Search, label: "Job Finder",
    desc: "Somewhere in the noise of a million listings, one was written with you in mind.",
    color: "#3b82f6", href: "/job-finder",
  },
  {
    num: "05", icon: Zap, label: "Auto-Apply",
    desc: "While you sleep, Mithra knocks on doors. Every application, every portal, handled for you.",
    color: "#f59e0b", href: "/job-application",
  },
  {
    num: "06", icon: Users, label: "Network Intel",
    desc: "Your next colleague exists. You just haven't met yet. Mithra finds the bridge.",
    color: "#ec4899", href: "/network",
  },
  {
    num: "07", icon: Brain, label: "Interview Prep",
    desc: "The question is asked once. The answer is prepared a thousand times. Be that person.",
    color: "#f97316", href: "/interview-prep",
  },
  {
    num: "08", icon: BarChart3, label: "App Tracker",
    desc: "Every application is a seed. This is your garden. Watch each one grow toward the offer.",
    color: "#6366f1", href: "/tracker",
  },
];

const STATS = [
  { value: "3×", label: "More interview calls" },
  { value: "91%", label: "ATS pass rate" },
  { value: "12 hrs", label: "Saved per week" },
  { value: "50+", label: "Job portals searched" },
];

const TESTIMONIALS = [
  {
    quote: "Mithra built my resume, adapted it for Google, and drafted outreach to my future manager. Got the job in 3 weeks.",
    name: "Arjun Mehta", role: "Software Engineer → Google", initials: "AM", color: "#7c3aed",
  },
  {
    quote: "I was applying to 20+ companies manually. Mithra auto-applying let me focus entirely on interview prep. Game changer.",
    name: "Priya Nair", role: "PM → Flipkart", initials: "PN", color: "#06b6d4",
  },
  {
    quote: "The resume adaptor alone is worth it. My ATS score went from 42% to 91% for a Microsoft ML role in 30 seconds.",
    name: "Vikram Rao", role: "Data Scientist → Microsoft", initials: "VR", color: "#10b981",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Build & Score", desc: "Chat with Mithra or paste your LinkedIn profile. Get an instant AI score across 6 resume dimensions — free, always." },
  { step: "2", title: "Find & Adapt", desc: "Search 50+ portals simultaneously. Paste any JD and Mithra rewrites your resume for maximum ATS match score." },
  { step: "3", title: "Apply & Network", desc: "Auto-apply with browser AI. Find the right people at target companies and get AI-drafted outreach messages." },
  { step: "4", title: "Prep & Track", desc: "Practice with company-specific mock interviews. Track every application from bookmark to offer letter." },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ background: "#0a0614", color: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh" }}>

      {/* ── NAV ── */}
      <nav className="lp-nav" style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,6,20,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(124,58,237,0.12)",
        padding: "0 24px", height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(124,58,237,0.5)",
          }}>
            <Sparkles style={{ width: "16px", height: "16px", color: "white" }} />
          </div>
          <span style={{ fontSize: "20px", fontWeight: 800, background: "linear-gradient(135deg,#a78bfa,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Mithra AI
          </span>
        </div>

        {/* Desktop links */}
        <div className="lp-nav-links" style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <div style={{ display: "flex", gap: "28px" }}>
            {["Features", "How it Works", "Pricing"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                style={{ fontSize: "14px", color: "#94a3b8", textDecoration: "none", fontWeight: 500 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}>
                {l}
              </a>
            ))}
          </div>
          <Link href="/register" style={{
            background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
            color: "white", textDecoration: "none",
            padding: "10px 20px", borderRadius: "10px",
            fontSize: "14px", fontWeight: 600,
            display: "flex", alignItems: "center", gap: "6px",
            boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
          }}>
            Begin your story <ArrowRight style={{ width: "15px", height: "15px" }} />
          </Link>
        </div>

        {/* Mobile right: CTA + hamburger */}
        <div className="lp-mob-menu-btn" style={{ gap: "10px" }}>
          <Link href="/register" style={{
            background: "linear-gradient(135deg,#f59e0b,#d97706)",
            color: "#0a0614", textDecoration: "none",
            padding: "8px 16px", borderRadius: "10px",
            fontSize: "13px", fontWeight: 700,
          }}>
            Start Free
          </Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "#a78bfa", padding: "4px" }}>
            {mobileMenuOpen ? <X style={{ width: "22px", height: "22px" }} /> : <Menu style={{ width: "22px", height: "22px" }} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div style={{ background: "rgba(10,6,20,0.98)", borderBottom: "1px solid rgba(124,58,237,0.15)", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {[
            { label: "Features", href: "#features" },
            { label: "How it Works", href: "#how-it-works" },
            { label: "Pricing", href: "#pricing" },
          ].map((l) => (
            <a key={l.label} href={l.href} onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: "16px", color: "#cbd5e1", textDecoration: "none", fontWeight: 500, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "block" }}>
              {l.label}
            </a>
          ))}
          <Link href="/login" onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: "16px", color: "#a78bfa", textDecoration: "none", fontWeight: 500, padding: "12px 0" }}>
            Log in →
          </Link>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="lp-hero" style={{ padding: "100px 24px 80px", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "6px 16px", borderRadius: "100px", marginBottom: "32px",
          background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)",
          fontSize: "13px", color: "#a78bfa", fontWeight: 500,
        }}>
          <Sparkles style={{ width: "13px", height: "13px", color: "#f59e0b" }} />
          8 Specialist AI Agents · One Career Platform
        </div>

        <h1 style={{
          fontSize: "clamp(40px, 7vw, 72px)", fontWeight: 900,
          lineHeight: 1.05, marginBottom: "24px", letterSpacing: "-1.5px",
        }}>
          <span style={{ color: "#f8fafc" }}>Your career isn&apos;t a document.</span>
          <br />
          <span style={{ background: "linear-gradient(135deg,#a78bfa 0%,#f59e0b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            It&apos;s a story waiting to find the right reader.
          </span>
        </h1>

        <p style={{ fontSize: "18px", color: "#94a3b8", lineHeight: 1.7, marginBottom: "40px", maxWidth: "560px", margin: "0 auto 40px" }}>
          Mithra shapes your narrative — from the first word of your resume to the handshake that closes the offer.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={{
            background: "linear-gradient(135deg,#f59e0b,#d97706)",
            color: "#0a0614", textDecoration: "none",
            padding: "14px 32px", borderRadius: "12px",
            fontSize: "16px", fontWeight: 700,
            display: "flex", alignItems: "center", gap: "8px",
            boxShadow: "0 8px 24px rgba(245,158,11,0.35)",
          }}>
            Begin your story <ArrowRight style={{ width: "18px", height: "18px" }} />
          </Link>
          <a href="#features" style={{
            background: "transparent", color: "#a78bfa",
            border: "1px solid rgba(124,58,237,0.4)",
            padding: "14px 32px", borderRadius: "12px",
            fontSize: "16px", fontWeight: 500,
            display: "flex", alignItems: "center", gap: "8px",
            textDecoration: "none",
          }}>
            See how it works
          </a>
        </div>

        {/* Stats */}
        <div className="lp-stats" style={{ display: "flex", justifyContent: "center", gap: "48px", marginTop: "64px", flexWrap: "wrap" }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "36px", fontWeight: 900, background: "linear-gradient(135deg,#a78bfa,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {s.value}
              </div>
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ height: "1px", background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.2),transparent)", margin: "0 24px" }} />

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "80px 24px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#7c3aed", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
            8 Specialist AI Agents
          </p>
          <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 900, color: "#f8fafc", marginBottom: "14px" }}>
            Eight chapters. One story.
          </h2>
          <p style={{ fontSize: "16px", color: "#64748b", maxWidth: "480px", margin: "0 auto" }}>
            Eight specialist AI agents — each mastering a different act of your career journey, all commanded through a single conversation with Mithra.
          </p>
        </div>

        <div className="lp-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {AGENTS.map((a) => (
            <Link key={a.num} href={a.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: "rgba(20,13,40,0.8)", border: "1px solid rgba(124,58,237,0.12)",
                borderRadius: "16px", padding: "24px",
                transition: "all 0.2s ease", cursor: "pointer",
              }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = `${a.color}40`;
                  el.style.transform = "translateY(-3px)";
                  el.style.boxShadow = `0 8px 32px ${a.color}18`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(124,58,237,0.12)";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    background: `${a.color}18`, display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${a.color}25`,
                  }}>
                    <a.icon style={{ width: "22px", height: "22px", color: a.color }} />
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {(a as typeof a & { badge?: string }).badge && (
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.15)", padding: "2px 7px", borderRadius: "100px", border: "1px solid rgba(16,185,129,0.3)" }}>
                        {(a as typeof a & { badge?: string }).badge}
                      </span>
                    )}
                    <span style={{
                      fontSize: "11px", fontWeight: 700, color: a.color,
                      background: `${a.color}12`, padding: "3px 8px", borderRadius: "100px",
                      border: `1px solid ${a.color}25`,
                    }}>
                      Agent {a.num}
                    </span>
                  </div>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", marginBottom: "8px" }}>{a.label}</h3>
                <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6, marginBottom: "16px" }}>{a.desc}</p>
                <span style={{ fontSize: "12px", color: a.color, fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                  Open <ArrowRight style={{ width: "12px", height: "12px" }} />
                </span>
              </div>
            </Link>
          ))}

          {/* Mithra orchestrator card */}
          <div style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(245,158,11,0.08) 100%)",
            border: "1px solid rgba(245,158,11,0.25)", borderRadius: "16px", padding: "24px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "linear-gradient(135deg,#7c3aed,#f59e0b)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 20px rgba(124,58,237,0.4)",
              }}>
                <MessageSquare style={{ width: "22px", height: "22px", color: "white" }} />
              </div>
              <span style={{
                fontSize: "11px", fontWeight: 700, color: "#f59e0b",
                background: "rgba(245,158,11,0.12)", padding: "3px 8px", borderRadius: "100px",
                border: "1px solid rgba(245,158,11,0.25)",
              }}>
                Orchestrator
              </span>
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", marginBottom: "8px" }}>Mithra — Your AI</h3>
            <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6 }}>
              Voice or text. One conversation commands all 7 agents — build resume, find jobs, apply, prep for interviews, all without switching tabs.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: "80px 24px", background: "rgba(124,58,237,0.03)", borderTop: "1px solid rgba(124,58,237,0.08)", borderBottom: "1px solid rgba(124,58,237,0.08)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#7c3aed", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
              How it Works
            </p>
            <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 900, color: "#f8fafc" }}>
              From Zero to Offer in 4 Steps
            </h2>
          </div>

          <div className="lp-how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "32px" }}>
            {HOW_IT_WORKS.map((s, i) => (
              <div key={s.step} style={{ textAlign: "center" }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "14px",
                  background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "18px", fontWeight: 900, color: "white",
                  margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc", marginBottom: "8px" }}>{s.title}</h3>
                <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "80px 24px", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 900, color: "#f8fafc", marginBottom: "8px" }}>
            Real People, <span style={{ background: "linear-gradient(135deg,#a78bfa,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Real Results</span>
          </h2>
        </div>

        <div className="lp-testimonials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} style={{
              background: "rgba(20,13,40,0.8)", border: "1px solid rgba(124,58,237,0.12)",
              borderRadius: "16px", padding: "24px",
            }}>
              <div style={{ display: "flex", gap: "2px", marginBottom: "16px" }}>
                {[...Array(5)].map((_, i) => <Star key={i} style={{ width: "14px", height: "14px", fill: "#f59e0b", color: "#f59e0b" }} />)}
              </div>
              <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: 1.7, marginBottom: "20px", fontStyle: "italic" }}>
                "{t.quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "38px", height: "38px", borderRadius: "100%",
                  background: t.color, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: 700, color: "white", flexShrink: 0,
                }}>
                  {t.initials}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#f8fafc" }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "0 16px 64px" }}>
        <div className="lp-cta-box" style={{
          maxWidth: "640px", margin: "0 auto", textAlign: "center",
          background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(245,158,11,0.06) 100%)",
          border: "1px solid rgba(124,58,237,0.25)", borderRadius: "24px", padding: "56px 40px",
        }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🚀</div>
          <h2 style={{ fontSize: "clamp(22px,4vw,36px)", fontWeight: 900, color: "#f8fafc", marginBottom: "12px" }}>
            Every great career began with a single step forward.
          </h2>
          <p style={{ fontSize: "16px", color: "#64748b", marginBottom: "32px" }}>
            Join thousands of job seekers whose stories Mithra helped write.
          </p>
          <div className="lp-cta-buttons" style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{
              background: "linear-gradient(135deg,#f59e0b,#d97706)",
              color: "#0a0614", textDecoration: "none",
              padding: "14px 32px", borderRadius: "12px",
              fontSize: "16px", fontWeight: 700,
              display: "flex", alignItems: "center", gap: "8px",
              boxShadow: "0 8px 24px rgba(245,158,11,0.3)",
            }}>
              Begin your story <ArrowRight style={{ width: "18px", height: "18px" }} />
            </Link>
          </div>
          <p style={{ fontSize: "12px", color: "#475569", marginTop: "16px" }}>No credit card required</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer" style={{
        borderTop: "1px solid rgba(124,58,237,0.08)",
        padding: "32px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "16px", maxWidth: "1100px", margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "24px", height: "24px", borderRadius: "7px",
            background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles style={{ width: "12px", height: "12px", color: "white" }} />
          </div>
          <span style={{ fontWeight: 700, background: "linear-gradient(135deg,#a78bfa,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Mithra AI
          </span>
        </div>
        <p style={{ fontSize: "13px", color: "#334155" }}>© 2026 Mithra AI. Built for job seekers everywhere.</p>
        <div style={{ display: "flex", gap: "24px" }}>
          {["Privacy", "Terms", "Contact"].map((l) => (
            <a key={l} href="#" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#94a3b8")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}>
              {l}
            </a>
          ))}
        </div>
      </footer>

    </div>
  );
}

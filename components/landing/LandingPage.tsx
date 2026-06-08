"use client";
import { useState } from "react";
import Link from "next/link";
import { FileText, Search, Zap, Users, Brain, BarChart3, Target, MessageSquare, ArrowRight, Check, Sparkles, Menu, X, Award, ChevronRight } from "lucide-react";

const AGENTS = [
  { num: "01", icon: FileText, label: "Resume Builder",  desc: "Build a resume from your LinkedIn, a paste, or a conversation with Mithra. ATS-ready in minutes.", href: "/resume-builder" },
  { num: "02", icon: Award,    label: "Resume Score",    desc: "Instant AI scoring across 6 dimensions — know exactly where your resume wins and loses.", href: "/resume-score", badge: "Free" },
  { num: "03", icon: Target,   label: "Resume Adaptor",  desc: "Paste any job description. Mithra rewrites your resume for maximum ATS match in seconds.", href: "/resume-adaptor" },
  { num: "04", icon: Search,   label: "Job Finder",      desc: "Search 50+ portals simultaneously. Filters by role, location, salary, recency — one view.", href: "/job-finder" },
  { num: "05", icon: Zap,      label: "Auto-Apply",      desc: "AI fills and submits applications across portals while you focus on what matters.", href: "/job-application" },
  { num: "06", icon: Users,    label: "Network Intel",   desc: "Find the right people at target companies. Get AI-drafted outreach that actually lands.", href: "/network" },
  { num: "07", icon: Brain,    label: "Interview Prep",  desc: "Company-specific mock interviews with instant feedback on content, tone, and structure.", href: "/interview-prep" },
  { num: "08", icon: BarChart3, label: "App Tracker",   desc: "Track every application from saved to offer. Spot patterns. Never let a lead go cold.", href: "/tracker" },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Build & Score", desc: "Chat with Mithra or paste your LinkedIn. Get an instant AI score across 6 resume dimensions — always free." },
  { step: "2", title: "Find & Adapt",  desc: "Search 50+ portals at once. Paste any JD and Mithra rewrites your resume for maximum ATS match." },
  { step: "3", title: "Apply & Network", desc: "Auto-apply via browser AI. Find decision-makers at target companies and get AI-drafted outreach." },
  { step: "4", title: "Prep & Track", desc: "Practice company-specific interviews. Track every application from bookmark to offer letter." },
];

const TESTIMONIALS = [
  { quote: "Mithra built my resume, adapted it for Google, and drafted outreach to my future manager. Got the job in 3 weeks.", name: "Arjun Mehta", role: "Software Engineer → Google", initials: "AM" },
  { quote: "I was applying to 20+ companies manually. Mithra auto-applying let me focus entirely on interview prep.", name: "Priya Nair",   role: "PM → Flipkart",          initials: "PN" },
  { quote: "My ATS score went from 42% to 91% for a Microsoft ML role in 30 seconds. The adaptor alone is worth it.", name: "Vikram Rao",   role: "Data Scientist → Microsoft", initials: "VR" },
];

const STATS = [
  { value: "3×",    label: "More interview calls" },
  { value: "91%",   label: "ATS pass rate" },
  { value: "12 hrs", label: "Saved per week" },
  { value: "50+",   label: "Job portals searched" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ background: "#080810", color: "#f4f4f5", fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh" }}>

      {/* ── NAV ── */}
      <nav className="lp-nav" style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(8,8,16,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 32px", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px",
            background: "#7c3aed",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Sparkles style={{ width: "15px", height: "15px", color: "white" }} />
          </div>
          <span style={{ fontSize: "17px", fontWeight: 800, color: "#f4f4f5", letterSpacing: "-0.3px" }}>
            Mithra AI
          </span>
        </div>

        {/* Desktop links */}
        <div className="lp-nav-links" style={{ display: "flex", alignItems: "center", gap: "36px" }}>
          <div style={{ display: "flex", gap: "28px" }}>
            {["Features", "How it Works", "Pricing"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                style={{ fontSize: "14px", color: "#71717a", textDecoration: "none", fontWeight: 500, transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f4f4f5")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}>
                {l}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link href="/login" style={{ fontSize: "14px", color: "#a1a1aa", textDecoration: "none", fontWeight: 500, padding: "8px 14px" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f4f4f5")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}>
              Log in
            </Link>
            <Link href="/register" style={{
              background: "#7c3aed", color: "white", textDecoration: "none",
              padding: "9px 18px", borderRadius: "8px",
              fontSize: "14px", fontWeight: 600,
              display: "flex", alignItems: "center", gap: "6px",
              transition: "background 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#6d28d9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#7c3aed")}>
              Get started <ArrowRight style={{ width: "14px", height: "14px" }} />
            </Link>
          </div>
        </div>

        {/* Mobile right */}
        <div className="lp-mob-menu-btn" style={{ gap: "8px" }}>
          <Link href="/register" style={{
            background: "#7c3aed", color: "white", textDecoration: "none",
            padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
          }}>
            Start Free
          </Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "#a1a1aa", padding: "4px" }}>
            {mobileMenuOpen ? <X style={{ width: "20px", height: "20px" }} /> : <Menu style={{ width: "20px", height: "20px" }} />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div style={{ background: "#0c0c18", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "8px 20px 16px", display: "flex", flexDirection: "column" }}>
          {[
            { label: "Features", href: "#features" },
            { label: "How it Works", href: "#how-it-works" },
            { label: "Pricing", href: "#pricing" },
          ].map((l) => (
            <a key={l.label} href={l.href} onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: "15px", color: "#a1a1aa", textDecoration: "none", fontWeight: 500, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "block" }}>
              {l.label}
            </a>
          ))}
          <Link href="/login" onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: "15px", color: "#7c3aed", textDecoration: "none", fontWeight: 500, padding: "12px 0" }}>
            Log in
          </Link>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="lp-hero" style={{ padding: "96px 32px 80px", textAlign: "center", maxWidth: "760px", margin: "0 auto" }}>

        {/* Label */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "7px",
          padding: "5px 14px", borderRadius: "100px", marginBottom: "36px",
          background: "rgba(124,58,237,0.08)",
          border: "1px solid rgba(124,58,237,0.2)",
          fontSize: "12px", color: "#a78bfa", fontWeight: 600, letterSpacing: "0.2px",
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7c3aed", flexShrink: 0 }} />
          8 Specialist AI Agents · One Career Platform
        </div>

        <h1 style={{
          fontSize: "clamp(38px, 6.5vw, 68px)", fontWeight: 800,
          lineHeight: 1.08, marginBottom: "24px", letterSpacing: "-2px",
        }}>
          <span style={{ color: "#f4f4f5" }}>Your career isn&apos;t a document.</span>
          <br />
          <span className="gradient-text">It&apos;s a story waiting to find the right reader.</span>
        </h1>

        <p style={{ fontSize: "17px", color: "#71717a", lineHeight: 1.7, maxWidth: "520px", margin: "0 auto 40px" }}>
          Mithra shapes your narrative — from the first word of your resume to the handshake that closes the offer.
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={{
            background: "#f59e0b", color: "#080810", textDecoration: "none",
            padding: "13px 28px", borderRadius: "9px",
            fontSize: "15px", fontWeight: 700,
            display: "flex", alignItems: "center", gap: "7px",
            transition: "background 0.15s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#d97706")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f59e0b")}>
            Begin your story <ArrowRight style={{ width: "16px", height: "16px" }} />
          </Link>
          <a href="#features" style={{
            background: "transparent", color: "#a1a1aa",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "13px 28px", borderRadius: "9px",
            fontSize: "15px", fontWeight: 500,
            display: "flex", alignItems: "center", gap: "7px",
            textDecoration: "none", transition: "border-color 0.15s, color 0.15s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#f4f4f5"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#a1a1aa"; }}>
            See how it works
          </a>
        </div>

        {/* Stats */}
        <div className="lp-stats" style={{ display: "flex", justifyContent: "center", gap: "56px", marginTop: "72px", flexWrap: "wrap" }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "30px", fontWeight: 800, color: "#f4f4f5", letterSpacing: "-0.5px" }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: "#52525b", marginTop: "4px", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "0 32px" }} />

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "80px 32px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
            Eight Agents
          </p>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#f4f4f5", marginBottom: "12px", letterSpacing: "-0.5px" }}>
            Eight chapters. One story.
          </h2>
          <p style={{ fontSize: "15px", color: "#52525b", maxWidth: "460px", margin: "0 auto", lineHeight: 1.7 }}>
            Eight specialist AI agents, each mastering a different act of your career journey — commanded through one conversation.
          </p>
        </div>

        <div className="lp-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
          {AGENTS.map((a) => {
            const typedA = a as typeof a & { badge?: string };
            return (
              <Link key={a.num} href={a.href} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "#0f0f1a",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px", padding: "24px",
                  transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
                  cursor: "pointer", height: "100%",
                }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(124,58,237,0.3)";
                    el.style.transform = "translateY(-2px)";
                    el.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(255,255,255,0.06)";
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = "none";
                  }}>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <a.icon style={{ width: "19px", height: "19px", color: "#7c3aed" }} />
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {typedA.badge && (
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "2px 7px", borderRadius: "100px", border: "1px solid rgba(16,185,129,0.2)" }}>
                          {typedA.badge}
                        </span>
                      )}
                      <span style={{ fontSize: "10px", fontWeight: 600, color: "#3f3f46", fontVariantNumeric: "tabular-nums" }}>
                        {a.num}
                      </span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#f4f4f5", marginBottom: "8px" }}>{a.label}</h3>
                  <p style={{ fontSize: "13px", color: "#52525b", lineHeight: 1.65, marginBottom: "18px" }}>{a.desc}</p>
                  <span style={{ fontSize: "12px", color: "#7c3aed", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}>
                    Open <ChevronRight style={{ width: "12px", height: "12px" }} />
                  </span>
                </div>
              </Link>
            );
          })}

          {/* Mithra orchestrator card */}
          <div style={{
            background: "#0f0f1a",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: "12px", padding: "24px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageSquare style={{ width: "19px", height: "19px", color: "white" }} />
              </div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "2px 8px", borderRadius: "100px", border: "1px solid rgba(245,158,11,0.2)" }}>
                Orchestrator
              </span>
            </div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#f4f4f5", marginBottom: "8px" }}>Mithra — Your AI</h3>
            <p style={{ fontSize: "13px", color: "#52525b", lineHeight: 1.65 }}>
              Voice or text. One conversation commands all 8 agents — build resume, find jobs, apply, prep for interviews — without switching tabs.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: "80px 32px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: "880px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
              How it Works
            </p>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#f4f4f5", letterSpacing: "-0.5px" }}>
              From zero to offer in 4 steps
            </h2>
          </div>

          <div className="lp-how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "36px" }}>
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} style={{ textAlign: "center" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "15px", fontWeight: 700, color: "#7c3aed",
                  margin: "0 auto 16px",
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f4f4f5", marginBottom: "8px" }}>{s.title}</h3>
                <p style={{ fontSize: "13px", color: "#52525b", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "80px 32px", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#f4f4f5", letterSpacing: "-0.5px" }}>
            Real people. Real results.
          </h2>
        </div>

        <div className="lp-testimonials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} style={{
              background: "#0f0f1a",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px", padding: "24px",
            }}>
              <div style={{ display: "flex", gap: "3px", marginBottom: "18px" }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p style={{ fontSize: "14px", color: "#a1a1aa", lineHeight: 1.75, marginBottom: "20px" }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#71717a", flexShrink: 0 }}>
                  {t.initials}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#f4f4f5" }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: "#3f3f46" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "0 24px 80px" }}>
        <div className="lp-cta-box" style={{
          maxWidth: "600px", margin: "0 auto", textAlign: "center",
          background: "#0f0f1a",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px", padding: "56px 40px",
        }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Sparkles style={{ width: "20px", height: "20px", color: "white" }} />
          </div>
          <h2 style={{ fontSize: "clamp(20px, 3.5vw, 32px)", fontWeight: 800, color: "#f4f4f5", marginBottom: "12px", letterSpacing: "-0.3px" }}>
            Every great career started with a single step.
          </h2>
          <p style={{ fontSize: "15px", color: "#52525b", marginBottom: "32px", lineHeight: 1.6 }}>
            Join thousands of job seekers who let Mithra do the heavy lifting.
          </p>
          <div className="lp-cta-buttons" style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{
              background: "#f59e0b", color: "#080810", textDecoration: "none",
              padding: "13px 28px", borderRadius: "9px",
              fontSize: "15px", fontWeight: 700,
              display: "flex", alignItems: "center", gap: "7px",
              transition: "background 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#d97706")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#f59e0b")}>
              Begin your story <ArrowRight style={{ width: "16px", height: "16px" }} />
            </Link>
          </div>
          <p style={{ fontSize: "12px", color: "#3f3f46", marginTop: "16px" }}>No credit card required · Free plan always available</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer" style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "28px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "16px", maxWidth: "1100px", margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles style={{ width: "11px", height: "11px", color: "white" }} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#f4f4f5" }}>Mithra AI</span>
        </div>
        <p style={{ fontSize: "13px", color: "#27272a" }}>© 2026 Mithra AI. Built for job seekers everywhere.</p>
        <div style={{ display: "flex", gap: "24px" }}>
          {["Privacy", "Terms", "Contact"].map((l) => (
            <a key={l} href="#" style={{ fontSize: "13px", color: "#3f3f46", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#71717a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3f3f46")}>
              {l}
            </a>
          ))}
        </div>
      </footer>

    </div>
  );
}

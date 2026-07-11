"use client";
// Linear-style command centre — the first thing users see after login.
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Target, Search, Zap, Brain, FileText, ArrowRight, Coins,
  Briefcase, TrendingUp, CalendarCheck, Award,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/auth";
import { useCredits } from "@/lib/credits";

interface TrackerApp {
  id: string; company: string; role: string; status: string; applied_date: string;
}

const QUICK_ACTIONS = [
  { href: "/resume-adaptor", icon: Target, label: "Adapt Resume", desc: "Tailor your resume to a JD", cost: "25 cr", accent: "#0F6E55" },
  { href: "/job-finder", icon: Search, label: "Find Jobs", desc: "Real listings matched to you", cost: "2 cr", accent: "#0A66C2" },
  { href: "/job-application", icon: Zap, label: "Auto Apply", desc: "Assistant fills & submits", cost: "8 cr", accent: "#D97706" },
  { href: "/interview-prep", icon: Brain, label: "Interview Prep", desc: "Mock questions + feedback", cost: "10 cr", accent: "#7A3E9D" },
  { href: "/resume-builder", icon: FileText, label: "Resume Builder", desc: "Build or import a resume", cost: "15 cr", accent: "#0F766E" },
  { href: "/resume-score", icon: Award, label: "Resume Score", desc: "7-dimension ATS audit", cost: "FREE", accent: "#10B981" },
];

const STATUS_COLORS: Record<string, string> = {
  bookmarked: "#8A8474", applied: "#0A66C2", screening: "#D97706",
  interview: "#7A3E9D", offer: "#10B981", rejected: "#DC2626", accepted: "#10B981",
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useUser();
  const { credits } = useCredits();
  const [apps, setApps] = useState<TrackerApp[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = () => {
      api.get("/tracker/")
        .then(({ data }) => {
          const board = data.board || {};
          const all: TrackerApp[] = Object.values(board).flat() as TrackerApp[];
          setApps(all);
        })
        .catch(() => {})
        .finally(() => setLoaded(true));
    };
    load();
    window.addEventListener("focus", load);
    window.addEventListener("mithra:tracker-changed", load);
    return () => {
      window.removeEventListener("focus", load);
      window.removeEventListener("mithra:tracker-changed", load);
    };
  }, []);

  const stats = [
    { label: "Applications", value: apps.length, Icon: Briefcase },
    { label: "In interview", value: apps.filter(a => a.status === "interview").length, Icon: CalendarCheck },
    { label: "Offers", value: apps.filter(a => ["offer", "accepted"].includes(a.status)).length, Icon: TrendingUp },
  ];

  const firstName = user?.name?.split(" ")[0] || "there";
  const recent = apps.slice(0, 5);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "32px 28px 48px" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: "clamp(24px,3.4vw,34px)", fontWeight: 600, color: "#14281E", marginBottom: "4px" }}>
            {greeting()}, {firstName}
          </h1>
          <p style={{ fontSize: "14px", color: "#8A8474", fontStyle: "italic", marginBottom: "28px" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} — let's move your search forward.
          </p>
        </motion.div>

        {/* Stat row: credits + pipeline */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "28px" }}>

          {/* Credits card — ink panel */}
          <Link href="/pricing" style={{ textDecoration: "none" }}>
            <div style={{ background: "linear-gradient(178deg,#0C221B,#0A1D17)", borderRadius: "14px", padding: "18px", height: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <Coins style={{ width: "13px", height: "13px", color: "#E9C46A" }} />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(245,241,230,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Credits</span>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#F5F1E6", lineHeight: 1 }}>
                {credits ? credits.balance.toLocaleString("en-IN") : "—"}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(245,241,230,0.45)", marginTop: "6px" }}>
                {credits ? `${credits.plan} plan · renews monthly` : "sign in to see balance"}
              </div>
            </div>
          </Link>

          {stats.map(({ label, value, Icon }) => (
            <div key={label} style={{ background: "#FFFFFF", border: "1px solid rgba(20,40,30,0.09)", borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <Icon style={{ width: "13px", height: "13px", color: "#0F6E55" }} />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#8A8474", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#14281E", lineHeight: 1 }}>{loaded ? value : "—"}</div>
            </div>
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#14281E" }}>Quick actions</h2>
            <span style={{ fontSize: "11px", color: "#8A8474" }}>credit cost shown per action</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px", marginBottom: "32px" }}>
            {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, cost, accent }) => (
              <Link key={href} href={href} style={{ textDecoration: "none" }}>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}
                  style={{
                    background: "#FFFFFF", border: "1px solid rgba(20,40,30,0.09)", borderRadius: "14px",
                    padding: "16px", display: "flex", alignItems: "center", gap: "13px",
                    transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 24px rgba(12,34,27,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${accent}12`, border: `1px solid ${accent}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon style={{ width: "17px", height: "17px", color: accent }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#14281E" }}>{label}</span>
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "8px", background: cost === "FREE" ? "rgba(16,185,129,0.1)" : "rgba(15,110,85,0.07)", color: cost === "FREE" ? "#10B981" : "#0F6E55" }}>{cost}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#8A8474", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{desc}</div>
                  </div>
                  <ArrowRight style={{ width: "14px", height: "14px", color: "#C9C2B2", flexShrink: 0 }} />
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent applications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#14281E" }}>Recent applications</h2>
            <Link href="/tracker" style={{ fontSize: "12px", color: "#0F6E55", fontWeight: 600, textDecoration: "none" }}>Open tracker →</Link>
          </div>

          {recent.length === 0 ? (
            <div style={{ background: "#FFFFFF", border: "1px dashed rgba(20,40,30,0.15)", borderRadius: "14px", padding: "28px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#8A8474", marginBottom: "12px" }}>
                {loaded ? "No applications tracked yet — apply to a job and it lands here automatically." : "Loading…"}
              </p>
              {loaded && (
                <Link href="/job-finder" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#0F6E55", textDecoration: "none" }}>
                  <Search style={{ width: "13px", height: "13px" }} /> Find your first match
                </Link>
              )}
            </div>
          ) : (
            <div style={{ background: "#FFFFFF", border: "1px solid rgba(20,40,30,0.09)", borderRadius: "14px", overflow: "hidden" }}>
              {recent.map((a, i) => (
                <Link key={a.id} href="/tracker" style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "12px", padding: "13px 16px",
                    borderTop: i > 0 ? "1px solid rgba(20,40,30,0.06)" : "none",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(15,110,85,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(15,110,85,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#0F6E55", flexShrink: 0 }}>
                      {a.company?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#14281E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.role}</div>
                      <div style={{ fontSize: "11.5px", color: "#8A8474" }}>{a.company}</div>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "12px", background: `${STATUS_COLORS[a.status] || "#8A8474"}14`, color: STATUS_COLORS[a.status] || "#8A8474", textTransform: "capitalize", flexShrink: 0 }}>
                      {a.status}
                    </span>
                    <span style={{ fontSize: "11px", color: "#C9C2B2", flexShrink: 0 }}>{a.applied_date}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

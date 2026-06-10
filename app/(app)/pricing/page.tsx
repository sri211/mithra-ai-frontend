"use client";
import { PricingCard } from "@/components/pricing/PricingCard";
import { useUser } from "@/lib/auth";
import { FileText } from "lucide-react";

const PLANS = [
  {
    plan: "free" as const,
    name: "Free",
    price: 0,
    tagline: "Your career foundation",
    accent: "#10b981",
    features: [
      "5 resume adaptations/month",
      "3 resume templates (Modern, Minimal, Classic)",
      "Up to 5 network contacts per search",
      "Job Finder with real listings",
      "Mithra AI chat assistant",
      "Resume Builder (all modes)",
    ],
  },
  {
    plan: "pro" as const,
    name: "Pro",
    price: 198,
    tagline: "For serious job seekers",
    accent: "#7c3aed",
    isPopular: true,
    features: [
      "Unlimited resume adaptations",
      "All 6 templates + PDF export",
      "Full network (up to 10 contacts)",
      "Interview Prep — AI mock sessions",
      "Application Tracker (Kanban board)",
      "Priority email support",
    ],
  },
  {
    plan: "elite" as const,
    name: "Elite",
    price: 498,
    tagline: "For the ambitious",
    accent: "#f59e0b",
    features: [
      "Everything in Pro",
      "Auto-Apply (when fully launched)",
      "Unlimited network contacts",
      "Priority AI processing",
      "1-on-1 career coaching session/month",
      "Dedicated success manager",
    ],
  },
];

export default function PricingPage() {
  const { user } = useUser();
  const currentPlan = (user?.plan ?? "free") as "free" | "pro" | "elite";

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1100px", margin: "0 auto", color: "#111111" }}>

      {/* Page header — resume document style */}
      <div style={{ textAlign: "center", marginBottom: "52px" }}>

        {/* Document-style top label */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(124,58,237,0.06)",
          border: "1px solid rgba(124,58,237,0.18)",
          borderRadius: "100px",
          padding: "5px 14px",
          marginBottom: "20px",
        }}>
          <FileText style={{ width: "13px", height: "13px", color: "#7c3aed" }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Choose Your Plan
          </span>
        </div>

        <h1 style={{
          fontSize: "clamp(26px,4vw,44px)",
          fontWeight: 900,
          lineHeight: 1.15,
          color: "#111111",
          marginBottom: "14px",
        }}>
          Invest in the story
          <br />
          <span style={{
            background: "linear-gradient(135deg,#7c3aed,#f59e0b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            only you can tell.
          </span>
        </h1>

        <p style={{ fontSize: "15px", color: "#666666", maxWidth: "460px", margin: "0 auto", lineHeight: 1.7 }}>
          Every plan includes the full power of Mithra AI. Upgrade to unlock the tools that match where you want to go.
        </p>

        {/* Resume-style section rule */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", maxWidth: "320px", margin: "28px auto 0" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.1)" }} />
          <span style={{ fontSize: "11px", color: "#999999", letterSpacing: "1px" }}>PLANS</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.1)" }} />
        </div>
      </div>

      {/* Plan cards */}
      <div style={{
        display: "flex",
        gap: "20px",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "stretch",
      }}>
        {PLANS.map((p) => (
          <PricingCard
            key={p.plan}
            {...p}
            isCurrent={p.plan === currentPlan}
          />
        ))}
      </div>

      {/* Footer note */}
      <div style={{
        textAlign: "center",
        marginTop: "44px",
        padding: "16px 24px",
        background: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid rgba(0,0,0,0.07)",
        maxWidth: "480px",
        margin: "44px auto 0",
      }}>
        <p style={{ fontSize: "13px", color: "#666666", lineHeight: 1.6 }}>
          Month-to-month. No lock-in. Cancel anytime.<br />
          <span style={{ color: "#999999", fontSize: "12px" }}>Prices in INR, inclusive of all taxes.</span>
        </p>
      </div>
    </div>
  );
}

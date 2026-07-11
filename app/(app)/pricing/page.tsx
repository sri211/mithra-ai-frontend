"use client";
import { useState } from "react";
import { PricingCard } from "@/components/pricing/PricingCard";
import { useUser } from "@/lib/auth";
import { FileText, Coins, Zap, Loader2 } from "lucide-react";
import { buyTopup, useCredits } from "@/lib/credits";

const PLANS = [
  {
    plan: "free" as const,
    name: "Free",
    price: 0,
    tagline: "30 credits every month",
    accent: "#10b981",
    features: [
      "30 credits/month — try everything",
      "Resume Score always free (0 credits)",
      "3 resume templates",
      "Job Finder with real listings",
      "Mithra AI chat assistant",
    ],
  },
  {
    plan: "pro" as const,
    name: "Pro",
    price: 198,
    tagline: "300 credits every month",
    accent: "#0F6E55",
    isPopular: true,
    features: [
      "300 credits/month — spend them your way",
      "≈ 12 resume adaptations, or mix freely",
      "All 6 templates + PDF export",
      "Interview Prep — AI mock sessions",
      "Application Tracker (Kanban board)",
      "Priority email support",
    ],
  },
  {
    plan: "elite" as const,
    name: "Elite",
    price: 498,
    tagline: "1,000 credits every month",
    accent: "#f59e0b",
    features: [
      "1,000 credits/month — power-user allowance",
      "Everything in Pro",
      "Auto-Apply with live assistant",
      "Unlimited network contacts",
      "Priority support",
    ],
  },
];

const CREDIT_MENU = [
  { label: "Resume Adaptation", cost: 25 },
  { label: "AI Resume Build", cost: 15 },
  { label: "Interview Session", cost: 10 },
  { label: "Cover Letter", cost: 5 },
  { label: "Auto-Apply Session", cost: 8 },
  { label: "Answer Feedback", cost: 3 },
  { label: "PDF Download", cost: 2 },
  { label: "Job Search", cost: 2 },
  { label: "Chat Message", cost: 1 },
  { label: "Resume Score", cost: 0 },
];

const TOPUPS = [
  { id: "topup_99", price: 99, credits: 120 },
  { id: "topup_199", price: 199, credits: 280 },
];

export default function PricingPage() {
  const { user } = useUser();
  const { credits } = useCredits();
  const [buying, setBuying] = useState<string | null>(null);
  const currentPlan = (user?.plan ?? "free") as "free" | "pro" | "elite";

  const handleTopup = async (id: string) => {
    if (!user) { window.location.href = "/login"; return; }
    setBuying(id);
    await buyTopup(id);
    setBuying(null);
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1100px", margin: "0 auto", color: "#111111" }}>

      {/* Page header — resume document style */}
      <div style={{ textAlign: "center", marginBottom: "52px" }}>

        {/* Document-style top label */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(15,110,85,0.06)",
          border: "1px solid rgba(15,110,85,0.18)",
          borderRadius: "100px",
          padding: "5px 14px",
          marginBottom: "20px",
        }}>
          <FileText style={{ width: "13px", height: "13px", color: "#0F6E55" }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#0F6E55", letterSpacing: "1.5px", textTransform: "uppercase" }}>
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
            background: "linear-gradient(135deg,#0F6E55,#f59e0b)",
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

      {/* Credit menu + top-ups */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center", marginTop: "44px", alignItems: "stretch" }}>

        {/* What credits buy */}
        <div style={{ flex: "1 1 320px", maxWidth: "420px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.08)", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Coins style={{ width: "16px", height: "16px", color: "#0F6E55" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111", margin: 0 }}>What credits buy</h3>
            {credits && (
              <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: 700, color: "#0F6E55", background: "rgba(15,110,85,0.07)", padding: "3px 10px", borderRadius: "12px" }}>
                You have {credits.balance}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {CREDIT_MENU.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "baseline", gap: "8px", fontSize: "13px" }}>
                <span style={{ color: "#444" }}>{item.label}</span>
                <span style={{ flex: 1, borderBottom: "1px dotted rgba(0,0,0,0.15)", transform: "translateY(-3px)" }} />
                <span style={{ fontWeight: 700, color: item.cost === 0 ? "#10b981" : "#0F6E55" }}>
                  {item.cost === 0 ? "FREE" : `${item.cost} cr`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top-up packs */}
        <div style={{ flex: "1 1 280px", maxWidth: "360px", background: "linear-gradient(178deg,#0C221B,#0A1D17)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <Zap style={{ width: "16px", height: "16px", color: "#E9C46A" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#F5F1E6", margin: 0 }}>Need more this month?</h3>
          </div>
          <p style={{ fontSize: "12.5px", color: "rgba(245,241,230,0.55)", marginBottom: "18px", lineHeight: 1.6 }}>
            One-time credit packs. Instant delivery, work on any plan.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
            {TOPUPS.map((t) => (
              <button key={t.id} onClick={() => handleTopup(t.id)} disabled={!!buying}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "13px 16px", borderRadius: "12px",
                  background: "rgba(233,196,106,0.1)", border: "1px solid rgba(233,196,106,0.3)",
                  cursor: buying ? "wait" : "pointer", fontFamily: "inherit",
                }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#F5F1E6" }}>{t.credits} credits</span>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {buying === t.id && <Loader2 style={{ width: "13px", height: "13px", color: "#E9C46A", animation: "spin 1s linear infinite" }} />}
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "#E9C46A" }}>₹{t.price}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
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

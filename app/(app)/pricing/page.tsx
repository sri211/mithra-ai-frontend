"use client";
import { PricingCard } from "@/components/pricing/PricingCard";
import { useUser } from "@/lib/auth";

const PLANS = [
  {
    plan: "free" as const,
    name: "Free",
    price: "₹0/month",
    accent: "#64748b",
    features: [
      "5 resume adaptations/month",
      "10 job searches/day",
      "3 resume templates",
      "Basic network (5 contacts)",
      "Mithra AI chat",
    ],
  },
  {
    plan: "pro" as const,
    name: "Pro",
    price: "₹198/month",
    accent: "#7c3aed",
    isPopular: true,
    features: [
      "Unlimited resume adaptations",
      "All templates + PDF export",
      "Full network (10 contacts)",
      "Interview prep module",
      "Job tracker",
      "Priority support",
    ],
  },
  {
    plan: "elite" as const,
    name: "Elite",
    price: "₹498/month",
    accent: "#f59e0b",
    features: [
      "Everything in Pro",
      "Auto-apply access",
      "Priority AI (Claude Opus)",
      "1-on-1 Mithra career coaching",
      "LinkedIn profile review",
      "Dedicated success manager",
    ],
  },
];

export default function PricingPage() {
  const { user } = useUser();
  const currentPlan = (user?.plan ?? "free") as "free" | "pro" | "elite";

  return (
    <div
      style={{
        padding: "40px 32px",
        maxWidth: "1100px",
        margin: "0 auto",
        color: "#f8fafc",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "56px" }}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#7c3aed",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Pricing
        </p>
        <h1
          style={{
            fontSize: "clamp(28px,4vw,48px)",
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: "16px",
          }}
        >
          Invest in the story
          <br />
          <span
            style={{
              background: "linear-gradient(135deg,#a78bfa,#f59e0b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            only you can tell.
          </span>
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#64748b",
            maxWidth: "480px",
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          Every plan includes the full power of Mithra AI. Upgrade to unlock the tools
          that match where you want to go.
        </p>
      </div>

      {/* Plan cards */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {PLANS.map((p) => (
          <PricingCard
            key={p.plan}
            {...p}
            isCurrent={p.plan === currentPlan}
          />
        ))}
      </div>

      {/* Footer note */}
      <p
        style={{
          textAlign: "center",
          marginTop: "40px",
          fontSize: "13px",
          color: "#334155",
        }}
      >
        All plans are month-to-month. Cancel anytime. Prices in INR, inclusive of taxes.
      </p>
    </div>
  );
}

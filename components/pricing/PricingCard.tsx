"use client";
import { Check, Loader2, Zap, Star, Sparkles } from "lucide-react";
import { useUser } from "@/lib/auth";
import { api } from "@/lib/api/client";
import { useState } from "react";

interface PricingCardProps {
  plan: "free" | "pro" | "elite";
  name: string;
  price: number;
  tagline: string;
  features: string[];
  accent: string;
  isPopular?: boolean;
  isCurrent?: boolean;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const PLAN_ICONS = {
  free:  <Zap style={{ width: "14px", height: "14px" }} />,
  pro:   <Star style={{ width: "14px", height: "14px" }} />,
  elite: <Sparkles style={{ width: "14px", height: "14px" }} />,
};

export function PricingCard({
  plan, name, price, tagline, features, accent, isPopular, isCurrent,
}: PricingCardProps) {
  const { user, accessToken } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user || !accessToken) { window.location.href = "/login"; return; }
    if (plan === "free") return;
    setIsLoading(true);
    try {
      const { data } = await api.post(
        "/payments/create-order",
        { plan },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!window.Razorpay) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          document.body.appendChild(script);
        });
      }
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "Mithra AI",
        description: `${name} Plan — Monthly`,
        order_id: data.order_id,
        prefill: { name: data.user_name, email: data.user_email },
        theme: { color: accent },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await api.post(
              "/payments/verify",
              { ...response, plan },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            window.location.reload();
          } catch {
            alert("Payment verification failed. Please contact support.");
          }
        },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      console.error("Payment initiation failed:", err);
      alert("Could not initiate payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const buttonLabel = isCurrent
    ? "Current Plan"
    : plan === "free"
    ? "Always Free"
    : isLoading
    ? "Processing..."
    : `Upgrade to ${name}`;

  return (
    <div style={{
      display: "flex",
      background: "#FFFFFF",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: isPopular
        ? `0 8px 40px ${accent}22, 0 2px 12px rgba(0,0,0,0.07)`
        : "0 2px 16px rgba(0,0,0,0.07)",
      border: `1px solid ${isPopular ? accent + "35" : "rgba(0,0,0,0.08)"}`,
      position: "relative",
      flex: "1 1 280px",
      maxWidth: "340px",
      minWidth: "260px",
      transform: isPopular ? "translateY(-4px)" : "none",
      transition: "box-shadow 0.2s, transform 0.2s",
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = isPopular ? `0 12px 50px ${accent}30, 0 4px 16px rgba(0,0,0,0.1)` : "0 6px 24px rgba(0,0,0,0.12)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = isPopular ? `0 8px 40px ${accent}22, 0 2px 12px rgba(0,0,0,0.07)` : "0 2px 16px rgba(0,0,0,0.07)"; }}
    >
      {/* Left accent stripe — resume column marker */}
      <div style={{
        width: "5px",
        flexShrink: 0,
        background: `linear-gradient(180deg, ${accent} 0%, ${accent}66 100%)`,
      }} />

      <div style={{ padding: "28px 22px", flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Popular badge */}
        {isPopular && (
          <div style={{
            position: "absolute",
            top: "-1px", right: "18px",
            background: `linear-gradient(135deg,${accent},${accent}cc)`,
            color: "white",
            fontSize: "10px",
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: "0 0 9px 9px",
            letterSpacing: "0.6px",
            textTransform: "uppercase",
          }}>
            Most Popular
          </div>
        )}

        {/* Plan header — resume name block style */}
        <div style={{ marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{
              width: "26px", height: "26px",
              borderRadius: "7px",
              background: `${accent}15`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: accent,
            }}>
              {PLAN_ICONS[plan]}
            </div>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#111111", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              {name}
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "#888888", marginLeft: "34px" }}>{tagline}</p>
        </div>

        {/* Price — large and clear */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: accent, lineHeight: 1 }}>₹</span>
            <span style={{ fontSize: "40px", fontWeight: 900, color: accent, lineHeight: 1 }}>
              {price.toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: "13px", color: "#888888", marginLeft: "2px" }}>/month</span>
          </div>
          {plan === "free" && (
            <span style={{
              display: "inline-block",
              marginTop: "6px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#10b981",
              background: "rgba(16,185,129,0.08)",
              padding: "2px 8px",
              borderRadius: "4px",
            }}>
              No credit card needed
            </span>
          )}
        </div>

        {/* Section divider — resume-style rule */}
        <div style={{ height: "1px", background: "rgba(0,0,0,0.07)", marginBottom: "18px", position: "relative" }}>
          <div style={{
            position: "absolute", left: 0, top: "-1px",
            width: "32px", height: "2px",
            background: accent, borderRadius: "1px",
          }} />
        </div>

        {/* Features — resume bullet point style */}
        <div style={{ display: "flex", flexDirection: "column", gap: "9px", flex: 1, marginBottom: "22px" }}>
          {features.map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "9px" }}>
              <div style={{
                width: "17px", height: "17px",
                borderRadius: "50%",
                background: `${accent}13`,
                flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: "1px",
              }}>
                <Check style={{ width: "10px", height: "10px", color: accent }} />
              </div>
              <span style={{ fontSize: "13px", color: "#444444", lineHeight: 1.5 }}>{f}</span>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={handleUpgrade}
          disabled={plan === "free" || isCurrent || isLoading}
          style={{
            width: "100%",
            padding: "12px",
            background: isCurrent
              ? "rgba(0,0,0,0.04)"
              : plan === "free"
              ? "rgba(16,185,129,0.08)"
              : `linear-gradient(135deg,${accent},${accent}cc)`,
            border: isCurrent
              ? `1px solid rgba(0,0,0,0.1)`
              : plan === "free"
              ? "1px solid rgba(16,185,129,0.2)"
              : "none",
            borderRadius: "10px",
            color: isCurrent
              ? "#888888"
              : plan === "free"
              ? "#10b981"
              : "white",
            fontSize: "14px",
            fontWeight: 700,
            cursor: plan === "free" || isCurrent || isLoading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
            boxShadow: plan !== "free" && !isCurrent ? `0 4px 16px ${accent}30` : "none",
            opacity: isLoading ? 0.7 : 1,
            transition: "opacity 0.2s, box-shadow 0.2s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => { if (!isCurrent && plan !== "free" && !isLoading) (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 24px ${accent}45`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = plan !== "free" && !isCurrent ? `0 4px 16px ${accent}30` : "none"; }}
        >
          {isLoading && <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />}
          {buttonLabel}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

"use client";
import { Check, Loader2 } from "lucide-react";
import { useUser } from "@/lib/auth";
import { api } from "@/lib/api/client";
import { useState } from "react";

interface PricingCardProps {
  plan: "free" | "pro" | "elite";
  name: string;
  price: string;
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

export function PricingCard({
  plan, name, price, features, accent, isPopular, isCurrent,
}: PricingCardProps) {
  const { user, accessToken } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user || !accessToken) {
      window.location.href = "/login";
      return;
    }
    if (plan === "free") return;
    setIsLoading(true);
    try {
      const { data } = await api.post(
        "/payments/create-order",
        { plan },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // Load Razorpay script if not already loaded
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
        prefill: {
          name: data.user_name,
          email: data.user_email,
        },
        theme: { color: accent },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await api.post(
              "/payments/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan,
              },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            window.location.reload();
          } catch {
            alert("Payment verification failed. Please contact support.");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment initiation failed:", err);
      alert("Could not initiate payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        borderRadius: "20px",
        padding: "32px",
        background: isPopular
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(15,8,30,0.95) 100%)`
          : "rgba(20,13,40,0.8)",
        border: `1px solid ${isPopular ? accent + "50" : "rgba(124,58,237,0.15)"}`,
        position: "relative",
        boxShadow: isPopular ? `0 20px 60px ${accent}18` : "none",
        flex: 1,
      }}
    >
      {isPopular && (
        <div
          style={{
            position: "absolute",
            top: "-1px",
            left: "50%",
            transform: "translateX(-50%)",
            background: `linear-gradient(135deg,${accent},${accent}cc)`,
            color: "white",
            fontSize: "11px",
            fontWeight: 700,
            padding: "4px 16px",
            borderRadius: "0 0 10px 10px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          Most Popular
        </div>
      )}

      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#f1f5f9", marginBottom: "4px" }}>{name}</h3>
        <div
          style={{
            fontSize: "36px",
            fontWeight: 900,
            background: `linear-gradient(135deg,${accent},${accent}99)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "4px",
          }}
        >
          {price}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
        {features.map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <Check
              style={{
                width: "15px",
                height: "15px",
                color: accent,
                flexShrink: 0,
                marginTop: "2px",
              }}
            />
            <span style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleUpgrade}
        disabled={plan === "free" || isCurrent || isLoading}
        style={{
          width: "100%",
          padding: "13px",
          background:
            isCurrent
              ? "rgba(124,58,237,0.15)"
              : plan === "free"
              ? "rgba(100,116,139,0.1)"
              : `linear-gradient(135deg,${accent},${accent}cc)`,
          border: isCurrent
            ? `1px solid ${accent}30`
            : plan === "free"
            ? "1px solid rgba(100,116,139,0.2)"
            : "none",
          borderRadius: "12px",
          color: isCurrent ? accent : plan === "free" ? "#64748b" : "white",
          fontSize: "14px",
          fontWeight: 700,
          cursor: plan === "free" || isCurrent || isLoading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow:
            plan !== "free" && !isCurrent ? `0 4px 20px ${accent}30` : "none",
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading && <Loader2 style={{ width: "15px", height: "15px", animation: "spin 1s linear infinite" }} />}
        {isCurrent
          ? "Current Plan"
          : plan === "free"
          ? "Always Free"
          : isLoading
          ? "Processing..."
          : `Upgrade to ${name}`}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { Crown, Lock } from "lucide-react";
import { Plan } from "@/lib/planLimits";

const PLAN_LABELS: Record<Plan, { label: string; color: string }> = {
  free: { label: "Free", color: "#94a3b8" },
  pro:  { label: "Pro",  color: "#a78bfa" },
  elite:{ label: "Elite",color: "#f59e0b" },
};

interface Props {
  requiredPlan: Plan;
  featureName: string;
  description?: string;
  compact?: boolean;   // small inline badge vs full card
}

export default function UpgradeGate({ requiredPlan, featureName, description, compact }: Props) {
  const router = useRouter();
  const { label, color } = PLAN_LABELS[requiredPlan];

  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "10px", background: `${color}0d`, border: `1px solid ${color}25` }}>
        <Lock style={{ width: "14px", height: "14px", color, flexShrink: 0 }} />
        <span style={{ fontSize: "12px", color: "#94a3b8", flex: 1 }}>
          <strong style={{ color }}>{featureName}</strong> requires {label} plan
        </span>
        <button
          onClick={() => router.push("/pricing")}
          style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 12px", background: `${color}18`, border: `1px solid ${color}35`, borderRadius: "8px", color, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
          <Crown style={{ width: "12px", height: "12px" }} />Upgrade
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "40px 24px", textAlign: "center",
      background: `${color}08`, border: `1px solid ${color}20`, borderRadius: "16px",
    }}>
      <div style={{ width: "56px", height: "56px", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", background: `${color}15`, marginBottom: "16px" }}>
        <Lock style={{ width: "24px", height: "24px", color }} />
      </div>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: `${color}15`, color, border: `1px solid ${color}30`, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        <Crown style={{ width: "11px", height: "11px" }} />{label} feature
      </span>
      <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#f1f5f9", marginBottom: "8px" }}>{featureName}</h3>
      {description && <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6, maxWidth: "280px", marginBottom: "20px" }}>{description}</p>}
      <button
        onClick={() => router.push("/pricing")}
        style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "11px 24px",
          background: `linear-gradient(135deg,${color},${color}cc)`,
          border: "none", borderRadius: "12px", color: requiredPlan === "elite" ? "#0a0614" : "white",
          fontSize: "14px", fontWeight: 700, cursor: "pointer",
          boxShadow: `0 4px 16px ${color}35`,
        }}>
        <Crown style={{ width: "16px", height: "16px" }} />
        Upgrade to {label}
      </button>
    </div>
  );
}

"use client";
// Topbar credit balance pill — always visible so users know where they stand.
import Link from "next/link";
import { Coins } from "lucide-react";
import { useCredits } from "@/lib/credits";

export default function CreditsBadge({ compact = false }: { compact?: boolean }) {
  const { credits } = useCredits();
  if (!credits) return null;

  const low = credits.balance <= Math.max(5, credits.allowance * 0.1);
  const color = low ? "#D97706" : "#0F6E55";
  const bg = low ? "rgba(217,119,6,0.08)" : "rgba(15,110,85,0.07)";
  const border = low ? "rgba(217,119,6,0.25)" : "rgba(15,110,85,0.18)";

  return (
    <Link href="/pricing" title={`${credits.balance} credits · renews monthly on your ${credits.plan} plan`}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: compact ? "5px 10px" : "6px 12px",
        borderRadius: "20px", background: bg, border: `1px solid ${border}`,
        textDecoration: "none", flexShrink: 0,
      }}>
      <Coins style={{ width: compact ? "13px" : "15px", height: compact ? "13px" : "15px", color }} />
      <span style={{ fontSize: compact ? "12px" : "13px", fontWeight: 700, color, lineHeight: 1 }}>
        {credits.balance.toLocaleString("en-IN")}
      </span>
    </Link>
  );
}

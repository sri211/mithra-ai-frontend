"use client";
// Inline coin-cost chip shown on every button that spends credits.
import { Coins } from "lucide-react";

export default function CoinCost({ n, onDark = false }: { n: number; onDark?: boolean }) {
  if (n <= 0) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "3px",
      fontSize: "10.5px", fontWeight: 800, lineHeight: 1,
      padding: "3px 7px", borderRadius: "10px", marginLeft: "6px",
      background: onDark ? "rgba(255,255,255,0.18)" : "rgba(233,196,106,0.2)",
      color: onDark ? "#FFE9AE" : "#8A5A00",
      border: onDark ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(201,146,13,0.35)",
    }}>
      <Coins style={{ width: "10px", height: "10px" }} />
      {n}
    </span>
  );
}

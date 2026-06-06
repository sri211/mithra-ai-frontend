"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X, Sparkles, TrendingUp } from "lucide-react";

// ── Usage progress bar nudge (e.g. "3 of 5 adaptations used") ────────────────
interface ProgressNudgeProps {
  used: number;
  total: number;
  noun: string;           // "adaptations", "searches"
  period: string;         // "this month", "today"
  upgradeLabel?: string;
  accentColor?: string;
  onDismiss?: () => void;
}

export function UsageProgressNudge({
  used, total, noun, period, upgradeLabel = "Upgrade to Pro", accentColor = "#7c3aed", onDismiss,
}: ProgressNudgeProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const pct = Math.min((used / total) * 100, 100);
  const isNearLimit = pct >= 60;
  const isAtLimit   = used >= total;
  const color = isAtLimit ? "#ef4444" : isNearLimit ? "#f59e0b" : accentColor;
  const remaining = Math.max(total - used, 0);

  const message = isAtLimit
    ? `You've used all ${total} free ${noun} ${period}.`
    : remaining === 1
    ? `1 free ${noun.slice(0, -1)} left ${period}.`
    : `${remaining} of ${total} free ${noun} remaining ${period}.`;

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        style={{
          borderRadius: "14px",
          padding: "12px 16px",
          background: `${color}0a`,
          border: `1px solid ${color}25`,
          display: "flex", alignItems: "center", gap: "12px",
        }}>

        {/* Icon */}
        <div style={{ width: "34px", height: "34px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: `${color}15`, flexShrink: 0 }}>
          <TrendingUp style={{ width: "16px", height: "16px", color }} />
        </div>

        {/* Text + bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#cbd5e1" }}>{message}</span>
            <span style={{ fontSize: "11px", color, fontWeight: 700, flexShrink: 0, marginLeft: "8px" }}>{used}/{total}</span>
          </div>
          <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ height: "100%", borderRadius: "2px", background: isAtLimit ? "#ef4444" : isNearLimit ? "linear-gradient(90deg,#f59e0b,#ef4444)" : color }}
            />
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push("/pricing")}
          style={{
            display: "flex", alignItems: "center", gap: "5px",
            padding: "7px 14px", borderRadius: "10px", border: "none", cursor: "pointer",
            background: isAtLimit ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
            color: "white", fontSize: "12px", fontWeight: 700, flexShrink: 0,
            boxShadow: `0 4px 12px ${isAtLimit ? "rgba(239,68,68,0.3)" : "rgba(124,58,237,0.3)"}`,
          }}>
          <Crown style={{ width: "12px", height: "12px" }} />
          {isAtLimit ? "Upgrade now" : upgradeLabel}
        </button>

        {/* Dismiss */}
        {!isAtLimit && onDismiss && (
          <button onClick={() => { setDismissed(true); onDismiss(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: "2px", flexShrink: 0 }}>
            <X style={{ width: "14px", height: "14px" }} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Post-action celebration nudge ─────────────────────────────────────────────
interface CelebrationNudgeProps {
  emoji: string;
  headline: string;
  subtext: string;
  ctaLabel: string;
  accentColor?: string;
  onDismiss?: () => void;
}

export function CelebrationNudge({
  emoji, headline, subtext, ctaLabel, accentColor = "#7c3aed", onDismiss,
}: CelebrationNudgeProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 380, damping: 25 }}
        style={{
          borderRadius: "16px", overflow: "hidden",
          border: `1px solid ${accentColor}25`,
        }}>

        {/* Gradient top bar */}
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${accentColor}, ${accentColor}66)` }} />

        <div style={{
          padding: "16px 18px", display: "flex", alignItems: "center", gap: "14px",
          background: `${accentColor}08`,
        }}>
          <span style={{ fontSize: "28px", flexShrink: 0 }}>{emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", marginBottom: "3px" }}>{headline}</div>
            <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>{subtext}</div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button
              onClick={() => router.push("/pricing")}
              style={{
                display: "flex", alignItems: "center", gap: "5px", padding: "8px 16px",
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
                border: "none", borderRadius: "10px", color: "white",
                fontSize: "12px", fontWeight: 700, cursor: "pointer",
                boxShadow: `0 4px 12px ${accentColor}30`,
              }}>
              <Sparkles style={{ width: "12px", height: "12px" }} />{ctaLabel}
            </button>
            {onDismiss && (
              <button onClick={() => { setDismissed(true); onDismiss(); }}
                style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                <X style={{ width: "14px", height: "14px", color: "#64748b" }} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Inline teaser (e.g. blurred preview of locked feature) ────────────────────
interface TeaserNudgeProps {
  plan: "pro" | "elite";
  features: string[];
  compact?: boolean;
}

const PLAN_META = {
  pro:   { label: "Pro",   color: "#7c3aed", price: "₹198/month" },
  elite: { label: "Elite", color: "#f59e0b", price: "₹498/month" },
};

export function TeaserNudge({ plan, features, compact }: TeaserNudgeProps) {
  const router = useRouter();
  const { label, color, price } = PLAN_META[plan];

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: `${color}08`, border: `1px solid ${color}20` }}>
        <Crown style={{ width: "14px", height: "14px", color, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: "12px", color: "#94a3b8" }}>
          Unlock with <strong style={{ color }}>{label}</strong>:&nbsp;
          {features.slice(0, 2).join(" · ")}
        </span>
        <button onClick={() => router.push("/pricing")}
          style={{ padding: "5px 12px", borderRadius: "8px", background: `${color}18`, border: `1px solid ${color}30`, color, fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
          {price}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ borderRadius: "16px", padding: "20px", background: `${color}08`, border: `1px solid ${color}20`, textAlign: "center" }}>
      <Crown style={{ width: "24px", height: "24px", color, margin: "0 auto 10px" }} />
      <div style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", marginBottom: "8px" }}>Unlock with {label} — {price}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "16px" }}>
        {features.map((f) => (
          <div key={f} style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
            <span style={{ color, fontSize: "10px" }}>✓</span>{f}
          </div>
        ))}
      </div>
      <button onClick={() => router.push("/pricing")}
        style={{ padding: "10px 24px", borderRadius: "12px", background: `linear-gradient(135deg,${color},${color}bb)`, border: "none", color: plan === "elite" ? "#0a0614" : "white", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
        Upgrade to {label}
      </button>
    </motion.div>
  );
}

// ── Header usage pill (for AppShell) ─────────────────────────────────────────
interface UsagePillProps {
  adaptationsUsed: number;
  searchesToday: number;
}

export function UsagePill({ adaptationsUsed, searchesToday }: UsagePillProps) {
  const router = useRouter();
  const adaptPct = (adaptationsUsed / 5) * 100;
  const searchPct = (searchesToday / 10) * 100;
  const highestPct = Math.max(adaptPct, searchPct);
  if (highestPct < 40) return null; // don't show until 40% used

  const color = highestPct >= 80 ? "#ef4444" : highestPct >= 60 ? "#f59e0b" : "#7c3aed";
  const label = highestPct >= 100 ? "Limit reached" : highestPct >= 80 ? `${Math.round(highestPct)}% used` : "Usage";

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => router.push("/pricing")}
      style={{
        display: "flex", alignItems: "center", gap: "5px",
        padding: "4px 10px", borderRadius: "20px", border: "none", cursor: "pointer",
        background: `${color}15`, fontSize: "10px", fontWeight: 700,
        color, letterSpacing: "0.2px",
      }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }} />
      {label}
    </motion.button>
  );
}

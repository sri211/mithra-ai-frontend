"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Copy, Check, Crown, Gift, Share2, ChevronRight } from "lucide-react";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/auth";

export default function ReferralPage() {
  const { user } = useUser();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get("/referral/my-link")
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, []);

  const copyLink = () => {
    if (!data?.referral_link) return;
    navigator.clipboard.writeText(data.referral_link as string);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (!data?.referral_link) return;
    if (navigator.share) {
      await navigator.share({
        title: "Join Mithra AI",
        text: "I've been using Mithra AI to accelerate my job search. Join me!",
        url: data.referral_link as string,
      });
    } else {
      copyLink();
    }
  };

  const count = (data?.referrals_completed as number) ?? 0;
  const needed = (data?.referrals_needed as number) ?? 3;
  const pct = Math.min((count / needed) * 100, 100);
  const unlocked = data?.reward_unlocked as boolean;

  const STEPS = [
    { n: 1, icon: Share2, label: "Share your link", desc: "Send your unique link to friends who are job searching." },
    { n: 2, icon: Users, label: "They sign up", desc: "Your friend creates a free Mithra AI account using your link." },
    { n: 3, icon: Gift, label: "You both win", desc: "When 3 friends join, you get 1 month of Pro — free. No credit card." },
  ];

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#0a0614" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", padding: "32px 0 8px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎁</div>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#f1f5f9", marginBottom: "8px" }}>Refer & Earn</h1>
          <p style={{ fontSize: "15px", color: "#64748b", lineHeight: 1.6, maxWidth: "400px", margin: "0 auto" }}>
            Refer 3 friends to Mithra AI and get <strong style={{ color: "#5FAE93" }}>1 month Pro free</strong> — worth ₹198.
          </p>
        </div>

        {/* Progress card */}
        <div style={{ background: "rgba(18,10,36,0.9)", border: `1px solid ${unlocked ? "rgba(16,185,129,0.3)" : "rgba(15,110,85,0.2)"}`, borderRadius: "20px", padding: "24px" }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#475569" }}>Loading your referral stats…</div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: unlocked ? "#10b981" : "#5FAE93" }}>{count} / {needed}</div>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>friends referred</div>
                </div>
                {unlocked ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", color: "#10b981", fontWeight: 700, fontSize: "13px" }}>
                    <Crown style={{ width: "16px", height: "16px" }} />Reward Unlocked!
                  </div>
                ) : (
                  <div style={{ fontSize: "13px", color: "#64748b", textAlign: "right" }}>
                    {needed - count} more to unlock
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div style={{ height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: "8px" }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ height: "100%", borderRadius: "4px", background: unlocked ? "#10b981" : "linear-gradient(90deg,#0F6E55,#f59e0b)" }}
                />
              </div>
              <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                {Array.from({ length: needed }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: "4px", borderRadius: "2px", background: i < count ? "#10b981" : "rgba(255,255,255,0.06)" }} />
                ))}
              </div>

              <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "16px", lineHeight: 1.5 }}>
                {String(data?.message ?? "")}
              </p>
            </>
          )}

          {/* Referral link */}
          {!!data?.referral_link && (
            <>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px", fontWeight: 600 }}>Your referral link</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1, background: "rgba(15,8,30,0.8)", border: "1px solid rgba(15,110,85,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#5FAE93", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {String(data.referral_link)}
                </div>
                <button onClick={copyLink} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "10px 16px", background: copied ? "rgba(16,185,129,0.15)" : "rgba(15,110,85,0.15)", border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(15,110,85,0.3)"}`, borderRadius: "10px", color: copied ? "#10b981" : "#5FAE93", fontSize: "13px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                  {copied ? <><Check style={{ width: "14px", height: "14px" }} />Copied!</> : <><Copy style={{ width: "14px", height: "14px" }} />Copy</>}
                </button>
                <button onClick={shareLink} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "10px 16px", background: "linear-gradient(135deg,#0F6E55,#0A523F)", border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                  <Share2 style={{ width: "14px", height: "14px" }} />Share
                </button>
              </div>
              <div style={{ marginTop: "8px", fontSize: "11px", color: "#475569" }}>
                Code: <span style={{ fontFamily: "monospace", color: "#5FAE93", fontWeight: 700 }}>{String(data.referral_code)}</span>
              </div>
            </>
          )}
        </div>

        {/* How it works */}
        <div style={{ background: "rgba(18,10,36,0.9)", border: "1px solid rgba(15,110,85,0.15)", borderRadius: "20px", padding: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#f1f5f9", marginBottom: "16px" }}>How it works</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg,#0F6E55,#0A523F)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 900, fontSize: "14px", color: "white" }}>
                  {s.n}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", marginBottom: "3px" }}>{s.label}</div>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terms */}
        <p style={{ fontSize: "11px", color: "#334155", textAlign: "center", lineHeight: 1.6 }}>
          Reward activates automatically when 3 unique friends sign up using your link. One reward per referrer. Pro subscription valid for 30 days.
        </p>
      </div>
    </div>
  );
}

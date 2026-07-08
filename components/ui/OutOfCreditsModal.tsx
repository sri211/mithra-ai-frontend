"use client";
// Global modal shown when any API call returns 402 (insufficient credits).
// Offers instant top-up packs and a plan upgrade path.
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, X, Zap, Loader2 } from "lucide-react";
import { OUT_OF_CREDITS_EVENT, buyTopup, notifyCreditsChanged } from "@/lib/credits";

interface OutOfCreditsDetail {
  action?: string;
  cost?: number;
  balance?: number;
  topups?: { id: string; price_inr: number; credits: number }[];
}

const ACTION_LABELS: Record<string, string> = {
  resume_adapt: "Resume Adaptation",
  resume_build: "AI Resume Build",
  interview_session: "Interview Session",
  interview_feedback: "Answer Feedback",
  cover_letter: "Cover Letter",
  auto_apply: "Auto Apply",
  pdf_download: "PDF Download",
  job_search: "Job Search",
  chat_message: "Chat Message",
};

export default function OutOfCreditsModal() {
  const router = useRouter();
  const [detail, setDetail] = useState<OutOfCreditsDetail | null>(null);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => setDetail((e as CustomEvent).detail || {});
    window.addEventListener(OUT_OF_CREDITS_EVENT, handler);
    return () => window.removeEventListener(OUT_OF_CREDITS_EVENT, handler);
  }, []);

  const close = () => setDetail(null);

  const handleBuy = async (packId: string) => {
    setBuying(packId);
    const ok = await buyTopup(packId);
    setBuying(null);
    if (ok) {
      notifyCreditsChanged();
      close();
    }
  };

  const packs = detail?.topups?.length
    ? detail.topups
    : [
        { id: "topup_99", price_inr: 99, credits: 120 },
        { id: "topup_199", price_inr: 199, credits: 280 },
      ];

  return (
    <AnimatePresence>
      {detail && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(12,34,27,0.5)", backdropFilter: "blur(4px)" }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            style={{
              position: "fixed", zIndex: 91, top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              width: "min(420px, calc(100vw - 32px))", background: "#FFFFFF",
              borderRadius: "18px", border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 24px 80px rgba(12,34,27,0.25)", overflow: "hidden",
            }}>
            {/* Header */}
            <div style={{ padding: "22px 24px 16px", background: "linear-gradient(178deg,#0C221B,#0A1D17)", position: "relative" }}>
              <button onClick={close} style={{ position: "absolute", top: "14px", right: "14px", width: "28px", height: "28px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X style={{ width: "14px", height: "14px", color: "rgba(245,241,230,0.7)" }} />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(233,196,106,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Coins style={{ width: "17px", height: "17px", color: "#E9C46A" }} />
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#F5F1E6", margin: 0 }}>Out of credits</h3>
              </div>
              <p style={{ fontSize: "13px", color: "rgba(245,241,230,0.6)", margin: 0, lineHeight: 1.5 }}>
                {detail.action
                  ? `${ACTION_LABELS[detail.action] || detail.action} needs ${detail.cost} credits — you have ${detail.balance ?? 0}.`
                  : "You've used this month's credits."}
                {" "}Top up instantly or upgrade your plan.
              </p>
            </div>

            {/* Packs */}
            <div style={{ padding: "18px 24px 22px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {packs.map((p) => (
                <button key={p.id} onClick={() => handleBuy(p.id)} disabled={!!buying}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "13px 16px", borderRadius: "12px",
                    background: "rgba(15,110,85,0.05)", border: "1px solid rgba(15,110,85,0.2)",
                    cursor: buying ? "wait" : "pointer", fontFamily: "inherit",
                  }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Zap style={{ width: "15px", height: "15px", color: "#0F6E55" }} />
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#111" }}>{p.credits} credits</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {buying === p.id && <Loader2 style={{ width: "13px", height: "13px", color: "#0F6E55", animation: "spin 1s linear infinite" }} />}
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#0F6E55" }}>₹{p.price_inr}</span>
                  </span>
                </button>
              ))}
              <button onClick={() => { close(); router.push("/pricing"); }}
                style={{ marginTop: "4px", padding: "11px", borderRadius: "12px", background: "none", border: "1px solid rgba(0,0,0,0.12)", color: "#555", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                See plans — up to 1,000 credits/month
              </button>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

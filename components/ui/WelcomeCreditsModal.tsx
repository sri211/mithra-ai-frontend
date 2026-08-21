"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/auth";
import { useAuthStore } from "@/lib/stores/authStore";
import { api } from "@/lib/api/client";

// Shown once to a brand-new account (welcome_seen === 0) right after they land in
// the app, announcing the 60 free credits. Marked seen so it never reappears.
export default function WelcomeCreditsModal() {
  const { user } = useUser();
  const markWelcomeSeen = useAuthStore((s) => s.markWelcomeSeen);
  const [dismissed, setDismissed] = useState(false);

  // Only brand-new accounts have an EXPLICIT welcome_seen === 0. Existing users
  // (undefined) never see this.
  const show = user?.welcome_seen === 0 && !dismissed;

  const close = () => {
    setDismissed(true);
    markWelcomeSeen();
    api.post("/user/welcome-seen", {}).catch(() => { /* non-critical */ });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={close}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(6,4,16,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "420px", borderRadius: "24px", overflow: "hidden", background: "#FFFFFF", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}
          >
            {/* Header band */}
            <div style={{ background: "linear-gradient(135deg,#0F6E55,#0A523F)", padding: "32px 28px 26px", textAlign: "center", position: "relative" }}>
              <div style={{ fontSize: "40px", marginBottom: "6px" }}>🎉</div>
              <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>Welcome to Mithra</div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "8px", marginTop: "10px" }}>
                <span style={{ fontSize: "64px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>60</span>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "#E9C46A" }}>free credits</span>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "24px 28px 28px", textAlign: "center" }}>
              <p style={{ fontSize: "14px", color: "#333", lineHeight: 1.65, marginBottom: "18px" }}>
                {user?.name ? `${user.name.split(" ")[0]}, your` : "Your"} account is loaded with <strong>60 free credits</strong> — enough to adapt your resume, run a mock interview, research companies, and find jobs. No card needed.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "left", background: "rgba(15,110,85,0.05)", border: "1px solid rgba(15,110,85,0.15)", borderRadius: "14px", padding: "14px 16px", marginBottom: "20px" }}>
                {[
                  ["🎯", "Adapt your resume to any job — 25 cr"],
                  ["🧠", "Full mock interview + report — 15 cr"],
                  ["🔍", "Find real jobs matched to you — 2 cr"],
                  ["🏢", "Research any company — 2 cr"],
                ].map(([e, t]) => (
                  <div key={t} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "12.5px", color: "#444" }}>
                    <span style={{ fontSize: "15px" }}>{e}</span>{t}
                  </div>
                ))}
              </div>
              <button onClick={close} style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#0F6E55,#0A523F)", color: "#fff", fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 16px rgba(15,110,85,0.3)" }}>
                Let&apos;s go →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

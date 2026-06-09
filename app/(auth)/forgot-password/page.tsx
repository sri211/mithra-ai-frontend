"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const input = {
    width: "100%",
    background: "rgba(15,8,30,0.8)",
    border: "1px solid rgba(124,58,237,0.25)",
    borderRadius: "10px",
    padding: "11px 12px 11px 40px",
    color: "#f1f5f9",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      // Always show success to avoid email enumeration
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9", marginBottom: "8px" }}>
          Reset your password
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6 }}>
          Enter your email and we&apos;ll send a reset link if an account exists.
        </p>
      </div>

      {sent ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <CheckCircle2 style={{ width: "48px", height: "48px", color: "#10b981", margin: "0 auto 16px" }} />
          <p style={{ fontSize: "15px", fontWeight: 600, color: "#f1f5f9", marginBottom: "8px" }}>Check your inbox</p>
          <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6, marginBottom: "24px" }}>
            If <strong style={{ color: "#a78bfa" }}>{email}</strong> is registered, you&apos;ll receive a reset link within a few minutes.
          </p>
          <Link
            href="/login"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#a78bfa", textDecoration: "none", fontWeight: 600 }}
          >
            <ArrowLeft style={{ width: "14px", height: "14px" }} />
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ position: "relative" }}>
            <Mail style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#64748b" }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={input}
              onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.25)")}
            />
          </div>

          {error && (
            <div style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "13px", color: "#f87171" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%", padding: "12px",
              background: isLoading ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
              border: "none", borderRadius: "10px", color: "white",
              fontSize: "14px", fontWeight: 700,
              cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: isLoading ? "none" : "0 4px 16px rgba(124,58,237,0.3)",
            }}
          >
            {isLoading && <Loader2 style={{ width: "15px", height: "15px", animation: "spin 1s linear infinite" }} />}
            {isLoading ? "Sending..." : "Send reset link"}
          </button>

          <Link
            href="/login"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", color: "#64748b", textDecoration: "none", marginTop: "4px" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            <ArrowLeft style={{ width: "14px", height: "14px" }} />
            Back to sign in
          </Link>
        </form>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

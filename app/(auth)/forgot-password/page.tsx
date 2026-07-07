"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Something went wrong. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Connection failed. Please check your network and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const input: React.CSSProperties = {
    width: "100%",
    background: "rgba(15,8,30,0.8)",
    border: "1px solid rgba(15,110,85,0.25)",
    borderRadius: "10px",
    padding: "11px 12px 11px 40px",
    color: "#f1f5f9",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  if (sent) {
    return (
      <>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <CheckCircle2 style={{ width: "26px", height: "26px", color: "#10b981" }} />
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#f1f5f9", marginBottom: "8px" }}>
            Check your inbox
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.7 }}>
            If <strong style={{ color: "#5FAE93" }}>{email}</strong> is registered, you&apos;ll receive a reset link shortly. Check your spam folder too.
          </p>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: "10px", background: "rgba(15,110,85,0.06)", border: "1px solid rgba(15,110,85,0.18)", fontSize: "13px", color: "#94a3b8", lineHeight: 1.6, marginBottom: "20px" }}>
          The link expires in <strong style={{ color: "#f1f5f9" }}>1 hour</strong>. If you don&apos;t receive it, you can request another below.
        </div>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          style={{ width: "100%", padding: "11px", background: "rgba(15,110,85,0.12)", border: "1px solid rgba(15,110,85,0.25)", borderRadius: "10px", color: "#5FAE93", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: "12px" }}
        >
          Send another link
        </button>
        <Link
          href="/login"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", color: "#64748b", textDecoration: "none", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#5FAE93")}
          onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
        >
          <ArrowLeft style={{ width: "14px", height: "14px" }} />
          Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9", marginBottom: "8px" }}>
          Reset your password
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6 }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ position: "relative" }}>
          <Mail style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#64748b" }} />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
            style={input}
            onFocus={e => (e.target.style.borderColor = "rgba(15,110,85,0.5)")}
            onBlur={e => (e.target.style.borderColor = "rgba(15,110,85,0.25)")}
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
            background: isLoading ? "rgba(15,110,85,0.4)" : "linear-gradient(135deg,#0F6E55,#0A523F)",
            border: "none", borderRadius: "10px", color: "white",
            fontSize: "14px", fontWeight: 700,
            cursor: isLoading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            boxShadow: isLoading ? "none" : "0 4px 16px rgba(15,110,85,0.3)",
          }}
        >
          {isLoading && <Loader2 style={{ width: "15px", height: "15px", animation: "spin 1s linear infinite" }} />}
          {isLoading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <Link
        href="/login"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", color: "#64748b", textDecoration: "none", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", marginTop: "14px" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#5FAE93")}
        onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
      >
        <ArrowLeft style={{ width: "14px", height: "14px" }} />
        Back to sign in
      </Link>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

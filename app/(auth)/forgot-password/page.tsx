"use client";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9", marginBottom: "8px" }}>
          Reset your password
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6 }}>
          We&apos;ll help you get back in.
        </p>
      </div>

      <div style={{
        padding: "20px",
        borderRadius: "14px",
        background: "rgba(124,58,237,0.08)",
        border: "1px solid rgba(124,58,237,0.2)",
        marginBottom: "20px",
      }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
            background: "rgba(124,58,237,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Mail style={{ width: "17px", height: "17px", color: "#a78bfa" }} />
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", marginBottom: "6px" }}>
              Email us to reset
            </p>
            <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6, marginBottom: "10px" }}>
              Automated password reset is coming soon. For now, send an email to:
            </p>
            <a
              href="mailto:support@mithraai.in?subject=Password Reset Request"
              style={{
                display: "inline-block",
                fontSize: "14px", fontWeight: 700,
                color: "#a78bfa",
                textDecoration: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                background: "rgba(124,58,237,0.15)",
                border: "1px solid rgba(124,58,237,0.3)",
              }}
            >
              support@mithraai.in
            </a>
            <p style={{ fontSize: "12px", color: "#475569", marginTop: "10px" }}>
              Include your registered email address. We typically respond within 24 hours.
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/login"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          fontSize: "13px", color: "#64748b", textDecoration: "none",
          padding: "10px",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.06)",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
      >
        <ArrowLeft style={{ width: "14px", height: "14px" }} />
        Back to sign in
      </Link>
    </>
  );
}

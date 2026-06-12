"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("Invalid reset link. Please request a new one.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || "Something went wrong. Please request a new reset link.");
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const input: React.CSSProperties = {
    width: "100%",
    background: "rgba(15,8,30,0.8)",
    border: "1px solid rgba(124,58,237,0.25)",
    borderRadius: "10px",
    padding: "11px 44px 11px 40px",
    color: "#f1f5f9",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  if (done) {
    return (
      <>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <CheckCircle2 style={{ width: "26px", height: "26px", color: "#10b981" }} />
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#f1f5f9", marginBottom: "8px" }}>Password updated!</h1>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.7 }}>
            Your password has been reset. Redirecting you to sign in…
          </p>
        </div>
        <Link href="/login" style={{ display: "block", textAlign: "center", padding: "12px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
          Sign in now
        </Link>
      </>
    );
  }

  if (!token) {
    return (
      <>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <AlertCircle style={{ width: "26px", height: "26px", color: "#ef4444" }} />
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#f1f5f9", marginBottom: "8px" }}>Invalid link</h1>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.7 }}>
            This reset link is missing or invalid. Please request a new one.
          </p>
        </div>
        <Link href="/forgot-password" style={{ display: "block", textAlign: "center", padding: "12px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
          Request new link
        </Link>
      </>
    );
  }

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9", marginBottom: "8px" }}>
          Set new password
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6 }}>
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ position: "relative" }}>
          <Lock style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#64748b", zIndex: 1 }} />
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="New password (8+ characters)"
            required
            autoFocus
            style={input}
            onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
            onBlur={e => (e.target.style.borderColor = "rgba(124,58,237,0.25)")}
          />
          <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}>
            {showPw ? <EyeOff style={{ width: "15px", height: "15px" }} /> : <Eye style={{ width: "15px", height: "15px" }} />}
          </button>
        </div>

        <div style={{ position: "relative" }}>
          <Lock style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#64748b" }} />
          <input
            type={showPw ? "text" : "password"}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            required
            style={{ ...input, borderColor: confirm && confirm !== password ? "rgba(239,68,68,0.5)" : "rgba(124,58,237,0.25)" }}
            onFocus={e => (e.target.style.borderColor = confirm !== password ? "rgba(239,68,68,0.5)" : "rgba(124,58,237,0.5)")}
            onBlur={e => (e.target.style.borderColor = confirm && confirm !== password ? "rgba(239,68,68,0.5)" : "rgba(124,58,237,0.25)")}
          />
        </div>

        {/* Strength hint */}
        {password.length > 0 && (
          <div style={{ display: "flex", gap: "4px" }}>
            {[1, 2, 3, 4].map(i => {
              const strength = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
              const colors = ["#ef4444","#f97316","#f59e0b","#10b981"];
              return <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= strength ? colors[strength - 1] : "rgba(255,255,255,0.08)", transition: "background 0.2s" }} />;
            })}
          </div>
        )}

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
          {isLoading ? "Updating…" : "Update password"}
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid rgba(124,58,237,0.1)", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

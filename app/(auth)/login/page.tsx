"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";

const GOOGLE_CLIENT_ID = "958679936304-i304otpjmb8becedetj403u2m2kvbktf.apps.googleusercontent.com";

// Load Google Identity Services script once
function loadGIS(): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById("gis-script")) { resolve(); return; }
    const s = document.createElement("script");
    s.id = "gis-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, loginWithGoogle } = useAuthStore();

  // Pre-load GIS on mount
  useEffect(() => { loadGIS(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const ok = await login(email, password);
    if (ok) {
      // Set cookie for middleware
      document.cookie = `mithra-token=1; path=/; max-age=${7 * 86400}; SameSite=Lax`;
      const params = new URLSearchParams(window.location.search);
      router.push(params.get("callbackUrl") || "/resume-builder");
    } else {
      const storeError = useAuthStore.getState().error;
      setError(storeError || "Invalid email or password. Please try again.");
    }
    setIsLoading(false);
  };

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    setError("");
    try {
      // Ensure GIS is loaded
      await loadGIS();
      type GISNotification = { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean; getNotDisplayedReason: () => string };
      type GIS = { accounts: { id: { initialize: (c: object) => void; prompt: (cb?: (n: GISNotification) => void) => void } } };
      const google = (window as Window & { google?: GIS }).google;
      if (!google?.accounts?.id) {
        setError("Google sign-in unavailable. Please use email login.");
        setIsGoogleLoading(false);
        return;
      }
      // Use popup/One Tap — no redirect URI needed, only JS origins
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (res: { credential: string }) => {
          const ok = await loginWithGoogle(res.credential);
          if (ok) {
            document.cookie = `mithra-token=1; path=/; max-age=${7 * 86400}; SameSite=Lax`;
            const params = new URLSearchParams(window.location.search);
            router.push(params.get("callbackUrl") || "/resume-builder");
          } else {
            setError("Google sign-in failed. Please try again or use email login.");
          }
          setIsGoogleLoading(false);
        },
        ux_mode: "popup",
        itp_support: true,
      });
      // prompt() with notification callback to catch silent failures
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason();
          if (reason === "unregistered_origin" || reason === "suppressed_by_user") {
            setError("Google sign-in is unavailable on this browser/domain. Please use email login instead.");
          } else {
            setError("Google sign-in could not open. Please allow pop-ups or use email login.");
          }
          setIsGoogleLoading(false);
        } else if (notification.isSkippedMoment()) {
          setError("Google sign-in was cancelled. Please try again.");
          setIsGoogleLoading(false);
        }
      });
    } catch {
      setError("Google sign-in failed. Please try again.");
      setIsGoogleLoading(false);
    }
  };

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
    transition: "border-color 0.2s",
  };

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#f1f5f9",
            marginBottom: "8px",
          }}
        >
          Welcome back
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6 }}>
          Every great career began with a single step forward.
        </p>
      </div>

      {/* Google Sign In */}
      <button
        onClick={handleGoogle}
        disabled={isGoogleLoading || isLoading}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "11px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "10px",
          color: "#f1f5f9",
          fontSize: "14px",
          fontWeight: 600,
          cursor: isGoogleLoading || isLoading ? "not-allowed" : "pointer",
          marginBottom: "16px",
          fontFamily: "inherit",
          transition: "all 0.2s",
          opacity: isGoogleLoading || isLoading ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isGoogleLoading && !isLoading) e.currentTarget.style.background = "rgba(255,255,255,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        }}
      >
        {isGoogleLoading ? (
          <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
        ) : (
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
        )}
        {isGoogleLoading ? "Signing in..." : "Sign in with Google"}
      </button>

      {/* LinkedIn (Coming Soon) */}
      <button
        disabled
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "11px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "10px",
          color: "#475569",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "not-allowed",
          marginBottom: "20px",
          fontFamily: "inherit",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        Sign in with LinkedIn
        <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)", marginLeft: "4px" }}>
          Coming soon
        </span>
      </button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div style={{ flex: 1, height: "1px", background: "rgba(124,58,237,0.15)" }} />
        <span style={{ fontSize: "12px", color: "#475569" }}>or continue with email</span>
        <div style={{ flex: 1, height: "1px", background: "rgba(124,58,237,0.15)" }} />
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ position: "relative" }}>
          <Mail
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "16px",
              height: "16px",
              color: "#64748b",
            }}
          />
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

        <div>
          <div style={{ position: "relative" }}>
            <Lock
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: "#64748b",
              }}
            />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              style={{ ...input, paddingRight: "44px" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.25)")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
                padding: "2px",
                display: "flex",
              }}
            >
              {showPassword ? <EyeOff style={{ width: "15px", height: "15px" }} /> : <Eye style={{ width: "15px", height: "15px" }} />}
            </button>
          </div>
          <div style={{ textAlign: "right", marginTop: "6px" }}>
            <Link
              href="/forgot-password"
              style={{ fontSize: "12px", color: "#a78bfa", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              fontSize: "13px",
              color: "#f87171",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          style={{
            width: "100%",
            padding: "12px",
            background:
              isLoading || isGoogleLoading
                ? "rgba(124,58,237,0.4)"
                : "linear-gradient(135deg,#7c3aed,#6d28d9)",
            border: "none",
            borderRadius: "10px",
            color: "white",
            fontSize: "14px",
            fontWeight: 700,
            cursor: isLoading || isGoogleLoading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: isLoading || isGoogleLoading ? "none" : "0 4px 16px rgba(124,58,237,0.3)",
          }}
        >
          {isLoading && <Loader2 style={{ width: "15px", height: "15px", animation: "spin 1s linear infinite" }} />}
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#475569" }}>
        New to Mithra?{" "}
        <Link
          href="/register"
          style={{ color: "#a78bfa", textDecoration: "none", fontWeight: 600 }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          Create your account
        </Link>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

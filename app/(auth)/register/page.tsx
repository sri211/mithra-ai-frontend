"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setIsLoading(true);
    try {
      // Register via our API
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || "Registration failed. Please try again.");
        return;
      }

      // Auto sign-in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Registration succeeded but sign-in failed — redirect to login
        router.push("/login");
      } else {
        router.push("/resume-builder");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
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
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9", marginBottom: "8px" }}>
          Begin your story
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6 }}>
          Every bullet point is a bridge between who you are and where you belong.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ position: "relative" }}>
          <User
            style={{
              position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
              width: "16px", height: "16px", color: "#64748b",
            }}
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
            style={input}
            onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.25)")}
          />
        </div>

        <div style={{ position: "relative" }}>
          <Mail
            style={{
              position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
              width: "16px", height: "16px", color: "#64748b",
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

        <div style={{ position: "relative" }}>
          <Lock
            style={{
              position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
              width: "16px", height: "16px", color: "#64748b",
            }}
          />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a password (8+ chars)"
            required
            style={{ ...input, paddingRight: "44px" }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.25)")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#64748b",
              padding: "2px", display: "flex",
            }}
          >
            {showPassword ? <EyeOff style={{ width: "15px", height: "15px" }} /> : <Eye style={{ width: "15px", height: "15px" }} />}
          </button>
        </div>

        {error && (
          <div style={{
            padding: "10px 12px", borderRadius: "8px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            fontSize: "13px", color: "#f87171",
          }}>
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
          {isLoading ? "Creating account..." : "Create free account"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#475569" }}>
        Already have an account?{" "}
        <Link
          href="/login"
          style={{ color: "#a78bfa", textDecoration: "none", fontWeight: 600 }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          Sign in
        </Link>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

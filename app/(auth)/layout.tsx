import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0614 0%, #0f0a1e 50%, #0a0614 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(124,58,237,0.5)",
            }}
          >
            <Sparkles style={{ width: "20px", height: "20px", color: "white" }} />
          </div>
          <span
            style={{
              fontSize: "24px",
              fontWeight: 800,
              background: "linear-gradient(135deg,#a78bfa,#f59e0b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Mithra AI
          </span>
        </div>
        <p style={{ fontSize: "13px", color: "#475569" }}>Your AI Career Companion</p>
      </div>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(20,13,40,0.9)",
          border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: "20px",
          padding: "36px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

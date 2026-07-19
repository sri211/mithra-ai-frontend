"use client";
import React from "react";

/**
 * Catches render errors in a subtree so a bad payload can never take the whole
 * page down (previously an unguarded field in the adapted resume crashed the tab).
 */
export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; label?: string },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode; label?: string }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || "Something went wrong" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[Mithra ErrorBoundary]", this.props.label || "", error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        padding: "22px", borderRadius: "14px", background: "rgba(224,122,95,0.06)",
        border: "1px solid rgba(224,122,95,0.3)", color: "#14281E", margin: "16px",
      }}>
        <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>
          Couldn&apos;t display {this.props.label || "this section"}
        </div>
        <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.6, margin: "0 0 12px" }}>
          The data came back in an unexpected shape. Your work is safe — try running it again.
        </p>
        <button
          onClick={() => this.setState({ hasError: false, message: "" })}
          style={{
            padding: "9px 16px", borderRadius: "9px", border: "none", cursor: "pointer",
            background: "#0F6E55", color: "#fff", fontSize: "13px", fontWeight: 700,
          }}>
          Try again
        </button>
      </div>
    );
  }
}

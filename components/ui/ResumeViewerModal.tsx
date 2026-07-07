"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function ResumeViewerModal({ isOpen, onClose, title = "Resume", children }: Props) {
  const [zoom, setZoom] = useState(0.85);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const isMobile = window.innerWidth < 768;
      setZoom(isMobile ? 0.43 : 0.85);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const zoomIn = () => setZoom(z => Math.min(1.4, +(z + 0.1).toFixed(1)));
  const zoomOut = () => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)));
  const resetZoom = () => setZoom(typeof window !== "undefined" && window.innerWidth < 768 ? 0.43 : 0.85);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)" }} />

          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            style={{
              position: "fixed", inset: 0, zIndex: 201,
              display: "flex", flexDirection: "column",
              background: "rgba(6,3,14,0.97)",
            }}>

            {/* Header toolbar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px", flexShrink: 0,
              background: "rgba(10,6,22,0.98)",
              borderBottom: "1px solid rgba(15,110,85,0.2)",
            }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", display: "flex", alignItems: "center", gap: "8px" }}>
                <Maximize2 style={{ width: "14px", height: "14px", color: "#0F6E55" }} />{title}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button onClick={zoomOut} style={{ width: "34px", height: "34px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
                  <ZoomOut style={{ width: "15px", height: "15px", color: "#94a3b8" }} />
                </button>
                <button onClick={resetZoom} style={{ height: "34px", padding: "0 10px", borderRadius: "9px", background: "rgba(15,110,85,0.1)", border: "1px solid rgba(15,110,85,0.2)", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "#5FAE93" }}>
                  {Math.round(zoom * 100)}%
                </button>
                <button onClick={zoomIn} style={{ width: "34px", height: "34px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
                  <ZoomIn style={{ width: "15px", height: "15px", color: "#94a3b8" }} />
                </button>
                <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
                <button onClick={onClose} style={{ width: "34px", height: "34px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>
                  <X style={{ width: "15px", height: "15px", color: "#f87171" }} />
                </button>
              </div>
            </div>

            {/* Scrollable resume area */}
            <div style={{ flex: 1, overflow: "auto", padding: "16px", WebkitOverflowScrolling: "touch" as "touch" }}>
              <div style={{
                transformOrigin: "top left",
                transform: `scale(${zoom})`,
                width: `${Math.round((1 / zoom) * 100)}%`,
              }}>
                {children}
              </div>
            </div>

            {/* Bottom hint */}
            <div style={{ padding: "8px", textAlign: "center", fontSize: "11px", color: "#334155", flexShrink: 0 }}>
              Pinch to zoom · Tap outside or press Esc to close
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

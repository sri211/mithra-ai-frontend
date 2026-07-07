"use client";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, AlertCircle, Wand2, Check } from "lucide-react";
import { api, API_BASE } from "@/lib/api/client";
import { ResumeData } from "@/lib/types";
import { cn } from "@/lib/cn";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResumeParsed: (resume: ResumeData) => void;
}

const ACCEPTED = [".pdf", ".docx", ".txt"];

export function FileUploadModal({ isOpen, onClose, onResumeParsed }: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      setError("Please upload a PDF, DOCX, or TXT file.");
      resetInput();
      return;
    }
    setFile(f);
    setError(null);
    setSuccess(false);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const readFileText = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || "");
      reader.onerror = reject;
      reader.readAsText(f);
    });
  };

  const parseWithAI = async () => {
    if (!file) return;
    setIsParsing(true);
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    try {
      if (ext === "pdf" || ext === "docx") {
        const formData = new FormData();
        formData.append("file", file);
        // 90s timeout — large detailed CVs take 20-40s to parse
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 90000);
        let response: Response;
        try {
          response = await fetch(`${API_BASE}/resume/upload`, {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timer);
        }
        if (!response.ok) {
          let detail = "";
          try { const e = await response.json(); detail = e.detail || ""; } catch { /* ignore */ }
          // Strip internal error details — show clean message to user
          if (detail.toLowerCase().includes("unterminated") || detail.toLowerCase().includes("json")) {
            throw new Error("Your CV is very detailed — try removing images or reducing formatting, then upload again.");
          }
          throw new Error(detail || `Upload failed (${response.status}). Please try again.`);
        }
        const data = await response.json();
        setSuccess(true);
        resetInput();
        setTimeout(() => { onResumeParsed(data.resume); onClose(); setFile(null); setSuccess(false); }, 800);
      } else {
        let text = "";
        try { text = await readFileText(file); } catch { text = ""; }
        if (!text.trim() || text.length < 50) {
          setError("File appears to be empty. Try a PDF or paste your resume text directly.");
          setIsParsing(false);
          return;
        }
        const { data } = await api.post("/resume/parse-file", { file_text: text, file_name: file.name });
        setSuccess(true);
        resetInput();
        setTimeout(() => { onResumeParsed(data.resume); onClose(); setFile(null); setSuccess(false); }, 800);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        setError("Parsing timed out. Your CV may be very large — try a smaller file or paste your resume text instead.");
      } else {
        const msg = e instanceof Error ? e.message : "Upload failed";
        setError(msg);
      }
    } finally {
      setIsParsing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    resetInput();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-6"
            style={{
              background: "rgba(15,10,30,0.98)",
              backdropFilter: "blur(30px)",
              border: "1px solid rgba(15,110,85,0.25)",
              boxShadow: "0 20px 80px rgba(0,0,0,0.6)",
            }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Upload Resume</h2>
                <p className="text-xs text-slate-400 mt-0.5">PDF, DOCX, or TXT — AI will parse it instantly</p>
              </div>
              <button onClick={handleClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => !file && inputRef.current?.click()}
              className={cn(
                "rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
                isDragging ? "scale-[1.02]" : "",
                file ? "cursor-default" : "hover:border-violet-500/60",
              )}
              style={{
                background: isDragging
                  ? "rgba(15,110,85,0.12)"
                  : file
                  ? "rgba(16,185,129,0.06)"
                  : "rgba(26,16,51,0.6)",
                borderColor: isDragging
                  ? "rgba(15,110,85,0.7)"
                  : file
                  ? "rgba(16,185,129,0.4)"
                  : "rgba(15,110,85,0.2)",
              }}>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED.join(",")}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
                    <FileText className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatSize(file.size)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); resetInput(); }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <motion.div
                    animate={{ y: isDragging ? -4 : 0 }}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(15,110,85,0.12)", border: "1px solid rgba(15,110,85,0.2)" }}>
                    <Upload className="w-7 h-7 text-violet-400" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {isDragging ? "Drop it here!" : "Drag & drop or click to browse"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, TXT</p>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-start gap-2 px-3 py-2 rounded-xl text-xs text-red-400"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Parse button */}
            <button
              onClick={parseWithAI}
              disabled={!file || isParsing || success}
              className={cn(
                "w-full mt-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                file && !isParsing && !success
                  ? "text-white cursor-pointer"
                  : "text-slate-600 cursor-not-allowed",
              )}
              style={file && !isParsing && !success
                ? { background: "linear-gradient(135deg,#0F6E55,#0A523F)", boxShadow: "0 4px 20px rgba(15,110,85,0.4)" }
                : { background: "rgba(255,255,255,0.05)" }}>
              {success ? (
                <><Check className="w-4 h-4 text-emerald-400" /> <span className="text-emerald-400">Parsed successfully!</span></>
              ) : isParsing ? (
                <><motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
                  Parsing with AI...</>
              ) : (
                <><Wand2 className="w-4 h-4" /> Parse with AI</>
              )}
            </button>

            <p className="text-[10px] text-slate-600 text-center mt-3">
              Your file is processed locally and never stored permanently.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

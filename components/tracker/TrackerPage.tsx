"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, MapPin, DollarSign, Calendar, Edit3, Trash2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/auth";
import { getLimits } from "@/lib/planLimits";
import UpgradeGate from "@/components/ui/UpgradeGate";

// ─── Types & Constants ──────────────────────────────────────────────────────
const STAGES = [
  { id: "bookmarked", label: "Saved",     color: "#888888", emoji: "🔖" },
  { id: "applied",    label: "Applied",   color: "#6366f1", emoji: "📤" },
  { id: "screening",  label: "Screening", color: "#f59e0b", emoji: "📞" },
  { id: "interview",  label: "Interview", color: "#8b5cf6", emoji: "💼" },
  { id: "offer",      label: "Offer",     color: "#10b981", emoji: "🎉" },
  { id: "rejected",   label: "Rejected",  color: "#ef4444", emoji: "❌" },
];

type AppStatus = "bookmarked" | "applied" | "screening" | "interview" | "offer" | "rejected";

interface AppCard {
  id: string;
  company: string;
  role: string;
  location: string;
  salary: string;
  status: AppStatus;
  appliedDate: string;
  nextStep: string;
  logo: string;
  color: string;
  portal: string;
}

const COMPANY_COLORS: Record<string, string> = {
  google: "#4285f4", microsoft: "#00a4ef", flipkart: "#2874f0",
  nvidia: "#76b900", razorpay: "#3395ff", swiggy: "#fc8019",
  amazon: "#ff9900", meta: "#0866ff", zomato: "#cb202d",
  infosys: "#007cc3", wipro: "#341c64", tcs: "#2c3e8c",
};

function getCompanyColor(company: string): string {
  const key = company.toLowerCase().replace(/\s/g, "");
  for (const [k, v] of Object.entries(COMPANY_COLORS)) {
    if (key.includes(k)) return v;
  }
  const colors = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];
  let hash = 0;
  for (const ch of company) hash = ((hash << 5) - hash) + ch.charCodeAt(0);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Kanban Card ─────────────────────────────────────────────────────────────
function KanbanCard({ app, onMove, onDelete }: {
  app: AppCard;
  onMove: (id: string, status: AppStatus) => void;
  onDelete: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{
        borderRadius: "12px",
        border: "1px solid rgba(0,0,0,0.08)",
        padding: "12px",
        background: "rgba(0,0,0,0.03)",
        cursor: "grab",
        marginBottom: "8px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "white", flexShrink: 0, background: `${app.color}25`, border: `1px solid ${app.color}30` }}>
          {app.logo}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#111111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{app.role}</div>
          <div style={{ fontSize: "11px", color: "#888888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{app.company}</div>
        </div>
        <button onClick={() => setShowMenu(!showMenu)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888888", padding: "2px", flexShrink: 0 }}>
          <Edit3 style={{ width: "12px", height: "12px" }} />
        </button>
      </div>

      {/* Move menu */}
      {showMenu && (
        <div style={{ borderRadius: "10px", border: "1px solid rgba(0,0,0,0.12)", padding: "8px", marginBottom: "8px", background: "#FFFFFF" }}>
          <p style={{ fontSize: "10px", color: "#888888", padding: "0 4px", marginBottom: "4px" }}>Move to:</p>
          {STAGES.filter((s) => s.id !== app.status).map((s) => (
            <button key={s.id} onClick={() => { onMove(app.id, s.id as AppStatus); setShowMenu(false); }}
              style={{ width: "100%", textAlign: "left", fontSize: "11px", padding: "6px 8px", borderRadius: "8px", border: "none", background: "transparent", color: "#333333", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {s.emoji} {s.label}
            </button>
          ))}
          <button onClick={() => { onDelete(app.id); setShowMenu(false); }}
            style={{ width: "100%", textAlign: "left", fontSize: "11px", padding: "6px 8px", borderRadius: "8px", border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <Trash2 style={{ width: "11px", height: "11px" }} />Delete
          </button>
        </div>
      )}

      {/* Info rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {app.location && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#888888" }}>
            <MapPin style={{ width: "10px", height: "10px" }} />{app.location}
          </div>
        )}
        {app.salary && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#888888" }}>
            <DollarSign style={{ width: "10px", height: "10px" }} />{app.salary}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#888888" }}>
          <Calendar style={{ width: "10px", height: "10px" }} />{app.appliedDate || "—"}
        </div>
      </div>

      {/* Next step */}
      {app.nextStep && (
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <p style={{ fontSize: "10px", color: "#888888", lineHeight: "1.4" }}>{app.nextStep}</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function TrackerPage() {
  const { user } = useUser();
  const limits = getLimits(user?.plan ?? "free");
  const [apps, setApps] = useState<AppCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  if (!limits.trackerAccess) {
    return (
      <div style={{ height: "100%", overflowY: "auto", background: "#F7F7F5", padding: "24px 16px" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          <UpgradeGate
            requiredPlan="pro"
            featureName="Application Tracker"
            description="Kanban board to track every job application from bookmark to offer letter."
          />
          {/* Blurred Kanban preview */}
          <div style={{ borderRadius: "16px", padding: "20px", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#818cf8", marginBottom: "12px" }}>What Pro unlocks:</div>
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
              {[
                { label: "Saved", color: "#888888", emoji: "🔖", n: 4 },
                { label: "Applied", color: "#6366f1", emoji: "📤", n: 3 },
                { label: "Interview", color: "#8b5cf6", emoji: "💼", n: 1 },
                { label: "Offer", color: "#10b981", emoji: "🎉", n: 0 },
              ].map((s) => (
                <div key={s.label} style={{ flexShrink: 0, width: "100px", borderRadius: "12px", padding: "10px 8px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: s.color, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>{s.emoji}</span>{s.label} <span style={{ opacity: 0.7 }}>({s.n})</span>
                  </div>
                  {[...Array(s.n)].map((_, i) => (
                    <div key={i} style={{ height: "28px", borderRadius: "6px", background: "rgba(0,0,0,0.04)", marginBottom: "4px" }} />
                  ))}
                  {s.n === 0 && <div style={{ height: "28px", borderRadius: "6px", border: "1px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#334155" }}>empty</div>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: "10px", fontSize: "12px", color: "#888888" }}>
              + Response rate tracking · Salary comparison · Next steps for each application
            </div>
          </div>
        </div>
      </div>
    );
  }
  const [showAdd, setShowAdd] = useState(false);
  const [newApp, setNewApp] = useState({ company: "", role: "", location: "", salary: "", portal: "", nextStep: "" });

  // Load from backend on mount
  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/tracker/");
      const board = data.board as Record<string, Record<string, unknown>[]>;
      const allApps: AppCard[] = [];
      for (const stage of STAGES) {
        const stageApps = board[stage.id] || [];
        for (const app of stageApps) {
          const raw = app as Record<string, unknown>;
          allApps.push({
            id: String(raw.id || ""),
            company: String(raw.company || ""),
            role: String(raw.role || ""),
            location: String(raw.location || ""),
            salary: String(raw.salary || ""),
            status: (String(raw.status || "applied")) as AppStatus,
            appliedDate: String(raw.applied_date || raw.appliedDate || "—"),
            nextStep: String(raw.next_step || raw.nextStep || "Awaiting response"),
            logo: raw.company ? String(raw.company)[0].toUpperCase() : "?",
            color: getCompanyColor(String(raw.company || "")),
            portal: String(raw.portal || "LinkedIn"),
          });
        }
      }
      setApps(allApps);
    } catch {
      // Backend not running — start with empty board
      setApps([]);
    } finally {
      setIsLoading(false);
    }
  };

  const moveApp = async (id: string, status: AppStatus) => {
    // Optimistic update
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await api.patch(`/tracker/${id}`, { status });
    } catch {
      // Revert on failure
      loadApplications();
    }
  };

  const deleteApp = async (id: string) => {
    setApps((prev) => prev.filter((a) => a.id !== id));
    try {
      await api.delete(`/tracker/${id}`);
    } catch {
      loadApplications();
    }
  };

  const addApp = async () => {
    if (!newApp.company || !newApp.role) return;
    const tempId = `temp_${Date.now()}`;
    const appCard: AppCard = {
      id: tempId,
      company: newApp.company,
      role: newApp.role,
      location: newApp.location,
      salary: newApp.salary,
      status: "bookmarked",
      appliedDate: "—",
      nextStep: newApp.nextStep || "Apply soon",
      logo: newApp.company[0].toUpperCase(),
      color: getCompanyColor(newApp.company),
      portal: newApp.portal || "LinkedIn",
    };
    setApps((prev) => [...prev, appCard]);
    setNewApp({ company: "", role: "", location: "", salary: "", portal: "", nextStep: "" });
    setShowAdd(false);

    try {
      const { data } = await api.post("/tracker/", {
        company: newApp.company,
        role: newApp.role,
        location: newApp.location,
        salary: newApp.salary,
        portal: newApp.portal,
        status: "bookmarked",
        notes: newApp.nextStep,
      });
      // Replace temp ID with real backend ID
      setApps((prev) => prev.map((a) => a.id === tempId ? { ...a, id: data.id } : a));
    } catch {
      // Keep local optimistic state
    }
  };

  const stats = {
    total: apps.length,
    applied: apps.filter((a) => !["bookmarked", "rejected"].includes(a.status)).length,
    interviews: apps.filter((a) => a.status === "interview").length,
    offers: apps.filter((a) => a.status === "offer").length,
    responseRate: apps.length > 0
      ? Math.round((apps.filter((a) => !["bookmarked"].includes(a.status)).length / apps.length) * 100)
      : 0,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#FFFFFF",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "#111111",
    fontSize: "13px",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#F7F7F5" }}>
      {/* Stats bar */}
      <div className="tr-stats-bar" style={{ padding: "16px 24px", borderBottom: "1px solid rgba(124,58,237,0.1)", flexShrink: 0, display: "flex", alignItems: "center", gap: "32px" }}>
        {[
          { label: "Total Tracked",        value: stats.total,                    color: "#7c3aed" },
          { label: "Active Applications",  value: stats.applied,                  color: "#6366f1" },
          { label: "In Interview",          value: stats.interviews,               color: "#8b5cf6" },
          { label: "Offers",               value: stats.offers,                   color: "#10b981" },
          { label: "Response Rate",        value: `${stats.responseRate}%`,        color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "22px", fontWeight: 900, color: s.color, lineHeight: "1" }}>{s.value}</div>
            <div style={{ fontSize: "10px", color: "#888888", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button onClick={loadApplications}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "10px", color: "#888888", fontSize: "12px", cursor: "pointer" }}>
            <RefreshCw style={{ width: "13px", height: "13px" }} />Refresh
          </button>
          <button onClick={() => setShowAdd(true)}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
            <Plus style={{ width: "15px", height: "15px" }} />Add Application
          </button>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(0,0,0,0.7)" }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              style={{ background: "#FFFFFF", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 80px rgba(0,0,0,0.6)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111111" }}>Add Application</h3>
                <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888888" }}>
                  <X style={{ width: "20px", height: "20px" }} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {([
                  ["company", "Company Name *"],
                  ["role", "Job Title *"],
                  ["location", "Location"],
                  ["salary", "Salary Range"],
                  ["portal", "Portal (LinkedIn, Naukri...)"],
                  ["nextStep", "Next Step / Notes"],
                ] as [string, string][]).map(([f, l]) => (
                  <div key={f}>
                    <label style={{ fontSize: "11px", color: "#888888", display: "block", marginBottom: "6px" }}>{l}</label>
                    <input
                      style={inputStyle}
                      value={(newApp as Record<string, string>)[f]}
                      onChange={(e) => setNewApp((p) => ({ ...p, [f]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addApp()}
                      placeholder={l}
                    />
                  </div>
                ))}
                <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
                  <button onClick={addApp}
                    style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: "12px", color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                    Add
                  </button>
                  <button onClick={() => setShowAdd(false)}
                    style={{ flex: 1, padding: "12px", background: "none", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "12px", color: "#7c3aed", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {isLoading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>
            <motion.div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", margin: "0 auto 12px" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
            <p style={{ fontSize: "13px", color: "#888888", textAlign: "center" }}>Loading applications...</p>
          </div>
        </div>
      ) : (
        /* Kanban board */
        <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", padding: "16px 24px" }}>
          {apps.length === 0 ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
              <div style={{ fontSize: "48px" }}>📋</div>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#111111" }}>No applications tracked yet</p>
              <p style={{ fontSize: "13px", color: "#888888" }}>Add your first job application to start tracking</p>
              <button onClick={() => setShowAdd(true)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: "12px", color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                <Plus style={{ width: "16px", height: "16px" }} />Add First Application
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "16px", height: "100%", minWidth: `${STAGES.length * 240}px` }}>
              {STAGES.map((stage) => {
                const stageApps = apps.filter((a) => a.status === stage.id);
                return (
                  <div key={stage.id} style={{ display: "flex", flexDirection: "column", width: "220px", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", padding: "0 4px" }}>
                      <span style={{ fontSize: "16px" }}>{stage.emoji}</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#111111", flex: 1 }}>{stage.label}</span>
                      <span style={{ width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, background: `${stage.color}30`, color: stage.color }}>
                        {stageApps.length}
                      </span>
                    </div>
                    <div style={{ flex: 1, borderRadius: "16px", padding: "8px", overflowY: "auto", background: "#FFFFFF", border: "1px solid rgba(124,58,237,0.1)", minHeight: "400px" }}>
                      <AnimatePresence>
                        {stageApps.map((app) => (
                          <KanbanCard key={app.id} app={app} onMove={moveApp} onDelete={deleteApp} />
                        ))}
                      </AnimatePresence>
                      {stageApps.length === 0 && (
                        <div style={{ height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <p style={{ fontSize: "11px", color: "#888888" }}>Drop cards here</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

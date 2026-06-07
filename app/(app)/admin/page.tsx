"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, Crown, BarChart2, RefreshCw, AlertCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/auth";

const ADMIN_EMAILS = ["srinathreddy.ksr@gmail.com", "sri@mithraai.in"];

interface OverviewData {
  summary: { total_users: number; paid_users: number; conversion_rate: string; signups_today: number; signups_this_week: number; signups_this_month: number };
  plans: { free: number; pro: number; elite: number };
  feature_usage_30d: { resumes_built: number; resumes_adapted: number; job_searches: number };
  daily_signups_7d: { date: string; count: number }[];
  recent_signups: { name: string; email: string; plan: string; joined: string }[];
}

const PLAN_COLORS: Record<string, string> = { free: "#94a3b8", pro: "#a78bfa", elite: "#f59e0b" };

export default function AdminPage() {
  const { user } = useUser();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const isAdmin = ADMIN_EMAILS.includes(user?.email ?? "");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const { data: d } = await api.get("/analytics/overview");
      setData(d);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to load analytics");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) load(); else setLoading(false); }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0614" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔒</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#f1f5f9" }}>Admin access only</div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0614" }}>
      <motion.div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
    </div>
  );

  const maxBar = data ? Math.max(...data.daily_signups_7d.map(d => d.count), 1) : 1;

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#0a0614" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#f1f5f9" }}>Analytics Dashboard</h1>
            <p style={{ fontSize: "13px", color: "#64748b" }}>Last refresh: {lastRefresh.toLocaleTimeString()}</p>
          </div>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "10px", color: "#a78bfa", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw style={{ width: "14px", height: "14px" }} />Refresh
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", gap: "10px", alignItems: "center", fontSize: "13px", color: "#f87171" }}>
            <AlertCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} />{error}
          </div>
        )}

        {data && (
          <>
            {/* Summary stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
              {[
                { label: "Total Users",      value: data.summary.total_users,        color: "#a78bfa", icon: Users },
                { label: "Paid Users",       value: data.summary.paid_users,          color: "#f59e0b", icon: Crown },
                { label: "Conversion Rate",  value: data.summary.conversion_rate,     color: "#10b981", icon: TrendingUp },
                { label: "Today",            value: data.summary.signups_today,       color: "#06b6d4", icon: BarChart2 },
                { label: "This Week",        value: data.summary.signups_this_week,   color: "#8b5cf6", icon: BarChart2 },
                { label: "This Month",       value: data.summary.signups_this_month,  color: "#f97316", icon: BarChart2 },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ background: "rgba(18,10,36,0.9)", border: `1px solid ${s.color}20`, borderRadius: "14px", padding: "16px" }}>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: s.color, marginBottom: "4px" }}>{s.value}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Plans + Feature usage */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "rgba(18,10,36,0.9)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "16px", padding: "20px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", marginBottom: "16px" }}>Users by Plan</h3>
                {Object.entries(data.plans).map(([plan, count]) => (
                  <div key={plan} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: `${PLAN_COLORS[plan]}15`, color: PLAN_COLORS[plan], minWidth: "40px", textAlign: "center", textTransform: "uppercase" }}>{plan}</span>
                    <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "3px", background: PLAN_COLORS[plan], width: `${data.summary.total_users > 0 ? (count / data.summary.total_users) * 100 : 0}%`, transition: "width 0.6s" }} />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9", minWidth: "24px", textAlign: "right" }}>{count}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(18,10,36,0.9)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "16px", padding: "20px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", marginBottom: "16px" }}>Feature Usage (30d)</h3>
                {[
                  { label: "Resumes Built",   value: data.feature_usage_30d.resumes_built,   color: "#8b5cf6" },
                  { label: "Resumes Adapted", value: data.feature_usage_30d.resumes_adapted,  color: "#06b6d4" },
                  { label: "Job Searches",    value: data.feature_usage_30d.job_searches,     color: "#10b981" },
                ].map((f) => (
                  <div key={f.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ fontSize: "13px", color: "#94a3b8" }}>{f.label}</span>
                    <span style={{ fontSize: "16px", fontWeight: 900, color: f.color }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily signups bar chart */}
            <div style={{ background: "rgba(18,10,36,0.9)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", marginBottom: "16px" }}>Daily Signups — Last 7 Days</h3>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "80px" }}>
                {data.daily_signups_7d.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: `${(d.count / maxBar) * 64}px` }}
                      transition={{ duration: 0.5, delay: i * 0.07 }}
                      style={{ width: "100%", borderRadius: "4px 4px 0 0", background: "linear-gradient(180deg,#7c3aed,#6d28d9)", minHeight: d.count > 0 ? "4px" : "0" }} />
                    <div style={{ fontSize: "9px", color: "#475569" }}>{d.date.split(" ")[0]}</div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#a78bfa" }}>{d.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent signups */}
            <div style={{ background: "rgba(18,10,36,0.9)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "16px", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9" }}>Recent Signups</h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                      {["Name", "Email", "Plan", "Joined"].map((h) => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_signups.map((u, i) => (
                      <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "10px 16px", fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>{u.name}</td>
                        <td style={{ padding: "10px 16px", fontSize: "12px", color: "#94a3b8" }}>{u.email}</td>
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "6px", fontWeight: 700, background: `${PLAN_COLORS[u.plan] ?? "#94a3b8"}15`, color: PLAN_COLORS[u.plan] ?? "#94a3b8", textTransform: "uppercase" }}>{u.plan}</span>
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: "11px", color: "#475569" }}>{u.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

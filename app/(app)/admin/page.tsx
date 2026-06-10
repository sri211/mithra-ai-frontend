"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Users, TrendingUp, Crown, BarChart3, RefreshCw, AlertCircle,
  Zap, Activity, Target, FileText, ArrowUpRight, Shield,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/auth";

const ADMIN_EMAILS = ["srinathreddy.ksr@gmail.com", "sri@mithraai.in"];

interface OverviewData {
  summary: {
    total_users: number;
    paid_users: number;
    free_users: number;
    conversion_rate: string;
    signups_today: number;
    signups_this_week: number;
    signups_this_month: number;
    active_users_30d: number;
    total_events_30d: number;
    upgrade_clicks_30d: number;
    upgrade_conversion: string;
    google_users: number;
    email_users: number;
  };
  plans: { free: number; pro: number; elite: number };
  feature_usage_30d: Record<string, number>;
  ats_improvement: { avg_before: number; avg_after: number; avg_lift: number };
  daily_signups_7d: { date: string; count: number }[];
  top_pages_30d: { page: string; views: number }[];
  recent_signups: { name: string; email: string; plan: string; joined: string; method: string }[];
}

const PLAN_COLORS: Record<string, string> = {
  free: "#10b981",
  pro: "#7c3aed",
  elite: "#f59e0b",
};

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ElementType;
}) {
  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid rgba(0,0,0,0.07)",
      borderRadius: "14px",
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
    }}>
      {/* Accent left stripe */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: color, borderRadius: "14px 0 0 14px" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#888888", letterSpacing: "0.8px", textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon style={{ width: "14px", height: "14px", color }} />
        </div>
      </div>
      <div style={{ fontSize: "28px", fontWeight: 900, color: "#111111", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: "#888888", marginTop: "2px" }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, max, color, label, count }: {
  value: number; max: number; color: string; label: string; count: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <span style={{ fontSize: "12px", color: "#444444", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#111111" }}>{count.toLocaleString()}</span>
      </div>
      <div style={{ height: "7px", background: "rgba(0,0,0,0.05)", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: "4px",
          transition: "width 0.7s ease",
        }} />
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useUser();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const isAdmin = ADMIN_EMAILS.includes(user?.email ?? "");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: d } = await api.get("/analytics/overview");
      setData(d);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to load analytics"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
    else setLoading(false);
  }, [isAdmin, load]);

  if (!isAdmin) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F7F5" }}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Shield style={{ width: "28px", height: "28px", color: "#ef4444" }} />
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#111111", marginBottom: "6px" }}>Admin Access Only</div>
          <div style={{ fontSize: "13px", color: "#888888" }}>You don&apos;t have permission to view this page.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F7F5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%",
            border: "3px solid rgba(124,58,237,0.12)",
            borderTopColor: "#7c3aed",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }} />
          <div style={{ fontSize: "13px", color: "#888888" }}>Loading analytics...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const maxBar = data ? Math.max(...data.daily_signups_7d.map((d) => d.count), 1) : 1;
  const maxFeature = data ? Math.max(...Object.values(data.feature_usage_30d), 1) : 1;
  const maxPage = data?.top_pages_30d?.length ? Math.max(...data.top_pages_30d.map((p) => p.views), 1) : 1;

  return (
    <div style={{ minHeight: "100%", background: "#F7F7F5", overflowY: "auto" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 20px 48px" }}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg,#7c3aed,#5b21b6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart3 style={{ width: "16px", height: "16px", color: "white" }} />
              </div>
              <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#111111" }}>Admin Dashboard</h1>
            </div>
            <p style={{ fontSize: "12px", color: "#888888", marginLeft: "42px" }}>
              Mithra AI · Last refreshed {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={load}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px",
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: "10px",
              color: "#444444",
              fontSize: "13px", fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <RefreshCw style={{ width: "13px", height: "13px" }} />
            Refresh
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", display: "flex", gap: "10px", alignItems: "center", fontSize: "13px", color: "#dc2626" }}>
            <AlertCircle style={{ width: "15px", height: "15px", flexShrink: 0 }} />{error}
          </div>
        )}

        {data && (
          <>
            {/* ── Row 1: KPI Cards ──────────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "12px", marginBottom: "20px" }}>
              <StatCard label="Total Users"     value={data.summary.total_users}       sub={`Free: ${data.summary.free_users} · Paid: ${data.summary.paid_users}`} color="#7c3aed" icon={Users} />
              <StatCard label="Paid Subscribers" value={data.summary.paid_users}       sub={`Conversion: ${data.summary.conversion_rate}`}                         color="#f59e0b" icon={Crown} />
              <StatCard label="Active (30d)"    value={data.summary.active_users_30d}  sub="Users with tracked events"                                             color="#10b981" icon={Activity} />
              <StatCard label="Signups Today"   value={data.summary.signups_today}     sub={`7d: ${data.summary.signups_this_week} · 30d: ${data.summary.signups_this_month}`} color="#3b82f6" icon={TrendingUp} />
              <StatCard label="Events (30d)"    value={data.summary.total_events_30d}  sub="Page views + feature events"                                           color="#06b6d4" icon={Zap} />
              <StatCard label="Upgrade Clicks"  value={data.summary.upgrade_clicks_30d} sub={`Clicked → Paid: ${data.summary.upgrade_conversion}`}               color="#f97316" icon={ArrowUpRight} />
            </div>

            {/* ── Row 2: Plan Distribution + 7-day Chart ─────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

              {/* Plan distribution */}
              <div style={{ background: "#FFFFFF", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.07)", padding: "22px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#111111", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "18px" }}>
                  Plan Distribution
                </h3>
                {Object.entries(data.plans).map(([plan, count]) => (
                  <ProgressBar
                    key={plan}
                    label={plan.charAt(0).toUpperCase() + plan.slice(1)}
                    value={count}
                    max={data.summary.total_users}
                    color={PLAN_COLORS[plan]}
                    count={count}
                  />
                ))}
                <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#666666" }}>Auth method split</span>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", background: "rgba(59,130,246,0.08)", color: "#3b82f6", fontWeight: 700 }}>
                        Google: {data.summary.google_users}
                      </span>
                      <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", background: "rgba(0,0,0,0.05)", color: "#555555", fontWeight: 700 }}>
                        Email: {data.summary.email_users}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7-day signup bar chart */}
              <div style={{ background: "#FFFFFF", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.07)", padding: "22px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#111111", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "18px" }}>
                  Daily Signups — Last 7 Days
                </h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
                  {data.daily_signups_7d.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
                      <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                        <div
                          style={{
                            width: "100%",
                            height: `${Math.max((d.count / maxBar) * 100, d.count > 0 ? 8 : 0)}%`,
                            background: "linear-gradient(180deg,#7c3aed,#5b21b6)",
                            borderRadius: "4px 4px 0 0",
                            transition: "height 0.5s ease",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "9px", color: "#999999" }}>{d.date.slice(-5)}</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed" }}>{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Row 3: Feature Usage ──────────────────────────────────────── */}
            <div style={{ background: "#FFFFFF", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.07)", padding: "22px", marginBottom: "16px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
                <Target style={{ width: "15px", height: "15px", color: "#7c3aed" }} />
                <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#111111", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  Feature Utilization — Last 30 Days
                </h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                {Object.entries(data.feature_usage_30d)
                  .sort(([, a], [, b]) => b - a)
                  .map(([feature, count], i) => {
                    const colors = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#f97316", "#8b5cf6", "#3b82f6", "#ec4899"];
                    return (
                      <ProgressBar
                        key={feature}
                        label={feature}
                        value={count}
                        max={maxFeature}
                        color={colors[i % colors.length]}
                        count={count}
                      />
                    );
                  })}
              </div>
            </div>

            {/* ── Row 4: ATS Improvement + Top Pages ───────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

              {/* ATS Improvement */}
              <div style={{ background: "#FFFFFF", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.07)", padding: "22px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
                  <FileText style={{ width: "15px", height: "15px", color: "#06b6d4" }} />
                  <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#111111", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                    Avg ATS Score Improvement
                  </h3>
                </div>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: "32px", fontWeight: 900, color: "#888888" }}>{data.ats_improvement.avg_before}</div>
                    <div style={{ fontSize: "11px", color: "#999999", marginTop: "2px" }}>Before Adaption</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    <div style={{ fontSize: "18px", color: "#10b981" }}>→</div>
                    <div style={{ fontSize: "11px", fontWeight: 800, color: "#10b981" }}>
                      {data.ats_improvement.avg_lift > 0 ? `+${data.ats_improvement.avg_lift}` : data.ats_improvement.avg_lift}
                    </div>
                  </div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: "32px", fontWeight: 900, color: "#10b981" }}>{data.ats_improvement.avg_after}</div>
                    <div style={{ fontSize: "11px", color: "#999999", marginTop: "2px" }}>After Adaption</div>
                  </div>
                </div>
                {data.ats_improvement.avg_before === 0 && (
                  <div style={{ marginTop: "14px", padding: "10px", background: "rgba(0,0,0,0.03)", borderRadius: "8px", fontSize: "11px", color: "#888888", textAlign: "center" }}>
                    Data available once users adapt resumes
                  </div>
                )}
              </div>

              {/* Top pages */}
              <div style={{ background: "#FFFFFF", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.07)", padding: "22px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
                  <Activity style={{ width: "15px", height: "15px", color: "#f97316" }} />
                  <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#111111", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                    Top Pages (30d)
                  </h3>
                </div>
                {data.top_pages_30d.length === 0 ? (
                  <div style={{ padding: "16px", background: "rgba(0,0,0,0.03)", borderRadius: "8px", fontSize: "12px", color: "#888888", textAlign: "center" }}>
                    Page view tracking starts accumulating after deploy.<br />Add <code style={{ fontSize: "11px", background: "rgba(0,0,0,0.05)", padding: "1px 4px", borderRadius: "4px" }}>trackPage()</code> calls to pages.
                  </div>
                ) : (
                  data.top_pages_30d.slice(0, 7).map((p) => (
                    <ProgressBar
                      key={p.page}
                      label={p.page}
                      value={p.views}
                      max={maxPage}
                      color="#f97316"
                      count={p.views}
                    />
                  ))
                )}
              </div>
            </div>

            {/* ── Row 5: Upgrade Funnel ─────────────────────────────────────── */}
            <div style={{ background: "#FFFFFF", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.07)", padding: "22px", marginBottom: "16px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
                <ArrowUpRight style={{ width: "15px", height: "15px", color: "#f59e0b" }} />
                <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#111111", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  Conversion Funnel
                </h3>
              </div>
              <div style={{ display: "flex", gap: "0", alignItems: "stretch" }}>
                {[
                  { label: "Total Users", value: data.summary.total_users,             color: "#3b82f6", pct: 100 },
                  { label: "Signups (30d)", value: data.summary.signups_this_month,    color: "#7c3aed", pct: data.summary.total_users > 0 ? Math.round(data.summary.signups_this_month / data.summary.total_users * 100) : 0 },
                  { label: "Active (30d)", value: data.summary.active_users_30d,       color: "#06b6d4", pct: data.summary.total_users > 0 ? Math.round(data.summary.active_users_30d / data.summary.total_users * 100) : 0 },
                  { label: "Upgrade Clicks", value: data.summary.upgrade_clicks_30d,  color: "#f97316", pct: data.summary.total_users > 0 ? Math.round(data.summary.upgrade_clicks_30d / data.summary.total_users * 100) : 0 },
                  { label: "Paid Users", value: data.summary.paid_users,              color: "#f59e0b", pct: data.summary.total_users > 0 ? Math.round(data.summary.paid_users / data.summary.total_users * 100) : 0 },
                ].map((step, i, arr) => (
                  <div key={step.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                    <div style={{
                      width: "100%",
                      height: "52px",
                      background: `${step.color}12`,
                      border: `1.5px solid ${step.color}30`,
                      borderRadius: i === 0 ? "10px 0 0 10px" : i === arr.length - 1 ? "0 10px 10px 0" : "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "16px", fontWeight: 900, color: step.color }}>{step.value.toLocaleString()}</div>
                        <div style={{ fontSize: "9px", color: "#888888", fontWeight: 700 }}>{step.pct}%</div>
                      </div>
                      {i < arr.length - 1 && (
                        <div style={{ position: "absolute", right: "-8px", zIndex: 2, fontSize: "14px", color: "#aaaaaa" }}>›</div>
                      )}
                    </div>
                    <div style={{ fontSize: "10px", color: "#666666", fontWeight: 600, marginTop: "6px", textAlign: "center" }}>{step.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Row 6: Recent Signups Table ───────────────────────────────── */}
            <div style={{ background: "#FFFFFF", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Users style={{ width: "15px", height: "15px", color: "#7c3aed" }} />
                <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#111111", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  Recent Signups
                </h3>
                <span style={{ marginLeft: "auto", fontSize: "11px", color: "#888888" }}>Last 15 users</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                      {["Name", "Email", "Plan", "Auth", "Joined"].map((h) => (
                        <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: "10px", fontWeight: 800, color: "#888888", textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_signups.map((u, i) => (
                      <tr
                        key={i}
                        style={{ borderTop: "1px solid rgba(0,0,0,0.04)", cursor: "default" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.015)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "11px 18px", fontWeight: 600, color: "#111111" }}>{u.name}</td>
                        <td style={{ padding: "11px 18px", color: "#555555" }}>{u.email}</td>
                        <td style={{ padding: "11px 18px" }}>
                          <span style={{
                            fontSize: "10px", fontWeight: 700,
                            padding: "2px 9px", borderRadius: "20px",
                            background: `${PLAN_COLORS[u.plan] ?? "#888888"}15`,
                            color: PLAN_COLORS[u.plan] ?? "#888888",
                            textTransform: "uppercase",
                            border: `1px solid ${PLAN_COLORS[u.plan] ?? "#888888"}25`,
                          }}>
                            {u.plan}
                          </span>
                        </td>
                        <td style={{ padding: "11px 18px" }}>
                          <span style={{
                            fontSize: "10px", fontWeight: 700,
                            padding: "2px 9px", borderRadius: "20px",
                            background: u.method === "Google" ? "rgba(59,130,246,0.08)" : "rgba(0,0,0,0.05)",
                            color: u.method === "Google" ? "#3b82f6" : "#555555",
                          }}>
                            {u.method}
                          </span>
                        </td>
                        <td style={{ padding: "11px 18px", color: "#888888", fontSize: "12px" }}>{u.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

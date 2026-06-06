"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Target, Search, Zap, Users, Brain, BarChart3,
  Sparkles, ChevronLeft, ChevronRight, LogOut, Crown,
  Home, MoreHorizontal, X, Bell, Settings, User, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/cn";
import MithraChat from "@/components/chatbot/MithraChat";
import { useUser, logout } from "@/lib/auth";
import { getLimits } from "@/lib/planLimits";
import { useUsageTracker } from "@/lib/useUsageTracker";
import { UsagePill } from "@/components/ui/UpgradeNudge";

const NAV_ITEMS = [
  { href: "/resume-builder", icon: FileText, label: "Resume Builder", color: "#8b5cf6", description: "Every line you write is a promise to your future self." },
  { href: "/resume-adaptor", icon: Target, label: "Resume Adaptor", color: "#06b6d4", description: "A single role, seen through a thousand lenses." },
  { href: "/job-finder", icon: Search, label: "Job Finder", color: "#10b981", description: "Somewhere in the noise, one job was written for you." },
  { href: "/job-application", icon: Zap, label: "Auto Apply", color: "#f59e0b", description: "While you sleep, Mithra knocks on doors." },
  { href: "/network", icon: Users, label: "Network", color: "#ec4899", description: "Your next colleague exists. You just haven't met yet." },
  { href: "/interview-prep", icon: Brain, label: "Interview Prep", color: "#f97316", description: "The question is asked once. The answer is prepared a thousand times." },
  { href: "/tracker", icon: BarChart3, label: "Tracker", color: "#6366f1", description: "Every application is a seed. This is your garden." },
];

// Mobile bottom nav: user-requested order (Resume → Adaptor → [Upgrade] → Jobs → More)
const BOTTOM_PRIMARY = [
  { href: "/resume-builder", icon: FileText, label: "Resume", color: "#8b5cf6" },
  { href: "/resume-adaptor", icon: Target, label: "Adaptor", color: "#06b6d4" },
  { href: "/job-finder", icon: Search, label: "Jobs", color: "#10b981" },
  { href: "/interview-prep", icon: Brain, label: "Interview", color: "#f97316" },
];

// "More" sheet — only overflow agent pages (no Home/Logout — those are in avatar dropdown)
const MORE_ITEMS = [
  { href: "/network", icon: Users, label: "Network", color: "#ec4899", emoji: "🤝" },
  { href: "/tracker", icon: BarChart3, label: "Tracker", color: "#6366f1", emoji: "📊" },
  { href: "/job-application", icon: Zap, label: "Auto Apply", color: "#f59e0b", emoji: "⚡", beta: true },
];

const PLAN_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  free: { bg: "rgba(100,116,139,0.15)", color: "#94a3b8", label: "Free" },
  pro: { bg: "rgba(124,58,237,0.15)", color: "#a78bfa", label: "Pro" },
  elite: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Elite" },
};

// One reusable bottom-nav tab
function BottomTab({ href, icon: Icon, label, color, active }: { href: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; color: string; active: boolean }) {
  return (
    <Link href={href}
      className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-1 relative"
      style={{ WebkitTapHighlightColor: "transparent", textDecoration: "none" }}>
      {active && (
        <motion.div layoutId="mob-tab-indicator"
          className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
          style={{ width: "20px", height: "2.5px", background: color, boxShadow: `0 0 8px ${color}` }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }} />
      )}
      <motion.div whileTap={{ scale: 0.82 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          width: "40px", height: "36px", borderRadius: "12px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: active ? `${color}18` : "transparent",
          transition: "background 0.2s",
        }}>
        <Icon className="w-[20px] h-[20px]" style={{ color: active ? color : "#4b5563", filter: active ? `drop-shadow(0 0 6px ${color}80)` : "none" }} />
      </motion.div>
      <span style={{ fontSize: "10px", fontWeight: active ? 700 : 500, color: active ? color : "#4b5563", lineHeight: 1, letterSpacing: "-0.2px" }}>
        {label}
      </span>
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  const currentPage = NAV_ITEMS.find((n) => pathname?.startsWith(n.href));
  const plan = (user?.plan ?? "free") as keyof typeof PLAN_COLORS;
  const planStyle = PLAN_COLORS[plan] ?? PLAN_COLORS.free;
  const userInitials = user?.name
    ? user.name.split(" ").map((p: string) => p[0]).join("").toUpperCase().slice(0, 2)
    : "M";

  const isUpgradeActive = pathname?.startsWith("/pricing");
  const isMoreActive = MORE_ITEMS.some((i) => pathname?.startsWith(i.href));
  const limits = getLimits(user?.plan ?? "free");
  const usage = useUsageTracker(user?.id ?? "guest");
  const showUsagePill = limits.resumeAdaptations !== -1 || limits.jobSearchesPerDay !== -1;

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0f0a1e" }}>

      {/* ═══════════════════════════════════════════════════════
          DESKTOP SIDEBAR
      ═══════════════════════════════════════════════════════ */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="relative hidden md:flex flex-col border-r shrink-0 overflow-hidden"
        style={{ borderColor: "rgba(124,58,237,0.15)", background: "rgba(26,16,51,0.95)" }}>

        <div className="h-16 flex items-center px-4 border-b shrink-0" style={{ borderColor: "rgba(124,58,237,0.1)" }}>
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shrink-0" style={{ boxShadow: "0 0 15px rgba(124,58,237,0.4)" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-lg font-black gradient-text truncate">
                  Mithra AI
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
                className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group relative", active ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5")}
                style={active ? { background: `${item.color}18`, boxShadow: `inset 0 0 0 1px ${item.color}30` } : {}}>
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full" style={{ background: item.color }} />}
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all", active ? "text-white" : "text-slate-400 group-hover:text-white")} style={active ? { background: `${item.color}25` } : {}}>
                  <item.icon className="w-4 h-4" style={active ? { color: item.color } : {}} />
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="min-w-0">
                      <div className={cn("text-sm font-semibold truncate", active ? "text-white" : "text-slate-300")} style={active ? { color: item.color } : {}}>{item.label}</div>
                      <div className="text-[11px] text-slate-500 truncate">{item.description}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}

          <Link href="/pricing" title={collapsed ? "Upgrade" : undefined}
            className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group relative", isUpgradeActive ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5")}
            style={isUpgradeActive ? { background: "rgba(245,158,11,0.18)", boxShadow: "inset 0 0 0 1px rgba(245,158,11,0.3)" } : {}}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" style={{ color: isUpgradeActive ? "#f59e0b" : undefined }} />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={isUpgradeActive ? { color: "#f59e0b" } : {}}>Upgrade</div>
                  <div className="text-[11px] text-slate-500 truncate">Invest in your story</div>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </nav>

        <div className="p-2 border-t space-y-1" style={{ borderColor: "rgba(124,58,237,0.1)" }}>
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <Home className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="text-sm">Back to Home</span>}
          </Link>
          {user && (
            <button onClick={() => logout()} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-500 hover:text-red-400 hover:bg-white/5 transition-all">
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-xs">Logout</span>}
            </button>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all">
            {collapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Desktop top bar */}
        <header className="hidden md:flex h-16 items-center justify-between px-6 border-b shrink-0" style={{ borderColor: "rgba(124,58,237,0.1)", background: "rgba(15,10,30,0.95)" }}>
          <div>
            <h1 className="text-base font-bold text-white">{currentPage?.label || "Dashboard"}</h1>
            <p className="text-xs text-slate-500">{currentPage?.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <Settings className="w-4 h-4" />
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", fontWeight: 700, background: planStyle.bg, color: planStyle.color, border: `1px solid ${planStyle.color}30`, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
                  {planStyle.label}
                </span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }} title={user.name}>
                  {userInitials}
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </header>

        {/* ── MOBILE TOP BAR ── */}
        <header className="md:hidden flex h-14 items-center justify-between px-4 border-b shrink-0"
          style={{ borderColor: "rgba(124,58,237,0.12)", background: "rgba(10,6,22,0.98)", zIndex: 30, backdropFilter: "blur(20px)" }}>

          {/* Left: Logo + page name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/" className="shrink-0">
              <div style={{ width: "28px", height: "28px", borderRadius: "9px", background: "linear-gradient(135deg,#7c3aed,#5b21b6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px rgba(124,58,237,0.5)" }}>
                <Sparkles style={{ width: "13px", height: "13px", color: "white" }} />
              </div>
            </Link>
            <div className="min-w-0">
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#f1f5f9", lineHeight: 1, letterSpacing: "-0.3px" }} className="truncate">
                {currentPage?.label || "Mithra AI"}
              </div>
            </div>
          </div>

          {/* Right: usage pill + Bell + Avatar (with dropdown) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Subtle usage indicator — only shows when ≥40% of free limit used */}
            {showUsagePill && (
              <UsagePill
                adaptationsUsed={usage.adaptationsUsed}
                searchesToday={usage.searchesToday}
              />
            )}
            <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              <Bell style={{ width: "16px", height: "16px" }} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400" />
            </button>

            {/* Avatar + dropdown */}
            <div ref={avatarRef} style={{ position: "relative" }}>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setAvatarOpen(!avatarOpen)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "4px 8px 4px 4px",
                  background: avatarOpen ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${avatarOpen ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "24px", cursor: "pointer",
                  transition: "all 0.2s",
                }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "white" }}>
                  {userInitials}
                </div>
                <motion.div animate={{ rotate: avatarOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown style={{ width: "13px", height: "13px", color: "#64748b" }} />
                </motion.div>
              </motion.button>

              {/* Dropdown menu */}
              <AnimatePresence>
                {avatarOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -8 }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    style={{
                      position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 100,
                      background: "rgba(14,8,30,0.98)",
                      border: "1px solid rgba(124,58,237,0.2)",
                      borderRadius: "16px",
                      padding: "8px",
                      minWidth: "200px",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                    }}>

                    {/* User info */}
                    {user && (
                      <div style={{ padding: "10px 12px 10px", marginBottom: "4px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9", marginBottom: "2px" }}>{user.name}</div>
                        <div style={{ fontSize: "11px", color: "#475569" }}>{user.email}</div>
                        <span style={{ display: "inline-block", marginTop: "6px", fontSize: "10px", padding: "2px 8px", borderRadius: "20px", fontWeight: 700, background: planStyle.bg, color: planStyle.color, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
                          {planStyle.label}
                        </span>
                      </div>
                    )}

                    <div style={{ height: "1px", background: "rgba(124,58,237,0.12)", margin: "4px 0" }} />

                    {/* Menu items */}
                    {[
                      { icon: Crown, label: "Upgrade Plan", href: "/pricing", color: "#f59e0b" },
                      { icon: Settings, label: "Settings", href: "#", color: "#94a3b8" },
                      { icon: Home, label: "Back to Home", href: "/", color: "#94a3b8" },
                    ].map(({ icon: Icon, label, href, color }) => (
                      <Link key={label} href={href} onClick={() => setAvatarOpen(false)}
                        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", textDecoration: "none", color: "#cbd5e1", fontSize: "13px", fontWeight: 500 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <Icon style={{ width: "15px", height: "15px", color, flexShrink: 0 }} />
                        {label}
                      </Link>
                    ))}

                    {user && (
                      <>
                        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "4px 0" }} />
                        <button onClick={() => { logout(); setAvatarOpen(false); }}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: "13px", fontWeight: 500, textAlign: "left" as const }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                          <LogOut style={{ width: "15px", height: "15px", flexShrink: 0 }} />
                          Logout
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto md:pb-0 pb-[68px]">
          {children}
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MOBILE BOTTOM NAV
      ═══════════════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: "rgba(7,4,16,0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(124,58,237,0.14)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}>
        <div style={{ display: "flex", alignItems: "stretch", height: "64px", padding: "0 2px" }}>

          {/* Left 2 tabs */}
          {BOTTOM_PRIMARY.slice(0, 2).map((item) => (
            <BottomTab key={item.href} {...item} active={!!pathname?.startsWith(item.href)} />
          ))}

          {/* Centre: Upgrade */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => router.push("/pricing")}
              style={{
                width: "50px", height: "46px", borderRadius: "16px",
                background: isUpgradeActive ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#f59e0b,#b45309)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: isUpgradeActive ? "0 0 0 2px rgba(245,158,11,0.3), 0 6px 20px rgba(245,158,11,0.5)" : "0 4px 16px rgba(245,158,11,0.4)",
                marginBottom: "2px", position: "relative",
              }}>
              <Crown style={{ width: "20px", height: "20px", color: "white" }} />
              {!isUpgradeActive && (
                <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }}
                  style={{ position: "absolute", inset: -5, borderRadius: "20px", border: "1.5px solid rgba(245,158,11,0.4)", pointerEvents: "none" }} />
              )}
            </motion.button>
            <span style={{ fontSize: "9px", fontWeight: 700, color: isUpgradeActive ? "#f59e0b" : "#78350f", lineHeight: 1 }}>Upgrade</span>
          </div>

          {/* Right 2 tabs */}
          {BOTTOM_PRIMARY.slice(2, 4).map((item) => (
            <BottomTab key={item.href} {...item} active={!!pathname?.startsWith(item.href)} />
          ))}

          {/* More */}
          <button onClick={() => setMoreOpen(true)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px", background: "none", border: "none", cursor: "pointer", padding: "4px 0", WebkitTapHighlightColor: "transparent" }}>
            {isMoreActive && <div style={{ position: "absolute", top: 0, width: "20px", height: "2.5px", borderRadius: "0 0 3px 3px", background: "#94a3b8" }} />}
            <motion.div whileTap={{ scale: 0.82 }} style={{ width: "40px", height: "36px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: isMoreActive ? "rgba(148,163,184,0.12)" : "transparent" }}>
              <MoreHorizontal style={{ width: "20px", height: "20px", color: isMoreActive ? "#94a3b8" : "#4b5563" }} />
            </motion.div>
            <span style={{ fontSize: "10px", fontWeight: isMoreActive ? 700 : 500, color: isMoreActive ? "#94a3b8" : "#4b5563", lineHeight: 1, letterSpacing: "-0.2px" }}>More</span>
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          MOBILE "MORE" SHEET — clean, only agent pages
      ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 md:hidden" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
              onClick={() => setMoreOpen(false)} />

            <motion.div key="sh"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="fixed left-0 right-0 bottom-0 z-50 md:hidden"
              style={{
                background: "rgba(10,5,22,0.99)",
                border: "1px solid rgba(124,58,237,0.18)", borderBottom: "none",
                borderRadius: "24px 24px 0 0",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}>

              {/* Drag handle */}
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
                <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "rgba(124,58,237,0.25)" }} />
              </div>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 16px" }}>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#f1f5f9" }}>More Tools</span>
                <button onClick={() => setMoreOpen(false)} style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer" }}>
                  <X style={{ width: "15px", height: "15px", color: "#64748b" }} />
                </button>
              </div>

              {/* Agent items — large touch-friendly grid */}
              <div style={{ padding: "0 16px 24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {MORE_ITEMS.map((item) => {
                  const active = pathname?.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} style={{ textDecoration: "none" }}>
                      <motion.div whileTap={{ scale: 0.93 }}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
                          padding: "20px 8px 16px",
                          borderRadius: "20px",
                          background: active ? `${item.color}15` : "rgba(255,255,255,0.04)",
                          border: `1px solid ${active ? item.color + "35" : "rgba(255,255,255,0.07)"}`,
                          position: "relative",
                        }}>
                        {item.beta && (
                          <span style={{ position: "absolute", top: "8px", right: "8px", fontSize: "8px", fontWeight: 700, padding: "1px 5px", borderRadius: "4px", background: "rgba(245,158,11,0.2)", color: "#f59e0b", letterSpacing: "0.3px" }}>BETA</span>
                        )}
                        <div style={{ width: "48px", height: "48px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", background: active ? `${item.color}20` : "rgba(255,255,255,0.07)", border: `1px solid ${active ? item.color + "30" : "rgba(255,255,255,0.08)"}` }}>
                          <item.icon style={{ width: "22px", height: "22px", color: active ? item.color : "#64748b" }} />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: active ? item.color : "#94a3b8", textAlign: "center", lineHeight: 1.2 }}>
                          {item.label}
                        </span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mithra Chatbot */}
      <MithraChat />
    </div>
  );
}

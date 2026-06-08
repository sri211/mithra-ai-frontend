"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Target, Search, Zap, Users, Brain, BarChart3,
  Sparkles, ChevronLeft, ChevronRight, LogOut, Crown,
  Home, MoreHorizontal, X, Bell, Settings, User, ChevronDown,
  Award, Gift, BarChart2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import MithraChat from "@/components/chatbot/MithraChat";
import { useUser, logout } from "@/lib/auth";
import { getLimits } from "@/lib/planLimits";
import { useUsageTracker } from "@/lib/useUsageTracker";
import { UsagePill } from "@/components/ui/UpgradeNudge";

const NAV_ITEMS = [
  { href: "/resume-builder", icon: FileText, label: "Resume Builder", color: "#8b5cf6", description: "Every line you write is a promise to your future self." },
  { href: "/resume-score",   icon: Award,    label: "Resume Score",   color: "#10b981", description: "See exactly where your resume wins and where it loses.", badge: "Free" },
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

// "More" sheet — overflow agent pages + key utilities
const MORE_ITEMS = [
  { href: "/resume-score",    icon: Award,    label: "Resume Score",  color: "#10b981", emoji: "🏆", badge: "Free" },
  { href: "/network",         icon: Users,    label: "Network",       color: "#ec4899", emoji: "🤝" },
  { href: "/tracker",         icon: BarChart3,label: "Tracker",       color: "#6366f1", emoji: "📊" },
  { href: "/referral",        icon: Gift,     label: "Refer & Earn",  color: "#10b981", emoji: "🎁" },
  { href: "/job-application", icon: Zap,      label: "Auto Apply",    color: "#f59e0b", emoji: "⚡", beta: true },
];

const PLAN_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  free: { bg: "rgba(100,116,139,0.15)", color: "#94a3b8", label: "Free" },
  pro: { bg: "rgba(124,58,237,0.15)", color: "#a78bfa", label: "Pro" },
  elite: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Elite" },
};

// One reusable bottom-nav tab
function BottomTab({ href, icon: Icon, label, color: _color, active }: { href: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; color: string; active: boolean }) {
  return (
    <Link href={href}
      className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-1 relative"
      style={{ WebkitTapHighlightColor: "transparent", textDecoration: "none" }}>
      {active && (
        <motion.div layoutId="mob-tab-indicator"
          className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
          style={{ width: "20px", height: "2px", background: "#7c3aed" }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }} />
      )}
      <motion.div whileTap={{ scale: 0.85 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          width: "40px", height: "34px", borderRadius: "10px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: active ? "rgba(124,58,237,0.1)" : "transparent",
          transition: "background 0.15s",
        }}>
        <Icon className="w-[19px] h-[19px]" style={{ color: active ? "#a78bfa" : "#3f3f46" }} />
      </motion.div>
      <span style={{ fontSize: "10px", fontWeight: active ? 600 : 500, color: active ? "#f4f4f5" : "#3f3f46", lineHeight: 1, letterSpacing: "-0.2px" }}>
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
    <div className="flex h-screen overflow-hidden" style={{ background: "#080810" }}>

      {/* ═══════════════════════════════════════════════════════
          DESKTOP SIDEBAR
      ═══════════════════════════════════════════════════════ */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="relative hidden md:flex flex-col border-r shrink-0 overflow-hidden"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0c0c18" }}>

        <div className="h-16 flex items-center px-4 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#7c3aed" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-base font-bold truncate" style={{ color: "#f4f4f5", letterSpacing: "-0.2px" }}>
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
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 group relative", active ? "" : "hover:bg-white/[0.04]")}
                style={active ? { background: "rgba(124,58,237,0.08)" } : {}}>
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: "#7c3aed" }} />}
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all")}>
                  <item.icon className="w-4 h-4" style={{ color: active ? "#a78bfa" : "#3f3f46" }} />
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-2" style={{ color: active ? "#f4f4f5" : "#71717a" }}>
                        {item.label}
                        {(item as { badge?: string }).badge && (
                          <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "4px", background: "rgba(16,185,129,0.12)", color: "#10b981", fontWeight: 700, letterSpacing: "0.3px" }}>
                            {(item as { badge?: string }).badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] truncate" style={{ color: "#3f3f46" }}>{item.description}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}

          <Link href="/pricing" title={collapsed ? "Upgrade" : undefined}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 group relative")}
            style={isUpgradeActive ? { background: "rgba(245,158,11,0.08)" } : { }}>
            {isUpgradeActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: "#f59e0b" }} />}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" style={{ color: isUpgradeActive ? "#f59e0b" : "#3f3f46" }} />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: isUpgradeActive ? "#f4f4f5" : "#71717a" }}>Upgrade</div>
                  <div className="text-[11px] truncate" style={{ color: "#3f3f46" }}>Unlock all agents</div>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </nav>

        <div className="p-2 border-t space-y-0.5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Link href="/referral" className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.04] transition-all">
            <Gift className="w-4 h-4 shrink-0" style={{ color: "#3f3f46" }} />
            {!collapsed && <span className="text-sm" style={{ color: "#71717a" }}>Refer &amp; Earn</span>}
          </Link>
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.04] transition-all">
            <Home className="w-4 h-4 shrink-0" style={{ color: "#3f3f46" }} />
            {!collapsed && <span className="text-sm" style={{ color: "#71717a" }}>Home</span>}
          </Link>
          {user && (
            <button onClick={() => logout()} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.04] transition-all">
              <LogOut className="w-4 h-4 shrink-0" style={{ color: "#3f3f46" }} />
              {!collapsed && <span className="text-xs" style={{ color: "#52525b" }}>Logout</span>}
            </button>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.04] transition-all">
            {collapsed ? <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#3f3f46" }} /> : <ChevronLeft className="w-4 h-4 shrink-0" style={{ color: "#3f3f46" }} />}
            {!collapsed && <span className="text-xs" style={{ color: "#52525b" }}>Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Desktop top bar */}
        <header className="hidden md:flex h-16 items-center justify-between px-6 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#080810" }}>
          <div>
            <h1 className="text-sm font-semibold" style={{ color: "#f4f4f5" }}>{currentPage?.label || "Dashboard"}</h1>
            <p className="text-xs" style={{ color: "#3f3f46" }}>{currentPage?.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/referral" title="Referrals & Rewards"
              className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.04] transition-all" style={{ color: "#3f3f46" }}>
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
            </Link>

            <Link href="/referral" title="Settings"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.04] transition-all" style={{ color: "#3f3f46" }}>
              <Settings className="w-4 h-4" />
            </Link>

            <div ref={avatarRef} style={{ position: "relative" }}>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setAvatarOpen(!avatarOpen)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "4px 10px 4px 4px",
                  background: avatarOpen ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "24px", cursor: "pointer",
                }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "white" }}>
                  {userInitials}
                </div>
                {user && (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: planStyle.color }}>
                    {planStyle.label}
                  </span>
                )}
                <motion.div animate={{ rotate: avatarOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown style={{ width: "13px", height: "13px", color: "#64748b" }} />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {avatarOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -8 }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    style={{
                      position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 100,
                      background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "12px", padding: "8px", minWidth: "220px",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                    }}>
                    {user && (
                      <div style={{ padding: "10px 12px 12px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#f4f4f5", marginBottom: "2px" }}>{user.name}</div>
                        <div style={{ fontSize: "11px", color: "#3f3f46" }}>{user.email}</div>
                        <span style={{ display: "inline-block", marginTop: "6px", fontSize: "10px", padding: "2px 8px", borderRadius: "20px", fontWeight: 700, background: planStyle.bg, color: planStyle.color, textTransform: "uppercase" as const }}>
                          {planStyle.label}
                        </span>
                      </div>
                    )}
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                    {[
                      { icon: Crown,    label: "Upgrade Plan",    href: "/pricing",  color: "#f59e0b" },
                      { icon: Gift,     label: "Refer & Earn",    href: "/referral", color: "#10b981" },
                      { icon: Award,    label: "Resume Score",    href: "/resume-score", color: "#8b5cf6" },
                      { icon: Home,     label: "Back to Home",    href: "/",         color: "#94a3b8" },
                    ].map(({ icon: Icon, label, href, color }) => (
                      <Link key={label} href={href} onClick={() => setAvatarOpen(false)}
                        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", textDecoration: "none", color: "#cbd5e1", fontSize: "13px", fontWeight: 500 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <Icon style={{ width: "15px", height: "15px", color, flexShrink: 0 }} />{label}
                      </Link>
                    ))}
                    {user && (
                      <>
                        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "4px 0" }} />
                        <button onClick={() => { logout(); setAvatarOpen(false); }}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: "13px", fontWeight: 500, textAlign: "left" as const }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                          <LogOut style={{ width: "15px", height: "15px", flexShrink: 0 }} />Logout
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ── MOBILE TOP BAR ── */}
        <header className="md:hidden flex h-14 items-center justify-between px-4 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "#080810", zIndex: 30 }}>

          {/* Left: Logo + page name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/" className="shrink-0">
              <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles style={{ width: "12px", height: "12px", color: "white" }} />
              </div>
            </Link>
            <div className="min-w-0">
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#f4f4f5", lineHeight: 1, letterSpacing: "-0.2px" }} className="truncate">
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
            <button className="relative w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "transparent", color: "#3f3f46" }}>
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
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "24px", cursor: "pointer",
                }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "white" }}>
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
                      background: "#0f0f1a",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "12px",
                      padding: "8px",
                      minWidth: "200px",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                    }}>

                    {user && (
                      <div style={{ padding: "10px 12px 10px", marginBottom: "4px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#f4f4f5", marginBottom: "2px" }}>{user.name}</div>
                        <div style={{ fontSize: "11px", color: "#3f3f46" }}>{user.email}</div>
                        <span style={{ display: "inline-block", marginTop: "6px", fontSize: "10px", padding: "2px 8px", borderRadius: "20px", fontWeight: 700, background: planStyle.bg, color: planStyle.color, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
                          {planStyle.label}
                        </span>
                      </div>
                    )}

                    <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />

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
          background: "rgba(8,8,16,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
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
                background: "#0c0c18",
                border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none",
                borderRadius: "20px 20px 0 0",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}>

              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
                <div style={{ width: "32px", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.1)" }} />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 16px" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#f4f4f5" }}>More Tools</span>
                <button onClick={() => setMoreOpen(false)} style={{ width: "30px", height: "30px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
                  <X style={{ width: "13px", height: "13px", color: "#52525b" }} />
                </button>
              </div>

              {/* Agent items — large touch-friendly grid */}
              <div style={{ padding: "0 16px 24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                {MORE_ITEMS.map((item) => {
                  const active = pathname?.startsWith(item.href);
                  const typedItem = item as typeof item & { badge?: string };
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} style={{ textDecoration: "none" }}>
                      <motion.div whileTap={{ scale: 0.93 }}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                          padding: "16px 6px 14px",
                          borderRadius: "14px",
                          background: active ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${active ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.06)"}`,
                          position: "relative",
                        }}>
                        {(item.beta || typedItem.badge) && (
                          <span style={{ position: "absolute", top: "7px", right: "7px", fontSize: "8px", fontWeight: 700, padding: "1px 4px", borderRadius: "4px", background: item.beta ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.12)", color: item.beta ? "#f59e0b" : "#10b981", letterSpacing: "0.3px" }}>
                            {item.beta ? "BETA" : typedItem.badge}
                          </span>
                        )}
                        <div style={{ width: "42px", height: "42px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <item.icon style={{ width: "19px", height: "19px", color: active ? "#a78bfa" : "#52525b" }} />
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: active ? "#f4f4f5" : "#71717a", textAlign: "center", lineHeight: 1.2 }}>
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

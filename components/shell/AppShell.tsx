"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Target, Search, Zap, Users, Brain, BarChart3,
  Sparkles, ChevronLeft, ChevronRight, LogOut, CreditCard,
  Home, MoreHorizontal, X, Crown, Bell, Settings, User,
} from "lucide-react";
import { cn } from "@/lib/cn";
import MithraChat from "@/components/chatbot/MithraChat";
import { useUser, logout } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/resume-builder", icon: FileText, label: "Resume Builder", color: "#8b5cf6", description: "Every line you write is a promise to your future self." },
  { href: "/resume-adaptor", icon: Target, label: "Resume Adaptor", color: "#06b6d4", description: "A single role, seen through a thousand lenses." },
  { href: "/job-finder", icon: Search, label: "Job Finder", color: "#10b981", description: "Somewhere in the noise, one job was written for you." },
  { href: "/job-application", icon: Zap, label: "Auto Apply", color: "#f59e0b", description: "While you sleep, Mithra knocks on doors." },
  { href: "/network", icon: Users, label: "Network", color: "#ec4899", description: "Your next colleague exists. You just haven't met yet." },
  { href: "/interview-prep", icon: Brain, label: "Interview Prep", color: "#f97316", description: "The question is asked once. The answer is prepared a thousand times." },
  { href: "/tracker", icon: BarChart3, label: "Tracker", color: "#6366f1", description: "Every application is a seed. This is your garden." },
];

// Bottom nav: 4 primary tabs + centre Upgrade + More
const BOTTOM_PRIMARY = [
  { href: "/resume-builder", icon: FileText, label: "Resume", color: "#8b5cf6" },
  { href: "/job-finder", icon: Search, label: "Jobs", color: "#10b981" },
  { href: "/network", icon: Users, label: "Network", color: "#ec4899" },
  { href: "/interview-prep", icon: Brain, label: "Interview", color: "#f97316" },
];

// Items shown inside the "More" bottom sheet
const MORE_ITEMS = [
  { href: "/resume-adaptor", icon: Target, label: "Resume Adaptor", color: "#06b6d4" },
  { href: "/job-application", icon: Zap, label: "Auto Apply", color: "#f59e0b" },
  { href: "/tracker", icon: BarChart3, label: "Tracker", color: "#6366f1" },
];

const PLAN_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  free: { bg: "rgba(100,116,139,0.2)", color: "#94a3b8", label: "Free" },
  pro: { bg: "rgba(124,58,237,0.2)", color: "#a78bfa", label: "Pro" },
  elite: { bg: "rgba(245,158,11,0.2)", color: "#f59e0b", label: "Elite" },
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { user } = useUser();

  const currentPage = NAV_ITEMS.find((n) => pathname?.startsWith(n.href));
  const plan = (user?.plan ?? "free") as keyof typeof PLAN_COLORS;
  const planStyle = PLAN_COLORS[plan] ?? PLAN_COLORS.free;
  const userInitials = user?.name
    ? user.name.split(" ").map((p: string) => p[0]).join("").toUpperCase().slice(0, 2)
    : "M";

  const isUpgradeActive = pathname?.startsWith("/pricing");
  const isMoreActive = MORE_ITEMS.some((i) => pathname?.startsWith(i.href));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0f0a1e" }}>

      {/* ═══════════════════════════════════════════════════════
          DESKTOP SIDEBAR  (hidden on mobile)
      ═══════════════════════════════════════════════════════ */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="relative hidden md:flex flex-col border-r shrink-0 overflow-hidden"
        style={{ borderColor: "rgba(124,58,237,0.15)", background: "rgba(26,16,51,0.95)" }}>

        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b shrink-0" style={{ borderColor: "rgba(124,58,237,0.1)" }}>
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shrink-0"
              style={{ boxShadow: "0 0 15px rgba(124,58,237,0.4)" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  className="text-lg font-black gradient-text truncate">
                  Mithra AI
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group relative",
                  active ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
                style={active ? { background: `${item.color}18`, boxShadow: `inset 0 0 0 1px ${item.color}30` } : {}}>

                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                    style={{ background: item.color }} />
                )}

                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                  active ? "text-white" : "text-slate-400 group-hover:text-white"
                )}
                  style={active ? { background: `${item.color}25` } : {}}>
                  <item.icon className="w-4 h-4" style={active ? { color: item.color } : {}} />
                </div>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                      className="min-w-0">
                      <div className={cn("text-sm font-semibold truncate", active ? "text-white" : "text-slate-300")}
                        style={active ? { color: item.color } : {}}>
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{item.description}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}

          {/* Upgrade (desktop) */}
          <Link href="/pricing"
            title={collapsed ? "Upgrade" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group relative",
              isUpgradeActive ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
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

        {/* Bottom */}
        <div className="p-2 border-t space-y-1" style={{ borderColor: "rgba(124,58,237,0.1)" }}>
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <Home className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="text-sm">Back to Home</span>}
          </Link>
          {user && (
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-500 hover:text-red-400 hover:bg-white/5 transition-all">
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-xs">Logout</span>}
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all">
            {collapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT COLUMN
      ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── DESKTOP TOP BAR ── */}
        <header className="hidden md:flex h-16 items-center justify-between px-6 border-b shrink-0"
          style={{ borderColor: "rgba(124,58,237,0.1)", background: "rgba(15,10,30,0.95)" }}>
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
                <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", fontWeight: 700, background: planStyle.bg, color: planStyle.color, border: `1px solid ${planStyle.color}30`, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {planStyle.label}
                </span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }} title={user.name}>
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
          style={{ borderColor: "rgba(124,58,237,0.1)", background: "rgba(15,10,30,0.97)", zIndex: 30 }}>
          {/* Logo + page */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/" className="shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center"
                style={{ boxShadow: "0 0 10px rgba(124,58,237,0.5)" }}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            </Link>
            <div className="min-w-0">
              <div className="text-sm font-black text-white leading-none truncate">
                {currentPage?.label || "Mithra AI"}
              </div>
              {currentPage && (
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {currentPage.description.length > 36 ? currentPage.description.slice(0, 36) + "…" : currentPage.description}
                </div>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Plan badge */}
            {user && (
              <Link href="/pricing">
                <span style={{
                  fontSize: "10px", padding: "2px 8px", borderRadius: "20px", fontWeight: 700,
                  background: planStyle.bg, color: planStyle.color, border: `1px solid ${planStyle.color}30`,
                  textTransform: "uppercase", letterSpacing: "0.5px",
                }}>
                  {planStyle.label}
                </span>
              </Link>
            )}
            {/* Bell */}
            <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
            </button>
            {/* Avatar */}
            {user ? (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                {userInitials}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </header>

        {/* Page content — extra bottom padding on mobile for nav bar */}
        <main className="flex-1 overflow-y-auto md:pb-0 pb-[72px]">
          {children}
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION BAR
      ═══════════════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: "rgba(10,6,22,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(124,58,237,0.18)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}>
        <div className="flex items-end justify-around h-16 px-1">

          {/* Left 2 primary tabs */}
          {BOTTOM_PRIMARY.slice(0, 2).map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full pt-1 relative"
                style={{ WebkitTapHighlightColor: "transparent" }}>
                {active && (
                  <motion.div layoutId="tab-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                    style={{ width: "24px", height: "2px", background: item.color }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                )}
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
                  style={active ? { background: `${item.color}20` } : {}}>
                  <item.icon className="w-[18px] h-[18px]" style={{ color: active ? item.color : "#64748b" }} />
                </motion.div>
                <span className="text-[10px] font-semibold"
                  style={{ color: active ? item.color : "#475569", lineHeight: 1 }}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* ── CENTRE UPGRADE BUTTON ── */}
          <div className="flex flex-col items-center justify-center flex-1 h-full relative" style={{ WebkitTapHighlightColor: "transparent" }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/pricing")}
              style={{
                width: "52px", height: "52px",
                borderRadius: "18px",
                background: isUpgradeActive
                  ? "linear-gradient(135deg,#f59e0b,#d97706)"
                  : "linear-gradient(135deg,#f59e0b,#b45309)",
                border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                boxShadow: isUpgradeActive
                  ? "0 0 0 3px rgba(245,158,11,0.35), 0 8px 24px rgba(245,158,11,0.5)"
                  : "0 6px 20px rgba(245,158,11,0.4)",
                marginBottom: "4px",
                position: "relative",
              }}>
              <Crown className="w-5 h-5 text-white" />
              {/* glow ring animation */}
              {!isUpgradeActive && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: "absolute", inset: -4,
                    borderRadius: "22px",
                    border: "2px solid rgba(245,158,11,0.5)",
                    pointerEvents: "none",
                  }} />
              )}
            </motion.button>
            <span className="text-[10px] font-bold mt-0.5"
              style={{ color: isUpgradeActive ? "#f59e0b" : "#92400e", lineHeight: 1 }}>
              Upgrade
            </span>
          </div>

          {/* Right 2 primary tabs */}
          {BOTTOM_PRIMARY.slice(2, 4).map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full pt-1 relative"
                style={{ WebkitTapHighlightColor: "transparent" }}>
                {active && (
                  <motion.div layoutId="tab-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                    style={{ width: "24px", height: "2px", background: item.color }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                )}
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
                  style={active ? { background: `${item.color}20` } : {}}>
                  <item.icon className="w-[18px] h-[18px]" style={{ color: active ? item.color : "#64748b" }} />
                </motion.div>
                <span className="text-[10px] font-semibold"
                  style={{ color: active ? item.color : "#475569", lineHeight: 1 }}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full pt-1 relative"
            style={{ WebkitTapHighlightColor: "transparent", background: "none", border: "none", cursor: "pointer" }}>
            {isMoreActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                style={{ width: "24px", height: "2px", background: "#94a3b8" }} />
            )}
            <motion.div whileTap={{ scale: 0.85 }}
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={isMoreActive ? { background: "rgba(148,163,184,0.15)" } : {}}>
              <MoreHorizontal className="w-[18px] h-[18px]" style={{ color: isMoreActive ? "#94a3b8" : "#64748b" }} />
            </motion.div>
            <span className="text-[10px] font-semibold" style={{ color: isMoreActive ? "#94a3b8" : "#475569", lineHeight: 1 }}>More</span>
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          MOBILE "MORE" BOTTOM SHEET
      ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 md:hidden"
              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
              onClick={() => setMoreOpen(false)} />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 right-0 bottom-0 z-50 md:hidden rounded-t-3xl overflow-hidden"
              style={{
                background: "rgba(15,9,28,0.98)",
                border: "1px solid rgba(124,58,237,0.2)",
                borderBottom: "none",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}>

              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: "rgba(124,58,237,0.3)" }} />
              </div>

              {/* Sheet header */}
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-base font-black text-white">More</span>
                <button onClick={() => setMoreOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* More items grid */}
              <div className="px-4 pb-2 grid grid-cols-3 gap-3">
                {MORE_ITEMS.map((item) => {
                  const active = pathname?.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}>
                      <motion.div
                        whileTap={{ scale: 0.94 }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
                        style={{
                          background: active ? `${item.color}18` : "rgba(255,255,255,0.04)",
                          border: `1px solid ${active ? item.color + "40" : "rgba(255,255,255,0.07)"}`,
                        }}>
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                          style={{ background: active ? `${item.color}22` : "rgba(255,255,255,0.06)" }}>
                          <item.icon className="w-5 h-5" style={{ color: active ? item.color : "#64748b" }} />
                        </div>
                        <span className="text-[11px] font-semibold text-center leading-tight"
                          style={{ color: active ? item.color : "#94a3b8" }}>
                          {item.label}
                        </span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="mx-4 my-3" style={{ height: "1px", background: "rgba(124,58,237,0.12)" }} />

              {/* Bottom actions */}
              <div className="px-4 pb-4 flex gap-3">
                <Link href="/" onClick={() => setMoreOpen(false)} className="flex-1">
                  <motion.div whileTap={{ scale: 0.96 }}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Home className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-400">Home</span>
                  </motion.div>
                </Link>
                {user && (
                  <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => { logout(); setMoreOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">Logout</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MITHRA CHATBOT ── */}
      <MithraChat />
    </div>
  );
}

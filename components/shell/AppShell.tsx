"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Target, Search, Zap, Users, Brain, BarChart3,
  MessageSquare, Sparkles, Menu, X, ChevronLeft, ChevronRight,
  Bell, Settings, User, Home, LogOut, CreditCard,
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

const PLAN_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  free: { bg: "rgba(100,116,139,0.2)", color: "#94a3b8", label: "Free" },
  pro: { bg: "rgba(124,58,237,0.2)", color: "#a78bfa", label: "Pro" },
  elite: { bg: "rgba(245,158,11,0.2)", color: "#f59e0b", label: "Elite" },
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();

  const currentPage = NAV_ITEMS.find((n) => pathname?.startsWith(n.href));
  const plan = (user?.plan ?? "free") as keyof typeof PLAN_COLORS;
  const planStyle = PLAN_COLORS[plan] ?? PLAN_COLORS.free;
  const userInitials = user?.name
    ? user.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : "M";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0f0a1e" }}>
      {/* ── SIDEBAR ── */}
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

          {/* Pricing */}
          <Link href="/pricing"
            title={collapsed ? "Pricing" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group relative",
              pathname?.startsWith("/pricing") ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
            style={pathname?.startsWith("/pricing") ? { background: "rgba(245,158,11,0.18)", boxShadow: "inset 0 0 0 1px rgba(245,158,11,0.3)" } : {}}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" style={{ color: pathname?.startsWith("/pricing") ? "#f59e0b" : undefined }} />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={pathname?.startsWith("/pricing") ? { color: "#f59e0b" } : {}}>Pricing</div>
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

      {/* ── MOBILE SIDEBAR ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 md:hidden flex flex-col border-r"
              style={{ background: "rgba(26,16,51,0.98)", borderColor: "rgba(124,58,237,0.15)" }}>
              <div className="h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: "rgba(124,58,237,0.1)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-black gradient-text">Mithra AI</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const active = pathname?.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
                      style={active ? { background: `${item.color}18`, color: item.color } : { color: "#94a3b8" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={active ? { background: `${item.color}25` } : {}}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{item.label}</div>
                        <div className="text-[11px] text-slate-500">{item.description}</div>
                      </div>
                    </Link>
                  );
                })}
              </nav>
              {user && (
                <div className="p-2 border-t" style={{ borderColor: "rgba(124,58,237,0.1)" }}>
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all">
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b shrink-0"
          style={{ borderColor: "rgba(124,58,237,0.1)", background: "rgba(15,10,30,0.95)" }}>
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white">{currentPage?.label || "Dashboard"}</h1>
              <p className="text-xs text-slate-500">{currentPage?.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gold-400" />
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <Settings className="w-4 h-4" />
            </button>

            {/* User avatar + plan badge */}
            {user ? (
              <div className="flex items-center gap-2">
                <span
                  style={{
                    fontSize: "11px",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontWeight: 700,
                    background: planStyle.bg,
                    color: planStyle.color,
                    border: `1px solid ${planStyle.color}30`,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {planStyle.label}
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}
                  title={user.name}
                >
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

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── MITHRA CHATBOT ── */}
      <MithraChat />
    </div>
  );
}

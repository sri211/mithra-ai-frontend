"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    // Only redirect after Zustand has finished loading from localStorage.
    // Without this guard, AuthGuard would redirect to /login on every page
    // load before the stored session is available.
    if (hasHydrated && !user) {
      router.replace("/login");
    }
  }, [hasHydrated, user, router]);

  // Show spinner while localStorage is being read
  if (!hasHydrated) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#0f0a1e" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Hydrated but no user — redirect already in flight, render nothing
  if (!user) return null;

  return <>{children}</>;
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Wait for Zustand to rehydrate from localStorage (one tick)
    setChecked(true);
    if (!user) router.replace("/login");
  }, [user, router]);

  if (!checked || !user) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#0f0a1e" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}

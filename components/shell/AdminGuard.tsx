"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";

// Feature access restricted to the owner/admin accounts (Auto Apply, Tracker).
// Non-admins are redirected to the dashboard. Frontend gate mirrored by the
// nav (items hidden) — backend still owns the hard enforcement.
const ADMIN_EMAILS = ["srinathreddy.ksr@gmail.com", "sri@mithraai.in"];

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const router = useRouter();
  const isAdmin = ADMIN_EMAILS.includes(user?.email ?? "");

  useEffect(() => {
    // Wait until the user object is available; redirect only once we know they're not admin.
    if (user && !isAdmin) router.replace("/dashboard");
  }, [user, isAdmin, router]);

  if (!user || !isAdmin) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "14px" }}>
        {user ? "Redirecting…" : "Loading…"}
      </div>
    );
  }
  return <>{children}</>;
}

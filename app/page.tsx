"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import LandingPage from "@/components/landing/LandingPage";

export default function RootPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (hasHydrated && user) router.replace("/resume-builder");
  }, [hasHydrated, user, router]);

  // Wait for hydration — avoid flash of landing page for logged-in users
  if (!hasHydrated) return null;
  if (user) return null;
  return <LandingPage />;
}

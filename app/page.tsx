"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import LandingPage from "@/components/landing/LandingPage";

export default function RootPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) router.replace("/resume-builder");
  }, [user, router]);

  if (user) return null;
  return <LandingPage />;
}

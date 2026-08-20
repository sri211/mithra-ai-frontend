"use client";
// Custom auth helpers — uses authStore instead of NextAuth
import { useAuthStore, getAuthHeaders as getHeaders } from "@/lib/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export interface MithraUser {
  id: string; name: string; email: string; plan: "free" | "pro" | "elite";
}

export function useUser() {
  const { user, accessToken } = useAuthStore();
  return {
    user: user as MithraUser | null,
    accessToken: accessToken ?? "",
    isLoading: false,
    isAuthenticated: !!user,
  };
}

export function useRequireAuth() {
  const { user } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);
  return { user, isLoading: false };
}

export async function logout() {
  // Detach PostHog analytics from this user so the next person on this device
  // starts a fresh anonymous session (no-op if PostHog isn't configured).
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY && typeof window !== "undefined") {
    try {
      const { default: posthog } = await import("posthog-js");
      if (posthog.__loaded) posthog.reset();
    } catch { /* analytics is non-critical */ }
  }
  // authStore.logout() handles cookie removal and redirect
  useAuthStore.getState().logout();
}

export function getAuthHeaders(accessToken?: string): Record<string, string> {
  if (accessToken) return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  return getHeaders();
}

export { useAuthStore };

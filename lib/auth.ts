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
  useAuthStore.getState().logout();
  document.cookie = "mithra-token=; path=/; max-age=0";
  window.location.href = "/login";
}

export function getAuthHeaders(accessToken?: string): Record<string, string> {
  if (accessToken) return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  return getHeaders();
}

export { useAuthStore };

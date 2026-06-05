"use client";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { auth } from "@/auth";
import { api } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MithraUser {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro" | "elite";
}

export interface MithraSession {
  user: MithraUser;
  accessToken: string;
  refreshToken: string;
}

// ── Client-side hook ──────────────────────────────────────────────────────────

export function useUser() {
  const { data: session, status } = useSession();

  const user: MithraUser | null = session?.user
    ? {
        id: (session.user as Record<string, unknown>).id as string ?? "",
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        plan: ((session.user as Record<string, unknown>).plan as "free" | "pro" | "elite") ?? "free",
      }
    : null;

  const accessToken: string = (session as Record<string, unknown> | null)?.accessToken as string ?? "";

  return {
    user,
    accessToken,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}

// ── Require auth hook (client) ────────────────────────────────────────────────

export function useRequireAuth() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  return { user, isLoading };
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logout() {
  await nextAuthSignOut({ callbackUrl: "/" });
}

// ── Auth header helper ────────────────────────────────────────────────────────

export function getAuthHeaders(accessToken: string): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

// ── Server-side session helper ────────────────────────────────────────────────
// Usage: const session = await getSession() inside server components / route handlers

export { auth as getSession };

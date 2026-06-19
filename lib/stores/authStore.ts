"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { API_BASE } from "@/lib/api/client";

function clearGuestData() {
  if (typeof window === "undefined") return;
  ["mithra-resume-guest", "mithra-chat-guest", "mithra-selected-job-guest", "mithra-user-profile-guest"].forEach(
    (k) => localStorage.removeItem(k)
  );
}

async function loadUserCloudData(token: string) {
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const base = API_BASE;

    const [{ useResumeStore }, { useChatStore }] = await Promise.all([
      import("@/lib/stores/resumeStore"),
      import("@/lib/stores/chatStore"),
    ]);
    useResumeStore.getState().resetToDefault();
    useChatStore.getState().clearMessages();

    const resRes = await fetch(`${base}/user/resumes`, { headers });
    if (resRes.ok) {
      const data = await resRes.json();
      const resumes = Array.isArray(data) ? data : data?.resumes;
      if (resumes?.length > 0) {
        useResumeStore.getState().setResume(resumes[0].resume_json);
      }
    }
  } catch {
    // Non-critical
  }
}

// Parse JWT expiry without a library — just base64 decode the payload
function getTokenExpiry(token: string): number | null {
  try {
    const [, b64] = token.split(".");
    const payload = JSON.parse(atob(b64.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpiredOrExpiringSoon(token: string, thresholdMs = 2 * 24 * 60 * 60 * 1000): boolean {
  const exp = getTokenExpiry(token);
  if (!exp) return true;
  return Date.now() > exp - thresholdMs;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro" | "elite";
}

interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  loginWithGoogleAccessToken: (accessToken: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  refreshAccessToken: () => Promise<string | null>;
  logout: () => void;
  clearError: () => void;
}

function setAuthCookie(days: number) {
  if (typeof document === "undefined") return;
  document.cookie = `mithra-token=1; path=/; max-age=${days * 86400}; SameSite=Lax`;
}

function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "mithra-token=; path=/; max-age=0";
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            set({ error: e.detail || "Invalid email or password", isLoading: false });
            return false;
          }
          const data = await res.json();
          clearGuestData();
          set({
            user: data.user,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isLoading: false,
            error: null,
          });
          setAuthCookie(90);
          await loadUserCloudData(data.access_token);
          return true;
        } catch {
          set({ error: "Connection failed. Please try again.", isLoading: false });
          return false;
        }
      },

      loginWithGoogle: async (idToken) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API_BASE}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: idToken }),
          });
          if (!res.ok) {
            set({ error: "Google sign-in failed", isLoading: false });
            return false;
          }
          const data = await res.json();
          clearGuestData();
          set({
            user: data.user,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isLoading: false,
            error: null,
          });
          setAuthCookie(90);
          await loadUserCloudData(data.access_token);
          return true;
        } catch {
          set({ error: "Google sign-in failed", isLoading: false });
          return false;
        }
      },

      loginWithGoogleAccessToken: async (accessToken) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API_BASE}/auth/google-access-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: accessToken }),
          });
          if (!res.ok) {
            set({ error: "Google sign-in failed", isLoading: false });
            return false;
          }
          const data = await res.json();
          clearGuestData();
          set({
            user: data.user,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isLoading: false,
            error: null,
          });
          setAuthCookie(90);
          await loadUserCloudData(data.access_token);
          return true;
        } catch {
          set({ error: "Google sign-in failed", isLoading: false });
          return false;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });
          if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            set({ error: e.detail || "Registration failed", isLoading: false });
            return false;
          }
          const data = await res.json();
          clearGuestData();
          set({
            user: data.user,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isLoading: false,
            error: null,
          });
          setAuthCookie(90);
          await loadUserCloudData(data.access_token);
          return true;
        } catch {
          set({ error: "Registration failed. Please try again.", isLoading: false });
          return false;
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return null;
        }
        try {
          const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          if (!res.ok) {
            // Refresh token expired or invalid — force logout
            get().logout();
            return null;
          }
          const data = await res.json();
          set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: data.user,
          });
          // Renew the cookie so browser doesn't expire it
          setAuthCookie(90);
          return data.access_token as string;
        } catch {
          return null;
        }
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, error: null });
        clearAuthCookie();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "mithra-auth",
      storage: createJSONStorage(() => localStorage),
      // Persist all three: user, accessToken, AND refreshToken
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Proactively refresh if access token is expired or expiring within 2 days
        if (state?.accessToken && state?.refreshToken) {
          if (isTokenExpiredOrExpiringSoon(state.accessToken)) {
            state.refreshAccessToken();
          }
        }
      },
    }
  )
);

export function getAuthHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem("mithra-auth");
    if (!raw) return {};
    const token = JSON.parse(raw)?.state?.accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

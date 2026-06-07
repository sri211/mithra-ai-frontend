"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { API_BASE } from "@/lib/api/client";

// Remove localStorage keys that were written while the user was a "guest"
function clearGuestData() {
  if (typeof window === "undefined") return;
  ["mithra-resume-guest", "mithra-chat-guest", "mithra-selected-job-guest", "mithra-user-profile-guest"].forEach(
    (k) => localStorage.removeItem(k)
  );
}

// After a successful login/register, fetch and hydrate cloud data into the stores
async function loadUserCloudData(token: string) {
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const base = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "production" ? "https://api.mithraai.in/api" : "http://localhost:8000/api");

    // Reset stores to clean state before loading this user's data
    const [{ useResumeStore }, { useChatStore }] = await Promise.all([
      import("@/lib/stores/resumeStore"),
      import("@/lib/stores/chatStore"),
    ]);
    useResumeStore.getState().resetToDefault();
    useChatStore.getState().clearMessages();

    // Load most recent resume from cloud
    const resRes = await fetch(`${base}/user/resumes`, { headers });
    if (resRes.ok) {
      const data = await resRes.json();
      const resumes = Array.isArray(data) ? data : data?.resumes;
      if (resumes?.length > 0) {
        useResumeStore.getState().setResume(resumes[0].resume_json);
      }
    }
  } catch {
    // Non-critical — swallow silently
  }
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
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
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
          set({ user: data.user, accessToken: data.access_token, isLoading: false, error: null });
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
          set({ user: data.user, accessToken: data.access_token, isLoading: false, error: null });
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
          set({ user: data.user, accessToken: data.access_token, isLoading: false, error: null });
          await loadUserCloudData(data.access_token);
          return true;
        } catch {
          set({ error: "Registration failed. Please try again.", isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({ user: null, accessToken: null, error: null });
        if (typeof document !== "undefined") {
          document.cookie = "mithra-token=; path=/; max-age=0";
        }
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: "mithra-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
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

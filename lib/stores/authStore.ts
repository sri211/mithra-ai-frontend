"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { API_BASE } from "@/lib/api/client";

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
          set({ user: data.user, accessToken: data.access_token, isLoading: false, error: null });
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
          set({ user: data.user, accessToken: data.access_token, isLoading: false, error: null });
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
          set({ user: data.user, accessToken: data.access_token, isLoading: false, error: null });
          return true;
        } catch {
          set({ error: "Registration failed. Please try again.", isLoading: false });
          return false;
        }
      },

      logout: () => set({ user: null, accessToken: null, error: null }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "mithra-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
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

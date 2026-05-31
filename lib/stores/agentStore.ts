"use client";
import { create } from "zustand";

export type AgentAction =
  | { type: "navigate"; tab: string }
  | { type: "build_resume"; data?: object }
  | { type: "adapt_resume"; jd: string }
  | { type: "search_jobs"; query: string; location?: string }
  | { type: "set_field"; field: string; value: string }
  | { type: "show_toast"; message: string; toastType: "success" | "info" | "error" };

interface AgentStore {
  pendingAction: AgentAction | null;
  lastAction: AgentAction | null;
  toast: { message: string; type: string } | null;
  dispatchAction: (action: AgentAction) => void;
  clearAction: () => void;
  showToast: (msg: string, type: string) => void;
  clearToast: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  pendingAction: null,
  lastAction: null,
  toast: null,
  dispatchAction: (action) =>
    set({ pendingAction: action, lastAction: action }),
  clearAction: () => set({ pendingAction: null }),
  showToast: (message, type) => set({ toast: { message, type } }),
  clearToast: () => set({ toast: null }),
}));

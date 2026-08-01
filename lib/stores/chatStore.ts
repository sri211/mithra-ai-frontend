"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ChatMessage } from "@/lib/types";
import { nanoid } from "../nanoid";
import { userStorage } from "@/lib/stores/userStorage";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm **Mithra**, your AI career companion. What story shall we tell today?",
  timestamp: new Date(0),
};

interface ChatStore {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  appendToLast: (text: string) => void;
  setLastMeta: (meta: Partial<ChatMessage>) => void;
  setMessageFeedback: (id: string, fb: "up" | "down") => void;
  setOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [WELCOME_MESSAGE],
      isOpen: false,
      isLoading: false,
      addMessage: (msg) =>
        set((s) => ({
          messages: [...s.messages, { ...msg, id: nanoid(), timestamp: new Date() }],
        })),
      appendToLast: (text) =>
        set((s) => {
          const msgs = [...s.messages];
          if (msgs.length > 0 && msgs[msgs.length - 1].role === "assistant") {
            msgs[msgs.length - 1] = {
              ...msgs[msgs.length - 1],
              content: msgs[msgs.length - 1].content + text,
            };
          }
          return { messages: msgs };
        }),
      setLastMeta: (meta) =>
        set((s) => {
          const msgs = [...s.messages];
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === "assistant") { msgs[i] = { ...msgs[i], ...meta }; break; }
          }
          return { messages: msgs };
        }),
      setMessageFeedback: (id, fb) =>
        set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, feedback: fb } : m)) })),
      setOpen: (isOpen) => set({ isOpen }),
      setLoading: (isLoading) => set({ isLoading }),
      clear: () =>
        set({
          messages: [
            {
              id: "welcome",
              role: "assistant",
              content: "Hi! I'm **Mithra**, your AI career companion. What story shall we tell today?",
              timestamp: new Date(0),
            },
          ],
        }),
      clearMessages: () =>
        set({
          messages: [
            {
              id: "welcome",
              role: "assistant",
              content: "Hi! I'm **Mithra**, your AI career companion. What story shall we tell today?",
              timestamp: new Date(0),
            },
          ],
        }),
    }),
    {
      name: "mithra-chat",
      storage: createJSONStorage(() => userStorage),
      partialize: (state) => ({ messages: state.messages }),
      // Rehydrate timestamps as Date objects (JSON serializes them as strings)
      onRehydrateStorage: () => (state) => {
        if (state?.messages) {
          state.messages = state.messages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
        }
      },
    }
  )
);

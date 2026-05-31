"use client";
import { create } from "zustand";
import { ChatMessage } from "@/lib/types";
import { nanoid } from "../nanoid";

interface ChatStore {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  appendToLast: (text: string) => void;
  setOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm **Mithra**, your AI career companion. I can help you build your resume, find jobs, prep for interviews, and more. What would you like to do today?",
      timestamp: new Date(0),
    },
  ],
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
  setOpen: (isOpen) => set({ isOpen }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () =>
    set({
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content: "Hi! I'm **Mithra**, your AI career companion. How can I help you today?",
          timestamp: new Date(0),
        },
      ],
    }),
}));

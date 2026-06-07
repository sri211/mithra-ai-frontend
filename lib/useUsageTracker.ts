"use client";
import { useState, useEffect, useCallback } from "react";

function todayKey()  { return new Date().toISOString().slice(0, 10); }
function monthKey()  { return new Date().toISOString().slice(0, 7); }

function read(key: string): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(key) ?? "0", 10);
}
function write(key: string, val: number) {
  if (typeof window !== "undefined") localStorage.setItem(key, String(val));
}

export interface UsageTracker {
  // Adaptations (monthly)
  adaptationsUsed: number;
  incrementAdaptations: () => number;
  resetAdaptations: () => void;

  // Job searches (daily)
  searchesToday: number;
  incrementSearches: () => number;

  // Chat messages (daily)
  chatMessagesToday: number;
  incrementChatMessages: () => number;

  // PDF downloads (monthly)
  pdfDownloadsUsed: number;
  incrementPdfDownloads: () => number;

  // Resume regenerations (monthly)
  regenerationsUsed: number;
  incrementRegenerations: () => number;
}

export function useUsageTracker(userId: string): UsageTracker {
  const adaptKey  = `mithra-adapt-count-${userId}-${monthKey()}`;
  const searchKey = `mithra-search-count-${userId}-${todayKey()}`;
  const chatKey   = `mithra-chat-count-${userId}-${todayKey()}`;
  const pdfKey    = `mithra-pdf-count-${userId}-${monthKey()}`;
  const regenKey  = `mithra-regen-count-${userId}-${monthKey()}`;

  const [adaptationsUsed,    setAdaptationsUsed]    = useState(0);
  const [searchesToday,      setSearchesToday]       = useState(0);
  const [chatMessagesToday,  setChatMessagesToday]   = useState(0);
  const [pdfDownloadsUsed,   setPdfDownloadsUsed]   = useState(0);
  const [regenerationsUsed,  setRegenerationsUsed]  = useState(0);

  useEffect(() => {
    setAdaptationsUsed(read(adaptKey));
    setSearchesToday(read(searchKey));
    setChatMessagesToday(read(chatKey));
    setPdfDownloadsUsed(read(pdfKey));
    setRegenerationsUsed(read(regenKey));
  }, [adaptKey, searchKey, chatKey, pdfKey, regenKey]);

  const incrementAdaptations = useCallback(() => {
    const next = read(adaptKey) + 1;
    write(adaptKey, next); setAdaptationsUsed(next); return next;
  }, [adaptKey]);

  const resetAdaptations = useCallback(() => {
    write(adaptKey, 0); setAdaptationsUsed(0);
  }, [adaptKey]);

  const incrementSearches = useCallback(() => {
    const next = read(searchKey) + 1;
    write(searchKey, next); setSearchesToday(next); return next;
  }, [searchKey]);

  const incrementChatMessages = useCallback(() => {
    const next = read(chatKey) + 1;
    write(chatKey, next); setChatMessagesToday(next); return next;
  }, [chatKey]);

  const incrementPdfDownloads = useCallback(() => {
    const next = read(pdfKey) + 1;
    write(pdfKey, next); setPdfDownloadsUsed(next); return next;
  }, [pdfKey]);

  const incrementRegenerations = useCallback(() => {
    const next = read(regenKey) + 1;
    write(regenKey, next); setRegenerationsUsed(next); return next;
  }, [regenKey]);

  return {
    adaptationsUsed, incrementAdaptations, resetAdaptations,
    searchesToday, incrementSearches,
    chatMessagesToday, incrementChatMessages,
    pdfDownloadsUsed, incrementPdfDownloads,
    regenerationsUsed, incrementRegenerations,
  };
}

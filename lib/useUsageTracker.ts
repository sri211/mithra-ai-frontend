"use client";
import { useState, useEffect, useCallback } from "react";

// ── Key helpers ──────────────────────────────────────────────────────────────
function todayKey()   { return new Date().toISOString().slice(0, 10); }
function monthKey()   { return new Date().toISOString().slice(0, 7); }

function read(key: string): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(key) ?? "0", 10);
}
function write(key: string, val: number) {
  if (typeof window !== "undefined") localStorage.setItem(key, String(val));
}

// ── Hook ─────────────────────────────────────────────────────────────────────
interface UsageTracker {
  adaptationsUsed: number;
  searchesToday: number;
  incrementAdaptations: () => number;   // returns new count
  incrementSearches: () => number;
  resetAdaptations: () => void;
}

export function useUsageTracker(userId: string): UsageTracker {
  const adaptKey  = `mithra-adapt-count-${userId}-${monthKey()}`;
  const searchKey = `mithra-search-count-${userId}-${todayKey()}`;

  const [adaptationsUsed, setAdaptationsUsed] = useState(0);
  const [searchesToday, setSearchesToday]     = useState(0);

  useEffect(() => {
    setAdaptationsUsed(read(adaptKey));
    setSearchesToday(read(searchKey));
  }, [adaptKey, searchKey]);

  const incrementAdaptations = useCallback(() => {
    const next = read(adaptKey) + 1;
    write(adaptKey, next);
    setAdaptationsUsed(next);
    return next;
  }, [adaptKey]);

  const incrementSearches = useCallback(() => {
    const next = read(searchKey) + 1;
    write(searchKey, next);
    setSearchesToday(next);
    return next;
  }, [searchKey]);

  const resetAdaptations = useCallback(() => {
    write(adaptKey, 0);
    setAdaptationsUsed(0);
  }, [adaptKey]);

  return { adaptationsUsed, searchesToday, incrementAdaptations, incrementSearches, resetAdaptations };
}

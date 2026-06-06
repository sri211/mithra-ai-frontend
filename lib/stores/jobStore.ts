"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Job } from "@/lib/types";
import { api } from "@/lib/api/client";
import { userStorage } from "@/lib/stores/userStorage";

interface SavedSearch {
  id: string;
  query: string;
  location: string;
  results_json: Job[];
  created_at: string;
}

interface JobStore {
  selectedJob: Job | null;
  recentSearches: SavedSearch[];
  setSelectedJob: (job: Job | null) => void;
  clearSelectedJob: () => void;
  saveSearch: (query: string, location: string, results: Job[], accessToken: string) => Promise<void>;
  loadRecentSearches: (accessToken: string) => Promise<void>;
}

export const useJobStore = create<JobStore>()(
  persist(
    (set, get) => ({
      selectedJob: null,
      recentSearches: [],

      setSelectedJob: (job) => set({ selectedJob: job }),
      clearSelectedJob: () => set({ selectedJob: null }),

      saveSearch: async (query: string, location: string, results: Job[], accessToken: string) => {
        if (!accessToken) return;
        try {
          await api.post(
            "/user/job-searches",
            { query, location, results_json: results },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          // Update local cache
          set((s) => ({
            recentSearches: [
              { id: Date.now().toString(), query, location, results_json: results, created_at: new Date().toISOString() },
              ...s.recentSearches,
            ].slice(0, 5),
          }));
        } catch (err) {
          console.error("Failed to save job search:", err);
        }
      },

      loadRecentSearches: async (accessToken: string) => {
        if (!accessToken) return;
        try {
          const { data } = await api.get("/user/job-searches", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (data && Array.isArray(data)) {
            set({ recentSearches: data as SavedSearch[] });
          }
        } catch (err) {
          console.error("Failed to load recent job searches:", err);
        }
      },
    }),
    {
      name: "mithra-selected-job",
      storage: createJSONStorage(() => userStorage),
      partialize: (state) => ({
        selectedJob: state.selectedJob,
        recentSearches: state.recentSearches,
      }),
    }
  )
);

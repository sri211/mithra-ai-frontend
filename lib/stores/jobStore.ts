"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Job } from "@/lib/types";

interface JobStore {
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
  clearSelectedJob: () => void;
}

export const useJobStore = create<JobStore>()(
  persist(
    (set) => ({
      selectedJob: null,
      setSelectedJob: (job) => set({ selectedJob: job }),
      clearSelectedJob: () => set({ selectedJob: null }),
    }),
    {
      name: "mithra-selected-job",
    }
  )
);

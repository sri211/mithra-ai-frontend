"use client";
import { create } from "zustand";
import { ResumeData } from "@/lib/types";

const defaultResume: ResumeData = {
  personal: { name: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "", title: "" },
  summary: "",
  experience: [],
  education: [],
  skills: { technical: [], soft: [], languages: [], certifications: [] },
  projects: [],
  achievements: [],
  volunteer: [],
};

interface ResumeStore {
  resume: ResumeData;
  selectedTemplate: string;
  isBuilding: boolean;
  atsScore: number;
  setResume: (r: ResumeData) => void;
  updateSection: (section: keyof ResumeData, value: unknown) => void;
  setTemplate: (t: string) => void;
  setBuilding: (b: boolean) => void;
  setAtsScore: (s: number) => void;
  reset: () => void;
}

export const useResumeStore = create<ResumeStore>((set) => ({
  resume: defaultResume,
  selectedTemplate: "modern",
  isBuilding: false,
  atsScore: 0,
  setResume: (resume) => set({ resume }),
  updateSection: (section, value) =>
    set((s) => ({ resume: { ...s.resume, [section]: value } })),
  setTemplate: (selectedTemplate) => set({ selectedTemplate }),
  setBuilding: (isBuilding) => set({ isBuilding }),
  setAtsScore: (atsScore) => set({ atsScore }),
  reset: () => set({ resume: defaultResume, atsScore: 0 }),
}));

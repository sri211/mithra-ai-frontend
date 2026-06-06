"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ResumeData } from "@/lib/types";
import { api } from "@/lib/api/client";
import { userStorage } from "@/lib/stores/userStorage";

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
  isSaving: boolean;
  savedToastVisible: boolean;
  setResume: (r: ResumeData) => void;
  updateSection: (section: keyof ResumeData, value: unknown) => void;
  setTemplate: (t: string) => void;
  setBuilding: (b: boolean) => void;
  setAtsScore: (s: number) => void;
  reset: () => void;
  resetToDefault: () => void;
  saveToCloud: (accessToken: string, name?: string) => Promise<string | null>;
  loadFromCloud: (accessToken: string) => Promise<void>;
  dismissSavedToast: () => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      resume: defaultResume,
      selectedTemplate: "modern",
      isBuilding: false,
      atsScore: 0,
      isSaving: false,
      savedToastVisible: false,

      setResume: (resume) => set({ resume }),
      updateSection: (section, value) =>
        set((s) => ({ resume: { ...s.resume, [section]: value } })),
      setTemplate: (selectedTemplate) => set({ selectedTemplate }),
      setBuilding: (isBuilding) => set({ isBuilding }),
      setAtsScore: (atsScore) => set({ atsScore }),
      reset: () => set({ resume: defaultResume, atsScore: 0 }),
      resetToDefault: () => set({ resume: defaultResume, atsScore: 0, selectedTemplate: "modern" }),
      dismissSavedToast: () => set({ savedToastVisible: false }),

      saveToCloud: async (accessToken: string, name?: string) => {
        if (!accessToken) return null;
        const { resume, selectedTemplate, atsScore } = get();
        const resumeName = name || resume.personal.name || "My Resume";
        set({ isSaving: true });
        try {
          const { data } = await api.post(
            "/user/resumes",
            {
              name: resumeName,
              resume_json: resume,
              template: selectedTemplate,
              ats_score: atsScore,
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          set({ savedToastVisible: true });
          setTimeout(() => set({ savedToastVisible: false }), 3000);
          return data.id;
        } catch (err) {
          console.error("Failed to save resume to cloud:", err);
          return null;
        } finally {
          set({ isSaving: false });
        }
      },

      loadFromCloud: async (accessToken: string) => {
        if (!accessToken) return;
        try {
          const { data } = await api.get("/user/resumes", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (data && data.length > 0) {
            const latest = data[0];
            set({
              resume: latest.resume_json,
              selectedTemplate: latest.template || "modern",
              atsScore: latest.ats_score || 0,
            });
          }
        } catch (err) {
          console.error("Failed to load resume from cloud:", err);
        }
      },
    }),
    {
      name: "mithra-resume",
      storage: createJSONStorage(() => userStorage),
      partialize: (state) => ({
        resume: state.resume,
        selectedTemplate: state.selectedTemplate,
        atsScore: state.atsScore,
      }),
    }
  )
);

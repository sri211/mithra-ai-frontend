"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  name: string;
  email: string;
  currentRole: string;
  targetRole: string;
  skills: string[];
  experienceSummary: string;
  yearsOfExperience: number;
  location: string;
  profileSetupDone: boolean;
}

const defaultProfile: UserProfile = {
  name: "",
  email: "",
  currentRole: "",
  targetRole: "",
  skills: [],
  experienceSummary: "",
  yearsOfExperience: 0,
  location: "",
  profileSetupDone: false,
};

interface UserProfileStore {
  profile: UserProfile;
  setProfile: (p: Partial<UserProfile>) => void;
  setName: (name: string) => void;
  setCurrentRole: (role: string) => void;
  setTargetRole: (role: string) => void;
  markSetupDone: () => void;
  reset: () => void;
}

export const useUserProfileStore = create<UserProfileStore>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      setProfile: (p) =>
        set((s) => ({ profile: { ...s.profile, ...p } })),
      setName: (name) =>
        set((s) => ({ profile: { ...s.profile, name } })),
      setCurrentRole: (currentRole) =>
        set((s) => ({ profile: { ...s.profile, currentRole } })),
      setTargetRole: (targetRole) =>
        set((s) => ({ profile: { ...s.profile, targetRole } })),
      markSetupDone: () =>
        set((s) => ({ profile: { ...s.profile, profileSetupDone: true } })),
      reset: () => set({ profile: defaultProfile }),
    }),
    {
      name: "mithra-user-profile",
    }
  )
);

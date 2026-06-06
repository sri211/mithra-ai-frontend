"use client";
// Single source of truth for all plan limits.
// Frontend enforcement — backend should mirror these for production hardening.

export type Plan = "free" | "pro" | "elite";

export interface PlanLimits {
  resumeAdaptations: number;      // per month (-1 = unlimited)
  jobSearchesPerDay: number;      // per day (-1 = unlimited)
  templates: string[];            // allowed template ids
  networkContacts: number;        // max contacts per search
  interviewQuestionsPerSession: number; // questions per session (-1 = unlimited)
  trackerAccess: boolean;
  interviewPrepAccess: boolean;
  autoApplyAccess: boolean;
  priorityAI: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    resumeAdaptations: 5,
    jobSearchesPerDay: 10,
    templates: ["modern", "minimal", "classic"],
    networkContacts: 5,
    interviewQuestionsPerSession: 3,
    trackerAccess: false,
    interviewPrepAccess: false,
    autoApplyAccess: false,
    priorityAI: false,
  },
  pro: {
    resumeAdaptations: -1,
    jobSearchesPerDay: -1,
    templates: ["modern", "minimal", "classic", "tech", "executive", "creative"],
    networkContacts: 10,
    interviewQuestionsPerSession: -1,
    trackerAccess: true,
    interviewPrepAccess: true,
    autoApplyAccess: false,
    priorityAI: false,
  },
  elite: {
    resumeAdaptations: -1,
    jobSearchesPerDay: -1,
    templates: ["modern", "minimal", "classic", "tech", "executive", "creative"],
    networkContacts: -1,
    interviewQuestionsPerSession: -1,
    trackerAccess: true,
    interviewPrepAccess: true,
    autoApplyAccess: true,
    priorityAI: true,
  },
};

export function getLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[(plan as Plan) ?? "free"] ?? PLAN_LIMITS.free;
}

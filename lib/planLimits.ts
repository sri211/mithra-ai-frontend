"use client";
// Single source of truth for all plan limits.
// Frontend enforcement — backend should mirror these for production hardening.

export type Plan = "free" | "pro" | "elite";

export interface PlanLimits {
  resumeAdaptations: number;        // per month (-1 = unlimited)
  atsScoreChecks: number;           // per month (-1 = unlimited) — ATS score is cheap, keep free
  jobSearchesPerDay: number;        // per day (-1 = unlimited)
  jobResultsVisible: number;        // max results shown (-1 = all)
  chatMessagesPerDay: number;       // per day (-1 = unlimited)
  pdfDownloadsPerMonth: number;     // per month (-1 = unlimited)
  resumeRegenerationsPerMonth: number; // AI rebuilds per month (-1 = unlimited)
  templates: string[];              // allowed template ids
  networkContacts: number;          // max contacts per search
  interviewQuestionsPerSession: number;
  trackerAccess: boolean;
  interviewPrepAccess: boolean;
  autoApplyAccess: boolean;
  priorityAI: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    resumeAdaptations: 3,           // 3 rewrites/month (was 5)
    atsScoreChecks: -1,             // ATS score always free
    jobSearchesPerDay: 5,           // 5 searches/day (was 10)
    jobResultsVisible: 8,           // top 8 shown, rest locked
    chatMessagesPerDay: 15,         // 15 Mithra messages/day
    pdfDownloadsPerMonth: 2,        // 2 PDF downloads/month
    resumeRegenerationsPerMonth: 3, // 3 AI rebuilds/month
    templates: ["modern", "minimal", "classic"],
    networkContacts: 5,
    interviewQuestionsPerSession: 3,
    trackerAccess: true,
    interviewPrepAccess: true,
    autoApplyAccess: false,
    priorityAI: false,
  },
  pro: {
    resumeAdaptations: -1,
    atsScoreChecks: -1,
    jobSearchesPerDay: -1,
    jobResultsVisible: -1,
    chatMessagesPerDay: -1,
    pdfDownloadsPerMonth: -1,
    resumeRegenerationsPerMonth: -1,
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
    atsScoreChecks: -1,
    jobSearchesPerDay: -1,
    jobResultsVisible: -1,
    chatMessagesPerDay: -1,
    pdfDownloadsPerMonth: -1,
    resumeRegenerationsPerMonth: -1,
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

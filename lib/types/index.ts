export interface ResumeData {
  personal: {
    name: string; email: string; phone: string; location: string;
    linkedin: string; github: string; website: string; title: string;
  };
  summary: string;
  experience: {
    company: string; role: string; start: string; end: string;
    location: string; current: boolean; bullets: string[];
  }[];
  education: {
    institution: string; degree: string; field: string;
    start: string; end: string; gpa: string;
  }[];
  skills: {
    technical: string[]; soft: string[]; languages: string[]; certifications: string[];
  };
  projects: {
    name: string; description: string; tech: string[]; link: string; bullets: string[];
  }[];
  achievements: string[];
  volunteer: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  company_logo?: string;
  location: string;
  remote: string;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  experience_required: string;
  posted_date: string;
  description: string;
  skills: string[];
  portal: string;
  portal_url: string;
  url?: string;
  job_type: string;
  seniority: string;
  match_score?: number;
  why_match?: string;
  red_flags?: string[];
  apply_priority?: "high" | "medium" | "low";
  requirements?: string;
  is_real_listing?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Connection {
  id: string;
  name: string;
  role: string;
  company: string;
  linkedin_url: string;
  avatar?: string;
  why_connect: string;
  connection_type: "hiring_manager" | "recruiter" | "team_member" | "alumnus" | "influencer";
  mutual_connections: number;
  outreach_strategy: string;
  message_draft: string;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  job_url: string;
  location: string;
  salary: string;
  status: "bookmarked" | "applied" | "screening" | "interview" | "offer" | "rejected" | "accepted";
  notes: string;
  applied_date: string;
  portal: string;
  created_at: string;
  next_step?: string;
  interview_date?: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: "behavioral" | "technical" | "case" | "situational";
  difficulty: "easy" | "medium" | "hard";
  category: string;
  what_they_evaluate: string;
  ideal_answer_structure: string;
  follow_ups: string[];
}

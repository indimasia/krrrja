// Static mock data for UI development before Supabase is wired up.
// Shapes mirror the data model in CLAUDE.md — swap for real queries once DB is live.

export type CandidateStatus = "New" | "Reviewed" | "Shortlisted" | "Rejected";
export type ProcessingStatus = "Uploading" | "Processing" | "Scored" | "Failed";

export type MockCandidate = {
  id: string;
  jobOpeningId: string;
  fileName: string;
  score: number | null;
  summary: string[];
  redFlags: string[];
  status: CandidateStatus;
  processingStatus: ProcessingStatus;
  notes: string;
  createdAt: string;
};

export type MockJobOpening = {
  id: string;
  title: string;
  description: string;
  criteria: string;
  status: "active" | "closed";
  candidateCount: number;
  createdAt: string;
};

export type MockOrg = {
  id: string;
  name: string;
  subscriptionTier: "free" | "pro";
  activeJobOpenings: number;
  cvProcessedThisMonth: number;
};

export const MOCK_ORG: MockOrg = {
  id: "org_1",
  name: "Acme Hiring Co",
  subscriptionTier: "free",
  activeJobOpenings: 2,
  cvProcessedThisMonth: 14,
};

export const FREE_TIER_LIMITS = {
  maxActiveJobOpenings: 3,
  maxCvPerMonth: 20,
};

export const MOCK_JOB_OPENINGS: MockJobOpening[] = [
  {
    id: "job_1",
    title: "Senior Backend Engineer",
    description: "Own our core API platform, mentor mid-level engineers.",
    criteria: "5+ yrs Node.js/Postgres, distributed systems experience, startup background preferred.",
    status: "active",
    candidateCount: 8,
    createdAt: "2026-07-01",
  },
  {
    id: "job_2",
    title: "Product Designer",
    description: "Lead end-to-end design for our screening product.",
    criteria: "3+ yrs SaaS product design, strong portfolio, Figma expert.",
    status: "active",
    candidateCount: 6,
    createdAt: "2026-07-05",
  },
];

export const MOCK_CANDIDATES: MockCandidate[] = [
  {
    id: "cand_1",
    jobOpeningId: "job_1",
    fileName: "jane_doe_resume.pdf",
    score: 92,
    summary: [
      "8 years backend experience, strong Node.js and Postgres background.",
      "Led migration of monolith to microservices at previous startup.",
      "Mentored 4 junior engineers over 2 years.",
    ],
    redFlags: [],
    status: "Shortlisted",
    processingStatus: "Scored",
    notes: "Strong culture fit signal, fast-track interview.",
    createdAt: "2026-07-08",
  },
  {
    id: "cand_2",
    jobOpeningId: "job_1",
    fileName: "john_smith_cv.pdf",
    score: 74,
    summary: [
      "5 years experience, mostly frontend with some Node.js exposure.",
      "No direct distributed systems experience found in CV.",
      "Worked at 2 early-stage startups.",
    ],
    redFlags: ["Criteria requires distributed systems experience, not evidenced in CV."],
    status: "Reviewed",
    processingStatus: "Scored",
    notes: "",
    createdAt: "2026-07-08",
  },
  {
    id: "cand_3",
    jobOpeningId: "job_1",
    fileName: "alex_lee_resume.pdf",
    score: null,
    summary: [],
    redFlags: [],
    status: "New",
    processingStatus: "Processing",
    notes: "",
    createdAt: "2026-07-09",
  },
  {
    id: "cand_4",
    jobOpeningId: "job_1",
    fileName: "priya_patel_cv.pdf",
    score: null,
    summary: [],
    redFlags: [],
    status: "New",
    processingStatus: "Failed",
    notes: "",
    createdAt: "2026-07-09",
  },
];

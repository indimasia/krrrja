import { createClient } from "@/lib/supabase/server";
import type { JobType, WorkplaceType, Currency } from "@/lib/job-fields";

export type JobOpening = {
  id: string;
  title: string;
  description: string;
  criteria: string;
  skills: string[];
  requirements: string;
  jobType: JobType;
  workplaceType: WorkplaceType;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: Currency;
  attachmentPath: string | null;
  attachmentName: string | null;
  status: "active" | "closed";
  createdAt: string;
  candidateCount: number;
};

const JOB_COLUMNS =
  "id, title, description, criteria, skills, requirements, job_type, workplace_type, salary_min, salary_max, currency, attachment_path, attachment_name, status, created_at, candidates(count)";

// Row shape for the select above; Supabase types are not generated in this repo.
type JobRow = {
  id: string;
  title: string;
  description: string;
  criteria: string;
  skills: string[] | null;
  requirements: string | null;
  job_type: string;
  workplace_type: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  attachment_path: string | null;
  attachment_name: string | null;
  status: string;
  created_at: string;
  candidates: { count: number }[];
};

function mapJob(job: JobRow): JobOpening {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    criteria: job.criteria,
    skills: job.skills ?? [],
    requirements: job.requirements ?? "",
    jobType: job.job_type as JobType,
    workplaceType: job.workplace_type as WorkplaceType,
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    currency: job.currency as Currency,
    attachmentPath: job.attachment_path,
    attachmentName: job.attachment_name,
    status: job.status as "active" | "closed",
    createdAt: job.created_at,
    candidateCount: job.candidates[0]?.count ?? 0,
  };
}

export async function listJobOpenings(orgId: string): Promise<JobOpening[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_openings")
    .select(JOB_COLUMNS)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as unknown as JobRow[]).map(mapJob);
}

export async function getJobOpening(id: string): Promise<JobOpening | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_openings")
    .select(JOB_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return mapJob(data as unknown as JobRow);
}

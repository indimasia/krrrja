import { createClient } from "@/lib/supabase/server";

export type JobOpening = {
  id: string;
  title: string;
  description: string;
  criteria: string;
  status: "active" | "closed";
  createdAt: string;
  candidateCount: number;
};

export async function listJobOpenings(orgId: string): Promise<JobOpening[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_openings")
    .select("id, title, description, criteria, status, created_at, candidates(count)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((job) => ({
    id: job.id,
    title: job.title,
    description: job.description,
    criteria: job.criteria,
    status: job.status as "active" | "closed",
    createdAt: job.created_at,
    candidateCount: (job.candidates as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

export async function getJobOpening(id: string): Promise<JobOpening | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_openings")
    .select("id, title, description, criteria, status, created_at, candidates(count)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    criteria: data.criteria,
    status: data.status as "active" | "closed",
    createdAt: data.created_at,
    candidateCount: (data.candidates as unknown as { count: number }[])[0]?.count ?? 0,
  };
}

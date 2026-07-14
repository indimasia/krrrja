-- HireScreen init schema: orgs, org_members, job_openings, candidates, processing_jobs
-- RLS default-deny, tenant boundary enforced by org_id membership.

create extension if not exists "pgcrypto";

-- ── Tables ──────────────────────────────────────────────────────────────

create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stripe_customer_id text,
  subscription_status text,
  subscription_tier text not null default 'free',
  created_at timestamptz not null default now()
);

create table org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table job_openings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  title text not null,
  description text not null default '',
  criteria text not null default '',
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now()
);

create table candidates (
  id uuid primary key default gen_random_uuid(),
  job_opening_id uuid not null references job_openings(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  extracted_text text,
  score int check (score between 0 and 100),
  summary jsonb,
  red_flags jsonb,
  status text not null default 'New' check (status in ('New', 'Reviewed', 'Shortlisted', 'Rejected')),
  notes text,
  created_at timestamptz not null default now()
);

create table processing_jobs (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  retry_count int not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create index on org_members (user_id);
create index on job_openings (org_id);
create index on candidates (org_id);
create index on candidates (job_opening_id);
create index on processing_jobs (candidate_id);

-- ── Helper functions (security definer, bypass RLS for membership checks) ─

create or replace function public.is_org_member(check_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from org_members om
    where om.org_id = check_org_id and om.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(check_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from org_members om
    where om.org_id = check_org_id and om.user_id = auth.uid() and om.role = 'admin'
  );
$$;

-- Bootstraps a new org + makes the caller its first admin, atomically.
-- Direct INSERT into orgs/org_members is otherwise locked down (chicken-egg:
-- you can't be a member of an org that doesn't exist yet).
create or replace function public.create_org(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  insert into orgs (name) values (p_name) returning id into new_org_id;
  insert into org_members (org_id, user_id, role) values (new_org_id, auth.uid(), 'admin');
  return new_org_id;
end;
$$;

-- ── RLS: enable + default-deny (no policy = deny) on every tenant table ──

alter table orgs enable row level security;
alter table org_members enable row level security;
alter table job_openings enable row level security;
alter table candidates enable row level security;
alter table processing_jobs enable row level security;

-- orgs: members can read/update their org, no direct insert/delete (use create_org)
create policy "orgs_select_member" on orgs
  for select using (is_org_member(id));

create policy "orgs_update_admin" on orgs
  for update using (is_org_admin(id));

-- org_members: members can see their org's roster; admins manage membership
create policy "org_members_select_member" on org_members
  for select using (is_org_member(org_id));

create policy "org_members_insert_admin" on org_members
  for insert with check (is_org_admin(org_id));

create policy "org_members_update_admin" on org_members
  for update using (is_org_admin(org_id));

create policy "org_members_delete_admin" on org_members
  for delete using (is_org_admin(org_id));

-- job_openings: any org member can read/upload; scoped to org
create policy "job_openings_select_member" on job_openings
  for select using (is_org_member(org_id));

create policy "job_openings_insert_admin" on job_openings
  for insert with check (is_org_admin(org_id));

create policy "job_openings_update_member" on job_openings
  for update using (is_org_member(org_id));

create policy "job_openings_delete_admin" on job_openings
  for delete using (is_org_admin(org_id));

-- candidates: any org member can read/upload/update (notes, status)
create policy "candidates_select_member" on candidates
  for select using (is_org_member(org_id));

create policy "candidates_insert_member" on candidates
  for insert with check (is_org_member(org_id));

create policy "candidates_update_member" on candidates
  for update using (is_org_member(org_id));

create policy "candidates_delete_admin" on candidates
  for delete using (is_org_admin(org_id));

-- processing_jobs: no org_id column, scope via parent candidate's org
create policy "processing_jobs_select_member" on processing_jobs
  for select using (
    exists (
      select 1 from candidates c
      where c.id = processing_jobs.candidate_id and is_org_member(c.org_id)
    )
  );

create policy "processing_jobs_all_service" on processing_jobs
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

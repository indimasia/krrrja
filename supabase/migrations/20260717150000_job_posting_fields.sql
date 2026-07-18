-- LinkedIn-style posting fields on job_openings.
-- All nullable/defaulted so existing rows stay valid.

alter table public.job_openings
  add column skills text[] not null default '{}',
  add column requirements text not null default '',
  add column job_type text not null default 'full_time'
    check (job_type in ('full_time', 'part_time', 'contract', 'temporary', 'internship')),
  add column workplace_type text not null default 'on_site'
    check (workplace_type in ('on_site', 'hybrid', 'remote')),
  add column salary_min integer check (salary_min >= 0),
  add column salary_max integer check (salary_max >= 0),
  add constraint job_openings_salary_range
    check (salary_min is null or salary_max is null or salary_min <= salary_max);

-- Platform super admins: users who operate the whole platform (all orgs).
-- Separate from tenant RLS path (org_members) — a super admin has NO org.
-- Membership grants access to the /pro section; cross-org data reads go
-- through the service-role client, not this table's RLS.
create table platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table platform_admins enable row level security;

-- A logged-in user may check ONLY whether they themselves are a platform admin.
-- Inserts/updates/deletes have no policy → denied for anon/authenticated;
-- provisioning happens via the service role (which bypasses RLS).
create policy "platform_admins_select_self" on platform_admins
  for select using (user_id = auth.uid());

-- security-definer helper so other policies / RPCs can gate on super-admin
-- without tripping over platform_admins' own RLS.
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from platform_admins pa where pa.user_id = auth.uid()
  );
$$;

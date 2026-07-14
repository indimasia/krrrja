-- Org member invites: admins invite by email, invitee accepts via tokenized
-- link (OAuth-consent-style page). Email delivery handled by Supabase Auth
-- (inviteUserByEmail for new users, magic link for existing users).

create table invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  token uuid not null unique default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);

create index on invites (org_id);
create index on invites (token);

alter table invites enable row level security;

-- Only org admins manage their org's invites. The invitee never reads the
-- table directly — they go through the security-definer functions below.
create policy "invites_select_admin" on invites
  for select using (is_org_admin(org_id));

create policy "invites_insert_admin" on invites
  for insert with check (is_org_admin(org_id));

create policy "invites_update_admin" on invites
  for update using (is_org_admin(org_id));

create policy "invites_delete_admin" on invites
  for delete using (is_org_admin(org_id));

-- Resolve an invite by token for the accept page. Security definer so the
-- invitee (who has no org membership yet) can see org name + role. The token
-- itself is the secret — only someone holding the emailed link can call this
-- usefully.
create or replace function public.get_invite(p_token uuid)
returns table (org_name text, email text, role text, status text, expired boolean)
language sql
security definer
stable
set search_path = public
as $$
  select o.name, i.email, i.role, i.status, (i.expires_at < now()) as expired
  from invites i
  join orgs o on o.id = i.org_id
  where i.token = p_token;
$$;

-- Accept an invite: validates token, expiry, and that the caller's auth email
-- matches the invited email; then adds membership and marks the invite used.
create or replace function public.accept_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv invites%rowtype;
  caller_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv from invites where token = p_token for update;

  if not found then
    raise exception 'Invite not found';
  end if;
  if inv.status <> 'pending' then
    raise exception 'Invite is no longer valid';
  end if;
  if inv.expires_at < now() then
    raise exception 'Invite has expired';
  end if;

  caller_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if caller_email <> lower(inv.email) then
    raise exception 'This invite was sent to a different email address';
  end if;

  -- Single-org model: a user belongs to exactly one org.
  if exists (select 1 from org_members where user_id = auth.uid()) then
    raise exception 'You already belong to an organization';
  end if;

  insert into org_members (org_id, user_id, role)
  values (inv.org_id, auth.uid(), inv.role);

  update invites set status = 'accepted' where id = inv.id;

  return inv.org_id;
end;
$$;

revoke execute on function public.get_invite(uuid) from anon;
revoke execute on function public.accept_invite(uuid) from anon;

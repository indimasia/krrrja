-- Make create_org safe under concurrent calls (deferred signup backfill can
-- race: two simultaneous logins both saw "no membership"). Advisory lock
-- serializes per-user; the membership re-check inside the lock makes the
-- second caller a no-op returning the existing org.

create or replace function public.create_org(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  existing_org_id uuid;
begin
  -- Serialize concurrent calls for the same user.
  perform pg_advisory_xact_lock(hashtext('create_org:' || auth.uid()::text));

  select org_id into existing_org_id
  from org_members
  where user_id = auth.uid()
  limit 1;
  if existing_org_id is not null then
    return existing_org_id; -- single-org model: never create a second org
  end if;

  insert into orgs (name) values (p_name) returning id into new_org_id;
  insert into org_members (org_id, user_id, role) values (new_org_id, auth.uid(), 'admin');
  return new_org_id;
end;
$$;

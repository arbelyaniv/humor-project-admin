-- Humor Project Admin: RLS policies for superadmins.
--
-- Run in the Supabase SQL Editor. Safe to re-run.
-- These policies only ADD access for users whose profiles.is_superadmin = true.
-- They do not disable RLS and do not widen access for anyone else
-- (Postgres OR-combines permissive policies, so existing policies are untouched).
--
-- NOTE: policies only take effect on tables where RLS is enabled. Check with:
--   select relname, relrowsecurity from pg_class
--   where relname in ('profiles', 'generations', 'votes');

-- 1. Helper: is the current user a superadmin?
--    SECURITY DEFINER avoids infinite recursion when used in a policy on profiles.
create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_superadmin from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

revoke execute on function public.is_superadmin() from public, anon;
grant execute on function public.is_superadmin() to authenticated;

-- 2. profiles: users can read their own row (needed for the admin check),
--    superadmins can read every row.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Superadmins can read all profiles" on public.profiles;
create policy "Superadmins can read all profiles"
  on public.profiles for select to authenticated
  using ((select public.is_superadmin()));

-- 3. generations: full CRUD for superadmins.
drop policy if exists "Superadmins can read generations" on public.generations;
create policy "Superadmins can read generations"
  on public.generations for select to authenticated
  using ((select public.is_superadmin()));

drop policy if exists "Superadmins can create generations" on public.generations;
create policy "Superadmins can create generations"
  on public.generations for insert to authenticated
  with check ((select public.is_superadmin()));

drop policy if exists "Superadmins can update generations" on public.generations;
create policy "Superadmins can update generations"
  on public.generations for update to authenticated
  using ((select public.is_superadmin()))
  with check ((select public.is_superadmin()));

drop policy if exists "Superadmins can delete generations" on public.generations;
create policy "Superadmins can delete generations"
  on public.generations for delete to authenticated
  using ((select public.is_superadmin()));

-- 4. votes: read-only for superadmins.
drop policy if exists "Superadmins can read votes" on public.votes;
create policy "Superadmins can read votes"
  on public.votes for select to authenticated
  using ((select public.is_superadmin()));

-- 5. (Recommended) Prevent privilege escalation: if any existing policy lets
--    users update/insert their own profile, they could otherwise set
--    is_superadmin = true on themselves. This trigger blocks that for API
--    clients (anon/authenticated) while still allowing changes from the
--    SQL Editor / dashboard.
create or replace function public.protect_is_superadmin()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and (
       (tg_op = 'INSERT' and coalesce(new.is_superadmin, false))
    or (tg_op = 'UPDATE' and new.is_superadmin is distinct from old.is_superadmin)
  ) then
    raise exception 'is_superadmin can only be changed by a database administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_is_superadmin on public.profiles;
create trigger protect_is_superadmin
  before insert or update on public.profiles
  for each row execute function public.protect_is_superadmin();

-- 6. (Optional) If generations.user_id has a foreign key to profiles/auth.users
--    and votes.generation_id references generations WITHOUT "on delete cascade",
--    deleting a generation that has votes will fail with a FK error. Check with:
--   select conname, confdeltype from pg_constraint
--   where conrelid = 'public.votes'::regclass and contype = 'f';
--   (confdeltype 'c' = cascade, 'a' = no action)

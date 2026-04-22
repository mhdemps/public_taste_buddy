-- Link public.profiles to Supabase Auth (auth.users)
-- Run in SQL Editor AFTER public.profiles exists.
--
-- If ADD CONSTRAINT fails because of orphan rows, uncomment and run the DELETE once,
-- then re-run the ALTER (only deletes profile rows with no matching auth user).
--
-- DELETE FROM public.profiles p
-- WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);

-- Remove old FK if you re-ran this script (name may differ — check Table Editor → profiles → Constraints)
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  drop constraint if exists profiles_id_auth_fkey;

alter table public.profiles
  add constraint profiles_id_auth_fkey
  foreign key (id) references auth.users (id) on delete cascade;

-- Optional: auto-create a profiles row when a new auth user signs up (id only; app fills the rest on save)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Run in Supabase SQL Editor after enabling Email auth.
-- Re-run safe fragments when extending the schema (IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- If you created public.profiles yourself without a foreign key to auth.users, run
-- profiles_link_auth.sql to add the link + optional "new user → profile row" trigger.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  buddy_color_index smallint not null default 0,
  buddy_body_key text default 'purple',
  buddy_hat_key text default 'none',
  buddy_smile_key text default 'smile',
  favorite_food text,
  personality text,
  specialty text,
  allergies text,
  parties_attended integer,
  recipes_given text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

alter table public.profiles add column if not exists buddy_color_index smallint not null default 0;
alter table public.profiles add column if not exists buddy_body_key text default 'purple';
alter table public.profiles add column if not exists buddy_hat_key text default 'none';
alter table public.profiles add column if not exists buddy_smile_key text default 'smile';
alter table public.profiles add column if not exists favorite_food text;
alter table public.profiles add column if not exists personality text;
alter table public.profiles add column if not exists specialty text;
alter table public.profiles add column if not exists allergies text;
alter table public.profiles add column if not exists parties_attended integer;
alter table public.profiles add column if not exists recipes_given text;

drop policy if exists "profiles_select_own" on public.profiles;

-- Anyone signed in can browse community profiles (taste wall).
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated
  using (true);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id);

-- Recipes posted to the community wall (visible to all signed-in users).
create table if not exists public.public_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_local_id text,
  recipe_name text not null,
  allergies text not null default '',
  ingredients text not null default '',
  directions text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists public_recipes_user_source_unique
  on public.public_recipes (user_id, source_local_id)
  where source_local_id is not null;

alter table public.public_recipes enable row level security;

drop policy if exists "public_recipes_read" on public.public_recipes;
drop policy if exists "public_recipes_insert_own" on public.public_recipes;
drop policy if exists "public_recipes_update_own" on public.public_recipes;
drop policy if exists "public_recipes_delete_own" on public.public_recipes;

create policy "public_recipes_read" on public.public_recipes
  for select to authenticated
  using (true);

create policy "public_recipes_insert_own" on public.public_recipes
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "public_recipes_update_own" on public.public_recipes
  for update to authenticated
  using (auth.uid() = user_id);

create policy "public_recipes_delete_own" on public.public_recipes
  for delete to authenticated
  using (auth.uid() = user_id);

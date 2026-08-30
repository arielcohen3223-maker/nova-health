-- NOVA — הריצי קובץ זה פעם אחת ב-Supabase → SQL Editor → Run
-- https://supabase.com/dashboard → Project → SQL Editor

-- ========== 001 initial schema ==========
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'he' check (locale in ('he', 'en')),
  onboarding_step text not null default 'welcome'
    check (onboarding_step in ('welcome', 'learning', 'active')),
  learning_days int not null default 0 check (learning_days >= 0 and learning_days <= 28),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.health_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  recorded_at timestamptz not null default now(),
  resting_hr numeric(5, 1),
  hrv numeric(6, 1),
  sleep_hours numeric(4, 2),
  steps int,
  body_temp numeric(4, 2),
  stress_score numeric(5, 2),
  source text default 'manual',
  created_at timestamptz not null default now()
);

alter table public.health_snapshots enable row level security;

drop policy if exists "Users read own snapshots" on public.health_snapshots;
create policy "Users read own snapshots"
  on public.health_snapshots for select using (auth.uid() = user_id);

drop policy if exists "Users insert own snapshots" on public.health_snapshots;
create policy "Users insert own snapshots"
  on public.health_snapshots for insert with check (auth.uid() = user_id);

create index if not exists health_snapshots_user_recorded
  on public.health_snapshots (user_id, recorded_at desc);

-- ========== 002 meals + chat ==========
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  dish_name text not null,
  calories numeric(6, 1),
  protein_g numeric(5, 1),
  fat_g numeric(5, 1),
  carbs_g numeric(5, 1),
  insight text,
  created_at timestamptz not null default now()
);

alter table public.meals enable row level security;

drop policy if exists "Users read own meals" on public.meals;
create policy "Users read own meals"
  on public.meals for select using (auth.uid() = user_id);

drop policy if exists "Users insert own meals" on public.meals;
create policy "Users insert own meals"
  on public.meals for insert with check (auth.uid() = user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

drop policy if exists "Users read own chat" on public.chat_messages;
create policy "Users read own chat"
  on public.chat_messages for select using (auth.uid() = user_id);

drop policy if exists "Users insert own chat" on public.chat_messages;
create policy "Users insert own chat"
  on public.chat_messages for insert with check (auth.uid() = user_id);

alter table public.profiles
  add column if not exists subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro'));

create index if not exists meals_user_created on public.meals (user_id, created_at desc);
create index if not exists chat_user_created on public.chat_messages (user_id, created_at desc);

-- ========== 003 storage (blood PDF) ==========
insert into storage.buckets (id, name, public)
values ('blood-tests', 'blood-tests', false)
on conflict (id) do nothing;

drop policy if exists "Users upload own blood tests" on storage.objects;
create policy "Users upload own blood tests"
  on storage.objects for insert
  with check (
    bucket_id = 'blood-tests'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users read own blood tests" on storage.objects;
create policy "Users read own blood tests"
  on storage.objects for select
  using (
    bucket_id = 'blood-tests'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users delete own blood tests" on storage.objects;
create policy "Users delete own blood tests"
  on storage.objects for delete
  using (
    bucket_id = 'blood-tests'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

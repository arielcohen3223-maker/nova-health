-- NOVA initial schema — run in Supabase SQL Editor or via CLI

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

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
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

-- Health snapshots (future: sync from HealthKit / Garmin)
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

create policy "Users read own snapshots"
  on public.health_snapshots for select
  using (auth.uid() = user_id);

create policy "Users insert own snapshots"
  on public.health_snapshots for insert
  with check (auth.uid() = user_id);

create index if not exists health_snapshots_user_recorded
  on public.health_snapshots (user_id, recorded_at desc);

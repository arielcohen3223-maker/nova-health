-- Meals, chat history, subscription flags

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

create policy "Users read own meals"
  on public.meals for select using (auth.uid() = user_id);

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

create policy "Users read own chat"
  on public.chat_messages for select using (auth.uid() = user_id);

create policy "Users insert own chat"
  on public.chat_messages for insert with check (auth.uid() = user_id);

alter table public.profiles
  add column if not exists subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro'));

create index if not exists meals_user_created on public.meals (user_id, created_at desc);
create index if not exists chat_user_created on public.chat_messages (user_id, created_at desc);

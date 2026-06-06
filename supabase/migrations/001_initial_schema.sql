-- 001_initial_schema.sql
-- Glow Up RPG — initial schema.
-- Derived from the prototype's localStorage state model.
-- Decisions: finance income/expense merged into finance_entries (type);
-- workouts unified into one table with a jsonb `data` column;
-- preferences + streak folded into profiles; nutrition goals in their own table.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles (1 row per auth user) — also holds prefs + streak
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  email                   text,
  display_name            text not null default 'Mon perso',
  avatar                  text not null default '🧍‍♂️',
  pref_notif              boolean not null default false,
  pref_daily              boolean not null default true,
  streak_count            integer not null default 0,
  streak_last_active_day  date,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- stats (character characteristics, 0..100)
-- ---------------------------------------------------------------------------
create table if not exists public.stats (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  key         text not null,
  name        text not null,
  value       integer not null default 50 check (value between 0 and 100),
  is_custom   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, key)
);
create index if not exists stats_user_id_idx on public.stats(user_id);

-- ---------------------------------------------------------------------------
-- actions (history). deltas: { statKey: int }
-- ---------------------------------------------------------------------------
create table if not exists public.actions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  deltas       jsonb not null default '{}'::jsonb,
  action_date  date not null default current_date,
  created_at   timestamptz not null default now()
);
create index if not exists actions_user_id_idx on public.actions(user_id);
create index if not exists actions_user_date_idx on public.actions(user_id, action_date);

-- ---------------------------------------------------------------------------
-- quests / routines / tasks (cockable list items)
-- ---------------------------------------------------------------------------
create table if not exists public.quests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  category    text not null default 'Général',
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists quests_user_id_idx on public.quests(user_id);

create table if not exists public.routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  minutes     integer not null default 1 check (minutes >= 0),
  category    text not null default 'Général',
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists routines_user_id_idx on public.routines(user_id);

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  minutes     integer not null default 0 check (minutes >= 0),
  category    text not null default 'Général',
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists tasks_user_id_idx on public.tasks(user_id);

-- ---------------------------------------------------------------------------
-- objectives (monthly | yearly) + projects
-- ---------------------------------------------------------------------------
create table if not exists public.objectives (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  period      text not null check (period in ('monthly', 'yearly')),
  name        text not null,
  actions     text not null default '',
  progress    integer not null default 0 check (progress between 0 and 100),
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists objectives_user_id_idx on public.objectives(user_id);
create index if not exists objectives_user_period_idx on public.objectives(user_id, period);

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  progress    integer not null default 0 check (progress between 0 and 100),
  created_at  timestamptz not null default now()
);
create index if not exists projects_user_id_idx on public.projects(user_id);

-- ---------------------------------------------------------------------------
-- finance_entries (income | expense) + financial_goals
-- ---------------------------------------------------------------------------
create table if not exists public.finance_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('income', 'expense')),
  name        text not null,
  amount      numeric(12,2) not null check (amount >= 0),
  category    text not null default 'Autre',
  entry_date  date not null default current_date,
  created_at  timestamptz not null default now()
);
create index if not exists finance_entries_user_id_idx on public.finance_entries(user_id);
create index if not exists finance_entries_user_type_date_idx
  on public.finance_entries(user_id, type, entry_date);

create table if not exists public.financial_goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  target      numeric(12,2) not null check (target > 0),
  saved       numeric(12,2) not null default 0 check (saved >= 0),
  created_at  timestamptz not null default now()
);
create index if not exists financial_goals_user_id_idx on public.financial_goals(user_id);

-- ---------------------------------------------------------------------------
-- nutrition_goals (1 row per user) + foods
-- ---------------------------------------------------------------------------
create table if not exists public.nutrition_goals (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  calories    integer not null default 2285 check (calories >= 0),
  protein     integer not null default 154 check (protein >= 0),
  carbs       integer not null default 246 check (carbs >= 0),
  fat         integer not null default 76 check (fat >= 0),
  updated_at  timestamptz not null default now()
);

create table if not exists public.foods (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  meal        text not null default 'Collation',
  calories    numeric(8,2) not null default 0 check (calories >= 0),
  protein     numeric(8,2) not null default 0 check (protein >= 0),
  carbs       numeric(8,2) not null default 0 check (carbs >= 0),
  fat         numeric(8,2) not null default 0 check (fat >= 0),
  food_date   date not null default current_date,
  created_at  timestamptz not null default now()
);
create index if not exists foods_user_id_idx on public.foods(user_id);
create index if not exists foods_user_date_idx on public.foods(user_id, food_date);

-- ---------------------------------------------------------------------------
-- workouts (strength | run | boxing) — type-specific fields live in `data`
-- strength: { exercise, weight, reps, sets, rest }
-- run:      { distance, seconds, note }
-- boxing:   { minutes, type, intensity, note }
-- ---------------------------------------------------------------------------
create table if not exists public.workouts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null check (type in ('strength', 'run', 'boxing')),
  workout_date  date not null default current_date,
  data          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists workouts_user_id_idx on public.workouts(user_id);
create index if not exists workouts_user_type_idx on public.workouts(user_id, type);

-- ---------------------------------------------------------------------------
-- dangers + mementos
-- ---------------------------------------------------------------------------
create table if not exists public.dangers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  category    text not null default 'Autre',
  impact      integer not null default 3 check (impact between 1 and 5),
  created_at  timestamptz not null default now()
);
create index if not exists dangers_user_id_idx on public.dangers(user_id);

create table if not exists public.mementos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists mementos_user_id_idx on public.mementos(user_id);

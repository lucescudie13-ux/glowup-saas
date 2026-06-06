-- 002_rls_policies.sql
-- Row Level Security: every table is private to its owner (auth.uid() = user_id).
-- The server never trusts a client-sent user_id; RLS enforces ownership.

-- Helper: applies the standard "owner can do everything" policy set to a table
-- whose ownership column is `user_id`.
do $$
declare
  t text;
  owned_tables text[] := array[
    'stats','actions','quests','routines','tasks','objectives','projects',
    'finance_entries','financial_goals','foods','workouts','dangers','mementos'
  ];
begin
  foreach t in array owned_tables loop
    execute format('alter table public.%I enable row level security;', t);

    execute format($f$
      drop policy if exists "%1$s_select_own" on public.%1$I;
      create policy "%1$s_select_own" on public.%1$I
        for select using (auth.uid() = user_id);
    $f$, t);

    execute format($f$
      drop policy if exists "%1$s_insert_own" on public.%1$I;
      create policy "%1$s_insert_own" on public.%1$I
        for insert with check (auth.uid() = user_id);
    $f$, t);

    execute format($f$
      drop policy if exists "%1$s_update_own" on public.%1$I;
      create policy "%1$s_update_own" on public.%1$I
        for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
    $f$, t);

    execute format($f$
      drop policy if exists "%1$s_delete_own" on public.%1$I;
      create policy "%1$s_delete_own" on public.%1$I
        for delete using (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;

-- profiles: keyed on id (= auth.users.id), not user_id.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Insert is normally handled by the handle_new_user() trigger (security definer),
-- but we allow self-insert as a safety net (e.g. manual repair).
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- nutrition_goals: keyed on user_id, single row per user.
alter table public.nutrition_goals enable row level security;

drop policy if exists "nutrition_goals_select_own" on public.nutrition_goals;
create policy "nutrition_goals_select_own" on public.nutrition_goals
  for select using (auth.uid() = user_id);

drop policy if exists "nutrition_goals_insert_own" on public.nutrition_goals;
create policy "nutrition_goals_insert_own" on public.nutrition_goals
  for insert with check (auth.uid() = user_id);

drop policy if exists "nutrition_goals_update_own" on public.nutrition_goals;
create policy "nutrition_goals_update_own" on public.nutrition_goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

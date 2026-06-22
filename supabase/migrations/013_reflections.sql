-- =====================================================================
-- 013 — Réflexion : carnet de notes / sujets à méditer
-- Une entrée = une réflexion (titre + corps libre) classée par sujet,
-- épinglable pour la garder en tête.
-- =====================================================================

create table if not exists public.reflections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default '',
  body        text not null default '',
  topic       text not null default 'Général',
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists reflections_user_idx
  on public.reflections(user_id, created_at desc);

-- RLS : chaque utilisateur ne voit/écrit que ses propres réflexions.
alter table public.reflections enable row level security;

drop policy if exists "reflections_select_own" on public.reflections;
create policy "reflections_select_own" on public.reflections
  for select using (auth.uid() = user_id);

drop policy if exists "reflections_insert_own" on public.reflections;
create policy "reflections_insert_own" on public.reflections
  for insert with check (auth.uid() = user_id);

drop policy if exists "reflections_update_own" on public.reflections;
create policy "reflections_update_own" on public.reflections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reflections_delete_own" on public.reflections;
create policy "reflections_delete_own" on public.reflections
  for delete using (auth.uid() = user_id);

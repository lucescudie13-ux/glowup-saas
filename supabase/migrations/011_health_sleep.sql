-- =====================================================================
-- 011 — Santé : suivi du sommeil
-- Une entrée = une période de sommeil (nuit ou récupération/sieste) avec
-- un nombre d'heures, pour un jour donné.
-- =====================================================================

create table if not exists public.sleep_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  sleep_date  date not null default current_date,
  hours       numeric(4,1) not null default 0 check (hours >= 0 and hours <= 24),
  kind        text not null default 'nuit' check (kind in ('nuit', 'recup')),
  note        text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists sleep_entries_user_date_idx
  on public.sleep_entries(user_id, sleep_date);

-- RLS : chaque utilisateur ne voit/écrit que ses propres entrées.
alter table public.sleep_entries enable row level security;

drop policy if exists "sleep_entries_select_own" on public.sleep_entries;
create policy "sleep_entries_select_own" on public.sleep_entries
  for select using (auth.uid() = user_id);

drop policy if exists "sleep_entries_insert_own" on public.sleep_entries;
create policy "sleep_entries_insert_own" on public.sleep_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "sleep_entries_update_own" on public.sleep_entries;
create policy "sleep_entries_update_own" on public.sleep_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sleep_entries_delete_own" on public.sleep_entries;
create policy "sleep_entries_delete_own" on public.sleep_entries
  for delete using (auth.uid() = user_id);

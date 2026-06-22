-- =====================================================================
-- 014 — Entraînement : mesures corporelles hebdomadaires
-- Une entrée = un relevé pour un jour donné. Toutes les mesures sont
-- optionnelles (NULL) pour autoriser les relevés partiels.
-- =====================================================================

create table if not exists public.measurements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  measure_date date not null default current_date,
  weight       numeric(5,1),  -- poids (kg)
  body_fat     numeric(4,1),  -- masse grasse (%)
  arm          numeric(4,1),  -- bras (cm)
  leg          numeric(4,1),  -- cuisse (cm)
  waist        numeric(4,1),  -- tour de taille (cm)
  shoulder     numeric(4,1),  -- épaules (cm)
  chest        numeric(4,1),  -- poitrine (cm)
  note         text not null default '',
  created_at   timestamptz not null default now()
);
create index if not exists measurements_user_date_idx
  on public.measurements(user_id, measure_date);

-- RLS : chaque utilisateur ne voit/écrit que ses propres mesures.
alter table public.measurements enable row level security;

drop policy if exists "measurements_select_own" on public.measurements;
create policy "measurements_select_own" on public.measurements
  for select using (auth.uid() = user_id);

drop policy if exists "measurements_insert_own" on public.measurements;
create policy "measurements_insert_own" on public.measurements
  for insert with check (auth.uid() = user_id);

drop policy if exists "measurements_update_own" on public.measurements;
create policy "measurements_update_own" on public.measurements
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "measurements_delete_own" on public.measurements;
create policy "measurements_delete_own" on public.measurements
  for delete using (auth.uid() = user_id);

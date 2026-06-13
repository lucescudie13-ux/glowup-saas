-- =====================================================================
-- 006 — Fréquence des routines
-- Sépare les routines en quotidiennes / hebdomadaires / mensuelles.
-- =====================================================================

alter table public.routines
  add column if not exists frequency text not null default 'daily'
  check (frequency in ('daily', 'weekly', 'monthly'));

create index if not exists routines_user_frequency_idx
  on public.routines(user_id, frequency);

-- =====================================================================
-- 010 — Niveaux / XP + série de routine + rappel
-- - xp : expérience cumulée (les actions en rapportent). Le niveau en
--   est déduit côté code via une courbe (100 niveaux max).
-- - routine_streak_* : série de jours où la routine quotidienne a été
--   complétée à 100 %.
-- - routine_deadline : heure limite (HH:MM) pour le rappel de routine.
-- =====================================================================

alter table public.profiles
  add column if not exists xp integer not null default 0 check (xp >= 0),
  add column if not exists routine_streak_count integer not null default 0,
  add column if not exists routine_streak_last_day date,
  add column if not exists routine_deadline text not null default '21:00';

-- Backfill : créditer rétroactivement l'XP des actions déjà accomplies.
-- XP d'une action = somme de ses deltas positifs (la part "progression").
update public.profiles p
set xp = coalesce((
  select sum(greatest((v.value)::int, 0))
  from public.actions a
  cross join lateral jsonb_each_text(a.deltas) as v(key, value)
  where a.user_id = p.id
), 0)
where p.xp = 0;

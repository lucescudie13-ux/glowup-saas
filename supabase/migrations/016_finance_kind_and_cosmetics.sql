-- =====================================================================
-- 016 — Finances : type d'objectif (obligation vs envie) + cosmétiques de niveau
-- - financial_goals.kind : 'obligation' (à payer, obligatoire) ou 'goal' (envie).
-- - profiles.equipped_* : cosmétiques équipés, débloqués selon le niveau.
-- =====================================================================

alter table public.financial_goals
  add column if not exists kind text not null default 'goal'
    check (kind in ('goal', 'obligation'));

alter table public.profiles
  add column if not exists equipped_frame  text,
  add column if not exists equipped_badge  text,
  add column if not exists equipped_accent text;

-- =====================================================================
-- 004 — Dépenses récurrentes
-- Ajoute un indicateur `recurring` sur finance_entries pour distinguer
-- les dépenses récurrentes (loyer, abonnements…) des mouvements ponctuels.
-- Les dépenses récurrentes sont comptées dans le total de chaque mois.
-- =====================================================================

alter table public.finance_entries
  add column if not exists recurring boolean not null default false;

-- Filtre fréquent : "mes dépenses récurrentes".
create index if not exists finance_entries_user_recurring_idx
  on public.finance_entries(user_id, recurring);

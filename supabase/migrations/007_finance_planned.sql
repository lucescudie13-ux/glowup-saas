-- =====================================================================
-- 007 — Prévisions budgétaires
-- Ajoute `planned` à finance_entries : couche de prévision (revenus/dépenses
-- planifiés à une date précise) séparée des mouvements réellement enregistrés.
-- =====================================================================

alter table public.finance_entries
  add column if not exists planned boolean not null default false;

create index if not exists finance_entries_user_planned_date_idx
  on public.finance_entries(user_id, planned, entry_date);

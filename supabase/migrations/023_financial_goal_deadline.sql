-- =====================================================================
-- 023 — Échéance (deadline) sur les objectifs / obligations financiers
--   Date cible optionnelle pour atteindre un objectif. Sert à simuler
--   l'épargne mensuelle nécessaire dans le budget (montant à mettre de
--   côté chaque mois pour y arriver à temps).
-- =====================================================================

alter table public.financial_goals
  add column if not exists deadline date;

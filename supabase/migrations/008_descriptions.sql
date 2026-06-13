-- =====================================================================
-- 008 — Descriptions éditables
-- Ajoute un champ `description` aux projets et aux objectifs financiers,
-- pour décrire/modifier chaque élément comme les objectifs.
-- =====================================================================

alter table public.projects
  add column if not exists description text not null default '';

alter table public.financial_goals
  add column if not exists description text not null default '';

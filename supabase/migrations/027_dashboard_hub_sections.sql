-- =====================================================================
-- 027 — Visibilité des points du « Journal de quêtes » sur le tableau de bord
--   • `profiles.dashboard_hub_sections` : liste des sous-points du Journal de
--     quêtes (tâches du jour, quêtes quotidiennes, autres tâches, hebdo,
--     mensuelles, spéciales) à afficher sur le tableau de bord. Réglable depuis
--     la page « Journal de quêtes » et synchronisé sur le compte.
--   Par défaut : tous les points sont affichés.
-- =====================================================================

alter table public.profiles
  add column if not exists dashboard_hub_sections text[] not null
    default '{tasks-today,routine-daily,tasks-other,routine-weekly,routine-monthly,quests-special}';

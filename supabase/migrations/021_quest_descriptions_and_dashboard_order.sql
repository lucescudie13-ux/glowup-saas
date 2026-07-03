-- =====================================================================
-- 021 — Descriptions de quêtes quotidiennes + ordre des blocs du tableau de bord
--   • `routines.description` : petite description éditable pour chaque quête
--     quotidienne, affichée sur la page Quêtes et sur le tableau de bord.
--   • `profiles.dashboard_order` : ordre personnalisé des blocs du tableau de
--     bord (liste de clés de section), réglable par glisser-déposer et
--     synchronisé sur le compte.
-- =====================================================================

alter table public.routines
  add column if not exists description text not null default '';

alter table public.profiles
  add column if not exists dashboard_order text[] not null default '{}';

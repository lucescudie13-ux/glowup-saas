-- =====================================================================
-- 028 — Échéances des tâches + réinitialisation des quêtes récurrentes
--   • `tasks.deadline` : échéance personnalisée (date + heure) pour les
--     « autres tâches ». Une tâche non faite après son échéance s'affiche en
--     rouge. Les tâches « du jour » utilisent la fin de leur journée de création.
--   • `routines.completed_at` : dernier moment où la quête récurrente a été
--     cochée. Sert à (1) la réinitialiser au début de chaque période
--     (jour / semaine / mois) et (2) l'afficher en rouge si la période
--     précédente s'est terminée sans qu'elle soit faite.
-- =====================================================================

alter table public.tasks
  add column if not exists deadline timestamptz;

alter table public.routines
  add column if not exists completed_at timestamptz;

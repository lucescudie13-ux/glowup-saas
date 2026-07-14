-- =====================================================================
-- 029 — Date de complétion des quêtes spéciales
--   • `quests.completed_at` : dernier moment où la quête a été cochée.
--     Sert aux statistiques « faites cette semaine / ce mois / cette année »
--     par date de complétion, comme les tâches et les routines.
--   Additif : les quêtes déjà faites n'ont pas de date rétroactive.
-- =====================================================================

alter table public.quests
  add column if not exists completed_at timestamptz;

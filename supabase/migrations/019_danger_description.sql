-- =====================================================================
-- 019 — Dangers : description (ce que ça cause) au lieu d'une note d'impact
-- L'impact 1–5 n'est plus utilisé dans l'UI ; on garde la colonne (inoffensive)
-- et on ajoute un texte de description.
-- =====================================================================

alter table public.dangers
  add column if not exists description text not null default '';

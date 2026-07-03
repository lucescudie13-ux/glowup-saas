-- =====================================================================
-- 024 — Image (photo) sur les objectifs / obligations financiers
--   Permet d'attacher une photo à un objectif pour le visualiser
--   (ex. la voiture, les vacances…). Stockée comme data URL compacte
--   (JPEG redimensionné côté client), comme les avatars.
-- =====================================================================

alter table public.financial_goals
  add column if not exists image text not null default '';

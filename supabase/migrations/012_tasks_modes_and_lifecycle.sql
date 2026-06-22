-- =====================================================================
-- 012 — Tâches : cycle de vie + modes de vue, et préférences de profil
-- - completed_at : horodatage de complétion (pour temps de travail + masquage J+1)
-- - urgent / important : axes de la matrice d'Eisenhower
-- - status : colonne Kanban (todo / doing / done)
-- - penalized : marqueur pour le malus quotidien (jamais pénalisé deux fois)
-- - profiles.tasks_mode : mode d'affichage des tâches choisi par l'utilisateur
-- - profiles.last_settled_day : dernier jour où le malus a été calculé
-- - profiles.ideal_photo_path : chemin Storage de la photo "physique idéal"
-- =====================================================================

alter table public.tasks
  add column if not exists completed_at timestamptz,
  add column if not exists urgent      boolean not null default false,
  add column if not exists important   boolean not null default true,
  add column if not exists status      text    not null default 'todo'
    check (status in ('todo', 'doing', 'done')),
  add column if not exists penalized   boolean not null default false;

create index if not exists tasks_user_completed_idx
  on public.tasks(user_id, completed_at);

alter table public.profiles
  add column if not exists tasks_mode       text not null default 'classic'
    check (tasks_mode in ('classic', 'eisenhower', 'kanban')),
  add column if not exists last_settled_day date,
  add column if not exists ideal_photo_path text;

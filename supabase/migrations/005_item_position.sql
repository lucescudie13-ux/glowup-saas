-- =====================================================================
-- 005 — Ordre manuel des éléments (drag & drop)
-- Ajoute une colonne `position` aux listes réordonnables et initialise
-- l'ordre existant à partir de la date de création (0-indexé par user).
-- =====================================================================

alter table public.tasks    add column if not exists position integer not null default 0;
alter table public.routines add column if not exists position integer not null default 0;
alter table public.quests   add column if not exists position integer not null default 0;

-- Backfill : ordre chronologique actuel → positions 0,1,2… par utilisateur.
update public.tasks t set position = s.rn
  from (select id, (row_number() over (partition by user_id order by created_at) - 1) as rn from public.tasks) s
  where t.id = s.id;

update public.routines r set position = s.rn
  from (select id, (row_number() over (partition by user_id order by created_at) - 1) as rn from public.routines) s
  where r.id = s.id;

update public.quests q set position = s.rn
  from (select id, (row_number() over (partition by user_id order by created_at) - 1) as rn from public.quests) s
  where q.id = s.id;

create index if not exists tasks_user_position_idx    on public.tasks(user_id, position);
create index if not exists routines_user_position_idx on public.routines(user_id, position);
create index if not exists quests_user_position_idx   on public.quests(user_id, position);

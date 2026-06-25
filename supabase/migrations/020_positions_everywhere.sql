-- =====================================================================
-- 020 — Réordonnancement (drag & drop) sur toutes les listes ajoutables
-- Ajoute une colonne `position` aux tables qui n'en avaient pas, avec un
-- ordre initial dérivé de created_at, + un index (user_id, position).
-- =====================================================================

-- dangers ----------------------------------------------------------------
alter table public.dangers add column if not exists position integer not null default 0;
with o as (select id, row_number() over (partition by user_id order by created_at) - 1 rn from public.dangers)
update public.dangers d set position = o.rn from o where o.id = d.id;
create index if not exists dangers_user_position_idx on public.dangers(user_id, position);

-- financial_goals --------------------------------------------------------
alter table public.financial_goals add column if not exists position integer not null default 0;
with o as (select id, row_number() over (partition by user_id order by created_at) - 1 rn from public.financial_goals)
update public.financial_goals d set position = o.rn from o where o.id = d.id;
create index if not exists financial_goals_user_position_idx on public.financial_goals(user_id, position);

-- reflections ------------------------------------------------------------
alter table public.reflections add column if not exists position integer not null default 0;
with o as (select id, row_number() over (partition by user_id order by created_at) - 1 rn from public.reflections)
update public.reflections d set position = o.rn from o where o.id = d.id;
create index if not exists reflections_user_position_idx on public.reflections(user_id, position);

-- finance_entries --------------------------------------------------------
alter table public.finance_entries add column if not exists position integer not null default 0;
with o as (select id, row_number() over (partition by user_id order by created_at) - 1 rn from public.finance_entries)
update public.finance_entries d set position = o.rn from o where o.id = d.id;
create index if not exists finance_entries_user_position_idx on public.finance_entries(user_id, position);

-- objectives -------------------------------------------------------------
alter table public.objectives add column if not exists position integer not null default 0;
with o as (select id, row_number() over (partition by user_id order by created_at) - 1 rn from public.objectives)
update public.objectives d set position = o.rn from o where o.id = d.id;
create index if not exists objectives_user_position_idx on public.objectives(user_id, position);

-- projects ---------------------------------------------------------------
alter table public.projects add column if not exists position integer not null default 0;
with o as (select id, row_number() over (partition by user_id order by created_at) - 1 rn from public.projects)
update public.projects d set position = o.rn from o where o.id = d.id;
create index if not exists projects_user_position_idx on public.projects(user_id, position);

-- mementos ---------------------------------------------------------------
alter table public.mementos add column if not exists position integer not null default 0;
with o as (select id, row_number() over (partition by user_id order by created_at) - 1 rn from public.mementos)
update public.mementos d set position = o.rn from o where o.id = d.id;
create index if not exists mementos_user_position_idx on public.mementos(user_id, position);

-- =====================================================================
-- 009 — Portée des tâches
-- Sépare les tâches en "du jour" (today) et "autres" (other).
-- =====================================================================

alter table public.tasks
  add column if not exists scope text not null default 'today'
  check (scope in ('today', 'other'));

create index if not exists tasks_user_scope_idx
  on public.tasks(user_id, scope);

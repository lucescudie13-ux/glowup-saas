-- =====================================================================
-- 022 — Bilan mensuel (monthly report)
--   Un bilan par mois et par utilisateur : notes d'auto-réflexion sur le
--   mois écoulé (objectifs atteints ?) + définition des objectifs du mois
--   suivant. Les cibles du mois et les objectifs de l'année restent portés
--   par la table `objectives` ; ici on ne stocke que le texte réflexif.
--   Ajoute aussi `profiles.pref_monthly` pour la notification push mensuelle.
-- =====================================================================

create table if not exists public.monthly_reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  month         text not null,                    -- 'YYYY-MM'
  review_notes  text not null default '',         -- réflexion : objectifs atteints ?
  next_goals    text not null default '',         -- plan des objectifs du mois suivant
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, month)
);
create index if not exists monthly_reports_user_month_idx
  on public.monthly_reports(user_id, month desc);

-- RLS : chacun ne voit/écrit que ses propres bilans.
alter table public.monthly_reports enable row level security;

drop policy if exists "monthly_reports_select_own" on public.monthly_reports;
create policy "monthly_reports_select_own" on public.monthly_reports
  for select using (auth.uid() = user_id);

drop policy if exists "monthly_reports_insert_own" on public.monthly_reports;
create policy "monthly_reports_insert_own" on public.monthly_reports
  for insert with check (auth.uid() = user_id);

drop policy if exists "monthly_reports_update_own" on public.monthly_reports;
create policy "monthly_reports_update_own" on public.monthly_reports
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "monthly_reports_delete_own" on public.monthly_reports;
create policy "monthly_reports_delete_own" on public.monthly_reports
  for delete using (auth.uid() = user_id);

-- Notification push mensuelle (bilan) — désactivée par défaut.
alter table public.profiles
  add column if not exists pref_monthly boolean not null default false;

-- =====================================================================
-- 017 — Personnage : catégories de stats + sous-stats, et échéances Memento
-- - stats.category : regroupe chaque stat en physique / mental / personnel,
--   plus 'energie' (jauge autonome).
-- - 4 nouvelles sous-stats (esthétique, beauté, confiance, valeurs).
-- - mementos.expires_at : date d'échéance pour le compte à rebours.
-- =====================================================================

-- ---- stats.category -------------------------------------------------------
alter table public.stats
  add column if not exists category text not null default 'personnel'
    check (category in ('physique', 'mental', 'personnel', 'energie'));

-- Range les stats par défaut existantes dans leur catégorie.
update public.stats set category = 'physique'  where key in ('force', 'endurance');
update public.stats set category = 'mental'    where key in ('discipline', 'mental');
update public.stats set category = 'personnel' where key in ('social', 'humour', 'culture');
update public.stats set category = 'energie'   where key = 'energie';

-- Renomme "Mental" -> "Clarté mentale" (le mot "Mental" devient la catégorie).
update public.stats set name = 'Clarté mentale' where key = 'mental' and name = 'Mental';

-- Ajoute les 4 nouvelles sous-stats à tous les utilisateurs existants.
insert into public.stats (user_id, key, name, value, is_custom, category)
select u.id, v.key, v.name, 50, false, v.category
from auth.users u
cross join (values
  ('esthetique', 'Esthétique', 'physique'),
  ('beaute',     'Beauté',     'physique'),
  ('confiance',  'Confiance',  'mental'),
  ('valeurs',    'Valeurs',    'mental')
) as v(key, name, category)
on conflict (user_id, key) do nothing;

-- ---- mementos.expires_at --------------------------------------------------
alter table public.mementos
  add column if not exists expires_at date;

-- ---- Met à jour le seeding des nouveaux comptes ---------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', 'Mon perso')
  )
  on conflict (id) do nothing;

  insert into public.nutrition_goals (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.stats (user_id, key, name, value, is_custom, category) values
    (new.id, 'force',      'Force',                50, false, 'physique'),
    (new.id, 'endurance',  'Endurance',            50, false, 'physique'),
    (new.id, 'esthetique', 'Esthétique',           50, false, 'physique'),
    (new.id, 'beaute',     'Beauté',               50, false, 'physique'),
    (new.id, 'confiance',  'Confiance',            50, false, 'mental'),
    (new.id, 'valeurs',    'Valeurs',              50, false, 'mental'),
    (new.id, 'discipline', 'Discipline',           50, false, 'mental'),
    (new.id, 'mental',     'Clarté mentale',       50, false, 'mental'),
    (new.id, 'social',     'Intelligence sociale', 50, false, 'personnel'),
    (new.id, 'humour',     'Humour',               50, false, 'personnel'),
    (new.id, 'culture',    'Culture générale',     50, false, 'personnel'),
    (new.id, 'energie',    'Énergie',              50, false, 'energie')
  on conflict (user_id, key) do nothing;

  return new;
end;
$$;

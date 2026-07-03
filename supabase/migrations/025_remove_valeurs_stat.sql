-- =====================================================================
-- 025 — Retire la sous-stat par défaut « Valeurs »
--   Supprime les lignes existantes et l'enlève du seeding des nouveaux
--   comptes (fonction handle_new_user).
-- =====================================================================

delete from public.stats where key = 'valeurs';

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

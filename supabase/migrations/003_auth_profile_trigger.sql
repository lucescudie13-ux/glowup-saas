-- 003_auth_profile_trigger.sql
-- On signup: create the profile, seed the 8 default stats and the default
-- nutrition goals. Plus a generic updated_at trigger.

-- ---- updated_at -----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists nutrition_goals_set_updated_at on public.nutrition_goals;
create trigger nutrition_goals_set_updated_at
  before update on public.nutrition_goals
  for each row execute function public.set_updated_at();

-- ---- handle_new_user ------------------------------------------------------
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

  insert into public.stats (user_id, key, name, value, is_custom) values
    (new.id, 'force',      'Force',                50, false),
    (new.id, 'endurance',  'Endurance',            50, false),
    (new.id, 'energie',    'Énergie',              50, false),
    (new.id, 'social',     'Intelligence sociale', 50, false),
    (new.id, 'humour',     'Humour',               50, false),
    (new.id, 'culture',    'Culture générale',     50, false),
    (new.id, 'discipline', 'Discipline',           50, false),
    (new.id, 'mental',     'Mental',               50, false)
  on conflict (user_id, key) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

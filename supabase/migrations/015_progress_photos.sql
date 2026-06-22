-- =====================================================================
-- 015 — Physique : photos de progression hebdomadaires
-- Une entrée = une photo (pose front/back/side, contractée ou non) pour
-- un jour donné. Le fichier vit dans le bucket Storage "progress-photos",
-- la ligne ne stocke que son chemin. Le "physique idéal" est stocké à
-- part via profiles.ideal_photo_path (cf. 012).
-- =====================================================================

create table if not exists public.progress_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  photo_date   date not null default current_date,
  pose         text not null check (pose in ('front', 'back', 'side')),
  contracted   boolean not null default false,
  storage_path text not null,
  created_at   timestamptz not null default now()
);
create index if not exists progress_photos_user_date_idx
  on public.progress_photos(user_id, photo_date);

-- RLS : chaque utilisateur ne voit/écrit que ses propres photos.
alter table public.progress_photos enable row level security;

drop policy if exists "progress_photos_select_own" on public.progress_photos;
create policy "progress_photos_select_own" on public.progress_photos
  for select using (auth.uid() = user_id);

drop policy if exists "progress_photos_insert_own" on public.progress_photos;
create policy "progress_photos_insert_own" on public.progress_photos
  for insert with check (auth.uid() = user_id);

drop policy if exists "progress_photos_update_own" on public.progress_photos;
create policy "progress_photos_update_own" on public.progress_photos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "progress_photos_delete_own" on public.progress_photos;
create policy "progress_photos_delete_own" on public.progress_photos
  for delete using (auth.uid() = user_id);

-- =====================================================================
-- Storage : bucket privé "progress-photos".
-- Les fichiers sont rangés par utilisateur : "<user_id>/...". Les policies
-- n'autorisent l'accès qu'au dossier dont le nom = l'uid de l'utilisateur.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

drop policy if exists "progress_photos_storage_select" on storage.objects;
create policy "progress_photos_storage_select" on storage.objects
  for select using (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "progress_photos_storage_insert" on storage.objects;
create policy "progress_photos_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "progress_photos_storage_update" on storage.objects;
create policy "progress_photos_storage_update" on storage.objects
  for update using (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "progress_photos_storage_delete" on storage.objects;
create policy "progress_photos_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

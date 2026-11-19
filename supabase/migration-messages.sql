-- Messages privés, conseils de titres, vocaux et vidéos.
-- À coller une seule fois dans Supabase > SQL Editor, puis Run. Sans danger si relancé.
-- Demande d'abord que migration-amis, migration-playlists et migration-commentaires soient faites.

-- 1. Espace de stockage privé pour les vocaux et vidéos (15 Mo max par fichier).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 15728640,
  array['audio/mp4','audio/webm','audio/ogg','audio/mpeg','audio/aac','audio/x-m4a','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = 15728640,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Messages entre amis : texte, vocal, vidéo, ou conseil d'un titre.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null default auth.uid() references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  title_id text references public.titles(id) on delete cascade,
  media_path text,
  media_kind text check (media_kind in ('voice', 'video', 'expired')),
  media_secs int,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (from_user <> to_user)
);
create index if not exists messages_to on public.messages (to_user, from_user, created_at);
create index if not exists messages_from on public.messages (from_user, to_user, created_at);

-- Les vocaux et vidéos aussi dans les commentaires et réponses des playlists.
alter table public.playlist_comments add column if not exists media_path text;
alter table public.playlist_comments add column if not exists media_kind text;
alter table public.playlist_comments add column if not exists media_secs int;
alter table public.playlist_comments add column if not exists expires_at timestamptz;
alter table public.playlist_replies add column if not exists media_path text;
alter table public.playlist_replies add column if not exists media_kind text;
alter table public.playlist_replies add column if not exists media_secs int;
alter table public.playlist_replies add column if not exists expires_at timestamptz;

-- Une vidéo disparaît au bout de 15 jours. Les vocaux restent.
create or replace function public.set_media_expiry()
returns trigger language plpgsql as $$
begin
  if new.media_kind = 'video' and new.expires_at is null then new.expires_at := now() + interval '15 days'; end if;
  return new;
end $$;
drop trigger if exists messages_expiry on public.messages;
create trigger messages_expiry before insert on public.messages for each row execute function public.set_media_expiry();
drop trigger if exists comments_expiry on public.playlist_comments;
create trigger comments_expiry before insert on public.playlist_comments for each row execute function public.set_media_expiry();
drop trigger if exists replies_expiry on public.playlist_replies;
create trigger replies_expiry before insert on public.playlist_replies for each row execute function public.set_media_expiry();

alter table public.messages enable row level security;
drop policy if exists "envoyer un message" on public.messages;
create policy "envoyer un message" on public.messages for insert to authenticated
  with check (from_user = auth.uid() and public.are_friends(auth.uid(), to_user)
              and (media_path is null or media_path like auth.uid()::text || '/%'));
drop policy if exists "lire mes messages" on public.messages;
create policy "lire mes messages" on public.messages for select to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());
drop policy if exists "supprimer mon message" on public.messages;
create policy "supprimer mon message" on public.messages for delete to authenticated using (from_user = auth.uid());
grant select, insert, delete on public.messages to authenticated;

-- Les commentaires et réponses : le fichier doit être dans le dossier de son auteur.
drop policy if exists "écrire un commentaire" on public.playlist_comments;
create policy "écrire un commentaire" on public.playlist_comments for insert to authenticated
  with check (user_id = auth.uid() and public.is_member(playlist_id, auth.uid())
              and (media_path is null or media_path like auth.uid()::text || '/%'));
drop policy if exists "répondre" on public.playlist_replies;
create policy "répondre" on public.playlist_replies for insert to authenticated
  with check (user_id = auth.uid() and public.can_see_comment(comment_id)
              and (media_path is null or media_path like auth.uid()::text || '/%'));

-- Marquer la conversation avec un ami comme lue.
create or replace function public.mark_read(friend uuid)
returns void language sql security definer set search_path = public as $$
  update public.messages set read_at = now() where to_user = auth.uid() and from_user = friend and read_at is null;
$$;

-- Nettoyage : mes vidéos de plus de 15 jours sont retirées (la ligne reste, le fichier est à supprimer par l'appli).
create or replace function public.expire_my_media()
returns setof text language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select 'messages'::text as t, id, media_path from public.messages
           where from_user = auth.uid() and media_kind = 'video' and expires_at < now() and media_path is not null
         union all select 'playlist_comments', id, media_path from public.playlist_comments
           where user_id = auth.uid() and media_kind = 'video' and expires_at < now() and media_path is not null
         union all select 'playlist_replies', id, media_path from public.playlist_replies
           where user_id = auth.uid() and media_kind = 'video' and expires_at < now() and media_path is not null
  loop
    if r.t = 'messages' then update public.messages set media_kind = 'expired', media_path = null where id = r.id;
    elsif r.t = 'playlist_comments' then update public.playlist_comments set media_kind = 'expired', media_path = null where id = r.id;
    else update public.playlist_replies set media_kind = 'expired', media_path = null where id = r.id; end if;
    return next r.media_path;
  end loop;
end $$;

-- Les commentaires d'une playlist, avec leur média (vidéo expirée = plus de média).
drop function if exists public.playlist_comments_for(uuid);
create or replace function public.playlist_comments_for(pid uuid)
returns table (id uuid, user_id uuid, title_id text, season int, episode int, body text, feel text[], visible_to uuid[], visible boolean, created_at timestamptz,
               media_path text, media_kind text, media_secs int, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.id, c.user_id, c.title_id, c.season, c.episode,
         case when c.user_id = auth.uid() or public.reached(c.title_id, c.season, c.episode) then c.body else '' end,
         case when c.user_id = auth.uid() or public.reached(c.title_id, c.season, c.episode) then c.feel else '{}'::text[] end,
         c.visible_to,
         (c.user_id = auth.uid() or public.reached(c.title_id, c.season, c.episode)),
         c.created_at,
         case when c.user_id = auth.uid() or public.reached(c.title_id, c.season, c.episode) then c.media_path end,
         c.media_kind, c.media_secs, c.expires_at
  from public.playlist_comments c
  where c.playlist_id = pid and public.is_member(pid, auth.uid())
    and (c.user_id = auth.uid() or c.visible_to is null or cardinality(c.visible_to) = 0 or auth.uid() = any (c.visible_to))
  order by c.season, c.episode, c.created_at;
$$;

-- Qui peut lire un fichier : son auteur, le destinataire d'un message, ceux qui peuvent voir le commentaire.
create or replace function public.media_visible(path text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.messages m where m.media_path = path and m.to_user = auth.uid() and (m.expires_at is null or m.expires_at > now()))
      or exists (select 1 from public.playlist_comments c where c.media_path = path and public.can_see_comment(c.id) and (c.expires_at is null or c.expires_at > now()))
      or exists (select 1 from public.playlist_replies r where r.media_path = path and public.can_see_comment(r.comment_id) and (r.expires_at is null or r.expires_at > now()));
$$;

drop policy if exists "media: envoyer" on storage.objects;
create policy "media: envoyer" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "media: lire" on storage.objects;
create policy "media: lire" on storage.objects for select to authenticated
  using (bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.media_visible(name)));
drop policy if exists "media: supprimer les miens" on storage.objects;
create policy "media: supprimer les miens" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

revoke all on function public.mark_read(uuid), public.expire_my_media(), public.playlist_comments_for(uuid), public.media_visible(text) from public, anon;
grant execute on function public.mark_read(uuid), public.expire_my_media(), public.playlist_comments_for(uuid), public.media_visible(text) to authenticated;

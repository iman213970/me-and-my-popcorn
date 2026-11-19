-- Commentaires partagés : visibilité du journal, commentaires de playlist, réponses.
-- À coller une seule fois dans Supabase > SQL Editor, puis Run. Sans danger si relancé.
-- Demande d'abord que migration-amis.sql et migration-playlists.sql soient faites.

-- 1. Journal de la fiche : chaque commentaire est Moi (privé), Amis ou Public. Les anciens restent privés.
alter table public.episode_notes add column if not exists vis text not null default 'Moi';
alter table public.episode_notes drop constraint if exists episode_notes_vis_check;
alter table public.episode_notes add constraint episode_notes_vis_check check (vis in ('Moi', 'Amis', 'Public'));

-- L'ancienne fonction montrait le journal privé aux membres d'une playlist : on la supprime.
drop function if exists public.playlist_notes(uuid);

-- Position d'un épisode dans toute la série, et « ai-je atteint cet épisode ? » (film : l'ai-je vu ?).
create or replace function public.reached(tid text, s int, e int)
returns boolean language sql stable security definer set search_path = public as $$
  select case when s = 0 then coalesce((select watched from public.entries where user_id = auth.uid() and title_id = tid), 0) >= 1
    else coalesce((select watched from public.entries where user_id = auth.uid() and title_id = tid), 0)
         >= coalesce((select sum(x) from public.titles t, unnest(t.eps[1:greatest(s - 1, 0)]) x where t.id = tid), 0) + e
  end;
$$;

-- Journal partagé d'un ami : commentaires en Amis ou Public, texte masqué tant que je n'ai pas atteint l'épisode.
create or replace function public.friend_notes(friend uuid)
returns table (id uuid, title_id text, season int, episode int, body text, feel text[], visible boolean, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select n.id, n.title_id, n.season, n.episode,
         case when public.reached(n.title_id, n.season, n.episode) then n.body else '' end,
         case when public.reached(n.title_id, n.season, n.episode) then n.feel else '{}'::text[] end,
         public.reached(n.title_id, n.season, n.episode), n.created_at
  from public.episode_notes n
  where n.user_id = friend and n.vis in ('Amis', 'Public') and public.are_friends(auth.uid(), friend);
$$;

-- 2. Commentaires de playlist. visible_to vide ou nul = tous les membres de la playlist.
create table if not exists public.playlist_comments (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  title_id text not null references public.titles(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  season int not null default 0,
  episode int not null default 0,
  body text not null default '',
  feel text[] not null default '{}',
  visible_to uuid[],
  created_at timestamptz not null default now()
);
create index if not exists playlist_comments_pl on public.playlist_comments (playlist_id, title_id);

create table if not exists public.playlist_replies (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.playlist_comments(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists playlist_replies_c on public.playlist_replies (comment_id);

alter table public.playlist_comments enable row level security;
alter table public.playlist_replies enable row level security;

-- Puis-je voir ce commentaire ? (le mien, ou membre ciblé qui a atteint l'épisode)
create or replace function public.can_see_comment(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.playlist_comments c
    where c.id = cid and public.is_member(c.playlist_id, auth.uid())
      and (c.user_id = auth.uid()
           or ((c.visible_to is null or cardinality(c.visible_to) = 0 or auth.uid() = any (c.visible_to))
               and public.reached(c.title_id, c.season, c.episode)))
  );
$$;

drop policy if exists "écrire un commentaire" on public.playlist_comments;
create policy "écrire un commentaire" on public.playlist_comments for insert to authenticated
  with check (user_id = auth.uid() and public.is_member(playlist_id, auth.uid()));
drop policy if exists "mes commentaires de playlist" on public.playlist_comments;
create policy "mes commentaires de playlist" on public.playlist_comments for select to authenticated using (user_id = auth.uid());
drop policy if exists "modifier mon commentaire" on public.playlist_comments;
create policy "modifier mon commentaire" on public.playlist_comments for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member(playlist_id, auth.uid()));
drop policy if exists "supprimer mon commentaire" on public.playlist_comments;
create policy "supprimer mon commentaire" on public.playlist_comments for delete to authenticated using (user_id = auth.uid());

drop policy if exists "répondre" on public.playlist_replies;
create policy "répondre" on public.playlist_replies for insert to authenticated
  with check (user_id = auth.uid() and public.can_see_comment(comment_id));
drop policy if exists "voir les réponses" on public.playlist_replies;
create policy "voir les réponses" on public.playlist_replies for select to authenticated using (public.can_see_comment(comment_id));
drop policy if exists "supprimer ma réponse" on public.playlist_replies;
create policy "supprimer ma réponse" on public.playlist_replies for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.playlist_comments to authenticated;
grant select, insert, delete on public.playlist_replies to authenticated;

-- Les commentaires d'une playlist, texte masqué tant que je n'ai pas atteint l'épisode.
-- Ceux qui ne me sont pas destinés ne sont pas renvoyés du tout.
create or replace function public.playlist_comments_for(pid uuid)
returns table (id uuid, user_id uuid, title_id text, season int, episode int, body text, feel text[], visible_to uuid[], visible boolean, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.id, c.user_id, c.title_id, c.season, c.episode,
         case when c.user_id = auth.uid() or public.reached(c.title_id, c.season, c.episode) then c.body else '' end,
         case when c.user_id = auth.uid() or public.reached(c.title_id, c.season, c.episode) then c.feel else '{}'::text[] end,
         c.visible_to,
         (c.user_id = auth.uid() or public.reached(c.title_id, c.season, c.episode)),
         c.created_at
  from public.playlist_comments c
  where c.playlist_id = pid and public.is_member(pid, auth.uid())
    and (c.user_id = auth.uid() or c.visible_to is null or cardinality(c.visible_to) = 0 or auth.uid() = any (c.visible_to))
  order by c.season, c.episode, c.created_at;
$$;

-- Playlists que je partage avec un ami.
create or replace function public.shared_playlists_with(friend uuid)
returns table (id uuid, name text)
language sql stable security definer set search_path = public as $$
  select p.id, p.name from public.playlists p
  where public.is_member(p.id, auth.uid()) and public.is_member(p.id, friend) and public.are_friends(auth.uid(), friend)
  order by p.created_at;
$$;

revoke all on function public.reached(text, int, int), public.friend_notes(uuid), public.can_see_comment(uuid),
  public.playlist_comments_for(uuid), public.shared_playlists_with(uuid) from public, anon;
grant execute on function public.reached(text, int, int), public.friend_notes(uuid), public.can_see_comment(uuid),
  public.playlist_comments_for(uuid), public.shared_playlists_with(uuid) to authenticated;

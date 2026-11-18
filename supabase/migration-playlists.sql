-- Playlists (perso et partagées avec des amis).
-- À coller une seule fois dans Supabase > SQL Editor, puis Run. Sans danger si relancé.
-- Demande d'abord que la migration des amis (migration-amis.sql) soit faite.

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null default 'Ma playlist',
  created_at timestamptz not null default now()
);

-- Une ligne par personne dans une playlist (le créateur y est aussi).
-- Les deux interrupteurs de l'accueil sont propres à chaque personne.
create table if not exists public.playlist_members (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  in_time boolean not null default false,
  in_releases boolean not null default false,
  can_edit boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (playlist_id, user_id)
);

create table if not exists public.playlist_items (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  title_id text not null references public.titles(id) on delete cascade,
  position int not null default 0,
  added_by uuid default auth.uid() references auth.users(id) on delete set null,
  primary key (playlist_id, title_id)
);

-- Messages pour les membres quand le créateur supprime une playlist.
create table if not exists public.playlist_notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.playlists enable row level security;
alter table public.playlist_members enable row level security;
alter table public.playlist_items enable row level security;
alter table public.playlist_notices enable row level security;

create or replace function public.is_member(pid uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.playlist_members where playlist_id = pid and user_id = uid);
$$;
create or replace function public.can_edit_pl(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.playlist_members where playlist_id = pid and user_id = auth.uid() and can_edit);
$$;
create or replace function public.is_owner(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.playlists where id = pid and owner = auth.uid());
$$;

-- Playlists : visibles par leurs membres, modifiables (nom) par ceux qui ont le droit.
-- Pas de suppression directe : elle passe par delete_playlist (qui prévient les membres).
drop policy if exists "voir mes playlists" on public.playlists;
create policy "voir mes playlists" on public.playlists for select to authenticated
  using (owner = auth.uid() or public.is_member(id, auth.uid()));
drop policy if exists "créer une playlist" on public.playlists;
create policy "créer une playlist" on public.playlists for insert to authenticated with check (owner = auth.uid());
drop policy if exists "renommer une playlist" on public.playlists;
create policy "renommer une playlist" on public.playlists for update to authenticated
  using (public.can_edit_pl(id)) with check (public.can_edit_pl(id));

-- Membres : seul le créateur invite (et seulement ses amis), chacun règle ses interrupteurs et peut quitter.
drop policy if exists "voir les membres" on public.playlist_members;
create policy "voir les membres" on public.playlist_members for select to authenticated
  using (public.is_member(playlist_id, auth.uid()));
drop policy if exists "inviter" on public.playlist_members;
create policy "inviter" on public.playlist_members for insert to authenticated
  with check (public.is_owner(playlist_id) and (user_id = auth.uid() or public.are_friends(auth.uid(), user_id)));
drop policy if exists "mes réglages" on public.playlist_members;
create policy "mes réglages" on public.playlist_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "quitter ou retirer" on public.playlist_members;
create policy "quitter ou retirer" on public.playlist_members for delete to authenticated
  using (user_id = auth.uid() or public.is_owner(playlist_id));

-- Titres de la playlist.
drop policy if exists "voir les titres" on public.playlist_items;
create policy "voir les titres" on public.playlist_items for select to authenticated
  using (public.is_member(playlist_id, auth.uid()));
drop policy if exists "ajouter un titre" on public.playlist_items;
create policy "ajouter un titre" on public.playlist_items for insert to authenticated
  with check (public.can_edit_pl(playlist_id));
drop policy if exists "ranger les titres" on public.playlist_items;
create policy "ranger les titres" on public.playlist_items for update to authenticated
  using (public.can_edit_pl(playlist_id)) with check (public.can_edit_pl(playlist_id));
drop policy if exists "retirer un titre" on public.playlist_items;
create policy "retirer un titre" on public.playlist_items for delete to authenticated
  using (public.can_edit_pl(playlist_id));

-- Messages : chacun voit et efface les siens.
drop policy if exists "mes messages" on public.playlist_notices;
create policy "mes messages" on public.playlist_notices for select to authenticated using (user_id = auth.uid());
drop policy if exists "effacer mes messages" on public.playlist_notices;
create policy "effacer mes messages" on public.playlist_notices for delete to authenticated using (user_id = auth.uid());

grant select, insert, update on public.playlists to authenticated;
grant select, insert, delete on public.playlist_members to authenticated;
grant update (in_time, in_releases) on public.playlist_members to authenticated;
grant select, insert, update, delete on public.playlist_items to authenticated;
grant select, delete on public.playlist_notices to authenticated;

-- Le créateur supprime pour tout le monde : les autres sont prévenus.
create or replace function public.delete_playlist(pid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare pname text; who text;
begin
  select name into pname from public.playlists where id = pid and owner = auth.uid();
  if pname is null then raise exception 'Seul le créateur peut supprimer cette playlist'; end if;
  select coalesce(nullif(pseudo, ''), 'Quelqu''un') into who from public.profiles where id = auth.uid();
  insert into public.playlist_notices (user_id, body)
    select user_id, coalesce(who, 'Quelqu''un') || ' a supprimé la playlist « ' || pname || ' ». Tes séries et films restent dans ta liste.'
    from public.playlist_members where playlist_id = pid and user_id <> auth.uid();
  delete from public.playlists where id = pid;
end $$;

-- Le créateur décide si un membre peut ajouter, ranger et retirer des titres.
create or replace function public.set_member_edit(pid uuid, uid uuid, val boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner(pid) then raise exception 'Seul le créateur peut changer les droits'; end if;
  update public.playlist_members set can_edit = val where playlist_id = pid and user_id = uid and user_id <> auth.uid();
end $$;

-- Progression de chaque membre sur les titres de la playlist (la course).
create or replace function public.playlist_progress(pid uuid)
returns table (user_id uuid, title_id text, watched int, status text)
language sql stable security definer set search_path = public as $$
  select e.user_id, e.title_id, e.watched, e.status
  from public.playlist_items i
  join public.playlist_members m on m.playlist_id = i.playlist_id
  join public.entries e on e.user_id = m.user_id and e.title_id = i.title_id
  where i.playlist_id = pid and public.is_member(pid, auth.uid());
$$;

-- Commentaires des autres membres : le texte n'est donné que si tu as atteint cet épisode
-- (ou vu le film). Sinon la ligne est renvoyée vide avec visible = false, pour afficher « verrouillé ».
create or replace function public.playlist_notes(pid uuid)
returns table (id uuid, user_id uuid, title_id text, season int, episode int, body text, feel text[], visible boolean)
language sql stable security definer set search_path = public as $$
  with x as (
    select n.*, coalesce(me.watched, 0) as mine,
           coalesce((select sum(s) from unnest(t.eps[1:greatest(n.season - 1, 0)]) s), 0) + n.episode as pos
    from public.episode_notes n
    join public.playlist_items i on i.title_id = n.title_id and i.playlist_id = pid
    join public.titles t on t.id = n.title_id
    left join public.entries me on me.user_id = auth.uid() and me.title_id = n.title_id
    where n.user_id <> auth.uid() and public.is_member(pid, n.user_id) and public.is_member(pid, auth.uid())
  )
  select x.id, x.user_id, x.title_id, x.season, x.episode,
         case when v.ok then x.body else '' end, case when v.ok then x.feel else '{}'::text[] end, v.ok
  from x, lateral (select case when x.season = 0 then x.mine >= 1 else x.mine >= x.pos end as ok) v;
$$;

revoke all on function public.is_member(uuid, uuid), public.can_edit_pl(uuid), public.is_owner(uuid),
  public.delete_playlist(uuid), public.set_member_edit(uuid, uuid, boolean),
  public.playlist_progress(uuid), public.playlist_notes(uuid) from public, anon;
grant execute on function public.is_member(uuid, uuid), public.can_edit_pl(uuid), public.is_owner(uuid),
  public.delete_playlist(uuid), public.set_member_edit(uuid, uuid, boolean),
  public.playlist_progress(uuid), public.playlist_notes(uuid) to authenticated;

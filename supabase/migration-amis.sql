-- Amis (cercle fermé) : demandes, profils lisibles par les personnes connectées,
-- et lecture de la liste d'un ami en respectant la visibilité de ses avis.
-- À coller une seule fois dans Supabase > SQL Editor, puis Run. Sans danger si relancé.

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null default auth.uid() references auth.users(id) on delete cascade,
  addressee uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester <> addressee),
  unique (requester, addressee)
);

alter table public.friendships enable row level security;

drop policy if exists "voir mes amitiés" on public.friendships;
create policy "voir mes amitiés" on public.friendships for select to authenticated
  using (requester = auth.uid() or addressee = auth.uid());

drop policy if exists "demander un ami" on public.friendships;
create policy "demander un ami" on public.friendships for insert to authenticated
  with check (requester = auth.uid() and status = 'pending');

drop policy if exists "accepter une demande" on public.friendships;
create policy "accepter une demande" on public.friendships for update to authenticated
  using (addressee = auth.uid()) with check (addressee = auth.uid());

drop policy if exists "retirer une amitié" on public.friendships;
create policy "retirer une amitié" on public.friendships for delete to authenticated
  using (requester = auth.uid() or addressee = auth.uid());

grant select, insert, update, delete on public.friendships to authenticated;

-- Les personnes connectées peuvent voir les profils (pseudo, avatar, bio) : le cercle est fermé.
drop policy if exists "profils lisibles" on public.profiles;
create policy "profils lisibles" on public.profiles for select to authenticated using (true);

create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted' and ((requester = a and addressee = b) or (requester = b and addressee = a))
  );
$$;

-- La liste d'un ami : l'avis, la citation, le personnage et le moment ne sont visibles
-- que si l'ami a choisi "Amis" ou "Public" pour ce titre.
create or replace function public.friend_entries(friend uuid)
returns table (title_id text, status text, watched int, plat text, fav boolean, note int,
               avis text, cit text, perso text, moment text, vis text, ressenti text[])
language sql stable security definer set search_path = public as $$
  select e.title_id, e.status, e.watched, e.plat, e.fav, e.note,
         case when e.vis in ('Amis', 'Public') then e.avis else '' end,
         case when e.vis in ('Amis', 'Public') then e.cit else '' end,
         case when e.vis in ('Amis', 'Public') then e.perso else '' end,
         case when e.vis in ('Amis', 'Public') then e.moment else '' end,
         e.vis, e.ressenti
  from public.entries e
  where e.user_id = friend and public.are_friends(auth.uid(), friend);
$$;

revoke all on function public.friend_entries(uuid) from public, anon;
grant execute on function public.friend_entries(uuid) to authenticated;
revoke all on function public.are_friends(uuid, uuid) from public, anon;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

-- Me and my popcorn : tables, règles de sécurité et catalogue d'exemple
-- À coller une seule fois dans Supabase > SQL Editor, puis Run.

create table if not exists public.titles (
  id text primary key,
  title text not null,
  type text not null check (type in ('Série','Film')),
  genre text not null,
  year int not null,
  dur int not null,
  dir text not null default '',
  diff text not null default '',
  c text[] not null,
  eps int[] not null,
  sum text not null default ''
);

create table if not exists public.entries (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title_id text not null references public.titles(id) on delete cascade,
  status text not null default 'À regarder',
  watched int not null default 0,
  start_date text not null default '',
  end_date text not null default '',
  plat text not null default '',
  fav boolean not null default false,
  note int not null default 0 check (note between 0 and 10),
  avis text not null default '',
  cit text not null default '',
  perso text not null default '',
  moment text not null default '',
  vis text not null default 'Amis',
  created_at timestamptz not null default now(),
  primary key (user_id, title_id)
);

create table if not exists public.profiles (
  id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  pseudo text not null default '',
  bio text not null default '',
  pub boolean not null default true,
  avatar int not null default 0,
  genres text[] not null default '{}',
  plats text[] not null default '{}',
  custom_plats text[] not null default '{}'
);

alter table public.titles enable row level security;
alter table public.entries enable row level security;
alter table public.profiles enable row level security;

-- Catalogue : tout le monde peut lire, personne ne peut modifier depuis l'appli.
drop policy if exists "catalogue lisible" on public.titles;
create policy "catalogue lisible" on public.titles for select using (true);

-- Ma liste : chacun ne voit et ne modifie que ses propres lignes.
drop policy if exists "ma liste" on public.entries;
create policy "ma liste" on public.entries for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Profil : chacun ne voit et ne modifie que le sien (les amis viendront plus tard).
drop policy if exists "mon profil" on public.profiles;
create policy "mon profil" on public.profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select on public.titles to anon, authenticated;
grant select, insert, update, delete on public.entries to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;

-- Suppression de compte depuis l'appli (obligatoire pour l'App Store).
create or replace function public.delete_my_account()
returns void language sql security definer set search_path = public as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Catalogue d'exemple (10 titres)
insert into public.titles (id,title,type,genre,year,dur,dir,diff,c,eps,sum) values
('onepiece','One Piece','Série','Manga',1999,24,'Eiichirō Oda','En cours','{#1F4E79,#0D1F36}','{61,16,15,38,13,52,33,35,73,45,26,14,35,60,62,50,118,36,109,197,67}','L''histoire suit les aventures de Monkey D. Luffy, un garçon dont le corps a acquis les propriétés du caoutchouc après avoir mangé par inadvertance un fruit du démon. Avec son équipage de pirates, appelé l''équipage de Chapeau de paille, Luffy explore Grand Line à la recherche du trésor ultime connu sous le nom de « One Piece » afin de devenir le prochain roi des pirates.'),
('wednesday','Wednesday','Série','Fantastique',2022,53,'Tim Burton, Gandja Monteiro, James Marshall, Paco Cabezas','En cours','{#4A2C6B,#150E22}','{8,8}','Mercredi suit la jeune Mercredi Addams à la Nevermore Academy, où elle tente de s''adapter tout en enquêtant sur une série de meurtres dans la ville voisine.'),
('you','You','Série','Thriller',2018,50,'Marcos Siega, Silver Tree, Lee Toland Krieger','Terminée','{#5A2A4F,#1A0C17}','{10,10,10,10,10}','Un libraire new-yorkais devient obsédé par une jeune femme et s''immisce dans sa vie.'),
('goodplace','The Good Place','Série','Sitcom',2016,22,'Michael Schur','Terminée','{#2E6A3F,#0E2315}','{13,13,13,14}','Eleanor Shellstrop se retrouve au paradis par erreur et tente de devenir une meilleure personne pour y rester.'),
('lucifer','Lucifer','Série','Fantastique',2016,45,'Tom Kapinos','Terminée','{#6B2230,#1F0A10}','{13,18,26,10,16,10}','Lucifer Morningstar, las de l''enfer, ouvre un club à Los Angeles et devient consultant pour la police.'),
('umbrella','The Umbrella Academy','Série','Science-fiction',2019,52,'Peter Hoar','Terminée','{#7A3B2E,#241013}','{10,10,10,6}','Sept enfants aux pouvoirs extraordinaires, adoptés par un milliardaire, se retrouvent à la mort de leur père pour résoudre un mystère.'),
('greys','Grey''s Anatomy','Série','Médical',2005,43,'Shonda Rhimes','En cours','{#1E5E5A,#0A2423}','{9,27,25,17,24,24,22,24,24,24,25,24,24,24,25,21,17,20,20,10,18,18}','Meredith Grey et ses collègues chirurgiens font leurs armes dans un hôpital de Seattle.'),
('squid','Squid Game','Série','Thriller',2021,55,'Hwang Dong-hyuk','Terminée','{#8A2A55,#2A0C1B}','{9,7,6}','Des personnes endettées acceptent de participer à des jeux d''enfants mortels pour remporter une énorme somme d''argent.'),
('breaking','Breaking Bad','Série','Drame',2008,47,'Vince Gilligan','Terminée','{#3F6B2A,#12200C}','{7,13,13,13,16}','Un professeur de chimie atteint d''un cancer se lance dans la fabrication de méthamphétamine pour assurer l''avenir de sa famille.'),
('stranger','Stranger Things','Série','Science-fiction',2016,50,'Matt Duffer, Ross Duffer','Terminée','{#7A1F2B,#1A0A0D}','{8,9,8,9,8}','À Hawkins, la disparition d''un enfant révèle des expériences secrètes et un monde parallèle.')
on conflict (id) do update set title=excluded.title, type=excluded.type, genre=excluded.genre, year=excluded.year, dur=excluded.dur, dir=excluded.dir, diff=excluded.diff, c=excluded.c, eps=excluded.eps, sum=excluded.sum;

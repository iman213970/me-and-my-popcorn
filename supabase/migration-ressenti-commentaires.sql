-- Ressenti en emoji (par titre) et commentaires (par épisode ou par film).
-- À coller une seule fois dans Supabase > SQL Editor. Sans danger si relancé.

alter table public.entries add column if not exists ressenti text[] not null default '{}';

create table if not exists public.episode_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title_id text not null references public.titles(id) on delete cascade,
  season int not null default 0,   -- 0 pour un film
  episode int not null default 0,  -- 0 pour un film
  body text not null default '',
  feel text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists episode_notes_user_title on public.episode_notes (user_id, title_id);

alter table public.episode_notes enable row level security;

drop policy if exists "mes commentaires" on public.episode_notes;
create policy "mes commentaires" on public.episode_notes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.episode_notes to authenticated;

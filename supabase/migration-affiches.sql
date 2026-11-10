-- Affiches TMDB : on garde l'adresse de l'image (pas l'image elle-même).
-- À coller une seule fois dans Supabase > SQL Editor, puis Run. Sans danger si relancé.
alter table public.titles add column if not exists poster text not null default '';

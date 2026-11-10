import { supabase } from './supabase';

export type TmdbHit = { kind: 'tv' | 'movie'; id: number; title: string; year: string; overview: string };

/** Cherche sur TMDB via la fonction Supabase (la clé TMDB n'est jamais dans l'appli). */
export async function searchTmdb(q: string): Promise<{ hits: TmdbHit[]; error: string }> {
  const { data, error } = await supabase.functions.invoke('tmdb', { body: { action: 'search', q } });
  if (error) return { hits: [], error: "La recherche TMDB n'est pas encore activée (fonction ou clé manquante)." };
  return { hits: ((data as { hits?: TmdbHit[] })?.hits ?? []), error: '' };
}

import { TMDB_FUNCTION } from '../config';
import { supabase } from './supabase';

export type TmdbHit = { kind: 'tv' | 'movie'; id: number; title: string; year: string; overview: string; poster: string };
type Res = { hits: TmdbHit[]; error: string };
const OFF = "La recherche TMDB n'est pas encore activée (fonction ou clé manquante).";

async function call(body: object): Promise<Res> {
  const { data, error } = await supabase.functions.invoke(TMDB_FUNCTION, { body });
  if (error) return { hits: [], error: OFF };
  return { hits: ((data as { hits?: TmdbHit[] })?.hits ?? []), error: '' };
}
/** Cherche sur TMDB via la fonction Supabase (la clé TMDB n'est jamais dans l'appli). */
export const searchTmdb = (q: string) => call({ action: 'search', q });
/** Titres populaires d'un genre (type : Tous, Séries ou Films). */
export const discoverTmdb = (genre: string, type: string, page = 1) => call({ action: 'discover', genre, type, page });
/** Recommandations pour un titre (id de l'appli, ex. tmdb-tv-123). */
export const similarTmdb = (id: string) => call({ action: 'similar', id });
/** Titres du moment sur TMDB. */
export const browseTmdb = () => call({ action: 'browse' });
/** Adresse d'une affiche TMDB (la taille w342 suffit pour les grilles). */
export const posterUrl = (path: string, size: 'w342' | 'w500' = 'w342') => `https://image.tmdb.org/t/p/${size}${path}`;

export type Release = { id: string; kind: string; next: { date: string; season: number; episode: number } | null; last: { date: string; season: number; episode: number } | null; date?: string };
/** Dates de sortie (épisode à venir, dernier épisode, film) pour des titres de ta liste. */
export async function fetchReleases(ids: string[]): Promise<Release[] | null> {
  const { data, error } = await supabase.functions.invoke(TMDB_FUNCTION, { body: { action: 'releases', ids } });
  if (error) return null;
  const r = (data as { releases?: Release[] })?.releases;
  return Array.isArray(r) ? r : null;
}

// Fonction Supabase "tmdb" : cherche un titre sur TMDB et l'ajoute au catalogue.
// La clé TMDB reste ici, dans les secrets Supabase (TMDB_KEY). Elle n'est jamais dans l'appli.
import { createClient } from 'npm:@supabase/supabase-js@2';

const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: H });

async function tmdb(path: string, params: Record<string, string> = {}) {
  const key = Deno.env.get('TMDB_KEY');
  if (!key) throw new Error('Clé TMDB absente');
  const u = new URL('https://api.themoviedb.org/3' + path);
  u.searchParams.set('language', 'fr-FR');
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const headers: Record<string, string> = {};
  if (key.length > 60) headers.Authorization = `Bearer ${key}`; // jeton long (v4)
  else u.searchParams.set('api_key', key); // clé courte (v3)
  const r = await fetch(u, { headers });
  if (!r.ok) throw new Error(`TMDB ${r.status}`);
  return r.json();
}

// Genres TMDB (par numéro) -> ta liste de genres. Les autres sont ignorés.
const GENRES: Record<number, string> = {
  28: 'Action', 12: 'Aventure', 16: 'Animation', 35: 'Comédie', 80: 'Policier', 99: 'Documentaire', 18: 'Drame',
  10751: 'Famille', 14: 'Fantastique', 36: 'Historique', 27: 'Horreur', 10402: 'Comédie musicale', 9648: 'Mystère',
  10749: 'Romance', 878: 'Science-fiction', 53: 'Thriller', 10752: 'Guerre', 37: 'Western',
  10759: 'Action', 10765: 'Science-fiction', 10768: 'Guerre', 10762: 'Famille',
};
const PALETTE: [string, string][] = [
  ['#1F4E79', '#0D1F36'], ['#4A2C6B', '#150E22'], ['#5A2A4F', '#1A0C17'], ['#2E6A3F', '#0E2315'],
  ['#6B2230', '#1F0A10'], ['#7A3B2E', '#241013'], ['#1E5E5A', '#0A2423'], ['#8A2A55', '#2A0C1B'],
  ['#3F6B2A', '#12200C'], ['#7A1F2B', '#1A0A0D'],
];
const colors = (id: string) => {
  let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
};
function genreOf(d: { genres?: { id: number }[]; original_language?: string }): string {
  const ids = (d.genres ?? []).map((g) => g.id);
  if (ids.includes(16) && d.original_language === 'ja') return 'Manga';
  for (const i of ids) if (GENRES[i]) return GENRES[i];
  return 'Drame';
}

async function build(kind: 'tv' | 'movie', tmdbId: number) {
  const id = `tmdb-${kind}-${tmdbId}`;
  if (kind === 'tv') {
    const d = await tmdb(`/tv/${tmdbId}`);
    const eps = (d.seasons ?? []).filter((s: { season_number: number; episode_count: number }) => s.season_number > 0 && s.episode_count > 0)
      .map((s: { episode_count: number }) => s.episode_count);
    const runs: number[] = d.episode_run_time ?? [];
    const dur = runs.length ? Math.round(runs.reduce((a, b) => a + b, 0) / runs.length) : (d.last_episode_to_air?.runtime ?? 45);
    const diff = d.status === 'Ended' ? 'Terminée' : d.status === 'Canceled' ? 'Annulée' : 'En cours';
    return {
      id, title: d.name, type: 'Série', genre: genreOf(d), year: Number((d.first_air_date ?? '').slice(0, 4)) || 0, dur,
      dir: (d.created_by ?? []).map((p: { name: string }) => p.name).join(', ') || 'Non renseigné', diff, c: colors(id),
      eps: eps.length ? eps : [d.number_of_episodes || 1], sum: d.overview || 'Résumé non disponible.', poster: d.poster_path ?? '',
    };
  }
  const d = await tmdb(`/movie/${tmdbId}`, { append_to_response: 'credits' });
  const dirs = (d.credits?.crew ?? []).filter((p: { job: string }) => p.job === 'Director').map((p: { name: string }) => p.name);
  return {
    id, title: d.title, type: 'Film', genre: genreOf(d), year: Number((d.release_date ?? '').slice(0, 4)) || 0, dur: d.runtime || 100,
    dir: dirs.join(', ') || 'Non renseigné', diff: d.belongs_to_collection ? 'Saga' : 'Film unique', c: colors(id),
    eps: [1], sum: d.overview || 'Résumé non disponible.', poster: d.poster_path ?? '',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: H });
  try {
    // Seules les personnes connectées à l'appli peuvent utiliser cette fonction.
    const url = Deno.env.get('SUPABASE_URL')!;
    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return json({ error: 'Non connectée' }, 401);
    const only = Deno.env.get('ALLOWED_EMAIL'); // optionnel : réserve la fonction à une adresse
    if (only && user.email?.toLowerCase() !== only.toLowerCase()) return json({ error: 'Accès refusé' }, 403);

    const body = await req.json();
    if (body.action === 'search' || body.action === 'browse') {
      let r;
      if (body.action === 'search') {
        const q = String(body.q ?? '').trim().slice(0, 80);
        if (q.length < 2) return json({ hits: [] });
        r = await tmdb('/search/multi', { query: q, include_adult: 'false' });
      } else {
        r = await tmdb('/trending/all/week');
      }
      const hits = (r.results ?? []).filter((x: { media_type: string }) => x.media_type === 'tv' || x.media_type === 'movie').slice(0, 18)
        .map((x: { media_type: string; id: number; title?: string; name?: string; release_date?: string; first_air_date?: string; overview?: string; poster_path?: string }) => ({
          kind: x.media_type, id: x.id, title: x.title ?? x.name ?? '', year: (x.release_date ?? x.first_air_date ?? '').slice(0, 4),
          overview: (x.overview ?? '').slice(0, 160), poster: x.poster_path ?? '',
        }));
      return json({ hits });
    }
    if (body.action === 'import') {
      if (body.kind !== 'tv' && body.kind !== 'movie') return json({ error: 'Type inconnu' }, 400);
      const title = await build(body.kind, Number(body.id));
      const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const { error } = await admin.from('titles').upsert(title, { onConflict: 'id' });
      if (error) return json({ error: error.message }, 500);
      return json({ title });
    }
    if (body.action === 'releases') {
      // Dates de sortie (prochaine / dernière) pour les titres de ta liste.
      const ids: string[] = (Array.isArray(body.ids) ? body.ids : []).map(String).filter((x: string) => /^tmdb-(tv|movie)-\d+$/.test(x)).slice(0, 40);
      const out = await Promise.all(ids.map(async (id) => {
        const [, kind, n] = id.split('-');
        try {
          if (kind === 'tv') {
            const d = await tmdb(`/tv/${n}`);
            const pick = (e: { air_date?: string; season_number?: number; episode_number?: number } | null) => e?.air_date ? { date: e.air_date, season: e.season_number ?? 0, episode: e.episode_number ?? 0 } : null;
            return { id, kind, next: pick(d.next_episode_to_air), last: pick(d.last_episode_to_air) };
          }
          const d = await tmdb(`/movie/${n}`);
          return { id, kind, next: null, last: null, date: d.release_date || '' };
        } catch { return { id, kind, next: null, last: null }; }
      }));
      return json({ releases: out });
    }
    return json({ error: 'Action inconnue' }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erreur' }, 500);
  }
});

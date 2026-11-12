import { useEffect, useState } from 'react';
import { fetchReleases, type Release } from './tmdb';

export type Sortie = { id: string; date: string; label: string; days: number };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayDiff = (date: string) => Math.round((new Date(date + 'T12:00:00').getTime() - new Date(iso(new Date()) + 'T12:00:00').getTime()) / 86400000);

/** Phrase courte pour une échéance : « demain », « dans 12 jours », « il y a 3 jours »... */
export function whenFr(days: number) {
  if (days === 0) return "aujourd'hui";
  if (days === 1) return 'demain';
  if (days === -1) return 'hier';
  if (days > 0) return days < 60 ? `dans ${days} jours` : `dans ${Math.round(days / 30)} mois`;
  return `il y a ${-days} jours`;
}
export const dateFr = (date: string) => new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

const cache: { at: number; key: string; data: Release[] } = { at: 0, key: '', data: [] };

/** Sorties à venir et récentes (30 jours) pour les titres TMDB de ta liste. `null` = pas encore chargé ou indisponible. */
export function useSorties(ids: string[]) {
  const tmdbIds = ids.filter((x) => x.startsWith('tmdb-')).sort();
  const key = tmdbIds.join(',');
  const [rel, setRel] = useState<Release[] | null>(cache.key === key && Date.now() - cache.at < 6 * 3600e3 ? cache.data : null);
  useEffect(() => {
    if (!tmdbIds.length) { setRel([]); return; }
    if (cache.key === key && Date.now() - cache.at < 6 * 3600e3) { setRel(cache.data); return; }
    let alive = true;
    fetchReleases(tmdbIds).then((r) => { if (r) { cache.at = Date.now(); cache.key = key; cache.data = r; } if (alive) setRel(r); });
    return () => { alive = false; };
  }, [key]);
  if (!rel) return { loaded: false, upcoming: [] as Sortie[], recent: [] as Sortie[] };
  const upcoming: Sortie[] = [], recent: Sortie[] = [];
  for (const r of rel) {
    const ep = (e: { season: number; episode: number }) => `Saison ${e.season} · épisode ${e.episode}`;
    if (r.next) { const d = dayDiff(r.next.date); if (d >= 0) upcoming.push({ id: r.id, date: r.next.date, label: ep(r.next), days: d }); }
    if (r.last) { const d = dayDiff(r.last.date); if (d <= 0 && d >= -30) recent.push({ id: r.id, date: r.last.date, label: ep(r.last), days: d }); }
    if (r.date) {
      const d = dayDiff(r.date);
      if (d >= 0) upcoming.push({ id: r.id, date: r.date, label: 'Sortie du film', days: d });
      else if (d >= -30) recent.push({ id: r.id, date: r.date, label: 'Sorti au cinéma', days: d });
    }
  }
  upcoming.sort((a, b) => a.days - b.days); recent.sort((a, b) => b.days - a.days);
  return { loaded: true, upcoming: upcoming.slice(0, 8), recent: recent.slice(0, 8) };
}

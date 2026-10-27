import type { Title } from './catalog';

/** Nombre total d'épisodes d'un titre. */
export const total = (t: Title) => t.eps.reduce((a, b) => a + b, 0);

/** Nombre d'épisodes des n premières saisons. */
export const cum = (t: Title, n: number) => t.eps.slice(0, n).reduce((a, b) => a + b, 0);

/** Convertit un nombre d'épisodes vus en saison et épisode courants. */
export function pos(t: Title, watched: number): { s: number; e: number } {
  let left = watched;
  for (let i = 0; i < t.eps.length; i++) {
    if (left <= t.eps[i]) return { s: i + 1, e: left };
    left -= t.eps[i];
  }
  return { s: t.eps.length, e: t.eps[t.eps.length - 1] };
}

/** Minutes -> "12 h 05". */
export function fmtH(m: number) {
  const mi = m % 60;
  return `${Math.floor(m / 60)} h ${mi < 10 ? '0' : ''}${mi}`;
}

/** Minutes -> "2 j 5 h 12 min" (jours, heures, minutes). */
export function fmtLong(m: number) {
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mi = m % 60;
  return d > 0 ? `${d} j ${h} h ${mi} min` : `${h} h ${mi} min`;
}

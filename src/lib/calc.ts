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

/** Durée d'un film : 93 -> "1 h 33 min", 45 -> "45 min", 120 -> "2 h". */
export function fmtDur(m: number) {
  const h = Math.floor(m / 60), mi = m % 60;
  if (h === 0) return `${mi} min`;
  return mi === 0 ? `${h} h` : `${h} h ${mi < 10 ? '0' : ''}${mi} min`;
}

/** Saisie de date « jj/mm/aaaa » : ajoute les / tout seul. */
export function fmtDateInput(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}
export function todayFr(): string {
  const n = new Date();
  return `${String(n.getDate()).padStart(2, '0')}/${String(n.getMonth() + 1).padStart(2, '0')}/${n.getFullYear()}`;
}
/** « jj/mm/aaaa » -> nombre comparable (0 si vide ou invalide). */
export function dateKey(s: string): number {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || '');
  return m ? Number(m[3]) * 10000 + Number(m[2]) * 100 + Number(m[1]) : 0;
}

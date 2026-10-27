import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG, type Title } from './catalog';
import { total } from './calc';

export const STATUSES = ['À regarder', 'En cours', 'Terminé', 'Abandonné'] as const;
export type Status = (typeof STATUSES)[number];
export type Visibility = 'Moi' | 'Amis' | 'Public';

export type Entry = {
  status: Status; watched: number; start: string; end: string; plat: string; fav: boolean;
  note: number; avis: string; cit: string; perso: string; moment: string; vis: Visibility;
};
export type Prefs = {
  avatar: number; pseudo: string; bio: string; pub: boolean;
  genres: string[]; plats: string[]; customPlats: string[];
};
type State = { list: Record<string, Entry>; prefs: Prefs };

export const BY: Record<string, Title> = Object.fromEntries(CATALOG.map((t) => [t.id, t]));
export const newEntry = (o: Partial<Entry> = {}): Entry => ({
  status: 'À regarder', watched: 0, start: '', end: '', plat: '', fav: false,
  note: 0, avis: '', cit: '', perso: '', moment: '', vis: 'Amis', ...o,
});
const freshPrefs = (): Prefs => ({ avatar: 0, pseudo: '', bio: '', pub: true, genres: ['Thriller', 'Manga'], plats: ['Netflix'], customPlats: [] });
const fresh = (): State => ({ list: {}, prefs: freshPrefs() });

type Ctx = {
  ready: boolean; state: State;
  add: (id: string) => void; remove: (id: string) => void;
  patch: (id: string, p: Partial<Entry>) => void;
  setWatched: (id: string, w: number) => void;
  patchPrefs: (p: Partial<Prefs>) => void;
  reset: () => void;
};
const StoreCtx = createContext<Ctx | null>(null);
const KEY = 'popcorn-state-v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(fresh());
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((s) => {
        if (s) {
          const o = JSON.parse(s) as State;
          if (o && o.list && o.prefs) setState({ list: o.list, prefs: { ...freshPrefs(), ...o.prefs } });
        }
      })
      .catch(() => {})
      .finally(() => { loaded.current = true; setReady(true); });
  }, []);

  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const add = useCallback((id: string) => setState((s) => (s.list[id] ? s : { ...s, list: { ...s.list, [id]: newEntry() } })), []);
  const remove = useCallback((id: string) => setState((s) => { const l = { ...s.list }; delete l[id]; return { ...s, list: l }; }), []);
  const patch = useCallback((id: string, p: Partial<Entry>) => setState((s) => (s.list[id] ? { ...s, list: { ...s.list, [id]: { ...s.list[id], ...p } } } : s)), []);
  const setWatched = useCallback((id: string, w: number) => setState((s) => {
    const e = s.list[id]; const t = BY[id]; if (!e || !t) return s;
    const n = Math.max(0, Math.min(total(t), w));
    let status = e.status;
    if (n >= total(t)) status = 'Terminé';
    else if (n > 0 && (status === 'À regarder' || status === 'Terminé')) status = 'En cours';
    else if (n === 0 && status === 'Terminé') status = 'À regarder';
    return { ...s, list: { ...s.list, [id]: { ...e, watched: n, status } } };
  }), []);
  const patchPrefs = useCallback((p: Partial<Prefs>) => setState((s) => ({ ...s, prefs: { ...s.prefs, ...p } })), []);
  const reset = useCallback(() => setState(fresh()), []);

  const value = useMemo(() => ({ ready, state, add, remove, patch, setWatched, patchPrefs, reset }), [ready, state, add, remove, patch, setWatched, patchPrefs, reset]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('StoreProvider manquant');
  return c;
}

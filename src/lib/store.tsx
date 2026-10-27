import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { total } from './calc';
import { CATALOG, type Title } from './catalog';
import { supabase } from './supabase';

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

/** Catalogue : tableau et index modifiés sur place quand la base répond. */
export const BY: Record<string, Title> = {};
CATALOG.forEach((t) => { BY[t.id] = t; });
function setCatalog(rows: Title[]) {
  CATALOG.splice(0, CATALOG.length, ...rows);
  Object.keys(BY).forEach((k) => delete BY[k]);
  rows.forEach((t) => { BY[t.id] = t; });
}

export const newEntry = (o: Partial<Entry> = {}): Entry => ({
  status: 'À regarder', watched: 0, start: '', end: '', plat: '', fav: false,
  note: 0, avis: '', cit: '', perso: '', moment: '', vis: 'Amis', ...o,
});
const freshPrefs = (): Prefs => ({ avatar: 0, pseudo: '', bio: '', pub: true, genres: ['Thriller', 'Manga'], plats: ['Netflix'], customPlats: [] });
const fresh = (): State => ({ list: {}, prefs: freshPrefs() });

/* ---- Conversions base de données <-> appli ---- */
type EntryRow = { title_id: string; status: Status; watched: number; start_date: string; end_date: string; plat: string; fav: boolean; note: number; avis: string; cit: string; perso: string; moment: string; vis: Visibility };
const fromRow = (r: EntryRow): Entry => ({ status: r.status, watched: r.watched, start: r.start_date, end: r.end_date, plat: r.plat, fav: r.fav, note: r.note, avis: r.avis, cit: r.cit, perso: r.perso, moment: r.moment, vis: r.vis });
const toRow = (uid: string, id: string, e: Entry) => ({ user_id: uid, title_id: id, status: e.status, watched: e.watched, start_date: e.start, end_date: e.end, plat: e.plat, fav: e.fav, note: e.note, avis: e.avis, cit: e.cit, perso: e.perso, moment: e.moment, vis: e.vis });
type ProfileRow = { pseudo: string; bio: string; pub: boolean; avatar: number; genres: string[]; plats: string[]; custom_plats: string[] };
const prefsFromRow = (r: ProfileRow): Prefs => ({ pseudo: r.pseudo, bio: r.bio, pub: r.pub, avatar: r.avatar, genres: r.genres, plats: r.plats, customPlats: r.custom_plats });
const prefsToRow = (uid: string, p: Prefs) => ({ id: uid, pseudo: p.pseudo, bio: p.bio, pub: p.pub, avatar: p.avatar, genres: p.genres, plats: p.plats, custom_plats: p.customPlats });

type Ctx = {
  ready: boolean; session: Session | null; syncError: string; catalogVersion: number; state: State;
  add: (id: string) => void; remove: (id: string) => void;
  patch: (id: string, p: Partial<Entry>) => void;
  setWatched: (id: string, w: number) => void;
  patchPrefs: (p: Partial<Prefs>) => void;
  clearList: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<string | null>;
};
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(fresh());
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [catalogVersion, setCatalogVersion] = useState(0);
  const ref = useRef<State>(state);
  const uid = useRef<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const commit = useCallback((next: State) => { ref.current = next; setState(next); }, []);
  const fail = useCallback((e: unknown) => { setSyncError(e instanceof Error ? e.message : 'Erreur de synchronisation'); }, []);

  /** Envoie une ligne vers la base, après 500 ms sans nouvelle frappe. */
  const later = useCallback((key: string, fn: () => Promise<void>) => {
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => { fn().catch(fail); }, 500);
  }, [fail]);

  const pushEntry = useCallback((id: string) => {
    later('e:' + id, async () => {
      const u = uid.current; const e = ref.current.list[id]; if (!u || !e) return;
      const { error } = await supabase.from('entries').upsert(toRow(u, id, e), { onConflict: 'user_id,title_id' });
      if (error) throw error;
      setSyncError('');
    });
  }, [later]);
  const pushPrefs = useCallback(() => {
    later('p', async () => {
      const u = uid.current; if (!u) return;
      const { error } = await supabase.from('profiles').upsert(prefsToRow(u, ref.current.prefs));
      if (error) throw error;
      setSyncError('');
    });
  }, [later]);

  /** Charge catalogue, liste et profil depuis la base. */
  const loadAll = useCallback(async (u: string) => {
    const [t, e, p] = await Promise.all([
      supabase.from('titles').select('*').order('title'),
      supabase.from('entries').select('*').eq('user_id', u),
      supabase.from('profiles').select('*').eq('id', u).maybeSingle(),
    ]);
    if (t.error) throw t.error;
    if (e.error) throw e.error;
    if (p.error) throw p.error;
    if (t.data && t.data.length) { setCatalog(t.data as Title[]); setCatalogVersion((v) => v + 1); }
    const list: Record<string, Entry> = {};
    (e.data as EntryRow[]).forEach((r) => { list[r.title_id] = fromRow(r); });
    let prefs = freshPrefs();
    if (p.data) prefs = prefsFromRow(p.data as ProfileRow);
    else await supabase.from('profiles').upsert(prefsToRow(u, prefs));
    commit({ list, prefs });
    setSyncError('');
  }, [commit]);

  useEffect(() => {
    let alive = true;
    const apply = async (s: Session | null) => {
      if (!alive) return;
      setSession(s);
      uid.current = s?.user.id ?? null;
      if (s) { try { await loadAll(s.user.id); } catch (e) { fail(e); } } else commit(fresh());
      if (alive) setReady(true);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session)).catch(() => { setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') { void apply(s); }
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [loadAll, commit, fail]);

  const add = useCallback((id: string) => {
    if (ref.current.list[id]) return;
    commit({ ...ref.current, list: { ...ref.current.list, [id]: newEntry() } });
    pushEntry(id);
  }, [commit, pushEntry]);

  const remove = useCallback((id: string) => {
    const l = { ...ref.current.list }; delete l[id];
    commit({ ...ref.current, list: l });
    clearTimeout(timers.current['e:' + id]);
    const u = uid.current;
    if (u) supabase.from('entries').delete().eq('user_id', u).eq('title_id', id).then(({ error }) => { if (error) fail(error); });
  }, [commit, fail]);

  const patch = useCallback((id: string, p: Partial<Entry>) => {
    const e = ref.current.list[id]; if (!e) return;
    commit({ ...ref.current, list: { ...ref.current.list, [id]: { ...e, ...p } } });
    pushEntry(id);
  }, [commit, pushEntry]);

  const setWatched = useCallback((id: string, w: number) => {
    const e = ref.current.list[id]; const t = BY[id]; if (!e || !t) return;
    const n = Math.max(0, Math.min(total(t), w));
    let status = e.status;
    if (n >= total(t)) status = 'Terminé';
    else if (n > 0 && (status === 'À regarder' || status === 'Terminé')) status = 'En cours';
    else if (n === 0 && status === 'Terminé') status = 'À regarder';
    commit({ ...ref.current, list: { ...ref.current.list, [id]: { ...e, watched: n, status } } });
    pushEntry(id);
  }, [commit, pushEntry]);

  const patchPrefs = useCallback((p: Partial<Prefs>) => {
    commit({ ...ref.current, prefs: { ...ref.current.prefs, ...p } });
    pushPrefs();
  }, [commit, pushPrefs]);

  const clearList = useCallback(async () => {
    const u = uid.current; if (!u) return;
    Object.values(timers.current).forEach(clearTimeout);
    const { error } = await supabase.from('entries').delete().eq('user_id', u);
    if (error) { fail(error); return; }
    commit({ ...ref.current, list: {} });
  }, [commit, fail]);

  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.rpc('delete_my_account');
    if (error) return error.message;
    await supabase.auth.signOut();
    return null;
  }, []);

  const value = useMemo(() => ({ ready, session, syncError, catalogVersion, state, add, remove, patch, setWatched, patchPrefs, clearList, signOut, deleteAccount }),
    [ready, session, syncError, catalogVersion, state, add, remove, patch, setWatched, patchPrefs, clearList, signOut, deleteAccount]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('StoreProvider manquant');
  return c;
}

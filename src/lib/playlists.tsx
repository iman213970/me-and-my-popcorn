import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BY, useStore } from './store';
import { total } from './calc';
import { supabase } from './supabase';

export type Member = { id: string; pseudo: string; avatar: number; canEdit: boolean };
export type Playlist = {
  id: string; owner: string; name: string; items: string[]; members: Member[];
  isOwner: boolean; canEdit: boolean; inTime: boolean; inReleases: boolean; shared: boolean;
};
export type Notice = { id: string; body: string };
export type Progress = { user_id: string; title_id: string; watched: number; status: string };
export type PlComment = { id: string; user_id: string; title_id: string; season: number; episode: number; body: string; feel: string[]; visible_to: string[] | null; visible: boolean; created_at: string };
export type PlReply = { id: string; comment_id: string; user_id: string; body: string; created_at: string };

type Ctx = {
  playlists: Playlist[]; notices: Notice[]; error: string; reload: () => Promise<void>;
  create: (name: string) => Promise<string | null>;
  rename: (id: string, name: string) => Promise<void>;
  destroy: (id: string) => Promise<string | null>;
  leave: (id: string) => Promise<void>;
  addItem: (id: string, titleId: string) => Promise<void>;
  removeItem: (id: string, titleId: string) => Promise<void>;
  move: (id: string, titleId: string, dir: -1 | 1) => Promise<void>;
  setToggle: (id: string, key: 'in_time' | 'in_releases', val: boolean) => Promise<void>;
  invite: (id: string, friendId: string) => Promise<string | null>;
  removeMember: (id: string, userId: string) => Promise<void>;
  setCanEdit: (id: string, userId: string, val: boolean) => Promise<void>;
  dismissNotice: (id: string) => Promise<void>;
};
const PlCtx = createContext<Ctx | null>(null);

const msg = (e: unknown) => (e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : 'Erreur');

export function PlaylistsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useStore();
  const uid = session?.user.id ?? '';
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!uid) { setPlaylists([]); setNotices([]); return; }
    try {
      const [p, m, i, n] = await Promise.all([
        supabase.from('playlists').select('*').order('created_at'),
        supabase.from('playlist_members').select('*'),
        supabase.from('playlist_items').select('*').order('position'),
        supabase.from('playlist_notices').select('*').order('created_at'),
      ]);
      const bad = p.error || m.error || i.error || n.error;
      if (bad) throw bad;
      const mem = (m.data ?? []) as { playlist_id: string; user_id: string; in_time: boolean; in_releases: boolean; can_edit: boolean }[];
      const ids = Array.from(new Set(mem.map((x) => x.user_id)));
      let people: { id: string; pseudo: string; avatar: number }[] = [];
      if (ids.length) {
        const r = await supabase.from('profiles').select('id,pseudo,avatar').in('id', ids);
        if (r.error) throw r.error;
        people = (r.data ?? []) as typeof people;
      }
      const items = (i.data ?? []) as { playlist_id: string; title_id: string }[];
      const out: Playlist[] = ((p.data ?? []) as { id: string; owner: string; name: string }[]).map((pl) => {
        const mine = mem.find((x) => x.playlist_id === pl.id && x.user_id === uid);
        const members = mem.filter((x) => x.playlist_id === pl.id).map((x) => {
          const pr = people.find((y) => y.id === x.user_id);
          return { id: x.user_id, pseudo: pr?.pseudo || 'Sans pseudo', avatar: pr?.avatar ?? 0, canEdit: x.can_edit };
        });
        return {
          id: pl.id, owner: pl.owner, name: pl.name, isOwner: pl.owner === uid, members, shared: members.length > 1,
          canEdit: !!mine?.can_edit, inTime: !!mine?.in_time, inReleases: !!mine?.in_releases,
          items: items.filter((x) => x.playlist_id === pl.id).map((x) => x.title_id),
        };
      });
      setPlaylists(out); setNotices((n.data ?? []) as Notice[]); setError('');
    } catch (e) { setError(msg(e)); }
  }, [uid]);

  useEffect(() => { void reload(); }, [reload]);

  const patchLocal = (id: string, f: (p: Playlist) => Playlist) => setPlaylists((l) => l.map((p) => (p.id === id ? f(p) : p)));
  const run = async (q: PromiseLike<{ error: unknown }>) => { const r = await q; if (r.error) { setError(msg(r.error)); await reload(); } };

  const create = useCallback(async (name: string) => {
    const { data, error: e } = await supabase.from('playlists').insert({ name: name.trim() || 'Ma playlist' }).select().single();
    if (e || !data) { setError(msg(e)); return null; }
    const id = (data as { id: string }).id;
    const r = await supabase.from('playlist_members').insert({ playlist_id: id, user_id: uid });
    if (r.error) { setError(msg(r.error)); return null; }
    await reload(); return id;
  }, [uid, reload]);

  const rename = useCallback(async (id: string, name: string) => {
    const n = name.trim(); if (!n) return;
    patchLocal(id, (p) => ({ ...p, name: n }));
    await run(supabase.from('playlists').update({ name: n }).eq('id', id));
  }, [reload]);

  const destroy = useCallback(async (id: string) => {
    const { error: e } = await supabase.rpc('delete_playlist', { pid: id });
    if (e) return msg(e);
    await reload(); return null;
  }, [reload]);

  const leave = useCallback(async (id: string) => {
    await run(supabase.from('playlist_members').delete().eq('playlist_id', id).eq('user_id', uid));
    await reload();
  }, [uid, reload]);

  const addItem = useCallback(async (id: string, titleId: string) => {
    let pos = 0;
    patchLocal(id, (p) => { pos = p.items.length; return p.items.includes(titleId) ? p : { ...p, items: [...p.items, titleId] }; });
    await run(supabase.from('playlist_items').insert({ playlist_id: id, title_id: titleId, position: pos }));
  }, [reload]);

  const removeItem = useCallback(async (id: string, titleId: string) => {
    patchLocal(id, (p) => ({ ...p, items: p.items.filter((x) => x !== titleId) }));
    await run(supabase.from('playlist_items').delete().eq('playlist_id', id).eq('title_id', titleId));
  }, [reload]);

  const move = useCallback(async (id: string, titleId: string, dir: -1 | 1) => {
    const pl = playlists.find((p) => p.id === id); if (!pl) return;
    const a = pl.items.indexOf(titleId), b = a + dir;
    if (a < 0 || b < 0 || b >= pl.items.length) return;
    const next = pl.items.slice(); [next[a], next[b]] = [next[b], next[a]];
    patchLocal(id, (p) => ({ ...p, items: next }));
    await Promise.all(next.map((t, k) => supabase.from('playlist_items').update({ position: k }).eq('playlist_id', id).eq('title_id', t)));
  }, [playlists]);

  const setToggle = useCallback(async (id: string, key: 'in_time' | 'in_releases', val: boolean) => {
    patchLocal(id, (p) => (key === 'in_time' ? { ...p, inTime: val } : { ...p, inReleases: val }));
    await run(supabase.from('playlist_members').update({ [key]: val }).eq('playlist_id', id).eq('user_id', uid));
  }, [uid, reload]);

  const invite = useCallback(async (id: string, friendId: string) => {
    const { error: e } = await supabase.from('playlist_members').insert({ playlist_id: id, user_id: friendId });
    if (e) return msg(e);
    await reload(); return null;
  }, [reload]);

  const removeMember = useCallback(async (id: string, userId: string) => {
    await run(supabase.from('playlist_members').delete().eq('playlist_id', id).eq('user_id', userId));
    await reload();
  }, [reload]);

  const setCanEdit = useCallback(async (id: string, userId: string, val: boolean) => {
    patchLocal(id, (p) => ({ ...p, members: p.members.map((m) => (m.id === userId ? { ...m, canEdit: val } : m)) }));
    const { error: e } = await supabase.rpc('set_member_edit', { pid: id, uid: userId, val });
    if (e) { setError(msg(e)); await reload(); }
  }, [reload]);

  const dismissNotice = useCallback(async (id: string) => {
    setNotices((l) => l.filter((x) => x.id !== id));
    await supabase.from('playlist_notices').delete().eq('id', id);
  }, []);

  const value = useMemo(() => ({ playlists, notices, error, reload, create, rename, destroy, leave, addItem, removeItem, move, setToggle, invite, removeMember, setCanEdit, dismissNotice }),
    [playlists, notices, error, reload, create, rename, destroy, leave, addItem, removeItem, move, setToggle, invite, removeMember, setCanEdit, dismissNotice]);
  return <PlCtx.Provider value={value}>{children}</PlCtx.Provider>;
}

export function usePlaylists() {
  const c = useContext(PlCtx);
  if (!c) throw new Error('PlaylistsProvider manquant');
  return c;
}

/** Progression des membres d'une playlist partagée (la course). */
export function useShared(id: string, enabled: boolean, version: string) {
  const [progress, setProgress] = useState<Progress[]>([]);
  useEffect(() => {
    if (!enabled) { setProgress([]); return; }
    let alive = true;
    (async () => {
      const p = await supabase.rpc('playlist_progress', { pid: id });
      if (alive) setProgress(p.error ? [] : ((p.data ?? []) as Progress[]));
    })();
    return () => { alive = false; };
  }, [id, enabled, version]);
  return { progress };
}

/** Commentaires d'une playlist et réponses. Le texte des commentaires des autres reste vide tant que je n'ai pas atteint l'épisode. */
export function usePlComments(pid: string, version: string) {
  const [comments, setComments] = useState<PlComment[]>([]);
  const [replies, setReplies] = useState<PlReply[]>([]);
  const [error, setError] = useState('');
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    (async () => {
      const [c, r] = await Promise.all([supabase.rpc('playlist_comments_for', { pid }), supabase.from('playlist_replies').select('*').order('created_at')]);
      if (!alive) return;
      if (c.error) { setError(msg(c.error)); setComments([]); setReplies([]); return; }
      const list = (c.data ?? []) as PlComment[];
      setComments(list); setError('');
      const ids = new Set(list.map((x) => x.id));
      setReplies(r.error ? [] : ((r.data ?? []) as PlReply[]).filter((x) => ids.has(x.comment_id)));
    })();
    return () => { alive = false; };
  }, [pid, version, n]);
  const refresh = () => setN((x) => x + 1);
  const add = async (titleId: string, season: number, episode: number, body: string, feel: string[], visibleTo: string[] | null) => {
    const { error: e } = await supabase.from('playlist_comments').insert({ playlist_id: pid, title_id: titleId, season, episode, body, feel, visible_to: visibleTo && visibleTo.length ? visibleTo : null });
    if (e) { setError(msg(e)); return false; }
    refresh(); return true;
  };
  const remove = async (id: string) => { setComments((l) => l.filter((x) => x.id !== id)); await supabase.from('playlist_comments').delete().eq('id', id); };
  const reply = async (commentId: string, body: string) => {
    const { error: e } = await supabase.from('playlist_replies').insert({ comment_id: commentId, body });
    if (e) { setError(msg(e)); return false; }
    refresh(); return true;
  };
  const removeReply = async (id: string) => { setReplies((l) => l.filter((x) => x.id !== id)); await supabase.from('playlist_replies').delete().eq('id', id); };
  return { comments, replies, error, add, remove, reply, removeReply };
}

/** Temps restant (en minutes) pour un ensemble de titres, selon ma progression. */
export function remainingMin(ids: string[], list: Record<string, { watched: number }>) {
  let m = 0;
  ids.forEach((id) => { const t = BY[id]; if (!t) return; m += Math.max(0, total(t) - (list[id]?.watched ?? 0)) * t.dur; });
  return m;
}

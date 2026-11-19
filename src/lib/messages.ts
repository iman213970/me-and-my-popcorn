import type { Media } from './media';
import { removeFiles } from './media';
import { supabase } from './supabase';

export type Msg = {
  id: string; from_user: string; to_user: string; body: string; title_id: string | null;
  media_path: string | null; media_kind: string | null; media_secs: number | null; expires_at: string | null; created_at: string; read_at: string | null;
};

const fail = (e: { message?: string } | null) => { if (e) throw new Error(e.message ?? 'Erreur'); };

export async function loadThread(me: string, friend: string): Promise<Msg[]> {
  const { data, error } = await supabase.from('messages').select('*')
    .or(`and(from_user.eq.${me},to_user.eq.${friend}),and(from_user.eq.${friend},to_user.eq.${me})`)
    .order('created_at', { ascending: true }).limit(300);
  fail(error);
  return (data ?? []) as Msg[];
}

export async function sendMessage(to: string, body: string, opts: { titleId?: string; media?: Media | null } = {}) {
  const row: Record<string, unknown> = { to_user: to, body };
  if (opts.titleId) row.title_id = opts.titleId;
  if (opts.media) { row.media_path = opts.media.path; row.media_kind = opts.media.kind; row.media_secs = opts.media.secs; }
  const { error } = await supabase.from('messages').insert(row);
  fail(error);
}

export async function markRead(friend: string) { await supabase.rpc('mark_read', { friend }); }

/** Nombre de messages non lus par ami. */
export async function unreadCounts(me: string): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('messages').select('from_user').eq('to_user', me).is('read_at', null);
  if (error || !data) return {};
  const out: Record<string, number> = {};
  (data as { from_user: string }[]).forEach((r) => { out[r.from_user] = (out[r.from_user] ?? 0) + 1; });
  return out;
}

export async function deleteMessage(m: Msg) {
  const { error } = await supabase.from('messages').delete().eq('id', m.id);
  fail(error);
  if (m.media_path) await removeFiles([m.media_path]);
}

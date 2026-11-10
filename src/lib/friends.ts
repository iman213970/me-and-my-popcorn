import { supabase } from './supabase';

export type Person = { id: string; pseudo: string; avatar: number; bio: string };
export type Link = { id: string; other: Person; status: 'pending' | 'accepted'; incoming: boolean };
export type FriendEntry = {
  title_id: string; status: string; watched: number; plat: string; fav: boolean; note: number;
  avis: string; cit: string; perso: string; moment: string; vis: string; ressenti: string[] | null;
};

/** Toutes mes demandes et mes amis, avec le profil de l'autre personne. */
export async function loadLinks(me: string): Promise<Link[]> {
  const { data, error } = await supabase.from('friendships').select('*');
  if (error) throw error;
  const rows = (data ?? []) as { id: string; requester: string; addressee: string; status: 'pending' | 'accepted' }[];
  const ids = Array.from(new Set(rows.map((r) => (r.requester === me ? r.addressee : r.requester))));
  let people: Person[] = [];
  if (ids.length) {
    const p = await supabase.from('profiles').select('id,pseudo,avatar,bio').in('id', ids);
    if (p.error) throw p.error;
    people = (p.data ?? []) as Person[];
  }
  return rows.map((r) => {
    const oid = r.requester === me ? r.addressee : r.requester;
    return { id: r.id, status: r.status, incoming: r.addressee === me && r.status === 'pending',
      other: people.find((x) => x.id === oid) ?? { id: oid, pseudo: 'Sans pseudo', avatar: 0, bio: '' } };
  });
}

/** Cherche des personnes par pseudo (les comptes sont créés par Iman : le cercle est fermé). */
export async function findPeople(q: string, me: string): Promise<Person[]> {
  const { data, error } = await supabase.from('profiles').select('id,pseudo,avatar,bio')
    .ilike('pseudo', `%${q.replace(/[%_]/g, '')}%`).neq('id', me).neq('pseudo', '').limit(10);
  if (error) throw error;
  return (data ?? []) as Person[];
}

export async function sendRequest(to: string) {
  const { error } = await supabase.from('friendships').insert({ addressee: to });
  if (error) throw error;
}
export async function acceptRequest(id: string) {
  const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id);
  if (error) throw error;
}
export async function removeLink(id: string) {
  const { error } = await supabase.from('friendships').delete().eq('id', id);
  if (error) throw error;
}

export async function loadPerson(id: string): Promise<Person | null> {
  const { data, error } = await supabase.from('profiles').select('id,pseudo,avatar,bio').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Person | null) ?? null;
}
export async function friendEntries(id: string): Promise<FriendEntry[]> {
  const { data, error } = await supabase.rpc('friend_entries', { friend: id });
  if (error) throw error;
  return (data ?? []) as FriendEntry[];
}

import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { loadLinks, type Link } from '../lib/friends';
import { sendMessage } from '../lib/messages';
import { BY, useStore } from '../lib/store';
import { C } from '../lib/theme';
import { Press } from './fx';
import { Sheet } from './Sheet';
import { Avatar, Btn, Field, Mu, Poster } from './ui';

/** Conseiller un titre : soit on part d'un titre (on choisit les proches), soit d'un proche (on choisit le titre). */
export function RecommendSheet({ open, onClose, titleId, friendId, onSent }: { open: boolean; onClose: () => void; titleId?: string; friendId?: string; onSent?: () => void }) {
  const { state, session } = useStore();
  const me = session?.user.id ?? '';
  const [friends, setFriends] = useState<Link[]>([]);
  const [picked, setPicked] = useState<string[]>(friendId ? [friendId] : []);
  const [title, setTitle] = useState(titleId ?? '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPicked(friendId ? [friendId] : []); setTitle(titleId ?? ''); setNote(''); setMsg(''); setDone(false);
    if (!friendId && me) loadLinks(me).then((l) => setFriends(l.filter((x) => x.status === 'accepted'))).catch((e) => setMsg(e instanceof Error ? e.message : 'Erreur'));
  }, [open, titleId, friendId, me]);

  const mine = Object.keys(state.list).filter((x) => BY[x]);
  const send = async () => {
    if (!title || !picked.length) return;
    setBusy(true); setMsg('');
    try {
      for (const f of picked) await sendMessage(f, note.trim(), { titleId: title });
      setDone(true); onSent?.();
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Erreur'); }
    setBusy(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Conseiller un titre">
      {done ? (
        <>
          <Text style={{ color: C.tx, fontSize: 16 }}>C'est envoyé 🍿 {picked.length > 1 ? 'Ils le verront' : 'Il ou elle le verra'} dans les messages.</Text>
          <Btn label="Fermer" kind="alt" onPress={onClose} />
        </>
      ) : (
        <>
          {!titleId ? (
            <View style={{ gap: 8 }}>
              <Mu size={12}>Quel titre ?</Mu>
              {mine.length ? mine.map((x) => (
                <Press key={x} onPress={() => setTitle(x)} accessibilityRole="button" accessibilityLabel={BY[x].title}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 8, backgroundColor: C.sf2, borderWidth: 2, borderColor: title === x ? C.ac : 'transparent' }}>
                  <Poster t={BY[x]} w={40} rounded={10} /><Text numberOfLines={2} style={{ flex: 1, color: C.tx, fontWeight: '600' }}>{BY[x].title}</Text>
                </Press>
              )) : <Mu>Ajoute d'abord des titres à ta liste.</Mu>}
            </View>
          ) : <Text style={{ color: C.tx, fontWeight: '700', fontSize: 16 }}>{BY[titleId]?.title}</Text>}
          {!friendId ? (
            <View style={{ gap: 8 }}>
              <Mu size={12}>À qui ?</Mu>
              {friends.length ? friends.map((f) => (
                <Press key={f.id} onPress={() => setPicked(picked.includes(f.other.id) ? picked.filter((x) => x !== f.other.id) : [...picked, f.other.id])} accessibilityRole="button"
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 10, backgroundColor: C.sf2, borderWidth: 2, borderColor: picked.includes(f.other.id) ? C.ac : 'transparent' }}>
                  <Avatar i={f.other.avatar} size={38} /><Text style={{ flex: 1, color: C.tx, fontWeight: '700' }}>{f.other.pseudo || 'Sans pseudo'}</Text>
                </Press>
              )) : <Mu>Aucun proche pour l'instant. Ajoute quelqu'un dans l'onglet Proches.</Mu>}
            </View>
          ) : null}
          <Field label="Un petit mot (facultatif)" value={note} onChangeText={setNote} multiline placeholder="Tu vas adorer, regarde le premier épisode" />
          {msg ? <Text style={{ color: C.rose, fontSize: 13 }}>{msg}</Text> : null}
          <Btn label={busy ? 'Envoi…' : 'Envoyer le conseil'} icon="paper-plane-outline" disabled={busy || !title || !picked.length} onPress={send} />
        </>
      )}
    </Sheet>
  );
}

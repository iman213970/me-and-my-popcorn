import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar, Btn, Card, Field, H1, H2, Mu, Screen } from '../../components/ui';
import { acceptRequest, findPeople, loadLinks, removeLink, sendRequest, type Link, type Person } from '../../lib/friends';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';

export default function Amis() {
  const { session, state } = useStore();
  const me = session?.user.id ?? '';
  const [links, setLinks] = useState<Link[]>([]);
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Person[] | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!me) return;
    try { setLinks(await loadLinks(me)); setMsg(''); } catch (e) { setMsg(e instanceof Error ? e.message : 'Erreur'); }
  }, [me]);
  useEffect(() => { void reload(); }, [reload]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); await reload(); } catch (e) { setMsg(e instanceof Error ? e.message : 'Erreur'); }
    setBusy(false);
  };
  const search = async () => {
    if (q.trim().length < 2) return;
    setBusy(true); setMsg('');
    try { setFound(await findPeople(q.trim(), me)); } catch (e) { setMsg(e instanceof Error ? e.message : 'Erreur'); }
    setBusy(false);
  };

  const incoming = links.filter((l) => l.incoming);
  const sent = links.filter((l) => l.status === 'pending' && !l.incoming);
  const friends = links.filter((l) => l.status === 'accepted');
  const known = new Set(links.map((l) => l.other.id));

  const Row = ({ p, children }: { p: Person; children?: React.ReactNode }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar i={p.avatar} size={44} />
      <Text style={{ flex: 1, color: C.tx, fontWeight: '700', fontSize: 16 }} numberOfLines={1}>{p.pseudo || 'Sans pseudo'}</Text>
      {children}
    </View>
  );

  return (
    <Screen>
      <H1>Mes proches</H1>
      {msg ? <Text style={{ color: C.rose, fontSize: 13 }}>{msg}</Text> : null}

      {incoming.length ? (
        <Card>
          <H2>Demandes reçues</H2>
          {incoming.map((l) => (
            <View key={l.id} style={{ gap: 10 }}>
              <Row p={l.other} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><Btn label="Refuser" kind="alt" disabled={busy} onPress={() => run(() => removeLink(l.id))} /></View>
                <View style={{ flex: 1 }}><Btn label="Accepter" disabled={busy} onPress={() => run(() => acceptRequest(l.id))} /></View>
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      <Card>
        <H2>Mes proches</H2>
        {friends.length ? friends.map((l) => (
          <Pressable key={l.id} onPress={() => router.push(`/ami/${l.other.id}`)} accessibilityRole="button" accessibilityLabel={`Voir le profil de ${l.other.pseudo}`}
            style={{ minHeight: 56, justifyContent: 'center' }}>
            <Row p={l.other}><Text style={{ color: C.mu, fontSize: 22 }}>›</Text></Row>
          </Pressable>
        )) : <Mu>Personne pour l'instant. Ajoute un frère ou une sœur ci-dessous.</Mu>}
      </Card>

      <Card>
        <H2>Ajouter quelqu'un</H2>
        {!state.prefs.pseudo.trim() ? <Mu size={12}>Choisis d'abord ton pseudo dans l'onglet Profil : sans pseudo, les autres ne pourront pas te trouver.</Mu> : null}
        <Field label="Son pseudo" value={q} onChangeText={setQ} autoCapitalize="none" placeholder="Pseudo de la personne" onSubmitEditing={search} />
        <Btn label="Chercher" kind="alt" icon="search" disabled={busy || q.trim().length < 2} onPress={search} />
        {found && !found.length ? <Mu>Personne trouvée avec ce pseudo.</Mu> : null}
        {found?.map((p) => (
          <Row key={p.id} p={p}>
            {known.has(p.id) ? <Mu size={12}>Déjà en lien</Mu> : (
              <View style={{ width: 120 }}><Btn label="Demander" disabled={busy} onPress={() => run(() => sendRequest(p.id))} /></View>
            )}
          </Row>
        ))}
      </Card>

      {sent.length ? (
        <Card>
          <H2>Demandes envoyées</H2>
          {sent.map((l) => (
            <Row key={l.id} p={l.other}>
              <Pressable onPress={() => run(() => removeLink(l.id))} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: C.mu, fontSize: 13 }}>En attente · Annuler</Text></Pressable>
            </Row>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

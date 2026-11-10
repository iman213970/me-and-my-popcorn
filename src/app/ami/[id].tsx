import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TitleGrid } from '../../components/TitleGrid';
import { Avatar, Btn, Card, H1, H2, Mu } from '../../components/ui';
import { fmtLong } from '../../lib/calc';
import { friendEntries, loadLinks, loadPerson, removeLink, type FriendEntry, type Person } from '../../lib/friends';
import { BY, useStore } from '../../lib/store';
import { C } from '../../lib/theme';

export default function Ami() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, catalogVersion } = useStore();
  const [person, setPerson] = useState<Person | null>(null);
  const [rows, setRows] = useState<FriendEntry[]>([]);
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/amis'));

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, e] = await Promise.all([loadPerson(String(id)), friendEntries(String(id))]);
        if (!alive) return; setPerson(p); setRows(e);
      } catch (e) { if (alive) setMsg(e instanceof Error ? e.message : 'Erreur'); }
    })();
    return () => { alive = false; };
  }, [id]);

  const known = useMemo(() => rows.filter((r) => BY[r.title_id]), [rows, catalogVersion]);
  const favs = known.filter((r) => r.fav).map((r) => r.title_id);
  const all = known.map((r) => r.title_id);
  const byId = (t: string) => known.find((r) => r.title_id === t)!;
  const opinions = known.filter((r) => r.avis || r.cit || r.perso || r.moment);
  let seen = 0; known.forEach((r) => { seen += r.watched * BY[r.title_id].dur; });

  const unlink = async () => {
    if (!session) return;
    try { const l = (await loadLinks(session.user.id)).find((x) => x.other.id === String(id)); if (l) await removeLink(l.id); back(); }
    catch (e) { setMsg(e instanceof Error ? e.message : 'Erreur'); }
  };

  const stars = (n: number) => (n ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="star" size={15} color={C.gold} /><Text style={{ color: C.tx, fontWeight: '700', fontSize: 13 }}>{n}/10</Text></View> : <Text style={{ color: C.mu, fontSize: 12 }}>pas de note</Text>);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SafeAreaView edges={['top']}>
          <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Retour"
            style={{ margin: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: C.sf, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={22} color={C.tx} />
          </Pressable>
        </SafeAreaView>
        <View style={{ padding: 20, gap: 18, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
          {msg ? <Text style={{ color: C.rose, fontSize: 13 }}>{msg}</Text> : null}
          {person ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Avatar i={person.avatar} size={72} />
                <View style={{ flex: 1, gap: 4 }}><H1>{person.pseudo || 'Sans pseudo'}</H1>{person.bio ? <Mu>{person.bio}</Mu> : null}</View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, backgroundColor: C.sf, borderRadius: 16, padding: 14, gap: 6 }}><Mu size={12}>Temps regardé</Mu><Text style={{ color: C.tx, fontSize: 18, fontWeight: '700' }}>{fmtLong(seen)}</Text></View>
                <View style={{ flex: 1, backgroundColor: C.sf, borderRadius: 16, padding: 14, gap: 6 }}><Mu size={12}>Titres</Mu><Text style={{ color: C.tx, fontSize: 28, fontWeight: '700' }}>{all.length}</Text></View>
              </View>
              {favs.length ? <View style={{ gap: 12 }}><H2>Ses favoris</H2><TitleGrid ids={favs} above={(t) => stars(byId(t).note)} /></View> : null}
              <View style={{ gap: 12 }}>
                <H2>Toute sa liste</H2>
                {all.length ? <TitleGrid ids={all} above={(t) => stars(byId(t).note)}
                  badge={(t) => (byId(t).ressenti?.length ? (
                    <View style={{ position: 'absolute', left: 6, bottom: 6, backgroundColor: 'rgba(18,18,28,0.72)', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 13 }}>{byId(t).ressenti!.slice(0, 3).join('')}</Text>
                    </View>) : null)} /> : <Mu>Rien dans sa liste pour l'instant.</Mu>}
              </View>
              {opinions.length ? (
                <View style={{ gap: 12 }}>
                  <H2>Ses avis</H2>
                  {opinions.map((r) => (
                    <Card key={r.title_id}>
                      <Text style={{ color: C.tx, fontWeight: '700', fontSize: 16 }}>{BY[r.title_id].title}</Text>
                      {stars(r.note)}
                      {r.avis ? <Text style={{ color: C.soft, fontSize: 15, lineHeight: 21 }}>{r.avis}</Text> : null}
                      {r.cit ? <Mu>Citation : {r.cit}</Mu> : null}
                      {r.perso ? <Mu>Personnage préféré : {r.perso}</Mu> : null}
                      {r.moment ? <Mu>Moment préféré : {r.moment}</Mu> : null}
                    </Card>
                  ))}
                </View>
              ) : null}
              {confirm ? (
                <Card>
                  <Text style={{ color: C.tx }}>Retirer {person.pseudo || 'cette personne'} de tes proches ?</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}><Btn label="Annuler" kind="alt" onPress={() => setConfirm(false)} /></View>
                    <View style={{ flex: 1 }}><Btn label="Retirer" kind="danger" onPress={unlink} /></View>
                  </View>
                </Card>
              ) : <Btn label="Retirer de mes proches" kind="danger" onPress={() => setConfirm(true)} />}
            </>
          ) : !msg ? <Mu>Chargement…</Mu> : null}
        </View>
      </ScrollView>
    </View>
  );
}

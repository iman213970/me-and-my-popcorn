import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { TitleGrid } from '../../components/TitleGrid';
import { Chip, H1, Pill, Screen, Seg } from '../../components/ui';
import { BY, STATUSES, useStore } from '../../lib/store';
import { C } from '../../lib/theme';

export default function MaListe() {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('Tous');
  const [sort, setSort] = useState('Ajout');
  const [kind, setKind] = useState('Tous');
  const [st, setSt] = useState('Tous');
  const [more, setMore] = useState(false);
  const all = Object.keys(state.list);
  const used = Array.from(new Set(all.map((id) => BY[id].genre))).sort();
  const ids = useMemo(() => {
    const k = q.trim().toLowerCase();
    const a = all.filter((id) => (genre === 'Tous' || BY[id].genre === genre) && (kind === 'Tous' || (kind === 'Films') === (BY[id].type === 'Film')) && (st === 'Tous' || state.list[id].status === st) && (!k || BY[id].title.toLowerCase().includes(k)));
    if (sort === 'Note') a.sort((x, y) => state.list[y].note - state.list[x].note);
    if (sort === 'Titre') a.sort((x, y) => BY[x].title.localeCompare(BY[y].title, 'fr'));
    return a;
  }, [all.join(','), q, genre, kind, st, sort, state.list]);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <H1>Ma bibliothèque</H1>
        <View style={{ borderWidth: 1, borderColor: '#3A3A55', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ color: C.tx, fontSize: 13 }}>{all.length} titre{all.length > 1 ? 's' : ''}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.sf, borderRadius: 14, paddingHorizontal: 14, gap: 10 }}>
        <Ionicons name="search" size={20} color={C.mu} />
        <TextInput value={q} onChangeText={setQ} placeholder="Chercher dans ma liste" placeholderTextColor="#6B6A85"
          accessibilityLabel="Chercher dans ma liste" style={{ flex: 1, minHeight: 48, color: C.tx, fontSize: 16 }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} style={{ flex: 1 }}>
          {['Tous', 'Séries', 'Films'].map((x) => <Chip key={x} label={x} small on={kind === x} onPress={() => setKind(x)} />)}
          <View style={{ width: 1, backgroundColor: C.line, marginHorizontal: 4 }} />
          {STATUSES.map((x) => <Chip key={x} label={x} small on={st === x} onPress={() => setSt(st === x ? 'Tous' : x)} />)}
        </ScrollView>
        <Pressable onPress={() => setMore(!more)} accessibilityRole="button" accessibilityLabel="Trier et filtrer par genre" accessibilityState={{ expanded: more }}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: more || genre !== 'Tous' || sort !== 'Ajout' ? C.ac : C.sf2, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="options-outline" size={20} color={more || genre !== 'Tous' || sort !== 'Ajout' ? C.acfg : C.tx} />
        </Pressable>
      </View>
      {more ? (
        <View style={{ gap: 12 }}>
          <Seg options={['Ajout', 'Note', 'Titre']} value={sort} onChange={setSort} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {['Tous', ...used].map((g) => <Chip key={g} label={g} small on={genre === g} onPress={() => setGenre(g)} />)}
          </ScrollView>
        </View>
      ) : null}
      {ids.length ? (
        <TitleGrid ids={ids}
          above={(id) => {
            const e = state.list[id];
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 18 }}>
                {e.note ? <><Ionicons name="star" size={15} color={C.gold} /><Text style={{ color: C.tx, fontWeight: '700', fontSize: 13 }}>{e.note}/10</Text></> : <Text style={{ color: C.mu, fontSize: 12 }}>pas de note</Text>}
              </View>
            );
          }}
          badge={(id) => (
            <>
              {state.list[id].fav ? (
                <View accessibilityLabel="Favori" style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="star" size={14} color={C.acfg} />
                </View>) : null}
              {state.list[id].feel.length ? (
                <View accessibilityLabel="Mon ressenti" style={{ position: 'absolute', left: 6, bottom: 6, flexDirection: 'row', backgroundColor: 'rgba(18,18,28,0.72)', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 13 }}>{state.list[id].feel.slice(0, 3).join('')}</Text>
                </View>) : null}
            </>)}
          extra={(id) => <><Text numberOfLines={1} style={{ color: C.mu, fontSize: 12 }}>{BY[id].genre}</Text><Pill status={state.list[id].status} /></>} />
      ) : <Text style={{ color: C.mu, textAlign: 'center', padding: 20 }}>Aucun titre ne correspond. Ajoute-en depuis le catalogue.</Text>}
    </Screen>
  );
}

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { TitleGrid } from '../../components/TitleGrid';
import { Chip, H1, Pill, Screen, Seg } from '../../components/ui';
import { BY, useStore } from '../../lib/store';
import { C } from '../../lib/theme';

export default function MaListe() {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('Tous');
  const [sort, setSort] = useState('Ajout');
  const all = Object.keys(state.list);
  const used = Array.from(new Set(all.map((id) => BY[id].genre))).sort();
  const ids = useMemo(() => {
    const k = q.trim().toLowerCase();
    const a = all.filter((id) => (genre === 'Tous' || BY[id].genre === genre) && (!k || BY[id].title.toLowerCase().includes(k)));
    if (sort === 'Note') a.sort((x, y) => state.list[y].note - state.list[x].note);
    if (sort === 'Titre') a.sort((x, y) => BY[x].title.localeCompare(BY[y].title, 'fr'));
    return a;
  }, [all.join(','), q, genre, sort, state.list]);

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
      <Seg options={['Ajout', 'Note', 'Titre']} value={sort} onChange={setSort} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {['Tous', ...used].map((g) => <Chip key={g} label={g} on={genre === g} onPress={() => setGenre(g)} />)}
      </ScrollView>
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
          badge={(id) => state.list[id].fav ? (
            <View accessibilityLabel="Favori" style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="star" size={14} color={C.acfg} />
            </View>) : null}
          extra={(id) => <><Text numberOfLines={1} style={{ color: C.mu, fontSize: 12 }}>{BY[id].genre}</Text><Pill status={state.list[id].status} /></>} />
      ) : <Text style={{ color: C.mu, textAlign: 'center', padding: 20 }}>Aucun titre ne correspond. Ajoute-en depuis le catalogue.</Text>}
    </Screen>
  );
}

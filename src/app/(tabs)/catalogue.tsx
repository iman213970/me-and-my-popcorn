import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { TitleGrid } from '../../components/TitleGrid';
import { Chip, H1, Mu, Screen, Seg } from '../../components/ui';
import { CATALOG } from '../../lib/catalog';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';


export default function Catalogue() {
  const { state, catalogVersion } = useStore();
  const GENRES = useMemo(() => Array.from(new Set(CATALOG.map((t) => t.genre))).sort(), [catalogVersion]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('Tous');
  const [genre, setGenre] = useState('Tous');
  const ids = useMemo(() => {
    const k = q.trim().toLowerCase();
    return CATALOG.filter((t) => (type === 'Tous' || `${t.type}s` === type) && (genre === 'Tous' || t.genre === genre) && (!k || t.title.toLowerCase().includes(k))).map((t) => t.id);
  }, [q, type, genre, catalogVersion]);

  return (
    <Screen>
      <H1>Catalogue</H1>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.sf, borderRadius: 14, paddingHorizontal: 14, gap: 10 }}>
        <Ionicons name="search" size={20} color={C.mu} />
        <TextInput value={q} onChangeText={setQ} placeholder="Chercher un film, une série, un anime" placeholderTextColor="#6B6A85"
          accessibilityLabel="Chercher un film ou une série" style={{ flex: 1, minHeight: 48, color: C.tx, fontSize: 16 }} />
      </View>
      <Seg options={['Tous', 'Séries', 'Films']} value={type} onChange={setType} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {['Tous', ...GENRES].map((g) => <Chip key={g} label={g} on={genre === g} onPress={() => setGenre(g)} />)}
      </ScrollView>
      {ids.length ? (
        <TitleGrid ids={ids} badge={(id) => state.list[id] ? (
          <View accessibilityLabel="Déjà dans ma liste" style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={16} color={C.acfg} />
          </View>) : null} />
      ) : <Text style={{ color: C.mu, textAlign: 'center', padding: 20 }}>Aucun titre trouvé.</Text>}
      <Mu size={12}>Les infos du catalogue (genre, épisodes, durée) sont les mêmes pour tout le monde et ne sont pas modifiables.</Mu>
    </Screen>
  );
}

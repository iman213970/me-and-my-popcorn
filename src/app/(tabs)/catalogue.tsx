import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { TitleGrid } from '../../components/TitleGrid';
import { Btn, Card, Chip, H1, Mu, Screen, Seg } from '../../components/ui';
import { CATALOG } from '../../lib/catalog';
import { BY, useStore } from '../../lib/store';
import { searchTmdb, type TmdbHit } from '../../lib/tmdb';
import { C } from '../../lib/theme';


export default function Catalogue() {
  const { state, catalogVersion, importTmdb, add } = useStore();
  const GENRES = useMemo(() => Array.from(new Set(CATALOG.map((t) => t.genre))).sort(), [catalogVersion]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('Tous');
  const [genre, setGenre] = useState('Tous');
  const [hits, setHits] = useState<TmdbHit[] | null>(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const search = async () => {
    setBusy('search'); setMsg('');
    const r = await searchTmdb(q.trim());
    setBusy(''); setHits(r.hits); if (r.error) setMsg(r.error); else if (!r.hits.length) setMsg('Rien trouvé sur TMDB.');
  };
  const pick = async (h: TmdbHit) => {
    setBusy(`${h.kind}-${h.id}`); setMsg('');
    const id = await importTmdb(h.kind, h.id);
    setBusy('');
    if (!id) { setMsg("Impossible d'ajouter ce titre pour l'instant."); return; }
    add(id); router.push(`/titre/${id}`);
  };
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
      {q.trim().length >= 2 ? (
        <Card>
          <Text style={{ color: C.tx, fontWeight: '700' }}>Pas dans la liste ?</Text>
          <Btn label={busy === 'search' ? 'Recherche…' : `Chercher « ${q.trim()} » sur TMDB`} icon="search" kind="alt" disabled={busy !== ''} onPress={search} />
          {msg ? <Text style={{ color: C.rose, fontSize: 13 }}>{msg}</Text> : null}
          {hits?.map((h) => {
            const known = !!BY[`tmdb-${h.kind}-${h.id}`];
            return (
              <View key={`${h.kind}-${h.id}`} style={{ backgroundColor: C.sf2, borderRadius: 14, padding: 12, gap: 6 }}>
                <Text style={{ color: C.tx, fontWeight: '700', fontSize: 15 }}>{h.title}</Text>
                <Mu size={12}>{h.kind === 'tv' ? 'Série' : 'Film'}{h.year ? ` · ${h.year}` : ''}</Mu>
                {h.overview ? <Text numberOfLines={3} style={{ color: C.soft, fontSize: 13, lineHeight: 18 }}>{h.overview}</Text> : null}
                <Btn label={busy === `${h.kind}-${h.id}` ? 'Ajout…' : known ? 'Ouvrir' : 'Ajouter à ma liste'} icon={known ? undefined : 'add'} disabled={busy !== ''}
                  onPress={() => (known ? router.push(`/titre/tmdb-${h.kind}-${h.id}`) : pick(h))} />
              </View>
            );
          })}
        </Card>
      ) : null}
      <Mu size={12}>This product uses the TMDB API but is not endorsed or certified by TMDB.</Mu>
      <Mu size={12}>Les infos du catalogue (genre, épisodes, durée) sont les mêmes pour tout le monde et ne sont pas modifiables.</Mu>
    </Screen>
  );
}

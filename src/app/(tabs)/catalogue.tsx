import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, View } from 'react-native';
import { TitleGrid } from '../../components/TitleGrid';
import { FadeIn, Press } from '../../components/fx';
import { Chip, Empty, H1, H2, Mu, Screen, Seg } from '../../components/ui';
import { CATALOG } from '../../lib/catalog';
import { useStore } from '../../lib/store';
import { browseTmdb, posterUrl, searchTmdb, type TmdbHit } from '../../lib/tmdb';
import { C, FONT_DISPLAY, FONT_DISPLAY_SEMI, SHADOW_SOFT } from '../../lib/theme';

export default function Catalogue() {
  const { state, catalogVersion, importTmdb } = useStore();
  const GENRES = useMemo(() => Array.from(new Set(CATALOG.map((t) => t.genre))).sort(), [catalogVersion]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('Tous');
  const [genre, setGenre] = useState('Tous');
  const [hits, setHits] = useState<TmdbHit[]>([]);
  const [trend, setTrend] = useState<TmdbHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const searching = q.trim().length >= 2;

  useEffect(() => {
    let alive = true;
    browseTmdb().then((r) => { if (!alive) return; setTrend(r.hits); if (r.error) setMsg(r.error); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!searching) { setHits([]); setLoading(false); return; }
    let alive = true; setLoading(true);
    const h = setTimeout(async () => {
      const r = await searchTmdb(q.trim());
      if (!alive) return;
      setLoading(false); setHits(r.hits);
      setMsg(r.error || (!r.hits.length ? 'Rien trouvé sur TMDB.' : ''));
    }, 450);
    return () => { alive = false; clearTimeout(h); };
  }, [q]);

  const pick = async (h: TmdbHit) => {
    setBusy(`${h.kind}-${h.id}`); setMsg('');
    try {
      const id = await importTmdb(h.kind, h.id);
      setBusy('');
      router.push(`/titre/${id}`);
    } catch (e) {
      setBusy('');
      setMsg(`Impossible d'ouvrir ce titre : ${e instanceof Error ? e.message : 'erreur inconnue'}`);
    }
  };
  const keep = (h: TmdbHit) => type === 'Tous' || (type === 'Séries' ? h.kind === 'tv' : h.kind === 'movie');

  const ids = useMemo(() => CATALOG.filter((t) => (!!t.poster || !!state.list[t.id]) && (type === 'Tous' || `${t.type}s` === type) && (genre === 'Tous' || t.genre === genre)).map((t) => t.id), [type, genre, catalogVersion, state.list]);

  const grid = (list: TmdbHit[]) => {
    const shown = list.filter(keep);
    const card = (h: TmdbHit, k: number) => {
      const key = `${h.kind}-${h.id}`;
      const inList = !!state.list[`tmdb-${key}`];
      return (
        <FadeIn key={key} delay={Math.min(k, 8) * 60}>
          <Press onPress={() => pick(h)} disabled={busy !== ''} accessibilityRole="button" accessibilityLabel={`Ouvrir ${h.title}`} style={{ gap: 8 }}>
            <View style={{ aspectRatio: 2 / 3, borderRadius: 22, backgroundColor: C.sf2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: SHADOW_SOFT }}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 40, fontFamily: FONT_DISPLAY }}>{h.title.charAt(0)}</Text>
              {h.poster ? <Image source={{ uri: posterUrl(h.poster) }} resizeMode="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} /> : null}
              {busy === key ? <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(18,18,28,0.6)', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.tx} /></View> : null}
              {inList ? <View accessibilityLabel="Déjà dans ma liste" style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="checkmark" size={18} color={C.acfg} /></View> : null}
            </View>
            <Text numberOfLines={2} style={{ color: C.tx, fontFamily: FONT_DISPLAY_SEMI, fontSize: 16, lineHeight: 20 }}>{h.title}</Text>
            <Text numberOfLines={1} style={{ color: C.mu, fontSize: 12 }}>{h.kind === 'tv' ? 'Série' : 'Film'}{h.year ? ` · ${h.year}` : ''}</Text>
          </Press>
        </FadeIn>
      );
    };
    if (!shown.length) return <Empty art="reel" title="Aucun résultat">Essaie un autre titre, ou une autre orthographe.</Empty>;
    return (
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 22 }}>{shown.map((h, k) => (k % 2 === 0 ? card(h, k) : null))}</View>
        <View style={{ flex: 1, gap: 22, marginTop: 34 }}>{shown.map((h, k) => (k % 2 === 1 ? card(h, k) : null))}</View>
      </View>
    );
  };

  return (
    <Screen>
      <H1>Catalogue</H1>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.sf, borderRadius: 99, paddingHorizontal: 18, gap: 10, boxShadow: SHADOW_SOFT }}>
        <Ionicons name="search" size={20} color={C.mu} />
        <TextInput value={q} onChangeText={setQ} placeholder="Chercher un film, une série, un anime" placeholderTextColor="#6B6A85"
          accessibilityLabel="Chercher un film ou une série" style={{ flex: 1, minHeight: 48, color: C.tx, fontSize: 16 }} />
        {loading ? <ActivityIndicator color={C.mu} /> : null}
      </View>
      <Seg options={['Tous', 'Séries', 'Films']} value={type} onChange={setType} />
      {msg ? <Text style={{ color: C.rose, fontSize: 13 }}>{msg}</Text> : null}

      {searching ? grid(hits) : (
        <>
          {trend.length ? <><H2>Tendances sur TMDB</H2>{grid(trend)}</> : null}
          {ids.length ? (
            <>
              <H2>Déjà ouverts</H2>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {['Tous', ...GENRES].map((g) => <Chip key={g} label={g} on={genre === g} onPress={() => setGenre(g)} />)}
              </ScrollView>
              <TitleGrid ids={ids} badge={(id) => state.list[id] ? (
                <View accessibilityLabel="Déjà dans ma liste" style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={16} color={C.acfg} />
                </View>) : null} />
            </>
          ) : null}
        </>
      )}
      <Mu size={12}>This product uses the TMDB API but is not endorsed or certified by TMDB.</Mu>
      <Mu size={12}>Les infos des fiches viennent de TMDB et ne sont pas modifiables.</Mu>
    </Screen>
  );
}

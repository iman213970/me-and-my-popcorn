import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { C, FONT_DISPLAY, FONT_DISPLAY_SEMI, SHADOW_SOFT } from '../lib/theme';
import { useStore } from '../lib/store';
import { posterUrl, similarTmdb, type TmdbHit } from '../lib/tmdb';
import { Press } from './fx';
import { H2, Mu } from './ui';

/** « Si tu as aimé » : recommandations TMDB sous la fiche d'un titre. */
export function Similar({ id }: { id: string }) {
  const { state, importTmdb } = useStore();
  const [hits, setHits] = useState<TmdbHit[] | null>(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!id.startsWith('tmdb-')) { setHits([]); return; }
    let alive = true; setHits(null);
    similarTmdb(id).then((r) => { if (alive) setHits(r.hits); });
    return () => { alive = false; };
  }, [id]);
  if (hits && !hits.length) return null;
  const open = async (h: TmdbHit) => {
    setBusy(`${h.kind}-${h.id}`); setErr('');
    try { const nid = await importTmdb(h.kind, h.id); setBusy(''); router.push(`/titre/${nid}`); }
    catch (e) { setBusy(''); setErr(`Impossible d'ouvrir ce titre : ${e instanceof Error ? e.message : 'erreur'}`); }
  };
  return (
    <View style={{ gap: 12 }}>
      <H2>Si tu as aimé, tu aimeras peut-être</H2>
      {hits === null ? <ActivityIndicator color={C.mu} /> : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 24, paddingRight: 6 }}>
          {hits.map((h, k) => {
            const key = `${h.kind}-${h.id}`;
            return (
              <Press key={key} onPress={() => open(h)} disabled={busy !== ''} accessibilityRole="button" accessibilityLabel={`Ouvrir ${h.title}`}
                style={{ width: 128, gap: 8, marginTop: k % 2 ? 18 : 0 }}>
                <View style={{ aspectRatio: 2 / 3, borderRadius: 20, backgroundColor: C.sf2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', boxShadow: SHADOW_SOFT }}>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 36, fontFamily: FONT_DISPLAY }}>{h.title.charAt(0)}</Text>
                  <Image source={{ uri: posterUrl(h.poster) }} resizeMode="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                  {busy === key ? <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(18,18,28,0.6)', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.tx} /></View> : null}
                </View>
                <Text numberOfLines={2} style={{ color: C.tx, fontFamily: FONT_DISPLAY_SEMI, fontSize: 14, lineHeight: 18 }}>{h.title}</Text>
                <Mu size={12}>{h.kind === 'tv' ? 'Série' : 'Film'}{h.year ? ` · ${h.year}` : ''}{state.list[`tmdb-${key}`] ? ' · dans ta liste' : ''}</Mu>
              </Press>
            );
          })}
        </ScrollView>
      )}
      {err ? <Text style={{ color: C.rose, fontSize: 13 }}>{err}</Text> : null}
    </View>
  );
}

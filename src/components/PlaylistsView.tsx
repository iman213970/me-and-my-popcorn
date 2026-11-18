import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { fmtLong } from '../lib/calc';
import { remainingMin, usePlaylists, type Playlist } from '../lib/playlists';
import { BY, useStore } from '../lib/store';
import { C, FONT_DISPLAY_SEMI, SHADOW_SOFT } from '../lib/theme';
import { FadeIn, Press } from './fx';
import { Sheet } from './Sheet';
import { Btn, Empty, Field, Mu, Poster, Switch } from './ui';

/** Petit réglage « compter dans l'accueil » (interrupteur). */
export function Toggles({ pl, onChange }: { pl: Playlist; onChange: (key: 'in_time' | 'in_releases', v: boolean) => void }) {
  return (
    <View style={{ gap: 0 }}>
      <Switch on={pl.inTime} onChange={(v) => onChange('in_time', v)} label="Compter dans le temps restant" />
      <Switch on={pl.inReleases} onChange={(v) => onChange('in_releases', v)} label="Suivre les sorties" />
    </View>
  );
}

export function PlaylistsView() {
  const { state } = useStore();
  const { playlists, notices, error, create, dismissNotice } = usePlaylists();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const make = async () => {
    setBusy(true);
    const id = await create(name);
    setBusy(false);
    if (id) { setOpen(false); setName(''); router.push(`/playlist/${id}`); }
  };

  return (
    <View style={{ gap: 14 }}>
      {error ? (
        <View style={{ backgroundColor: '#3A1D24', borderRadius: 22, padding: 14, gap: 4 }}>
          <Text style={{ color: C.rose, fontWeight: '700' }}>Playlists indisponibles pour l'instant</Text>
          <Mu size={12}>{error}</Mu>
        </View>
      ) : null}
      {notices.map((n) => (
        <View key={n.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: C.sf, borderRadius: 22, padding: 14, borderWidth: 1, borderColor: 'rgba(255,123,138,0.45)' }}>
          <Text style={{ fontSize: 22 }}>🎬</Text>
          <Text style={{ flex: 1, color: C.tx, fontSize: 13, lineHeight: 18 }}>{n.body}</Text>
          <Press onPress={() => dismissNotice(n.id)} accessibilityLabel="Fermer le message" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={20} color={C.mu} /></Press>
        </View>
      ))}

      {playlists.map((pl, k) => {
        const ids = pl.items.filter((x) => BY[x]);
        const rest = remainingMin(ids, state.list);
        return (
          <FadeIn key={pl.id} delay={Math.min(k, 6) * 60}>
            <Press onPress={() => router.push(`/playlist/${pl.id}`)} accessibilityRole="button" accessibilityLabel={`Ouvrir la playlist ${pl.name}`} zoom={1.01} down={0.98}
              style={{ backgroundColor: C.sf, borderRadius: 28, padding: 14, gap: 12, borderWidth: 1, borderColor: pl.shared ? 'rgba(79,224,240,0.4)' : C.line, boxShadow: pl.shared ? '0px 0px 26px rgba(79,224,240,0.1)' : SHADOW_SOFT }}>
              <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                <View style={{ width: 92, height: 84 }}>
                  {ids.slice(0, 3).map((id, i) => (
                    <View key={id} style={{ position: 'absolute', left: i * 20, top: i === 1 ? 2 : 10, width: 52, transform: [{ rotate: i === 0 ? '-9deg' : i === 2 ? '9deg' : '0deg' }], zIndex: i === 1 ? 2 : 1 }}>
                      <Poster t={BY[id]} w={52} rounded={12} />
                    </View>
                  ))}
                  {!ids.length ? <View style={{ width: 52, height: 78, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" size={22} color={C.mu} /></View> : null}
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text numberOfLines={2} style={{ color: C.tx, fontFamily: FONT_DISPLAY_SEMI, fontSize: 19 }}>{pl.name}</Text>
                  <Mu size={12}>{ids.length} titre{ids.length > 1 ? 's' : ''}{ids.length ? ` · ${fmtLong(rest)} restantes` : ''}</Mu>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <View style={{ borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: pl.shared ? 'rgba(79,224,240,0.12)' : 'rgba(163,162,188,0.14)' }}>
                      <Text style={{ color: pl.shared ? C.cyan : C.mu, fontSize: 11, fontWeight: '700' }}>{pl.shared ? `Partagée · ${pl.members.length} personnes` : 'Privée'}</Text>
                    </View>
                    {pl.inTime ? <Text style={{ color: C.gold, fontSize: 11, fontWeight: '700' }}>⏱ accueil</Text> : null}
                    {pl.inReleases ? <Text style={{ color: C.gold, fontSize: 11, fontWeight: '700' }}>📅 sorties</Text> : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.mu} />
              </View>
            </Press>
          </FadeIn>
        );
      })}

      {!playlists.length && !error ? <Empty art="reel" title="Aucune playlist">Crée ta première playlist, par exemple « Soirées cosy » ou « À finir avant décembre ».</Empty> : null}
      <Btn label="Nouvelle playlist" icon="add" onPress={() => setOpen(true)} />

      <Sheet open={open} onClose={() => setOpen(false)} title="Nouvelle playlist">
        <Field label="Nom de la playlist" value={name} onChangeText={setName} placeholder="Soirées cosy" maxLength={40} />
        <Mu size={12}>Elle est privée au début. Tu pourras la partager avec un proche ensuite.</Mu>
        <Btn label={busy ? 'Création…' : 'Créer'} disabled={busy} onPress={make} />
      </Sheet>
    </View>
  );
}

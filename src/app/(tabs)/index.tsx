import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { TitleGrid } from '../../components/TitleGrid';
import { Avatar, Bar, Card, H1, H2, Mu, Poster, Screen } from '../../components/ui';
import { fmtLong, pos, total } from '../../lib/calc';
import { BY, useStore } from '../../lib/store';
import { C } from '../../lib/theme';

export default function Accueil() {
  const { state, setWatched } = useStore();
  const ids = Object.keys(state.list);
  let tot = 0, seen = 0, nSeen = 0;
  ids.forEach((id) => {
    const t = BY[id], e = state.list[id];
    tot += total(t) * t.dur; seen += e.watched * t.dur; if (e.watched > 0) nSeen++;
  });
  const rest = tot - seen, pct = tot ? Math.round((seen / tot) * 100) : 0;
  const enCours = ids.filter((id) => state.list[id].status === 'En cours');
  const favs = ids.filter((id) => state.list[id].fav);
  const aVoir = ids.filter((id) => state.list[id].status === 'À regarder');
  const cnt: Record<string, number> = {};
  ids.forEach((id) => { const g = BY[id].genre; cnt[g] = (cnt[g] || 0) + 1; });
  const genres = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]);
  const mx = genres.length ? cnt[genres[0]] : 1;
  const series = ids.filter((id) => BY[id].type === 'Série' && state.list[id].watched > 0).length;
  const films = ids.filter((id) => BY[id].type === 'Film' && state.list[id].watched > 0).length;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View><H1>Accueil</H1><Mu size={14}>Ton suivi en un coup d'œil</Mu></View>
        <Pressable onPress={() => router.push('/profil')} accessibilityLabel="Mon profil"><Avatar i={state.prefs.avatar} /></Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Tile label="Séries regardées" value={String(series)} />
        <Tile label="Films regardés" value={String(films)} />
      </View>

      <Card style={{ gap: 12 }}>
        <Mu>Temps de visionnage total</Mu>
        <Text style={{ color: C.tx, fontSize: 24, fontWeight: '700' }}>{fmtLong(tot)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Bar pct={pct} gold /><Mu size={12}>{pct} %</Mu></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: C.mu, fontSize: 13 }}>Regardé <Text style={{ color: C.tx, fontWeight: '700' }}>{fmtLong(seen)}</Text></Text>
          <Text style={{ color: C.mu, fontSize: 13 }}>Restant <Text style={{ color: C.tx, fontWeight: '700' }}>{fmtLong(rest)}</Text></Text>
        </View>
        <Mu size={12}>Calcul : épisodes × durée moyenne d'un épisode, pour chaque titre de ta liste.</Mu>
      </Card>

      <View style={{ gap: 12 }}>
        <H2>En cours</H2>
        {enCours.length ? enCours.map((id) => {
          const t = BY[id], e = state.list[id], tt = total(t), p = pos(t, e.watched);
          return (
            <Card key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
              <Pressable onPress={() => router.push(`/titre/${id}`)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }} accessibilityRole="button" accessibilityLabel={`Ouvrir ${t.title}`}>
                <Poster t={t} w={52} rounded={10} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ color: C.tx, fontSize: 16, fontWeight: '700' }}>{t.title}</Text>
                  <Mu>Saison {p.s} · épisode {p.e}</Mu>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Bar pct={(e.watched / tt) * 100} /><Mu size={12}>{e.watched} / {tt}</Mu></View>
                </View>
              </Pressable>
              <Pressable onPress={() => setWatched(id, e.watched + 1)} accessibilityRole="button" accessibilityLabel={`Ajouter un épisode à ${t.title}`}
                style={{ height: 44, paddingHorizontal: 14, borderRadius: 99, backgroundColor: C.ac, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: C.acfg, fontWeight: '700', fontSize: 14 }}>+1 ép.</Text>
              </Pressable>
            </Card>
          );
        }) : <Text style={empty}>Aucune série en cours.</Text>}
      </View>

      <Card>
        <H2>Répartition par genre</H2>
        {genres.length ? genres.map((g) => (
          <View key={g} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ color: C.tx, width: 110, fontSize: 14 }} numberOfLines={1}>{g}</Text>
            <Bar pct={(cnt[g] / mx) * 100} />
            <Text style={{ color: C.tx, fontWeight: '700', width: 24, textAlign: 'right' }}>{cnt[g]}</Text>
          </View>
        )) : <Text style={empty}>Ajoute des titres pour voir la répartition.</Text>}
      </Card>

      <View style={{ gap: 12 }}><H2>Mes favoris</H2>{favs.length ? <TitleGrid ids={favs} /> : <Text style={empty}>Rien pour l'instant.</Text>}</View>
      <View style={{ gap: 12 }}><H2>À regarder</H2>{aVoir.length ? <TitleGrid ids={aVoir} /> : <Text style={empty}>Rien pour l'instant.</Text>}</View>
    </Screen>
  );
}

const empty = { color: C.mu, fontSize: 14, textAlign: 'center' as const, padding: 12 };
function Tile({ label, value }: { label: string; value: string }) {
  return <View style={{ flex: 1, backgroundColor: C.sf, borderRadius: 16, padding: 14, gap: 6 }}><Mu size={12}>{label}</Mu><Text style={{ color: C.tx, fontSize: 28, fontWeight: '700' }}>{value}</Text></View>;
}

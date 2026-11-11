import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ClapArt, ReelArt } from '../../components/Cine';
import { FadeIn, Press } from '../../components/fx';
import { TitleGrid } from '../../components/TitleGrid';
import { Avatar, Bar, Btn, Card, Empty, H1, H2, Mu, Poster, Screen, Stars } from '../../components/ui';
import { dateKey, fmtDur, fmtLong, pos, total } from '../../lib/calc';
import { BY, useStore } from '../../lib/store';
import { C, FONT_DISPLAY, FONT_DISPLAY_SEMI, SHADOW, SHADOW_SOFT } from '../../lib/theme';

function greeting(name: string, nCours: number, nDone: number) {
  const h = new Date().getHours();
  const hello = h < 5 ? 'Encore debout' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  const who = name.trim() ? ` ${name.trim()}` : '';
  const sub = nCours > 1 ? `${nCours} histoires t'attendent en cours. Laquelle ce soir ?`
    : nCours === 1 ? "Ton épisode du moment n'attend que toi."
    : nDone > 0 ? 'Prête pour la prochaine séance ?' : 'Ajoute ton premier titre, le pop-corn est prêt.';
  return { title: `${hello}${who}`, sub };
}

export default function Accueil() {
  const { state, setWatched } = useStore();
  const ids = Object.keys(state.list);
  let tot = 0, seen = 0;
  ids.forEach((id) => { const t = BY[id], e = state.list[id]; tot += total(t) * t.dur; seen += e.watched * t.dur; });
  const rest = tot - seen, pct = tot ? Math.round((seen / tot) * 100) : 0;
  const enCours = ids.filter((id) => state.list[id].status === 'En cours');
  const best = ids.filter((id) => state.list[id].note > 0).sort((a, b) => state.list[b].note - state.list[a].note).slice(0, 6);
  const lastDone = ids.map((id, k) => ({ id, k })).filter((x) => state.list[x.id].status === 'Terminé')
    .sort((a, b) => (dateKey(state.list[b.id].end) - dateKey(state.list[a.id].end)) || (b.k - a.k))[0]?.id;
  const favs = ids.filter((id) => state.list[id].fav);
  const aVoir = ids.filter((id) => state.list[id].status === 'À regarder');
  const cnt: Record<string, number> = {};
  ids.forEach((id) => { const g = BY[id].genre; cnt[g] = (cnt[g] || 0) + 1; });
  const genres = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]);
  const mx = genres.length ? cnt[genres[0]] : 1;
  const series = ids.filter((id) => BY[id].type === 'Série' && state.list[id].watched > 0).length;
  const films = ids.filter((id) => BY[id].type === 'Film' && state.list[id].watched > 0).length;
  const nDone = ids.filter((id) => state.list[id].status === 'Terminé').length;
  const hero = enCours.slice().sort((a, b) => state.list[b].watched / total(BY[b]) - state.list[a].watched / total(BY[a]))[0] ?? best[0] ?? aVoir[0];
  const g = greeting(state.prefs.pseudo, enCours.length, nDone);

  const heroCard = () => {
    if (!hero) return (
      <Card style={{ alignItems: 'center' }}>
        <Empty art="clap" title="La salle est vide">Cherche un film ou une série dans le catalogue et lance la séance.</Empty>
        <Btn label="Ouvrir le catalogue" icon="search" onPress={() => router.push('/catalogue')} />
      </Card>
    );
    const t = BY[hero], e = state.list[hero], tt = total(t), p = pos(t, e.watched);
    const film = t.type === 'Film', going = e.status === 'En cours';
    return (
      <Press onPress={() => router.push(`/titre/${hero}`)} accessibilityRole="button" accessibilityLabel={`Ouvrir ${t.title}`} zoom={1.01} down={0.98}>
        <LinearGradient colors={[C.wine, '#241C4D', C.sf]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 36, padding: 18, flexDirection: 'row', gap: 16, alignItems: 'center', overflow: 'hidden', boxShadow: SHADOW }}>
          <View style={{ position: 'absolute', right: -34, top: -34 }}><ReelArt size={150} opacity={0.14} /></View>
          <View style={{ width: 118, transform: [{ rotate: '-4deg' }] }}><Poster t={t} rounded={24} /></View>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ color: C.gold, fontSize: 12, fontWeight: '700', letterSpacing: 1.2 }}>{going ? "À L'AFFICHE POUR TOI" : e.note ? 'TON COUP DE CŒUR' : 'À VOIR CE SOIR'}</Text>
            <Text numberOfLines={3} style={{ color: C.tx, fontFamily: FONT_DISPLAY, fontSize: 24, lineHeight: 28 }}>{t.title}</Text>
            <Mu>{film ? `Film · ${fmtDur(t.dur)}` : going ? `Saison ${p.s} · épisode ${p.e}` : `${t.genre} · ${t.year}`}</Mu>
            {going && !film ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Bar pct={(e.watched / tt) * 100} /><Mu size={12}>{e.watched}/{tt}</Mu></View> : null}
            {e.note ? <Stars note={e.note} /> : null}
          </View>
        </LinearGradient>
      </Press>
    );
  };

  return (
    <Screen>
      <FadeIn>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}><H1>{g.title}</H1><Mu size={14}>{g.sub}</Mu></View>
          <Press onPress={() => router.push('/profil')} accessibilityLabel="Mon profil" style={{ padding: 3, borderRadius: 40, borderWidth: 2, borderColor: C.gold }}><Avatar i={state.prefs.avatar} size={52} /></Press>
        </View>
      </FadeIn>

      <FadeIn delay={80}>{heroCard()}</FadeIn>

      <FadeIn delay={140}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <Tile icon="tv-outline" label="Séries regardées" value={String(series)} />
          <Tile icon="film-outline" label="Films regardés" value={String(films)} down />
        </View>
      </FadeIn>

      <FadeIn delay={200}>
        <LinearGradient colors={['#2A1319', C.sf]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 32, padding: 20, gap: 12, boxShadow: SHADOW_SOFT }}>
          <Mu>Temps de visionnage total</Mu>
          <Text style={{ color: C.gold, fontSize: 30, fontFamily: FONT_DISPLAY }}>{fmtLong(tot)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Bar pct={pct} gold /><Mu size={12}>{pct} %</Mu></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: C.mu, fontSize: 13 }}>Regardé <Text style={{ color: C.tx, fontWeight: '700' }}>{fmtLong(seen)}</Text></Text>
            <Text style={{ color: C.mu, fontSize: 13 }}>Restant <Text style={{ color: C.tx, fontWeight: '700' }}>{fmtLong(rest)}</Text></Text>
          </View>
          <Mu size={12}>Calcul : épisodes × durée moyenne d'un épisode, pour chaque titre de ta liste.</Mu>
        </LinearGradient>
      </FadeIn>

      <View style={{ gap: 12 }}>
        <H2>En cours</H2>
        {enCours.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 26, paddingRight: 6 }}>
            {enCours.map((id, k) => {
              const t = BY[id], e = state.list[id], tt = total(t), p = pos(t, e.watched), film = t.type === 'Film';
              return (
                <FadeIn key={id} delay={k * 70} style={{ width: 150, marginTop: k % 2 ? 22 : 0 }}>
                  <Press onPress={() => router.push(`/titre/${id}`)} accessibilityRole="button" accessibilityLabel={`Ouvrir ${t.title}`} style={{ gap: 8 }}>
                    <Poster t={t} />
                    <Text numberOfLines={2} style={{ color: C.tx, fontFamily: FONT_DISPLAY_SEMI, fontSize: 16, lineHeight: 20 }}>{t.title}</Text>
                    <Mu size={12}>{film ? `Film · ${fmtDur(t.dur)}` : `S${p.s} · ép. ${p.e}`}</Mu>
                    {film ? null : <Bar pct={(e.watched / tt) * 100} />}
                  </Press>
                  <Press onPress={() => setWatched(id, e.watched + 1)} accessibilityRole="button" accessibilityLabel={film ? `Marquer ${t.title} comme vu` : `Ajouter un épisode à ${t.title}`}
                    style={{ marginTop: 10, height: 44, borderRadius: 99, backgroundColor: C.ac, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, boxShadow: '0px 6px 16px rgba(139,124,255,0.35)' }}>
                    <Ionicons name={film ? 'checkmark' : 'add'} size={18} color={C.acfg} />
                    <Text style={{ color: C.acfg, fontWeight: '700', fontSize: 14 }}>{film ? 'Vu' : '+1 épisode'}</Text>
                  </Press>
                </FadeIn>
              );
            })}
          </ScrollView>
        ) : <Empty art="reel" title="Rien en cours">Lance une série, elle apparaîtra ici avec son bouton +1.</Empty>}
      </View>

      {lastDone ? (
        <View style={{ gap: 12 }}>
          <H2>Dernier terminé</H2>
          <Press onPress={() => router.push(`/titre/${lastDone}`)} accessibilityRole="button" accessibilityLabel={`Ouvrir ${BY[lastDone].title}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.sf, borderRadius: 32, padding: 14, boxShadow: SHADOW_SOFT }}>
            <View style={{ width: 70 }}><Poster t={BY[lastDone]} rounded={18} /></View>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={{ color: C.tx, fontFamily: FONT_DISPLAY_SEMI, fontSize: 18 }}>{BY[lastDone].title}</Text>
              <Mu>{state.list[lastDone].end ? `Fini le ${state.list[lastDone].end}` : 'Terminé'}</Mu>
              {state.list[lastDone].note ? <Stars note={state.list[lastDone].note} /> : null}
              {state.list[lastDone].feel.length ? <Text style={{ fontSize: 18 }}>{state.list[lastDone].feel.slice(0, 5).join(' ')}</Text> : null}
            </View>
          </Press>
        </View>
      ) : null}

      <View style={{ gap: 12 }}>
        <H2>Les mieux notés</H2>
        {best.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 24, paddingRight: 6 }}>
            {best.map((id, k) => (
              <FadeIn key={id} delay={k * 70} style={{ width: 132, marginTop: k % 2 ? 20 : 0 }}>
                <Press onPress={() => router.push(`/titre/${id}`)} accessibilityRole="button" accessibilityLabel={`Ouvrir ${BY[id].title}`} style={{ gap: 8 }}>
                  <View>
                    <Poster t={BY[id]} />
                    <View style={{ position: 'absolute', left: -6, top: -8, width: 34, height: 34, borderRadius: 17, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', boxShadow: SHADOW_SOFT }}>
                      <Text style={{ color: C.acfg, fontFamily: FONT_DISPLAY, fontSize: 17 }}>{k + 1}</Text>
                    </View>
                  </View>
                  <Stars note={state.list[id].note} size={11} />
                  <Text numberOfLines={1} style={{ color: C.tx, fontWeight: '700', fontSize: 14 }}>{BY[id].title}</Text>
                </Press>
              </FadeIn>
            ))}
          </ScrollView>
        ) : <Empty art="ticket" title="Pas encore de notes">Note un titre sur sa fiche, il montera sur le podium.</Empty>}
      </View>

      <Card>
        <H2>Répartition par genre</H2>
        {genres.length ? genres.map((gr) => (
          <View key={gr} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ color: C.tx, width: 110, fontSize: 14 }} numberOfLines={1}>{gr}</Text>
            <Bar pct={(cnt[gr] / mx) * 100} />
            <Text style={{ color: C.tx, fontWeight: '700', width: 24, textAlign: 'right' }}>{cnt[gr]}</Text>
          </View>
        )) : <Mu>Ajoute des titres pour voir la répartition.</Mu>}
      </Card>

      <View style={{ gap: 12 }}><H2>Mes favoris</H2>{favs.length ? <TitleGrid ids={favs} /> : <Empty art="popcorn" title="Aucun favori">Touche l'étoile sur une fiche pour la mettre ici.</Empty>}</View>
      <View style={{ gap: 12 }}><H2>À regarder</H2>{aVoir.length ? <TitleGrid ids={aVoir} /> : <Empty art="ticket" title="Ta pile est vide">Quand tu ajoutes un titre, il attend ici sa séance.</Empty>}</View>
    </Screen>
  );
}

function Tile({ icon, label, value, down }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; down?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.sf, borderRadius: 32, padding: 16, gap: 8, marginTop: down ? 18 : 0, boxShadow: SHADOW_SOFT }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(139,124,255,0.18)', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={20} color={C.ac} /></View>
      <Text style={{ color: C.tx, fontSize: 34, fontFamily: FONT_DISPLAY }}>{value}</Text>
      <Mu size={12}>{label}</Mu>
    </View>
  );
}

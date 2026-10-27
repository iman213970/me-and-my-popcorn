import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bar, Btn, Card, Chip, Chips, Field, H1, H2, Kv, Mu, Poster, Switch } from '../../components/ui';
import { cum, fmtH, pos, total } from '../../lib/calc';
import { BY, STATUSES, useStore, type Visibility } from '../../lib/store';
import { C } from '../../lib/theme';
import { PLATFORMS } from '../../lib/options';

export default function Fiche() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, add, remove, patch, setWatched, patchPrefs } = useStore();
  const [confirm, setConfirm] = useState(false);
  const [newPlat, setNewPlat] = useState<string | null>(null);
  const t = BY[String(id)];
  if (!t) return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}><Text style={{ color: C.tx, padding: 20 }}>Titre introuvable.</Text></SafeAreaView>;
  const e = state.list[t.id];
  const tot = total(t);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const info = (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Kv label="Genre" value={t.genre} />
        <Kv label="Statut de diffusion" value={t.diff} />
        <Kv label="Épisodes par saison" value={t.eps.join(', ')} />
        <Kv label="Durée moyenne" value={`${t.dur} min`} />
        <Kv label="Année de production" value={t.year} />
        <Kv label="Saisons" value={t.eps.length} />
        <Kv label="Réalisateurs" value={t.dir} span />
      </View>
      <View style={{ gap: 8 }}><H2>Résumé</H2><Text style={{ color: C.soft, fontSize: 15, lineHeight: 22 }}>{t.sum}</Text></View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: e ? 40 : 110 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={[t.c[0], C.bg]} style={{ height: e ? 250 : 310, alignItems: 'center', justifyContent: 'center' }}>
          <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0 }}>
            <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Retour"
              style={{ margin: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(18,18,28,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="chevron-back" size={22} color={C.tx} />
            </Pressable>
          </SafeAreaView>
          <View style={{ width: e ? 112 : 150 }}><Poster t={t} /></View>
        </LinearGradient>

        <View style={{ padding: 20, gap: 18, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              <H1>{t.title}</H1>
              {e ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#12312E', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}><Ionicons name="checkmark" size={12} color={C.mint} /><Text style={{ color: C.mint, fontSize: 12, fontWeight: '700' }}>Dans ma liste</Text></View> : null}
            </View>
            <Mu size={14}>{t.type} · {t.year} · {t.eps.length} saison{t.eps.length > 1 ? 's' : ''} · {t.dur} min</Mu>
          </View>

          {!e ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="lock-closed-outline" size={16} color={C.mu} /><Mu>Infos du catalogue (non modifiables)</Mu></View>
              {info}
            </>
          ) : (() => {
            const p = pos(t, e.watched), totMin = tot * t.dur, seen = e.watched * t.dur;
            const plats = Array.from(new Set(['', ...PLATFORMS, ...state.prefs.customPlats, ...(e.plat ? [e.plat] : [])]));
            return (
              <>
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="lock-closed-outline" size={16} color={C.mu} /><Mu>Infos du catalogue (non modifiables)</Mu></View>
                  {info}
                </Card>

                <Card>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><H2>Mon suivi</H2><Tag label="optionnel" /></View>
                  <View style={{ gap: 6 }}>
                    <Mu size={12}>Avancement</Mu>
                    <Chips>{STATUSES.map((s) => <Chip key={s} label={s} on={e.status === s} onPress={() => (s === 'Terminé' ? setWatched(t.id, tot) : patch(t.id, { status: s }))} />)}</Chips>
                  </View>
                  <View style={{ gap: 6 }}>
                    <Mu size={12}>Progression</Mu>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Stepper label="Saison" value={p.s}
                        onMinus={() => { const s = Math.max(1, p.s - 1); setWatched(t.id, cum(t, s - 1) + Math.min(p.e, t.eps[s - 1])); }}
                        onPlus={() => { const s = Math.min(t.eps.length, p.s + 1); setWatched(t.id, cum(t, s - 1) + Math.min(p.e, t.eps[s - 1])); }} />
                      <Stepper label="Épisode" value={p.e}
                        onMinus={() => setWatched(t.id, cum(t, p.s - 1) + Math.max(0, p.e - 1))}
                        onPlus={() => setWatched(t.id, cum(t, p.s - 1) + Math.min(t.eps[p.s - 1], p.e + 1))} />
                    </View>
                  </View>
                  <Btn label="+1 épisode" onPress={() => setWatched(t.id, e.watched + 1)} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Bar pct={(e.watched / tot) * 100} /><Mu size={12}>{e.watched} sur {tot}</Mu></View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <Kv third label="Total" value={fmtH(totMin)} /><Kv third label="Regardé" value={fmtH(seen)} /><Kv third label="Restant" value={fmtH(totMin - seen)} />
                  </View>
                  <Mu size={12}>Total = {tot} épisodes × {t.dur} min. Regardé = {e.watched} × {t.dur} min.</Mu>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}><Field label="Date de début" value={e.start} onChangeText={(v) => patch(t.id, { start: v })} placeholder="jj/mm/aaaa" /></View>
                    <View style={{ flex: 1 }}><Field label="Date de fin" value={e.end} onChangeText={(v) => patch(t.id, { end: v })} placeholder="jj/mm/aaaa" /></View>
                  </View>
                  <View style={{ gap: 6 }}>
                    <Mu size={12}>Plateforme</Mu>
                    <Chips>
                      {plats.filter(Boolean).map((p2) => <Chip key={p2} label={p2} small on={e.plat === p2} onPress={() => patch(t.id, { plat: e.plat === p2 ? '' : p2 })} />)}
                    </Chips>
                    {newPlat === null ? (
                      <Pressable onPress={() => setNewPlat('')} style={{ minHeight: 44, justifyContent: 'center' }} accessibilityRole="button"><Text style={{ color: C.mu, fontSize: 13 }}>+ Autre plateforme</Text></Pressable>
                    ) : (
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                        <View style={{ flex: 1 }}><Field label="Nom de la plateforme" value={newPlat} onChangeText={setNewPlat} maxLength={24} /></View>
                        <View style={{ width: 110 }}><Btn label="Ajouter" kind="alt" onPress={() => {
                          const n = newPlat.trim(); if (!n) return;
                          if (!PLATFORMS.includes(n) && !state.prefs.customPlats.includes(n)) patchPrefs({ customPlats: [...state.prefs.customPlats, n] });
                          patch(t.id, { plat: n }); setNewPlat(null);
                        }} /></View>
                      </View>
                    )}
                  </View>
                  <Switch label="Favori" on={e.fav} onChange={(v) => patch(t.id, { fav: v })} />
                </Card>

                <Card>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><H2>Mon avis</H2><Tag label="optionnel" /></View>
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <Mu size={12}>Ma note</Mu>
                      <Text style={{ color: C.gold, fontSize: 20, fontWeight: '700' }}>{e.note}<Text style={{ color: C.mu, fontSize: 14 }}> / 10</Text></Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <Pressable key={n} onPress={() => patch(t.id, { note: e.note === n ? 0 : n })} accessibilityRole="button" accessibilityLabel={`${n} sur 10`} accessibilityState={{ selected: e.note >= n }}
                          style={{ width: '10%', minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name={e.note >= n ? 'star' : 'star-outline'} size={22} color={e.note >= n ? C.gold : '#6B6A85'} />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View style={{ gap: 6 }}>
                    <Mu size={12}>Qui voit mon avis</Mu>
                    <Chips>{(['Moi', 'Amis', 'Public'] as Visibility[]).map((v) => <Chip key={v} label={v} on={e.vis === v} onPress={() => patch(t.id, { vis: v })} />)}</Chips>
                  </View>
                  <Field label="Avis" value={e.avis} onChangeText={(v) => patch(t.id, { avis: v })} multiline placeholder="Ton avis sur la série" />
                  <Field label="Citation préférée" value={e.cit} onChangeText={(v) => patch(t.id, { cit: v })} placeholder="Ta citation préférée" />
                  <Field label="Personnage préféré" value={e.perso} onChangeText={(v) => patch(t.id, { perso: v })} placeholder="Ton personnage préféré" />
                  <Field label="Moment préféré" value={e.moment} onChangeText={(v) => patch(t.id, { moment: v })} placeholder="Ton moment préféré" />
                </Card>

                {confirm ? (
                  <Card>
                    <Text style={{ color: C.tx }}>Retirer « {t.title} » de ta liste ? Ta progression et ton avis seront perdus.</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}><Btn label="Annuler" kind="alt" onPress={() => setConfirm(false)} /></View>
                      <View style={{ flex: 1 }}><Btn label="Retirer" kind="danger" onPress={() => { remove(t.id); setConfirm(false); back(); }} /></View>
                    </View>
                  </Card>
                ) : <Btn label="Retirer de ma liste" kind="danger" onPress={() => setConfirm(true)} />}
              </>
            );
          })()}
        </View>
      </ScrollView>

      {!e ? (
        <SafeAreaView edges={['bottom']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.sf, borderTopWidth: 1, borderTopColor: C.line }}>
          <View style={{ padding: 14, width: '100%', maxWidth: 520, alignSelf: 'center' }}><Btn label="Ajouter à ma liste" icon="add" onPress={() => add(t.id)} /></View>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

function Tag({ label }: { label: string }) {
  return <View style={{ borderWidth: 1, borderColor: '#3A3A55', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}><Text style={{ color: C.mu, fontSize: 11 }}>{label}</Text></View>;
}
function Stepper({ label, value, onMinus, onPlus }: { label: string; value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.sf2, borderRadius: 14, padding: 4 }}>
      <Pressable onPress={onMinus} accessibilityRole="button" accessibilityLabel={`${label} précédente`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="remove" size={20} color={C.tx} /></Pressable>
      <View style={{ alignItems: 'center' }}><Text style={{ color: C.mu, fontSize: 11 }}>{label}</Text><Text style={{ color: C.tx, fontSize: 18, fontWeight: '700' }}>{value}</Text></View>
      <Pressable onPress={onPlus} accessibilityRole="button" accessibilityLabel={`${label} suivante`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" size={20} color={C.tx} /></Pressable>
    </View>
  );
}

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar, AVATAR_COLORS, Btn, Card, Chip, Chips, Field, H1, H2, Mu, Screen, Switch } from '../../components/ui';
import { fmtLong, total } from '../../lib/calc';
import { FAV_GENRES, PLATFORMS } from '../../lib/options';
import { BY, useStore } from '../../lib/store';
import { C } from '../../lib/theme';

const toggle = (a: string[], v: string) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);

export default function Profil() {
  const { state, patchPrefs, reset } = useStore();
  const P = state.prefs;
  const [open, setOpen] = useState(false);
  const [np, setNp] = useState('');
  const [del, setDel] = useState(false);
  const ids = Object.keys(state.list);
  let seen = 0;
  ids.forEach((id) => { seen += state.list[id].watched * BY[id].dur; });
  void total;

  return (
    <Screen>
      <H1>Profil</H1>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityLabel="Changer d'avatar" accessibilityState={{ expanded: open }}><Avatar i={P.avatar} size={72} /></Pressable>
          <View style={{ flex: 1 }}><Field label="Pseudo" value={P.pseudo} onChangeText={(v) => patchPrefs({ pseudo: v })} placeholder="Ton pseudo" maxLength={24} /></View>
        </View>
        {open ? (
          <View style={{ gap: 8 }}>
            <Mu size={12}>Choisis ton avatar</Mu>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {AVATAR_COLORS.map((_, i) => (
                <Pressable key={i} onPress={() => { patchPrefs({ avatar: i }); setOpen(false); }} accessibilityRole="button" accessibilityLabel={`Avatar ${i + 1}`}
                  style={{ padding: 3, borderRadius: 40, borderWidth: 2, borderColor: P.avatar === i ? C.tx : 'transparent' }}><Avatar i={i} size={56} /></Pressable>
              ))}
            </View>
          </View>
        ) : null}
        <Field label="Bio" value={P.bio} onChangeText={(v) => patchPrefs({ bio: v })} multiline placeholder="Quelques mots sur toi" maxLength={140} />
        <Switch label="Profil public" on={P.pub} onChange={(v) => patchPrefs({ pub: v })} />
        <Mu size={12}>{P.pub ? 'Tout le monde pourra voir ton pseudo, tes favoris et tes derniers titres vus.' : 'Seuls tes amis verront ton profil.'}</Mu>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: C.sf, borderRadius: 16, padding: 14, gap: 6 }}><Mu size={12}>Temps regardé</Mu><Text style={{ color: C.tx, fontSize: 20, fontWeight: '700' }}>{fmtLong(seen)}</Text></View>
        <View style={{ flex: 1, backgroundColor: C.sf, borderRadius: 16, padding: 14, gap: 6 }}><Mu size={12}>Titres dans ma liste</Mu><Text style={{ color: C.tx, fontSize: 28, fontWeight: '700' }}>{ids.length}</Text></View>
      </View>

      <Card>
        <H2>Mes genres préférés</H2>
        <Mu>Ils serviront à choisir les sorties et les idées qu'on te montre.</Mu>
        <Chips>{FAV_GENRES.map((g) => <Chip key={g} label={g} on={P.genres.includes(g)} onPress={() => patchPrefs({ genres: toggle(P.genres, g) })} />)}</Chips>
      </Card>

      <Card>
        <H2>Mes plateformes</H2>
        <Chips>
          {[...PLATFORMS, ...P.customPlats].map((g) => <Chip key={g} label={g} on={P.plats.includes(g)} onPress={() => patchPrefs({ plats: toggle(P.plats, g) })} />)}
        </Chips>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}><Field label="Autre plateforme" value={np} onChangeText={setNp} maxLength={24} placeholder="Ex : Crunchyroll" /></View>
          <View style={{ width: 110 }}><Btn label="Ajouter" kind="alt" onPress={() => {
            const n = np.trim(); if (!n || PLATFORMS.includes(n) || P.customPlats.includes(n)) { setNp(''); return; }
            patchPrefs({ customPlats: [...P.customPlats, n], plats: [...P.plats, n] }); setNp('');
          }} /></View>
        </View>
      </Card>

      <Card>
        <H2>Compte</H2>
        <Btn label="Remettre les données de départ" kind="alt" onPress={reset} />
        {del ? (
          <>
            <Text style={{ color: C.tx, lineHeight: 20 }}>Supprimer ton compte efface ta liste, tes notes et tes avis. Cette action est définitive.</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Btn label="Annuler" kind="alt" onPress={() => setDel(false)} /></View>
              <View style={{ flex: 1 }}><Btn label="Supprimer" kind="danger" onPress={() => { reset(); setDel(false); }} /></View>
            </View>
          </>
        ) : <Btn label="Supprimer mon compte" kind="danger" onPress={() => setDel(true)} />}
        <Mu size={12}>La connexion (Apple, Google, e-mail) sera ajoutée avec la base de données.</Mu>
      </Card>
    </Screen>
  );
}

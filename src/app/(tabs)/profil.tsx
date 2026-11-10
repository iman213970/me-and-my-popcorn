import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AvatarMaker } from '../../components/AvatarMaker';
import { Avatar, Btn, Card, Chip, Chips, Field, H1, H2, Mu, Screen, Switch } from '../../components/ui';
import { fmtLong, total } from '../../lib/calc';
import { FAV_GENRES, PLATFORMS } from '../../lib/options';
import { BY, useStore } from '../../lib/store';
import { C } from '../../lib/theme';

const toggle = (a: string[], v: string) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);

export default function Profil() {
  const { state, session, syncError, patchPrefs, clearList, signOut, deleteAccount } = useStore();
  const [delErr, setDelErr] = useState('');
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
            <AvatarMaker value={P.avatar} onChange={(n) => patchPrefs({ avatar: n })} />
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
        <H2>À propos</H2>
        <Mu>This product uses the TMDB API but is not endorsed or certified by TMDB.</Mu>
        <Mu size={12}>Les fiches des films et séries ajoutées depuis la recherche viennent de TMDB.</Mu>
      </Card>

      <Card>
        <H2>Compte</H2>
        {session ? <Mu>Connectée avec {session.user.email}</Mu> : null}
        {syncError ? <Text style={{ color: C.rose, fontSize: 13 }}>Synchronisation : {syncError}</Text> : null}
        <Btn label="Vider ma liste" kind="alt" onPress={clearList} />
        <Btn label="Me déconnecter" kind="alt" onPress={signOut} />
        {del ? (
          <>
            <Text style={{ color: C.tx, lineHeight: 20 }}>Supprimer ton compte efface ta liste, tes notes et tes avis. Cette action est définitive.</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Btn label="Annuler" kind="alt" onPress={() => setDel(false)} /></View>
              <View style={{ flex: 1 }}><Btn label="Supprimer" kind="danger" onPress={async () => { const e = await deleteAccount(); if (e) setDelErr(e); setDel(false); }} /></View>
            </View>
          </>
        ) : <Btn label="Supprimer mon compte" kind="danger" onPress={() => setDel(true)} />}
        {delErr ? <Text style={{ color: C.rose, fontSize: 13 }}>{delErr}</Text> : null}
      </Card>
    </Screen>
  );
}

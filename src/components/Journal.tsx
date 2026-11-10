import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Title } from '../lib/catalog';
import { pos } from '../lib/calc';
import { FEELINGS } from '../lib/options';
import { useStore } from '../lib/store';
import { C } from '../lib/theme';
import { Btn, Field, Mu, Stepper } from './ui';

/** Choix d'emoji de ressenti : on touche pour activer ou désactiver, sans limite. */
export function FeelPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (e: string) => onChange(value.includes(e) ? value.filter((x) => x !== e) : [...value, e]);
  const names = FEELINGS.filter((f) => value.includes(f.e)).map((f) => f.label).join(', ');
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FEELINGS.map((f) => {
          const on = value.includes(f.e);
          return (
            <Pressable key={f.e} onPress={() => toggle(f.e)} accessibilityRole="button" accessibilityLabel={f.label} accessibilityState={{ selected: on }}
              style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? '#2A2650' : C.sf2, borderWidth: 2, borderColor: on ? C.ac : 'transparent' }}>
              <Text style={{ fontSize: 24 }}>{f.e}</Text>
            </Pressable>
          );
        })}
      </View>
      <Mu size={12}>{names || 'Touche un emoji pour dire ce que tu as ressenti.'}</Mu>
    </View>
  );
}

/** Journal de commentaires : un par épisode (séries) ou global (films), autant qu'on veut. */
export function Journal({ t, watched }: { t: Title; watched: number }) {
  const { notes, addNote, updateNote, removeNote } = useStore();
  const film = t.type === 'Film';
  const p = pos(t, watched);
  const [season, setSeason] = useState(Math.max(1, p.s));
  const [episode, setEpisode] = useState(Math.max(1, p.e));
  const [body, setBody] = useState('');
  const [feel, setFeel] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [askDelete, setAskDelete] = useState<string | null>(null);

  useEffect(() => { setSeason(Math.max(1, p.s)); setEpisode(Math.max(1, p.e)); }, [t.id]);

  const mine = useMemo(() => notes.filter((n) => n.title_id === t.id)
    .sort((a, b) => a.season - b.season || a.episode - b.episode || a.created_at.localeCompare(b.created_at)), [notes, t.id]);

  const maxEp = (s: number) => t.eps[s - 1] ?? 1;
  const reset = () => { setBody(''); setFeel([]); setEditId(null); };
  const save = async () => {
    if (!body.trim() && !feel.length) return;
    setBusy(true);
    if (editId) await updateNote(editId, body.trim(), feel);
    else await addNote(t.id, film ? 0 : season, film ? 0 : episode, body.trim(), feel);
    setBusy(false); reset();
  };
  const edit = (id: string) => {
    const n = notes.find((x) => x.id === id); if (!n) return;
    setEditId(id); setBody(n.body); setFeel(n.feel);
    if (!film) { setSeason(n.season); setEpisode(n.episode); }
  };

  return (
    <View style={{ gap: 12 }}>
      {!film ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stepper label="Saison" value={season}
            onMinus={() => { const s = Math.max(1, season - 1); setSeason(s); setEpisode(Math.min(episode, maxEp(s))); }}
            onPlus={() => { const s = Math.min(t.eps.length, season + 1); setSeason(s); setEpisode(Math.min(episode, maxEp(s))); }} />
          <Stepper label="Épisode" value={episode}
            onMinus={() => setEpisode(Math.max(1, episode - 1))}
            onPlus={() => setEpisode(Math.min(maxEp(season), episode + 1))} />
        </View>
      ) : null}
      <Field label={editId ? 'Modifier le commentaire' : film ? 'Nouveau commentaire' : `Commentaire pour la saison ${season}, épisode ${episode}`}
        value={body} onChangeText={setBody} multiline placeholder={film ? 'Ce que tu as pensé du film' : 'Ce que tu as pensé de cet épisode'} />
      <FeelPicker value={feel} onChange={setFeel} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {editId ? <View style={{ flex: 1 }}><Btn label="Annuler" kind="alt" onPress={reset} /></View> : null}
        <View style={{ flex: 1 }}><Btn label={editId ? 'Enregistrer' : 'Ajouter le commentaire'} onPress={save} disabled={busy} /></View>
      </View>

      {mine.length ? (
        <View style={{ gap: 10, marginTop: 4 }}>
          {mine.map((n) => (
            <View key={n.id} style={{ backgroundColor: C.sf2, borderRadius: 14, padding: 12, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: C.ac, fontWeight: '700', fontSize: 13 }}>{film ? 'Film' : `S${n.season} · E${n.episode}`}</Text>
                <Mu size={12}>{new Date(n.created_at).toLocaleDateString('fr-FR')}</Mu>
              </View>
              {n.feel.length ? <Text style={{ fontSize: 20 }}>{n.feel.join(' ')}</Text> : null}
              {n.body ? <Text style={{ color: C.tx, fontSize: 15, lineHeight: 21 }}>{n.body}</Text> : null}
              {askDelete === n.id ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}><Btn label="Garder" kind="alt" onPress={() => setAskDelete(null)} /></View>
                  <View style={{ flex: 1 }}><Btn label="Supprimer" kind="danger" onPress={() => { void removeNote(n.id); setAskDelete(null); }} /></View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 18 }}>
                  <Pressable onPress={() => edit(n.id)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: C.mu, fontSize: 13 }}>Modifier</Text></Pressable>
                  <Pressable onPress={() => setAskDelete(n.id)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: C.mu, fontSize: 13 }}>Supprimer</Text></Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : <Mu size={12}>Aucun commentaire pour l'instant.</Mu>}
    </View>
  );
}

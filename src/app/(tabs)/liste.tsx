import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { TitleGrid } from '../../components/TitleGrid';
import { Btn, Chip, Empty, H1, Pill, Screen, Stars } from '../../components/ui';
import { BY, STATUSES, useStore } from '../../lib/store';
import { C, FONT_DISPLAY, SHADOW_SOFT, statusLabel } from '../../lib/theme';

export default function MaListe() {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('Tous');
  const [sort, setSort] = useState('Ajout');
  const [kind, setKind] = useState('Tous');
  const [st, setSt] = useState('Tous');
  const [more, setMore] = useState(false);
  const all = Object.keys(state.list);
  const nActive = (st !== 'Tous' ? 1 : 0) + (genre !== 'Tous' ? 1 : 0) + (sort !== 'Ajout' ? 1 : 0);
  const used = Array.from(new Set(all.map((id) => BY[id].genre))).sort();
  const ids = useMemo(() => {
    const k = q.trim().toLowerCase();
    const a = all.filter((id) => (genre === 'Tous' || BY[id].genre === genre) && (kind === 'Tous' || (kind === 'Films') === (BY[id].type === 'Film')) && (st === 'Tous' || state.list[id].status === st) && (!k || BY[id].title.toLowerCase().includes(k)));
    if (sort === 'Note') a.sort((x, y) => state.list[y].note - state.list[x].note);
    if (sort === 'Titre') a.sort((x, y) => BY[x].title.localeCompare(BY[y].title, 'fr'));
    return a;
  }, [all.join(','), q, genre, kind, st, sort, state.list]);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <H1>Ma bibliothèque</H1>
        <View style={{ borderWidth: 1, borderColor: C.line, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7 }}>
          <Text style={{ color: C.tx, fontSize: 13 }}>{all.length} titre{all.length > 1 ? 's' : ''}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.sf, borderRadius: 99, paddingHorizontal: 18, gap: 10, boxShadow: SHADOW_SOFT }}>
        <Ionicons name="search" size={20} color={C.mu} />
        <TextInput value={q} onChangeText={setQ} placeholder="Chercher dans ma liste" placeholderTextColor="#6B6A85"
          accessibilityLabel="Chercher dans ma liste" style={{ flex: 1, minHeight: 48, color: C.tx, fontSize: 16 }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
          {['Tous', 'Séries', 'Films'].map((x) => <Chip key={x} label={x} small on={kind === x} onPress={() => setKind(x)} />)}
        </View>
        <Pressable onPress={() => setMore(true)} accessibilityRole="button" accessibilityLabel={`Filtres${nActive ? `, ${nActive} actif${nActive > 1 ? 's' : ''}` : ''}`}
          style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderRadius: 99, backgroundColor: nActive ? C.ac : C.sf2 }}>
          <Ionicons name="options-outline" size={20} color={nActive ? C.acfg : C.tx} />
          <Text style={{ color: nActive ? C.acfg : C.tx, fontWeight: '600', fontSize: 14 }}>Filtres{nActive ? ` · ${nActive}` : ''}</Text>
        </Pressable>
      </View>
      <FilterSheet open={more} onClose={() => setMore(false)} genres={['Tous', ...used]}
        value={{ st, genre, sort }} onApply={(v) => { setSt(v.st); setGenre(v.genre); setSort(v.sort); setMore(false); }} />
      {ids.length ? (
        <TitleGrid ids={ids}
          above={(id) => {
            const e = state.list[id];
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 18 }}>
                {e.note ? <><Stars note={e.note} size={11} /></> : <Text style={{ color: C.mu, fontSize: 12 }}>pas encore noté</Text>}
              </View>
            );
          }}
          badge={(id) => (
            <>
              {state.list[id].fav ? (
                <View accessibilityLabel="Favori" style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="star" size={14} color={C.acfg} />
                </View>) : null}
              {state.list[id].feel.length ? (
                <View accessibilityLabel="Mon ressenti" style={{ position: 'absolute', left: 6, bottom: 6, flexDirection: 'row', backgroundColor: 'rgba(18,18,28,0.78)', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 13 }}>{state.list[id].feel.slice(0, 3).join('')}</Text>
                </View>) : null}
            </>)}
          extra={(id) => <><Text numberOfLines={1} style={{ color: C.mu, fontSize: 12 }}>{BY[id].genre}</Text><Pill status={state.list[id].status} /></>} />
      ) : all.length ? <Empty art="reel" title="Rien ne correspond">Essaie d'enlever un filtre ou de changer ta recherche.</Empty>
        : <Empty art="ticket" title="Ta bibliothèque est vide">Va dans le catalogue, cherche un film ou une série et ajoute-le. Le pop-corn t'attend 🍿</Empty>}
    </Screen>
  );
}

const SORTS: [string, string][] = [['Ajout', "Date d'ajout"], ['Note', 'Note'], ['Titre', 'Titre (A à Z)']];

/** Liste déroulante : on touche, les choix apparaissent dessous. */
function Dropdown({ label, value, options, onPick }: { label: string; value: string; options: [string, string][]; onPick: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const shown = options.find(([k]) => k === value)?.[1] ?? value;
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: C.mu, fontSize: 13 }}>{label}</Text>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityLabel={`${label} : ${shown}`} accessibilityState={{ expanded: open }}
        style={{ minHeight: 54, borderRadius: 99, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: C.tx, fontSize: 17, fontWeight: '600' }}>{shown}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={C.mu} />
      </Pressable>
      {open ? (
        <View style={{ borderRadius: 22, backgroundColor: C.sf2, overflow: 'hidden' }}>
          {options.map(([k, l]) => (
            <Pressable key={k} onPress={() => { onPick(k); setOpen(false); }} accessibilityRole="button" accessibilityState={{ selected: k === value }}
              style={{ minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: k === value ? C.ac : C.tx, fontSize: 16, fontWeight: k === value ? '700' : '400' }}>{l}</Text>
              {k === value ? <Ionicons name="checkmark" size={18} color={C.ac} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

type FV = { st: string; genre: string; sort: string };
function FilterSheet({ open, onClose, value, genres, onApply }: { open: boolean; onClose: () => void; value: FV; genres: string[]; onApply: (v: FV) => void }) {
  const [d, setD] = useState<FV>(value);
  React.useEffect(() => { if (open) setD(value); }, [open]);
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} accessibilityLabel="Fermer" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
      <View style={{ backgroundColor: C.sf, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingBottom: 28, gap: 18, maxHeight: '88%', width: '100%', maxWidth: 520, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: C.tx, fontSize: 26, fontFamily: FONT_DISPLAY }}>Filtres</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer les filtres"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.sf2, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={22} color={C.tx} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ gap: 18 }} keyboardShouldPersistTaps="handled">
          <Dropdown label="Statut" value={d.st} options={['Tous', ...STATUSES].map((x) => [x, statusLabel(x)] as [string, string])} onPick={(v) => setD({ ...d, st: v })} />
          <Dropdown label="Genre" value={d.genre} options={genres.map((x) => [x, x] as [string, string])} onPick={(v) => setD({ ...d, genre: v })} />
          <Dropdown label="Tri" value={d.sort} options={SORTS} onPick={(v) => setD({ ...d, sort: v })} />
        </ScrollView>
        <View style={{ gap: 10 }}>
          <Btn label="Appliquer" onPress={() => onApply(d)} />
          <Pressable onPress={() => onApply({ st: 'Tous', genre: 'Tous', sort: 'Ajout' })} accessibilityRole="button"
            style={{ minHeight: 48, borderRadius: 99, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.tx, fontWeight: '600', fontSize: 15 }}>Réinitialiser</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

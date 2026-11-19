import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Press } from '../../components/fx';
import { Toggles } from '../../components/PlaylistsView';
import { Sheet } from '../../components/Sheet';
import { Avatar, Bar, Btn, Empty, Field, Mu, Poster } from '../../components/ui';
import { fmtLong, pos, total } from '../../lib/calc';
import { loadLinks, type Link } from '../../lib/friends';
import { remainingMin, usePlaylists, usePlComments, useShared } from '../../lib/playlists';
import { BY, useStore } from '../../lib/store';
import { C, FONT_DISPLAY, FONT_DISPLAY_SEMI, SHADOW_SOFT, SIG } from '../../lib/theme';

export default function PlaylistPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pid = String(id);
  const { state, session } = useStore();
  const { playlists, reload, rename, destroy, leave, addItem, removeItem, move, setToggle, invite, removeMember, setCanEdit } = usePlaylists();
  const pl = playlists.find((p) => p.id === pid);
  const me = session?.user.id ?? '';
  const [tick, setTick] = useState(0);
  const [sheet, setSheet] = useState<'' | 'add' | 'invite' | 'rename' | 'delete' | 'leave'>('');
  const [q, setQ] = useState('');
  const [name, setName] = useState('');
  const [friends, setFriends] = useState<Link[]>([]);
  const [msg, setMsg] = useState('');
  const back = () => (router.canGoBack() ? router.back() : router.replace('/liste'));

  useFocusEffect(useCallback(() => { void reload().then(() => setTick((t) => t + 1)); }, [reload]));

  const items = useMemo(() => (pl ? pl.items.filter((x) => BY[x]) : []), [pl]);
  const { progress } = useShared(pid, !!pl?.shared, `${tick}:${items.join(',')}:${items.map((x) => state.list[x]?.watched ?? 0).join(',')}`);

  const { comments } = usePlComments(pid, `${tick}:${items.join(',')}`);

  if (!pl) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <SafeAreaView edges={['top']}>
          <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Retour" style={{ margin: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: C.sf, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={22} color={C.tx} />
          </Pressable>
        </SafeAreaView>
        <View style={{ padding: 20 }}><Empty art="reel" title="Playlist introuvable">Elle a peut-être été supprimée, ou tu n'y as plus accès.</Empty></View>
      </View>
    );
  }

  const rest = remainingMin(items, state.list);
  const others = pl.members.filter((m) => m.id !== me);
  const watchedOf = (userId: string, t: string) => (userId === me ? state.list[t]?.watched ?? 0 : progress.find((p) => p.user_id === userId && p.title_id === t)?.watched ?? 0);

  const choices = Object.keys(state.list).filter((x) => BY[x] && !pl.items.includes(x) && (!q.trim() || BY[x].title.toLowerCase().includes(q.trim().toLowerCase())));
  const openInvite = async () => {
    setSheet('invite'); setMsg('');
    try { setFriends((await loadLinks(me)).filter((l) => l.status === 'accepted')); } catch (e) { setMsg(e instanceof Error ? e.message : 'Erreur'); }
  };
  const canInvite = friends.filter((f) => !pl.members.some((m) => m.id === f.other.id));

  const lane = (label: string, w: number, tt: number, colors: [string, string], key: string) => (
    <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <Text numberOfLines={1} style={{ width: 52, color: C.tx, fontSize: 11, fontWeight: '700' }}>{label}</Text>
      <View style={{ flex: 1, height: 8, borderRadius: 5, backgroundColor: C.sf2, overflow: 'hidden' }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${Math.min(100, tt ? (w / tt) * 100 : 0)}%`, height: '100%', borderRadius: 5 }} />
      </View>
      <Text style={{ color: C.mu, fontSize: 11, width: 34, textAlign: 'right' }}>{w}/{tt}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <SafeAreaView edges={['top']}>
          <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Retour" style={{ margin: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: C.sf, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={22} color={C.tx} />
          </Pressable>
        </SafeAreaView>
        <View style={{ padding: 20, paddingTop: 4, gap: 16, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
          {/* En-tête */}
          <LinearGradient colors={pl.shared ? ['rgba(79,224,240,0.16)', 'rgba(155,123,255,0.24)'] : ['rgba(139,107,255,0.26)', 'rgba(255,111,181,0.16)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 30, padding: 18, gap: 10, borderWidth: 1, borderColor: pl.shared ? 'rgba(79,224,240,0.35)' : 'rgba(194,107,255,0.35)' }}>
            <Text style={{ color: pl.shared ? C.cyan : C.mu, fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>{pl.shared ? 'PLAYLIST PARTAGÉE' : 'PLAYLIST PRIVÉE'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ flex: 1, color: C.tx, fontFamily: FONT_DISPLAY, fontSize: 28, lineHeight: 32 }}>{pl.name}</Text>
              {pl.canEdit ? <Press onPress={() => { setName(pl.name); setSheet('rename'); }} accessibilityRole="button" accessibilityLabel="Renommer"
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="pencil" size={18} color={C.tx} /></Press> : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row' }}>
                {pl.members.map((m, i) => <View key={m.id} style={{ marginLeft: i ? -10 : 0 }}><Avatar i={m.avatar} size={34} /></View>)}
              </View>
              <Text style={{ color: C.mu, fontSize: 12 }}>{items.length} titre{items.length > 1 ? 's' : ''} · {fmtLong(rest)} restantes</Text>
            </View>
          </LinearGradient>

          {/* Réglages accueil */}
          <View style={{ backgroundColor: C.sf, borderRadius: 26, padding: 14, gap: 2 }}>
            <Text style={{ color: C.mu, fontSize: 12, marginBottom: 2 }}>Sur ton accueil (réglage à toi seul)</Text>
            <Toggles pl={pl} onChange={(k, v) => setToggle(pl.id, k, v)} />
          </View>

          {/* Titres */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: C.tx, fontFamily: FONT_DISPLAY_SEMI, fontSize: 20 }}>Dans la playlist</Text>
            {pl.canEdit ? <Press onPress={() => { setQ(''); setSheet('add'); }} accessibilityRole="button" accessibilityLabel="Ajouter un titre"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 40, borderRadius: 99, backgroundColor: C.sf2 }}>
              <Ionicons name="add" size={18} color={C.tx} /><Text style={{ color: C.tx, fontWeight: '700', fontSize: 13 }}>Ajouter</Text></Press> : null}
          </View>
          {!pl.canEdit ? <Mu size={12}>Le créateur ne t'a pas donné le droit de modifier cette playlist.</Mu> : null}

          {items.length ? items.map((t, k) => {
            const title = BY[t], tt = total(title), mine = watchedOf(me, t), film = title.type === 'Film';
            const lows = pl.shared ? pl.members.map((m) => watchedOf(m.id, t)) : [mine];
            const both = pl.shared ? Math.min(...lows) : 0;
            const allDone = pl.shared && lows.every((w) => w >= tt);
            const tn = comments.filter((n) => n.title_id === t);
            const open = tn.filter((n) => n.visible).length, locked = tn.length - open;
            return (
              <View key={t} style={{ backgroundColor: C.sf, borderRadius: 26, padding: 12, gap: 10, borderWidth: 1, borderColor: C.line, boxShadow: SHADOW_SOFT }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Press onPress={() => router.push({ pathname: '/ptitre', params: { pid: pl.id, t } })} accessibilityRole="button" accessibilityLabel={`Ouvrir ${title.title} dans la playlist`} style={{ width: 64 }}><Poster t={title} w={64} rounded={14} /></Press>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={2} style={{ color: C.tx, fontWeight: '700', fontSize: 15 }}>{title.title}</Text>
                    <Mu size={12}>{film ? `Film · ${title.dur} min` : `S${pos(title, mine).s} · ép. ${pos(title, mine).e} sur ${tt}`}</Mu>
                    {pl.shared ? (
                      <View style={{ marginTop: 2 }}>
                        {lane('Toi', mine, tt, ['#8B6BFF', '#FF6FB5'], 'me')}
                        {others.map((m) => lane(m.pseudo, watchedOf(m.id, t), tt, ['#2AA7C0', '#4FE0F0'], m.id))}
                      </View>
                    ) : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}><Bar pct={tt ? (mine / tt) * 100 : 0} /><Mu size={11}>{mine}/{tt}</Mu></View>}
                  </View>
                  {pl.canEdit ? (
                    <View style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Pressable disabled={k === 0} onPress={() => move(pl.id, t, -1)} accessibilityRole="button" accessibilityLabel="Monter" style={{ width: 40, height: 36, alignItems: 'center', justifyContent: 'center', opacity: k === 0 ? 0.25 : 1 }}><Ionicons name="chevron-up" size={20} color={C.tx} /></Pressable>
                      <Pressable onPress={() => removeItem(pl.id, t)} accessibilityRole="button" accessibilityLabel={`Retirer ${title.title} de la playlist`} style={{ width: 40, height: 36, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close-circle-outline" size={20} color={C.rose} /></Pressable>
                      <Pressable disabled={k === items.length - 1} onPress={() => move(pl.id, t, 1)} accessibilityRole="button" accessibilityLabel="Descendre" style={{ width: 40, height: 36, alignItems: 'center', justifyContent: 'center', opacity: k === items.length - 1 ? 0.25 : 1 }}><Ionicons name="chevron-down" size={20} color={C.tx} /></Pressable>
                    </View>
                  ) : null}
                </View>
                {pl.shared && both > 0 ? (
                  <View style={{ alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(240,184,79,0.12)', borderWidth: 1, borderColor: 'rgba(240,184,79,0.45)' }}>
                    <Text style={{ color: C.gold, fontSize: 11, fontWeight: '700' }}>{allDone ? '★ Terminé ensemble' : film ? '★ Vu par vous tous' : `★ ${both} épisode${both > 1 ? 's' : ''} vus par vous tous`}</Text>
                  </View>
                ) : null}
                <Press onPress={() => router.push({ pathname: '/ptitre', params: { pid: pl.id, t } })} accessibilityRole="button" accessibilityLabel={`Commentaires sur ${title.title}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, padding: 10, backgroundColor: 'rgba(155,123,255,0.12)', borderWidth: 1, borderColor: 'rgba(155,123,255,0.3)' }}>
                  <Text style={{ flex: 1, color: '#E8E1FF', fontSize: 13 }}>💬 {open} commentaire{open > 1 ? 's' : ''}{locked > 0 ? `  ·  🔒 ${locked} à débloquer` : ''}</Text>
                  <Ionicons name="chevron-forward" size={18} color={C.mu} />
                </Press>
              </View>
            );
          }) : <Empty art="ticket" title="Playlist vide">Ajoute des séries et des films de ta liste.</Empty>}

          {/* Membres */}
          {(pl.shared || pl.isOwner) ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: C.tx, fontFamily: FONT_DISPLAY_SEMI, fontSize: 20, marginTop: 6 }}>Membres</Text>
              {pl.members.map((m) => (
                <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.sf, borderRadius: 22, padding: 10 }}>
                  <Avatar i={m.avatar} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.tx, fontWeight: '700' }}>{m.pseudo}{m.id === me ? ' (toi)' : ''}</Text>
                    <Mu size={11}>{m.id === pl.owner ? 'Créateur' : m.canEdit ? 'Peut modifier la playlist' : 'Lecture seule'}</Mu>
                  </View>
                  {pl.isOwner && m.id !== me ? (
                    <>
                      <Press onPress={() => setCanEdit(pl.id, m.id, !m.canEdit)} accessibilityRole="button" accessibilityLabel={m.canEdit ? 'Passer en lecture seule' : 'Autoriser à modifier'}
                        style={{ height: 38, paddingHorizontal: 12, borderRadius: 99, backgroundColor: C.sf2, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: C.tx, fontSize: 12, fontWeight: '600' }}>{m.canEdit ? 'Droits : modifier' : 'Droits : lire'}</Text>
                      </Press>
                      <Press onPress={() => removeMember(pl.id, m.id)} accessibilityRole="button" accessibilityLabel={`Retirer ${m.pseudo}`} style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="person-remove-outline" size={20} color={C.rose} /></Press>
                    </>
                  ) : null}
                </View>
              ))}
              {pl.isOwner ? <Btn label="Inviter un proche" kind="alt" icon="person-add-outline" onPress={openInvite} /> : null}
            </View>
          ) : null}

          {/* Actions */}
          <View style={{ gap: 10, marginTop: 8 }}>
            {pl.isOwner
              ? <Btn label="Supprimer la playlist" kind="danger" icon="trash-outline" onPress={() => setSheet('delete')} />
              : <Btn label="Quitter la playlist" kind="danger" icon="exit-outline" onPress={() => setSheet('leave')} />}
            {!pl.isOwner ? <Mu size={12} style={{ textAlign: 'center' }}>Seul le créateur peut la supprimer pour tout le monde.</Mu> : null}
          </View>
        </View>
      </ScrollView>

      <Sheet open={sheet === 'rename'} onClose={() => setSheet('')} title="Renommer">
        <Field label="Nom" value={name} onChangeText={setName} maxLength={40} />
        <Btn label="Enregistrer" onPress={() => { void rename(pl.id, name); setSheet(''); }} />
      </Sheet>

      <Sheet open={sheet === 'add'} onClose={() => setSheet('')} title="Ajouter à la playlist">
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.sf2, borderRadius: 99, paddingHorizontal: 16, gap: 8 }}>
          <Ionicons name="search" size={18} color={C.mu} />
          <TextInput value={q} onChangeText={setQ} placeholder="Chercher dans ma liste" placeholderTextColor="#6B6A85" accessibilityLabel="Chercher dans ma liste" style={{ flex: 1, minHeight: 46, color: C.tx, fontSize: 15 }} />
        </View>
        {choices.length ? choices.map((x) => (
          <Press key={x} onPress={() => { void addItem(pl.id, x); }} accessibilityRole="button" accessibilityLabel={`Ajouter ${BY[x].title}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.sf2, borderRadius: 20, padding: 8 }}>
            <Poster t={BY[x]} w={40} rounded={10} />
            <Text numberOfLines={2} style={{ flex: 1, color: C.tx, fontWeight: '600' }}>{BY[x].title}</Text>
            <Ionicons name="add-circle" size={26} color={C.ac} />
          </Press>
        )) : <Mu>Rien à ajouter. Ajoute d'abord des titres à ta liste depuis le catalogue.</Mu>}
      </Sheet>

      <Sheet open={sheet === 'invite'} onClose={() => setSheet('')} title="Inviter un proche">
        {msg ? <Text style={{ color: C.rose, fontSize: 13 }}>{msg}</Text> : null}
        {canInvite.length ? canInvite.map((f) => (
          <Press key={f.id} onPress={async () => { const e = await invite(pl.id, f.other.id); if (e) setMsg(e); else setSheet(''); }} accessibilityRole="button" accessibilityLabel={`Inviter ${f.other.pseudo}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.sf2, borderRadius: 20, padding: 10 }}>
            <Avatar i={f.other.avatar} size={40} /><Text style={{ flex: 1, color: C.tx, fontWeight: '700' }}>{f.other.pseudo}</Text>
            <Ionicons name="person-add" size={20} color={C.ac} />
          </Press>
        )) : <Mu>Aucun proche à inviter. Ajoute d'abord quelqu'un dans l'onglet Proches (la demande doit être acceptée).</Mu>}
      </Sheet>

      <Sheet open={sheet === 'delete'} onClose={() => setSheet('')} title={`Supprimer « ${pl.name} » ?`}>
        <Mu size={14}>Cette action est définitive. Tu es le créateur : la playlist sera supprimée pour tout le monde.</Mu>
        <View style={{ gap: 0 }}>
          {[['👥', pl.shared ? `${others.map((m) => m.pseudo).join(', ')} sera prévenu et n'aura plus accès à la playlist.` : 'Personne d\'autre n\'est dans cette playlist.'],
            ['✅', 'Tes séries et films restent dans Ma liste, avec ta progression.'],
            ['🔒', 'Les commentaires restent à leur auteur, mais ne sont plus partagés.']].map(([e, t]) => (
            <View key={t} style={{ flexDirection: 'row', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: C.line }}><Text>{e}</Text><Text style={{ flex: 1, color: C.tx, fontSize: 13, lineHeight: 18 }}>{t}</Text></View>
          ))}
        </View>
        {msg ? <Text style={{ color: C.rose, fontSize: 13 }}>{msg}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Btn label="Annuler" kind="alt" onPress={() => setSheet('')} /></View>
          <View style={{ flex: 1 }}><Btn label="Supprimer" kind="danger" onPress={async () => { const e = await destroy(pl.id); if (e) setMsg(e); else { setSheet(''); back(); } }} /></View>
        </View>
      </Sheet>

      <Sheet open={sheet === 'leave'} onClose={() => setSheet('')} title={`Quitter « ${pl.name} » ?`}>
        <Mu size={14}>Elle disparaît de ta liste de playlists, mais reste chez les autres membres. Tes séries et films restent dans Ma liste.</Mu>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Btn label="Annuler" kind="alt" onPress={() => setSheet('')} /></View>
          <View style={{ flex: 1 }}><Btn label="Quitter" kind="danger" onPress={async () => { await leave(pl.id); setSheet(''); back(); }} /></View>
        </View>
      </Sheet>
    </View>
  );
}

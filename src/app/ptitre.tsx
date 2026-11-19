import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeelPicker } from '../components/Journal';
import { Press } from '../components/fx';
import { MediaView } from '../components/MediaView';
import { MediaAttach } from '../components/Recorder';
import type { Media } from '../lib/media';
import { Avatar, Btn, Chip, Empty, Field, Mu, Poster, Stepper } from '../components/ui';
import { pos, total } from '../lib/calc';
import { useDraft } from '../lib/draft';
import { usePlaylists, usePlComments, useShared, type PlComment } from '../lib/playlists';
import { BY, useStore } from '../lib/store';
import { C, FONT_DISPLAY, FONT_DISPLAY_SEMI } from '../lib/theme';

/** Un titre dans une playlist : la course, et les commentaires partagés avec les membres de la playlist. */
export default function PlaylistTitle() {
  const { pid, t } = useLocalSearchParams<{ pid: string; t: string }>();
  const playlistId = String(pid), titleId = String(t);
  const { state, session } = useStore();
  const { playlists, reload } = usePlaylists();
  const pl = playlists.find((p) => p.id === playlistId);
  const title = BY[titleId];
  const me = session?.user.id ?? '';
  const [tick, setTick] = useState(0);
  useFocusEffect(useCallback(() => { void reload().then(() => setTick((x) => x + 1)); }, [reload]));
  const mineW = state.list[titleId]?.watched ?? 0;
  const { progress } = useShared(playlistId, !!pl?.shared, `${tick}:${mineW}`);
  const { comments, replies, error, add, remove, reply, removeReply } = usePlComments(playlistId, `${tick}:${mineW}`);
  const back = () => (router.canGoBack() ? router.back() : router.replace(`/playlist/${playlistId}`));

  const film = title?.type === 'Film';
  const p0 = title ? pos(title, mineW) : { s: 1, e: 1 };
  const [season, setSeason] = useState(Math.max(1, p0.s));
  const [episode, setEpisode] = useState(Math.max(1, p0.e));
  const [body, setBody, clearBody] = useDraft(`pc:${playlistId}:${titleId}`);
  const [feel, setFeel] = useState<string[]>([]);
  const [who, setWho] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [media, setMedia] = useState<Media | null>(null);
  const [replyMedia, setReplyMedia] = useState<Media | null>(null);

  if (!pl || !title) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 20, justifyContent: 'center' }}>
        <Empty art="reel" title="Introuvable">Cette playlist ou ce titre n'est plus disponible.</Empty>
        <Btn label="Retour" kind="alt" onPress={back} />
      </View>
    );
  }
  const others = pl.members.filter((m) => m.id !== me);
  const tt = total(title);
  const maxEp = (s: number) => title.eps[s - 1] ?? 1;
  const name = (u: string) => pl.members.find((m) => m.id === u)?.pseudo ?? 'Quelqu\'un';
  const av = (u: string) => pl.members.find((m) => m.id === u)?.avatar ?? 0;
  const watchedOf = (u: string) => (u === me ? mineW : progress.find((x) => x.user_id === u && x.title_id === titleId)?.watched ?? 0);
  const mine = comments.filter((c) => c.title_id === titleId);

  const send = async () => {
    if (!body.trim() && !feel.length && !media) return;
    setBusy(true);
    const ok = await add(titleId, film ? 0 : season, film ? 0 : episode, body.trim(), feel, who.length === others.length ? null : who, media);
    setBusy(false);
    if (ok) { clearBody(); setFeel([]); setMedia(null); }
  };
  const sendReply = async (c: PlComment) => {
    if (!replyText.trim() && !replyMedia) return;
    if (await reply(c.id, replyText.trim(), replyMedia)) { setReplyText(''); setReplyTo(null); setReplyMedia(null); }
  };
  const where = (c: PlComment) => (c.season ? `Saison ${c.season} · épisode ${c.episode}` : 'Film');
  const toWho = (c: PlComment) => (!c.visible_to || !c.visible_to.length ? 'Tous les membres' : c.visible_to.map(name).join(', '));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
        <SafeAreaView edges={['top']}>
          <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Retour" style={{ margin: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: C.sf, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={22} color={C.tx} />
          </Pressable>
        </SafeAreaView>
        <View style={{ padding: 20, paddingTop: 4, gap: 16, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
          <LinearGradient colors={['rgba(139,107,255,0.26)', 'rgba(255,111,181,0.16)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 30, padding: 16, flexDirection: 'row', gap: 14, borderWidth: 1, borderColor: 'rgba(194,107,255,0.35)' }}>
            <View style={{ width: 92 }}><Poster t={title} w={92} rounded={18} /></View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ color: C.mu, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>DANS « {pl.name.toUpperCase()} »</Text>
              <Text style={{ color: C.tx, fontFamily: FONT_DISPLAY, fontSize: 24, lineHeight: 27 }}>{title.title}</Text>
              {pl.members.map((m) => {
                const w = watchedOf(m.id);
                return (
                  <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text numberOfLines={1} style={{ width: 54, color: C.tx, fontSize: 11, fontWeight: '700' }}>{m.id === me ? 'Toi' : m.pseudo}</Text>
                    <View style={{ flex: 1, height: 8, borderRadius: 5, backgroundColor: C.sf2, overflow: 'hidden' }}>
                      <LinearGradient colors={m.id === me ? ['#8B6BFF', '#FF6FB5'] : ['#2AA7C0', '#4FE0F0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${Math.min(100, tt ? (w / tt) * 100 : 0)}%`, height: '100%', borderRadius: 5 }} />
                    </View>
                    <Text style={{ color: C.mu, fontSize: 11 }}>{film ? (w >= 1 ? 'Vu' : '-') : `${w}/${tt}`}</Text>
                  </View>
                );
              })}
              <Press onPress={() => router.push(`/titre/${titleId}`)} accessibilityRole="button" accessibilityLabel="Ouvrir la fiche du titre" style={{ marginTop: 4 }}>
                <Text style={{ color: C.ac, fontSize: 13, fontWeight: '700' }}>Ouvrir la fiche →</Text>
              </Press>
            </View>
          </LinearGradient>

          <Text style={{ color: C.tx, fontFamily: FONT_DISPLAY_SEMI, fontSize: 20 }}>Commentaires</Text>
          {error ? <Text style={{ color: C.rose, fontSize: 12 }}>Commentaires indisponibles : {error}</Text> : null}

          {mine.length ? mine.map((c) => {
            const mineC = c.user_id === me;
            const rs = replies.filter((r) => r.comment_id === c.id);
            return (
              <View key={c.id} style={{ backgroundColor: C.sf, borderRadius: 24, padding: 14, gap: 8, borderWidth: 1, borderColor: mineC ? 'rgba(155,123,255,0.4)' : C.line }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar i={av(c.user_id)} size={34} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.tx, fontWeight: '700' }}>{mineC ? 'Toi' : name(c.user_id)}</Text>
                    <Mu size={11}>{where(c)}{mineC ? ` · vu par : ${toWho(c)}` : ''}</Mu>
                  </View>
                  {mineC ? <Pressable onPress={() => remove(c.id)} accessibilityRole="button" accessibilityLabel="Supprimer mon commentaire" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="trash-outline" size={19} color={C.rose} /></Pressable> : null}
                </View>
                {c.visible ? (
                  <>
                    {c.feel?.length ? <Text style={{ fontSize: 20 }}>{c.feel.join(' ')}</Text> : null}
                    {c.body ? <Text style={{ color: C.tx, fontSize: 15, lineHeight: 21 }}>{c.body}</Text> : null}
                    {c.media_kind ? <MediaView path={c.media_path} kind={c.media_kind} secs={c.media_secs} expires={c.expires_at} /> : null}
                  </>
                ) : (
                  <View style={{ borderRadius: 16, padding: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#4A4A6A' }}>
                    <Text style={{ color: C.mu, fontSize: 13, lineHeight: 18 }}>🔒 Un commentaire t'attend {film ? 'quand tu auras vu le film.' : `à la saison ${c.season}, épisode ${c.episode}.`}</Text>
                  </View>
                )}
                {c.visible ? (
                  <View style={{ gap: 6 }}>
                    {rs.map((r) => (
                      <View key={r.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: C.sf2, borderRadius: 16, padding: 10 }}>
                        <Avatar i={av(r.user_id)} size={26} />
                        <View style={{ flex: 1, gap: 6 }}>
                          <Text style={{ color: C.tx, fontSize: 13, lineHeight: 18 }}><Text style={{ fontWeight: '700' }}>{r.user_id === me ? 'Toi' : name(r.user_id)}</Text>  {r.body}</Text>
                          {r.media_kind ? <MediaView path={r.media_path} kind={r.media_kind} secs={r.media_secs} expires={r.expires_at} /> : null}
                        </View>
                        {r.user_id === me ? <Pressable onPress={() => removeReply(r.id)} accessibilityRole="button" accessibilityLabel="Supprimer ma réponse"><Ionicons name="close" size={16} color={C.mu} /></Pressable> : null}
                      </View>
                    ))}
                    {replyTo === c.id ? (
                      <View style={{ gap: 8 }}>
                        <Field label="Ta réponse" value={replyText} onChangeText={setReplyText} multiline />
                        <MediaAttach value={replyMedia} onChange={setReplyMedia} />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <View style={{ flex: 1 }}><Btn label="Annuler" kind="alt" onPress={() => { setReplyTo(null); setReplyText(''); setReplyMedia(null); }} /></View>
                          <View style={{ flex: 1 }}><Btn label="Répondre" onPress={() => sendReply(c)} /></View>
                        </View>
                      </View>
                    ) : <Pressable onPress={() => { setReplyTo(c.id); setReplyText(''); }} accessibilityRole="button" style={{ minHeight: 40, justifyContent: 'center' }}><Text style={{ color: C.ac, fontSize: 13, fontWeight: '700' }}>↩ Répondre</Text></Pressable>}
                  </View>
                ) : null}
              </View>
            );
          }) : <Mu size={13}>Aucun commentaire pour l'instant. Écris le premier !</Mu>}

          <View style={{ backgroundColor: C.sf, borderRadius: 26, padding: 14, gap: 12, borderWidth: 1, borderColor: C.line }}>
            <Text style={{ color: C.tx, fontWeight: '700', fontSize: 16 }}>Nouveau commentaire</Text>
            {!film ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Stepper label="Saison" value={season}
                  onMinus={() => { const s = Math.max(1, season - 1); setSeason(s); setEpisode(Math.min(episode, maxEp(s))); }}
                  onPlus={() => { const s = Math.min(title.eps.length, season + 1); setSeason(s); setEpisode(Math.min(episode, maxEp(s))); }} />
                <Stepper label="Épisode" value={episode} onMinus={() => setEpisode(Math.max(1, episode - 1))} onPlus={() => setEpisode(Math.min(maxEp(season), episode + 1))} />
              </View>
            ) : null}
            <Field label={film ? 'Ton commentaire sur le film' : `Commentaire pour la saison ${season}, épisode ${episode}`} value={body} onChangeText={setBody} multiline placeholder="Ce que tu en as pensé" />
            <FeelPicker value={feel} onChange={setFeel} />
            <MediaAttach value={media} onChange={setMedia} />
            {others.length ? (
              <View style={{ gap: 6 }}>
                <Mu size={12}>Visible par</Mu>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Chip label="Tous" small on={who.length === 0 || who.length === others.length} onPress={() => setWho([])} />
                  {others.map((m) => <Chip key={m.id} label={m.pseudo} small on={who.includes(m.id) && who.length !== others.length} onPress={() => setWho(who.includes(m.id) ? who.filter((x) => x !== m.id) : [...who, m.id])} />)}
                </View>
                <Mu size={12}>Ils le voient quand ils ont {film ? 'vu le film' : 'atteint cet épisode'}. Ton texte non envoyé est gardé si tu fermes l'appli.</Mu>
              </View>
            ) : <Mu size={12}>Personne d'autre n'est dans cette playlist pour l'instant. Invite un proche depuis la playlist.</Mu>}
            <Btn label={busy ? 'Envoi…' : 'Envoyer'} icon="paper-plane-outline" disabled={busy} onPress={send} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

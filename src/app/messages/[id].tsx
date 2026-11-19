import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Press } from '../../components/fx';
import { MediaView } from '../../components/MediaView';
import { RecommendSheet } from '../../components/RecommendSheet';
import { MediaAttach } from '../../components/Recorder';
import { Avatar, Btn, Mu, Poster } from '../../components/ui';
import { useDraft } from '../../lib/draft';
import { loadPerson, type Person } from '../../lib/friends';
import type { Media } from '../../lib/media';
import { deleteMessage, loadThread, markRead, sendMessage, type Msg } from '../../lib/messages';
import { BY, useStore } from '../../lib/store';
import { C, FONT_DISPLAY_SEMI, SIG } from '../../lib/theme';

const hour = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const day = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/** Conversation privée avec un proche : texte, vocaux, vidéos, conseils de titres. */
export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const friend = String(id);
  const { session, state, add } = useStore();
  const me = session?.user.id ?? '';
  const [person, setPerson] = useState<Person | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText, clearText] = useDraft(`chat:${friend}`);
  const [media, setMedia] = useState<Media | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [reco, setReco] = useState(false);
  const [askDel, setAskDel] = useState<string | null>(null);
  const scroll = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const back = () => (router.canGoBack() ? router.back() : router.replace('/amis'));

  const refresh = useCallback(async () => {
    if (!me) return;
    try { setMsgs(await loadThread(me, friend)); setErr(''); void markRead(friend); } catch (e) { setErr(e instanceof Error ? e.message : 'Erreur'); }
  }, [me, friend]);
  useEffect(() => { loadPerson(friend).then(setPerson).catch(() => undefined); }, [friend]);
  useFocusEffect(useCallback(() => { void refresh(); const t = setInterval(refresh, 7000); return () => clearInterval(t); }, [refresh]));
  useEffect(() => { setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80); }, [msgs.length]);

  const send = async () => {
    if (!text.trim() && !media) return;
    setBusy(true); setErr('');
    try { await sendMessage(friend, text.trim(), { media }); clearText(); setMedia(null); await refresh(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Erreur'); }
    setBusy(false);
  };

  let lastDay = '';
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: C.sf, borderBottomWidth: 1, borderBottomColor: C.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 }}>
          <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Retour" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-back" size={24} color={C.tx} /></Pressable>
          <Pressable onPress={() => router.push(`/ami/${friend}`)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Avatar i={person?.avatar ?? 0} size={38} />
            <Text numberOfLines={1} style={{ color: C.tx, fontFamily: FONT_DISPLAY_SEMI, fontSize: 19, flex: 1 }}>{person?.pseudo || 'Conversation'}</Text>
          </Pressable>
          <Press onPress={() => setReco(true)} accessibilityRole="button" accessibilityLabel="Conseiller un titre" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 40, borderRadius: 99, backgroundColor: C.sf2 }}>
            <Ionicons name="film-outline" size={17} color={C.tx} /><Text style={{ color: C.tx, fontWeight: '700', fontSize: 12 }}>Conseiller</Text>
          </Press>
        </View>
      </SafeAreaView>

      <ScrollView ref={scroll} contentContainerStyle={{ padding: 14, gap: 8, width: '100%', maxWidth: 560, alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        {err ? <Text style={{ color: C.rose, fontSize: 12 }}>{err}</Text> : null}
        {!msgs.length && !err ? <Mu size={13}>Aucun message pour l'instant. Dis bonjour, envoie un vocal ou conseille-lui un titre.</Mu> : null}
        {msgs.map((m) => {
          const mineM = m.from_user === me;
          const d = day(m.created_at), showDay = d !== lastDay; lastDay = d;
          const t = m.title_id ? BY[m.title_id] : null;
          const inList = !!(m.title_id && state.list[m.title_id]);
          return (
            <View key={m.id} style={{ gap: 6 }}>
              {showDay ? <Text style={{ alignSelf: 'center', color: C.mu, fontSize: 11, marginVertical: 6 }}>{d}</Text> : null}
              <Pressable onLongPress={() => mineM && setAskDel(m.id)} style={{ alignSelf: mineM ? 'flex-end' : 'flex-start', maxWidth: '86%' }}>
                {mineM ? (
                  <LinearGradient colors={SIG} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, borderBottomRightRadius: 6, padding: 10, gap: 8 }}>
                    <Body m={m} t={t} mineM inList={inList} onAdd={() => undefined} />
                  </LinearGradient>
                ) : (
                  <View style={{ borderRadius: 22, borderBottomLeftRadius: 6, padding: 10, gap: 8, backgroundColor: C.sf2 }}>
                    <Body m={m} t={t} mineM={false} inList={inList} onAdd={() => m.title_id && add(m.title_id)} />
                  </View>
                )}
                <Text style={{ alignSelf: mineM ? 'flex-end' : 'flex-start', color: C.mu, fontSize: 10, marginTop: 3, marginHorizontal: 6 }}>{hour(m.created_at)}{mineM && m.read_at ? ' · vu' : ''}</Text>
              </Pressable>
              {askDel === m.id ? (
                <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'flex-end' }}>
                  <View style={{ width: 110 }}><Btn label="Garder" kind="alt" onPress={() => setAskDel(null)} /></View>
                  <View style={{ width: 130 }}><Btn label="Supprimer" kind="danger" onPress={async () => { await deleteMessage(m).catch(() => undefined); setAskDel(null); await refresh(); }} /></View>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={{ backgroundColor: C.sf, borderTopWidth: 1, borderTopColor: C.line }}>
        <View style={{ padding: 10, gap: 8, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          <MediaAttach value={media} onChange={setMedia} />
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <View style={{ flex: 1, backgroundColor: C.sf2, borderRadius: 24, paddingHorizontal: 14 }}>
              <InputBox value={text} onChange={setText} onSubmit={send} />
            </View>
            <Press onPress={send} disabled={busy || (!text.trim() && !media)} accessibilityRole="button" accessibilityLabel="Envoyer"
              style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden', opacity: busy || (!text.trim() && !media) ? 0.4 : 1 }}>
              <LinearGradient colors={SIG} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="send" size={20} color="#fff" /></LinearGradient>
            </Press>
          </View>
        </View>
      </SafeAreaView>
      <RecommendSheet open={reco} onClose={() => setReco(false)} friendId={friend} onSent={() => void refresh()} />
    </KeyboardAvoidingView>
  );
}

import { TextInput } from 'react-native';
function InputBox({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  return <TextInput value={value} onChangeText={onChange} onSubmitEditing={onSubmit} placeholder="Écris un message" placeholderTextColor="#6B6A85" multiline accessibilityLabel="Écrire un message" style={{ minHeight: 46, maxHeight: 120, color: C.tx, fontSize: 16, paddingVertical: 10 }} />;
}

function Body({ m, t, mineM, inList, onAdd }: { m: Msg; t: (typeof BY)[string] | null; mineM: boolean; inList: boolean; onAdd: () => void }) {
  return (
    <>
      {t ? (
        <View style={{ flexDirection: 'row', gap: 10, backgroundColor: 'rgba(18,18,28,0.35)', borderRadius: 16, padding: 8 }}>
          <View style={{ width: 54 }}><Poster t={t} w={54} rounded={12} /></View>
          <View style={{ flex: 1, gap: 4, justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{mineM ? 'TU CONSEILLES' : 'IL OU ELLE TE CONSEILLE'}</Text>
            <Text numberOfLines={2} style={{ color: '#fff', fontFamily: FONT_DISPLAY_SEMI, fontSize: 16 }}>{t.title}</Text>
            {!mineM ? (inList ? <Text style={{ color: C.mint, fontSize: 12, fontWeight: '700' }}>✓ Dans ta liste</Text>
              : <Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel={`Ajouter ${t.title} à ma liste`}><Text style={{ color: C.gold, fontSize: 13, fontWeight: '700' }}>＋ Ajouter à ma liste</Text></Pressable>) : null}
          </View>
        </View>
      ) : null}
      {m.body ? <Text style={{ color: '#fff', fontSize: 15, lineHeight: 21 }}>{m.body}</Text> : null}
      {m.media_kind ? <MediaView path={m.media_path} kind={m.media_kind} secs={m.media_secs} expires={m.expires_at} /> : null}
    </>
  );
}

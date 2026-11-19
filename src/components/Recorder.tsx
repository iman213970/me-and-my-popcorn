import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { canRecord, fmtSecs, MAX_SECS, pickMime, uploadMedia, type Media, type MediaKind } from '../lib/media';
import { useStore } from '../lib/store';
import { C } from '../lib/theme';
import { Press } from './fx';
import { Sheet } from './Sheet';
import { Btn, Mu } from './ui';

type Phase = 'ask' | 'ready' | 'rec' | 'review' | 'up';

/** Enregistre un vocal (60 s) ou une vidéo (30 s) avec le micro et la caméra de l'appareil. */
function RecorderPanel({ kind, onDone, onClose }: { kind: MediaKind; onDone: (m: Media) => void; onClose: () => void }) {
  const { session } = useStore();
  const [phase, setPhase] = useState<Phase>('ask');
  const [err, setErr] = useState('');
  const [secs, setSecs] = useState(0);
  const [prev, setPrev] = useState('');
  const stream = useRef<MediaStream | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const blob = useRef<Blob | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const t0 = useRef(0);
  const live = useRef<HTMLVideoElement | null>(null);
  const max = MAX_SECS[kind];

  const stopStream = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; };
  useEffect(() => () => { clearInterval(timer.current); stopStream(); }, []);
  useEffect(() => { if (prev) return () => URL.revokeObjectURL(prev); }, [prev]);
  useEffect(() => { if (live.current && stream.current && phase !== 'review') live.current.srcObject = stream.current; });

  const open = async () => {
    setErr('');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia(kind === 'voice' ? { audio: true } : { audio: true, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      setPhase('ready');
    } catch { setErr("Je n'ai pas accès au micro" + (kind === 'video' ? ' ou à la caméra' : '') + ". Autorise-le dans les réglages de ton navigateur, puis réessaie."); }
  };
  useEffect(() => { void open(); }, []);

  const start = () => {
    if (!stream.current) return;
    chunks.current = [];
    const mime = pickMime(kind);
    const r = new MediaRecorder(stream.current, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 64000, ...(kind === 'video' ? { videoBitsPerSecond: 900000 } : {}) });
    r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
    r.onstop = () => {
      const b = new Blob(chunks.current, { type: r.mimeType || mime });
      blob.current = b; setPrev(URL.createObjectURL(b)); stopStream(); setPhase('review');
    };
    rec.current = r; r.start(); t0.current = Date.now(); setSecs(0); setPhase('rec');
    timer.current = setInterval(() => { const s = Math.round((Date.now() - t0.current) / 1000); setSecs(s); if (s >= max) stop(); }, 250);
  };
  const stop = () => { clearInterval(timer.current); if (rec.current && rec.current.state !== 'inactive') rec.current.stop(); };
  const again = async () => { blob.current = null; setPrev(''); setPhase('ask'); await open(); };
  const use = async () => {
    if (!blob.current || !session) return;
    setPhase('up'); setErr('');
    try { onDone(await uploadMedia(session.user.id, blob.current, kind, Math.max(1, secs))); }
    catch (e) { setErr(e instanceof Error ? e.message : "L'envoi a échoué."); setPhase('review'); }
  };

  return (
    <View style={{ gap: 14, alignItems: 'center' }}>
      {err ? <Text style={{ color: C.rose, fontSize: 13, textAlign: 'center' }}>{err}</Text> : null}
      {phase === 'ask' && !err ? <ActivityIndicator color={C.mu} /> : null}
      {kind === 'video' && (phase === 'ready' || phase === 'rec') ? React.createElement('video', { ref: (el: HTMLVideoElement | null) => { live.current = el; if (el && stream.current) el.srcObject = stream.current; }, muted: true, autoPlay: true, playsInline: true, style: { width: '100%', maxHeight: 300, borderRadius: 22, backgroundColor: '#000', transform: 'scaleX(-1)' } }) : null}
      {kind === 'voice' && (phase === 'ready' || phase === 'rec') ? (
        <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: phase === 'rec' ? 'rgba(255,93,115,0.2)' : C.sf2, alignItems: 'center', justifyContent: 'center', boxShadow: phase === 'rec' ? '0px 0px 30px rgba(255,93,115,0.6)' : undefined }}>
          <Ionicons name="mic" size={46} color={phase === 'rec' ? C.rose : C.tx} />
        </View>
      ) : null}
      {phase === 'review' && prev ? (kind === 'voice'
        ? React.createElement('audio', { src: prev, controls: true, style: { width: '100%' } })
        : React.createElement('video', { src: prev, controls: true, playsInline: true, style: { width: '100%', maxHeight: 300, borderRadius: 22, backgroundColor: '#000' } })) : null}
      {phase === 'rec' || phase === 'review' ? <Text style={{ color: C.tx, fontSize: 20, fontWeight: '700' }}>{fmtSecs(secs)} <Text style={{ color: C.mu, fontSize: 13, fontWeight: '400' }}>/ {fmtSecs(max)}</Text></Text> : null}
      {phase === 'ready' ? <Btn label="Enregistrer" icon="radio-button-on" onPress={start} /> : null}
      {phase === 'rec' ? <Btn label="Arrêter" kind="danger" icon="stop-circle" onPress={stop} /> : null}
      {phase === 'review' ? (
        <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
          <View style={{ flex: 1 }}><Btn label="Refaire" kind="alt" onPress={again} /></View>
          <View style={{ flex: 1 }}><Btn label="Garder" onPress={use} /></View>
        </View>
      ) : null}
      {phase === 'up' ? <><ActivityIndicator color={C.ac} /><Mu size={12}>Envoi en cours…</Mu></> : null}
      {phase !== 'up' ? <Press onPress={onClose} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: C.mu, fontSize: 13 }}>Annuler</Text></Press> : null}
      {kind === 'video' ? <Mu size={12}>Les vidéos disparaissent au bout de 15 jours.</Mu> : null}
    </View>
  );
}

/** Boutons 🎤 / 🎥 à mettre dans un formulaire. `value` = l'enregistrement joint, `onChange` pour le joindre ou le retirer. */
export function MediaAttach({ value, onChange }: { value: Media | null; onChange: (m: Media | null) => void }) {
  const [kind, setKind] = useState<MediaKind | null>(null);
  if (Platform.OS !== 'web' || !canRecord()) return null;
  const pill = (k: MediaKind, label: string, icon: 'mic-outline' | 'videocam-outline') => (
    <Press key={k} onPress={() => setKind(k)} accessibilityRole="button" accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 42, borderRadius: 99, backgroundColor: C.sf2, borderWidth: 1, borderColor: C.line }}>
      <Ionicons name={icon} size={18} color={C.tx} /><Text style={{ color: C.tx, fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </Press>
  );
  return (
    <View style={{ gap: 8 }}>
      {value ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 10, backgroundColor: 'rgba(155,123,255,0.14)', borderWidth: 1, borderColor: 'rgba(155,123,255,0.4)' }}>
          <Text style={{ flex: 1, color: C.tx, fontSize: 13 }}>{value.kind === 'voice' ? '🎤 Vocal' : '🎥 Vidéo'} joint · {fmtSecs(value.secs)}</Text>
          <Press onPress={() => onChange(null)} accessibilityRole="button" accessibilityLabel="Retirer l'enregistrement" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={20} color={C.mu} /></Press>
        </View>
      ) : <View style={{ flexDirection: 'row', gap: 8 }}>{pill('voice', 'Vocal', 'mic-outline')}{pill('video', 'Vidéo', 'videocam-outline')}</View>}
      <Sheet open={!!kind} onClose={() => setKind(null)} title={kind === 'voice' ? 'Enregistrer un vocal' : 'Enregistrer une vidéo'}>
        {kind ? <RecorderPanel kind={kind} onClose={() => setKind(null)} onDone={(m) => { onChange(m); setKind(null); }} /> : null}
      </Sheet>
    </View>
  );
}

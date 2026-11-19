import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { daysLeft, fmtSecs, mediaUrl, type MediaKind } from '../lib/media';
import { C } from '../lib/theme';

/** Lecteur d'un vocal ou d'une vidéo privés. Une vidéo de plus de 15 jours n'existe plus. */
export function MediaView({ path, kind, secs, expires }: { path?: string | null; kind?: string | null; secs?: number | null; expires?: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setUrl(null); setFailed(false);
    if (!path || kind === 'expired') return;
    let alive = true;
    void mediaUrl(path).then((u) => { if (!alive) return; if (u) setUrl(u); else setFailed(true); });
    return () => { alive = false; };
  }, [path, kind]);

  if (kind === 'expired' || (kind === 'video' && !path)) {
    return <View style={{ borderRadius: 16, padding: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#4A4A6A' }}><Text style={{ color: C.mu, fontSize: 13 }}>🎞️ Cette vidéo a disparu (elle reste 15 jours).</Text></View>;
  }
  if (!path || !kind) return null;
  if (Platform.OS !== 'web') return <Text style={{ color: C.mu, fontSize: 13 }}>{kind === 'voice' ? '🎤 Vocal' : '🎥 Vidéo'} · à écouter depuis le site</Text>;
  const left = kind === 'video' ? daysLeft(expires) : null;
  return (
    <View style={{ gap: 6 }}>
      {failed ? <Text style={{ color: C.rose, fontSize: 12 }}>Impossible de charger le fichier.</Text>
        : !url ? <ActivityIndicator color={C.mu} />
        : kind === 'voice'
          ? React.createElement('audio', { src: url, controls: true, preload: 'metadata', style: { width: '100%', height: 40 } })
          : React.createElement('video', { src: url, controls: true, playsInline: true, preload: 'metadata', style: { width: '100%', maxHeight: 320, borderRadius: 18, backgroundColor: '#000' } })}
      <Text style={{ color: C.mu, fontSize: 11 }}>{kind === 'voice' ? '🎤 Vocal' : '🎥 Vidéo'}{secs ? ` · ${fmtSecs(secs)}` : ''}{left != null ? ` · disparaît dans ${left} jour${left > 1 ? 's' : ''}` : ''}</Text>
    </View>
  );
}
export type { MediaKind };

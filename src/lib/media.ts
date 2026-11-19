import { supabase } from './supabase';

export type MediaKind = 'voice' | 'video';
export type Media = { path: string; kind: MediaKind; secs: number };
export const MAX_SECS: Record<MediaKind, number> = { voice: 60, video: 30 };

/** Vocaux et vidéos : seulement dans un navigateur qui sait enregistrer (Safari, Chrome). */
export const canRecord = () =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

const CANDIDATES: Record<MediaKind, string[]> = {
  voice: ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'],
  video: ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'],
};
/** Le premier format que ce navigateur sait enregistrer (mp4 d'abord : il se lit partout, iPhone compris). */
export const pickMime = (kind: MediaKind) => CANDIDATES[kind].find((m) => { try { return MediaRecorder.isTypeSupported(m); } catch { return false; } }) ?? '';

const extOf = (mime: string, kind: MediaKind) => (mime.includes('mp4') ? (kind === 'voice' ? 'm4a' : 'mp4') : mime.includes('ogg') ? 'ogg' : 'webm');
const baseMime = (mime: string, kind: MediaKind) => { const b = mime.split(';')[0]; return b || (kind === 'voice' ? 'audio/mp4' : 'video/mp4'); };

/** Envoie un enregistrement dans ton dossier privé et renvoie ce qu'il faut garder en base. */
export async function uploadMedia(uid: string, blob: Blob, kind: MediaKind, secs: number): Promise<Media> {
  const mime = baseMime(blob.type, kind);
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
  const path = `${uid}/${id}.${extOf(mime, kind)}`;
  const { error } = await supabase.storage.from('media').upload(path, blob, { contentType: mime, upsert: false });
  if (error) throw error;
  return { path, kind, secs };
}

const urlCache = new Map<string, { url: string; at: number }>();
/** Lien temporaire (1 h) pour lire un fichier privé. */
export async function mediaUrl(path: string): Promise<string | null> {
  const c = urlCache.get(path);
  if (c && Date.now() - c.at < 50 * 60e3) return c.url;
  const { data, error } = await supabase.storage.from('media').createSignedUrl(path, 3600);
  if (error || !data) return null;
  urlCache.set(path, { url: data.signedUrl, at: Date.now() });
  return data.signedUrl;
}

export async function removeFiles(paths: string[]) {
  if (paths.length) await supabase.storage.from('media').remove(paths);
}

/** Retire mes vidéos de plus de 15 jours (une fois par session). */
let cleaned = false;
export async function cleanupExpired() {
  if (cleaned) return;
  cleaned = true;
  try {
    const { data, error } = await supabase.rpc('expire_my_media');
    if (!error && Array.isArray(data) && data.length) await removeFiles(data as string[]);
  } catch { /* pas grave, on réessaiera à la prochaine ouverture */ }
}

export const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export const daysLeft = (expires?: string | null) => (expires ? Math.max(0, Math.ceil((new Date(expires).getTime() - Date.now()) / 86400000)) : null);

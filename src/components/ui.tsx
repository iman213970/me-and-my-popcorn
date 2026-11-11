import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Title } from '../lib/catalog';
import { posterUrl } from '../lib/tmdb';
import { C, FONT_DISPLAY, FONT_DISPLAY_SEMI, SHADOW, SHADOW_SOFT, STATUS_COLORS, statusLabel } from '../lib/theme';
import { Press } from './fx';
import { ClapArt, PopcornArt, ReelArt, TicketArt } from './Cine';

/** Écran avec défilement, largeur limitée sur grand écran (iPad, web). */
export function Screen({ children, bottomPad = 120 }: { children: React.ReactNode; bottomPad?: number }) {
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: bottomPad }]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export const H1 = ({ children }: { children: React.ReactNode }) => <Text style={s.h1} accessibilityRole="header">{children}</Text>;
export const H2 = ({ children }: { children: React.ReactNode }) => <Text style={s.h2} accessibilityRole="header">{children}</Text>;
export const Mu = ({ children, size = 13, style }: { children: React.ReactNode; size?: number; style?: object }) => <Text style={[{ color: C.mu, fontSize: size, lineHeight: size * 1.4 }, style]}>{children}</Text>;

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Poster({ t, w, rounded = 22, shadow = true }: { t: Title; w?: number; rounded?: number; shadow?: boolean }) {
  return (
    <LinearGradient colors={t.c} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }}
      style={[{ aspectRatio: 2 / 3, width: w ?? '100%', borderRadius: rounded, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, shadow && { boxShadow: SHADOW_SOFT }]}
      accessibilityLabel={`Affiche de ${t.title}`}>
      <Text style={{ color: 'rgba(255,255,255,0.3)', fontFamily: FONT_DISPLAY, fontSize: w ? w * 0.4 : 40 }}>{t.title.charAt(0)}</Text>
      {t.poster ? <Image source={{ uri: posterUrl(t.poster, w && w > 120 ? 'w500' : 'w342') }} resizeMode="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} /> : null}
    </LinearGradient>
  );
}

/** Note sur 10 affichée en 10 étoiles. */
export function Stars({ note, size = 13 }: { note: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }} accessibilityLabel={`Note ${note} sur 10`}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((i) => <Ionicons key={i} name={note >= i ? 'star' : 'star-outline'} size={size} color={C.gold} />)}
    </View>
  );
}

export function Pill({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS['À regarder'];
  return (
    <View style={{ backgroundColor: c[0], borderRadius: 99, paddingHorizontal: 11, paddingVertical: 4, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c[1] }} />
      <Text style={{ color: c[1], fontSize: 12, fontWeight: '700' }}>{statusLabel(status)}</Text>
    </View>
  );
}

export function Chip({ label, on, onPress, small }: { label: string; on?: boolean; onPress: () => void; small?: boolean }) {
  return (
    <Press onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!on }} down={0.93} zoom={1.04}
      style={[s.chip, on && { backgroundColor: C.ac, boxShadow: SHADOW_SOFT }, small && { paddingHorizontal: 14 }]}>
      <Text style={{ color: on ? C.acfg : C.tx, fontWeight: on ? '700' : '500', fontSize: 14 }}>{label}</Text>
    </Press>
  );
}
export const Chips = ({ children }: { children: React.ReactNode }) => <View style={s.chips}>{children}</View>;

export function Seg({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={s.seg} accessibilityRole="tablist">
      {options.map((o) => (
        <Press key={o} onPress={() => onChange(o)} accessibilityRole="tab" accessibilityState={{ selected: value === o }} down={0.96} zoom={1.02}
          style={[s.segBtn, value === o && { backgroundColor: C.ac, boxShadow: SHADOW_SOFT }]}>
          <Text style={{ color: value === o ? C.acfg : C.tx, fontWeight: value === o ? '700' : '500', fontSize: 14 }}>{o}</Text>
        </Press>
      ))}
    </View>
  );
}

export function Btn({ label, onPress, kind = 'main', icon, disabled }: { label: string; onPress: () => void; kind?: 'main' | 'alt' | 'danger' | 'on'; icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean }) {
  const bg = kind === 'main' ? C.ac : kind === 'alt' ? C.sf2 : kind === 'danger' ? '#3A1D24' : '#1F3326';
  const fg = kind === 'main' ? C.acfg : kind === 'alt' ? C.tx : kind === 'danger' ? C.rose : C.mint;
  return (
    <Press onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}
      style={[{ minHeight: 52, borderRadius: 99, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 22, opacity: disabled ? 0.4 : 1 }, kind === 'main' && { boxShadow: '0px 8px 20px rgba(139,124,255,0.35)' }]}>
      {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
      <Text style={{ color: fg, fontWeight: '700', fontSize: 16 }}>{label}</Text>
    </Press>
  );
}

export function Field({ label, ...p }: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: C.mu, fontSize: 12 }}>{label}</Text>
      <TextInput {...p} accessibilityLabel={label} placeholderTextColor="#6B6A85"
        style={[{ minHeight: 50, borderRadius: 20, backgroundColor: C.sf2, color: C.tx, paddingHorizontal: 14, fontSize: 16 }, p.multiline && { paddingTop: 14, minHeight: 90, textAlignVertical: 'top' }]} />
    </View>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable onPress={() => onChange(!on)} accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label}
      style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: C.tx, fontSize: 16 }}>{label}</Text>
      <View style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: on ? C.ac : C.sf2, padding: 3, alignItems: on ? 'flex-end' : 'flex-start' }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' }} />
      </View>
    </Pressable>
  );
}

export function Bar({ pct, gold }: { pct: number; gold?: boolean }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ flex: 1, height: 12, borderRadius: 99, backgroundColor: C.sf2, overflow: 'hidden' }}>
      <LinearGradient colors={gold ? [C.gold, '#FFD98A'] : [C.wine, C.ac, C.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ width: `${p}%`, height: '100%', borderRadius: 99 }} />
    </View>
  );
}

export function Kv({ label, value, span, third }: { label: string; value: string | number; span?: boolean; third?: boolean }) {
  return (
    <View style={[{ backgroundColor: C.sf, borderRadius: 22, padding: 14, gap: 4, minWidth: 0 }, span ? { width: '100%' } : third ? { flexBasis: '30%', flexGrow: 1 } : { flexBasis: '48%', flexGrow: 1 }]}>
      <Text style={{ color: C.mu, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: C.tx, fontSize: 16, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

export { Avatar } from './AvatarView';

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, gap: 18, width: '100%', maxWidth: 520, alignSelf: 'center' },
  h1: { color: C.tx, fontSize: 32, fontFamily: FONT_DISPLAY, lineHeight: 38 },
  h2: { color: C.tx, fontSize: 21, fontFamily: FONT_DISPLAY_SEMI },
  card: { backgroundColor: C.sf, borderRadius: 28, padding: 18, gap: 14, boxShadow: SHADOW_SOFT, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 99, backgroundColor: C.sf2, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  seg: { flexDirection: 'row', backgroundColor: C.sf, borderRadius: 99, padding: 4, gap: 4 },
  segBtn: { flex: 1, height: 42, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
});

export function Stepper({ label, value, onMinus, onPlus }: { label: string; value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.sf2, borderRadius: 99, padding: 4 }}>
      <Pressable onPress={onMinus} accessibilityRole="button" accessibilityLabel={`${label} précédente`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="remove" size={20} color={C.tx} /></Pressable>
      <View style={{ alignItems: 'center' }}><Text style={{ color: C.mu, fontSize: 11 }}>{label}</Text><Text style={{ color: C.tx, fontSize: 18, fontWeight: '700' }}>{value}</Text></View>
      <Pressable onPress={onPlus} accessibilityRole="button" accessibilityLabel={`${label} suivante`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" size={20} color={C.tx} /></Pressable>
    </View>
  );
}

const ART = { popcorn: PopcornArt, ticket: TicketArt, clap: ClapArt, reel: ReelArt };
/** État vide avec une petite illustration de cinéma et un message amusant. */
export function Empty({ art = 'popcorn', title, children }: { art?: keyof typeof ART; title: string; children?: React.ReactNode }) {
  const Art = ART[art];
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 18, paddingHorizontal: 12 }}>
      <Art size={92} />
      <Text style={{ color: C.tx, fontFamily: FONT_DISPLAY_SEMI, fontSize: 19, textAlign: 'center' }}>{title}</Text>
      {children ? <Text style={{ color: C.mu, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>{children}</Text> : null}
    </View>
  );
}
export { ClapArt, PopcornArt, ReelArt, TicketArt };

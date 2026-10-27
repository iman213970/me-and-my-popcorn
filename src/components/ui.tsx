import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Title } from '../lib/catalog';
import { C, STATUS_COLORS } from '../lib/theme';

/** Écran avec défilement, largeur limitée sur grand écran (iPad, web). */
export function Screen({ children, bottomPad = 24 }: { children: React.ReactNode; bottomPad?: number }) {
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

export function Poster({ t, w, rounded = 12 }: { t: Title; w?: number; rounded?: number }) {
  return (
    <LinearGradient colors={t.c} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }}
      style={{ aspectRatio: 2 / 3, width: w ?? '100%', borderRadius: rounded, alignItems: 'center', justifyContent: 'center' }}
      accessibilityLabel={`Affiche de ${t.title}`}>
      <Text style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '700', fontSize: w ? w * 0.4 : 40 }}>{t.title.charAt(0)}</Text>
    </LinearGradient>
  );
}

export function Pill({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS['À regarder'];
  return <View style={{ backgroundColor: c[0], borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}><Text style={{ color: c[1], fontSize: 12, fontWeight: '700' }}>{status}</Text></View>;
}

export function Chip({ label, on, onPress, small }: { label: string; on?: boolean; onPress: () => void; small?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!on }}
      style={[s.chip, on && { backgroundColor: C.ac }, small && { paddingHorizontal: 12 }]}>
      <Text style={{ color: on ? C.acfg : C.tx, fontWeight: on ? '700' : '400', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}
export const Chips = ({ children }: { children: React.ReactNode }) => <View style={s.chips}>{children}</View>;

export function Seg({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={s.seg} accessibilityRole="tablist">
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange(o)} accessibilityRole="tab" accessibilityState={{ selected: value === o }}
          style={[s.segBtn, value === o && { backgroundColor: C.ac }]}>
          <Text style={{ color: value === o ? C.acfg : C.tx, fontWeight: value === o ? '700' : '500', fontSize: 14 }}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Btn({ label, onPress, kind = 'main', icon, disabled }: { label: string; onPress: () => void; kind?: 'main' | 'alt' | 'danger' | 'on'; icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean }) {
  const bg = kind === 'main' ? C.ac : kind === 'alt' ? C.sf2 : kind === 'danger' ? '#3A1D24' : '#12312E';
  const fg = kind === 'main' ? C.acfg : kind === 'alt' ? C.tx : kind === 'danger' ? C.rose : C.mint;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}
      style={{ minHeight: 50, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 16, opacity: disabled ? 0.4 : 1 }}>
      {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
      <Text style={{ color: fg, fontWeight: '700', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...p }: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: C.mu, fontSize: 12 }}>{label}</Text>
      <TextInput {...p} accessibilityLabel={label} placeholderTextColor="#6B6A85"
        style={[{ minHeight: 48, borderRadius: 12, backgroundColor: C.sf2, color: C.tx, paddingHorizontal: 14, fontSize: 16 }, p.multiline && { paddingTop: 12, minHeight: 80, textAlignVertical: 'top' }]} />
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
  return (
    <View style={{ flex: 1, height: 8, borderRadius: 99, backgroundColor: C.sf2, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', borderRadius: 99, backgroundColor: gold ? C.gold : C.ac }} />
    </View>
  );
}

export function Kv({ label, value, span, third }: { label: string; value: string | number; span?: boolean; third?: boolean }) {
  return (
    <View style={[{ backgroundColor: C.sf, borderRadius: 14, padding: 12, gap: 4, minWidth: 0 }, span ? { width: '100%' } : third ? { flexBasis: '30%', flexGrow: 1 } : { flexBasis: '48%', flexGrow: 1 }]}>
      <Text style={{ color: C.mu, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: C.tx, fontSize: 15, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

export const AVATAR_COLORS: [string, string][] = [['#8B7CFF', '#4B3FBF'], ['#FFC14D', '#C77A12'], ['#5EEAD4', '#1F8F82'], ['#FF9AA8', '#B03A55'], ['#7AA8FF', '#2F4FA8'], ['#C5E86C', '#5C8A1E'], ['#FF8A5B', '#A8421A'], ['#D58CFF', '#7A2FA8']];
const AVATAR_ICONS: (keyof typeof Ionicons.glyphMap)[] = ['ellipse', 'triangle', 'square', 'diamond', 'radio-button-on', 'stats-chart', 'moon', 'star'];
export function Avatar({ i, size = 44 }: { i: number; size?: number }) {
  const k = ((i % 8) + 8) % 8;
  return (
    <LinearGradient colors={AVATAR_COLORS[k]} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={AVATAR_ICONS[k]} size={size * 0.45} color="#fff" />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, gap: 18, width: '100%', maxWidth: 520, alignSelf: 'center' },
  h1: { color: C.tx, fontSize: 28, fontWeight: '700' },
  h2: { color: C.tx, fontSize: 18, fontWeight: '600' },
  card: { backgroundColor: C.sf, borderRadius: 16, padding: 16, gap: 14 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 99, backgroundColor: C.sf2, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  seg: { flexDirection: 'row', backgroundColor: C.sf, borderRadius: 14, padding: 4, gap: 4 },
  segBtn: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

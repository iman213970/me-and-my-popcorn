import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { C } from '../lib/theme';
import { decodeAvatar, encodeAvatar, HAIR_COLORS, HAIR_NAMES, randomAvatar, SHIRTS, SKINS } from './Avatar';
import { Avatar } from './AvatarView';

const Label = ({ children }: { children: string }) => <Text style={{ color: C.mu, fontSize: 12 }}>{children}</Text>;

function Swatches({ colors, value, onPick, label }: { colors: string[]; value: number; onPick: (k: number) => void; label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Label>{label}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {colors.map((c, k) => (
          <Pressable key={c} onPress={() => onPick(k)} accessibilityRole="button" accessibilityLabel={`${label} ${k + 1}`}
            accessibilityState={{ selected: value === k }}
            style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: value === k ? C.tx : 'transparent' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c }} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** Créateur d'avatar : teint, coiffure, couleur des cheveux, couleur du haut. */
export function AvatarMaker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const a = decodeAvatar(value);
  const set = (p: Partial<typeof a>) => onChange(encodeAvatar({ ...a, ...p }));
  return (
    <View style={{ gap: 16 }}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Avatar i={value} size={112} />
        <Pressable onPress={() => onChange(randomAvatar())} accessibilityRole="button" accessibilityLabel="Avatar au hasard"
          style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderRadius: 99, backgroundColor: C.sf2 }}>
          <Ionicons name="dice-outline" size={18} color={C.tx} />
          <Text style={{ color: C.tx, fontWeight: '600' }}>Au hasard</Text>
        </Pressable>
      </View>
      <Swatches colors={SKINS} value={a.skin} onPick={(k) => set({ skin: k })} label="Teint" />
      <View style={{ gap: 8 }}>
        <Label>Coiffure</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {HAIR_NAMES.map((n, k) => (
            <Pressable key={n} onPress={() => set({ hair: k })} accessibilityRole="button" accessibilityLabel={`Coiffure ${n}`}
              accessibilityState={{ selected: a.hair === k }}
              style={{ padding: 3, borderRadius: 40, borderWidth: 2, borderColor: a.hair === k ? C.tx : 'transparent' }}>
              <Avatar i={encodeAvatar({ ...a, hair: k })} size={52} />
            </Pressable>
          ))}
        </View>
      </View>
      <Swatches colors={HAIR_COLORS} value={a.hcol} onPick={(k) => set({ hcol: k })} label={a.hair === 7 ? 'Couleur du voile' : 'Couleur des cheveux'} />
      <Swatches colors={SHIRTS} value={a.shirt} onPick={(k) => set({ shirt: k })} label="Couleur du haut" />
    </View>
  );
}

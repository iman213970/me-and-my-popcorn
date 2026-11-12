import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { C, FONT_DISPLAY } from '../lib/theme';
import { Btn } from './ui';

export type FilterField = { key: string; label: string; options: [string, string][] };

function Dropdown({ label, value, options, onPick }: { label: string; value: string; options: [string, string][]; onPick: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const shown = options.find(([k]) => k === value)?.[1] ?? value;
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: C.mu, fontSize: 13 }}>{label}</Text>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityLabel={`${label} : ${shown}`} accessibilityState={{ expanded: open }}
        style={{ minHeight: 54, borderRadius: 99, borderWidth: 1, borderColor: C.line, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: C.tx, fontSize: 17, fontWeight: '600' }}>{shown}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={C.mu} />
      </Pressable>
      {open ? (
        <View style={{ borderRadius: 22, backgroundColor: C.sf2, overflow: 'hidden' }}>
          {options.map(([k, l]) => (
            <Pressable key={k} onPress={() => { onPick(k); setOpen(false); }} accessibilityRole="button" accessibilityState={{ selected: k === value }}
              style={{ minHeight: 48, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: k === value ? C.ac : C.tx, fontSize: 16, fontWeight: k === value ? '700' : '400' }}>{l}</Text>
              {k === value ? <Ionicons name="checkmark" size={18} color={C.ac} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Panneau de filtres qui monte du bas, avec une liste déroulante par critère. */
export function FilterSheet({ open, onClose, fields, value, defaults, onApply }: {
  open: boolean; onClose: () => void; fields: FilterField[]; value: Record<string, string>; defaults: Record<string, string>; onApply: (v: Record<string, string>) => void;
}) {
  const [d, setD] = useState(value);
  useEffect(() => { if (open) setD(value); }, [open]);
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
          {fields.map((f) => <Dropdown key={f.key} label={f.label} value={d[f.key]} options={f.options} onPick={(v) => setD({ ...d, [f.key]: v })} />)}
        </ScrollView>
        <View style={{ gap: 10 }}>
          <Btn label="Appliquer" onPress={() => onApply(d)} />
          <Pressable onPress={() => onApply(defaults)} accessibilityRole="button" style={{ minHeight: 48, borderRadius: 99, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.tx, fontWeight: '600', fontSize: 15 }}>Réinitialiser</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

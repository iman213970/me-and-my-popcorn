import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { C, FONT_DISPLAY } from '../lib/theme';

/** Fenêtre qui monte du bas de l'écran (création, choix, confirmation). */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} accessibilityLabel="Fermer" style={{ flex: 1, backgroundColor: 'rgba(6,6,12,0.7)' }} />
      <View style={{ backgroundColor: C.sf, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingBottom: 28, gap: 16, maxHeight: '88%', width: '100%', maxWidth: 520, alignSelf: 'center', borderWidth: 1, borderColor: C.line }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <Text style={{ color: C.tx, fontSize: 22, fontFamily: FONT_DISPLAY, flex: 1 }}>{title}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.sf2, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={22} color={C.tx} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      </View>
    </Modal>
  );
}

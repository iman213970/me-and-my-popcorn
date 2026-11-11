import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { BY, type Entry } from '../lib/store';
import { C, FONT_DISPLAY_SEMI } from '../lib/theme';
import { FadeIn, Press } from './fx';
import { Poster } from './ui';

/** Grille d'affiches en 2 colonnes décalées (la colonne de droite est plus basse), pour casser la rigidité. */
export function TitleGrid({ ids, extra, above, badge }: {
  ids: string[];
  extra?: (id: string) => React.ReactNode;
  above?: (id: string) => React.ReactNode;
  badge?: (id: string) => React.ReactNode;
}) {
  const col = (par: number) => ids.map((id, k) => ({ id, k })).filter((x) => x.k % 2 === par);
  const card = ({ id, k }: { id: string; k: number }) => {
    const t = BY[id];
    return (
      <FadeIn key={id} delay={Math.min(k, 8) * 60}>
        <Press onPress={() => router.push(`/titre/${id}`)} accessibilityRole="button" accessibilityLabel={`Ouvrir ${t.title}`} style={{ gap: 8 }}>
          {above ? above(id) : null}
          <View>
            <Poster t={t} />
            {badge ? badge(id) : null}
          </View>
          <Text numberOfLines={2} style={{ color: C.tx, fontFamily: FONT_DISPLAY_SEMI, fontSize: 16, lineHeight: 20 }}>{t.title}</Text>
          {extra ? extra(id) : <Text numberOfLines={1} style={{ color: C.mu, fontSize: 12 }}>{`${t.genre} · ${t.year}`}</Text>}
        </Press>
      </FadeIn>
    );
  };
  return (
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
      <View style={{ flex: 1, gap: 22 }}>{col(0).map(card)}</View>
      <View style={{ flex: 1, gap: 22, marginTop: 34 }}>{col(1).map(card)}</View>
    </View>
  );
}
export type { Entry };

import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BY, type Entry } from '../lib/store';
import { C } from '../lib/theme';
import { Poster } from './ui';

/** Grille d'affiches à 3 colonnes. `extra` ajoute du contenu sous le titre. */
export function TitleGrid({ ids, extra, above, badge }: {
  ids: string[];
  extra?: (id: string) => React.ReactNode;
  above?: (id: string) => React.ReactNode;
  badge?: (id: string) => React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, columnGap: 10 }}>
      {ids.map((id) => {
        const t = BY[id];
        return (
          <Pressable key={id} onPress={() => router.push(`/titre/${id}`)} accessibilityRole="button"
            accessibilityLabel={`Ouvrir ${t.title}`} style={{ width: '31.4%', gap: 6 }}>
            {above ? above(id) : null}
            <View>
              <Poster t={t} />
              {badge ? badge(id) : null}
            </View>
            <Text numberOfLines={1} style={{ color: C.tx, fontWeight: '700', fontSize: 13 }}>{t.title}</Text>
            <Text numberOfLines={1} style={{ color: C.mu, fontSize: 12 }}>{extra ? undefined : `${t.genre} · ${t.year}`}</Text>
            {extra ? extra(id) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
export type { Entry };

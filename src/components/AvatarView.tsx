import React from 'react';
import { View } from 'react-native';
import { AvatarArt, decodeAvatar } from './Avatar';

/** Pastille ronde avec l'avatar dedans. `i` est l'entier enregistré dans le profil. */
export function Avatar({ i, size = 44 }: { i: number; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#2A2A3C' }}>
      <AvatarArt spec={decodeAvatar(i)} />
    </View>
  );
}

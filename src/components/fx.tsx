import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { onFlash } from '../lib/flash';
import { C, SHADOW } from '../lib/theme';

const native = Platform.OS !== 'web';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable avec petit effet de rebond au toucher et léger zoom au survol (ordinateur). */
export function Press({ style, children, zoom = 1.03, down = 0.95, ...rest }: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; zoom?: number; down?: number }) {
  const v = useRef(new Animated.Value(1)).current;
  const to = (x: number) => Animated.spring(v, { toValue: x, useNativeDriver: native, speed: 40, bounciness: 8 }).start();
  return (
    <AnimatedPressable {...rest}
      onPressIn={(e) => { to(down); rest.onPressIn?.(e); }}
      onPressOut={(e) => { to(1); rest.onPressOut?.(e); }}
      onHoverIn={(e) => { to(zoom); rest.onHoverIn?.(e); }}
      onHoverOut={(e) => { to(1); rest.onHoverOut?.(e); }}
      style={[style, { transform: [{ scale: v }] }]}>
      {children}
    </AnimatedPressable>
  );
}

/** Apparition douce (fondu + léger glissement vers le haut). */
export function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: native }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Bulle de retour (« +1 épisode »), montée une seule fois à la racine. */
export function FlashHost() {
  const [msg, setMsg] = useState('');
  const v = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    onFlash((m) => {
      setMsg(m);
      clearTimeout(timer.current);
      Animated.spring(v, { toValue: 1, useNativeDriver: native, bounciness: 12 }).start();
      timer.current = setTimeout(() => Animated.timing(v, { toValue: 0, duration: 250, useNativeDriver: native }).start(), 1800);
    });
    return () => onFlash(null);
  }, []);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 54, left: 0, right: 0, alignItems: 'center' }}>
      <Animated.View accessibilityLiveRegion="polite" style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
        backgroundColor: C.gold, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 99, boxShadow: SHADOW }}>
        <Text style={{ color: C.acfg, fontWeight: '700', fontSize: 15 }}>{msg}</Text>
      </Animated.View>
    </View>
  );
}

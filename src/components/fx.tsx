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

const KERNELS = Array.from({ length: 14 }, (_, i) => ({ a: (Math.PI * 2 * i) / 14 + (i % 3) * 0.15, d: 70 + (i % 4) * 26 }));

/** Petit éclat de grains de pop-corn derrière la bulle. */
function Burst({ k }: { k: number }) {
  const vs = useRef(KERNELS.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (!k) return;
    vs.forEach((v) => v.setValue(0));
    Animated.parallel(vs.map((v, i) => Animated.timing(v, { toValue: 1, duration: 800 + (i % 4) * 90, easing: Easing.out(Easing.cubic), useNativeDriver: native }))).start();
  }, [k]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 18, alignItems: 'center', width: 1, height: 1 }}>
      {KERNELS.map((c, i) => (
        <Animated.View key={i} style={{ position: 'absolute', width: 11, height: 11, borderRadius: 6, backgroundColor: i % 3 ? '#F6D68A' : '#FFF6DC', boxShadow: '0px 0px 8px rgba(240,184,79,0.9)',
          opacity: vs[i].interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
          transform: [{ translateX: vs[i].interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(c.a) * c.d] }) },
            { translateY: vs[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, Math.sin(c.a) * c.d - 36, Math.sin(c.a) * c.d + 30] }) },
            { scale: vs[i].interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }) }] }} />
      ))}
    </View>
  );
}

/** Bulle de retour (« +1 épisode »), montée une seule fois à la racine. */
export function FlashHost() {
  const [msg, setMsg] = useState('');
  const [k, setK] = useState(0);
  const v = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    onFlash((m) => {
      setMsg(m); setK((n) => n + 1);
      clearTimeout(timer.current);
      Animated.spring(v, { toValue: 1, useNativeDriver: native, bounciness: 12 }).start();
      timer.current = setTimeout(() => Animated.timing(v, { toValue: 0, duration: 250, useNativeDriver: native }).start(), 1800);
    });
    return () => onFlash(null);
  }, []);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 54, left: 0, right: 0, alignItems: 'center' }}>
      <Animated.View accessibilityLiveRegion="polite" style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
        backgroundColor: C.gold, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 99, boxShadow: '0px 10px 24px rgba(0,0,0,0.38), 0px 0px 22px rgba(240,184,79,0.55)' }}>
        <Text style={{ color: C.acfg, fontWeight: '700', fontSize: 15 }}>{msg}</Text>
      </Animated.View>
      <Burst k={k} />
    </View>
  );
}

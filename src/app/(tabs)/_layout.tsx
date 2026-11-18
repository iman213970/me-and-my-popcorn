import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { C, GLOW, SHADOW, SIG } from '../../lib/theme';

const icon = (name: keyof typeof Ionicons.glyphMap, on: keyof typeof Ionicons.glyphMap) => ({ color, focused }: { color: any; focused: boolean }) => (
  <View style={{ width: 50, height: 32, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', boxShadow: focused ? GLOW : undefined }}>
    {focused ? <LinearGradient colors={SIG} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} /> : null}
    <Ionicons name={focused ? on : name} size={21} color={focused ? '#fff' : color} />
  </View>
);

export default function TabsLayout() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs screenOptions={{
      headerShown: false, animation: 'fade', tabBarActiveTintColor: C.ac, tabBarInactiveTintColor: C.mu,
      tabBarStyle: {
        position: 'absolute', left: 14, right: 14, bottom: Math.max(14, bottom - 4), height: 74, borderRadius: 37,
        backgroundColor: C.sf, borderTopWidth: 0, paddingTop: 8, paddingBottom: 9, paddingHorizontal: 6,
        boxShadow: SHADOW, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      sceneStyle: { backgroundColor: C.bg },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="catalogue" options={{ title: 'Catalogue', tabBarIcon: icon('search-outline', 'search') }} />
      <Tabs.Screen name="liste" options={{ title: 'Ma liste', tabBarIcon: icon('bookmark-outline', 'bookmark') }} />
      <Tabs.Screen name="amis" options={{ title: 'Proches', tabBarIcon: icon('people-outline', 'people') }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}

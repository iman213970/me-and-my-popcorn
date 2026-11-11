import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, SHADOW } from '../../lib/theme';

const icon = (name: keyof typeof Ionicons.glyphMap, on: keyof typeof Ionicons.glyphMap) => ({ color, focused }: { color: any; focused: boolean }) => (
  <View style={{ width: 46, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? 'rgba(228,87,46,0.2)' : 'transparent' }}>
    <Ionicons name={focused ? on : name} size={21} color={color} />
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
        boxShadow: SHADOW, borderWidth: 1, borderColor: 'rgba(247,237,224,0.07)',
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

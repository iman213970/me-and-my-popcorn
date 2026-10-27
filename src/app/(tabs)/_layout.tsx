import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { C } from '../../lib/theme';

const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: any; size: number }) => <Ionicons name={name} size={size} color={color} />;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false, tabBarActiveTintColor: C.ac, tabBarInactiveTintColor: C.mu,
      tabBarStyle: { backgroundColor: C.sf, borderTopColor: C.line, height: 64, paddingBottom: 8, paddingTop: 6 },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      sceneStyle: { backgroundColor: C.bg },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="catalogue" options={{ title: 'Catalogue', tabBarIcon: icon('search-outline') }} />
      <Tabs.Screen name="liste" options={{ title: 'Ma liste', tabBarIcon: icon('bookmark-outline') }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: icon('person-outline') }} />
    </Tabs>
  );
}

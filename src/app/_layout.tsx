import { Fraunces_600SemiBold, Fraunces_700Bold, useFonts } from '@expo-google-fonts/fraunces';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FlashHost } from '../components/fx';
import { StoreProvider, useStore } from '../lib/store';
import { C } from '../lib/theme';

function Routes() {
  const { ready, session } = useStore();
  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.ac} /></View>;
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom', contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="titre/[id]" />
        <Stack.Screen name="ami/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="connexion" />
      </Stack.Protected>
    </Stack>
  );
}

export default function Root() {
  const [loaded, err] = useFonts({ Fraunces_600SemiBold, Fraunces_700Bold });
  if (!loaded && !err) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <Routes />
        <FlashHost />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  useFonts,
  PlayfairDisplaySC_400Regular,
  PlayfairDisplaySC_700Bold,
} from '@expo-google-fonts/playfair-display-sc';
import {
  Karla_300Light,
  Karla_400Regular,
  Karla_500Medium,
  Karla_600SemiBold,
  Karla_700Bold,
} from '@expo-google-fonts/karla';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  const { isHydrated, session, role, hydrate } = useAuthStore();

  const [fontsLoaded] = useFonts({
    PlayfairDisplaySC_400Regular,
    PlayfairDisplaySC_700Bold,
    Karla_300Light,
    Karla_400Regular,
    Karla_500Medium,
    Karla_600SemiBold,
    Karla_700Bold,
  });

  // Hydrate auth state on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Hide splash screen once fonts are loaded AND auth is hydrated
  useEffect(() => {
    if (fontsLoaded && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isHydrated]);

  // Auth guard — single redirect logic, runs only after hydration
  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session) {
      // Not authenticated → send to login (unless already there)
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (role === 'owner') {
      // TODO: route to /(owner)/ when owner dashboard is implemented (Story 2.x)
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    } else {
      // Customer (default) → send to customer tabs
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [isHydrated, session, role, segments, router]);

  // Keep splash visible until both fonts and auth are ready
  if (!fontsLoaded || !isHydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

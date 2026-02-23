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
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import NetInfo from '@react-native-community/netinfo';
import { useNetwork } from '@/hooks/use-network';
import { useAuthStore } from '@/stores/auth-store';
import { NoConnection } from '@/components/ui/no-connection';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  const { isHydrated, session, role, onboardingCompleted, hydrate } = useAuthStore();
  const { isConnected } = useNetwork();

  // Tracks whether we detected no connection at launch, before hydration ran.
  // This breaks the deadlock where isHydrated never becomes true when offline
  // (fetchProfile in hydrate() requires network).
  const [isOfflineAtLaunch, setIsOfflineAtLaunch] = useState(false);

  const [fontsLoaded] = useFonts({
    PlayfairDisplaySC_400Regular,
    PlayfairDisplaySC_700Bold,
    Karla_300Light,
    Karla_400Regular,
    Karla_500Medium,
    Karla_600SemiBold,
    Karla_700Bold,
  });

  // Only call hydrate() when connected AND not yet hydrated.
  // The !isHydrated guard prevents double-calling on reconnect mid-session:
  // without it, the effect re-runs when isHydrated changes false→true
  // (it's a dep), and would call hydrate() a second time unnecessarily.
  useEffect(() => {
    if (isConnected === true && !isHydrated) {
      setIsOfflineAtLaunch(false);
      hydrate();
    } else if (isConnected === false && !isHydrated) {
      setIsOfflineAtLaunch(true);
    }
  }, [isConnected, hydrate, isHydrated]);

  // Hide splash screen once fonts are loaded AND (hydrated OR we know we're offline).
  // Without the offline check, the splash stays visible forever when offline.
  useEffect(() => {
    if (fontsLoaded && (isHydrated || isOfflineAtLaunch)) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isHydrated, isOfflineAtLaunch]);

  // Auth guard — single redirect logic, runs only after hydration
  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOwnerGroup = segments[0] === '(owner)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!session) {
      // Not authenticated → send to login (unless already there)
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (role === 'owner') {
      // Owner → owner dashboard (owners skip onboarding)
      if (inAuthGroup || inTabsGroup) {
        router.replace('/(owner)');
      }
    } else {
      // Customer — wait for role AND onboardingCompleted to be confirmed.
      // Both are set in the deferred onAuthStateChange profile fetch
      // (setTimeout 0 in auth-store). They are separate setState calls,
      // so there is a render between them where role='customer' but
      // onboardingCompleted=null — guarding both prevents a spurious
      // redirect to onboarding for returning users.
      if (role === null || onboardingCompleted === null) return;

      const inOnboarding = segments[0] === '(auth)' && segments[1] === 'onboarding';

      if (!onboardingCompleted && !inOnboarding) {
        // First-time customer (or incomplete onboarding) → onboarding flow
        router.replace('/(auth)/onboarding');
      } else if (onboardingCompleted && (inAuthGroup || inOwnerGroup)) {
        // Returning customer landing on auth screens → home
        router.replace('/(tabs)');
      }
      // Already in (tabs) with onboarding done → no redirect needed
    }
  }, [isHydrated, session, role, onboardingCompleted, segments, router]);

  // Keep splash visible until fonts ready AND (hydrated OR offline detected)
  if (!fontsLoaded || (!isHydrated && !isOfflineAtLaunch)) return null;

  // No connection — show dedicated screen with retry
  if (isOfflineAtLaunch) {
    return (
      <NoConnection
        onRetry={async () => {
          // Do a fresh check — the useNetwork listener may not have fired yet.
          // Only transition if actually connected; otherwise keep NoConnection visible.
          const { isConnected: nowConnected } = await NetInfo.fetch();
          if (nowConnected) {
            setIsOfflineAtLaunch(false);
            hydrate();
          }
        }}
      />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(owner)" options={{ headerShown: false }} />
            <Stack.Screen name="restaurant/[slug]" options={{ headerShown: false }} />
            <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="checkout" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// Fonts
import { useFonts, MomoTrustDisplay_400Regular } from '@expo-google-fonts/momo-trust-display';
import { Kavoon_400Regular } from '@expo-google-fonts/kavoon';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Load both fonts
  const [fontsLoaded] = useFonts({
    MomoTrustDisplay_400Regular,
    Kavoon_400Regular,
  });

  // Forcing onboarding for now
  const [storageReady, setStorageReady] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        // dev-only: skip checking hasSeenOnboarding()
      } finally {
        setStorageReady(true);
      }
    })();
  }, []);

  const appReady = fontsLoaded && storageReady;

  // Guard: allow /login; force all others to onboarding
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (!appReady) return;

    const inOnboarding = segments[0] === '(onboarding)';
    const isLogin = segments[0] === 'login';
    const isSignup = segments[0] === 'signup';

    if (!inOnboarding && !isLogin) {
      router.replace('/(onboarding)');
    }
  }, [appReady, segments, router]);

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync().catch(() => {});
  }, [appReady]);

  return appReady ? <Slot /> : null;
}

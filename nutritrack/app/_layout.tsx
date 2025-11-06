// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// Fonts
import {
  useFonts,
  MomoTrustDisplay_400Regular,
} from '@expo-google-fonts/momo-trust-display';
import { Kavoon_400Regular } from '@expo-google-fonts/kavoon';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // 1) Load fonts
  const [fontsLoaded] = useFonts({
    MomoTrustDisplay_400Regular,
    Kavoon_400Regular,
  });

  // 2) (Dev) mark storage ready without checking onboarding yet
  const [storageReady, setStorageReady] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        // Dev-only: skip hasSeenOnboarding(); allow manual routing
      } finally {
        setStorageReady(true);
      }
    })();
  }, []);

  const appReady = fontsLoaded && storageReady;

  // 3) Route guard: allow onboarding, login, and setup/*
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!appReady) return;

    const seg0 = segments[0]; // e.g. '(onboarding)' | 'login' | 'setup' | '(tabs)' | 'dashboard'
    const inOnboarding = seg0 === '(onboarding)';
    const isLogin = seg0 === 'login';
    const inSetup = seg0 === 'setup';

    // Force everything else back to onboarding
    if (!inOnboarding && !isLogin && !inSetup) {
      router.replace('/(onboarding)');
    }
  }, [appReady, segments, router]);

  // 4) Hide splash when ready
  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady]);

  // 5) Render current route tree
  return appReady ? <Slot /> : null;
}

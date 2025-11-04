// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { hasSeenOnboarding } from '@/lib/onboarding';
import { useFonts, MomoTrustDisplay_400Regular } from '@expo-google-fonts/momo-trust-display';
import { Kavoon_400Regular } from '@expo-google-fonts/kavoon';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ MomoTrustDisplay_400Regular, Kavoon_400Regular });
  const [storageReady, setStorageReady] = useState(false);

  // You’re forcing onboarding for now
  useEffect(() => {
    (async () => {
      try {
        // pretend onboarding has NOT been seen (for dev)
      } finally {
        setStorageReady(true);
      }
    })();
  }, []);

  const appReady = fontsLoaded && storageReady;

  const segments = useSegments();
  const router = useRouter();

  // 👇 Allow /login to be visited; force all other routes to onboarding
  useEffect(() => {
    if (!appReady) return;

    const inOnboarding = segments[0] === '(onboarding)';
    const isLogin = segments[0] === 'login';

    if (!inOnboarding && !isLogin) {
      router.replace('/(onboarding)');
    }
  }, [appReady, segments, router]);

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync().catch(() => {});
  }, [appReady]);

  return appReady ? <Slot /> : null;
}
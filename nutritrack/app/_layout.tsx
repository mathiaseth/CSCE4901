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

// Firebase
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    MomoTrustDisplay_400Regular,
    Kavoon_400Regular,
  });

  const [authReady, setAuthReady] = useState(false);
  const [userIsLoggedIn, setUserIsLoggedIn] = useState<boolean>(false);

  const segments = useSegments();
  const router = useRouter();

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserIsLoggedIn(!!user);
      setAuthReady(true);
    });

    return unsub;
  }, []);

  const appReady = fontsLoaded && authReady;

  // Route guard based on auth
  useEffect(() => {
    if (!appReady) return;

    const seg0 = segments[0]; // '(onboarding)' | '(tabs)' | 'setup' | 'login' | etc.
    const inOnboarding = seg0 === '(onboarding)';
    const inTabs = seg0 === '(tabs)';
    const inSetup = seg0 === 'setup';
    const isLogin = seg0 === 'login';

    // NEW: allow these routes while logged in
    const isProfile = seg0 === 'profile';
    const isSettings = seg0 === 'settings';
    const isLogEntry = seg0 === 'log-entry';

    //  If logged in → keep them inside tabs OR allowed pages
    if (userIsLoggedIn) {
      if (!inTabs && !isProfile && !isSettings && !isLogEntry) {
        router.replace('/(tabs)/dashboard');
      }
      return;
    }

    // If logged out → keep them in onboarding/login/setup
    if (inOnboarding || isLogin || inSetup) return;

    router.replace('/(onboarding)');
  }, [appReady, userIsLoggedIn, segments, router]);

  // Hide splash when ready
  useEffect(() => {
    if (appReady) SplashScreen.hideAsync().catch(() => {});
  }, [appReady]);

  return appReady ? <Slot /> : null;
}

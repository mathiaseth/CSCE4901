// app/_layout.tsx
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import React, { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, MomoTrustDisplay_400Regular } from '@expo-google-fonts/momo-trust-display';
import { Kavoon_400Regular } from '@expo-google-fonts/kavoon';
import { supabase } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ MomoTrustDisplay_400Regular, Kavoon_400Regular });
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setInitializing(false);

      const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
      });
      return () => sub.subscription.unsubscribe();
    })();
  }, []);

  useEffect(() => {
    if (initializing || !fontsLoaded) return;

    const seg0 = segments[0];
    const inOnboarding = seg0 === '(onboarding)';
    const isLogin = seg0 === 'login';
    const isSignup = seg0 === 'signup';
    const inTabs = seg0 === '(tabs)';

    if (session) {
      if (!inTabs) router.replace('/(tabs)/dashboard');
    } else {
      if (!inOnboarding && !isLogin && !isSignup) {
        router.replace('/(onboarding)');
      }
    }
  }, [session, segments, fontsLoaded, initializing, router]);

  useEffect(() => {
    if (!initializing && fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [initializing, fontsLoaded]);

  if (initializing || !fontsLoaded) return null;
  return <Slot />;
}

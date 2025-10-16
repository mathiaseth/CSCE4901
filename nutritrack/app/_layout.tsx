// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasSeenOnboarding } from '@/lib/onboarding';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState<boolean | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const onboardingSeen = await hasSeenOnboarding();
        const token = await AsyncStorage.getItem('authToken');
        setSeen(onboardingSeen);
        setLoggedIn(!!token);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ready || seen === null || loggedIn === null) return;

    const inOnboarding = segments[0] === '(onboarding)';
    const inTabs = segments[0] === '(tabs)';
    const inLogin = segments[0] === 'login';

    // Routing logic
    if (!seen && !inOnboarding) {
      router.replace('/(onboarding)');
    } else if (seen && !loggedIn && !inLogin) {
      router.replace('/login');
    } else if (seen && loggedIn && !inTabs) {
      router.replace('/(tabs)');
    }
  }, [ready, seen, loggedIn, segments]);

  return ready ? <Slot /> : null;
}

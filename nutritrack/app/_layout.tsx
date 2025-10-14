// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { hasSeenOnboarding } from '@/lib/onboarding';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState<boolean | null>(null);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        setSeen(await hasSeenOnboarding());
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ready || seen === null) return;

    const inOnboarding = segments[0] === '(onboarding)';

    // Only navigate when you’re on the wrong group
    if (!seen && !inOnboarding) {
      router.replace('/(onboarding)');
    } else if (seen && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [ready, seen, segments]);

  // Render the current route tree (onboarding or tabs)
  return ready ? <Slot /> : null;
}
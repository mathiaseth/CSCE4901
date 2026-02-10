// app/_layout.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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

// Motivation helpers
import {
  getMotivationEnabled,
  wasShownToday,
  markShownToday,
  randomQuote,
} from '../lib/motivation';

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

  // Popup overlay state (web-safe)
  const [motivationVisible, setMotivationVisible] = useState(false);
  const [motivationText, setMotivationText] = useState('');

  // refs so timer survives re-renders
  const prevLoggedInRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Allow these routes while logged in
    const isProfile = seg0 === 'profile';
    const isSettings = seg0 === 'settings';
    const isLogEntry = seg0 === 'log-entry';

    if (userIsLoggedIn) {
      if (!inTabs && !isProfile && !isSettings && !isLogEntry) {
        router.replace('/(tabs)/dashboard');
      }
      return;
    }

    if (inOnboarding || isLogin || inSetup) return;

    router.replace('/(onboarding)');
  }, [appReady, userIsLoggedIn, segments, router]);

  // Motivation pop-up: once per day, 5 seconds after login
  useEffect(() => {
    if (!appReady) return;

    const justLoggedIn = !prevLoggedInRef.current && userIsLoggedIn;
    prevLoggedInRef.current = userIsLoggedIn;

    if (!justLoggedIn) return;

    (async () => {
      const enabled = await getMotivationEnabled();
      if (!enabled) return;

      const already = await wasShownToday();
      if (already) return;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        setMotivationText(randomQuote());
        setMotivationVisible(true);
        await markShownToday();
      }, 5000);
    })();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [appReady, userIsLoggedIn]);

  // Hide splash when ready
  useEffect(() => {
    if (appReady) SplashScreen.hideAsync().catch(() => {});
  }, [appReady]);

  return appReady ? (
    <View style={{ flex: 1 }}>
      <Slot />

      {motivationVisible && (
        <View style={styles.overlay} pointerEvents="auto">
          <View style={styles.card}>
            <Text style={styles.title}>Daily reminder</Text>
            <Text style={styles.body}>{motivationText}</Text>

            <Pressable
              onPress={() => setMotivationVisible(false)}
              style={styles.button}
              hitSlop={10}
            >
              <Text style={styles.buttonText}>Let’s go</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 999999,
    elevation: 999999,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B2C5E',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '700',
    marginBottom: 14,
    lineHeight: 20,
  },
  button: {
    alignSelf: 'flex-end',
    backgroundColor: '#1E90D6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});

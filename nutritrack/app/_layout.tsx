// app/_layout.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
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

// Theme
import {
  ThemeContext,
  colorsFor,
  getThemeMode,
  setThemeMode,
  type AppThemeMode,
} from '../lib/theme';

// Nutrition & Water contexts
import { NutritionProvider } from '../context/NutritionContext';
import { WaterProvider } from '../context/WaterContext';
import { scheduleWaterReminders } from '../lib/waterReminders';

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

  // Theme state
  const [themeMode, setThemeModeState] = useState<AppThemeMode>('light');
  const colors = colorsFor(themeMode);

  useEffect(() => {
    (async () => {
      const saved = await getThemeMode();
      setThemeModeState(saved);
    })();
  }, []);

  const updateThemeMode = (mode: AppThemeMode) => {
    setThemeModeState(mode);
    setThemeMode(mode).catch(() => {});
  };

  // Motivation popup state
  const [motivationVisible, setMotivationVisible] = useState(false);
  const [motivationText, setMotivationText] = useState('');

  const prevLoggedInRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Firebase auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserIsLoggedIn(!!user);
      setAuthReady(true);
    });

    return unsub;
  }, []);

  // Schedule daily water reminders when user is logged in
  useEffect(() => {
    if (!authReady || !userIsLoggedIn) return;
    scheduleWaterReminders().catch(() => {});
  }, [authReady, userIsLoggedIn]);

  const appReady = fontsLoaded && authReady;

  // Route guard
  useEffect(() => {
    if (!appReady) return;

    const seg0 = segments[0];

    const inOnboarding = seg0 === '(onboarding)';
    const inTabs = seg0 === '(tabs)';
    const inSetup = seg0 === 'setup';
    const isLogin = seg0 === 'login';

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

  // Web-only function key shortcuts:
  // - F5 => Meal Suggestions
  // - F13 => Recipe Library
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handler = (e: KeyboardEvent) => {
      if (!appReady || !userIsLoggedIn) return;

      if (e.key === 'F5') {
        e.preventDefault();
        router.push('/(tabs)/meal-suggestions');
      }

      if (e.key === 'F13') {
        e.preventDefault();
        router.push('/(tabs)/recipe-library');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [appReady, userIsLoggedIn, router]);

  // Motivation popup logic
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

  // Hide splash
  useEffect(() => {
    if (appReady) SplashScreen.hideAsync().catch(() => {});
  }, [appReady]);

  return appReady ? (
    <NutritionProvider>
      <WaterProvider>
        <ThemeContext.Provider
          value={{ mode: themeMode, colors, setMode: updateThemeMode }}
        >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <Slot />

          {motivationVisible && (
            <View style={styles.overlay} pointerEvents="auto">
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.title, { color: colors.text }]}>
                  Daily reminder
                </Text>
                <Text style={[styles.body, { color: colors.subText }]}>
                  {motivationText}
                </Text>

                <Pressable
                  onPress={() => setMotivationVisible(false)}
                  style={[
                    styles.button,
                    { backgroundColor: colors.primary },
                  ]}
                  hitSlop={10}
                >
                  <Text style={styles.buttonText}>Let’s go</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
        </ThemeContext.Provider>
      </WaterProvider>
    </NutritionProvider>
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
    padding: 18,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
    lineHeight: 20,
  },
  button: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
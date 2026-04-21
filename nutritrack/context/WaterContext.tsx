import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { saveWaterToFirestore, loadWaterFromFirestore } from '../lib/firestoreSync';

const WATER_STORAGE_KEY = '@nutritrack/water';
const WATER_GOAL_KEY = '@nutritrack/water_goal';
const DEFAULT_GOAL_ML = 2000;

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

type WaterContextType = {
  waterTodayMl: number;
  waterGoalMl: number;
  addWater: (ml: number) => void;
  setWaterGoalMl: (ml: number) => void;
  resetWaterToday: () => void;
  waterFromTrackerMl: number;
  setWaterFromTrackerMl: (ml: number) => void;
};

const WaterContext = createContext<WaterContextType | undefined>(undefined);

export function WaterProvider({ children }: { children: React.ReactNode }) {
  const [waterTodayMl, setWaterTodayMl] = useState(0);
  const [waterGoalMl, setWaterGoalMlState] = useState(DEFAULT_GOAL_ML);
  const [waterFromTrackerMl, setWaterFromTrackerMl] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dateKey = todayKey();

  // Load from AsyncStorage on mount, then try Firestore if not found locally
  useEffect(() => {
    (async () => {
      try {
        const [stored, goalStr] = await Promise.all([
          AsyncStorage.getItem(`${WATER_STORAGE_KEY}_${dateKey}`),
          AsyncStorage.getItem(WATER_GOAL_KEY),
        ]);

        if (stored != null) {
          setWaterTodayMl(parseInt(stored, 10) || 0);
          if (goalStr != null) setWaterGoalMlState(parseInt(goalStr, 10) || DEFAULT_GOAL_ML);
          setHydrated(true);
          return;
        }

        // Nothing local — try Firestore
        const uid = auth.currentUser?.uid;
        if (uid) {
          const cloud = await loadWaterFromFirestore(uid, dateKey);
          if (cloud) {
            setWaterTodayMl(cloud.waterMl);
            setWaterGoalMlState(cloud.goalMl);
            await AsyncStorage.setItem(`${WATER_STORAGE_KEY}_${dateKey}`, String(cloud.waterMl));
            await AsyncStorage.setItem(WATER_GOAL_KEY, String(cloud.goalMl));
          } else if (goalStr != null) {
            setWaterGoalMlState(parseInt(goalStr, 10) || DEFAULT_GOAL_ML);
          }
        } else if (goalStr != null) {
          setWaterGoalMlState(parseInt(goalStr, 10) || DEFAULT_GOAL_ML);
        }
      } catch (_) {}
      setHydrated(true);
    })();
  }, [dateKey]);

  // On login: refresh today's water from Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const cloud = await loadWaterFromFirestore(user.uid, dateKey);
        if (cloud) {
          setWaterTodayMl(cloud.waterMl);
          setWaterGoalMlState(cloud.goalMl);
          await AsyncStorage.setItem(`${WATER_STORAGE_KEY}_${dateKey}`, String(cloud.waterMl));
          await AsyncStorage.setItem(WATER_GOAL_KEY, String(cloud.goalMl));
          setHydrated(true);
        }
      } catch (_) {}
    });
    return unsub;
  }, [dateKey]);

  // Persist water to AsyncStorage immediately; debounce Firestore write
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(`${WATER_STORAGE_KEY}_${dateKey}`, String(waterTodayMl)).catch(() => {});

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await saveWaterToFirestore(uid, dateKey, waterTodayMl, waterGoalMl).catch(() => {});
      }
    }, 1500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [hydrated, dateKey, waterTodayMl, waterGoalMl]);

  const setWaterGoalMl = useCallback((ml: number) => {
    setWaterGoalMlState(ml);
    AsyncStorage.setItem(WATER_GOAL_KEY, String(ml)).catch(() => {});
  }, []);

  const addWater = useCallback((ml: number) => {
    setWaterTodayMl((prev) => Math.max(0, prev + ml));
  }, []);

  const resetWaterToday = useCallback(() => {
    setWaterTodayMl(0);
  }, []);

  const value: WaterContextType = {
    waterTodayMl,
    waterGoalMl,
    addWater,
    setWaterGoalMl,
    resetWaterToday,
    waterFromTrackerMl,
    setWaterFromTrackerMl,
  };

  return <WaterContext.Provider value={value}>{children}</WaterContext.Provider>;
}

export function useWater() {
  const ctx = useContext(WaterContext);
  if (!ctx) throw new Error('useWater must be used inside WaterProvider');
  return ctx;
}

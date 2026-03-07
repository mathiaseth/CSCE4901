import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  /** Optional: from Apple Health / Google Fit etc. */
  waterFromTrackerMl: number;
  setWaterFromTrackerMl: (ml: number) => void;
};

const WaterContext = createContext<WaterContextType | undefined>(undefined);

export function WaterProvider({ children }: { children: React.ReactNode }) {
  const [waterTodayMl, setWaterTodayMl] = useState(0);
  const [waterGoalMl, setWaterGoalMlState] = useState(DEFAULT_GOAL_ML);
  const [waterFromTrackerMl, setWaterFromTrackerMl] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const dateKey = todayKey();

  // Load persisted water for today and goal
  useEffect(() => {
    (async () => {
      try {
        const [stored, goalStr] = await Promise.all([
          AsyncStorage.getItem(`${WATER_STORAGE_KEY}_${dateKey}`),
          AsyncStorage.getItem(WATER_GOAL_KEY),
        ]);
        if (stored != null) setWaterTodayMl(parseInt(stored, 10) || 0);
        if (goalStr != null) setWaterGoalMlState(parseInt(goalStr, 10) || DEFAULT_GOAL_ML);
      } catch (_) {}
      setHydrated(true);
    })();
  }, [dateKey]);

  // Persist water for today when it changes
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(`${WATER_STORAGE_KEY}_${dateKey}`, String(waterTodayMl)).catch(() => {});
  }, [hydrated, dateKey, waterTodayMl]);

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

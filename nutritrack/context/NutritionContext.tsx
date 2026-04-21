import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  saveMealsToFirestore,
  loadMealsFromFirestore,
  saveMealsLocally,
  loadMealsLocally,
} from '../lib/firestoreSync';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MealKey = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export type LoggedFood = {
  logId: string;
  name: string;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  servingSize: number;
  numServings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  groupId?: string;
  groupName?: string;
};

type NutritionContextType = {
  meals: Record<MealKey, LoggedFood[]>;
  addFood: (meal: MealKey, food: LoggedFood) => void;
  removeFood: (meal: MealKey, logId: string) => void;
  updateFood: (meal: MealKey, logId: string, updates: Partial<LoggedFood>) => void;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  loggedMealsCount: number;
};

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_MEALS: Record<MealKey, LoggedFood[]> = {
  Breakfast: [],
  Lunch:     [],
  Dinner:    [],
  Snacks:    [],
};

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function mergeMeals(base: Record<MealKey, LoggedFood[]>, override: Record<string, any[]>) {
  return {
    Breakfast: override.Breakfast ?? base.Breakfast,
    Lunch:     override.Lunch     ?? base.Lunch,
    Dinner:    override.Dinner    ?? base.Dinner,
    Snacks:    override.Snacks    ?? base.Snacks,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [meals, setMeals] = useState<Record<MealKey, LoggedFood[]>>(EMPTY_MEALS);
  const [hydrated, setHydrated] = useState(false);
  const dateKey = todayKey();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load today's meals on mount: AsyncStorage first, then Firestore
  useEffect(() => {
    (async () => {
      try {
        const local = await loadMealsLocally(dateKey);
        if (local) {
          setMeals(mergeMeals(EMPTY_MEALS, local));
          setHydrated(true);
          return;
        }
        // Nothing local — try Firestore if already logged in
        const uid = auth.currentUser?.uid;
        if (uid) {
          const cloud = await loadMealsFromFirestore(uid, dateKey);
          if (cloud) {
            setMeals(mergeMeals(EMPTY_MEALS, cloud));
            await saveMealsLocally(dateKey, cloud);
          }
        }
      } catch (e) {
        console.warn('NutritionContext: load error', e);
      }
      setHydrated(true);
    })();
  }, [dateKey]);

  // On login: refresh today's log from Firestore (handles switching accounts / new device)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const cloud = await loadMealsFromFirestore(user.uid, dateKey);
        if (cloud) {
          setMeals(mergeMeals(EMPTY_MEALS, cloud));
          await saveMealsLocally(dateKey, cloud);
          setHydrated(true);
        }
      } catch (e) {
        console.warn('NutritionContext: cloud load error', e);
      }
    });
    return unsub;
  }, [dateKey]);

  // Persist on every change: immediately to AsyncStorage, debounced to Firestore
  useEffect(() => {
    if (!hydrated) return;

    saveMealsLocally(dateKey, meals).catch(() => {});

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await saveMealsToFirestore(uid, dateKey, meals).catch(() => {});
      }
    }, 1500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [meals, hydrated, dateKey]);

  function addFood(meal: MealKey, food: LoggedFood) {
    setMeals((prev) => ({ ...prev, [meal]: [...prev[meal], food] }));
  }

  function removeFood(meal: MealKey, logId: string) {
    setMeals((prev) => ({
      ...prev,
      [meal]: prev[meal].filter((f) => f.logId !== logId),
    }));
  }

  function updateFood(meal: MealKey, logId: string, updates: Partial<LoggedFood>) {
    setMeals((prev) => ({
      ...prev,
      [meal]: prev[meal].map((f) => (f.logId === logId ? { ...f, ...updates } : f)),
    }));
  }

  const allFoods = useMemo(
    () => (Object.values(meals) as LoggedFood[][]).flat(),
    [meals]
  );

  const totalCalories = useMemo(() => allFoods.reduce((s, f) => s + f.calories, 0), [allFoods]);
  const totalProtein  = useMemo(() => allFoods.reduce((s, f) => s + f.protein,  0), [allFoods]);
  const totalCarbs    = useMemo(() => allFoods.reduce((s, f) => s + f.carbs,    0), [allFoods]);
  const totalFat      = useMemo(() => allFoods.reduce((s, f) => s + f.fat,      0), [allFoods]);

  const loggedMealsCount = useMemo(
    () => (Object.values(meals) as LoggedFood[][]).filter((m) => m.length > 0).length,
    [meals]
  );

  return (
    <NutritionContext.Provider
      value={{ meals, addFood, removeFood, updateFood, totalCalories, totalProtein, totalCarbs, totalFat, loggedMealsCount }}
    >
      {children}
    </NutritionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNutrition() {
  const ctx = useContext(NutritionContext);
  if (!ctx) throw new Error('useNutrition must be used inside NutritionProvider');
  return ctx;
}

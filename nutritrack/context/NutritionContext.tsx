import React, { createContext, useContext, useState, useMemo } from 'react';

// ─── Shared types ─────────────────────────────────────────────────────────────

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
  /** Groups multiple logged foods under a custom meal */
  groupId?: string;
  /** Display name for the group (custom meal name) */
  groupName?: string;
};

// ─── Context type ─────────────────────────────────────────────────────────────

type NutritionContextType = {
  meals: Record<MealKey, LoggedFood[]>;
  addFood: (meal: MealKey, food: LoggedFood) => void;
  removeFood: (meal: MealKey, logId: string) => void;
  updateFood: (meal: MealKey, logId: string, updates: Partial<LoggedFood>) => void;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  /** Number of meal sections (Breakfast/Lunch/Dinner/Snacks) with ≥1 food */
  loggedMealsCount: number;
};

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

const EMPTY_MEALS: Record<MealKey, LoggedFood[]> = {
  Breakfast: [],
  Lunch:     [],
  Dinner:    [],
  Snacks:    [],
};

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [meals, setMeals] = useState<Record<MealKey, LoggedFood[]>>(EMPTY_MEALS);

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

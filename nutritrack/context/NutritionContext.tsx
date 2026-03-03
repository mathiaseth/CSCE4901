import React, { createContext, useContext, useState } from 'react';

type NutritionContextType = {
  consumedCalories: number;
  addCalories: (amount: number) => void;
  resetCalories: () => void;
};

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [consumedCalories, setConsumedCalories] = useState(0);

  function addCalories(amount: number) {
    setConsumedCalories((prev) => prev + amount);
  }

  function resetCalories() {
    setConsumedCalories(0);
  }

  return (
    <NutritionContext.Provider value={{ consumedCalories, addCalories, resetCalories }}>
      {children}
    </NutritionContext.Provider>
  );
}

export function useNutrition() {
  const context = useContext(NutritionContext);
  if (!context) throw new Error('useNutrition must be used inside NutritionProvider');
  return context;
}
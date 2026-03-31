export type DietaryTag =
  | 'vegetarian'
  | 'vegan'
  | 'dairy-free'
  | 'gluten-free'
  | 'halal'
  | 'nut-free'
  | 'keto'
  | 'paleo';

export type MacroTotals = {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
};

export type FoodItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags?: DietaryTag[];
};

export type MealKey = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export type MacroPreference = 'high-protein' | 'balanced' | 'lower-carb';

export type Recipe = {
  id: string;
  name: string;
  description: string;
  mealTypes: MealKey[];
  dietaryTags?: DietaryTag[];
  items: FoodItem[];
};


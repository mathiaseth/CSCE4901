import {
  DietaryTag,
  FoodItem,
  MacroTotals,
  Recipe,
  MealKey,
} from '../types/nutrition';

export const DIETARY_TAGS_META: Array<{ tag: DietaryTag; label: string; emoji: string }> = [
  { tag: 'halal',       label: 'Halal',        emoji: '☪️'  },
  { tag: 'vegan',       label: 'Vegan',        emoji: '🌱'  },
  { tag: 'vegetarian',  label: 'Vegetarian',   emoji: '🥗'  },
  { tag: 'dairy-free',  label: 'Dairy-free',   emoji: '🥛'  },
  { tag: 'gluten-free', label: 'Gluten-free',  emoji: '🌾'  },
  { tag: 'nut-free',    label: 'Nut-free',     emoji: '🚫'  },
  { tag: 'keto',        label: 'Keto',         emoji: '🥩'  },
  { tag: 'paleo',       label: 'Paleo',        emoji: '🦴'  },
];

export const RECIPES: Recipe[] = [
  // ── BREAKFAST ──────────────────────────────────────────────────────────────

  {
    id: 'r-greek-bowl',
    name: 'Greek Yogurt Protein Bowl',
    description: 'Creamy Greek yogurt loaded with berries and granola. High protein to kick-start your morning.',
    mealTypes: ['Breakfast'],
    dietaryTags: ['vegetarian', 'gluten-free', 'nut-free', 'halal'],
    items: [
      { id: 'f-greek-yogurt', name: 'Greek yogurt (1 cup)', calories: 150, protein: 20, carbs: 8, fat: 3, tags: ['vegetarian', 'gluten-free'] },
      { id: 'f-gf-granola',   name: 'Granola (¼ cup)',      calories: 110, protein: 3,  carbs: 18, fat: 4, tags: ['vegetarian', 'gluten-free'] },
      { id: 'f-berries',      name: 'Mixed berries (½ cup)',calories: 50,  protein: 1,  carbs: 12, fat: 0, tags: ['vegetarian', 'gluten-free'] },
    ],
  },

  {
    id: 'r-overnight-oats',
    name: 'Overnight Oats',
    description: 'Prep-ahead oats with chia seeds and banana for sustained energy all morning.',
    mealTypes: ['Breakfast', 'Snacks'],
    dietaryTags: ['vegetarian', 'gluten-free', 'dairy-free', 'vegan', 'halal'],
    items: [
      { id: 'f-gf-oats',      name: 'Oats (½ cup)',         calories: 160, protein: 6, carbs: 28, fat: 3,  tags: ['vegetarian', 'gluten-free'] },
      { id: 'f-chia',         name: 'Chia seeds (1 tbsp)',  calories: 60,  protein: 3, carbs: 5,  fat: 4,  tags: ['vegan', 'gluten-free'] },
      { id: 'f-almond-milk',  name: 'Almond milk (½ cup)',  calories: 30,  protein: 1, carbs: 2,  fat: 2,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-banana-slice', name: 'Banana slices',        calories: 60,  protein: 1, carbs: 15, fat: 0,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
    ],
  },

  {
    id: 'r-avocado-egg-toast',
    name: 'Egg & Avocado Toast',
    description: 'Two eggs over easy on GF toast with smashed avocado. Protein meets healthy fats.',
    mealTypes: ['Breakfast'],
    dietaryTags: ['vegetarian', 'gluten-free', 'dairy-free', 'nut-free', 'halal'],
    items: [
      { id: 'f-eggs',    name: 'Eggs (2 large)',           calories: 140, protein: 12, carbs: 1,  fat: 10, tags: ['vegetarian', 'gluten-free'] },
      { id: 'f-gf-bread',name: 'Gluten-free bread (2 sl)',calories: 160, protein: 8,  carbs: 28, fat: 2,  tags: ['vegetarian', 'gluten-free'] },
      { id: 'f-avocado', name: 'Avocado (½)',              calories: 160, protein: 3,  carbs: 8,  fat: 14, tags: ['vegetarian', 'gluten-free', 'dairy-free'] },
    ],
  },

  {
    id: 'r-egg-scramble',
    name: 'Turkey & Egg Scramble',
    description: 'Lean ground turkey scrambled with eggs and spinach. Low-carb, high-protein start to the day.',
    mealTypes: ['Breakfast'],
    dietaryTags: ['gluten-free', 'dairy-free', 'nut-free', 'halal', 'keto', 'paleo'],
    items: [
      { id: 'f-ground-turkey-b', name: 'Ground turkey (3 oz)', calories: 130, protein: 17, carbs: 0, fat: 6,  tags: ['gluten-free', 'dairy-free'] },
      { id: 'f-eggs-2',          name: 'Eggs (2 large)',        calories: 140, protein: 12, carbs: 1, fat: 10, tags: ['gluten-free'] },
      { id: 'f-spinach',         name: 'Spinach (1 cup)',        calories: 20,  protein: 2,  carbs: 3, fat: 0,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-olive-oil-b',     name: 'Olive oil (1 tsp)',      calories: 40,  protein: 0,  carbs: 0, fat: 5,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
    ],
  },

  {
    id: 'r-cottage-bowl',
    name: 'Cottage Cheese Power Bowl',
    description: 'Cottage cheese with sliced peaches and a drizzle of honey. Simple, high-protein breakfast.',
    mealTypes: ['Breakfast', 'Snacks'],
    dietaryTags: ['vegetarian', 'gluten-free', 'nut-free', 'halal'],
    items: [
      { id: 'f-cottage',  name: 'Cottage cheese (1 cup)', calories: 220, protein: 28, carbs: 8,  fat: 5, tags: ['vegetarian', 'gluten-free'] },
      { id: 'f-peaches',  name: 'Sliced peaches (½ cup)', calories: 60,  protein: 1,  carbs: 15, fat: 0, tags: ['vegan', 'gluten-free', 'dairy-free'] },
    ],
  },

  // ── LUNCH / DINNER ─────────────────────────────────────────────────────────

  {
    id: 'r-chicken-rice-bowl',
    name: 'Chicken Rice Bowl',
    description: 'Grilled chicken breast over fluffy rice with steamed veggies. A complete balanced meal.',
    mealTypes: ['Lunch', 'Dinner'],
    dietaryTags: ['gluten-free', 'dairy-free', 'nut-free', 'halal'],
    items: [
      { id: 'f-chicken',    name: 'Chicken breast (4 oz)',   calories: 180, protein: 35, carbs: 0,  fat: 3,  tags: ['gluten-free', 'dairy-free'] },
      { id: 'f-rice',       name: 'Rice (1 cup cooked)',     calories: 205, protein: 4,  carbs: 45, fat: 0,  tags: ['gluten-free', 'dairy-free', 'vegan'] },
      { id: 'f-veg',        name: 'Mixed vegetables (1 cup)',calories: 70,  protein: 3,  carbs: 14, fat: 1,  tags: ['gluten-free', 'dairy-free', 'vegan'] },
      { id: 'f-olive-oil',  name: 'Olive oil (1 tbsp)',      calories: 119, protein: 0,  carbs: 0,  fat: 13, tags: ['gluten-free', 'dairy-free', 'vegan'] },
    ],
  },

  {
    id: 'r-salmon-quinoa',
    name: 'Salmon Quinoa Plate',
    description: 'Omega-3 rich salmon fillet with fluffy quinoa and roasted veggies. Great for recovery days.',
    mealTypes: ['Dinner'],
    dietaryTags: ['gluten-free', 'dairy-free', 'nut-free', 'halal', 'paleo'],
    items: [
      { id: 'f-salmon',         name: 'Salmon (4 oz)',          calories: 240, protein: 25, carbs: 0,  fat: 14, tags: ['gluten-free', 'dairy-free'] },
      { id: 'f-quinoa',         name: 'Quinoa (1 cup cooked)',  calories: 222, protein: 8,  carbs: 39, fat: 3,  tags: ['gluten-free', 'dairy-free', 'vegan'] },
      { id: 'f-roasted-veggies',name: 'Roasted veggies (1 cup)',calories: 80,  protein: 3,  carbs: 14, fat: 2,  tags: ['gluten-free', 'dairy-free', 'vegan'] },
    ],
  },

  {
    id: 'r-turkey-chili',
    name: 'Turkey Chili',
    description: 'Hearty turkey chili with kidney beans and tomatoes. Big flavor, slow-digesting carbs.',
    mealTypes: ['Lunch', 'Dinner'],
    dietaryTags: ['gluten-free', 'dairy-free', 'nut-free', 'halal'],
    items: [
      { id: 'f-turkey',       name: 'Ground turkey (4 oz)',    calories: 170, protein: 22, carbs: 0,  fat: 8, tags: ['gluten-free', 'dairy-free'] },
      { id: 'f-kidney-beans', name: 'Kidney beans (½ cup)',    calories: 130, protein: 9,  carbs: 23, fat: 0, tags: ['gluten-free', 'dairy-free', 'vegan'] },
      { id: 'f-tomatoes',     name: 'Crushed tomatoes (½ cup)',calories: 60,  protein: 3,  carbs: 10, fat: 1, tags: ['gluten-free', 'dairy-free', 'vegan'] },
      { id: 'f-avocado-top',  name: 'Avocado (¼)',             calories: 80,  protein: 1,  carbs: 4,  fat: 7, tags: ['gluten-free', 'dairy-free', 'vegan'] },
    ],
  },

  {
    id: 'r-tofu-stir-fry',
    name: 'Tofu Stir-fry',
    description: 'Crispy tofu tossed with vibrant vegetables in a savory tamari sauce over rice.',
    mealTypes: ['Lunch', 'Dinner'],
    dietaryTags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'halal'],
    items: [
      { id: 'f-tofu',   name: 'Tofu (6 oz)',                   calories: 200, protein: 20, carbs: 6,  fat: 12, tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-tamari', name: 'Tamari sauce (1 tbsp)',          calories: 15,  protein: 1,  carbs: 1,  fat: 0,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-veggies',name: 'Stir-fry vegetables (2 cups)',  calories: 120, protein: 5,  carbs: 20, fat: 2,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-rice-sf',name: 'Rice (1 cup cooked)',           calories: 205, protein: 4,  carbs: 45, fat: 0,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
    ],
  },

  {
    id: 'r-chickpea-quinoa',
    name: 'Chickpea Quinoa Salad',
    description: 'Crunchy chickpeas over quinoa with cucumber and tomato. Packed with plant protein.',
    mealTypes: ['Lunch', 'Dinner'],
    dietaryTags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free', 'halal'],
    items: [
      { id: 'f-quinoa-cq',   name: 'Quinoa (1 cup cooked)',       calories: 222, protein: 8,  carbs: 39, fat: 3,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-chickpeas',   name: 'Chickpeas (1 cup)',           calories: 250, protein: 14, carbs: 45, fat: 4,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-cucumber',    name: 'Cucumber & tomatoes (1 cup)', calories: 60,  protein: 2,  carbs: 12, fat: 0,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-olive-cq',   name: 'Olive oil (1 tbsp)',           calories: 119, protein: 0,  carbs: 0,  fat: 13, tags: ['vegan', 'gluten-free', 'dairy-free'] },
    ],
  },

  {
    id: 'r-lentil-soup',
    name: 'Hearty Lentil Soup',
    description: 'Warm lentil soup with aromatic vegetables. High fiber, steady energy, fully vegan.',
    mealTypes: ['Dinner', 'Lunch'],
    dietaryTags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free', 'halal'],
    items: [
      { id: 'f-lentils',    name: 'Lentils (1 cup)',    calories: 300, protein: 22, carbs: 50, fat: 1,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-soup-veg',   name: 'Soup vegetables',    calories: 90,  protein: 4,  carbs: 16, fat: 1,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-olive-ls',   name: 'Olive oil (1 tbsp)', calories: 119, protein: 0,  carbs: 0,  fat: 13, tags: ['vegan', 'gluten-free', 'dairy-free'] },
    ],
  },

  {
    id: 'r-beef-broccoli',
    name: 'Beef & Broccoli Bowl',
    description: 'Lean ground beef with broccoli over cauliflower rice. High protein, low carb, keto-friendly.',
    mealTypes: ['Lunch', 'Dinner'],
    dietaryTags: ['gluten-free', 'dairy-free', 'nut-free', 'keto', 'paleo', 'halal'],
    items: [
      { id: 'f-beef',         name: 'Lean ground beef (4 oz)',    calories: 215, protein: 24, carbs: 0,  fat: 13, tags: ['gluten-free', 'dairy-free'] },
      { id: 'f-broccoli',     name: 'Broccoli (2 cups)',          calories: 60,  protein: 4,  carbs: 12, fat: 0,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-cauli-rice',   name: 'Cauliflower rice (1 cup)',   calories: 25,  protein: 2,  carbs: 5,  fat: 0,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-coconut-aminos', name: 'Coconut aminos (1 tbsp)', calories: 15,  protein: 0,  carbs: 3,  fat: 0,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
    ],
  },

  {
    id: 'r-tuna-bowl',
    name: 'Tuna Power Bowl',
    description: 'Canned tuna over brown rice with avocado and cucumber. Easy, cheap, high protein.',
    mealTypes: ['Lunch', 'Dinner'],
    dietaryTags: ['gluten-free', 'dairy-free', 'nut-free', 'halal'],
    items: [
      { id: 'f-tuna',       name: 'Canned tuna (5 oz)',      calories: 150, protein: 33, carbs: 0,  fat: 1, tags: ['gluten-free', 'dairy-free'] },
      { id: 'f-brown-rice', name: 'Brown rice (1 cup cooked)',calories: 215, protein: 5,  carbs: 45, fat: 2, tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-avo-tuna',   name: 'Avocado (¼)',             calories: 80,  protein: 1,  carbs: 4,  fat: 7, tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-cucum',      name: 'Cucumber slices',          calories: 15,  protein: 1,  carbs: 3,  fat: 0, tags: ['vegan', 'gluten-free', 'dairy-free'] },
    ],
  },

  {
    id: 'r-shrimp-zoodles',
    name: 'Shrimp Zoodle Bowl',
    description: 'Garlic shrimp over zucchini noodles with cherry tomatoes. Light, low-carb, and satisfying.',
    mealTypes: ['Lunch', 'Dinner'],
    dietaryTags: ['gluten-free', 'dairy-free', 'nut-free', 'keto', 'paleo', 'halal'],
    items: [
      { id: 'f-shrimp',      name: 'Shrimp (5 oz)',          calories: 140, protein: 27, carbs: 0,  fat: 2,  tags: ['gluten-free', 'dairy-free'] },
      { id: 'f-zoodles',     name: 'Zucchini noodles (2 cups)',calories: 40, protein: 3,  carbs: 8,  fat: 0,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-cherry-tom',  name: 'Cherry tomatoes (½ cup)', calories: 25, protein: 1,  carbs: 5,  fat: 0,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-garlic-oil',  name: 'Olive oil & garlic',      calories: 60, protein: 0,  carbs: 1,  fat: 7,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
    ],
  },

  // ── SNACKS ─────────────────────────────────────────────────────────────────

  {
    id: 'r-pb-banana',
    name: 'PB Banana Protein Smoothie',
    description: 'Creamy peanut butter and banana blended with plant protein. Sweet, filling, portable.',
    mealTypes: ['Snacks', 'Breakfast'],
    dietaryTags: ['vegan', 'gluten-free', 'dairy-free', 'halal'],
    items: [
      { id: 'f-banana-pb',    name: 'Banana',               calories: 105, protein: 1,  carbs: 27, fat: 0, tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-plant-prot',   name: 'Plant protein powder', calories: 120, protein: 25, carbs: 3,  fat: 1, tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-peanut-butter',name: 'Peanut butter (1 tbsp)',calories: 95,  protein: 4,  carbs: 3,  fat: 8, tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-almond-pb',    name: 'Almond milk (1 cup)',  calories: 60,  protein: 2,  carbs: 4,  fat: 4, tags: ['vegan', 'gluten-free', 'dairy-free'] },
    ],
  },

  {
    id: 'r-hardboiled-eggs',
    name: 'Hard-Boiled Eggs & Veggies',
    description: 'Simple protein snack — three hard-boiled eggs with sliced bell pepper and cucumber.',
    mealTypes: ['Snacks'],
    dietaryTags: ['vegetarian', 'gluten-free', 'dairy-free', 'nut-free', 'keto', 'paleo', 'halal'],
    items: [
      { id: 'f-hb-eggs',  name: 'Hard-boiled eggs (3)',   calories: 210, protein: 18, carbs: 2, fat: 15, tags: ['vegetarian', 'gluten-free'] },
      { id: 'f-bell-pep', name: 'Bell pepper (1 medium)', calories: 30,  protein: 1,  carbs: 7, fat: 0,  tags: ['vegan', 'gluten-free', 'dairy-free'] },
    ],
  },

  {
    id: 'r-rice-cakes',
    name: 'Rice Cakes with Almond Butter',
    description: 'Light rice cakes topped with almond butter and banana slices. Quick energy before a workout.',
    mealTypes: ['Snacks'],
    dietaryTags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'halal'],
    items: [
      { id: 'f-rice-cakes',  name: 'Rice cakes (2)',         calories: 70,  protein: 2, carbs: 14, fat: 0, tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-almond-but',  name: 'Almond butter (1 tbsp)', calories: 98,  protein: 3, carbs: 3,  fat: 9, tags: ['vegan', 'gluten-free', 'dairy-free'] },
      { id: 'f-banana-rc',   name: 'Banana (½)',              calories: 52,  protein: 1, carbs: 13, fat: 0, tags: ['vegan', 'gluten-free', 'dairy-free'] },
    ],
  },
];

export function calculateTotals(items: FoodItem[]): MacroTotals {
  return items.reduce(
    (totals, item) => {
      totals.calories += item.calories;
      totals.protein  += item.protein;
      totals.carbs    += item.carbs;
      totals.fat      += item.fat;
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 } satisfies MacroTotals
  );
}

export function getRecipeTotals(recipe: Recipe): MacroTotals {
  return calculateTotals(recipe.items);
}

export function getRecipesForMealType(recipes: Recipe[], mealType: MealKey) {
  return recipes.filter((r) => r.mealTypes.includes(mealType));
}

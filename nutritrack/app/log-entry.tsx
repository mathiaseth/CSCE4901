// app/log-entry.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNutrition, MealKey, LoggedFood } from '../context/NutritionContext';
import { useAppTheme } from '../lib/theme';
import { useLocalSearchParams } from 'expo-router';
import { useWater } from '../context/WaterContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type FoodItem = {
  id: string;
  name: string;
  /** per-100g values from USDA */
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
};

type CustomIngredient = {
  foodId: string;
  name: string;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  servingSize: number;
  numServings: number;
};

type CustomMeal = {
  id: string;
  name: string;
  photoUri?: string;
  ingredients: CustomIngredient[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MEALS: MealKey[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const MEAL_ICONS: Record<MealKey, keyof typeof Ionicons.glyphMap> = {
  Breakfast: 'sunny-outline',
  Lunch:     'partly-sunny-outline',
  Dinner:    'moon-outline',
  Snacks:    'cafe-outline',
};

// ─── USDA API ─────────────────────────────────────────────────────────────────

const USDA_API_KEY = 'hGKU83ctIV89SRSFwUYDwcWEMWDq6nyWweIeEzKW';
const USDA_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

function getNutrient(nutrients: any[], name: string): number {
  const match = nutrients.find((n) => n.nutrientName === name);
  return match ? parseFloat((match.value ?? 0).toFixed(1)) : 0;
}

function mapUSDAFood(food: any): FoodItem {
  return {
    id: String(food.fdcId),
    name: food.description,
    caloriesPer100: getNutrient(food.foodNutrients, 'Energy'),
    proteinPer100:  getNutrient(food.foodNutrients, 'Protein'),
    carbsPer100:    getNutrient(food.foodNutrients, 'Carbohydrate, by difference'),
    fatPer100:      getNutrient(food.foodNutrients, 'Total lipid (fat)'),
  };
}

function useFoodSearch(query: string, delayMs = 450) {
  const [results, setResults]   = useState<FoodItem[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const abortRef                = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      setError(null);
      try {
        const url = `${USDA_SEARCH_URL}?query=${encodeURIComponent(query)}&pageSize=25&api_key=${USDA_API_KEY}`;
        const res = await fetch(url, { signal: abortRef.current.signal });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setResults((data.foods ?? []).map(mapUSDAFood));
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError('Could not load foods. Check your connection.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, delayMs);
    return () => clearTimeout(timer);
  }, [query]);

  return { results, isLoading, error };
}

// ─── Scaling helpers ──────────────────────────────────────────────────────────

function scale(per100: number, servingSize: number, numServings: number) {
  return Math.round((per100 * servingSize * numServings) / 100);
}

function ingredientTotals(ing: CustomIngredient) {
  return {
    calories: scale(ing.caloriesPer100, ing.servingSize, ing.numServings),
    protein:  scale(ing.proteinPer100,  ing.servingSize, ing.numServings),
    carbs:    scale(ing.carbsPer100,    ing.servingSize, ing.numServings),
    fat:      scale(ing.fatPer100,      ing.servingSize, ing.numServings),
  };
}

function mealTotals(meal: CustomMeal) {
  return meal.ingredients.reduce(
    (acc, ing) => {
      const t = ingredientTotals(ing);
      return {
        calories: acc.calories + t.calories,
        protein:  acc.protein  + t.protein,
        carbs:    acc.carbs    + t.carbs,
        fat:      acc.fat      + t.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

// ─── Date helper ─────────────────────────────────────────────────────────────

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// ─── Theme-aware styles factory ───────────────────────────────────────────────

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },

    // ── Header ───────────────────────────────────────────────────────────────
    header: {
      backgroundColor: colors.card,
      paddingTop: 56,
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    title: { fontSize: 28, fontWeight: '900', color: colors.text },

    myMealsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.primary + '22',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },

    myMealsBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },

    date: { fontSize: 13, fontWeight: '700', color: colors.subText, marginBottom: 12, marginTop: 2 },

    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderWidth: 1,
      borderColor: colors.border,
    },

    searchIcon: { marginRight: 8 },

    searchPlaceholder: { color: '#94A3B8', fontSize: 15 },

    searchBarActive: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },

    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      paddingVertical: 2,
    },

    // ── Search panel ─────────────────────────────────────────────────────────
    searchPanel: { flex: 1, backgroundColor: colors.background },

    searchHintWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 32,
    },

    searchHint: {
      color: '#94A3B8',
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },

    resultsList: { paddingVertical: 8 },

    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 13,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    resultRowPressed:  { opacity: 0.7 },

    resultRowSelected: { backgroundColor: colors.primary + '18' },

    resultLeft: { flex: 1, paddingRight: 10 },

    resultName: { fontWeight: '700', fontSize: 14, color: colors.text, marginBottom: 2 },

    resultMacros: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },

    resultCal: { fontWeight: '900', color: colors.primary, fontSize: 14 },

    // ── Configure panel ──────────────────────────────────────────────────────
    configPanel: {
      backgroundColor: colors.card,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    configFoodName: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 12,
    },

    servingRow: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      overflow: 'hidden',
    },

    servingField: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },

    servingDivider: {
      width: 1,
      backgroundColor: colors.border,
    },

    servingLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#94A3B8',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },

    servingInput: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      padding: 0,
    },

    macroRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },

    mealDropdownLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: '#94A3B8',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8,
    },

    mealChipScroll: { marginBottom: 14 },

    mealChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginRight: 8,
    },

    mealChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    mealChipText: {
      fontWeight: '700',
      fontSize: 13,
      color: colors.subText,
    },

    mealChipTextSelected: { color: '#FFFFFF' },

    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 13,
    },

    addBtnPressed: { opacity: 0.85 },

    addBtnText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 15,
    },

    // ── Meal sections ────────────────────────────────────────────────────────
    scrollView: { flex: 1 },

    scroll: { padding: 16, paddingBottom: 40 },

    mealCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 14,
    },

    mealHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },

    mealTitleRow: { flexDirection: 'row', alignItems: 'center' },

    mealTitle: { fontSize: 17, fontWeight: '900', color: colors.text },

    mealCal: { fontWeight: '800', color: colors.primary, fontSize: 14 },

    emptyMeal: { color: '#CBD5E1', fontSize: 13, fontWeight: '600', paddingVertical: 4 },

    // ── Water log card (matches meal card format) ─────────────────────────
    waterLogInputRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    waterLogInput: {
      flex: 1,
      minWidth: 140,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      paddingHorizontal: 14,
      color: colors.text,
      fontWeight: '800',
      fontSize: 15,
    },
    waterLogAddBtn: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    waterLogAddBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
    waterLogSubtractBtn: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    waterLogSubtractBtnText: { color: colors.text, fontWeight: '900', fontSize: 15 },
    waterLogResetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      justifyContent: 'center',
    },
    waterLogResetBtnText: { color: colors.subText, fontWeight: '700', fontSize: 13 },

    foodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 9,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    foodRowLeft: { flex: 1, paddingRight: 10 },

    foodName: { fontWeight: '700', color: colors.text, fontSize: 14, marginBottom: 2 },

    foodMacros: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },

    removeBtn: { padding: 4 },

    // ── Group header ─────────────────────────────────────────────────────────
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 7,
      paddingHorizontal: 2,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    groupHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },

    groupName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.primary,
    },

    groupToggle: {
      fontSize: 11,
      color: colors.subText,
      fontWeight: '600',
    },

    groupIndent: {
      paddingLeft: 14,
      borderLeftWidth: 2,
      borderLeftColor: colors.primary + '44',
      marginLeft: 8,
    },

    // ── Edit modal ───────────────────────────────────────────────────────────
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(15,23,42,0.55)',
      justifyContent: 'flex-end',
    },

    editSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },

    sheetHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 20,
    },

    editSheetLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: '#94A3B8',
      textTransform: 'uppercase',
      letterSpacing: 0.7,
      marginBottom: 4,
    },

    editSheetName: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 16,
    },

    // ── Custom meal modal ────────────────────────────────────────────────────
    cmModalOuter: {
      flex: 1,
      backgroundColor: 'rgba(15,23,42,0.55)',
      justifyContent: 'flex-end',
    },

    cmSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
    },

    cmSheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    cmSheetTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.text,
    },

    cmBody: {
      padding: 20,
    },

    cmSectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: '#94A3B8',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8,
    },

    cmNameInput: {
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },

    cmIngredientRow: {
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 8,
    },

    cmIngredientName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },

    cmIngredientServings: {
      flexDirection: 'row',
      gap: 10,
    },

    cmIngredientField: {
      flex: 1,
    },

    cmIngredientFieldLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: '#94A3B8',
      textTransform: 'uppercase',
      marginBottom: 3,
    },

    cmIngredientInput: {
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
    },

    cmRemoveIngBtn: {
      position: 'absolute',
      top: 10,
      right: 10,
      padding: 4,
    },

    cmIngSearchWrap: {
      marginBottom: 16,
    },

    cmIngSearchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 6,
    },

    cmIngSearchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      paddingVertical: 0,
    },

    cmIngResultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    cmIngResultName: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },

    cmIngResultCal: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.primary,
    },

    cmPhotoWrap: {
      marginBottom: 16,
    },

    cmPhotoPreview: {
      width: '100%',
      height: 160,
      borderRadius: 14,
      marginBottom: 10,
      backgroundColor: colors.border,
    },

    cmPhotoButtons: {
      flexDirection: 'row',
      gap: 10,
    },

    cmPhotoBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingVertical: 10,
    },

    cmPhotoBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.subText,
    },

    // ── My Meals list ────────────────────────────────────────────────────────
    myMealsView: {
      flex: 1,
      backgroundColor: colors.background,
    },

    myMealsScroll: {
      padding: 16,
      paddingBottom: 40,
    },

    myMealsEmptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      padding: 40,
    },

    myMealsEmptyText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.subText,
      textAlign: 'center',
    },

    customMealCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
      overflow: 'hidden',
    },

    customMealPhoto: {
      width: '100%',
      height: 120,
      backgroundColor: colors.border,
    },

    customMealPhotoPlaceholder: {
      width: '100%',
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },

    customMealCardBody: {
      padding: 14,
    },

    customMealName: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 4,
    },

    customMealMacros: {
      fontSize: 12,
      color: '#94A3B8',
      fontWeight: '600',
      marginBottom: 10,
    },

    customMealAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 9,
    },

    customMealAddBtnText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 13,
    },

    // ── Add-to-meal picker overlay ───────────────────────────────────────────
    addToMealSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },

    addToMealTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 4,
    },

    addToMealSub: {
      fontSize: 13,
      color: colors.subText,
      fontWeight: '600',
      marginBottom: 16,
    },

    newCustomMealBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 13,
      paddingHorizontal: 24,
      marginBottom: 16,
      alignSelf: 'stretch',
    },

    newCustomMealBtnText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 15,
    },

    pillBg: {
      backgroundColor: colors.background,
    },

    // ── Custom meal action row ────────────────────────────────────────────────
    customMealActionRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },

    customMealEditBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: colors.background,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.primary,
      paddingVertical: 7,
    },

    customMealDeleteBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: colors.background,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: '#EF4444',
      paddingVertical: 7,
    },

    customMealActionBtnText: {
      fontSize: 12,
      fontWeight: '800',
    },
  });
}

// ─── MacroPill sub-component ──────────────────────────────────────────────────

function MacroPill({
  label,
  value,
  unit = '',
  color,
  bgColor,
}: {
  label: string;
  value: number;
  unit?: string;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={[pillStyles.pill, { borderColor: color, backgroundColor: bgColor }]}>
      <Text style={[pillStyles.value, { color }]}>{value}{unit}</Text>
      <Text style={pillStyles.label}>{label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  value: { fontWeight: '900', fontSize: 15 },
  label: { fontSize: 11, color: '#94A3B8', fontWeight: '700', marginTop: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LogEntryScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { meals, addFood, removeFood, updateFood } = useNutrition();

  // ── View mode ──────────────────────────────────────────────────────────────
  type ViewMode = 'log' | 'myMeals';
  const [viewMode, setViewMode] = useState<ViewMode>('log');

  // ── Prefill support (from Meal Suggestions / Recipe Library) ─────────────
  const params = useLocalSearchParams<{
    meal?: string;
    foods?: string; // JSON-serialized array
  }>();
  const didPrefillRef = useRef(false);

  // ── Water log state + actions ─────────────────────────────────────────────
  const { addWater, resetWaterToday } = useWater();
  const [waterInputMl, setWaterInputMl] = useState('');

  useEffect(() => {
    if (didPrefillRef.current) return;

    const mealParam = typeof params.meal === 'string' ? params.meal : undefined;
    const foodsParam = typeof params.foods === 'string' ? params.foods : undefined;
    if (!mealParam || !foodsParam) return;

    const mealKey = MEALS.includes(mealParam as MealKey) ? (mealParam as MealKey) : null;
    if (!mealKey) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(foodsParam);
    } catch {
      return;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) return;

    type PrefillFood = {
      id?: string;
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };

    didPrefillRef.current = true;
    setViewMode('log');

    parsed.forEach((f, idx) => {
      const item = f as Partial<PrefillFood>;
      if (typeof item?.name !== 'string') return;

      const calories = Number(item.calories);
      const protein = Number(item.protein);
      const carbs = Number(item.carbs);
      const fat = Number(item.fat);
      if (![calories, protein, carbs, fat].every((n) => Number.isFinite(n))) return;

      const logId = `${mealKey}-prefill-${item.id ?? item.name}-${idx}-${Date.now()}`;
      const entry: LoggedFood = {
        logId,
        name: item.name,
        caloriesPer100: calories,
        proteinPer100: protein,
        carbsPer100: carbs,
        fatPer100: fat,
        servingSize: 100,
        numServings: 1,
        calories,
        protein,
        carbs,
        fat,
      };

      addFood(mealKey, entry);
    });
  }, [params, addFood]);

  // ── Search state ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // ── Edit-logged-food state ─────────────────────────────────────────────────
  const [editTarget, setEditTarget]           = useState<{ food: LoggedFood; meal: MealKey } | null>(null);
  const [editServingSize, setEditServingSize] = useState('');
  const [editNumServings, setEditNumServings] = useState('');

  const editSS = Math.max(0, parseFloat(editServingSize) || 0);
  const editNS = Math.max(0, parseFloat(editNumServings) || 0);
  const editScaledCal     = editTarget ? scale(editTarget.food.caloriesPer100, editSS, editNS) : 0;
  const editScaledProtein = editTarget ? scale(editTarget.food.proteinPer100,  editSS, editNS) : 0;
  const editScaledCarbs   = editTarget ? scale(editTarget.food.carbsPer100,    editSS, editNS) : 0;
  const editScaledFat     = editTarget ? scale(editTarget.food.fatPer100,      editSS, editNS) : 0;

  function openEdit(meal: MealKey, food: LoggedFood) {
    setEditTarget({ meal, food });
    setEditServingSize(String(food.servingSize));
    setEditNumServings(String(food.numServings));
  }

  function saveEdit() {
    if (!editTarget) return;
    const { meal, food } = editTarget;
    updateFood(meal, food.logId, {
      servingSize: editSS,
      numServings: editNS,
      calories:    editScaledCal,
      protein:     editScaledProtein,
      carbs:       editScaledCarbs,
      fat:         editScaledFat,
    });
    setEditTarget(null);
  }

  // ── Configure-panel state ──────────────────────────────────────────────────
  const [pendingFood, setPendingFood]    = useState<FoodItem | null>(null);
  const [servingSize, setServingSize]    = useState('100');
  const [numServings, setNumServings]    = useState('1');
  const [selectedMeal, setSelectedMeal] = useState<MealKey>('Breakfast');

  const { results, isLoading, error } = useFoodSearch(searchQuery);

  const ss = Math.max(0, parseFloat(servingSize)  || 0);
  const ns = Math.max(0, parseFloat(numServings)  || 0);

  const scaledCal     = pendingFood ? scale(pendingFood.caloriesPer100, ss, ns) : 0;
  const scaledProtein = pendingFood ? scale(pendingFood.proteinPer100,  ss, ns) : 0;
  const scaledCarbs   = pendingFood ? scale(pendingFood.carbsPer100,    ss, ns) : 0;
  const scaledFat     = pendingFood ? scale(pendingFood.fatPer100,      ss, ns) : 0;

  function openSearch() {
    setSearchActive(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  function closeSearch() {
    setSearchActive(false);
    setSearchQuery('');
    setPendingFood(null);
  }

  function onResultTap(food: FoodItem) {
    setPendingFood(food);
    setServingSize('100');
    setNumServings('1');
  }

  function confirmAdd() {
    if (!pendingFood) return;
    const logId = `${pendingFood.id}-${Date.now()}`;
    const entry: LoggedFood = {
      logId,
      name:           pendingFood.name,
      caloriesPer100: pendingFood.caloriesPer100,
      proteinPer100:  pendingFood.proteinPer100,
      carbsPer100:    pendingFood.carbsPer100,
      fatPer100:      pendingFood.fatPer100,
      servingSize:    ss,
      numServings:    ns,
      calories:       scaledCal,
      protein:        scaledProtein,
      carbs:          scaledCarbs,
      fat:            scaledFat,
    };
    addFood(selectedMeal, entry);
    setPendingFood(null);
    setSearchQuery('');
    setSearchActive(false);
  }

  function getMealCalories(meal: MealKey) {
    return meals[meal].reduce((sum, f) => sum + f.calories, 0);
  }

  // ── Collapsible group state ────────────────────────────────────────────────
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(groupId: string) {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  // ── Custom meals state ─────────────────────────────────────────────────────
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([]);

  // Custom meal creation modal
  const [cmModalVisible, setCmModalVisible] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [cmName, setCmName] = useState('');
  const [cmIngredients, setCmIngredients] = useState<CustomIngredient[]>([]);
  const [cmPhotoUri, setCmPhotoUri] = useState<string | undefined>(undefined);

  // Ingredient search inside creator
  const [cmIngQuery, setCmIngQuery] = useState('');
  const { results: cmIngResults, isLoading: cmIngLoading } = useFoodSearch(cmIngQuery, 400);
  const [cmIngQueryActive, setCmIngQueryActive] = useState(false);

  // Per-ingredient editing buffers: keyed by index
  const [cmIngSS, setCmIngSS] = useState<Record<number, string>>({});
  const [cmIngNS, setCmIngNS] = useState<Record<number, string>>({});

  function openCreateCustomMeal(mealToEdit?: CustomMeal) {
    if (mealToEdit) {
      setEditingMealId(mealToEdit.id);
      setCmName(mealToEdit.name);
      setCmIngredients([...mealToEdit.ingredients]);
      setCmPhotoUri(mealToEdit.photoUri);
      const ss: Record<number, string> = {};
      const ns: Record<number, string> = {};
      mealToEdit.ingredients.forEach((ing, i) => {
        ss[i] = String(ing.servingSize);
        ns[i] = String(ing.numServings);
      });
      setCmIngSS(ss);
      setCmIngNS(ns);
    } else {
      setEditingMealId(null);
      setCmName('');
      setCmIngredients([]);
      setCmPhotoUri(undefined);
      setCmIngSS({});
      setCmIngNS({});
    }
    setCmIngQuery('');
    setCmIngQueryActive(false);
    setCmModalVisible(true);
  }

  function addIngredientToMeal(food: FoodItem) {
    const newIng: CustomIngredient = {
      foodId:         food.id,
      name:           food.name,
      caloriesPer100: food.caloriesPer100,
      proteinPer100:  food.proteinPer100,
      carbsPer100:    food.carbsPer100,
      fatPer100:      food.fatPer100,
      servingSize:    100,
      numServings:    1,
    };
    setCmIngredients((prev) => {
      const idx = prev.length;
      setCmIngSS((s) => ({ ...s, [idx]: '100' }));
      setCmIngNS((s) => ({ ...s, [idx]: '1' }));
      return [...prev, newIng];
    });
    setCmIngQuery('');
    setCmIngQueryActive(false);
  }

  function removeIngredient(idx: number) {
    setCmIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateIngredientSS(idx: number, val: string) {
    setCmIngSS((prev) => ({ ...prev, [idx]: val }));
    const parsed = Math.max(0, parseFloat(val) || 0);
    setCmIngredients((prev) =>
      prev.map((ing, i) => (i === idx ? { ...ing, servingSize: parsed } : ing)),
    );
  }

  function updateIngredientNS(idx: number, val: string) {
    setCmIngNS((prev) => ({ ...prev, [idx]: val }));
    const parsed = Math.max(0, parseFloat(val) || 0);
    setCmIngredients((prev) =>
      prev.map((ing, i) => (i === idx ? { ...ing, numServings: parsed } : ing)),
    );
  }

  async function pickPhoto(fromCamera: boolean) {
    const permResult = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert('Permission required', 'Please allow access in your device settings.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [4, 3] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [4, 3] });
    if (!result.canceled && result.assets.length > 0) {
      setCmPhotoUri(result.assets[0].uri);
    }
  }

  function saveCustomMeal() {
    const trimmed = cmName.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a name for this meal.');
      return;
    }
    if (cmIngredients.length === 0) {
      Alert.alert('No ingredients', 'Add at least one ingredient to your custom meal.');
      return;
    }
    if (editingMealId) {
      setCustomMeals((prev) =>
        prev.map((m) =>
          m.id === editingMealId
            ? { ...m, name: trimmed, photoUri: cmPhotoUri, ingredients: cmIngredients }
            : m,
        ),
      );
    } else {
      const newMeal: CustomMeal = {
        id: `cm-${Date.now()}`,
        name: trimmed,
        photoUri: cmPhotoUri,
        ingredients: cmIngredients,
      };
      setCustomMeals((prev) => [...prev, newMeal]);
    }
    setEditingMealId(null);
    setCmModalVisible(false);
  }

  // ── Add custom meal to a log section ──────────────────────────────────────
  const [addToMealTarget, setAddToMealTarget] = useState<CustomMeal | null>(null);
  const [addToMealPicker, setAddToMealPicker] = useState(false);
  const [addToMealSelected, setAddToMealSelected] = useState<MealKey>('Breakfast');

  function openAddToMealPicker(cm: CustomMeal) {
    setAddToMealTarget(cm);
    setAddToMealSelected('Breakfast');
    setAddToMealPicker(true);
  }

  function confirmAddCustomMeal() {
    if (!addToMealTarget) return;
    const groupId   = `grp-${addToMealTarget.id}-${Date.now()}`;
    const groupName = addToMealTarget.name;
    addToMealTarget.ingredients.forEach((ing) => {
      const totals = ingredientTotals(ing);
      const entry: LoggedFood = {
        logId:          `${ing.foodId}-${Date.now()}-${Math.random()}`,
        name:           ing.name,
        caloriesPer100: ing.caloriesPer100,
        proteinPer100:  ing.proteinPer100,
        carbsPer100:    ing.carbsPer100,
        fatPer100:      ing.fatPer100,
        servingSize:    ing.servingSize,
        numServings:    ing.numServings,
        calories:       totals.calories,
        protein:        totals.protein,
        carbs:          totals.carbs,
        fat:            totals.fat,
        groupId,
        groupName,
      };
      addFood(addToMealSelected, entry);
    });
    setAddToMealPicker(false);
    setAddToMealTarget(null);
    setViewMode('log');
  }

  // ─── Grouped food rendering helper ────────────────────────────────────────

  function renderMealFoods(meal: MealKey) {
    const foods = meals[meal];
    if (foods.length === 0) {
      return <Text style={styles.emptyMeal}>No foods logged yet</Text>;
    }

    // Build ordered list of render items: either a group block or a standalone food
    type RenderBlock =
      | { kind: 'standalone'; food: LoggedFood }
      | { kind: 'group'; groupId: string; groupName: string; foods: LoggedFood[] };

    const blocks: RenderBlock[] = [];
    const seenGroups = new Set<string>();

    for (const food of foods) {
      if (food.groupId) {
        if (!seenGroups.has(food.groupId)) {
          seenGroups.add(food.groupId);
          const groupFoods = foods.filter((f) => f.groupId === food.groupId);
          blocks.push({ kind: 'group', groupId: food.groupId, groupName: food.groupName ?? food.groupId, foods: groupFoods });
        }
        // skip — already added via group block
      } else {
        blocks.push({ kind: 'standalone', food });
      }
    }

    return (
      <>
        {blocks.map((block, bi) => {
          if (block.kind === 'standalone') {
            const food = block.food;
            return (
              <Pressable key={food.logId} style={styles.foodRow} onPress={() => openEdit(meal, food)}>
                <View style={styles.foodRowLeft}>
                  <Text style={styles.foodName} numberOfLines={1}>{food.name}</Text>
                  <Text style={styles.foodMacros}>
                    {food.calories} cal · {food.servingSize}g × {food.numServings} serving{food.numServings !== 1 ? 's' : ''} · P {food.protein}g · C {food.carbs}g · F {food.fat}g
                  </Text>
                </View>
                <Ionicons name="pencil-outline" size={15} color="#94A3B8" style={{ marginRight: 10 }} />
                <Pressable onPress={() => removeFood(meal, food.logId)} style={styles.removeBtn} hitSlop={8}>
                  <Ionicons name="trash-outline" size={17} color="#EF4444" />
                </Pressable>
              </Pressable>
            );
          }

          // Group block
          const { groupId, groupName, foods: gFoods } = block;
          const collapsed = collapsedGroups[groupId] ?? false;
          const groupCal = gFoods.reduce((s, f) => s + f.calories, 0);

          return (
            <View key={`grp-${bi}-${groupId}`}>
              <Pressable style={styles.groupHeader} onPress={() => toggleGroup(groupId)}>
                <View style={styles.groupHeaderLeft}>
                  <Ionicons name="restaurant-outline" size={14} color={colors.primary} />
                  <Text style={styles.groupName}>{groupName}</Text>
                  <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '600' }}>
                    {groupCal} cal
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.groupToggle}>{collapsed ? 'Show' : 'Hide'}</Text>
                  <Ionicons
                    name={collapsed ? 'chevron-down-outline' : 'chevron-up-outline'}
                    size={14}
                    color={colors.subText}
                  />
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      gFoods.forEach((f) => removeFood(meal, f.logId));
                    }}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </Pressable>
                </View>
              </Pressable>

              {!collapsed && (
                <View style={styles.groupIndent}>
                  {gFoods.map((food) => (
                    <Pressable key={food.logId} style={styles.foodRow} onPress={() => openEdit(meal, food)}>
                      <View style={styles.foodRowLeft}>
                        <Text style={styles.foodName} numberOfLines={1}>{food.name}</Text>
                        <Text style={styles.foodMacros}>
                          {food.calories} cal · {food.servingSize}g × {food.numServings} serving{food.numServings !== 1 ? 's' : ''} · P {food.protein}g · C {food.carbs}g · F {food.fat}g
                        </Text>
                      </View>
                      <Ionicons name="pencil-outline" size={14} color="#94A3B8" style={{ marginRight: 8 }} />
                      <Pressable onPress={() => removeFood(meal, food.logId)} style={styles.removeBtn} hitSlop={8}>
                        <Ionicons name="trash-outline" size={15} color="#EF4444" />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar
        barStyle={colors.background === '#0B1220' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.card}
      />

      {/* ── Fixed header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        {!searchActive ? (
          <>
            <View style={styles.headerTopRow}>
              <Text style={styles.title}>Food Log</Text>
              <Pressable
                style={styles.myMealsBtn}
                onPress={() => setViewMode(viewMode === 'myMeals' ? 'log' : 'myMeals')}
              >
                <Ionicons
                  name={viewMode === 'myMeals' ? 'list-outline' : 'restaurant-outline'}
                  size={15}
                  color={colors.primary}
                />
                <Text style={styles.myMealsBtnText}>
                  {viewMode === 'myMeals' ? 'Food Log' : 'My Meals'}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.date}>{formatDate(new Date())}</Text>
            <Pressable style={styles.searchBar} onPress={openSearch}>
              <Ionicons name="search-outline" size={18} color="#94A3B8" style={styles.searchIcon} />
              <Text style={styles.searchPlaceholder}>Search foods…</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.searchBarActive}>
            <Ionicons name="search-outline" size={18} color={colors.primary} style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search foods…"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={(t) => { setSearchQuery(t); setPendingFood(null); }}
              returnKeyType="search"
              autoFocus
            />
            <Pressable onPress={closeSearch} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </Pressable>
          </View>
        )}
      </View>

      {/* ── Search panel ────────────────────────────────────────────────── */}
      {searchActive ? (
        <View style={styles.searchPanel}>
          {pendingFood && (
            <View style={styles.configPanel}>
              <Text style={styles.configFoodName} numberOfLines={2}>{pendingFood.name}</Text>

              <View style={styles.servingRow}>
                <View style={styles.servingField}>
                  <Text style={styles.servingLabel}>Serving size (g)</Text>
                  <TextInput
                    style={styles.servingInput}
                    keyboardType="decimal-pad"
                    value={servingSize}
                    onChangeText={setServingSize}
                    selectTextOnFocus
                  />
                </View>
                <View style={styles.servingDivider} />
                <View style={styles.servingField}>
                  <Text style={styles.servingLabel}>Servings</Text>
                  <TextInput
                    style={styles.servingInput}
                    keyboardType="decimal-pad"
                    value={numServings}
                    onChangeText={setNumServings}
                    selectTextOnFocus
                  />
                </View>
              </View>

              <View style={styles.macroRow}>
                <MacroPill label="Cal"     value={scaledCal}     color={colors.primary}  bgColor={colors.background} />
                <MacroPill label="Protein" value={scaledProtein} unit="g" color="#10B981" bgColor={colors.background} />
                <MacroPill label="Carbs"   value={scaledCarbs}   unit="g" color="#F59E0B" bgColor={colors.background} />
                <MacroPill label="Fat"     value={scaledFat}     unit="g" color="#EF4444" bgColor={colors.background} />
              </View>

              <Text style={styles.mealDropdownLabel}>Add to</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealChipScroll}>
                {MEALS.map((meal) => (
                  <Pressable
                    key={meal}
                    style={[styles.mealChip, selectedMeal === meal && styles.mealChipSelected]}
                    onPress={() => setSelectedMeal(meal)}
                  >
                    <Ionicons
                      name={MEAL_ICONS[meal]}
                      size={14}
                      color={selectedMeal === meal ? '#FFFFFF' : colors.subText}
                    />
                    <Text style={[styles.mealChipText, selectedMeal === meal && styles.mealChipTextSelected]}>
                      {meal}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable
                style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
                onPress={confirmAdd}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add to {selectedMeal}</Text>
              </Pressable>
            </View>
          )}

          {searchQuery.trim().length < 2 ? (
            <View style={styles.searchHintWrap}>
              <Text style={styles.searchHint}>Type at least 2 characters to search…</Text>
            </View>
          ) : isLoading ? (
            <View style={styles.searchHintWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.searchHint}>Searching foods…</Text>
            </View>
          ) : error ? (
            <View style={styles.searchHintWrap}>
              <Ionicons name="warning-outline" size={24} color="#EF4444" />
              <Text style={[styles.searchHint, { color: '#EF4444' }]}>{error}</Text>
            </View>
          ) : results.length === 0 ? (
            <View style={styles.searchHintWrap}>
              <Text style={styles.searchHint}>No results for "{searchQuery}"</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.resultsList}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.resultRow,
                    pressed && styles.resultRowPressed,
                    pendingFood?.id === item.id && styles.resultRowSelected,
                  ]}
                  onPress={() => onResultTap(item)}
                >
                  <View style={styles.resultLeft}>
                    <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.resultMacros}>
                      P {item.proteinPer100}g · C {item.carbsPer100}g · F {item.fatPer100}g
                    </Text>
                  </View>
                  <Text style={styles.resultCal}>{item.caloriesPer100} cal</Text>
                  {pendingFood?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginLeft: 6 }} />
                  )}
                </Pressable>
              )}
            />
          )}
        </View>

      ) : viewMode === 'myMeals' ? (
        /* ── My Meals view ────────────────────────────────────────────── */
        <View style={styles.myMealsView}>
          {customMeals.length === 0 ? (
            <View style={styles.myMealsEmptyWrap}>
              <Ionicons name="restaurant-outline" size={48} color={colors.border} />
              <Text style={styles.myMealsEmptyText}>
                No custom meals yet.{'\n'}Create one to quickly log your favourite combos!
              </Text>
              <Pressable
                style={({ pressed }) => [styles.newCustomMealBtn, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => openCreateCustomMeal()}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.newCustomMealBtnText}>Create Custom Meal</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.myMealsScroll}>
              <Pressable
                style={({ pressed }) => [styles.newCustomMealBtn, { opacity: pressed ? 0.85 : 1, marginBottom: 16 }]}
                onPress={() => openCreateCustomMeal()}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.newCustomMealBtnText}>Create Custom Meal</Text>
              </Pressable>

              {customMeals.map((cm) => {
                const totals = mealTotals(cm);
                return (
                  <View key={cm.id} style={styles.customMealCard}>
                    {cm.photoUri ? (
                      <Image source={{ uri: cm.photoUri }} style={styles.customMealPhoto} resizeMode="cover" />
                    ) : (
                      <View style={styles.customMealPhotoPlaceholder}>
                        <Ionicons name="restaurant-outline" size={32} color={colors.border} />
                      </View>
                    )}
                    <View style={styles.customMealCardBody}>
                      <Text style={styles.customMealName}>{cm.name}</Text>
                      <Text style={styles.customMealMacros}>
                        {totals.calories} cal · P {totals.protein}g · C {totals.carbs}g · F {totals.fat}g
                        {' · '}{cm.ingredients.length} ingredient{cm.ingredients.length !== 1 ? 's' : ''}
                      </Text>
                      <Pressable
                        style={({ pressed }) => [styles.customMealAddBtn, { opacity: pressed ? 0.85 : 1 }]}
                        onPress={() => openAddToMealPicker(cm)}
                      >
                        <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.customMealAddBtnText}>Add to Meal</Text>
                      </Pressable>
                      <View style={styles.customMealActionRow}>
                        <Pressable
                          style={styles.customMealEditBtn}
                          onPress={() => openCreateCustomMeal(cm)}
                        >
                          <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                          <Text style={[styles.customMealActionBtnText, { color: colors.primary }]}>Edit</Text>
                        </Pressable>
                        <Pressable
                          style={styles.customMealDeleteBtn}
                          onPress={() =>
                            Alert.alert('Delete Meal', `Delete "${cm.name}"?`, [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => setCustomMeals((prev) => prev.filter((m) => m.id !== cm.id)),
                              },
                            ])
                          }
                        >
                          <Ionicons name="trash-outline" size={14} color="#EF4444" />
                          <Text style={[styles.customMealActionBtnText, { color: '#EF4444' }]}>Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

      ) : (
        /* ── Meal sections ──────────────────────────────────────────────── */
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
          {MEALS.map((meal) => {
            const totalCal = getMealCalories(meal);
            return (
              <View key={meal} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealTitleRow}>
                    <Ionicons name={MEAL_ICONS[meal]} size={18} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.mealTitle}>{meal}</Text>
                  </View>
                  <Text style={styles.mealCal}>{totalCal > 0 ? `${totalCal} cal` : '—'}</Text>
                </View>
                {renderMealFoods(meal)}
              </View>
            );
          })}

          {/* Water Log (moved here from dashboard) */}
          <View style={[styles.mealCard, { marginBottom: 20 }]}>
            <View style={styles.mealHeader}>
              <View style={styles.mealTitleRow}>
                <Ionicons name="water-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.mealTitle}>Water Log</Text>
              </View>
              <View style={{ flex: 1 }} />
            </View>

            <View style={styles.waterLogInputRow}>
              <TextInput
                style={styles.waterLogInput}
                placeholder="Amount (ml)"
                placeholderTextColor={colors.subText}
                value={waterInputMl}
                onChangeText={setWaterInputMl}
                keyboardType="number-pad"
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  style={styles.waterLogAddBtn}
                  onPress={() => {
                    const ml = parseInt(waterInputMl.replace(/\D/g, ''), 10);
                    if (!Number.isNaN(ml) && ml > 0) {
                      addWater(ml);
                      setWaterInputMl('');
                    }
                  }}
                >
                  <Text style={styles.waterLogAddBtnText}>Add</Text>
                </Pressable>

                <Pressable
                  style={styles.waterLogSubtractBtn}
                  onPress={() => {
                    const ml = parseInt(waterInputMl.replace(/\D/g, ''), 10);
                    if (!Number.isNaN(ml) && ml > 0) {
                      addWater(-ml);
                      setWaterInputMl('');
                    }
                  }}
                >
                  <Text style={styles.waterLogSubtractBtnText}>Subtract</Text>
                </Pressable>
              </View>
            </View>

            <Pressable style={styles.waterLogResetBtn} onPress={resetWaterToday}>
              <Ionicons name="refresh-outline" size={16} color={colors.subText} />
              <Text style={styles.waterLogResetBtnText}>Reset today</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* ── Edit logged food modal ───────────────────────────────────────── */}
      <Modal
        visible={editTarget !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setEditTarget(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setEditTarget(null)}>
          <Pressable style={styles.editSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.editSheetLabel}>Edit serving</Text>
            <Text style={styles.editSheetName} numberOfLines={2}>{editTarget?.food.name}</Text>

            <View style={styles.servingRow}>
              <View style={styles.servingField}>
                <Text style={styles.servingLabel}>Serving size (g)</Text>
                <TextInput
                  style={styles.servingInput}
                  keyboardType="decimal-pad"
                  value={editServingSize}
                  onChangeText={setEditServingSize}
                  selectTextOnFocus
                />
              </View>
              <View style={styles.servingDivider} />
              <View style={styles.servingField}>
                <Text style={styles.servingLabel}>Servings</Text>
                <TextInput
                  style={styles.servingInput}
                  keyboardType="decimal-pad"
                  value={editNumServings}
                  onChangeText={setEditNumServings}
                  selectTextOnFocus
                />
              </View>
            </View>

            <View style={styles.macroRow}>
              <MacroPill label="Cal"     value={editScaledCal}     color={colors.primary}  bgColor={colors.background} />
              <MacroPill label="Protein" value={editScaledProtein} unit="g" color="#10B981" bgColor={colors.background} />
              <MacroPill label="Carbs"   value={editScaledCarbs}   unit="g" color="#F59E0B" bgColor={colors.background} />
              <MacroPill label="Fat"     value={editScaledFat}     unit="g" color="#EF4444" bgColor={colors.background} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
              onPress={saveEdit}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Save changes</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Create Custom Meal modal ─────────────────────────────────────── */}
      <Modal
        visible={cmModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCmModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.cmModalOuter}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.cmSheet}>
            {/* Header */}
            <View style={styles.cmSheetHeader}>
              <Text style={styles.cmSheetTitle}>{editingMealId ? 'Edit Meal' : 'New Custom Meal'}</Text>
              <Pressable onPress={() => setCmModalVisible(false)} hitSlop={10}>
                <Ionicons name="close-circle-outline" size={26} color={colors.subText} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.cmBody}>
              {/* Meal name */}
              <Text style={styles.cmSectionLabel}>Meal name</Text>
              <TextInput
                style={styles.cmNameInput}
                placeholder="e.g. Post-Workout Shake"
                placeholderTextColor="#94A3B8"
                value={cmName}
                onChangeText={setCmName}
                returnKeyType="done"
              />

              {/* Photo */}
              <Text style={styles.cmSectionLabel}>Photo (optional)</Text>
              <View style={styles.cmPhotoWrap}>
                {cmPhotoUri && (
                  <Image source={{ uri: cmPhotoUri }} style={styles.cmPhotoPreview} resizeMode="cover" />
                )}
                <View style={styles.cmPhotoButtons}>
                  <Pressable style={styles.cmPhotoBtn} onPress={() => pickPhoto(true)}>
                    <Ionicons name="camera-outline" size={18} color={colors.subText} />
                    <Text style={styles.cmPhotoBtnText}>Camera</Text>
                  </Pressable>
                  <Pressable style={styles.cmPhotoBtn} onPress={() => pickPhoto(false)}>
                    <Ionicons name="images-outline" size={18} color={colors.subText} />
                    <Text style={styles.cmPhotoBtnText}>Gallery</Text>
                  </Pressable>
                  {cmPhotoUri && (
                    <Pressable
                      style={[styles.cmPhotoBtn, { flex: 0, paddingHorizontal: 14 }]}
                      onPress={() => setCmPhotoUri(undefined)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Ingredients */}
              <Text style={styles.cmSectionLabel}>Ingredients</Text>
              {cmIngredients.map((ing, idx) => (
                <View key={`${ing.foodId}-${idx}`} style={styles.cmIngredientRow}>
                  <Text style={styles.cmIngredientName} numberOfLines={1}>{ing.name}</Text>
                  <View style={styles.cmIngredientServings}>
                    <View style={styles.cmIngredientField}>
                      <Text style={styles.cmIngredientFieldLabel}>Size (g)</Text>
                      <TextInput
                        style={styles.cmIngredientInput}
                        keyboardType="decimal-pad"
                        value={cmIngSS[idx] ?? String(ing.servingSize)}
                        onChangeText={(v) => updateIngredientSS(idx, v)}
                        selectTextOnFocus
                      />
                    </View>
                    <View style={styles.cmIngredientField}>
                      <Text style={styles.cmIngredientFieldLabel}>Servings</Text>
                      <TextInput
                        style={styles.cmIngredientInput}
                        keyboardType="decimal-pad"
                        value={cmIngNS[idx] ?? String(ing.numServings)}
                        onChangeText={(v) => updateIngredientNS(idx, v)}
                        selectTextOnFocus
                      />
                    </View>
                    <View style={{ justifyContent: 'flex-end', paddingBottom: 2 }}>
                      <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '700' }}>
                        {scale(ing.caloriesPer100, ing.servingSize, ing.numServings)} cal
                      </Text>
                    </View>
                  </View>
                  <Pressable style={styles.cmRemoveIngBtn} onPress={() => removeIngredient(idx)} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color="#EF4444" />
                  </Pressable>
                </View>
              ))}

              {/* Ingredient search */}
              <View style={styles.cmIngSearchWrap}>
                <View style={styles.cmIngSearchBar}>
                  <Ionicons name="search-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                  <TextInput
                    style={styles.cmIngSearchInput}
                    placeholder="Search ingredient to add…"
                    placeholderTextColor="#94A3B8"
                    value={cmIngQuery}
                    onChangeText={(t) => { setCmIngQuery(t); setCmIngQueryActive(t.trim().length >= 2); }}
                    returnKeyType="search"
                  />
                  {cmIngQuery.length > 0 && (
                    <Pressable onPress={() => { setCmIngQuery(''); setCmIngQueryActive(false); }} hitSlop={8}>
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </Pressable>
                  )}
                </View>

                {cmIngQueryActive && (
                  cmIngLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
                  ) : cmIngResults.length === 0 ? (
                    <Text style={[styles.searchHint, { marginTop: 8 }]}>No results.</Text>
                  ) : (
                    cmIngResults.slice(0, 8).map((item) => (
                      <Pressable
                        key={item.id}
                        style={styles.cmIngResultRow}
                        onPress={() => addIngredientToMeal(item)}
                      >
                        <Text style={styles.cmIngResultName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.cmIngResultCal}>{item.caloriesPer100} cal/100g</Text>
                        <Ionicons name="add-circle-outline" size={18} color={colors.primary} style={{ marginLeft: 8 }} />
                      </Pressable>
                    ))
                  )
                )}
              </View>

              {/* Save */}
              <Pressable
                style={({ pressed }) => [styles.addBtn, { marginTop: 4, opacity: pressed ? 0.85 : 1 }]}
                onPress={saveCustomMeal}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Save Meal</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add-to-meal picker modal ─────────────────────────────────────── */}
      <Modal
        visible={addToMealPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setAddToMealPicker(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setAddToMealPicker(false)}>
          <Pressable style={styles.addToMealSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.addToMealTitle}>Add "{addToMealTarget?.name}"</Text>
            <Text style={styles.addToMealSub}>Choose which meal to add it to:</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealChipScroll}>
              {MEALS.map((meal) => (
                <Pressable
                  key={meal}
                  style={[styles.mealChip, addToMealSelected === meal && styles.mealChipSelected]}
                  onPress={() => setAddToMealSelected(meal)}
                >
                  <Ionicons
                    name={MEAL_ICONS[meal]}
                    size={14}
                    color={addToMealSelected === meal ? '#FFFFFF' : colors.subText}
                  />
                  <Text style={[styles.mealChipText, addToMealSelected === meal && styles.mealChipTextSelected]}>
                    {meal}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
              onPress={confirmAddCustomMeal}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add to {addToMealSelected}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

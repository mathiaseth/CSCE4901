import React, { useMemo, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNutrition } from '../../context/NutritionContext';
import { ThemeContext } from '../../lib/theme';
import { router } from 'expo-router';
import type { DietaryTag, MacroPreference, MealKey, FoodItem } from '../../types/nutrition';
import {
  DIETARY_TAGS_META,
  getRecipeTotals,
  RECIPES,
} from '../../lib/recipeLibrary';
import type { Recipe } from '../../types/nutrition';

const CAL_GOAL = 2360; // keep consistent with the dashboard's current placeholder goal

function ToggleRow({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.toggleRow}>
      <View
        style={[
          styles.toggleBox,
          {
            borderColor: checked ? '#1E90D6' : '#CBD5E1',
            backgroundColor: checked ? '#EFF6FF' : '#FFFFFF',
          },
        ]}
      >
        {checked && <Ionicons name="checkmark-outline" size={16} color="#1E90D6" />}
      </View>
      <Text style={styles.toggleLabel}>{label}</Text>
    </Pressable>
  );
}

function getMacroScore(totals: ReturnType<typeof getRecipeTotals>, pref: MacroPreference) {
  const calories = Math.max(1, totals.calories);
  const proteinRatio = (totals.protein * 4) / calories;
  const carbRatio = (totals.carbs * 4) / calories;

  if (pref === 'high-protein') {
    // Target protein-heavy meals
    return proteinRatio;
  }

  if (pref === 'lower-carb') {
    // Prefer lower carb density
    return 1 - carbRatio;
  }

  // Balanced: keep everything in a reasonable range
  const proteinTarget = 0.25;
  const carbTarget = 0.35;
  return 1 - (Math.abs(proteinRatio - proteinTarget) + Math.abs(carbRatio - carbTarget)) / 1.1;
}

function getCalorieScore(remaining: number, target: number, recipeCalories: number) {
  const overBy = Math.max(0, recipeCalories - remaining);
  const overPenalty = overBy / 250;
  const delta = Math.abs(recipeCalories - target) / Math.max(1, target);
  return 1 / (1 + overPenalty + delta);
}

function getTargetCaloriesForMeal(meal: MealKey, remaining: number) {
  // Rough split of daily calories across meals.
  const fractions: Record<MealKey, number> = {
    Breakfast: 0.28,
    Lunch: 0.34,
    Dinner: 0.30,
    Snacks: 0.18,
  };
  return Math.max(200, remaining * fractions[meal]);
}

export default function MealSuggestionsScreen() {
  const { consumedCalories } = useNutrition();
  const { colors } = useContext(ThemeContext);

  const remaining = Math.max(CAL_GOAL - consumedCalories, 0);

  const [mealType, setMealType] = useState<MealKey>('Breakfast');
  const [macroPreference, setMacroPreference] = useState<MacroPreference>('high-protein');
  const [selectedDietTags, setSelectedDietTags] = useState<DietaryTag[]>([]);

  const suggestions = useMemo(() => {
    const target = getTargetCaloriesForMeal(mealType, remaining);

    const dietarySet = new Set(selectedDietTags);
    const base = RECIPES.filter((r) => r.mealTypes.includes(mealType)).filter((r) => {
      if (!dietarySet.size) return true;
      const recipeTags = new Set(r.dietaryTags ?? []);
      // Must satisfy all selected tags
      for (const tag of dietarySet.values()) {
        if (!recipeTags.has(tag)) return false;
      }
      return true;
    });

    const scored = base.map((recipe) => {
      const totals = getRecipeTotals(recipe);
      const calScore = getCalorieScore(remaining, target, totals.calories);
      const macroScore = getMacroScore(totals, macroPreference);
      const score = calScore * 2 + macroScore * 1.3;
      return { recipe, totals, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 6);
  }, [mealType, macroPreference, remaining, selectedDietTags]);

  function toggleDiet(tag: DietaryTag) {
    setSelectedDietTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      return [...prev, tag];
    });
  }

  function logRecipe(recipe: Recipe) {
    // Pass recipe items to `log-entry` to prefill the selected meal.
    // Params must be strings, so we serialize.
    const foods: FoodItem[] = recipe.items;
    router.push({
      pathname: '/(tabs)/log-entry',
      params: { meal: mealType, foods: JSON.stringify(foods) },
    });
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: 60 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Meal Suggestions</Text>
          <View style={[styles.pill, { borderColor: colors.border }]}>
            <Ionicons name="flame-outline" size={16} color={colors.primary} />
            <Text style={[styles.pillText, { color: colors.text }]}>
              {remaining} cal left
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>Meal Type</Text>
          <View style={styles.segRow}>
            {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as MealKey[]).map((m) => {
              const active = m === mealType;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMealType(m)}
                  style={[
                    styles.segBtn,
                    active && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text style={[styles.segText, active && { color: '#FFFFFF' }]}>{m}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>Macro Preference</Text>
          <View style={styles.prefRow}>
            {(
              [
                { id: 'high-protein', label: 'High Protein' },
                { id: 'balanced', label: 'Balanced' },
                { id: 'lower-carb', label: 'Lower Carb' },
              ] as Array<{ id: MacroPreference; label: string }>
            ).map((p) => {
              const active = p.id === macroPreference;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setMacroPreference(p.id)}
                  style={[
                    styles.prefBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    },
                    active && {
                      backgroundColor: '#EFF6FF',
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text style={[styles.prefText, active && { color: colors.primary }]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>Dietary Restrictions</Text>
          <View style={styles.toggleGrid}>
            {DIETARY_TAGS_META.map(({ tag, label }) => {
              const checked = selectedDietTags.includes(tag);
              return (
                <ToggleRow
                  key={tag}
                  label={label}
                  checked={checked}
                  onPress={() => toggleDiet(tag)}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>Recommended for you</Text>

          {suggestions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ color: colors.subText, fontWeight: '800' }}>
                No recipes match these filters yet.
              </Text>
              <Text style={{ color: colors.subText, marginTop: 6, fontWeight: '700' }}>
                Try removing a dietary filter or switching macro preference.
              </Text>
            </View>
          ) : (
            suggestions.map(({ recipe, totals }) => (
              <View
                key={recipe.id}
                style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}
              >
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{recipe.name}</Text>
                    <Text style={[styles.cardSub, { color: colors.subText }]}>
                      {totals.calories} cal • P {totals.protein}g • C {totals.carbs}g • F {totals.fat}g
                    </Text>
                  </View>
                  <View style={[styles.logChip, { borderColor: colors.border }]}>
                    <Text style={[styles.logChipText, { color: colors.primary }]}>Log</Text>
                  </View>
                </View>

                <View style={styles.reasonRow}>
                  <Text style={[styles.reasonText, { color: colors.subText }]}>
                    Fits your {mealType.toLowerCase()} calories + {macroPreference.replace('-', ' ')} preference
                  </Text>
                </View>

                <Pressable
                  style={[styles.logBtn, { backgroundColor: colors.primary }]}
                  onPress={() => logRecipe(recipe)}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.logBtnText}>Add to Food Log</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  title: { fontSize: 26, fontWeight: '900' },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: { fontWeight: '900', fontSize: 14 },

  section: { marginBottom: 18 },

  sectionTitle: { fontWeight: '900', fontSize: 12, letterSpacing: 0.6, marginBottom: 10 },

  segRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  segBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  segText: { fontWeight: '900', fontSize: 13, color: '#0B2C5E' },

  prefRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  prefBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  prefText: { fontWeight: '900', fontSize: 13, color: '#64748B' },

  toggleGrid: { gap: 10 },
  toggleRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  toggleBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { fontWeight: '800', color: '#0B2C5E' },

  emptyCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    padding: 14,
  },

  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  cardTopRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '900' },
  cardSub: { fontWeight: '800', marginTop: 4, fontSize: 12 },

  logChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  logChipText: { fontWeight: '900', fontSize: 12 },

  reasonRow: { marginTop: 10 },
  reasonText: { fontWeight: '700', fontSize: 12 },

  logBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  logBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
});


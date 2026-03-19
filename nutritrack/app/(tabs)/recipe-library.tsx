import React, { useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemeContext } from '../../lib/theme';
import { useNutrition } from '../../context/NutritionContext';
import type { DietaryTag, MacroPreference, MealKey, FoodItem } from '../../types/nutrition';
import type { Recipe } from '../../types/nutrition';
import { DIETARY_TAGS_META, getRecipeTotals, RECIPES } from '../../lib/recipeLibrary';

const CAL_GOAL = 2360; // same placeholder target used by the dashboard

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

function MacroSummary({ recipe }: { recipe: Recipe }) {
  const totals = getRecipeTotals(recipe);
  return (
    <Text style={styles.macroText}>
      {totals.calories} cal • P {totals.protein}g • C {totals.carbs}g • F {totals.fat}g
    </Text>
  );
}

export default function RecipeLibraryScreen() {
  const { colors } = useContext(ThemeContext);
  const { totalCalories } = useNutrition();

  const remaining = Math.max(CAL_GOAL - totalCalories, 0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDietTags, setSelectedDietTags] = useState<DietaryTag[]>([]);

  const [macroPreference, setMacroPreference] = useState<MacroPreference>('balanced');

  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [logMealType, setLogMealType] = useState<MealKey>('Breakfast');

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const dietarySet = new Set(selectedDietTags);

    return RECIPES.filter((r) => {
      const matchesQuery = query.length
        ? r.name.toLowerCase().includes(query) || r.description.toLowerCase().includes(query)
        : true;

      if (!matchesQuery) return false;

      if (dietarySet.size) {
        const recipeTags = new Set(r.dietaryTags ?? []);
        for (const tag of dietarySet.values()) {
          if (!recipeTags.has(tag)) return false;
        }
      }

      // Lightweight macro preference ordering.
      const totals = getRecipeTotals(r);
      const calories = Math.max(1, totals.calories);
      const proteinRatio = (totals.protein * 4) / calories;
      const carbRatio = (totals.carbs * 4) / calories;

      if (macroPreference === 'high-protein') return proteinRatio >= 0.25;
      if (macroPreference === 'lower-carb') return carbRatio <= 0.35;
      return true; // balanced
    });
  }, [macroPreference, searchQuery, selectedDietTags]);

  function toggleDiet(tag: DietaryTag) {
    setSelectedDietTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function openRecipe(recipe: Recipe) {
    setActiveRecipe(recipe);
    setLogMealType(recipe.mealTypes[0] ?? 'Breakfast');
  }

  function logRecipe(recipe: Recipe) {
    const foods: FoodItem[] = recipe.items;
    router.push({
      pathname: '/(tabs)/log-entry',
      params: { meal: logMealType, foods: JSON.stringify(foods) },
    });
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: 60 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Recipe Library</Text>
          <View style={[styles.pill, { borderColor: colors.border }]}>
            <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
            <Text style={[styles.pillText, { color: colors.text }]}>{remaining} cal left</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>Search</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Find recipes..."
            placeholderTextColor="#94A3B8"
            style={[styles.searchInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
          />
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
                    active && { backgroundColor: '#EFF6FF', borderColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.prefText, active && { color: colors.primary }]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>Dietary Restrictions</Text>
          <View style={styles.toggleGrid}>
            {DIETARY_TAGS_META.map(({ tag, label }) => (
              <ToggleRow
                key={tag}
                label={label}
                checked={selectedDietTags.includes(tag)}
                onPress={() => toggleDiet(tag)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>
            {filtered.length} recipes
          </Text>

          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ color: colors.subText, fontWeight: '800' }}>
                No recipes match your filters.
              </Text>
              <Text style={{ color: colors.subText, marginTop: 6, fontWeight: '700' }}>
                Try adjusting restrictions or macro preference.
              </Text>
            </View>
          ) : (
            filtered.map((recipe) => {
              const totals = getRecipeTotals(recipe);
              const fits = totals.calories <= remaining;
              return (
                <Pressable
                  key={recipe.id}
                  onPress={() => openRecipe(recipe)}
                  style={[
                    styles.card,
                    { borderColor: colors.border, backgroundColor: colors.card },
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{recipe.name}</Text>
                    <View style={[styles.badge, { borderColor: colors.border }]}>
                      <Text style={{ color: fits ? '#16A34A' : colors.primary, fontWeight: '900' }}>
                        {fits ? 'Fits' : 'Estimate'}
                      </Text>
                    </View>
                  </View>
                  <MacroSummary recipe={recipe} />
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!activeRecipe}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveRecipe(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setActiveRecipe(null)}>
          <Pressable style={[styles.modalSheet, { borderColor: colors.border }]} onPress={() => {}}>
            {activeRecipe && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{activeRecipe.name}</Text>
                  <Pressable onPress={() => setActiveRecipe(null)} hitSlop={10}>
                    <Ionicons name="close" size={22} color={colors.subText} />
                  </Pressable>
                </View>

                <Text style={[styles.modalDesc, { color: colors.subText }]}>
                  {activeRecipe.description}
                </Text>

                <MacroSummary recipe={activeRecipe} />

                <View style={styles.mealTypeSection}>
                  <Text style={[styles.sectionTitle, { marginBottom: 8, color: colors.subText }]}>
                    Add to which meal?
                  </Text>
                  <View style={styles.segRow}>
                    {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as MealKey[]).map((m) => {
                      const active = m === logMealType;
                      const allowed = activeRecipe.mealTypes.includes(m);
                      return (
                        <Pressable
                          key={m}
                          onPress={() => allowed && setLogMealType(m)}
                          style={[
                            styles.segBtn,
                            {
                              borderColor: colors.border,
                              backgroundColor: colors.card,
                              opacity: allowed ? 1 : 0.45,
                            },
                            active && { backgroundColor: '#EFF6FF', borderColor: colors.primary },
                          ]}
                        >
                          <Text style={[styles.segText, active && { color: colors.primary }]}>
                            {m}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.itemsSection}>
                  <Text style={[styles.sectionTitle, { marginBottom: 8, color: colors.subText }]}>
                    Ingredients
                  </Text>
                  <ScrollView style={{ maxHeight: 220 }}>
                    {activeRecipe.items.map((item) => (
                      <View key={item.id} style={styles.itemRow}>
                        <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={styles.itemMacros}>
                          {item.calories} cal • P {item.protein}g • C {item.carbs}g • F {item.fat}g
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                <Pressable
                  style={[styles.logBtn, { backgroundColor: colors.primary }]}
                  onPress={() => logRecipe(activeRecipe)}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.logBtnText}>Add to Food Log</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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

  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },

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
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '900' },
  macroText: { fontWeight: '800', color: '#64748B', marginTop: 6, fontSize: 12 },

  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    maxHeight: '88%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalDesc: { fontWeight: '700', marginBottom: 10 },

  mealTypeSection: { marginTop: 10, marginBottom: 8 },
  segRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  segBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  segText: { fontWeight: '900', fontSize: 13, color: '#0B2C5E' },

  itemsSection: { marginTop: 10 },
  itemRow: { marginBottom: 12 },
  itemName: { fontWeight: '900' },
  itemMacros: { fontSize: 12, color: '#64748B', fontWeight: '700', marginTop: 4 },

  logBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  logBtnText: { color: '#FFFFFF', fontWeight: '900' },
});


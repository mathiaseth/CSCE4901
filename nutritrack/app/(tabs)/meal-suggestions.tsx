import React, { useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNutrition } from '../../context/NutritionContext';
import { useProfile } from '../../context/ProfileContext';
import { ThemeContext } from '../../lib/theme';
import type { DietaryTag, MacroPreference, MealKey, FoodItem } from '../../types/nutrition';
import {
  DIETARY_TAGS_META,
  getRecipeTotals,
  RECIPES,
} from '../../lib/recipeLibrary';
import type { Recipe } from '../../types/nutrition';

const FREE_LIMIT = 25;
const USAGE_KEY = 'suggestions.useCount';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeCalorieTarget(profile: ReturnType<typeof useProfile>['profile']): number {
  const weight = profile.weightKg ?? 70;
  const height = profile.heightCm ?? 170;
  const age = (typeof profile.age === 'number' ? profile.age : parseInt(String(profile.age), 10)) || 25;
  const isMale = (profile.gender ?? '').toLowerCase() === 'male';

  const bmr = isMale
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9,
  };
  const mult = multipliers[profile.activityLevel ?? 'sedentary'] ?? 1.2;
  const tdee = bmr * mult;

  const adjustments: Record<string, number> = {
    lose: -500,
    maintain: 0,
    gain: 300,
    recomp: 0,
  };
  return Math.round(tdee + (adjustments[profile.goal ?? 'maintain'] ?? 0));
}

function goalToMacroPref(goal: string | undefined): MacroPreference {
  if (goal === 'lose') return 'lower-carb';
  if (goal === 'gain') return 'high-protein';
  return 'balanced';
}

function getMacroScore(totals: ReturnType<typeof getRecipeTotals>, pref: MacroPreference) {
  const calories = Math.max(1, totals.calories);
  const proteinRatio = (totals.protein * 4) / calories;
  const carbRatio = (totals.carbs * 4) / calories;
  if (pref === 'high-protein') return proteinRatio;
  if (pref === 'lower-carb') return 1 - carbRatio;
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
  const fractions: Record<MealKey, number> = {
    Breakfast: 0.28,
    Lunch: 0.34,
    Dinner: 0.30,
    Snacks: 0.18,
  };
  return Math.max(200, remaining * fractions[meal]);
}

// ─── ToggleRow ─────────────────────────────────────────────────────────────────

function ToggleRow({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
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

// ─── Subscription Modal ────────────────────────────────────────────────────────

function SubscriptionModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.subModal}>
          <View style={styles.subIconWrap}>
            <Ionicons name="star" size={36} color="#F59E0B" />
          </View>
          <Text style={styles.subTitle}>You've hit your free limit</Text>
          <Text style={styles.subBody}>
            You've used all {FREE_LIMIT} of your free meal suggestion adds. Upgrade to{' '}
            <Text style={{ fontWeight: '900', color: '#1E90D6' }}>NutriFit Pro</Text> for unlimited
            personalized suggestions.
          </Text>

          <Pressable
            style={styles.subBtn}
            onPress={() => {
              onClose();
              Alert.alert('Coming soon', 'Subscription management will be available in a future update.');
            }}
          >
            <Text style={styles.subBtnText}>Upgrade to Pro</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.subDismiss}>
            <Text style={styles.subDismissText}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function MealSuggestionsScreen() {
  const { totalCalories, addFood } = useNutrition();
  const { profile } = useProfile();
  const { colors } = useContext(ThemeContext);

  const calGoal = useMemo(() => computeCalorieTarget(profile), [profile]);
  const remaining = Math.max(calGoal - totalCalories, 0);

  const [mealType, setMealType] = useState<MealKey>('Breakfast');
  const [macroPreference, setMacroPreference] = useState<MacroPreference>(
    goalToMacroPref(profile.goal ?? undefined)
  );
  const [selectedDietTags, setSelectedDietTags] = useState<DietaryTag[]>([]);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [usedCount, setUsedCount] = useState(0);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const justAddedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync macro pref when goal loads
  useEffect(() => {
    setMacroPreference(goalToMacroPref(profile.goal ?? undefined));
  }, [profile.goal]);

  // Load usage count from storage
  useEffect(() => {
    AsyncStorage.getItem(USAGE_KEY).then((val) => {
      if (val) setUsedCount(parseInt(val, 10) || 0);
    });
  }, []);

  const suggestions = useMemo(() => {
    const target = getTargetCaloriesForMeal(mealType, remaining);
    const dietarySet = new Set(selectedDietTags);

    const base = RECIPES.filter((r) => r.mealTypes.includes(mealType)).filter((r) => {
      if (!dietarySet.size) return true;
      const recipeTags = new Set(r.dietaryTags ?? []);
      for (const tag of dietarySet.values()) {
        if (!recipeTags.has(tag)) return false;
      }
      return true;
    });

    const scored = base.map((recipe, index) => {
      const totals = getRecipeTotals(recipe);
      const calScore = getCalorieScore(remaining, target, totals.calories);
      const macroScore = getMacroScore(totals, macroPreference);
      // Add a small deterministic shuffle based on refreshSeed so refresh changes order
      const shuffle = Math.sin(refreshSeed * 9301 + index * 49297) * 0.12;
      const score = calScore * 2 + macroScore * 1.3 + shuffle;
      return { recipe, totals, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 6);
  }, [mealType, macroPreference, remaining, selectedDietTags, refreshSeed]);

  function toggleDiet(tag: DietaryTag) {
    setSelectedDietTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  const handleAddToLog = useCallback(
    async (recipe: Recipe) => {
      if (usedCount >= FREE_LIMIT) {
        setShowSubModal(true);
        return;
      }

      // Add each ingredient to the food log
      recipe.items.forEach((item: FoodItem, i: number) => {
        addFood(mealType, {
          logId: `sug-${recipe.id}-${i}-${Date.now()}`,
          name: item.name,
          caloriesPer100: item.calories,
          proteinPer100: item.protein,
          carbsPer100: item.carbs,
          fatPer100: item.fat,
          servingSize: 100,
          numServings: 1,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          groupId: recipe.id,
          groupName: recipe.name,
        });
      });

      // Update usage count
      const next = usedCount + 1;
      setUsedCount(next);
      await AsyncStorage.setItem(USAGE_KEY, String(next));

      // Flash "added" feedback
      setJustAddedId(recipe.id);
      if (justAddedTimer.current) clearTimeout(justAddedTimer.current);
      justAddedTimer.current = setTimeout(() => setJustAddedId(null), 2000);

      if (next >= FREE_LIMIT) {
        setTimeout(() => setShowSubModal(true), 300);
      }
    },
    [usedCount, mealType, addFood]
  );

  const freeRemaining = Math.max(FREE_LIMIT - usedCount, 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SubscriptionModal visible={showSubModal} onClose={() => setShowSubModal(false)} />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: 60 }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Meal Suggestions</Text>
          <View style={styles.headerRight}>
            <View style={[styles.pill, { borderColor: colors.border }]}>
              <Ionicons name="flame-outline" size={16} color={colors.primary} />
              <Text style={[styles.pillText, { color: colors.text }]}>{remaining} cal left</Text>
            </View>
            <Pressable
              style={[styles.refreshBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => setRefreshSeed((s) => s + 1)}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Goal banner */}
        <View style={[styles.goalBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="trophy-outline" size={16} color={colors.primary} />
          <Text style={[styles.goalBannerText, { color: colors.text }]}>
            Target: <Text style={{ color: colors.primary }}>{calGoal} cal/day</Text>
            {'  ·  '}
            <Text style={{ color: freeRemaining <= 5 ? '#EF4444' : colors.subText }}>
              {freeRemaining} free adds left
            </Text>
          </Text>
        </View>

        {/* Meal Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>MEAL TYPE</Text>
          <View style={styles.segRow}>
            {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as MealKey[]).map((m) => {
              const active = m === mealType;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMealType(m)}
                  style={[
                    styles.segBtn,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    active && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.segText, { color: colors.text }, active && { color: '#FFFFFF' }]}>
                    {m}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Macro Preference */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>MACRO PREFERENCE</Text>
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
                    { borderColor: colors.border, backgroundColor: colors.card },
                    active && { backgroundColor: '#EFF6FF', borderColor: colors.primary },
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

        {/* Dietary Restrictions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>DIETARY RESTRICTIONS</Text>
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

        {/* Suggestions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>RECOMMENDED FOR YOU</Text>

          {suggestions.length === 0 ? (
            <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={{ color: colors.subText, fontWeight: '800' }}>
                No recipes match these filters yet.
              </Text>
              <Text style={{ color: colors.subText, marginTop: 6, fontWeight: '700' }}>
                Try removing a dietary filter or switching macro preference.
              </Text>
            </View>
          ) : (
            suggestions.map(({ recipe, totals }) => {
              const added = justAddedId === recipe.id;
              return (
                <View
                  key={recipe.id}
                  style={[
                    styles.card,
                    { borderColor: added ? colors.primary : colors.border, backgroundColor: colors.card },
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{recipe.name}</Text>
                      <Text style={[styles.cardSub, { color: colors.subText }]}>
                        {totals.calories} cal · P {totals.protein}g · C {totals.carbs}g · F {totals.fat}g
                      </Text>
                    </View>
                    {added && (
                      <View style={[styles.addedBadge, { backgroundColor: colors.primary }]}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        <Text style={styles.addedBadgeText}>Added</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.reasonText, { color: colors.subText }]}>
                    {recipe.description}
                  </Text>

                  <Pressable
                    style={[
                      styles.logBtn,
                      { backgroundColor: added ? '#22C55E' : colors.primary },
                      usedCount >= FREE_LIMIT && { backgroundColor: '#94A3B8' },
                    ]}
                    onPress={() => handleAddToLog(recipe)}
                  >
                    <Ionicons
                      name={added ? 'checkmark-circle-outline' : 'add-circle-outline'}
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.logBtnText}>
                      {added ? 'Added to Log!' : usedCount >= FREE_LIMIT ? 'Subscribe to Add' : 'Add to Food Log'}
                    </Text>
                  </Pressable>
                </View>
              );
            })
          )}

          <Pressable
            style={[styles.refreshBtnFull, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => setRefreshSeed((s) => s + 1)}
          >
            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            <Text style={[styles.refreshBtnText, { color: colors.primary }]}>Refresh Suggestions</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
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
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { fontSize: 26, fontWeight: '900' },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillText: { fontWeight: '900', fontSize: 13 },

  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  goalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  goalBannerText: { fontWeight: '800', fontSize: 13 },

  section: { marginBottom: 18 },
  sectionTitle: { fontWeight: '900', fontSize: 12, letterSpacing: 0.8, marginBottom: 10 },

  segRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  segBtn: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  segText: { fontWeight: '900', fontSize: 13 },

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
  toggleBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: { fontWeight: '800', color: '#0B2C5E' },

  emptyCard: { borderWidth: 1, borderRadius: 18, padding: 14 },

  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  cardTopRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '900' },
  cardSub: { fontWeight: '800', marginTop: 3, fontSize: 12 },

  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addedBadgeText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },

  reasonText: { fontWeight: '700', fontSize: 12, marginBottom: 10 },

  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  logBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },

  refreshBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 4,
  },
  refreshBtnText: { fontWeight: '900', fontSize: 14 },

  // Subscription modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  subModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
  },
  subIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0B2C5E',
    marginBottom: 10,
    textAlign: 'center',
  },
  subBody: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  subBtn: {
    backgroundColor: '#1E90D6',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  subBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  subDismiss: { paddingVertical: 8 },
  subDismissText: { color: '#94A3B8', fontWeight: '800', fontSize: 14 },
});

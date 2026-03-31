import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../../lib/theme';
import { useNutrition } from '../../context/NutritionContext';
import { useProfile } from '../../context/ProfileContext';
import type { DietaryTag, MealKey, FoodItem } from '../../types/nutrition';
import type { Recipe } from '../../types/nutrition';
import { DIETARY_TAGS_META, getRecipeTotals, RECIPES } from '../../lib/recipeLibrary';

const FREE_REFRESHES = 5;
const PER_PAGE = 10;
const REFRESH_KEY = 'recipes.refreshCount';

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreRecipe(recipe: Recipe, goal: string, remaining: number, seed: number, index: number) {
  const totals = getRecipeTotals(recipe);
  const cal = Math.max(1, totals.calories);
  const proteinPct = (totals.protein * 4) / cal;
  const carbPct    = (totals.carbs * 4) / cal;

  let goalScore = 0;
  if (goal === 'lose')     goalScore = 1 - carbPct;        // avoid carbs
  else if (goal === 'gain') goalScore = proteinPct;         // maximise protein
  else                      goalScore = 1 - Math.abs(proteinPct - 0.28) - Math.abs(carbPct - 0.38);

  // mild shuffle per refresh so results change
  const shuffle = Math.sin(seed * 9301 + index * 49297) * 0.15;
  // small penalty for wildly over-budget meals
  const overPenalty = Math.max(0, totals.calories - remaining) / 400;

  return goalScore + shuffle - overPenalty;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeCalorieTarget(profile: any): number {
  const w = profile.weightKg ?? 70;
  const h = profile.heightCm ?? 170;
  const a = (typeof profile.age === 'number' ? profile.age : parseInt(String(profile.age), 10)) || 25;
  const male = (profile.gender ?? '').toLowerCase() === 'male';
  const bmr  = male ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
  const mult: Record<string, number> = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, athlete:1.9 };
  const adj:  Record<string, number> = { lose:-500, maintain:0, gain:300, recomp:0 };
  return Math.round(bmr * (mult[profile.activityLevel ?? 'sedentary'] ?? 1.2) + (adj[profile.goal ?? 'maintain'] ?? 0));
}

const GOAL_LABEL: Record<string, { label: string; focus: string; color: string }> = {
  lose:     { label: 'Lose weight',          focus: 'Lower-carb focus',   color: '#EF4444' },
  gain:     { label: 'Gain weight',          focus: 'High-protein focus', color: '#3B82F6' },
  maintain: { label: 'Maintain weight',      focus: 'Balanced macros',    color: '#10B981' },
  recomp:   { label: 'Body recomposition',   focus: 'Balanced macros',    color: '#8B5CF6' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.macroPill, { backgroundColor: color + '18' }]}>
      <Text style={[styles.macroPillVal, { color }]}>{value}</Text>
      <Text style={[styles.macroPillLabel, { color }]}>{label}</Text>
    </View>
  );
}

function SubscriptionModal({ visible, onClose, colors }: { visible: boolean; onClose: () => void; colors: any }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.subOverlay}>
        <View style={[styles.subModal, { backgroundColor: colors.card }]}>
          <View style={styles.subIconWrap}>
            <Ionicons name="star" size={38} color="#F59E0B" />
          </View>
          <Text style={[styles.subTitle, { color: colors.text }]}>You've used all free refreshes</Text>
          <Text style={[styles.subBody, { color: colors.subText }]}>
            Upgrade to <Text style={{ fontWeight: '900', color: '#1E90D6' }}>NutriFit Pro</Text> for
            unlimited recipe suggestions tailored to your goals.
          </Text>
          <Pressable
            style={styles.subBtn}
            onPress={() => { onClose(); Alert.alert('Coming soon', 'Subscription will be available in a future update.'); }}
          >
            <Text style={styles.subBtnText}>Upgrade to Pro</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.subDismiss}>
            <Text style={[styles.subDismissText, { color: colors.subText }]}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Log Modal ────────────────────────────────────────────────────────────────

function LogModal({
  recipe,
  colors,
  usedRefreshes,
  onAdd,
  onClose,
}: {
  recipe: Recipe | null;
  colors: any;
  usedRefreshes: number;
  onAdd: (meal: MealKey) => void;
  onClose: () => void;
}) {
  const [meal, setMeal] = useState<MealKey>('Breakfast');
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (recipe) {
      setMeal(recipe.mealTypes[0] ?? 'Breakfast');
      setAdded(false);
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [recipe]);

  if (!recipe) return null;
  const totals = getRecipeTotals(recipe);

  function handleAdd() {
    onAdd(meal);
    setAdded(true);
    timer.current = setTimeout(onClose, 1400);
  }

  return (
    <Modal visible={!!recipe} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <Text style={[styles.modalTitle, { color: colors.text }]}>{recipe.name}</Text>
          <Text style={[styles.modalDesc, { color: colors.subText }]}>{recipe.description}</Text>

          {/* Macro row */}
          <View style={styles.modalMacros}>
            <MacroPill label="cal"  value={String(totals.calories)} color="#EF4444" />
            <MacroPill label="prot" value={`${totals.protein}g`}    color="#3B82F6" />
            <MacroPill label="carbs"value={`${totals.carbs}g`}      color="#F59E0B" />
            <MacroPill label="fat"  value={`${totals.fat}g`}        color="#10B981" />
          </View>

          {/* Ingredients */}
          <Text style={[styles.modalSectionLabel, { color: colors.subText }]}>INGREDIENTS</Text>
          {recipe.items.map((item) => (
            <View key={item.id} style={[styles.ingredientRow, { borderColor: colors.border }]}>
              <Text style={[styles.ingredientName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.ingredientMacro, { color: colors.subText }]}>
                {item.calories} cal · P {item.protein}g · C {item.carbs}g · F {item.fat}g
              </Text>
            </View>
          ))}

          {/* Meal selector */}
          <Text style={[styles.modalSectionLabel, { color: colors.subText, marginTop: 14 }]}>ADD TO MEAL</Text>
          <View style={styles.mealRow}>
            {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as MealKey[]).map((m) => {
              const allowed = recipe.mealTypes.includes(m);
              const active  = meal === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => allowed && setMeal(m)}
                  style={[
                    styles.mealChip,
                    { borderColor: colors.border, backgroundColor: colors.background, opacity: allowed ? 1 : 0.35 },
                    active && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.mealChipText, { color: active ? '#FFF' : colors.text }]}>{m}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[styles.addBtn, { backgroundColor: added ? '#22C55E' : colors.primary }]}
            onPress={handleAdd}
          >
            <Ionicons name={added ? 'checkmark-circle-outline' : 'add-circle-outline'} size={20} color="#FFF" />
            <Text style={styles.addBtnText}>{added ? 'Added!' : 'Add to Food Log'}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function RecipeLibraryScreen() {
  const { colors } = useContext(ThemeContext);
  const { totalCalories, addFood } = useNutrition();
  const { profile } = useProfile();

  const calGoal  = useMemo(() => computeCalorieTarget(profile), [profile]);
  const remaining = Math.max(calGoal - totalCalories, 0);
  const goal      = profile.goal ?? 'maintain';
  const goalMeta  = GOAL_LABEL[goal] ?? GOAL_LABEL.maintain;

  // ── filters ──
  const [mealType, setMealType] = useState<MealKey>('Breakfast');
  const [activeTags, setActiveTags] = useState<DietaryTag[]>([]);

  // ── refresh / pagination ──
  const [seed, setSeed]               = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const [showSubModal, setShowSubModal] = useState(false);

  // ── log modal ──
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(REFRESH_KEY).then((v) => {
      if (v) setRefreshCount(parseInt(v, 10) || 0);
    });
  }, []);

  function toggleTag(tag: DietaryTag) {
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  function handleRefresh() {
    if (refreshCount >= FREE_REFRESHES) { setShowSubModal(true); return; }
    const next = refreshCount + 1;
    setRefreshCount(next);
    setSeed((s) => s + 1);
    AsyncStorage.setItem(REFRESH_KEY, String(next));
    if (next >= FREE_REFRESHES) setTimeout(() => setShowSubModal(true), 200);
  }

  const suggestions = useMemo(() => {
    const tagSet = new Set(activeTags);
    const pool = RECIPES.filter((r) => {
      if (!r.mealTypes.includes(mealType)) return false;
      if (!tagSet.size) return true;
      const rTags = new Set(r.dietaryTags ?? []);
      for (const t of tagSet) if (!rTags.has(t)) return false;
      return true;
    });

    const scored = pool.map((r, i) => ({ r, score: scoreRecipe(r, goal, remaining, seed, i) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, PER_PAGE).map((x) => x.r);
  }, [mealType, activeTags, goal, remaining, seed]);

  const handleAddToLog = useCallback((recipe: Recipe, meal: MealKey) => {
    recipe.items.forEach((item: FoodItem, i: number) => {
      addFood(meal, {
        logId: `rec-${recipe.id}-${i}-${Date.now()}`,
        name: item.name,
        caloriesPer100: item.calories,
        proteinPer100:  item.protein,
        carbsPer100:    item.carbs,
        fatPer100:      item.fat,
        servingSize:    100,
        numServings:    1,
        calories: item.calories,
        protein:  item.protein,
        carbs:    item.carbs,
        fat:      item.fat,
        groupId:   recipe.id,
        groupName: recipe.name,
      });
    });
  }, [addFood]);

  const refreshesLeft = FREE_REFRESHES - refreshCount;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />

      <SubscriptionModal visible={showSubModal} onClose={() => setShowSubModal(false)} colors={colors} />

      <LogModal
        recipe={activeRecipe}
        colors={colors}
        usedRefreshes={refreshCount}
        onAdd={(meal) => { if (activeRecipe) handleAddToLog(activeRecipe, meal); }}
        onClose={() => setActiveRecipe(null)}
      />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: 60 }]} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Recipes</Text>
          <View style={[styles.calPill, { borderColor: colors.border }]}>
            <Ionicons name="flame-outline" size={14} color={colors.primary} />
            <Text style={[styles.calPillText, { color: colors.text }]}>{remaining} cal left</Text>
          </View>
        </View>

        {/* Goal banner */}
        <View style={[styles.goalBanner, { backgroundColor: goalMeta.color + '14', borderColor: goalMeta.color + '40' }]}>
          <View style={[styles.goalDot, { backgroundColor: goalMeta.color }]} />
          <View>
            <Text style={[styles.goalLabel, { color: goalMeta.color }]}>{goalMeta.label}</Text>
            <Text style={[styles.goalFocus, { color: goalMeta.color + 'BB' }]}>{goalMeta.focus}</Text>
          </View>
          <Text style={[styles.calTarget, { color: goalMeta.color }]}>{calGoal} cal/day</Text>
        </View>

        {/* Dietary filter chips */}
        <Text style={[styles.filterLabel, { color: colors.subText }]}>DIETARY RESTRICTIONS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
          {DIETARY_TAGS_META.map(({ tag, label, emoji }) => {
            const on = activeTags.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[
                  styles.chip,
                  { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primary : colors.card },
                ]}
              >
                <Text style={styles.chipEmoji}>{emoji}</Text>
                <Text style={[styles.chipText, { color: on ? '#FFF' : colors.text }]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Meal type */}
        <Text style={[styles.filterLabel, { color: colors.subText, marginTop: 16 }]}>MEAL TYPE</Text>
        <View style={styles.mealTypeRow}>
          {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as MealKey[]).map((m) => {
            const on = m === mealType;
            return (
              <Pressable
                key={m}
                onPress={() => setMealType(m)}
                style={[
                  styles.mealTypeBtn,
                  { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primary : colors.card },
                ]}
              >
                <Text style={[styles.mealTypeBtnText, { color: on ? '#FFF' : colors.text }]}>{m}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Results header */}
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsCount, { color: colors.subText }]}>
            {suggestions.length} meal{suggestions.length !== 1 ? 's' : ''}
          </Text>
          <Pressable
            onPress={handleRefresh}
            style={[
              styles.refreshBtn,
              { borderColor: refreshesLeft > 0 ? colors.primary : colors.border,
                backgroundColor: refreshesLeft > 0 ? colors.primary + '15' : colors.card },
            ]}
          >
            <Ionicons name="refresh-outline" size={15} color={refreshesLeft > 0 ? colors.primary : colors.subText} />
            <Text style={[styles.refreshBtnText, { color: refreshesLeft > 0 ? colors.primary : colors.subText }]}>
              {refreshesLeft > 0 ? `Refresh  ·  ${refreshesLeft} left` : 'Subscribe for more'}
            </Text>
          </Pressable>
        </View>

        {/* Recipe cards */}
        {suggestions.length === 0 ? (
          <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Ionicons name="search-outline" size={28} color={colors.subText} />
            <Text style={[styles.emptyText, { color: colors.subText }]}>No recipes match your filters.</Text>
            <Text style={[styles.emptyHint, { color: colors.subText }]}>Try removing a dietary restriction.</Text>
          </View>
        ) : (
          suggestions.map((recipe) => {
            const totals = getRecipeTotals(recipe);
            return (
              <Pressable
                key={recipe.id}
                onPress={() => setActiveRecipe(recipe)}
                style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}
              >
                {/* Name + description */}
                <Text style={[styles.cardName, { color: colors.text }]}>{recipe.name}</Text>
                <Text style={[styles.cardDesc, { color: colors.subText }]} numberOfLines={2}>
                  {recipe.description}
                </Text>

                {/* Macro pills */}
                <View style={styles.cardMacros}>
                  <MacroPill label="cal"  value={String(totals.calories)} color="#EF4444" />
                  <MacroPill label="prot" value={`${totals.protein}g`}    color="#3B82F6" />
                  <MacroPill label="carbs"value={`${totals.carbs}g`}      color="#F59E0B" />
                  <MacroPill label="fat"  value={`${totals.fat}g`}        color="#10B981" />
                </View>

                {/* Tags */}
                {(recipe.dietaryTags ?? []).length > 0 && (
                  <View style={styles.tagRow}>
                    {(recipe.dietaryTags ?? []).slice(0, 4).map((tag) => {
                      const meta = DIETARY_TAGS_META.find((t) => t.tag === tag);
                      return (
                        <View key={tag} style={[styles.tagChip, { borderColor: colors.border, backgroundColor: colors.background }]}>
                          <Text style={[styles.tagChipText, { color: colors.subText }]}>
                            {meta?.emoji} {meta?.label ?? tag}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Tap hint */}
                <View style={styles.tapRow}>
                  <Text style={[styles.tapHint, { color: colors.primary }]}>Tap to add to food log</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
              </Pressable>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 26, fontWeight: '900' },
  calPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  calPillText: { fontWeight: '900', fontSize: 13 },

  goalBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 20,
  },
  goalDot: { width: 10, height: 10, borderRadius: 5 },
  goalLabel: { fontWeight: '900', fontSize: 14 },
  goalFocus: { fontWeight: '700', fontSize: 12, marginTop: 1 },
  calTarget: { fontWeight: '900', fontSize: 13, marginLeft: 'auto' },

  filterLabel: { fontWeight: '900', fontSize: 11, letterSpacing: 0.8, marginBottom: 10 },

  chipScroll: { marginBottom: 4 },
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8,
  },
  chipEmoji: { fontSize: 13 },
  chipText: { fontWeight: '800', fontSize: 13 },

  mealTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  mealTypeBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  mealTypeBtnText: { fontWeight: '900', fontSize: 13 },

  divider: { height: 1, marginBottom: 16 },

  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  resultsCount: { fontWeight: '900', fontSize: 12, letterSpacing: 0.6 },
  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
  },
  refreshBtnText: { fontWeight: '900', fontSize: 13 },

  card: {
    borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 14,
  },
  cardName: { fontSize: 17, fontWeight: '900', marginBottom: 4 },
  cardDesc: { fontSize: 13, fontWeight: '700', lineHeight: 19, marginBottom: 12 },
  cardMacros: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  tagChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  tagChipText: { fontSize: 11, fontWeight: '800' },
  tapRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tapHint: { fontSize: 13, fontWeight: '900' },

  macroPill: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center',
  },
  macroPillVal:   { fontWeight: '900', fontSize: 14 },
  macroPillLabel: { fontWeight: '700', fontSize: 10, marginTop: 1 },

  emptyCard: {
    borderWidth: 1, borderRadius: 20, padding: 28,
    alignItems: 'center', gap: 8,
  },
  emptyText: { fontWeight: '900', fontSize: 15 },
  emptyHint: { fontWeight: '700', fontSize: 13 },

  // Log Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(10,15,30,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    borderWidth: 1, padding: 20, paddingBottom: 36, maxHeight: '90%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 6 },
  modalDesc:  { fontSize: 13, fontWeight: '700', lineHeight: 19, marginBottom: 14 },
  modalMacros: { flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap' },
  modalSectionLabel: { fontWeight: '900', fontSize: 11, letterSpacing: 0.8, marginBottom: 8 },
  ingredientRow: { borderBottomWidth: 1, paddingVertical: 9 },
  ingredientName: { fontWeight: '900', fontSize: 14 },
  ingredientMacro: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  mealRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 18 },
  mealChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  mealChipText: { fontWeight: '900', fontSize: 13 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 16,
  },
  addBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15 },

  // Subscription modal
  subOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  subModal: { borderRadius: 24, padding: 28, width: '100%', alignItems: 'center' },
  subIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  subTitle:   { fontSize: 20, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  subBody:    { fontSize: 14, fontWeight: '700', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  subBtn:     { backgroundColor: '#1E90D6', borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
  subBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  subDismiss: { paddingVertical: 8 },
  subDismissText: { fontWeight: '800', fontSize: 14 },
});

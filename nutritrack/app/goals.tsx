import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '../lib/theme';
import { useNutrition } from '../context/NutritionContext';
import { useProfile } from '../context/ProfileContext';

// ─── TDEE helpers ─────────────────────────────────────────────────────────────

const ACTIVITY_MULTIPLIER: Record<string, number> = {
  sedentary: 1.2,
  light:     1.375,
  moderate:  1.55,
  active:    1.725,
  athlete:   1.9,
};

const GOAL_ADJUSTMENT: Record<string, number> = {
  lose:     -500,
  maintain: 0,
  gain:     300,
  recomp:   0,
};

const GOAL_LABEL: Record<string, string> = {
  lose:     'Lose weight',
  maintain: 'Maintain weight',
  gain:     'Gain weight',
  recomp:   'Body recomposition',
};

const GOAL_COLOR: Record<string, string> = {
  lose:     '#EF4444',
  maintain: '#3B82F6',
  gain:     '#10B981',
  recomp:   '#8B5CF6',
};

const ACTIVITY_LABEL: Record<string, string> = {
  sedentary: 'Sedentary',
  light:     'Lightly active',
  moderate:  'Moderately active',
  active:    'Very active',
  athlete:   'Athlete / super active',
};

interface GoalsData {
  calorieBudget: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  tdee: number;
  goal: string;
  activityLevel: string;
  weightKg: number;
}

function computeGoals(raw: {
  goal: string | null;
  activityLevel: string | null;
  gender: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
}): GoalsData | null {
  const { goal, activityLevel, gender, age, heightCm, weightKg } = raw;
  if (!goal || !activityLevel || !gender || !age || !heightCm || !weightKg) return null;

  // Mifflin-St Jeor BMR
  const bmr =
    gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const multiplier = ACTIVITY_MULTIPLIER[activityLevel] ?? 1.4;
  const tdee = Math.round(bmr * multiplier);
  const calorieBudget = Math.max(1200, tdee + (GOAL_ADJUSTMENT[goal] ?? 0));

  // Macros: protein 1.6g/kg (or 2g for gain), fat 25%, carbs fill rest
  const proteinGoal = Math.round(goal === 'gain' ? weightKg * 2 : weightKg * 1.6);
  const fatGoal = Math.round((calorieBudget * 0.25) / 9);
  const carbsGoal = Math.round((calorieBudget - proteinGoal * 4 - fatGoal * 9) / 4);

  return {
    calorieBudget,
    proteinGoal,
    carbsGoal: Math.max(0, carbsGoal),
    fatGoal,
    tdee,
    goal,
    activityLevel,
    weightKg,
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GoalsScreen() {
  const { colors, mode } = useAppTheme();
  const { totalCalories, totalProtein, totalCarbs, totalFat } = useNutrition();
  const { profile } = useProfile();
  const [goals, setGoals] = useState<GoalsData | null>(null);
  const [missingData, setMissingData] = useState(false);

  useEffect(() => {
    const computed = computeGoals({
      goal:          profile.goal,
      activityLevel: profile.activityLevel,
      gender:        profile.gender,
      age:           profile.age,
      heightCm:      profile.heightCm,
      weightKg:      profile.weightKg,
    });
    if (computed) {
      setGoals(computed);
      setMissingData(false);
    } else {
      setMissingData(true);
    }
  }, [profile]);

  const s = makeStyles(colors);
  const goalColor = goals ? (GOAL_COLOR[goals.goal] ?? colors.primary) : colors.primary;

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.push('/(tabs)/settings' as never)}
          style={[s.backBtn, { borderColor: colors.border }]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[s.topTitle, { color: colors.text }]}>Goals & Progress</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {missingData && !goals ? (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center', paddingVertical: 36 }]}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.subText} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>No profile data</Text>
            <Text style={[s.emptyBody, { color: colors.subText }]}>
              Complete your profile setup so we can compute your calorie and macro targets.
            </Text>
            <Pressable
              style={[s.setupBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/profile' as never)}
            >
              <Text style={s.setupBtnText}>Go to Profile</Text>
            </Pressable>
          </View>
        ) : goals ? (
          <>
            {/* Goal banner */}
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.goalBannerRow}>
                <View style={[s.goalIconWrap, { backgroundColor: goalColor + '22' }]}>
                  <Ionicons name="trophy-outline" size={22} color={goalColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.goalTitle, { color: colors.text }]}>
                    {GOAL_LABEL[goals.goal] ?? goals.goal}
                  </Text>
                  <Text style={[s.goalSub, { color: colors.subText }]}>
                    {ACTIVITY_LABEL[goals.activityLevel] ?? goals.activityLevel}
                  </Text>
                </View>
              </View>

              <View style={[s.tdeeRow, { borderTopColor: colors.border }]}>
                <View style={s.tdeeItem}>
                  <Text style={[s.tdeeVal, { color: colors.text }]}>{goals.tdee}</Text>
                  <Text style={[s.tdeeLbl, { color: colors.subText }]}>TDEE (kcal)</Text>
                </View>
                <View style={[s.tdeeDivider, { backgroundColor: colors.border }]} />
                <View style={s.tdeeItem}>
                  <Text style={[s.tdeeVal, { color: goalColor }]}>{goals.calorieBudget}</Text>
                  <Text style={[s.tdeeLbl, { color: colors.subText }]}>Daily Target</Text>
                </View>
                <View style={[s.tdeeDivider, { backgroundColor: colors.border }]} />
                <View style={s.tdeeItem}>
                  <Text style={[s.tdeeVal, { color: colors.text }]}>
                    {Math.max(0, goals.calorieBudget - totalCalories)}
                  </Text>
                  <Text style={[s.tdeeLbl, { color: colors.subText }]}>Remaining</Text>
                </View>
              </View>
            </View>

            {/* Calorie progress */}
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SectionTitle title="Calories Today" icon="flame-outline" colors={colors} />
              <BigProgressBar
                current={totalCalories}
                target={goals.calorieBudget}
                color={goalColor}
                colors={colors}
                unit="kcal"
              />
            </View>

            {/* Macro targets */}
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SectionTitle title="Macros Today" icon="nutrition-outline" colors={colors} />
              <MacroRow
                label="Protein"
                current={totalProtein}
                target={goals.proteinGoal}
                color="#3B82F6"
                unit="g"
                colors={colors}
              />
              <View style={[s.divider, { backgroundColor: colors.border }]} />
              <MacroRow
                label="Carbs"
                current={totalCarbs}
                target={goals.carbsGoal}
                color="#F59E0B"
                unit="g"
                colors={colors}
              />
              <View style={[s.divider, { backgroundColor: colors.border }]} />
              <MacroRow
                label="Fat"
                current={totalFat}
                target={goals.fatGoal}
                color="#EF4444"
                unit="g"
                colors={colors}
              />
            </View>

            {/* Macro targets reference */}
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SectionTitle title="Daily Targets" icon="flag-outline" colors={colors} />
              <View style={s.targetGrid}>
                <TargetChip label="Calories" value={`${goals.calorieBudget} kcal`} color={goalColor} colors={colors} />
                <TargetChip label="Protein"  value={`${goals.proteinGoal} g`}     color="#3B82F6"   colors={colors} />
                <TargetChip label="Carbs"    value={`${goals.carbsGoal} g`}       color="#F59E0B"   colors={colors} />
                <TargetChip label="Fat"      value={`${goals.fatGoal} g`}         color="#EF4444"   colors={colors} />
              </View>
            </View>

            {/* Weight goal */}
            {profile.weightGoalText && (
              <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <SectionTitle title="Weight Goal" icon="scale-outline" colors={colors} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.subText, marginBottom: 4 }}>Current</Text>
                    <Text style={{ fontSize: 22, fontWeight: '900', color: colors.text }}>{profile.weightText ?? '—'}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color={colors.subText} />
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.subText, marginBottom: 4 }}>Goal</Text>
                    <Text style={{ fontSize: 22, fontWeight: '900', color: goalColor }}>{profile.weightGoalText}</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ title, icon, colors }: { title: string; icon: keyof typeof Ionicons.glyphMap; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={{ fontSize: 15, fontWeight: '900', color: colors.text }}>{title}</Text>
    </View>
  );
}

function BigProgressBar({ current, target, color, colors, unit }: {
  current: number; target: number; color: string; colors: any; unit: string;
}) {
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  const over = current > target;
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: over ? '#EF4444' : colors.text }}>
          {Math.round(current)} <Text style={{ fontSize: 14, fontWeight: '700', color: colors.subText }}>{unit}</Text>
        </Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.subText, alignSelf: 'flex-end', marginBottom: 4 }}>
          / {target} {unit}
        </Text>
      </View>
      <View style={{ height: 12, borderRadius: 6, backgroundColor: colors.border }}>
        <View style={{ height: 12, borderRadius: 6, width: `${Math.round(pct * 100)}%`, backgroundColor: over ? '#EF4444' : color }} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.subText, marginTop: 6 }}>
        {over
          ? `${Math.round(current - target)} ${unit} over target`
          : `${Math.round((pct) * 100)}% of daily goal`}
      </Text>
    </View>
  );
}

function MacroRow({ label, current, target, color, unit, colors }: {
  label: string; current: number; target: number; color: string; unit: string; colors: any;
}) {
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  return (
    <View style={{ paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.subText }}>
          {Math.round(current)} / {target}{unit}
        </Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border }}>
        <View style={{ height: 8, borderRadius: 4, width: `${Math.round(pct * 100)}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}

function TargetChip({ label, value, color, colors }: { label: string; value: string; color: string; colors: any }) {
  return (
    <View style={{ width: '48%', borderRadius: 14, padding: 14, backgroundColor: color + '15', marginBottom: 10 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(colors: any) {
  return StyleSheet.create({
    screen: { flex: 1 },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    },
    topTitle: { fontSize: 18, fontWeight: '900' },
    scroll: { padding: 20, gap: 16 },
    card: { borderRadius: 20, borderWidth: 1, padding: 18 },
    goalBannerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    goalIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    goalTitle: { fontSize: 17, fontWeight: '900' },
    goalSub: { fontSize: 13, fontWeight: '600', marginTop: 2 },
    tdeeRow: {
      flexDirection: 'row', justifyContent: 'space-around',
      borderTopWidth: 1, paddingTop: 16,
    },
    tdeeItem: { alignItems: 'center', flex: 1 },
    tdeeVal: { fontSize: 22, fontWeight: '900' },
    tdeeLbl: { fontSize: 11, fontWeight: '700', marginTop: 4 },
    tdeeDivider: { width: 1, height: '80%', alignSelf: 'center' },
    divider: { height: 1 },
    targetGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 16 },
    emptyBody: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 8, lineHeight: 20 },
    setupBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14 },
    setupBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  });
}

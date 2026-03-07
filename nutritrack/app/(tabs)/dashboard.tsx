// app/(tabs)/dashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { useWater } from '../../context/WaterContext';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  ScrollView,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Line, Text as SvgText } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useContext } from 'react';
import { ThemeContext } from '../../lib/theme';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { router } from 'expo-router';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
function formatDateLong(d: Date) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

type WeekWeight = { day: string; value: number };
type RangeKey = '1W' | '1M' | '2M' | '3M' | '6M' | '1Y';

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}
function avg(arr: number[]) {
  if (!arr.length) return 0;
  return sum(arr) / arr.length;
}
function max(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((m, v) => (v > m ? v : m), arr[0]);
}

function computePercentChange(start: number, current: number) {
  if (!start || start === 0) return 0;
  return ((current - start) / start) * 100;
}
function formatSignedPercent(p: number) {
  const sign = p > 0 ? '+' : '';
  return `${sign}${p.toFixed(1)}%`;
}

function buildXLabels(range: RangeKey, points: number) {
  // Lightweight “date-like” labels for now (mock). Replace with real dates from data later.

  const now = new Date();
  const labels: string[] = [];

  const totalDays =
    range === '1W'
      ? 6
      : range === '1M'
      ? 29
      : range === '2M'
      ? 59
      : range === '3M'
      ? 89
      : range === '6M'
      ? 179
      : 364;

  for (let i = 0; i < points; i++) {
    const t = points === 1 ? 0 : i / (points - 1);
    const daysAgo = Math.round((1 - t) * totalDays);
    const d = new Date(now);
    d.setDate(now.getDate() - daysAgo);

    labels.push(
      d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    );
  }

  return labels;
}

/**
 * Line chart with axes + unit labels.
 * - X axis shows date labels (start/middle/end)
 * - Y axis shows min/mid/max with units
 */
function SimpleLineChart({
  data,
  xLabels,
  yUnit,
  height = 190,
}: {
  data: number[];
  xLabels: string[];
  yUnit: string; // e.g., "lbs" or "steps"
  height?: number;
}) {
  const width = 340; // viewBox width; scales to container width
  const padL = 44; // left padding for Y labels
  const padR = 16;
  const padT = 14;
  const padB = 34; // bottom padding for X labels

  const safe = data.length ? data : [0];
  const minVal = Math.min(...safe);
  const maxVal = Math.max(...safe);
  const span = maxVal - minVal || 1;

  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const points = safe.map((v, i) => {
    const x =
      padL + (safe.length === 1 ? 0 : (i / (safe.length - 1)) * chartW);
    const y = padT + (1 - (v - minVal) / span) * chartH;
    return { x, y, v };
  });

  const d = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  // Y ticks: min, mid, max
  const yMin = minVal;
  const yMid = minVal + span / 2;
  const yMax = maxVal;

  const yToPx = (v: number) => padT + (1 - (v - minVal) / span) * chartH;

  // X labels: show start, mid, end
  const startIdx = 0;
  const midIdx = Math.floor((safe.length - 1) / 2);
  const endIdx = safe.length - 1;

  const pickLabel = (idx: number) => xLabels[idx] ?? '';

  return (
    <View style={styles.chartWrap}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {/* Axes */}
        <Line
          x1={padL}
          y1={padT}
          x2={padL}
          y2={padT + chartH}
          stroke="#CBD5E1"
          strokeWidth={1}
        />
        <Line
          x1={padL}
          y1={padT + chartH}
          x2={padL + chartW}
          y2={padT + chartH}
          stroke="#CBD5E1"
          strokeWidth={1}
        />

        {/* Y ticks + labels */}
        {[yMax, yMid, yMin].map((val, idx) => {
          const y = yToPx(val);
          return (
            <React.Fragment key={`y-${idx}`}>
              <Line
                x1={padL - 4}
                y1={y}
                x2={padL}
                y2={y}
                stroke="#CBD5E1"
                strokeWidth={1}
              />
              <SvgText
                x={padL - 8}
                y={y + 4}
                fontSize="10"
                fill="#64748B"
                textAnchor="end"
              >
                {yUnit === 'steps' ? Math.round(val).toLocaleString() : val.toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Y axis unit label */}
        <SvgText
          x={padL}
          y={12}
          fontSize="10"
          fill="#64748B"
          textAnchor="start"
        >
          {yUnit}
        </SvgText>

        {/* Line path */}
        <Path d={d} stroke="#1E90D6" strokeWidth={3.5} fill="none" />

        {/* Last point dot */}
        {points.length > 0 && (
          <Circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={5}
            fill="#1E90D6"
          />
        )}

        {/* X labels (start / mid / end) */}
        {[
          { idx: startIdx, anchor: 'start' as const },
          { idx: midIdx, anchor: 'middle' as const },
          { idx: endIdx, anchor: 'end' as const },
        ].map(({ idx, anchor }) => {
          const x = points[idx]?.x ?? padL;
          const y = padT + chartH + 18;
          const label = pickLabel(idx);
          return (
            <SvgText
              key={`x-${idx}`}
              x={x}
              y={y}
              fontSize="10"
              fill="#64748B"
              textAnchor={anchor}
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

function RangeTabs({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (k: RangeKey) => void;
}) {
  const items: RangeKey[] = ['1W', '1M', '2M', '3M', '6M', '1Y'];
  return (
    <View style={styles.rangeTabs}>
      {items.map((k) => {
        const active = k === value;
        return (
          <Pressable
            key={k}
            onPress={() => onChange(k)}
            style={[styles.rangeTab, active && styles.rangeTabActive]}
            hitSlop={8}
          >
            <Text style={[styles.rangeTabText, active && styles.rangeTabTextActive]}>
              {k}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function DashboardScreen() {
  const CAL_GOAL = 2360;

  // Fake “today” values for now 
  const { consumedCalories } = useNutrition();
  const {
    waterTodayMl,
    waterGoalMl,
    addWater,
    resetWaterToday,
    waterFromTrackerMl,
  } = useWater();
  const [waterInputMl, setWaterInputMl] = useState('');
  const [caloriesBurned] = useState<number>(0); 
  const [stepsToday] = useState<number>(0);
  const [workouts] = useState<number>(0);

  const [weekWeights] = useState<WeekWeight[]>([
    { day: 'Mon', value: 0 },
    { day: 'Tue', value: 0 },
    { day: 'Wed', value: 0 },
    { day: 'Thu', value: 0 },
    { day: 'Fri', value: 0 },
    { day: 'Sat', value: 0 },
    { day: 'Sun', value: 0 },
  ]);

  // ===== Modals + ranges =====
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [stepsModalOpen, setStepsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [weightRange, setWeightRange] = useState<RangeKey>('1W');
  const [stepsRange, setStepsRange] = useState<RangeKey>('1W');

  /**
   * Example for Demo code 
   */
  const firstName = 'Micheal';
  const email = 'mike@example.com';
  const createdAt = new Date(2026, 1, 1); // Feb 1, 2026 (mock)
  const daysUsingApp = Math.max(
    1,
    Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  );

  const startWeightSelected = 240; // mock
  const foodLoggingStreak = 0; // mock
  const friendsAdded = 0; // mock

  const weightHistoryByRange: Record<RangeKey, number[]> = {
    '1W': [240, 239.6, 239.2, 239.0, 238.7, 238.9, 238.4],
    '1M': [240, 239.2, 238.8, 238.1, 237.6, 237.0, 236.6, 236.2, 235.9, 235.6],
    '2M': [240, 239.0, 238.0, 237.5, 236.8, 236.0, 235.5, 235.0, 234.6, 234.2, 233.9],
    '3M': [240, 238.8, 237.9, 237.1, 236.2, 235.6, 235.0, 234.4, 233.8, 233.2, 232.8],
    '6M': [240, 238.5, 237.0, 235.8, 234.7, 233.9, 232.8, 231.9, 231.0, 230.4],
    '1Y': [240, 238.0, 236.2, 234.7, 233.2, 232.0, 230.8, 229.9, 229.1, 228.6],
  };

  const stepsHistoryByRange: Record<RangeKey, number[]> = {
    '1W': [1200, 3200, 4500, 2100, 7800, 6400, 5200],
    '1M': [2200, 3100, 4800, 5300, 6100, 7200, 6800, 4000, 5200, 7600],
    '2M': [1800, 2400, 3300, 5100, 6000, 7000, 6600, 5400, 4200, 3900, 5800],
    '3M': [1500, 2200, 3100, 4600, 5900, 7100, 6800, 6400, 5100, 4300, 3900],
    '6M': [1600, 2400, 3200, 4000, 5200, 6100, 7200, 6900, 6500, 5800],
    '1Y': [1200, 2000, 3100, 4200, 5200, 6500, 7400, 7000, 6600, 6100],
  };

  const weightSeries = weightHistoryByRange[weightRange];
  const weightX = buildXLabels(weightRange, weightSeries.length);
  const currentWeight = weightSeries[weightSeries.length - 1] ?? startWeightSelected;
  const weightPct = computePercentChange(startWeightSelected, currentWeight);

  const stepsSeries = stepsHistoryByRange[stepsRange];
  const stepsX = buildXLabels(stepsRange, stepsSeries.length);
  const stepsAvg = Math.round(avg(stepsSeries));
  const stepsBest = Math.round(max(stepsSeries));
  const stepsTotal = Math.round(sum(stepsSeries));

  const remaining = Math.max(CAL_GOAL - consumedCalories, 0);

  const progress = useMemo(() => {
    if (CAL_GOAL <= 0) return 0;
    return Math.min(consumedCalories / CAL_GOAL, 1);
  }, [consumedCalories, CAL_GOAL]);

  // Water: total = manual + from tracker, progress for circle
  const waterTotalMl = waterTodayMl + waterFromTrackerMl;
  const waterProgress = useMemo(() => {
    if (waterGoalMl <= 0) return 0;
    return Math.min(waterTotalMl / waterGoalMl, 1);
  }, [waterTotalMl, waterGoalMl]);

  // Circle progress setup
  const SIZE = 170;
  const STROKE = 14;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  const dashOffset = C * (1 - progress);

  // Water circle (smaller) — animated
  const WATER_SIZE = 120;
  const WATER_STROKE = 10;
  const WATER_R = (WATER_SIZE - WATER_STROKE) / 2;
  const WATER_C = 2 * Math.PI * WATER_R;
  const waterOffsetShared = useSharedValue(WATER_C);
  useEffect(() => {
    waterOffsetShared.value = withTiming(WATER_C * (1 - waterProgress), {
      duration: 400,
    });
  }, [waterProgress, WATER_C]);
  const animatedWaterProps = useAnimatedProps(() => ({
    strokeDashoffset: waterOffsetShared.value,
  }));

  const todayLabel = formatDateLong(new Date());

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => setProfileModalOpen(true)}
            style={styles.avatarCircle}
            hitSlop={10}
          >
            <Ionicons name="person-outline" size={18} color="#1E90D6" />
          </Pressable>

          <Text style={styles.brand}>NUTRIFIT</Text>

          <Pressable style={styles.iconBtn} hitSlop={10}>
            <Ionicons name="notifications-outline" size={20} color="#0B2C5E" />
          </Pressable>
        </View>

        {/* Today */}
        <View style={styles.todayRow}>
          <Text style={styles.todayTitle}>Today</Text>
          <Pressable
            style={styles.editBtn}
            hitSlop={10}
            onPress={async () => {
              await signOut(auth);
              router.replace('/login');
            }}
          >
            <Text style={styles.editText}>Logout</Text>
          </Pressable>
        </View>

        {/* Logging Progress (non-interactive now) */}
        <View style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <Text style={styles.progressSmall}>Logging Progress</Text>
            {/* ✅ removed add icon (non-interactive) */}
          </View>

          <View style={styles.progressBottomRow}>
            <Text style={styles.progressMuted}>
              You’ve logged <Text style={styles.progressAccent}>0 meals</Text> and{' '}
              <Text style={styles.progressAccent}>0g of protein</Text> today.
            </Text>

            {/* ✅ removed chevron indicator (non-interactive) */}
          </View>
        </View>

        {/* Calories section */}
        <View style={styles.calSectionTitleWrap}>
          <Text style={styles.calDate}>{todayLabel}</Text>
          <Text style={styles.calTitle}>Calories</Text>
          {/* ✅ removed "Remaining = ..." definition line */}
        </View>

        <View style={styles.caloriesCard}>
          {/* Left: circle */}
          <View style={styles.circleWrap}>
            <Svg width={SIZE} height={SIZE}>
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                stroke="#E5E7EB"
                strokeWidth={STROKE}
                fill="none"
              />
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                stroke="#1E90D6"
                strokeWidth={STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${C} ${C}`}
                strokeDashoffset={dashOffset}
                rotation="-90"
                originX={SIZE / 2}
                originY={SIZE / 2}
              />
            </Svg>

            <View style={styles.circleCenter}>
              <Text style={styles.circleNumber}>{remaining}</Text>
              <Text style={styles.circleLabel}>Remaining</Text>
            </View>
          </View>

          {/* Right: breakdown */}
          <View style={styles.calBreakdown}>
            <View style={styles.breakRow}>
              <Ionicons name="flag-outline" size={18} color="#0B2C5E" />
              <View style={{ flex: 1 }}>
                <Text style={styles.breakLabel}>Base Goal</Text>
              </View>
              <Text style={styles.breakValue}>{CAL_GOAL}</Text>
            </View>

            <View style={styles.breakRow}>
              <Ionicons name="restaurant-outline" size={18} color="#1E90D6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.breakLabel}>Food</Text>
              </View>
              <Text style={styles.breakValue}>{consumedCalories}</Text>
            </View>

            {/* ✅ Add burned but do NOT use in remaining calc */}
            <View style={styles.breakRow}>
              <Ionicons name="flame-outline" size={18} color="#F59E0B" />
              <View style={{ flex: 1 }}>
                <Text style={styles.breakLabel}>Burned</Text>
              </View>
              <Text style={styles.breakValue}>{caloriesBurned}</Text>
            </View>
          </View>
        </View>

        {/* Water intake */}
        <Text style={styles.waterSectionTitle}>Water</Text>
        <View style={styles.waterCard}>
          <View style={styles.waterCircleWrap}>
            <Svg width={WATER_SIZE} height={WATER_SIZE}>
              <Circle
                cx={WATER_SIZE / 2}
                cy={WATER_SIZE / 2}
                r={WATER_R}
                stroke="#E5E7EB"
                strokeWidth={WATER_STROKE}
                fill="none"
              />
              <AnimatedCircle
                cx={WATER_SIZE / 2}
                cy={WATER_SIZE / 2}
                r={WATER_R}
                stroke="#1E90D6"
                strokeWidth={WATER_STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${WATER_C} ${WATER_C}`}
                rotation="-90"
                originX={WATER_SIZE / 2}
                originY={WATER_SIZE / 2}
                animatedProps={animatedWaterProps}
              />
            </Svg>
            <View style={styles.waterCircleCenter}>
              <Text style={styles.waterCircleNumber}>{waterTotalMl}</Text>
              <Text style={styles.waterCircleLabel}>ml of {waterGoalMl}</Text>
            </View>
          </View>
          <View style={styles.waterRight}>
            <View style={styles.waterBreakRow}>
              <Ionicons name="water-outline" size={18} color="#1E90D6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.breakLabel}>Goal</Text>
              </View>
              <Text style={styles.breakValue}>{waterGoalMl} ml</Text>
            </View>
            <View style={styles.waterBreakRow}>
              <Ionicons name="add-circle-outline" size={18} color="#0B2C5E" />
              <View style={{ flex: 1 }}>
                <Text style={styles.breakLabel}>Logged</Text>
              </View>
              <Text style={styles.breakValue}>{waterTodayMl} ml</Text>
            </View>
            {waterFromTrackerMl > 0 && (
              <View style={styles.waterBreakRow}>
                <Ionicons name="fitness-outline" size={18} color="#64748B" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.breakLabel}>From tracker</Text>
                </View>
                <Text style={styles.breakValue}>{waterFromTrackerMl} ml</Text>
              </View>
            )}
            <View style={styles.waterInputRow}>
              <TextInput
                style={styles.waterInput}
                placeholder="Amount (ml)"
                placeholderTextColor="#94A3B8"
                value={waterInputMl}
                onChangeText={setWaterInputMl}
                keyboardType="number-pad"
              />
              <Pressable
                style={styles.waterAddBtn}
                onPress={() => {
                  const ml = parseInt(waterInputMl.replace(/\D/g, ''), 10);
                  if (!Number.isNaN(ml) && ml > 0) {
                    addWater(ml);
                    setWaterInputMl('');
                  }
                }}
              >
                <Text style={styles.waterAddBtnText}>Add</Text>
              </Pressable>
              <Pressable
                style={styles.waterSubtractBtn}
                onPress={() => {
                  const ml = parseInt(waterInputMl.replace(/\D/g, ''), 10);
                  if (!Number.isNaN(ml) && ml > 0) {
                    addWater(-ml);
                    setWaterInputMl('');
                  }
                }}
              >
                <Text style={styles.waterSubtractBtnText}>Subtract</Text>
              </Pressable>
            </View>
            <Pressable style={styles.waterResetBtn} onPress={resetWaterToday}>
              <Ionicons name="refresh-outline" size={16} color="#64748B" />
              <Text style={styles.waterResetBtnText}>Reset today</Text>
            </Pressable>
          </View>
        </View>

        {/* Bento section */}
        <Text style={styles.bentoTitle}>This week</Text>

        <View style={styles.bentoGrid}>
          {/* Weight - clickable */}
          <Pressable
            onPress={() => setWeightModalOpen(true)}
            style={[styles.bentoCard, styles.bentoWide]}
          >
            <View style={styles.bentoHeader}>
              <View style={styles.bentoIconCircle}>
                <Ionicons name="scale-outline" size={18} color="#0B2C5E" />
              </View>
              <Text style={styles.bentoHeaderText}>Weight</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>

            <Text style={styles.bentoHint}>Trend over the last 7 days</Text>

            <View style={styles.weightRow}>
              {weekWeights.map((w) => (
                <View key={w.day} style={styles.weightCol}>
                  <View style={styles.weightPill}>
                    <Text style={styles.weightValue}>
                      {w.value === 0 ? '—' : w.value.toFixed(1)}
                    </Text>
                  </View>
                  <Text style={styles.weightDay}>{w.day}</Text>
                </View>
              ))}
            </View>
          </Pressable>

          {/* Steps - clickable */}
          <Pressable onPress={() => setStepsModalOpen(true)} style={styles.bentoCard}>
            <View style={styles.bentoHeader}>
              <View style={styles.bentoIconCircle}>
                <Ionicons name="walk-outline" size={18} color="#0B2C5E" />
              </View>
              <Text style={styles.bentoHeaderText}>Steps</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>

            <Text style={styles.bigMetric}>{stepsToday.toLocaleString()}</Text>
            <Text style={styles.mutedMetric}>Today</Text>
          </Pressable>

          {/* Workouts */}
          <View style={styles.bentoCard}>
            <View style={styles.bentoHeader}>
              <View style={styles.bentoIconCircle}>
                <Ionicons name="barbell-outline" size={18} color="#0B2C5E" />
              </View>
              <Text style={styles.bentoHeaderText}>Workouts</Text>
            </View>

            <Text style={styles.bigMetric}>{workouts}</Text>
            <Text style={styles.mutedMetric}>This week</Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ================= Profile Top Sheet ================= */}
      <Modal
        visible={profileModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setProfileModalOpen(false)}
      >
        <Pressable style={styles.modalBackdropTop} onPress={() => setProfileModalOpen(false)}>
          {/* Prevent closing when tapping inside sheet */}
          <Pressable style={styles.topSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile</Text>
              <Pressable onPress={() => setProfileModalOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#0B2C5E" />
              </Pressable>
            </View>

            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>First name</Text>
                <Text style={styles.infoValue}>{firstName}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{email}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Time using app</Text>
                <Text style={styles.infoValue}>{daysUsingApp} day(s)</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Start weight</Text>
                <Text style={styles.infoValue}>{startWeightSelected.toFixed(1)} lbs</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current weight</Text>
                <Text style={styles.infoValue}>{currentWeight.toFixed(1)} lbs</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Food logging streak</Text>
                <Text style={styles.infoValue}>{foodLoggingStreak} day(s)</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Friends added</Text>
                <Text style={styles.infoValue}>{friendsAdded}</Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ================= Weight Modal ================= */}
      <Modal
        visible={weightModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setWeightModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setWeightModalOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Weight</Text>
              <Pressable onPress={() => setWeightModalOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#0B2C5E" />
              </Pressable>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Start</Text>
                <Text style={styles.statValue}>{startWeightSelected.toFixed(1)} lbs</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Current</Text>
                <Text style={styles.statValue}>{currentWeight.toFixed(1)} lbs</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Change</Text>
                {/* ✅ no positive/negative color */}
                <Text style={styles.statValue}>{formatSignedPercent(weightPct)}</Text>
              </View>
            </View>

            <RangeTabs value={weightRange} onChange={setWeightRange} />

            <SimpleLineChart data={weightSeries} xLabels={weightX} yUnit="lbs" />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ================= Steps Modal ================= */}
      <Modal
        visible={stepsModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setStepsModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setStepsModalOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Steps</Text>
              <Pressable onPress={() => setStepsModalOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#0B2C5E" />
              </Pressable>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Average</Text>
                <Text style={styles.statValue}>{stepsAvg.toLocaleString()}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Best</Text>
                <Text style={styles.statValue}>{stepsBest.toLocaleString()}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total</Text>
                <Text style={styles.statValue}>{stepsTotal.toLocaleString()}</Text>
              </View>
            </View>

            <RangeTabs value={stepsRange} onChange={setStepsRange} />

            <SimpleLineChart data={stepsSeries} xLabels={stepsX} yUnit="steps" />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 20, paddingTop: 56 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: '#1E90D6',
    fontWeight: '900',
    letterSpacing: 1.2,
    fontSize: 18,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  todayTitle: { fontSize: 28, fontWeight: '900', color: '#0B2C5E' },
  editBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  editText: { color: '#1E90D6', fontWeight: '900' },

  progressCard: {
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 18,
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressSmall: { color: '#64748B', fontWeight: '800', fontSize: 12 },
  progressBottomRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressMuted: { flex: 1, color: '#64748B', fontWeight: '700' },
  progressAccent: { color: '#1E90D6', fontWeight: '900' },

  calSectionTitleWrap: { marginBottom: 10 },
  calDate: { color: '#0B2C5E', fontWeight: '900', fontSize: 13, marginBottom: 6 },
  calTitle: { color: '#0B2C5E', fontWeight: '900', fontSize: 26 },

  caloriesCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },

  circleWrap: { width: 180, alignItems: 'center', justifyContent: 'center' },
  circleCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  circleNumber: { color: '#0B2C5E', fontSize: 34, fontWeight: '900' },
  circleLabel: { color: '#64748B', fontWeight: '800', marginTop: 2 },

  calBreakdown: { flex: 1, gap: 14 },
  breakRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakLabel: { color: '#64748B', fontWeight: '800' },
  breakValue: { color: '#0B2C5E', fontWeight: '900', fontSize: 18 },

  waterSectionTitle: {
    color: '#0B2C5E',
    fontWeight: '900',
    fontSize: 26,
    marginTop: 20,
    marginBottom: 10,
  },
  waterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    gap: 16,
  },
  waterCircleWrap: { alignItems: 'center', justifyContent: 'center' },
  waterCircleCenter: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterCircleNumber: { color: '#0B2C5E', fontSize: 24, fontWeight: '900' },
  waterCircleLabel: { color: '#64748B', fontWeight: '800', fontSize: 11, marginTop: 2 },
  waterRight: { flex: 1, gap: 10 },
  waterBreakRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  waterInputRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' },
  waterInput: {
    flex: 1,
    minWidth: 100,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    color: '#0B2C5E',
    fontWeight: '800',
    fontSize: 15,
  },
  waterAddBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1E90D6',
  },
  waterAddBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  waterSubtractBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  waterSubtractBtnText: { color: '#0B2C5E', fontWeight: '900', fontSize: 15 },
  waterResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  waterResetBtnText: { color: '#64748B', fontWeight: '700', fontSize: 13 },

  bentoTitle: { color: '#0B2C5E', fontWeight: '900', fontSize: 18, marginBottom: 10 },
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bentoCard: {
    width: '48%',
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  bentoWide: { width: '100%' },

  bentoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  bentoIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoHeaderText: { color: '#0B2C5E', fontWeight: '900', fontSize: 16 },
  bentoHint: { color: '#64748B', fontWeight: '700', marginBottom: 12 },

  weightRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weightCol: { alignItems: 'center', gap: 6, flex: 1 },
  weightPill: {
    width: '90%',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightValue: { color: '#0B2C5E', fontWeight: '900' },
  weightDay: { color: '#64748B', fontWeight: '800', fontSize: 12 },

  bigMetric: { color: '#0B2C5E', fontSize: 30, fontWeight: '900', marginTop: 4 },
  mutedMetric: { color: '#64748B', fontWeight: '800', marginTop: 4 },

  // ===== Modal styles (tap backdrop to close) =====
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#E5E7EB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0B2C5E' },

  statRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    padding: 12,
  },
  statLabel: { color: '#64748B', fontWeight: '800', marginBottom: 6, fontSize: 12 },
  statValue: { color: '#0B2C5E', fontWeight: '900', fontSize: 18 },

  rangeTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  rangeTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  rangeTabActive: { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' },
  rangeTabText: { color: '#64748B', fontWeight: '900', fontSize: 12 },
  rangeTabTextActive: { color: '#1E90D6' },

  chartWrap: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 10,
  },

  // ===== Profile top sheet =====
  modalBackdropTop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-start',
  },
  topSheet: {
    marginTop: 56,
    marginHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  infoList: { gap: 12, marginTop: 4 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: { color: '#64748B', fontWeight: '800' },
  infoValue: { color: '#0B2C5E', fontWeight: '900' },
});
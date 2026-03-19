// app/(tabs)/dashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { useWater } from '../../context/WaterContext';
import {
  View,
  Text,
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
import { useAppTheme } from '../../lib/theme';
import { LightColors } from '../../lib/theme';
import { router } from 'expo-router';
import { useProfile } from '../../context/ProfileContext';

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

/** Returns the Mon–Sun dates of the ISO week containing `ref`. */
function getWeekDays(ref: Date): Date[] {
  const d = new Date(ref);
  // getDay() is 0=Sun…6=Sat; we want Mon=0 offset
  const day = d.getDay(); // 0=Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const copy = new Date(d);
    copy.setDate(d.getDate() + i);
    return copy;
  });
}

/** Tiny ring chart for the calendar modal */
function MiniRing({
  progress,
  size = 44,
  stroke = 5,
  primaryColor,
  trackColor,
}: {
  progress: number; // 0–1 clamped
  size?: number;
  stroke?: number;
  primaryColor: string;
  trackColor: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(Math.max(progress, 0), 1));
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={trackColor}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={primaryColor}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={offset}
        rotation="-90"
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  );
}

function makeStyles(c: typeof LightColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
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
      borderColor: c.border,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitials: {
      fontSize: 15,
      fontWeight: '900',
      color: c.primary,
    },
    brand: {
      color: c.primary,
      fontWeight: '900',
      letterSpacing: 1.2,
      fontSize: 18,
    },
    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.background,
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
    todayTitle: { fontSize: 28, fontWeight: '900', color: c.text },
    editBtn: {
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    editText: { color: c.primary, fontWeight: '900' },

    progressCard: {
      borderRadius: 20,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginBottom: 18,
    },
    progressTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progressSmall: { color: c.subText, fontWeight: '800', fontSize: 12 },
    progressBottomRow: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    progressMuted: { flex: 1, color: c.subText, fontWeight: '700' },
    progressAccent: { color: c.primary, fontWeight: '900' },

    calSectionTitleWrap: { marginBottom: 10 },
    calDate: { color: c.text, fontWeight: '900', fontSize: 13, marginBottom: 6 },
    calTitle: { color: c.text, fontWeight: '900', fontSize: 26 },

    caloriesCard: {
      borderRadius: 22,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 18,
    },

    circleWrap: { width: 180, alignItems: 'center', justifyContent: 'center' },
    circleCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    circleNumber: { color: c.text, fontSize: 34, fontWeight: '900' },
    circleLabel: { color: c.subText, fontWeight: '800', marginTop: 2 },

    calBreakdown: { flex: 1, gap: 14 },
    breakRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    breakLabel: { color: c.subText, fontWeight: '800' },
    breakValue: { color: c.text, fontWeight: '900', fontSize: 18 },

    waterSectionTitle: {
      color: c.text,
      fontWeight: '900',
      fontSize: 26,
      marginTop: 20,
      marginBottom: 10,
    },
    waterCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 18,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
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
    waterCircleNumber: { color: c.text, fontSize: 24, fontWeight: '900' },
    waterCircleLabel: { color: c.subText, fontWeight: '800', fontSize: 11, marginTop: 2 },
    waterRight: { flex: 1, gap: 10 },
    waterBreakRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    waterInputRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' },
    waterInput: {
      flex: 1,
      minWidth: 100,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingHorizontal: 14,
      color: c.text,
      fontWeight: '800',
      fontSize: 15,
    },
    waterAddBtn: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: c.primary,
    },
    waterAddBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
    waterSubtractBtn: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    waterSubtractBtnText: { color: c.text, fontWeight: '900', fontSize: 15 },
    waterResetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
    },
    waterResetBtnText: { color: c.subText, fontWeight: '700', fontSize: 13 },

    bentoTitle: { color: c.text, fontWeight: '900', fontSize: 18, marginBottom: 10 },
    bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    bentoCard: {
      width: '48%',
      borderRadius: 18,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
    },
    bentoWide: { width: '100%' },

    bentoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    bentoIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bentoHeaderText: { color: c.text, fontWeight: '900', fontSize: 16 },
    bentoHint: { color: c.subText, fontWeight: '700', marginBottom: 12 },

    weightRow: { flexDirection: 'row', justifyContent: 'space-between' },
    weightCol: { alignItems: 'center', gap: 6, flex: 1 },
    weightPill: {
      width: '90%',
      borderRadius: 14,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weightValue: { color: c.text, fontWeight: '900' },
    weightDay: { color: c.subText, fontWeight: '800', fontSize: 12 },

    bigMetric: { color: c.text, fontSize: 30, fontWeight: '900', marginTop: 4 },
    mutedMetric: { color: c.subText, fontWeight: '800', marginTop: 4 },

    // ===== Modal styles =====
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      padding: 16,
      borderWidth: Platform.OS === 'web' ? 1 : 0,
      borderColor: c.border,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    modalTitle: { fontSize: 20, fontWeight: '900', color: c.text },

    statRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    statCard: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: 12,
    },
    statLabel: { color: c.subText, fontWeight: '800', marginBottom: 6, fontSize: 12 },
    statValue: { color: c.text, fontWeight: '900', fontSize: 18 },

    rangeTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    rangeTab: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    rangeTabActive: { borderColor: c.primary, backgroundColor: c.card },
    rangeTabText: { color: c.subText, fontWeight: '900', fontSize: 12 },
    rangeTabTextActive: { color: c.primary },

    chartWrap: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      padding: 10,
    },

    // ===== Profile top sheet =====
    modalBackdropTop: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      justifyContent: 'flex-start',
    },
    topSheet: {
      marginTop: 56,
      marginHorizontal: 16,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      padding: 16,
    },
    infoList: { gap: 12, marginTop: 4 },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    infoLabel: { color: c.subText, fontWeight: '800' },
    infoValue: { color: c.text, fontWeight: '900' },

    // ===== Calendar modal =====
    calModalSheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      padding: 20,
      paddingBottom: 36,
      borderWidth: Platform.OS === 'web' ? 1 : 0,
      borderColor: c.border,
    },
    calWeekRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    calDayCell: {
      alignItems: 'center',
      gap: 4,
      flex: 1,
    },
    calDayLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: c.subText,
      marginBottom: 2,
    },
    calDayNumberWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    calDayNumberToday: {
      backgroundColor: c.primary,
    },
    calDayNumberText: {
      fontSize: 13,
      fontWeight: '900',
      color: c.text,
    },
    calDayNumberTextToday: {
      color: '#FFFFFF',
    },
    calDayCalText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.subText,
    },
    calSelectedDivider: {
      height: 1,
      backgroundColor: c.border,
      marginBottom: 18,
    },
    calSelectedRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    calSelectedBlock: {
      alignItems: 'center',
      gap: 6,
    },
    calSelectedLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: c.subText,
    },
    calSelectedValue: {
      fontSize: 40,
      fontWeight: '900',
      color: c.text,
    },
    calSelectedUnit: {
      fontSize: 13,
      fontWeight: '700',
      color: c.subText,
    },

    // ── Calendar period tabs ──────────────────────────────────────────────────
    calPeriodTabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    calPeriodTab: {
      flex: 1, paddingVertical: 8, borderRadius: 10,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.background, alignItems: 'center',
    },
    calPeriodTabActive: { borderColor: c.primary, backgroundColor: c.card },
    calPeriodTabText: { fontWeight: '800', fontSize: 13, color: c.subText },
    calPeriodTabTextActive: { color: c.primary },

    // ── Calendar nav row ─────────────────────────────────────────────────────
    calNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    calNavBtn: { padding: 6 },
    calNavLabel: { fontWeight: '900', fontSize: 15, color: c.text },

    // ── Month grid ────────────────────────────────────────────────────────────
    calMonthGrid: { marginBottom: 4 },

    // ── Year grid ─────────────────────────────────────────────────────────────
    calYearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    calYearMonthCell: {
      width: '30%', borderRadius: 12, borderWidth: 1,
      borderColor: c.border, backgroundColor: c.card, padding: 10, alignItems: 'center', gap: 4,
    },
    calYearMonthLabel: { fontWeight: '800', fontSize: 14, color: c.text },
    calYearMonthCal: { fontSize: 10, fontWeight: '700', color: c.subText },
  });
}

/**
 * Line chart with axes + unit labels.
 */
function SimpleLineChart({
  data,
  xLabels,
  yUnit,
  height = 190,
  colors,
}: {
  data: number[];
  xLabels: string[];
  yUnit: string;
  height?: number;
  colors: typeof LightColors;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const width = 340;
  const padL = 44;
  const padR = 16;
  const padT = 14;
  const padB = 34;

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

  const yMin = minVal;
  const yMid = minVal + span / 2;
  const yMax = maxVal;

  const yToPx = (v: number) => padT + (1 - (v - minVal) / span) * chartH;

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
          stroke={colors.border}
          strokeWidth={1}
        />
        <Line
          x1={padL}
          y1={padT + chartH}
          x2={padL + chartW}
          y2={padT + chartH}
          stroke={colors.border}
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
                stroke={colors.border}
                strokeWidth={1}
              />
              <SvgText
                x={padL - 8}
                y={y + 4}
                fontSize="10"
                fill={colors.subText}
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
          fill={colors.subText}
          textAnchor="start"
        >
          {yUnit}
        </SvgText>

        {/* Line path */}
        <Path d={d} stroke={colors.primary} strokeWidth={3.5} fill="none" />

        {/* Last point dot */}
        {points.length > 0 && (
          <Circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={5}
            fill={colors.primary}
          />
        )}

        {/* X labels */}
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
              fill={colors.subText}
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
  colors,
}: {
  value: RangeKey;
  onChange: (k: RangeKey) => void;
  colors: typeof LightColors;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
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

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_NAMES_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const firstDow = firstDay.getDay(); // 0=Sun
  const mondayOffset = firstDow === 0 ? 6 : firstDow - 1;
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = Array(mondayOffset).fill(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    currentWeek.push(new Date(year, month, d));
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }
  return weeks;
}

function formatWeekRange(days: Date[]): string {
  const first = days[0];
  const last  = days[6];
  if (first.getMonth() === last.getMonth()) {
    return `${MONTH_NAMES[first.getMonth()]} ${first.getDate()}–${last.getDate()}`;
  }
  return `${MONTH_NAMES[first.getMonth()]} ${first.getDate()} – ${MONTH_NAMES[last.getMonth()]} ${last.getDate()}`;
}

export default function DashboardScreen() {
  const CAL_GOAL = 2360;

  const { totalCalories, totalProtein, loggedMealsCount } = useNutrition();
  const {
    waterTodayMl,
    waterGoalMl,
    waterFromTrackerMl,
  } = useWater();

  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { profile: userProfile } = useProfile();

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
  const [calendarVisible, setCalendarVisible] = useState(false);

  const [weightRange, setWeightRange] = useState<RangeKey>('1W');
  const [stepsRange, setStepsRange] = useState<RangeKey>('1W');

  // ─── Calendar state ─────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  type CalPeriod = 'week' | 'month' | 'year';
  const [calPeriod, setCalPeriod]         = useState<CalPeriod>('week');
  const [calWeekOffset, setCalWeekOffset] = useState(0);
  const [calMonthOffset, setCalMonthOffset] = useState(0);
  const [calYearOffset, setCalYearOffset] = useState(0);
  const [selectedDate, setSelectedDate]   = useState<Date>(today);

  const displayedWeekDays = useMemo(() => {
    const ref = new Date(today);
    ref.setDate(today.getDate() + calWeekOffset * 7);
    return getWeekDays(ref);
  }, [calWeekOffset]);

  const displayedMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + calMonthOffset, 1),
    [calMonthOffset],
  );

  const displayedYear = today.getFullYear() + calYearOffset;

  const monthGrid = useMemo(
    () => getMonthGrid(displayedMonth.getFullYear(), displayedMonth.getMonth()),
    [displayedMonth],
  );

  function calForDate(d: Date) {
    return d.toDateString() === today.toDateString() ? totalCalories : 0;
  }
  function proteinForDate(d: Date) {
    return d.toDateString() === today.toDateString() ? totalProtein : 0;
  }

  const selectedCal     = calForDate(selectedDate);
  const selectedProtein = proteinForDate(selectedDate);

  const startWeightSelected = 240;
  const foodLoggingStreak = userProfile.activeStreak;

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

  const remaining = Math.max(CAL_GOAL - totalCalories, 0);

  const progress = useMemo(() => {
    if (CAL_GOAL <= 0) return 0;
    return Math.min(totalCalories / CAL_GOAL, 1);
  }, [totalCalories, CAL_GOAL]);

  // Water: total = manual + from tracker
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
      <StatusBar
        barStyle={colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => setProfileModalOpen(true)}
            style={styles.avatarCircle}
            hitSlop={10}
          >
            {userProfile.initials !== '?'
              ? <Text style={styles.avatarInitials}>{userProfile.initials}</Text>
              : <Ionicons name="person-outline" size={18} color={colors.primary} />
            }
          </Pressable>

          <Text style={styles.brand}>NUTRIFIT</Text>

          <Pressable style={styles.iconBtn} hitSlop={10} onPress={() => router.push('/notifications' as never)}>
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Today */}
        <View style={styles.todayRow}>
          <Text style={styles.todayTitle}>Today</Text>
        </View>

        {/* Logging Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <Text style={styles.progressSmall}>Logging Progress</Text>
          </View>

          <View style={styles.progressBottomRow}>
            <Text style={styles.progressMuted}>
              {"You've logged "}
              <Text style={styles.progressAccent}>{loggedMealsCount} meal{loggedMealsCount !== 1 ? 's' : ''}</Text>
              {' and '}
              <Text style={styles.progressAccent}>{totalProtein}g of protein</Text>
              {' today.'}
            </Text>
          </View>
        </View>

        {/* Calories section */}
        <View style={styles.calSectionTitleWrap}>
          <Text style={styles.calDate}>{todayLabel}</Text>
          <Text style={styles.calTitle}>Calories</Text>
        </View>

        {/* Calories card — tappable to open calendar */}
        <Pressable onPress={() => setCalendarVisible(true)}>
          <View style={styles.caloriesCard}>
            {/* Left: circle */}
            <View style={styles.circleWrap}>
              <Svg width={SIZE} height={SIZE}>
                <Circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  stroke={colors.border}
                  strokeWidth={STROKE}
                  fill="none"
                />
                <Circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  stroke={colors.primary}
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
                <Ionicons name="flag-outline" size={18} color={colors.text} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.breakLabel}>Base Goal</Text>
                </View>
                <Text style={styles.breakValue}>{CAL_GOAL}</Text>
              </View>

              <View style={styles.breakRow}>
                <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.breakLabel}>Food</Text>
                </View>
                <Text style={styles.breakValue}>{totalCalories}</Text>
              </View>

              <View style={styles.breakRow}>
                <Ionicons name="flame-outline" size={18} color="#F59E0B" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.breakLabel}>Burned</Text>
                </View>
                <Text style={styles.breakValue}>{caloriesBurned}</Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Water intake */}
        <Text style={styles.waterSectionTitle}>Water</Text>
        <View style={styles.waterCard}>
          <View style={styles.waterCircleWrap}>
            <Svg width={WATER_SIZE} height={WATER_SIZE}>
              <Circle
                cx={WATER_SIZE / 2}
                cy={WATER_SIZE / 2}
                r={WATER_R}
                stroke={colors.border}
                strokeWidth={WATER_STROKE}
                fill="none"
              />
              <AnimatedCircle
                cx={WATER_SIZE / 2}
                cy={WATER_SIZE / 2}
                r={WATER_R}
                stroke={colors.primary}
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
              <Ionicons name="water-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.breakLabel}>Goal</Text>
              </View>
              <Text style={styles.breakValue}>{waterGoalMl} ml</Text>
            </View>
            <View style={styles.waterBreakRow}>
              <Ionicons name="add-circle-outline" size={18} color={colors.text} />
              <View style={{ flex: 1 }}>
                <Text style={styles.breakLabel}>Logged</Text>
              </View>
              <Text style={styles.breakValue}>{waterTodayMl} ml</Text>
            </View>
            {waterFromTrackerMl > 0 && (
              <View style={styles.waterBreakRow}>
                <Ionicons name="fitness-outline" size={18} color={colors.subText} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.breakLabel}>From tracker</Text>
                </View>
                <Text style={styles.breakValue}>{waterFromTrackerMl} ml</Text>
              </View>
            )}
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
                <Ionicons name="scale-outline" size={18} color={colors.text} />
              </View>
              <Text style={styles.bentoHeaderText}>Weight</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={18} color={colors.subText} />
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
                <Ionicons name="walk-outline" size={18} color={colors.text} />
              </View>
              <Text style={styles.bentoHeaderText}>Steps</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={18} color={colors.subText} />
            </View>

            <Text style={styles.bigMetric}>{stepsToday.toLocaleString()}</Text>
            <Text style={styles.mutedMetric}>Today</Text>
          </Pressable>

          {/* Workouts */}
          <View style={styles.bentoCard}>
            <View style={styles.bentoHeader}>
              <View style={styles.bentoIconCircle}>
                <Ionicons name="barbell-outline" size={18} color={colors.text} />
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
          <Pressable style={styles.topSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile</Text>
              <Pressable onPress={() => setProfileModalOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{userProfile.fullName ?? '—'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userProfile.email ?? '—'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>
                  {userProfile.gender ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1) : '—'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{userProfile.age !== null ? `${userProfile.age} yrs` : '—'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Streak</Text>
                <Text style={styles.infoValue}>{foodLoggingStreak} day{foodLoggingStreak !== 1 ? 's' : ''}</Text>
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
                <Ionicons name="close" size={22} color={colors.text} />
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
                <Text style={styles.statValue}>{formatSignedPercent(weightPct)}</Text>
              </View>
            </View>

            <RangeTabs value={weightRange} onChange={setWeightRange} colors={colors} />

            <SimpleLineChart data={weightSeries} xLabels={weightX} yUnit="lbs" colors={colors} />
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
                <Ionicons name="close" size={22} color={colors.text} />
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

            <RangeTabs value={stepsRange} onChange={setStepsRange} colors={colors} />

            <SimpleLineChart data={stepsSeries} xLabels={stepsX} yUnit="steps" colors={colors} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ================= Calendar Modal ================= */}
      {/* ================= Calendar Modal ================= */}
      <Modal
        visible={calendarVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCalendarVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCalendarVisible(false)}>
          <Pressable style={[styles.calModalSheet, { maxHeight: '88%' }]} onPress={() => {}}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Calories</Text>
              <Pressable onPress={() => setCalendarVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            {/* Period selector */}
            <View style={styles.calPeriodTabs}>
              {(['week', 'month', 'year'] as Array<'week' | 'month' | 'year'>).map((p) => (
                <Pressable
                  key={p}
                  style={[styles.calPeriodTab, calPeriod === p && styles.calPeriodTabActive]}
                  onPress={() => setCalPeriod(p)}
                >
                  <Text style={[styles.calPeriodTabText, calPeriod === p && styles.calPeriodTabTextActive]}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Navigation */}
            <View style={styles.calNavRow}>
              <Pressable
                style={styles.calNavBtn}
                hitSlop={10}
                onPress={() => {
                  if (calPeriod === 'week') setCalWeekOffset((o) => o - 1);
                  else if (calPeriod === 'month') setCalMonthOffset((o) => o - 1);
                  else setCalYearOffset((o) => o - 1);
                }}
              >
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </Pressable>
              <Text style={styles.calNavLabel}>
                {calPeriod === 'week'
                  ? calWeekOffset === 0 ? 'This Week' : formatWeekRange(displayedWeekDays)
                  : calPeriod === 'month'
                  ? `${MONTH_NAMES_LONG[displayedMonth.getMonth()]} ${displayedMonth.getFullYear()}`
                  : String(displayedYear)}
              </Text>
              <Pressable
                style={styles.calNavBtn}
                hitSlop={10}
                onPress={() => {
                  if (calPeriod === 'week') setCalWeekOffset((o) => o + 1);
                  else if (calPeriod === 'month') setCalMonthOffset((o) => o + 1);
                  else setCalYearOffset((o) => o + 1);
                }}
              >
                <Ionicons name="chevron-forward" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ minHeight: 320 }}>
              {/* ── Week view ── */}
              {calPeriod === 'week' && (
                <View style={styles.calWeekRow}>
                  {displayedWeekDays.map((d, idx) => {
                    const isToday    = d.toDateString() === today.toDateString();
                    const isSelected = d.toDateString() === selectedDate.toDateString();
                    const cal     = calForDate(d);
                    const calProg = CAL_GOAL > 0 ? Math.min(cal / CAL_GOAL, 1) : 0;
                    return (
                      <Pressable key={idx} style={styles.calDayCell} onPress={() => setSelectedDate(new Date(d))}>
                        <Text style={[styles.calDayLabel, isSelected && { color: colors.primary }]}>
                          {DAY_SHORT[idx]}
                        </Text>
                        <View style={[
                          styles.calDayNumberWrap,
                          isToday && styles.calDayNumberToday,
                          isSelected && !isToday && { borderWidth: 1.5, borderColor: colors.primary },
                        ]}>
                          <Text style={[
                            styles.calDayNumberText,
                            isToday && styles.calDayNumberTextToday,
                            isSelected && !isToday && { color: colors.primary },
                          ]}>
                            {d.getDate()}
                          </Text>
                        </View>
                        <MiniRing
                          progress={calProg}
                          primaryColor={isSelected ? colors.primary : colors.subText}
                          trackColor={colors.border}
                        />
                        <Text style={styles.calDayCalText}>{cal > 0 ? String(cal) : ''}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* ── Month view ── */}
              {calPeriod === 'month' && (
                <View style={styles.calMonthGrid}>
                  {/* Day headers */}
                  <View style={[styles.calWeekRow, { marginBottom: 6 }]}>
                    {DAY_SHORT.map((d) => (
                      <View key={d} style={styles.calDayCell}>
                        <Text style={styles.calDayLabel}>{d}</Text>
                      </View>
                    ))}
                  </View>
                  {/* Week rows */}
                  {monthGrid.map((week, wi) => (
                    <View key={wi} style={[styles.calWeekRow, { marginBottom: 8 }]}>
                      {week.map((d, di) => {
                        if (!d) return <View key={di} style={styles.calDayCell} />;
                        const isToday    = d.toDateString() === today.toDateString();
                        const isSelected = d.toDateString() === selectedDate.toDateString();
                        const cal     = calForDate(d);
                        const calProg = CAL_GOAL > 0 ? Math.min(cal / CAL_GOAL, 1) : 0;
                        return (
                          <Pressable key={di} style={styles.calDayCell} onPress={() => setSelectedDate(new Date(d))}>
                            <View style={[
                              styles.calDayNumberWrap,
                              isToday && styles.calDayNumberToday,
                              isSelected && !isToday && { borderWidth: 1.5, borderColor: colors.primary },
                            ]}>
                              <Text style={[
                                styles.calDayNumberText,
                                isToday && styles.calDayNumberTextToday,
                                isSelected && !isToday && { color: colors.primary },
                              ]}>
                                {d.getDate()}
                              </Text>
                            </View>
                            <MiniRing
                              progress={calProg}
                              size={28}
                              stroke={3}
                              primaryColor={isSelected ? colors.primary : colors.subText}
                              trackColor={colors.border}
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </View>
              )}

              {/* ── Year view ── */}
              {calPeriod === 'year' && (
                <View style={styles.calYearGrid}>
                  {Array.from({ length: 12 }, (_, i) => {
                    const isCurrentMonth = i === today.getMonth() && displayedYear === today.getFullYear();
                    const isSelectedMonth = selectedDate.getMonth() === i && selectedDate.getFullYear() === displayedYear;
                    return (
                      <Pressable
                        key={i}
                        style={[
                          styles.calYearMonthCell,
                          isCurrentMonth && { borderColor: colors.primary },
                          isSelectedMonth && { backgroundColor: colors.primary + '22' },
                        ]}
                        onPress={() => {
                          const monthDiff = (displayedYear - today.getFullYear()) * 12 + (i - today.getMonth());
                          setCalMonthOffset(monthDiff);
                          setCalPeriod('month');
                          setSelectedDate(isCurrentMonth ? new Date(today) : new Date(displayedYear, i, 1));
                        }}
                      >
                        <Text style={[styles.calYearMonthLabel, isSelectedMonth && { color: colors.primary }]}>
                          {MONTH_NAMES[i]}
                        </Text>
                        {isCurrentMonth && (
                          <Text style={styles.calYearMonthCal}>{totalCalories} kcal</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Divider */}
              <View style={styles.calSelectedDivider} />

              {/* Selected day summary */}
              <View style={styles.calSelectedRow}>
                <View style={styles.calSelectedBlock}>
                  <Text style={styles.calSelectedLabel}>
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.calSelectedValue}>{selectedCal}</Text>
                  <Text style={styles.calSelectedUnit}>kcal</Text>
                </View>
                <View style={styles.calSelectedBlock}>
                  <Text style={styles.calSelectedLabel}>Protein</Text>
                  <Text style={styles.calSelectedValue}>{selectedProtein}</Text>
                  <Text style={styles.calSelectedUnit}>g</Text>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

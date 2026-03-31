import AsyncStorage from '@react-native-async-storage/async-storage';

const SNAPSHOTS_KEY = '@nutritrack/daily_snapshots_v1';

function computeHydrationPct(waterTotalMl: number, waterGoalMl: number): number {
  if (waterGoalMl <= 0) return 0;
  return Math.min(100, Math.round((waterTotalMl / waterGoalMl) * 100));
}
/** Must match WaterContext: `${WATER_STORAGE_KEY}_${dateKey}` */
const WATER_PREFIX = '@nutritrack/water_';

export type DaySnapshot = {
  mealsLoggedSections: number;
  /** Total kcal logged that day (older snapshots may omit) */
  caloriesTotal?: number;
  waterTotalMl: number;
  waterGoalMl: number;
  steps: number;
  workoutsToday: number;
  hydrationPct: number;
  updatedAt: number;
};

export type WeekTotals = {
  stepsWeekTotal: number;
  workoutsWeekTotal: number;
  mealsLoggedSectionsWeekTotal: number;
  /** Sum of kcal logged per day across the week */
  caloriesWeekTotal: number;
  waterWeekMlTotal: number;
  waterGoalMl: number;
  hydrationWeekAvgPct: number;
  /** Days in the week with at least one meal section logged */
  daysWithMealsLogged: number;
};

export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday 00:00 local for the week containing `d`. */
export function getMondayOfWeekLocal(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

/** Seven local date keys Monday → Sunday for the week containing `refDate`. */
export function getMonSunDateKeysLocal(refDate: Date): string[] {
  const mon = getMondayOfWeekLocal(refDate);
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const t = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i);
    keys.push(localDateKey(t));
  }
  return keys;
}

async function loadSnapshotMap(): Promise<Record<string, DaySnapshot>> {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, DaySnapshot>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function mergeTodaySnapshot(input: {
  mealsLoggedSections: number;
  caloriesTotal: number;
  waterTotalMl: number;
  waterGoalMl: number;
  steps: number;
  workoutsToday: number;
}): Promise<void> {
  const todayKey = localDateKey(new Date());
  const map = await loadSnapshotMap();
  const hydrationPct = computeHydrationPct(input.waterTotalMl, input.waterGoalMl);
  map[todayKey] = {
    mealsLoggedSections: input.mealsLoggedSections,
    caloriesTotal: Math.max(0, Math.round(input.caloriesTotal)),
    waterTotalMl: input.waterTotalMl,
    waterGoalMl: input.waterGoalMl,
    steps: input.steps,
    workoutsToday: input.workoutsToday,
    hydrationPct,
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(map));
}

async function waterMlForDay(dayKey: string, snap?: DaySnapshot): Promise<number> {
  if (snap && typeof snap.waterTotalMl === 'number') return snap.waterTotalMl;
  try {
    const wStr = await AsyncStorage.getItem(`${WATER_PREFIX}${dayKey}`);
    if (wStr != null) return parseInt(wStr, 10) || 0;
  } catch {
    /* ignore */
  }
  return 0;
}

/** Sum Mon–Sun local week from stored daily snapshots + water keys. */
export async function aggregateWeekMonSunNow(): Promise<WeekTotals> {
  const keys = getMonSunDateKeysLocal(new Date());
  const map = await loadSnapshotMap();
  let goal = 2000;

  let stepsWeekTotal = 0;
  let workoutsWeekTotal = 0;
  let mealsLoggedSectionsWeekTotal = 0;
  let caloriesWeekTotal = 0;
  let waterWeekMlTotal = 0;
  const hydrationSamples: number[] = [];
  let daysWithMealsLogged = 0;

  for (const dayKey of keys) {
    const snap = map[dayKey];
    if (snap?.waterGoalMl) goal = snap.waterGoalMl;

    const wMl = await waterMlForDay(dayKey, snap);
    waterWeekMlTotal += wMl;

    if (snap) {
      stepsWeekTotal += snap.steps ?? 0;
      workoutsWeekTotal += snap.workoutsToday ?? 0;
      mealsLoggedSectionsWeekTotal += snap.mealsLoggedSections ?? 0;
      caloriesWeekTotal += typeof snap.caloriesTotal === 'number' ? snap.caloriesTotal : 0;
      if (typeof snap.hydrationPct === 'number') hydrationSamples.push(snap.hydrationPct);
      if ((snap.mealsLoggedSections ?? 0) >= 1) daysWithMealsLogged += 1;
    } else {
      if (wMl > 0 && hydrationSamples.length < 7) {
        const pct = computeHydrationPct(wMl, goal);
        hydrationSamples.push(pct);
      }
    }
  }

  const hydrationWeekAvgPct =
    hydrationSamples.length > 0
      ? Math.round(hydrationSamples.reduce((a, b) => a + b, 0) / hydrationSamples.length)
      : 0;

  return {
    stepsWeekTotal,
    workoutsWeekTotal,
    mealsLoggedSectionsWeekTotal,
    caloriesWeekTotal,
    waterWeekMlTotal,
    waterGoalMl: goal,
    hydrationWeekAvgPct,
    daysWithMealsLogged,
  };
}

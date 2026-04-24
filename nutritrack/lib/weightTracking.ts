import AsyncStorage from '@react-native-async-storage/async-storage';

const WEIGHT_HISTORY_KEY = '@nutritrack/weight_history_v1';
const WEIGHT_START_KEY = '@nutritrack/weight_start_v1';

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weightKg: number;
  weightLbs: number;
}

export interface WeightStart {
  weightKg: number;
  weightLbs: number;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function loadWeightHistory(): Promise<WeightEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(WEIGHT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WeightEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && typeof e.date === 'string' && Number.isFinite(e.weightKg) && Number.isFinite(e.weightLbs))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export async function upsertTodayWeight(weightKg: number, weightLbs: number): Promise<void> {
  const today = dateKey(new Date());
  const history = await loadWeightHistory();
  const next = history.filter((e) => e.date !== today);
  next.push({
    date: today,
    weightKg: Math.round(weightKg * 10) / 10,
    weightLbs: Math.round(weightLbs * 10) / 10,
  });
  next.sort((a, b) => a.date.localeCompare(b.date));
  await AsyncStorage.setItem(WEIGHT_HISTORY_KEY, JSON.stringify(next));
}

export async function loadStartWeight(): Promise<WeightStart | null> {
  try {
    const raw = await AsyncStorage.getItem(WEIGHT_START_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeightStart;
    if (!parsed || !Number.isFinite(parsed.weightKg) || !Number.isFinite(parsed.weightLbs)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function ensureStartWeight(weightKg: number, weightLbs: number): Promise<void> {
  const existing = await loadStartWeight();
  if (existing) return;
  const start: WeightStart = {
    weightKg: Math.round(weightKg * 10) / 10,
    weightLbs: Math.round(weightLbs * 10) / 10,
  };
  await AsyncStorage.setItem(WEIGHT_START_KEY, JSON.stringify(start));
}

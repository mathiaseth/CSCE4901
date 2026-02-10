// nutritrack/lib/motivation.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_ENABLED = 'motivation_enabled';
const KEY_LAST_SHOWN = 'motivation_last_shown_date';

export const MOTIVATION_QUOTES = [
  "Small steps, big results.",
  "You’ve got this today.",
  "Consistency beats intensity.",
  "Progress, not perfection.",
  "Fuel your goals.",
  "Show up for yourself.",
  "One good choice at a time.",
  "Discipline is self-respect.",
  "Keep going—you’re building momentum.",
  "Your future self says thanks.",
];

export function todayKey(): string {
  // local date string like 2026-02-09
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function getMotivationEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY_ENABLED);
  if (v === null) return true; // default ON
  return v === 'true';
}

export async function setMotivationEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_ENABLED, String(enabled));
}

export async function wasShownToday(): Promise<boolean> {
  const last = await AsyncStorage.getItem(KEY_LAST_SHOWN);
  return last === todayKey();
}

export async function markShownToday(): Promise<void> {
  await AsyncStorage.setItem(KEY_LAST_SHOWN, todayKey());
}

export function randomQuote(): string {
  const i = Math.floor(Math.random() * MOTIVATION_QUOTES.length);
  return MOTIVATION_QUOTES[i];
}

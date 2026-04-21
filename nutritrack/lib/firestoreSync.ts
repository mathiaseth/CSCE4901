/**
 * firestoreSync.ts
 * Central helpers for syncing profile, food logs, and water data
 * between AsyncStorage (local cache) and Firestore (cloud source of truth).
 *
 * Strategy: write-through cache
 *   - Reads:  AsyncStorage first (fast), fallback to Firestore on fresh login
 *   - Writes: AsyncStorage immediately, Firestore shortly after (debounced by callers)
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';

// ─── Profile ──────────────────────────────────────────────────────────────────

const PROFILE_KEYS = [
  'onboard.fullName',
  'onboard.gender',
  'onboard.dob',
  'onboard.units',
  'onboard.heightFt',
  'onboard.heightIn',
  'onboard.heightCm',
  'onboard.weightLbs',
  'onboard.weightKg',
  'onboard.weightGoalLbs',
  'onboard.weightGoalKg',
  'onboard.goal',
  'onboard.activity',
] as const;

/** Read all onboard.* keys from AsyncStorage and write them to Firestore. */
export async function saveProfileToFirestore(uid: string): Promise<void> {
  const pairs = await AsyncStorage.multiGet([...PROFILE_KEYS]);
  const data: Record<string, string> = {};
  for (const [key, val] of pairs) {
    if (val !== null) data[key] = val;
  }
  await setDoc(
    doc(db, 'users', uid, 'private', 'profile'),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/**
 * Load profile from Firestore and populate AsyncStorage.
 * Returns true if data was found and written.
 */
export async function loadProfileFromFirestore(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'private', 'profile'));
    if (!snap.exists()) return false;
    const data = snap.data() as Record<string, any>;
    const toSet: [string, string][] = [];
    for (const key of PROFILE_KEYS) {
      if (data[key] != null) toSet.push([key, String(data[key])]);
    }
    if (toSet.length > 0) await AsyncStorage.multiSet(toSet);
    return toSet.length > 0;
  } catch {
    return false;
  }
}

// ─── Food Logs ────────────────────────────────────────────────────────────────

type Meals = Record<string, any[]>;

const mealsLocalKey = (date: string) => `@nutritrack/meals_${date}`;

/** Save meals to Firestore for a given date. */
export async function saveMealsToFirestore(
  uid: string,
  dateKey: string,
  meals: Meals
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'logs', dateKey),
    { meals, updatedAt: serverTimestamp() },
    { merge: false }
  );
}

/** Load meals from Firestore for a given date. Returns null if none found. */
export async function loadMealsFromFirestore(
  uid: string,
  dateKey: string
): Promise<Meals | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'logs', dateKey));
    if (!snap.exists()) return null;
    return (snap.data().meals as Meals) ?? null;
  } catch {
    return null;
  }
}

/** Save meals to AsyncStorage (local cache). */
export async function saveMealsLocally(dateKey: string, meals: Meals): Promise<void> {
  await AsyncStorage.setItem(mealsLocalKey(dateKey), JSON.stringify(meals));
}

/** Load meals from AsyncStorage. Returns null if none found. */
export async function loadMealsLocally(dateKey: string): Promise<Meals | null> {
  try {
    const raw = await AsyncStorage.getItem(mealsLocalKey(dateKey));
    if (!raw) return null;
    return JSON.parse(raw) as Meals;
  } catch {
    return null;
  }
}

// ─── Water ────────────────────────────────────────────────────────────────────

/** Save water intake + goal to Firestore for a given date. */
export async function saveWaterToFirestore(
  uid: string,
  dateKey: string,
  waterMl: number,
  goalMl: number
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'water', dateKey),
    { waterMl, goalMl, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Load water data from Firestore for a given date. Returns null if none found. */
export async function loadWaterFromFirestore(
  uid: string,
  dateKey: string
): Promise<{ waterMl: number; goalMl: number } | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'water', dateKey));
    if (!snap.exists()) return null;
    const d = snap.data();
    return { waterMl: d.waterMl ?? 0, goalMl: d.goalMl ?? 2000 };
  } catch {
    return null;
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface AccountProfileData {
  fullName?: string;
  email?: string;
  gender?: string;
  dob?: string;
  units?: 'imperial' | 'metric';
  heightFt?: string;
  heightIn?: string;
  heightCm?: string;
  weightLbs?: string;
  weightKg?: string;
  goal?: string;
  activity?: string;
  weightGoalLbs?: string;
  weightGoalKg?: string;
}

const STORAGE_TO_FIELD: Array<[string, keyof AccountProfileData]> = [
  ['onboard.fullName', 'fullName'],
  ['onboard.email', 'email'],
  ['onboard.gender', 'gender'],
  ['onboard.dob', 'dob'],
  ['onboard.units', 'units'],
  ['onboard.heightFt', 'heightFt'],
  ['onboard.heightIn', 'heightIn'],
  ['onboard.heightCm', 'heightCm'],
  ['onboard.weightLbs', 'weightLbs'],
  ['onboard.weightKg', 'weightKg'],
  ['onboard.goal', 'goal'],
  ['onboard.activity', 'activity'],
  ['onboard.weightGoalLbs', 'weightGoalLbs'],
  ['onboard.weightGoalKg', 'weightGoalKg'],
];

function getProfileRef(uid: string) {
  return doc(db, 'userProfiles', uid);
}

export async function readOnboardingDataFromStorage(): Promise<AccountProfileData> {
  const pairs = await AsyncStorage.multiGet(STORAGE_TO_FIELD.map(([k]) => k));
  const out: AccountProfileData = {};

  for (const [storageKey, field] of STORAGE_TO_FIELD) {
    const pair = pairs.find(([k]) => k === storageKey);
    const value = pair?.[1];
    if (value && value.trim().length > 0) {
      out[field] = value as never;
    }
  }

  return out;
}

export async function writeOnboardingDataToStorage(data: Partial<AccountProfileData>): Promise<void> {
  const pairs: [string, string][] = [];
  for (const [storageKey, field] of STORAGE_TO_FIELD) {
    const value = data[field];
    if (typeof value === 'string' && value.trim().length > 0) {
      pairs.push([storageKey, value]);
    }
  }
  if (pairs.length > 0) {
    await AsyncStorage.multiSet(pairs);
  }
}

export async function loadAccountProfileForCurrentUser(opts?: {
  syncToStorage?: boolean;
}): Promise<AccountProfileData | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  try {
    const snap = await getDoc(getProfileRef(uid));
    if (!snap.exists()) return null;

    const data = snap.data() as AccountProfileData;
    if (opts?.syncToStorage) {
      await writeOnboardingDataToStorage(data);
    }
    return data;
  } catch (e) {
    // Do not block local profile usage if cloud permissions are not ready.
    if (__DEV__) {
      console.warn('[accountProfile] cloud read failed, using local storage fallback:', e);
    }
    return null;
  }
}

export async function saveAccountProfileForCurrentUser(
  partial: Partial<AccountProfileData>,
  opts?: { syncToStorage?: boolean }
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const payload: Record<string, unknown> = {};
  for (const [_, field] of STORAGE_TO_FIELD) {
    const value = partial[field];
    if (typeof value === 'string' && value.trim().length > 0) {
      payload[field] = value;
    }
  }
  if (Object.keys(payload).length === 0) return;

  try {
    await setDoc(
      getProfileRef(uid),
      {
        ...payload,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    // Keep local experience working even when cloud write is denied/unavailable.
    if (__DEV__) {
      console.warn('[accountProfile] cloud write failed; local data still saved:', e);
    }
  }

  if (opts?.syncToStorage) {
    await writeOnboardingDataToStorage(payload as Partial<AccountProfileData>);
  }
}

export async function syncOnboardingStorageToCurrentUserProfile(): Promise<void> {
  const localData = await readOnboardingDataFromStorage();
  await saveAccountProfileForCurrentUser(localData);
}

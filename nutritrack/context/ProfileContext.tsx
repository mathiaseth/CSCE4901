import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { loadProfileFromFirestore } from '../lib/firestoreSync';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileUnits = 'imperial' | 'metric' | null;

export interface UserProfile {
  // Identity
  fullName: string | null;
  email: string | null;
  initials: string;
  memberSince: string | null;

  // Personal
  gender: string | null;
  dob: string | null;   // formatted e.g. "March 5, 2000"
  age: number | null;

  // Physical
  units: ProfileUnits;
  heightText: string | null;   // formatted e.g. "5 ft 11 in" or "180 cm"
  weightText: string | null;   // formatted e.g. "175 lbs" or "79.4 kg"
  weightKg: number | null;     // raw kg for calculations
  weightLbs: number | null;    // raw lbs for calculations
  heightCm: number | null;     // raw cm for calculations

  // Goal & Activity
  goal: string | null;
  activityLevel: string | null;

  // Weight goal
  weightGoalKg: number | null;
  weightGoalLbs: number | null;
  weightGoalText: string | null;

  // Streak (placeholder — replace with real tracking later)
  activeStreak: number;
  longestStreak: number;
  totalTrackedDays: number;
}

interface ProfileContextType {
  profile: UserProfile;
  reload: () => Promise<void>;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  fullName: null, email: null, initials: '?', memberSince: null,
  gender: null, dob: null, age: null,
  units: null, heightText: null, weightText: null,
  weightKg: null, weightLbs: null, heightCm: null,
  goal: null, activityLevel: null,
  weightGoalKg: null, weightGoalLbs: null, weightGoalText: null,
  activeStreak: 0, longestStreak: 0, totalTrackedDays: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInitials(name: string | null, email: string | null): string {
  if (name && name.trim()) {
    return name.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  }
  if (email) return email[0].toUpperCase();
  return '?';
}

function calcAge(dobIso: string): number | null {
  const d = new Date(dobIso);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

function formatDob(dobIso: string): string | null {
  const d = new Date(dobIso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ProfileContext = createContext<ProfileContextType>({
  profile: DEFAULT_PROFILE,
  reload: async () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const load = useCallback(async () => {
    try {
      const [
        namePair, genderPair, dobPair, unitsPair,
        hFtPair, hInPair, hCmPair, wLbsPair, wKgPair,
        goalPair, activityPair, wGoalLbsPair, wGoalKgPair,
      ] = await AsyncStorage.multiGet([
        'onboard.fullName', 'onboard.gender', 'onboard.dob', 'onboard.units',
        'onboard.heightFt', 'onboard.heightIn', 'onboard.heightCm',
        'onboard.weightLbs', 'onboard.weightKg',
        'onboard.goal', 'onboard.activity',
        'onboard.weightGoalLbs', 'onboard.weightGoalKg',
      ]);

      const name     = namePair[1] ?? null;
      const gender   = genderPair[1] ?? null;
      const dobRaw   = dobPair[1] ?? null;
      const units    = (unitsPair[1] ?? null) as ProfileUnits;

      const hFt       = hFtPair[1]      ? parseInt(hFtPair[1],   10) : null;
      const hIn       = hInPair[1]      ? parseInt(hInPair[1],   10) : null;
      const hCm       = hCmPair[1]      ? parseFloat(hCmPair[1])    : null;
      const wLbs      = wLbsPair[1]     ? parseFloat(wLbsPair[1])   : null;
      const wKg       = wKgPair[1]      ? parseFloat(wKgPair[1])    : null;
      const wGoalLbs  = wGoalLbsPair[1] ? parseFloat(wGoalLbsPair[1]) : null;
      const wGoalKg   = wGoalKgPair[1]  ? parseFloat(wGoalKgPair[1])  : null;

      let heightText: string | null = null;
      let weightText: string | null = null;
      let weightGoalText: string | null = null;
      if (units === 'imperial') {
        if (hFt !== null && hIn !== null) heightText = `${hFt} ft ${hIn} in`;
        if (wLbs !== null && wLbs > 0)   weightText = `${wLbs} lbs`;
        if (wGoalLbs !== null && wGoalLbs > 0) weightGoalText = `${wGoalLbs} lbs`;
      } else if (units === 'metric') {
        if (hCm !== null && hCm > 0)  heightText = `${hCm} cm`;
        if (wKg  !== null && wKg > 0) weightText = `${wKg} kg`;
        if (wGoalKg !== null && wGoalKg > 0) weightGoalText = `${wGoalKg} kg`;
      }

      const dob = dobRaw ? formatDob(dobRaw) : null;
      const age = dobRaw ? calcAge(dobRaw)   : null;

      const user = auth.currentUser;
      const email = user?.email ?? null;
      const memberSince = user?.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : null;

      setProfile({
        fullName: name,
        email,
        initials: buildInitials(name, email),
        memberSince,
        gender, dob, age,
        units, heightText, weightText,
        weightKg: wKg && wKg > 0 ? wKg : null,
        weightLbs: wLbs && wLbs > 0 ? wLbs : null,
        heightCm: hCm && hCm > 0 ? hCm : null,
        goal:          goalPair[1]     ?? null,
        activityLevel: activityPair[1] ?? null,
        weightGoalKg:   wGoalKg  && wGoalKg  > 0 ? wGoalKg  : null,
        weightGoalLbs:  wGoalLbs && wGoalLbs > 0 ? wGoalLbs : null,
        weightGoalText,
        activeStreak: 0,
        longestStreak: 0,
        totalTrackedDays: 0,
      });
    } catch (e) {
      console.warn('ProfileContext: failed to load', e);
    }
  }, []);

  // On auth state change: pull from Firestore first (so local cache is fresh), then load into state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Pull cloud data into AsyncStorage, then load into state
        await loadProfileFromFirestore(user.uid).catch(() => {});
      }
      await load();
    });
    return unsub;
  }, [load]);

  return (
    <ProfileContext.Provider value={{ profile, reload: load }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}

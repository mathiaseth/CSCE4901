import type { Timestamp } from 'firebase/firestore';

export type PublicMetrics = {
  stepsToday: number;
  /** Sessions logged today (0 until per-day tracking exists). */
  workoutsToday: number;
  workoutsThisWeek: number;
  mealsLoggedToday: number;
  /** Total kcal logged today (older sync payloads may omit) */
  caloriesToday?: number;
  waterTotalMl: number;
  waterGoalMl: number;
  hydrationPct: number;
  streak: number;
  /** UTC YYYY-MM-DD — metrics reset when app day rolls (same as sync time) */
  dayKey: string;
};

/** Weekly aggregates synced from daily snapshots (local calendar week). */
export type PublicMetricsWeekly = {
  stepsWeekTotal: number;
  workoutsWeekTotal: number;
  /** Sum of meal sections logged per day across the week */
  mealsLoggedSectionsWeekTotal: number;
  /** Sum of kcal logged per day across the week (older sync payloads may omit) */
  caloriesWeekTotal?: number;
  waterWeekMlTotal: number;
  waterGoalMl: number;
  hydrationWeekAvgPct: number;
  streak: number;
  weekKey: string;
  /** Legacy fields (older app versions) */
  mealsWeekEstimate?: number;
  waterWeekMlEstimate?: number;
  hydrationWeekPct?: number;
  workoutsThisWeek?: number;
};

export type PublicUserDoc = {
  emailLower: string;
  displayName: string;
  initials: string;
  /** Daily snapshot (today) */
  metrics: PublicMetrics;
  /** Weekly aggregates for leaderboard */
  metricsWeekly?: PublicMetricsWeekly;
  metricsUpdatedAt: Timestamp | null;
  profileUpdatedAt: Timestamp | null;
};

export type FriendRequestDoc = {
  fromUid: string;
  toUid: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type FriendshipDoc = {
  uidA: string;
  uidB: string;
  createdAt: Timestamp | null;
};

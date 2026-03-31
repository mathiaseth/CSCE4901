import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { PublicMetrics, PublicMetricsWeekly } from './types';
import type { WeekTotals } from '../dailyStatsSnapshot';

function utcDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function computeHydrationPct(waterTotalMl: number, waterGoalMl: number): number {
  if (waterGoalMl <= 0) return 0;
  return Math.min(100, Math.round((waterTotalMl / waterGoalMl) * 100));
}

export async function syncMyMetricsToFirestore(
  uid: string,
  input: {
    daily: {
      stepsToday: number;
      workoutsToday: number;
      workoutsThisWeek: number;
      mealsLoggedToday: number;
      caloriesToday: number;
      waterTotalMl: number;
      waterGoalMl: number;
      streak: number;
    };
    weekly: WeekTotals & { streak: number };
  }
): Promise<void> {
  const metrics: PublicMetrics = {
    stepsToday: input.daily.stepsToday,
    workoutsToday: input.daily.workoutsToday,
    workoutsThisWeek: input.daily.workoutsThisWeek,
    mealsLoggedToday: input.daily.mealsLoggedToday,
    caloriesToday: input.daily.caloriesToday,
    waterTotalMl: input.daily.waterTotalMl,
    waterGoalMl: input.daily.waterGoalMl,
    hydrationPct: computeHydrationPct(input.daily.waterTotalMl, input.daily.waterGoalMl),
    streak: input.daily.streak,
    dayKey: utcDayKey(),
  };

  const w = input.weekly;
  const metricsWeekly: PublicMetricsWeekly = {
    stepsWeekTotal: w.stepsWeekTotal,
    workoutsWeekTotal: w.workoutsWeekTotal,
    mealsLoggedSectionsWeekTotal: w.mealsLoggedSectionsWeekTotal,
    caloriesWeekTotal: w.caloriesWeekTotal,
    waterWeekMlTotal: w.waterWeekMlTotal,
    waterGoalMl: w.waterGoalMl,
    hydrationWeekAvgPct: w.hydrationWeekAvgPct,
    streak: w.streak,
    weekKey: isoWeekKey(),
  };

  await setDoc(
    doc(db, 'users', uid),
    {
      metrics,
      metricsWeekly,
      metricsUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

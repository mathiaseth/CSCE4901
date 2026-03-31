import React, { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useProfile } from '../context/ProfileContext';
import { useNutrition } from '../context/NutritionContext';
import { useWater } from '../context/WaterContext';
import { upsertPublicUserProfile } from '../lib/social/userPublic';
import { syncMyMetricsToFirestore } from '../lib/social/metrics';
import { mergeTodaySnapshot, aggregateWeekMonSunNow } from '../lib/dailyStatsSnapshot';
import {
  getStepsToday,
  getWorkoutsToday,
  WORKOUTS_THIS_WEEK,
} from '../lib/dashboardMetrics';

/**
 * Keeps `users/{uid}` in Firestore in sync with local dashboard/nutrition/water data
 * so friends see live progress on the Friends tab.
 */
export function SocialMetricsSync() {
  const { profile } = useProfile();
  const { loggedMealsCount, totalCalories } = useNutrition();
  const { waterTodayMl, waterGoalMl, waterFromTrackerMl } = useWater();

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [email, setEmail] = useState<string | null>(auth.currentUser?.email ?? null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
      setEmail(u?.email ?? null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid || !email) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      void (async () => {
        const waterTotalMl = waterTodayMl + waterFromTrackerMl;
        await upsertPublicUserProfile({
          uid,
          email,
          displayName: profile.fullName ?? '',
        }).catch(() => {});

        await mergeTodaySnapshot({
          mealsLoggedSections: loggedMealsCount,
          caloriesTotal: totalCalories,
          waterTotalMl,
          waterGoalMl,
          steps: getStepsToday(),
          workoutsToday: getWorkoutsToday(),
        }).catch(() => {});

        const weekly = await aggregateWeekMonSunNow().catch(() => null);
        if (!weekly) return;

        await syncMyMetricsToFirestore(uid, {
          daily: {
            stepsToday: getStepsToday(),
            workoutsToday: getWorkoutsToday(),
            workoutsThisWeek: WORKOUTS_THIS_WEEK,
            mealsLoggedToday: loggedMealsCount,
            caloriesToday: totalCalories,
            waterTotalMl,
            waterGoalMl,
            streak: profile.activeStreak,
          },
          weekly: {
            ...weekly,
            streak: profile.activeStreak,
          },
        }).catch(() => {});
      })();
    }, 1400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    uid,
    email,
    profile.fullName,
    profile.activeStreak,
    loggedMealsCount,
    totalCalories,
    waterTodayMl,
    waterGoalMl,
    waterFromTrackerMl,
  ]);

  return null;
}

import { useEffect, useState } from 'react';
import {
  aggregateWeekMonSunNow,
  type WeekTotals,
} from '../lib/dailyStatsSnapshot';

/** Weekly totals from persisted daily snapshots (aligned with SocialMetricsSync debounce). */
export function useWeeklyStats(
  loggedMealsCount: number,
  totalCalories: number,
  waterTodayMl: number,
  waterGoalMl: number,
  waterFromTrackerMl: number,
  stepsToday?: number
) {
  const [totals, setTotals] = useState<WeekTotals | null>(null);

  useEffect(() => {
    let cancelled = false;
    aggregateWeekMonSunNow().then((t) => {
      if (!cancelled) setTotals(t);
    });
    const delayed = setTimeout(() => {
      aggregateWeekMonSunNow().then((t) => {
        if (!cancelled) setTotals(t);
      });
    }, 1600);
    return () => {
      cancelled = true;
      clearTimeout(delayed);
    };
  }, [loggedMealsCount, totalCalories, waterTodayMl, waterGoalMl, waterFromTrackerMl, stepsToday]);

  return totals;
}

/**
 * Single source for values shown on the dashboard (Steps bento, Steps chart 1W, Workouts bento).
 * Replace with HealthKit / manual entry when available.
 */
export const STEPS_WEEK_SERIES: number[] = [
  1200, 3200, 4500, 2100, 7800, 6400, 5200,
];

export function getStepsToday(): number {
  const s = STEPS_WEEK_SERIES;
  return s.length ? s[s.length - 1]! : 0;
}

/** Sum of the current 7-day steps series (weekly total on Friends). */
export function getStepsWeekTotal(): number {
  return STEPS_WEEK_SERIES.reduce((a, b) => a + b, 0);
}

/** Matches dashboard “Workouts · This week” until device sync exists. */
export const WORKOUTS_THIS_WEEK = 0;

/** No per-day workout count yet — daily view uses 0. */
export function getWorkoutsToday(): number {
  return 0;
}

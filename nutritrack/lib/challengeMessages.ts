import type { WeekTotals } from './dailyStatsSnapshot';

export type ChallengeMessage = {
  id: string;
  title: string;
  body: string;
};

/** Derived from Mon–Sun aggregates (no mock challenges). */
export function buildChallengeMessages(w: WeekTotals): ChallengeMessage[] {
  const out: ChallengeMessage[] = [];

  if (w.daysWithMealsLogged >= 7) {
    out.push({
      id: 'challenge-week-meals-all',
      title: 'Challenge complete: daily logging',
      body: 'You logged food every day this week (Monday–Sunday).',
    });
  }

  if (w.waterGoalMl > 0 && w.waterWeekMlTotal >= w.waterGoalMl * 7 * 0.75) {
    out.push({
      id: 'challenge-week-hydration',
      title: 'Challenge complete: hydration',
      body: `You hit at least 75% of your daily water goal across the week (${Math.round(w.waterWeekMlTotal / 1000)} L total).`,
    });
  }

  if (w.stepsWeekTotal >= 50000) {
    out.push({
      id: 'challenge-week-steps',
      title: 'Challenge complete: step sprint',
      body: `You logged over 50,000 steps this week (${w.stepsWeekTotal.toLocaleString()} total).`,
    });
  }

  return out;
}

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNutrition } from '../context/NutritionContext';
import { useWater } from '../context/WaterContext';
import { aggregateWeekMonSunNow } from '../lib/dailyStatsSnapshot';
import { buildChallengeMessages } from '../lib/challengeMessages';
import { subscribeIncomingFriendRequests } from '../lib/social/friends';
import { getPublicUser } from '../lib/social/userPublic';
import type { FriendRequestDoc } from '../lib/social/types';

export type ActivityItem =
  | {
      kind: 'friend_incoming';
      id: string;
      fromUid: string;
      title: string;
      subtitle: string;
    }
  | {
      kind: 'challenge';
      id: string;
      title: string;
      subtitle: string;
    };

export function useActivityFeed() {
  const { loggedMealsCount } = useNutrition();
  const { waterTodayMl, waterGoalMl, waterFromTrackerMl } = useWater();

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [incoming, setIncoming] = useState<{ id: string; data: FriendRequestDoc }[]>([]);
  const [nameByUid, setNameByUid] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) {
      setIncoming([]);
      return;
    }
    return subscribeIncomingFriendRequests(uid, setIncoming);
  }, [uid]);

  useEffect(() => {
    if (incoming.length === 0) {
      setNameByUid({});
      return;
    }
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const r of incoming) {
        const doc = await getPublicUser(r.data.fromUid);
        next[r.data.fromUid] =
          doc?.displayName?.trim() || doc?.emailLower?.split('@')[0] || 'Friend';
      }
      if (!cancelled) setNameByUid(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [incoming]);

  const [challengeItems, setChallengeItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = () =>
      aggregateWeekMonSunNow().then((w) => {
        if (cancelled) return;
        const msgs = buildChallengeMessages(w);
        setChallengeItems(
          msgs.map((m) => ({
            kind: 'challenge' as const,
            id: m.id,
            title: m.title,
            subtitle: m.body,
          }))
        );
      });
    run();
    const t = setTimeout(run, 1700);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [uid, loggedMealsCount, waterTodayMl, waterGoalMl, waterFromTrackerMl]);

  const friendItems: ActivityItem[] = useMemo(
    () =>
      incoming.map((r) => {
        const name = nameByUid[r.data.fromUid] ?? 'Friend';
        return {
          kind: 'friend_incoming' as const,
          id: r.id,
          fromUid: r.data.fromUid,
          title: `Friend request from ${name}`,
          subtitle: 'Tap to open Notifications and respond.',
        };
      }),
    [incoming, nameByUid]
  );

  const allItems = useMemo(() => [...friendItems, ...challengeItems], [friendItems, challengeItems]);

  const badgeCount = allItems.length;

  return { uid, incoming, friendItems, challengeItems, allItems, badgeCount };
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAppTheme } from '../../lib/theme';
import { useProfile } from '../../context/ProfileContext';
import { useNutrition } from '../../context/NutritionContext';
import { useWater } from '../../context/WaterContext';
import {
  getStepsToday,
  getWorkoutsToday,
  WORKOUTS_THIS_WEEK,
} from '../../lib/dashboardMetrics';
import { useWeeklyStats } from '../../hooks/useWeeklyStats';
import type { PublicUserDoc, FriendRequestDoc } from '../../lib/social/types';
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelOutgoingRequest,
  removeFriendship,
  subscribeFriendships,
  subscribeIncomingFriendRequests,
  subscribeOutgoingFriendRequests,
} from '../../lib/social/friends';
import { subscribeToPublicUsers } from '../../lib/social/watchUsers';

type MetricKey = 'steps' | 'workouts' | 'meals' | 'hydration' | 'calories';
type PeriodKey = 'daily' | 'weekly';

type LeaderRow = {
  uid: string;
  name: string;
  initials: string;
  isYou: boolean;
  steps: number;
  workouts: number;
  mealsLogged: number;
  hydrationScore: number;
  calories: number;
};

function metricLabel(metric: MetricKey, period: PeriodKey): string {
  if (period === 'daily') {
    const labels: Record<MetricKey, string> = {
      steps: 'Steps (today)',
      workouts: 'Workouts (today)',
      meals: 'Meals logged (today)',
      hydration: 'Hydration (vs goal)',
      calories: 'Calories (today)',
    };
    return labels[metric];
  }
  const labels: Record<MetricKey, string> = {
    steps: 'Steps (weekly total)',
    workouts: 'Workouts (weekly total)',
    meals: 'Meals logged (weekly total)',
    hydration: 'Hydration (daily avg. % for the week)',
    calories: 'Calories (weekly total)',
  };
  return labels[metric];
}

function pickFriendScores(doc: PublicUserDoc | null | undefined, period: PeriodKey) {
  const m = doc?.metrics;
  if (period === 'daily') {
    if (m && typeof m.stepsToday === 'number') {
      return {
        steps: m.stepsToday,
        workouts: typeof m.workoutsToday === 'number' ? m.workoutsToday : 0,
        mealsLogged: m.mealsLoggedToday,
        hydrationScore: m.hydrationPct,
        calories: typeof m.caloriesToday === 'number' ? m.caloriesToday : 0,
      };
    }
    return { steps: 0, workouts: 0, mealsLogged: 0, hydrationScore: 0, calories: 0 };
  }

  const w = doc?.metricsWeekly;
  if (w && typeof w.stepsWeekTotal === 'number') {
    return {
      steps: w.stepsWeekTotal,
      workouts: w.workoutsWeekTotal ?? w.workoutsThisWeek ?? 0,
      mealsLogged: w.mealsLoggedSectionsWeekTotal ?? w.mealsWeekEstimate ?? 0,
      hydrationScore: w.hydrationWeekAvgPct ?? w.hydrationWeekPct ?? 0,
      calories: typeof w.caloriesWeekTotal === 'number' ? w.caloriesWeekTotal : 0,
    };
  }
  if (m && typeof m.stepsToday === 'number') {
    return {
      steps: 0,
      workouts: m.workoutsThisWeek,
      mealsLogged: 0,
      hydrationScore: m.hydrationPct,
      calories: 0,
    };
  }
  return { steps: 0, workouts: 0, mealsLogged: 0, hydrationScore: 0, calories: 0 };
}

function scoreForMetric(row: LeaderRow, metric: MetricKey): number {
  switch (metric) {
    case 'steps':
      return row.steps;
    case 'workouts':
      return row.workouts;
    case 'meals':
      return row.mealsLogged;
    case 'hydration':
      return row.hydrationScore;
    case 'calories':
      return row.calories;
    default:
      return 0;
  }
}

function formatScore(metric: MetricKey, value: number): string {
  if (metric === 'hydration') return `${Math.round(value)}%`;
  if (metric === 'calories') return `${Math.round(value).toLocaleString()} kcal`;
  return value.toLocaleString();
}

export default function FriendsScreen() {
  const { colors, mode } = useAppTheme();
  const { profile } = useProfile();
  const { loggedMealsCount, totalCalories } = useNutrition();
  const { waterTodayMl, waterGoalMl, waterFromTrackerMl } = useWater();

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [friendUids, setFriendUids] = useState<string[]>([]);
  const [incoming, setIncoming] = useState<{ id: string; fromUid: string }[]>([]);
  const [outgoing, setOutgoing] = useState<{ id: string; toUid: string }[]>([]);
  const [userMap, setUserMap] = useState<Record<string, PublicUserDoc | null>>({});
  const [metric, setMetric] = useState<MetricKey>('steps');
  const [period, setPeriod] = useState<PeriodKey>('daily');
  const [addEmail, setAddEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const weekTotals = useWeeklyStats(
    loggedMealsCount,
    totalCalories,
    waterTodayMl,
    waterGoalMl,
    waterFromTrackerMl
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) return;
    return subscribeFriendships(uid, setFriendUids);
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const u1 = subscribeIncomingFriendRequests(uid, (rows) =>
      setIncoming(
        rows.map((r) => ({
          id: r.id,
          fromUid: (r.data as FriendRequestDoc).fromUid,
        }))
      )
    );
    const u2 = subscribeOutgoingFriendRequests(uid, (rows) =>
      setOutgoing(
        rows.map((r) => ({
          id: r.id,
          toUid: (r.data as FriendRequestDoc).toUid,
        }))
      )
    );
    return () => {
      u1();
      u2();
    };
  }, [uid]);

  const pendingUids = useMemo(() => {
    const ids = new Set<string>();
    for (const r of incoming) ids.add(r.fromUid);
    for (const r of outgoing) ids.add(r.toUid);
    return [...ids];
  }, [incoming, outgoing]);

  const watchIds = useMemo(() => {
    if (!uid) return [];
    return [...new Set([uid, ...friendUids, ...pendingUids])];
  }, [uid, friendUids, pendingUids]);

  useEffect(() => {
    if (watchIds.length === 0) {
      setUserMap({});
      return;
    }
    return subscribeToPublicUsers(watchIds, setUserMap);
  }, [watchIds]);

  const waterTotalMl = waterTodayMl + waterFromTrackerMl;
  const hydrationYou =
    waterGoalMl > 0 ? Math.min(100, Math.round((waterTotalMl / waterGoalMl) * 100)) : 0;
  const stepsToday = getStepsToday();

  const youRow: LeaderRow = useMemo(() => {
    if (period === 'daily') {
      return {
        uid: uid ?? 'local',
        name: profile.fullName?.trim() || 'You',
        initials: profile.initials,
        isYou: true,
        steps: stepsToday,
        workouts: getWorkoutsToday(),
        mealsLogged: loggedMealsCount,
        hydrationScore: hydrationYou,
        calories: totalCalories,
      };
    }
    const w = weekTotals;
    return {
      uid: uid ?? 'local',
      name: profile.fullName?.trim() || 'You',
      initials: profile.initials,
      isYou: true,
      steps: w?.stepsWeekTotal ?? 0,
      workouts: w?.workoutsWeekTotal ?? WORKOUTS_THIS_WEEK,
      mealsLogged: w?.mealsLoggedSectionsWeekTotal ?? 0,
      hydrationScore: w?.hydrationWeekAvgPct ?? hydrationYou,
      calories: w?.caloriesWeekTotal ?? 0,
    };
  }, [
    uid,
    period,
    profile.fullName,
    profile.initials,
    stepsToday,
    loggedMealsCount,
    totalCalories,
    hydrationYou,
    weekTotals,
  ]);

  const friendRows: LeaderRow[] = useMemo(() => {
    return friendUids.map((fid) => {
      const doc = userMap[fid];
      const s = pickFriendScores(doc, period);
      return {
        uid: fid,
        name: doc?.displayName?.trim() || doc?.emailLower?.split('@')[0] || 'Friend',
        initials: doc?.initials || '?',
        isYou: false,
        steps: s.steps,
        workouts: s.workouts,
        mealsLogged: s.mealsLogged,
        hydrationScore: s.hydrationScore,
        calories: s.calories,
      };
    });
  }, [friendUids, userMap, period]);

  const ranked = useMemo(() => {
    const all = [youRow, ...friendRows];
    const sorted = [...all].sort(
      (a, b) => scoreForMetric(b, metric) - scoreForMetric(a, metric)
    );
    return sorted.map((row, index) => ({
      row,
      rank: index + 1,
      score: scoreForMetric(row, metric),
    }));
  }, [youRow, friendRows, metric]);

  const onAddFriend = useCallback(async () => {
    if (!uid) {
      Alert.alert('Sign in required', 'Please sign in to add friends.');
      return;
    }
    const email = addEmail.trim();
    if (!email) {
      Alert.alert('Email required', 'Enter your friend’s account email.');
      return;
    }
    setBusy(true);
    try {
      const result = await sendFriendRequest({
        myUid: uid,
        targetEmail: email,
      });
      if (result === 'sent') Alert.alert('Request sent', 'They can accept it from their Friends tab.');
      else if (result === 'already_friends') Alert.alert('Already friends', 'You are already connected.');
      else if (result === 'pending_out')
        Alert.alert('Already pending', 'A request to this person is already waiting.');
      else if (result === 'accepted_reverse')
        Alert.alert("You're now friends", 'They had already sent you a request — we connected you.');
      setAddEmail('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      Alert.alert('Could not send', msg);
    } finally {
      setBusy(false);
    }
  }, [uid, addEmail]);

  const incomingDetails = useMemo(() => {
    return incoming.map((r) => {
      const doc = userMap[r.fromUid];
      const name = doc?.displayName?.trim() || doc?.emailLower?.split('@')[0] || 'User';
      return { id: r.id, fromUid: r.fromUid, name };
    });
  }, [incoming, userMap]);

  const outgoingDetails = useMemo(() => {
    return outgoing.map((r) => {
      const doc = userMap[r.toUid];
      const name = doc?.displayName?.trim() || doc?.emailLower?.split('@')[0] || 'User';
      return { id: r.id, toUid: r.toUid, name };
    });
  }, [outgoing, userMap]);

  const s = makeStyles(colors);

  return (
    <KeyboardAvoidingView
      style={[s.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingTop: 60 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.headerRow}>
          <Text style={[s.title, { color: colors.text }]}>Friends</Text>
        </View>

        {!uid ? (
          <Text style={[s.lead, { color: colors.subText }]}>
            Sign in to add friends and compare progress in real time.
          </Text>
        ) : (
          <>
            <View
              style={[s.requestsSection, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[s.requestsSectionTitle, { color: colors.text }]}>Friend requests</Text>
              <Text style={[s.requestsSectionSub, { color: colors.subText }]}>
                Incoming: approve or decline. Outgoing: cancel if you change your mind.
              </Text>

              {incomingDetails.length === 0 && outgoingDetails.length === 0 ? (
                <Text style={[s.requestsEmpty, { color: colors.subText }]}>
                  No pending friend requests.
                </Text>
              ) : null}

              {incomingDetails.length > 0 ? (
                <View style={s.subSection}>
                  <Text style={[s.subSectionLabel, { color: colors.text }]}>Needs your response</Text>
                  {incomingDetails.map((row) => (
                    <View
                      key={row.id}
                      style={[s.reqRow, { borderColor: colors.border, backgroundColor: colors.background }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[s.reqName, { color: colors.text }]}>{row.name}</Text>
                        <Text style={[s.reqHint, { color: colors.subText }]}>Wants to connect</Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          if (!uid) return;
                          acceptFriendRequest({ myUid: uid, requestId: row.id }).catch((e) =>
                            Alert.alert('Error', e instanceof Error ? e.message : 'Failed')
                          );
                        }}
                        style={[s.smallBtn, { backgroundColor: colors.primary }]}
                      >
                        <Text style={s.smallBtnText}>Accept</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          if (!uid) return;
                          declineFriendRequest({ myUid: uid, requestId: row.id }).catch((e) =>
                            Alert.alert('Error', e instanceof Error ? e.message : 'Failed')
                          );
                        }}
                        style={[s.smallBtn, { borderColor: colors.border, borderWidth: 1 }]}
                      >
                        <Text style={[s.smallBtnText, { color: colors.text }]}>Decline</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}

              {outgoingDetails.length > 0 ? (
                <View style={s.subSection}>
                  <Text style={[s.subSectionLabel, { color: colors.text }]}>Waiting for them</Text>
                  {outgoingDetails.map((row) => (
                    <View
                      key={row.id}
                      style={[s.reqRow, { borderColor: colors.border, backgroundColor: colors.background }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[s.reqName, { color: colors.text }]}>{row.name}</Text>
                        <Text style={[s.reqHint, { color: colors.subText }]}>Request pending</Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          if (!uid) return;
                          cancelOutgoingRequest({ myUid: uid, requestId: row.id }).catch((e) =>
                            Alert.alert('Error', e instanceof Error ? e.message : 'Failed')
                          );
                        }}
                        style={[s.smallBtn, { borderColor: colors.border, borderWidth: 1 }]}
                      >
                        <Text style={[s.smallBtnText, { color: colors.text }]}>Cancel</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={[s.addCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.addLabel, { color: colors.text }]}>Add friend by email</Text>
              <TextInput
                value={addEmail}
                onChangeText={setAddEmail}
                placeholder="friend@example.com"
                placeholderTextColor={colors.subText}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={[
                  s.input,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                ]}
              />
              <Pressable
                onPress={onAddFriend}
                disabled={busy}
                style={[s.addBtn, { backgroundColor: colors.primary, opacity: busy ? 0.7 : 1 }]}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.addBtnText}>Send request</Text>
                )}
              </Pressable>
            </View>
          </>
        )}

        <Text style={[s.lbSectionTitle, { color: colors.text }]}>Leaderboard</Text>
        <View style={s.periodRow}>
          {(['daily', 'weekly'] as const).map((p) => {
            const active = period === p;
            return (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                style={[
                  s.periodChip,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  active && { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
                ]}
              >
                <Text
                  style={[
                    s.periodChipText,
                    { color: colors.subText },
                    active && { color: colors.primary, fontWeight: '900' },
                  ]}
                >
                  {p === 'daily' ? 'Daily stats' : 'Weekly stats'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[s.sectionHint, { color: colors.subText }]}>{metricLabel(metric, period)}</Text>

        <View style={s.metricRow}>
          {(
            [
              { key: 'steps' as const, icon: 'walk-outline' as const, label: 'Steps' },
              { key: 'workouts' as const, icon: 'barbell-outline' as const, label: 'Workouts' },
              { key: 'meals' as const, icon: 'restaurant-outline' as const, label: 'Meals' },
              { key: 'hydration' as const, icon: 'water-outline' as const, label: 'Water' },
              { key: 'calories' as const, icon: 'flame-outline' as const, label: 'Calories' },
            ]
          ).map((m) => {
            const active = metric === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMetric(m.key)}
                style={[
                  s.metricChip,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  active && { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
                ]}
              >
                <Ionicons
                  name={m.icon}
                  size={14}
                  color={active ? colors.primary : colors.subText}
                />
                <Text
                  style={[
                    s.metricChipText,
                    { color: colors.subText },
                    active && { color: colors.primary, fontWeight: '900' },
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {ranked.length === 0 ? (
            <Text style={[s.emptyLb, { color: colors.subText }]}>
              No rows yet. Add a friend to see the leaderboard.
            </Text>
          ) : (
            ranked.map(({ row, rank, score }, i) => (
              <View
                key={row.uid + String(row.isYou)}
                style={[
                  s.lbRow,
                  i < ranked.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  row.isYou && { backgroundColor: colors.primary + '12' },
                ]}
              >
                <Text style={[s.rank, { color: colors.subText }]}>{rank}</Text>
                <View
                  style={[s.avatar, { borderColor: colors.border, backgroundColor: colors.background }]}
                >
                  <Text style={[s.avatarText, { color: colors.text }]}>{row.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.name, { color: colors.text }]} numberOfLines={1}>
                    {row.name}
                    {row.isYou ? ' · You' : ''}
                  </Text>
                  <Text style={[s.sub, { color: colors.subText }]}>{metricLabel(metric, period)}</Text>
                </View>
                <Text style={[s.score, { color: colors.primary }]}>{formatScore(metric, score)}</Text>
                {!row.isYou && uid ? (
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      Alert.alert(
                        'Remove friend',
                        `Remove ${row.name} from your friends list?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () =>
                              removeFriendship(uid, row.uid).catch((e) =>
                                Alert.alert('Error', e instanceof Error ? e.message : 'Failed')
                              ),
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={22} color={colors.subText} />
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
        </View>

        <Text style={[s.sectionTitle, { color: colors.text }]}>Challenges</Text>
        <Text style={[s.sectionSub, { color: colors.subText }]}>
          Friendly competition using the same synced metrics as the leaderboard.
        </Text>

        <ChallengeCard
          colors={colors}
          s={s}
          title="Weekly Step Sprint"
          subtitle="Most weekly steps wins the badge."
          meta={`Your steps today: ${stepsToday.toLocaleString()}`}
          icon="flash-outline"
        />
        <ChallengeCard
          colors={colors}
          s={s}
          title="Logging streak"
          subtitle="Keep logging meals to climb the board."
          meta={`Your streak: ${profile.activeStreak} day${profile.activeStreak !== 1 ? 's' : ''}`}
          icon="calendar-outline"
        />
        <ChallengeCard
          colors={colors}
          s={s}
          title="Hydration"
          subtitle="Water totals sync from Home and Log."
          meta={`${waterTotalMl} ml / ${waterGoalMl} ml goal (${hydrationYou}%)`}
          icon="water-outline"
        />

        <View style={{ height: 28 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ChallengeCard({
  colors,
  s,
  title,
  subtitle,
  meta,
  icon,
}: {
  colors: ReturnType<typeof useAppTheme>['colors'];
  s: ReturnType<typeof makeStyles>;
  title: string;
  subtitle: string;
  meta: string;
  icon: ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={[s.challengeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[s.challengeIcon, { backgroundColor: colors.primary + '22' }]}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.challengeTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[s.challengeSub, { color: colors.subText }]}>{subtitle}</Text>
        <Text style={[s.challengeMeta, { color: colors.subText }]}>{meta}</Text>
      </View>
    </View>
  );
}

function makeStyles(_colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    screen: { flex: 1 },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    title: { fontSize: 26, fontWeight: '900' },
    requestsSection: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 14,
      marginBottom: 18,
    },
    requestsSectionTitle: { fontSize: 17, fontWeight: '900', marginBottom: 4 },
    requestsSectionSub: { fontSize: 12, fontWeight: '600', lineHeight: 17, marginBottom: 12 },
    requestsEmpty: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
    subSection: { marginTop: 4, marginBottom: 4 },
    subSectionLabel: { fontSize: 13, fontWeight: '800', marginBottom: 8 },
    lead: { fontSize: 13, fontWeight: '600', lineHeight: 18, marginBottom: 14 },
    addCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 14,
      marginBottom: 18,
    },
    addLabel: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      marginBottom: 10,
    },
    addBtn: {
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    addBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
    section: { marginBottom: 16 },
    reqRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 8,
    },
    reqName: { fontWeight: '900', fontSize: 15 },
    reqHint: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    smallBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    smallBtnText: { fontWeight: '800', fontSize: 13 },
    metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    metricChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
    },
    metricChipText: { fontSize: 12, fontWeight: '800' },
    lbSectionTitle: { fontSize: 17, fontWeight: '900', marginBottom: 8 },
    periodRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    periodChip: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
    },
    periodChipText: { fontSize: 13, fontWeight: '800' },
    sectionHint: { fontSize: 12, fontWeight: '800', marginBottom: 10, letterSpacing: 0.3 },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
      marginBottom: 20,
    },
    emptyLb: { padding: 20, textAlign: 'center', fontWeight: '600' },
    lbRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 10,
    },
    rank: { width: 26, fontWeight: '900', fontSize: 14 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontWeight: '900', fontSize: 13 },
    name: { fontWeight: '900', fontSize: 15 },
    sub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    score: { fontWeight: '900', fontSize: 16, minWidth: 44, textAlign: 'right' },
    sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
    sectionSub: { fontSize: 13, fontWeight: '600', marginBottom: 12, lineHeight: 18 },
    challengeCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      borderRadius: 16,
      borderWidth: 1,
      padding: 14,
      marginBottom: 10,
    },
    challengeIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    challengeTitle: { fontSize: 16, fontWeight: '900' },
    challengeSub: { fontSize: 13, fontWeight: '600', marginTop: 4, lineHeight: 18 },
    challengeMeta: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  });
}

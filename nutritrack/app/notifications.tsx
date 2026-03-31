import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '../lib/theme';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { acceptFriendRequest, declineFriendRequest } from '../lib/social/friends';

export default function NotificationsScreen() {
  const { colors, mode } = useAppTheme();
  const { uid, allItems } = useActivityFeed();
  const [busyId, setBusyId] = useState<string | null>(null);

  const onAccept = useCallback(
    (requestId: string) => {
      if (!uid) return;
      setBusyId(requestId);
      acceptFriendRequest({ myUid: uid, requestId })
        .catch((e) => Alert.alert('Error', e instanceof Error ? e.message : 'Could not accept'))
        .finally(() => setBusyId(null));
    },
    [uid]
  );

  const onDecline = useCallback(
    (requestId: string) => {
      if (!uid) return;
      setBusyId(requestId);
      declineFriendRequest({ myUid: uid, requestId })
        .catch((e) => Alert.alert('Error', e instanceof Error ? e.message : 'Could not decline'))
        .finally(() => setBusyId(null));
    },
    [uid]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={[styles.backBtn, { borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {allItems.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={52} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No updates yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
              Friend requests and weekly challenge milestones will show up here.
            </Text>
          </View>
        ) : (
          allItems.map((item, idx) => (
            <View
              key={`${item.kind}-${item.id}-${idx}`}
              style={[
                styles.row,
                { borderColor: colors.border, backgroundColor: colors.card },
                idx === allItems.length - 1 && { marginBottom: 0 },
              ]}
            >
              <View style={styles.rowIcon}>
                <Ionicons
                  name={item.kind === 'friend_incoming' ? 'person-add-outline' : 'trophy-outline'}
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.rowSub, { color: colors.subText }]}>{item.subtitle}</Text>
                {item.kind === 'friend_incoming' ? (
                  <View style={styles.actions}>
                    <Pressable
                      disabled={busyId === item.id}
                      onPress={() => onAccept(item.id)}
                      style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                    >
                      {busyId === item.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Accept</Text>
                      )}
                    </Pressable>
                    <Pressable
                      disabled={busyId === item.id}
                      onPress={() => onDecline(item.id)}
                      style={[styles.secondaryBtn, { borderColor: colors.border }]}
                    >
                      <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Decline</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  rowSub: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  primaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontWeight: '800',
    fontSize: 14,
  },
});

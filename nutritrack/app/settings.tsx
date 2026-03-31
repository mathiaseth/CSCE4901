import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../lib/theme';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { router } from 'expo-router';
import { useProfile } from '../context/ProfileContext';

export default function SettingsScreen() {
  const { mode, setMode, colors } = useContext(ThemeContext);
  const { profile } = useProfile();

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: colors.subText }]}>
      {title}
    </Text>
  );

  const Row = ({
    icon,
    label,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        { borderColor: colors.border, backgroundColor: colors.card },
      ]}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={[styles.rowText, { color: colors.text }]}>
          {label}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.subText}
      />
    </Pressable>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingTop: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Card */}
      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.profileTopRow}>
          <View>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {profile.fullName ?? 'Your Name'}
            </Text>
            {profile.memberSince && (
              <Text style={[styles.profileSub, { color: colors.subText }]}>
                Member since {profile.memberSince}
              </Text>
            )}
          </View>

          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{profile.initials}</Text>
          </View>
        </View>

        <View style={styles.streakRow}>
          <StatBubble
            icon="trending-up-outline"
            label="Active streak"
            value={`${profile.activeStreak} day${profile.activeStreak !== 1 ? 's' : ''}`}
            colors={colors}
          />
          <StatBubble
            icon="time-outline"
            label="Longest streak"
            value={`${profile.longestStreak} day${profile.longestStreak !== 1 ? 's' : ''}`}
            colors={colors}
          />
          <StatBubble
            icon="calendar-outline"
            label="Total tracked"
            value={`${profile.totalTrackedDays} day${profile.totalTrackedDays !== 1 ? 's' : ''}`}
            colors={colors}
          />
        </View>
      </View>

      {/* Account Section */}
      <SectionHeader title="ACCOUNT" />

      <View style={styles.group}>
        <Row icon="person-outline" label="Account" onPress={() => router.push('/profile' as never)} />
        <Row icon="trophy-outline" label="Goals & Progress" onPress={() => router.push('/goals' as never)} />
        <Row icon="people-outline" label="Friends" onPress={() => router.push('/(tabs)/friends' as never)} />
        <Row icon="restaurant-outline" label="Saved Foods, Meals & Recipes" />
        <Row icon="card-outline" label="Subscription" />
      </View>

      {/* Preferences Section */}
      <SectionHeader title="PREFERENCES" />

      <View style={styles.group}>
        {/* Dark Mode Toggle Row */}
        <View
          style={[
            styles.row,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <View style={styles.rowLeft}>
            <Ionicons
              name="color-palette-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.rowText, { color: colors.text }]}>
              Dark Mode
            </Text>
          </View>

          <Pressable
            onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            style={[
              styles.toggle,
              {
                backgroundColor:
                  mode === 'dark'
                    ? colors.primary
                    : colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.toggleCircle,
                {
                  alignSelf:
                    mode === 'dark'
                      ? 'flex-end'
                      : 'flex-start',
                },
              ]}
            />
          </Pressable>
        </View>

        <Row icon="nutrition-outline" label="Nutrients" />
        <Row icon="extension-puzzle-outline" label="Integrations" />
      </View>

      {/* Sign Out */}
      <Pressable
        style={[styles.logoutBtn, { borderColor: colors.border }]}
        onPress={async () => {
          await signOut(auth);
          router.replace('/login');
        }}
      >
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function StatBubble({
  icon,
  label,
  value,
  colors,
}: any) {
  return (
    <View style={styles.statItem}>
      <View
        style={[
          styles.statIconCircle,
          { backgroundColor: colors.primary },
        ]}
      >
        <Ionicons name={icon} size={16} color="#FFFFFF" />
      </View>
      <Text style={[styles.statLabel, { color: colors.subText }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 28,
  },

  profileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  profileName: {
    fontSize: 24,
    fontWeight: '900',
  },

  profileSub: {
    marginTop: 4,
    fontWeight: '700',
  },

  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0B2C5E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },

  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  statItem: {
    alignItems: 'center',
    width: '32%',
  },

  statIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  statValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },

  sectionHeader: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: 1,
  },

  group: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 28,
  },

  row: {
    borderBottomWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  rowText: {
    fontSize: 16,
    fontWeight: '800',
  },

  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },

  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 8,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },
});
// app/setup/activity-level.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type ActivityType = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete' | '';

export default function ActivityLevelScreen() {
  const [activity, setActivity] = useState<ActivityType>('');

  const isValid = activity !== '';

  const handleContinue = () => {
    if (!isValid) return;

    // TODO: Save activity level (AsyncStorage / context) if needed
    // e.g. await AsyncStorage.setItem('onboard.activity', activity)

    // For now, go to dashboard.
    router.replace('/(tabs)/dashboard');
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="walk-outline" size={30} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>How active are you?</Text>
        <Text style={styles.headerSubtitle}>
          Tell us about your typical day so we can estimate your daily calories.
        </Text>

        {/* progress (5/5 for now) */}
        <View style={styles.progressRow}>
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Select your usual activity level</Text>

        <View style={styles.cardCol}>
          {/* Sedentary */}
          <Pressable
            onPress={() => setActivity('sedentary')}
            style={[styles.card, activity === 'sedentary' && styles.cardActive]}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="desktop-outline"
                size={22}
                color={activity === 'sedentary' ? '#0B2C5E' : '#64748B'}
              />
              <Text
                style={[
                  styles.cardTitle,
                  activity === 'sedentary' && styles.cardTitleActive,
                ]}
              >
                Sedentary
              </Text>
            </View>
            <Text style={styles.cardBodyText}>
              Desk job, little to no exercise, minimal daily movement.
            </Text>
          </Pressable>

          {/* Lightly active */}
          <Pressable
            onPress={() => setActivity('light')}
            style={[styles.card, activity === 'light' && styles.cardActive]}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="walk-outline"
                size={22}
                color={activity === 'light' ? '#0B2C5E' : '#64748B'}
              />
              <Text
                style={[
                  styles.cardTitle,
                  activity === 'light' && styles.cardTitleActive,
                ]}
              >
                Lightly active
              </Text>
            </View>
            <Text style={styles.cardBodyText}>
              Light exercise 1–2 days/week, casual walks or errands.
            </Text>
          </Pressable>

          {/* Moderately active */}
          <Pressable
            onPress={() => setActivity('moderate')}
            style={[styles.card, activity === 'moderate' && styles.cardActive]}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="bicycle-outline"
                size={22}
                color={activity === 'moderate' ? '#0B2C5E' : '#64748B'}
              />
              <Text
                style={[
                  styles.cardTitle,
                  activity === 'moderate' && styles.cardTitleActive,
                ]}
              >
                Moderately active
              </Text>
            </View>
            <Text style={styles.cardBodyText}>
              Exercise 3–4 days/week or on your feet a good part of the day.
            </Text>
          </Pressable>

          {/* Very active */}
          <Pressable
            onPress={() => setActivity('active')}
            style={[styles.card, activity === 'active' && styles.cardActive]}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="barbell-outline"
                size={22}
                color={activity === 'active' ? '#0B2C5E' : '#64748B'}
              />
              <Text
                style={[
                  styles.cardTitle,
                  activity === 'active' && styles.cardTitleActive,
                ]}
              >
                Very active
              </Text>
            </View>
            <Text style={styles.cardBodyText}>
              Intense training 5–6 days/week or a highly active job.
            </Text>
          </Pressable>

          {/* Athlete / super active */}
          <Pressable
            onPress={() => setActivity('athlete')}
            style={[styles.card, activity === 'athlete' && styles.cardActive]}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="fitness-outline"
                size={22}
                color={activity === 'athlete' ? '#0B2C5E' : '#64748B'}
              />
              <Text
                style={[
                  styles.cardTitle,
                  activity === 'athlete' && styles.cardTitleActive,
                ]}
              >
                Athlete / super active
              </Text>
            </View>
            <Text style={styles.cardBodyText}>
              Daily intense training, sports, or very demanding physical work.
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <LinearGradient
          colors={isValid ? ['#4CA1DE', '#1E90D6'] : ['#C7D2FE', '#A5B4FC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaWrap}
        >
          <Pressable
            style={[styles.ctaButton, !isValid && { opacity: 0.7 }]}
            onPress={handleContinue}
            disabled={!isValid}
          >
            <Text style={styles.ctaText}>Finish Setup</Text>
          </Pressable>
        </LinearGradient>

        <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginTop: 8 }}>
          <Text style={styles.backLink}>Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E90D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    color: '#0B2C5E',
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4CA1DE',
    textAlign: 'center',
    marginTop: 4,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  progressBar: {
    width: 36,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
  },
  progressActive: {
    backgroundColor: '#1E90D6',
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  sectionLabel: {
    color: '#0B2C5E',
    fontWeight: '700',
    marginBottom: 8,
  },
  cardCol: {
    gap: 10,
  },
  card: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  cardActive: {
    borderColor: '#1E90D6',
    backgroundColor: '#EFF6FF',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 16,
  },
  cardTitleActive: {
    color: '#0B2C5E',
  },
  cardBodyText: {
    color: '#6B7280',
    fontSize: 13,
  },
  footer: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  ctaWrap: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaButton: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  backLink: {
    color: '#1E90D6',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

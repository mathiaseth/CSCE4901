// app/setup/goal.tsx
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
import AsyncStorage from '@react-native-async-storage/async-storage';

type GoalType = 'lose' | 'maintain' | 'gain' | 'recomp' | '';

export default function GoalScreen() {
  // Step 4 of onboarding: capture the main fitness goal (used later for macros + suggestions)
  const [goal, setGoal] = useState<GoalType>('');

  // Simple check to enable/disable Continue
  const isValid = goal !== '';

  const handleContinue = async () => {
    if (!isValid) return;

    // Persist selected goal so the summary / dashboard can read it
    await AsyncStorage.setItem('onboard.goal', goal);

    // Move to next onboarding step (activity level screen)
    router.push('/setup/activity-level');
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header: goal icon, title, subtitle, and progress indicator */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="trophy-outline" size={30} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>What’s your main goal?</Text>
        <Text style={styles.headerSubtitle}>
          Choose the option that best matches what you want NutriTrack to help you with.
        </Text>

        {/* Progress bar (step 4/5 in the setup flow) */}
        <View style={styles.progressRow}>
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={styles.progressBar} />
        </View>
      </View>

      {/* Main content: goal cards */}
      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Select your goal</Text>

        <View style={styles.cardCol}>
          {/* Lose weight goal */}
          <Pressable
            onPress={() => setGoal('lose')}
            style={[styles.card, goal === 'lose' && styles.cardActive]}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="flame-outline"
                size={22}
                color={goal === 'lose' ? '#0B2C5E' : '#64748B'}
              />
              <Text style={[styles.cardTitle, goal === 'lose' && styles.cardTitleActive]}>
                Lose weight
              </Text>
            </View>
            <Text style={styles.cardBodyText}>
              Focus on fat loss while maintaining as much muscle as possible.
            </Text>
          </Pressable>

          {/* Maintain weight goal */}
          <Pressable
            onPress={() => setGoal('maintain')}
            style={[styles.card, goal === 'maintain' && styles.cardActive]}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="remove-outline"
                size={22}
                color={goal === 'maintain' ? '#0B2C5E' : '#64748B'}
              />
              <Text style={[styles.cardTitle, goal === 'maintain' && styles.cardTitleActive]}>
                Maintain weight
              </Text>
            </View>
            <Text style={styles.cardBodyText}>
              Keep your current weight steady with balanced nutrition.
            </Text>
          </Pressable>

          {/* Build muscle / gain goal */}
          <Pressable
            onPress={() => setGoal('gain')}
            style={[styles.card, goal === 'gain' && styles.cardActive]}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="barbell-outline"
                size={22}
                color={goal === 'gain' ? '#0B2C5E' : '#64748B'}
              />
              <Text style={[styles.cardTitle, goal === 'gain' && styles.cardTitleActive]}>
                Build muscle / gain
              </Text>
            </View>
            <Text style={styles.cardBodyText}>
              Increase strength and size with a calorie surplus and high protein.
            </Text>
          </Pressable>

          {/* Body recomposition goal */}
          <Pressable
            onPress={() => setGoal('recomp')}
            style={[styles.card, goal === 'recomp' && styles.cardActive]}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="sync-outline"
                size={22}
                color={goal === 'recomp' ? '#0B2C5E' : '#64748B'}
              />
              <Text style={[styles.cardTitle, goal === 'recomp' && styles.cardTitleActive]}>
                Body recomposition
              </Text>
            </View>
            <Text style={styles.cardBodyText}>
              Slowly lose fat while building lean muscle over time.
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Footer: continue + back navigation */}
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
            <Text style={styles.ctaText}>Continue</Text>
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

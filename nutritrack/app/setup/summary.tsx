// app/setup/summary.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Units = 'imperial' | 'metric' | null;

interface UserData {
  fullName: string | null;
  gender: string | null;
  dob: string | null;
  units: Units;
  heightText: string | null;
  weightText: string | null;
  goal: string | null;
  activityLevel: string | null;
}

export default function SummaryScreen() {
  const [userData, setUserData] = useState<UserData>({
    fullName: null,
    gender: null,
    dob: null,
    units: null,
    heightText: null,
    weightText: null,
    goal: null,
    activityLevel: null,
  });

  useEffect(() => {
    const loadAllOnboardingData = async () => {
      try {
        const [
          fullNamePair,
          genderPair,
          dobPair,
          unitsPair,
          hFtPair,
          hInPair,
          hCmPair,
          wLbsPair,
          wKgPair,
          goalPair,
          activityPair,
        ] = await AsyncStorage.multiGet([
          'onboard.fullName',
          'onboard.gender',
          'onboard.dob',
          'onboard.units',
          'onboard.heightFt',
          'onboard.heightIn',
          'onboard.heightCm',
          'onboard.weightLbs',
          'onboard.weightKg',
          'onboard.goal',
          'onboard.activity',
        ]);

        const fullName = fullNamePair[1];
        const gender = genderPair[1];
        const dobRaw = dobPair[1];
        const unitsRaw = unitsPair[1] as Units;

        const heightFt = hFtPair[1];
        const heightIn = hInPair[1];
        const heightCm = hCmPair[1];

        const weightLbs = wLbsPair[1];
        const weightKg = wKgPair[1];

        const goalRaw = goalPair[1];
        const activityRaw = activityPair[1];

        let dobFormatted: string | null = null;
        if (dobRaw) {
          const d = new Date(dobRaw);
          dobFormatted = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US') : dobRaw;
        }

        let heightText: string | null = null;
        let weightText: string | null = null;

        if (unitsRaw === 'imperial') {
          if (heightFt && heightIn) heightText = `${heightFt} ft ${heightIn} in`;
          if (weightLbs) weightText = `${weightLbs} lbs`;
        } else if (unitsRaw === 'metric') {
          if (heightCm) heightText = `${heightCm} cm`;
          if (weightKg) weightText = `${weightKg} kg`;
        }

        const goalLabelMap: Record<string, string> = {
          lose: 'Lose weight',
          maintain: 'Maintain weight',
          gain: 'Build muscle / gain',
          recomp: 'Body recomposition',
        };

        const activityLabelMap: Record<string, string> = {
          sedentary: 'Sedentary',
          light: 'Lightly active',
          moderate: 'Moderately active',
          active: 'Very active',
          athlete: 'Athlete / super active',
        };

        const goalLabel = goalRaw ? goalLabelMap[goalRaw] ?? goalRaw : null;
        const activityLabel = activityRaw ? activityLabelMap[activityRaw] ?? activityRaw : null;

        setUserData({
          fullName,
          gender,
          dob: dobFormatted,
          units: unitsRaw,
          heightText,
          weightText,
          goal: goalLabel,
          activityLevel: activityLabel,
        });
      } catch (e) {
        console.warn('Error loading onboarding data:', e);
      }
    };

    loadAllOnboardingData();
  }, []);

  const unitsLabel =
    userData.units === 'imperial'
      ? 'Imperial (ft / lbs)'
      : userData.units === 'metric'
      ? 'Metric (cm / kg)'
      : 'Not set';

  const displayOrDash = (value: string | null | undefined) =>
    value && value.trim().length > 0 ? value : 'Not set';

  const displayOrLine = (value: string | null | undefined) =>
    value && value.trim().length > 0 ? value : '—';

  const handleFinish = () => {
    // After summary → dashboard
    router.push('/setup/create-account');
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-outline" size={30} color="#FFFFFF" />
        </View>

        <Text style={styles.headerTitle}>Review your details</Text>
        <Text style={styles.headerSubtitle}>
          Make sure everything looks right before we build your plan.
        </Text>

        <View style={styles.progressRow}>
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* Personal */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="person-outline" size={20} color="#0B2C5E" />
            </View>
            <Text style={styles.cardTitle}>Personal</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name</Text>
            <Text style={styles.rowValue}>{displayOrDash(userData.fullName)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Gender / Sex</Text>
            <Text style={styles.rowValue}>{displayOrDash(userData.gender)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Date of Birth</Text>
            <Text style={styles.rowValue}>{displayOrDash(userData.dob)}</Text>
          </View>
        </View>

        {/* Physical stats */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="barbell-outline" size={20} color="#0B2C5E" />
            </View>
            <Text style={styles.cardTitle}>Physical stats</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Units</Text>
            <Text style={styles.rowValue}>{unitsLabel}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Height</Text>
            <Text style={styles.rowValue}>{displayOrLine(userData.heightText)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Weight</Text>
            <Text style={styles.rowValue}>{displayOrLine(userData.weightText)}</Text>
          </View>
        </View>

        {/* Goal & activity */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="flag-outline" size={20} color="#0B2C5E" />
            </View>
            <Text style={styles.cardTitle}>Goal & activity</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Goal</Text>
            <Text style={styles.rowValue}>{displayOrDash(userData.goal)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Activity level</Text>
            <Text style={styles.rowValue}>{displayOrDash(userData.activityLevel)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <LinearGradient
          colors={['#4CA1DE', '#1E90D6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaWrap}
        >
          <Pressable style={styles.ctaButton} onPress={handleFinish}>
            <Text style={styles.ctaText}>Finish</Text>
          </Pressable>
        </LinearGradient>

        <Pressable onPress={() => router.back()} style={{ marginTop: 8 }}>
          <Text style={styles.backLink}>Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },

  header: { alignItems: 'center', marginTop: 60, marginBottom: 16 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E90D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0B2C5E', textAlign: 'center' },
  headerSubtitle: {
    fontSize: 14,
    color: '#4CA1DE',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 32,
  },

  progressRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  progressBar: { width: 36, height: 6, backgroundColor: '#E5E7EB', borderRadius: 999 },
  progressActive: { backgroundColor: '#1E90D6' },

  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  cardIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0B2C5E' },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { fontSize: 14, color: '#6B7280' },
  rowValue: { fontSize: 14, color: '#111827' },

  footer: { paddingHorizontal: 20, paddingBottom: 24, backgroundColor: '#FFFFFF' },
  ctaWrap: { borderRadius: 18, overflow: 'hidden' },
  ctaButton: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  backLink: {
    color: '#1E90D6',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    textDecorationLine: 'underline',
  },
});

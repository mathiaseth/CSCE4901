// app/setup/physical-stats.tsx

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Units = 'imperial' | 'metric';

export default function PhysicalStatsScreen() {
  // Step 3 of onboarding: collect height + weight (imperial or metric) with basic validation
  const [units, setUnits] = useState<Units>('imperial');

  // Raw text input values so the fields behave like normal inputs
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightCm, setHeightCm] = useState('');

  const [weightLbs, setWeightLbs] = useState('');
  const [weightKg, setWeightKg] = useState('');

  // Track if height/weight fields have been touched so errors only show after interaction
  const [touchedHeight, setTouchedHeight] = useState(false);
  const [touchedWeight, setTouchedWeight] = useState(false);

  // Parse string inputs into numbers for validation logic
  const ft = parseInt(heightFt || '0', 10);
  const inch = parseInt(heightIn || '0', 10);
  const cm = parseInt(heightCm || '0', 10);
  const lbs = parseFloat(weightLbs || '0');
  const kg = parseFloat(weightKg || '0');

  // Height validation rules for both unit systems
  const heightValid = useMemo(() => {
    if (units === 'imperial') {
      const total = ft * 12 + inch;
      // Accept anything between 4ft (48in) and 7ft (84in)
      return total >= 48 && total <= 84;
    }
    // Metric: 140–230 cm
    return cm >= 140 && cm <= 230;
  }, [units, ft, inch, cm]);

  // Weight validation rules for both unit systems
  const weightValid = useMemo(() => {
    if (units === 'imperial') {
      // 70–500 lbs
      return lbs >= 70 && lbs <= 500;
    }
    // 30–250 kg
    return kg >= 30 && kg <= 250;
  }, [units, lbs, kg]);

  const isValid = heightValid && weightValid;

  const handleContinue = async () => {
    if (!isValid) return;

    // Save units + height + weight for summary + macro logic
    try {
      let saveHeightCm = 0;
      let saveWeightKg = 0;
      let saveHeightFt = ft;
      let saveHeightIn = inch;
      let saveWeightLbs = lbs;

      if (units === 'imperial') {
        const totalInches = ft * 12 + inch;
        saveHeightCm = Math.round(totalInches * 2.54);
        saveWeightKg = Math.round(lbs * 0.453592 * 10) / 10;
      } else {
        // Metric is primary
        saveHeightCm = cm;
        saveWeightKg = kg;

        // Pre-compute imperial for later display if we ever need it
        const totalInches = Math.round(cm / 2.54);
        saveHeightFt = Math.floor(totalInches / 12);
        saveHeightIn = totalInches - saveHeightFt * 12;
        saveWeightLbs = Math.round(kg / 0.453592);
      }

      await AsyncStorage.multiSet([
        ['onboard.units', units],
        ['onboard.heightFt', String(saveHeightFt)],
        ['onboard.heightIn', String(saveHeightIn)],
        ['onboard.heightCm', String(saveHeightCm)],
        ['onboard.weightLbs', String(saveWeightLbs)],
        ['onboard.weightKg', String(saveWeightKg)],
      ]);
    } catch (err) {
      // If storage fails, just bail out of continue; we can log this later if needed
      console.warn('Failed to save physical stats', err);
      return;
    }

    // Move to goal step once everything is stored
    router.push('/setup/goal');
  };

  const onBlurHeight = () => {
    // Mark height section as interacted with so we can show validation messages
    setTouchedHeight(true);
  };

  const onBlurWeight = () => {
    // Mark weight section as interacted with so we can show validation messages
    setTouchedWeight(true);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.screen}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header: icon, title, subtitle, and step progress (3/5) */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="barbell-outline" size={30} color="#fff" />
              </View>
              <Text style={styles.headerTitle}>Your body stats</Text>
              <Text style={styles.headerSubtitle}>
                We’ll use this to personalize your calories & macros.
              </Text>

              {/* Progress bar for onboarding steps */}
              <View style={styles.progressRow}>
                <View style={[styles.progressBar, styles.progressActive]} />
                <View style={[styles.progressBar, styles.progressActive]} />
                <View style={[styles.progressBar, styles.progressActive]} />
                <View style={styles.progressBar} />
                <View style={styles.progressBar} />
              </View>
            </View>

            {/* Units selector: toggle between imperial and metric */}
            <View style={styles.unitsCard}>
              <Text style={styles.sectionLabel}>Units</Text>

              <View style={styles.unitsToggleRow}>
                <Pressable
                  onPress={() => {
                    // Switch to imperial and reset touched states so old errors don't linger
                    setUnits('imperial');
                    setTouchedHeight(false);
                    setTouchedWeight(false);
                  }}
                  style={[
                    styles.unitsChip,
                    units === 'imperial' && styles.unitsChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.unitsChipText,
                      units === 'imperial' && styles.unitsChipTextActive,
                    ]}
                  >
                    Imperial
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    // Switch to metric and reset touched states
                    setUnits('metric');
                    setTouchedHeight(false);
                    setTouchedWeight(false);
                  }}
                  style={[
                    styles.unitsChip,
                    units === 'metric' && styles.unitsChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.unitsChipText,
                      units === 'metric' && styles.unitsChipTextActive,
                    ]}
                  >
                    Metric
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Height section */}
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Height</Text>

            {units === 'imperial' ? (
              <>
                {/* Imperial height: feet + inches side by side */}
                <View style={styles.heightRow}>
                  <View style={styles.heightField}>
                    <Text style={styles.inputLabel}>Feet</Text>
                    <TextInput
                      keyboardType="number-pad"
                      value={heightFt}
                      onChangeText={setHeightFt}
                      onBlur={onBlurHeight}
                      placeholder="5"
                      style={[
                        styles.input,
                        !heightValid && touchedHeight && styles.inputError,
                      ]}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.heightField}>
                    <Text style={styles.inputLabel}>Inches</Text>
                    <TextInput
                      keyboardType="number-pad"
                      value={heightIn}
                      onChangeText={setHeightIn}
                      onBlur={onBlurHeight}
                      placeholder="10"
                      style={[
                        styles.input,
                        !heightValid && touchedHeight && styles.inputError,
                      ]}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                {/* Height error only shows after the user interacts with the fields */}
                {!heightValid && touchedHeight && (
                  <Text style={styles.errorText}>
                    Height must be between 4 ft (48 in) and 7 ft (84 in).
                  </Text>
                )}
              </>
            ) : (
              <>
                {/* Metric height: single centimeters field */}
                <Text style={styles.inputLabel}>Centimeters</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={heightCm}
                  onChangeText={setHeightCm}
                  onBlur={onBlurHeight}
                  placeholder="178"
                  style={[
                    styles.input,
                    !heightValid && touchedHeight && styles.inputError,
                  ]}
                  placeholderTextColor="#9CA3AF"
                />
                {!heightValid && touchedHeight && (
                  <Text style={styles.errorText}>
                    Height must be between 140 and 230 cm.
                  </Text>
                )}
              </>
            )}

            {/* Weight section */}
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Weight</Text>

            <Text style={styles.inputLabel}>
              {units === 'imperial' ? 'Pounds (lbs)' : 'Kilograms (kg)'}
            </Text>
            <TextInput
              keyboardType="numeric"
              value={units === 'imperial' ? weightLbs : weightKg}
              onChangeText={units === 'imperial' ? setWeightLbs : setWeightKg}
              onBlur={onBlurWeight}
              placeholder={units === 'imperial' ? '200' : '90'}
              style={[
                styles.input,
                !weightValid && touchedWeight && styles.inputError,
              ]}
              placeholderTextColor="#9CA3AF"
            />
            {!weightValid && touchedWeight && (
              <Text style={styles.errorText}>
                {units === 'imperial'
                  ? 'Weight must be between 70 and 500 lbs.'
                  : 'Weight must be between 30 and 250 kg.'}
              </Text>
            )}
          </ScrollView>

          {/* Footer CTA lives at the bottom; okay if keyboard covers it while typing */}
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

            <Pressable onPress={() => router.back()} style={{ marginTop: 8 }}>
              <Text style={styles.backLink}>Back</Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 8 },
  scrollContent: {
    paddingBottom: 40, // Extra padding so last input isn’t jammed into the footer
  },

  header: { alignItems: 'center', marginTop: 60, marginBottom: 10 },
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

  progressRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  progressBar: {
    width: 36,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
  },
  progressActive: { backgroundColor: '#1E90D6' },

  sectionLabel: { color: '#0B2C5E', fontWeight: '700', marginBottom: 8 },

  unitsCard: {
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
  },
  unitsToggleRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  unitsChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  unitsChipActive: { backgroundColor: '#1E90D6', borderColor: '#1E90D6' },
  unitsChipText: { fontSize: 14, color: '#1D4ED8', fontWeight: '500' },
  unitsChipTextActive: { color: '#fff', fontWeight: '700' },

  heightRow: { flexDirection: 'row', gap: 10 },
  heightField: { flex: 1 },

  inputLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  inputError: { borderColor: '#F87171' },

  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
    width: '100%',
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  ctaWrap: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  ctaButton: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.2 },
  backLink: {
    color: '#1E90D6',
    fontWeight: '700',
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 4,
  },
});

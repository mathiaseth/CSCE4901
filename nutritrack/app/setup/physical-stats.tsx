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

type Units = 'imperial' | 'metric';

export default function PhysicalStatsScreen() {
  const [units, setUnits] = useState<Units>('imperial');

  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightCm, setHeightCm] = useState('');

  const [weightLbs, setWeightLbs] = useState('');
  const [weightKg, setWeightKg] = useState('');

  // track if fields were touched (for showing errors)
  const [touchedHeight, setTouchedHeight] = useState(false);
  const [touchedWeight, setTouchedWeight] = useState(false);

  // parsed values
  const ft = parseInt(heightFt || '0', 10);
  const inch = parseInt(heightIn || '0', 10);
  const cm = parseInt(heightCm || '0', 10);
  const lbs = parseFloat(weightLbs || '0');
  const kg = parseFloat(weightKg || '0');

  // height validation
  const heightValid = useMemo(() => {
    if (units === 'imperial') {
      const total = ft * 12 + inch;
      return total >= 48 && total <= 84; // 4ft–7ft
    }
    return cm >= 140 && cm <= 230; // 140–230 cm
  }, [units, ft, inch, cm]);

  // weight validation
  const weightValid = useMemo(() => {
    if (units === 'imperial') return lbs >= 70 && lbs <= 500;
    return kg >= 30 && kg <= 250;
  }, [units, lbs, kg]);

  const isValid = heightValid && weightValid;

  const handleContinue = () => {
    if (!isValid) return;
    // TODO: save values somewhere (context / storage) before moving on
    router.replace('/setup/goal');
  };

  const onBlurHeight = () => {
    setTouchedHeight(true);
  };

  const onBlurWeight = () => {
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
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="barbell-outline" size={30} color="#fff" />
              </View>
              <Text style={styles.headerTitle}>Your body stats</Text>
              <Text style={styles.headerSubtitle}>
                We’ll use this to personalize your calories & macros.
              </Text>

              {/* progress bar (step 3) */}
              <View style={styles.progressRow}>
                <View style={[styles.progressBar, styles.progressActive]} />
                <View style={[styles.progressBar, styles.progressActive]} />
                <View style={[styles.progressBar, styles.progressActive]} />
                <View style={styles.progressBar} />
                <View style={styles.progressBar} />
              </View>
            </View>

            {/* Units */}
            <View style={styles.unitsCard}>
              <Text style={styles.sectionLabel}>Units</Text>

              <View style={styles.unitsToggleRow}>
                <Pressable
                  onPress={() => {
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

            {/* Height */}
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Height</Text>

            {units === 'imperial' ? (
              <>
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

                {!heightValid && touchedHeight && (
                  <Text style={styles.errorText}>
                    Height must be between 4 ft (48 in) and 7 ft (84 in).
                  </Text>
                )}
              </>
            ) : (
              <>
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

            {/* Weight */}
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

          {/* Footer CTA – stays at bottom, can be covered by keyboard (on purpose) */}
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
    paddingBottom: 40,
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

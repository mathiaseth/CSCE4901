// app/setup/gender-dob.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  StatusBar,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';

export default function GenderDobScreen() {
  const [gender, setGender] = useState<string>('');
  const [dob, setDob] = useState<Date | null>(null);

  // Modal control
  const [showPicker, setShowPicker] = useState(false);

  const onChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') {
      // Android: picker closes automatically
      setShowPicker(false);
    }
    if (selected) setDob(selected);
  };

  const isValid = gender !== '' && !!dob;

  const handleContinue = () => {
    if (!isValid) return;
    router.replace('/setup/physical-stats');
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="person-circle-outline" size={30} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>Tell us about you</Text>
        <Text style={styles.headerSubtitle}>Select your gender and date of birth</Text>

        <View style={styles.progressRow}>
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Gender */}
        <Text style={styles.sectionLabel}>Gender / Sex</Text>
        <View style={styles.cardRow}>
          <Pressable
            onPress={() => setGender('male')}
            style={[styles.card, gender === 'male' && styles.cardActive]}
          >
            <Ionicons
              name="male-outline"
              size={20}
              color={gender === 'male' ? '#0B2C5E' : '#64748B'}
            />
            <Text style={[styles.cardText, gender === 'male' && styles.cardTextActive]}>
              Male
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setGender('female')}
            style={[styles.card, gender === 'female' && styles.cardActive]}
          >
            <Ionicons
              name="female-outline"
              size={20}
              color={gender === 'female' ? '#0B2C5E' : '#64748B'}
            />
            <Text style={[styles.cardText, gender === 'female' && styles.cardTextActive]}>
              Female
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setGender('other')}
            style={[styles.card, gender === 'other' && styles.cardActive]}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={gender === 'other' ? '#0B2C5E' : '#64748B'}
            />
            <Text style={[styles.cardText, gender === 'other' && styles.cardTextActive]}>
              Other
            </Text>
          </Pressable>
        </View>

        {/* DOB */}
        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Date of Birth</Text>

        <Pressable style={styles.dateButton} onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar-outline" size={20} color="#1E90D6" />
          <Text style={styles.dateText}>
            {dob ? dob.toDateString() : 'Select your date of birth'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#94A3B8" />
        </Pressable>
      </View>

      {/* Footer */}
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

      {/* Date Picker Modal */}
      {showPicker && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPressOut={() => setShowPicker(false)}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={['#4CA1DE', '#1E90D6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pickerGradient}
              >
                <View style={styles.pickerInner}>
                  <DateTimePicker
                    value={dob ?? new Date(2000, 0, 1)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={onChange}
                    themeVariant="light"
                    textColor="black"
                    style={styles.picker}
                  />
                </View>
              </LinearGradient>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 8 },
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
  headerTitle: { fontSize: 22, color: '#0B2C5E', fontWeight: '700', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: '#4CA1DE', textAlign: 'center', marginTop: 4 },
  progressRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  progressBar: { width: 36, height: 6, backgroundColor: '#E5E7EB', borderRadius: 999 },
  progressActive: { backgroundColor: '#1E90D6' },
  content: { flex: 1, marginTop: 16 },
  sectionLabel: { color: '#0B2C5E', fontWeight: '700', marginBottom: 8 },
  cardRow: { flexDirection: 'row', gap: 10 },
  card: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  cardActive: { borderColor: '#1E90D6', backgroundColor: '#EFF6FF' },
  cardText: { color: '#64748B', fontWeight: '600' },
  cardTextActive: { color: '#0B2C5E' },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  dateText: { flex: 1, color: '#0F172A', fontSize: 16 },
  footer: { paddingBottom: 24, alignItems: 'center' },
  ctaWrap: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  ctaButton: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.2 },
  backLink: { color: '#1E90D6', fontWeight: '700', textDecorationLine: 'underline' },

  // Modal overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: '90%',
    borderRadius: 16,
    overflow: 'hidden',
  },

  pickerGradient: {
    padding: 12,
    borderRadius: 16,
    width: '100%',
  },

  pickerInner: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    padding: 6,
  },

  picker: {
    backgroundColor: 'transparent',
    width: '100%',
    height: 200,
  },
});

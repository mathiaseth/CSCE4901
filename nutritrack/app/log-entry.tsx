import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function LogEntry() {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const parseNum = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const formValid = foodName.trim().length > 0 && parseNum(calories) > 0;

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Log Entry</Text>
          <Text style={styles.subtitle}>Add a meal and update your macros</Text>
        </View>

        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={18} color="#0B2C5E" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Log food</Text>

        <View style={styles.inputCard}>
          <TextInput
            placeholder="Food name (e.g., rice + chicken)"
            value={foodName}
            onChangeText={setFoodName}
            style={styles.input}
            placeholderTextColor="#9CA3AF"
          />

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Calories</Text>
              <TextInput
                placeholder="0"
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                style={styles.smallInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Protein</Text>
              <TextInput
                placeholder="0"
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
                style={styles.smallInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Carbs</Text>
              <TextInput
                placeholder="0"
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
                style={styles.smallInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.inputLabel}>Fat</Text>
              <TextInput
                placeholder="0"
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
                style={styles.smallInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <LinearGradient
            colors={formValid ? ['#4CA1DE', '#1E90D6'] : ['#C7D2FE', '#A5B4FC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addWrap}
          >
            <Pressable
              onPress={() => router.back()}
              disabled={!formValid}
              style={[styles.addBtn, !formValid && { opacity: 0.75 }]}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addText}>Add entry</Text>
            </Pressable>
          </LinearGradient>

          {!formValid && (
            <Text style={styles.helperText}>
              Add at least a name and calories to log an entry.
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 12 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 44,
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#0B2C5E' },
  subtitle: { fontSize: 13, color: '#4CA1DE', marginTop: 2 },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  backText: { color: '#0B2C5E', fontWeight: '800' },

  section: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0B2C5E', marginBottom: 8 },

  inputCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },

  gridRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  gridCol: { flex: 1 },
  inputLabel: { fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: '700' },
  smallInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },

  addWrap: { borderRadius: 14, overflow: 'hidden', marginTop: 12 },
  addBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  helperText: { marginTop: 8, color: '#64748B', fontSize: 12 },
});

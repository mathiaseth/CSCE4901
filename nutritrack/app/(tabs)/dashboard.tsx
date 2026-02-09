// app/(tabs)/dashboard.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Firebase sign out
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';

type FoodItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export default function DashboardScreen() {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const [items, setItems] = useState<FoodItem[]>([
    { id: '1', name: 'Greek Yogurt', calories: 140, protein: 15, carbs: 10, fat: 4 },
    { id: '2', name: 'Chicken Bowl', calories: 520, protein: 45, carbs: 55, fat: 14 },
  ]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [items]);

  const parseNum = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const formValid = foodName.trim().length > 0 && parseNum(calories) > 0;

  const addFood = () => {
    if (!formValid) return;

    const newItem: FoodItem = {
      id: String(Date.now()),
      name: foodName.trim(),
      calories: parseNum(calories),
      protein: parseNum(protein),
      carbs: parseNum(carbs),
      fat: parseNum(fat),
    };

    setItems((prev) => [newItem, ...prev]);
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
  };

  const removeFood = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/(onboarding)');
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Track meals and hit your macros</Text>
        </View>

        <Pressable onPress={handleSignOut} style={styles.signOutBtn} hitSlop={10}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      <LinearGradient
        colors={['#4CA1DE', '#1E90D6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.totalsCard}
      >
        <View style={styles.totalsRow}>
          <View style={styles.totalsLeft}>
            <Text style={styles.totalsTitle}>Today</Text>
            <Text style={styles.totalsCalories}>{totals.calories} kcal</Text>
          </View>

          <View style={styles.totalsRight}>
            <View style={styles.macroPill}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{totals.protein}g</Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{totals.carbs}g</Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>{totals.fat}g</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

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
              onPress={addFood}
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

      <View style={[styles.section, { flex: 1 }]}>
        <Text style={styles.sectionTitle}>Today’s entries</Text>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.foodRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodMacros}>
                  {item.calories} kcal • P{item.protein} • C{item.carbs} • F{item.fat}
                </Text>
              </View>

              <Pressable onPress={() => removeFood(item.id)} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="nutrition-outline" size={26} color="#94A3B8" />
              <Text style={styles.emptyText}>No entries yet. Log your first meal.</Text>
            </View>
          }
        />
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

  signOutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  signOutText: { color: '#0B2C5E', fontWeight: '800' },

  totalsCard: { borderRadius: 20, padding: 14, overflow: 'hidden', marginBottom: 14 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  totalsLeft: { justifyContent: 'center' },
  totalsTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700' },
  totalsCalories: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 4 },

  totalsRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  macroPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 74,
  },
  macroLabel: { color: 'rgba(255,255,255,0.92)', fontSize: 11, fontWeight: '700' },
  macroValue: { color: '#fff', fontSize: 14, fontWeight: '900', marginTop: 2 },

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

  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  foodName: { fontSize: 15, fontWeight: '900', color: '#0B2C5E' },
  foodMacros: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  emptyBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyText: { marginTop: 8, color: '#64748B', fontWeight: '700', fontSize: 13 },
});

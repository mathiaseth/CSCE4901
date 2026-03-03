// app/(tabs)/log-entry.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNutrition } from '../context/NutritionContext';

type FoodItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type MealKey = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

const PRESET_FOODS: FoodItem[] = [
  { id: '1', name: 'Eggs (2 large)', calories: 140, protein: 12, carbs: 1, fat: 10 },
  { id: '2', name: 'White Rice (1 cup)', calories: 205, protein: 4, carbs: 45, fat: 0 },
  { id: '3', name: 'Chicken Breast (4 oz)', calories: 180, protein: 35, carbs: 0, fat: 3 },
  { id: '4', name: 'Whole Wheat Bread (2 slices)', calories: 160, protein: 8, carbs: 28, fat: 2 },
  { id: '5', name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
  { id: '6', name: 'Greek Yogurt', calories: 130, protein: 18, carbs: 6, fat: 3 },
  { id: '7', name: 'Ground Turkey', calories: 170, protein: 22, carbs: 0, fat: 8 },
  { id: '8', name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3 },
  { id: '9', name: 'Peanut Butter', calories: 190, protein: 8, carbs: 6, fat: 16 },
  { id: '10', name: 'Protein Shake', calories: 120, protein: 25, carbs: 3, fat: 1 },
];

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function LogEntryScreen() {
  const { addCalories } = useNutrition();

  const [meals, setMeals] = useState<Record<MealKey, FoodItem[]>>({
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snacks: [],
  });

  const [selectedMeal, setSelectedMeal] = useState<MealKey>('Breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [foodModalOpen, setFoodModalOpen] = useState(false);

  function addFoodToMeal(food: FoodItem) {
    setMeals((prev) => ({
      ...prev,
      [selectedMeal]: [...prev[selectedMeal], food],
    }));

    addCalories(food.calories);
    setFoodModalOpen(false);
    setSearchQuery('');
  }

  function getMealCalories(meal: MealKey) {
    return meals[meal].reduce((sum, f) => sum + f.calories, 0);
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Title */}
        <Text style={styles.title}>Food Log</Text>
        <Text style={styles.date}>{formatDate(new Date())}</Text>

        {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as MealKey[]).map((meal) => (
          <View key={meal} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTitle}>{meal}</Text>
              <Text style={styles.mealCalories}>{getMealCalories(meal)} cal</Text>
            </View>

            {meals[meal].map((food, index) => (
              <View key={index} style={styles.foodRow}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.foodMacros}>
                  {food.calories} cal • P {food.protein}g • C {food.carbs}g • F {food.fat}g
                </Text>
              </View>
            ))}

            <Pressable
              onPress={() => {
                setSelectedMeal(meal);
                setFoodModalOpen(true);
              }}
            >
              <Text style={styles.addFoodText}>+ Add Food</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Modal */}
      <Modal visible={foodModalOpen} animationType="slide" transparent>
        <Pressable style={styles.modalBackdrop} onPress={() => setFoodModalOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <TextInput
              placeholder="Search food..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />

            <ScrollView>
              {PRESET_FOODS.filter((food) =>
                food.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((food) => (
                <Pressable
                  key={food.id}
                  style={styles.foodOption}
                  onPress={() => addFoodToMeal(food)}
                >
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodMacros}>
                    {food.calories} cal • P {food.protein}g • C {food.carbs}g • F {food.fat}g
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 20, paddingTop: 60 },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0B2C5E',
  },

  date: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 20,
  },

  mealCard: {
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },

  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  mealTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0B2C5E',
  },

  mealCalories: {
    fontWeight: '900',
    color: '#1E90D6',
  },

  foodRow: { marginBottom: 8 },

  foodName: { fontWeight: '900', color: '#0B2C5E' },

  foodMacros: { fontSize: 12, color: '#64748B', fontWeight: '700' },

  addFoodText: {
    color: '#1E90D6',
    fontWeight: '900',
    marginTop: 10,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },

  modalSheet: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '80%',
  },

  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },

  foodOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
});
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function Profile() {
  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Your account and macro targets</Text>
        </View>

        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={18} color="#0B2C5E" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="person-outline" size={18} color="#0B2C5E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Name</Text>
              <Text style={styles.rowSub}>Add your display name</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Ionicons name="mail-outline" size={18} color="#0B2C5E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Email</Text>
              <Text style={styles.rowSub}>View your email address</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goals</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="barbell-outline" size={18} color="#0B2C5E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Daily calories</Text>
              <Text style={styles.rowSub}>Set your kcal target</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Ionicons name="nutrition-outline" size={18} color="#0B2C5E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Macros</Text>
              <Text style={styles.rowSub}>Set protein, carbs, and fat goals</Text>
            </View>
          </View>
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

  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  rowTitle: { fontSize: 14, fontWeight: '900', color: '#0B2C5E' },
  rowSub: { fontSize: 12, color: '#64748B', fontWeight: '700', marginTop: 2 },

  divider: { height: 1, backgroundColor: '#E5E7EB' },
});

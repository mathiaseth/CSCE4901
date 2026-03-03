import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '../lib/theme';

export default function Profile() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <Text style={[styles.subtitle, { color: colors.primary }]}>
            Your account and macro targets
          </Text>
        </View>

        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Ionicons name="person-outline" size={18} color={colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Name</Text>
              <Text style={[styles.rowSub, { color: colors.subText }]}>
                Add your display name
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Ionicons name="mail-outline" size={18} color={colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Email</Text>
              <Text style={[styles.rowSub, { color: colors.subText }]}>
                View your email address
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Goals</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Ionicons name="barbell-outline" size={18} color={colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Daily calories</Text>
              <Text style={[styles.rowSub, { color: colors.subText }]}>
                Set your kcal target
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Ionicons name="nutrition-outline" size={18} color={colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Macros</Text>
              <Text style={[styles.rowSub, { color: colors.subText }]}>
                Set protein, carbs, and fat goals
              </Text>
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
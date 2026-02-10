import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { getMotivationEnabled, setMotivationEnabled } from '../lib/motivation';

export default function Settings() {
  const [motivationEnabled, setMotivationEnabledState] = useState(true);

  useEffect(() => {
    (async () => {
      const enabled = await getMotivationEnabled();
      setMotivationEnabledState(enabled);
    })();
  }, []);

  const toggleMotivation = async (value: boolean) => {
    setMotivationEnabledState(value);
    await setMotivationEnabled(value);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your experience</Text>
        </View>

        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={18} color="#0B2C5E" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="sparkles-outline" size={18} color="#0B2C5E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Motivational pop-ups</Text>
              <Text style={styles.rowSub}>Show a daily reminder after login</Text>
            </View>

            <Switch value={motivationEnabled} onValueChange={toggleMotivation} />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Ionicons name="swap-horizontal-outline" size={18} color="#0B2C5E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Units</Text>
              <Text style={styles.rowSub}>Grams, calories, and serving sizes</Text>
            </View>
            <Text style={styles.rightHint}>Default</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Ionicons name="color-palette-outline" size={18} color="#0B2C5E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Theme</Text>
              <Text style={styles.rowSub}>Light / Dark (coming soon)</Text>
            </View>
            <Text style={styles.rightHint}>Light</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="help-circle-outline" size={18} color="#0B2C5E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Help</Text>
              <Text style={styles.rowSub}>FAQ and troubleshooting</Text>
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
  rightHint: { color: '#64748B', fontWeight: '800', fontSize: 12 },

  divider: { height: 1, backgroundColor: '#E5E7EB' },
});

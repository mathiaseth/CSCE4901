import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { getMotivationEnabled, setMotivationEnabled } from '../lib/motivation';
import { useAppTheme } from '../lib/theme';

export default function Settings() {
  const { mode, setMode, colors } = useAppTheme();

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

  const toggleDarkMode = (value: boolean) => {
    setMode(value ? 'dark' : 'light');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.primary }]}>
            Customize your experience
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
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Ionicons name="sparkles-outline" size={18} color={colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Motivational pop-ups</Text>
              <Text style={[styles.rowSub, { color: colors.subText }]}>
                Show a daily reminder after login
              </Text>
            </View>

            <Switch value={motivationEnabled} onValueChange={toggleMotivation} />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Ionicons name="moon-outline" size={18} color={colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Dark mode</Text>
              <Text style={[styles.rowSub, { color: colors.subText }]}>
                Switch between light and dark
              </Text>
            </View>

            <Switch value={mode === 'dark'} onValueChange={toggleDarkMode} />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Ionicons name="swap-horizontal-outline" size={18} color={colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Units</Text>
              <Text style={[styles.rowSub, { color: colors.subText }]}>
                Grams, calories, and serving sizes
              </Text>
            </View>
            <Text style={[styles.rightHint, { color: colors.subText }]}>Default</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Ionicons name="help-circle-outline" size={18} color={colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Help</Text>
              <Text style={[styles.rowSub, { color: colors.subText }]}>
                FAQ and troubleshooting
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 44,
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  backText: { fontWeight: '800' },

  section: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },

  card: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  rowTitle: { fontSize: 14, fontWeight: '900' },
  rowSub: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  rightHint: { fontWeight: '800', fontSize: 12 },

  divider: { height: 1 },
});
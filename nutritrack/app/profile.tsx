import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { saveProfileToFirestore } from '../lib/firestoreSync';
import { useAppTheme } from '../lib/theme';
import { useProfile } from '../context/ProfileContext';
import { ensureStartWeight, upsertTodayWeight } from '../lib/weightTracking';
import {
  loadAccountProfileForCurrentUser,
  saveAccountProfileForCurrentUser,
} from '../lib/accountProfile';

// ─── Types ────────────────────────────────────────────────────────────────────

type Units = 'imperial' | 'metric' | null;
type EditSection = 'personal' | 'physical' | 'goal' | null;

interface Profile {
  fullName: string | null;
  gender: string | null;
  dob: string | null;
  age: number | null;
  units: Units;
  heightText: string | null;
  weightText: string | null;
  goal: string | null;
  activityLevel: string | null;
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const GOAL_LABEL: Record<string, string> = {
  lose:     'Lose weight',
  maintain: 'Maintain weight',
  gain:     'Gain weight',
  recomp:   'Body recomposition',
};

const ACTIVITY_LABEL: Record<string, string> = {
  sedentary: 'Sedentary',
  light:     'Lightly active',
  moderate:  'Moderately active',
  active:    'Very active',
  athlete:   'Athlete / super active',
};

const GOAL_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  lose:     'flame-outline',
  maintain: 'remove-circle-outline',
  gain:     'barbell-outline',
  recomp:   'sync-outline',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAge(dobIso: string): number | null {
  const d = new Date(dobIso);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

function formatDob(dobIso: string): string | null {
  const d = new Date(dobIso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function parseDobInput(raw: string): string | null {
  const parts = raw.split('/');
  if (parts.length !== 3) return null;
  const [m, d, y] = parts.map(Number);
  if (!m || !d || !y || y < 1900 || y > new Date().getFullYear()) return null;
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { colors, mode } = useAppTheme();
  const { reload: reloadGlobal, profile: globalProfile } = useProfile();
  const [profile, setProfile] = useState<Profile>({
    fullName: null, gender: null, dob: null, age: null,
    units: null, heightText: null, weightText: null,
    goal: null, activityLevel: null,
  });
  const [authEmail, setAuthEmail] = useState<string | null>(auth.currentUser?.email ?? null);
  const [editSection, setEditSection] = useState<EditSection>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setAuthEmail(user?.email ?? null));
    return unsub;
  }, []);

  const loadProfile = async () => {
    try {
      try {
        await loadAccountProfileForCurrentUser({ syncToStorage: true });
      } catch {}
      const [
        namePair, genderPair, dobPair, unitsPair,
        hFtPair, hInPair, hCmPair, wLbsPair, wKgPair,
        goalPair, activityPair,
      ] = await AsyncStorage.multiGet([
        'onboard.fullName', 'onboard.gender', 'onboard.dob', 'onboard.units',
        'onboard.heightFt', 'onboard.heightIn', 'onboard.heightCm',
        'onboard.weightLbs', 'onboard.weightKg',
        'onboard.goal', 'onboard.activity',
      ]);

      const unitsRaw = unitsPair[1] as Units;
      const dobRaw   = dobPair[1];

      let dob: string | null = null;
      let age: number | null = null;
      if (dobRaw) { dob = formatDob(dobRaw); age = calcAge(dobRaw); }

      let heightText: string | null = null;
      let weightText: string | null = null;
      if (unitsRaw === 'imperial') {
        if (hFtPair[1] && hInPair[1]) heightText = `${hFtPair[1]} ft ${hInPair[1]} in`;
        if (wLbsPair[1]) weightText = `${wLbsPair[1]} lbs`;
      } else if (unitsRaw === 'metric') {
        if (hCmPair[1]) heightText = `${hCmPair[1]} cm`;
        if (wKgPair[1]) weightText = `${wKgPair[1]} kg`;
      }

      setProfile({
        fullName:      namePair[1],
        gender:        genderPair[1],
        dob, age, units: unitsRaw, heightText, weightText,
        goal:          goalPair[1],
        activityLevel: activityPair[1],
      });
    } catch (e) {
      console.warn('Failed to load profile', e);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const email       = authEmail;
  const displayName = profile.fullName ?? auth.currentUser?.displayName ?? null;
  const initials    = displayName
    ? displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : (email?.[0] ?? '?').toUpperCase();

  const val        = (v: string | null | undefined) => (v && v.trim() ? v : '—');
  const capitalize = (s: string | null) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

  const goalKey   = profile.goal ?? '';
  const actKey    = profile.activityLevel ?? '';
  const goalLabel = GOAL_LABEL[goalKey]    ?? capitalize(profile.goal);
  const actLabel  = ACTIVITY_LABEL[actKey] ?? capitalize(profile.activityLevel);
  const goalIcon  = (GOAL_ICON[goalKey] ?? 'flag-outline') as keyof typeof Ionicons.glyphMap;

  const unitsLabel =
    profile.units === 'imperial' ? 'Imperial (ft / lbs)' :
    profile.units === 'metric'   ? 'Metric (cm / kg)'    : '—';

  const handleSaved = () => {
    setEditSection(null);
    loadProfile();
    reloadGlobal();
    const uid = auth.currentUser?.uid;
    if (uid) saveProfileToFirestore(uid).catch(() => {});
  };

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.push('/(tabs)/settings' as never)} style={[s.backBtn, { borderColor: colors.border }]} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[s.topTitle, { color: colors.text }]}>Account</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Avatar + name */}
        <View style={[s.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.avatar, { backgroundColor: colors.primary }]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={[s.heroName, { color: colors.text }]}>{displayName ?? 'Your Name'}</Text>
          {email && <Text style={[s.heroEmail, { color: colors.subText }]}>{email}</Text>}
        </View>

        {/* Personal */}
        <SectionCard title="Personal" icon="person-outline" colors={colors} onEdit={() => setEditSection('personal')}>
          <InfoRow label="Full name"     value={val(displayName)}          colors={colors} />
          <InfoRow label="Gender"        value={capitalize(profile.gender)} colors={colors} />
          <InfoRow label="Date of birth" value={val(profile.dob)}          colors={colors} last={profile.age === null} />
          {profile.age !== null && (
            <InfoRow label="Age" value={`${profile.age} years old`} colors={colors} last />
          )}
        </SectionCard>

        {/* Physical Stats */}
        <SectionCard title="Physical Stats" icon="barbell-outline" colors={colors} onEdit={() => setEditSection('physical')}>
          <InfoRow label="Units"       value={unitsLabel}                          colors={colors} />
          <InfoRow label="Height"      value={val(profile.heightText)}             colors={colors} />
          <InfoRow label="Weight"      value={val(profile.weightText)}             colors={colors} />
          <InfoRow label="Weight Goal" value={val(globalProfile.weightGoalText)}    colors={colors} last />
        </SectionCard>

        {/* Goal & Activity */}
        <SectionCard title="Goal & Activity" icon={goalIcon} colors={colors} onEdit={() => setEditSection('goal')}>
          <InfoRow label="Goal"           value={goalLabel} colors={colors} />
          <InfoRow label="Activity level" value={actLabel}  colors={colors} last />
        </SectionCard>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Section modals */}
      <PersonalModal
        visible={editSection === 'personal'}
        colors={colors}
        onClose={() => setEditSection(null)}
        onSaved={handleSaved}
      />
      <PhysicalModal
        visible={editSection === 'physical'}
        colors={colors}
        onClose={() => setEditSection(null)}
        onSaved={handleSaved}
      />
      <GoalModal
        visible={editSection === 'goal'}
        colors={colors}
        onClose={() => setEditSection(null)}
        onSaved={handleSaved}
      />
    </View>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, icon, colors, children, onEdit }: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: any;
  children: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable style={s.cardHeader} onPress={onEdit} hitSlop={4}>
        <View style={[s.cardIconWrap, { backgroundColor: colors.primary + '22' }]}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={[s.cardTitle, { color: colors.text, flex: 1 }]}>{title}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.subText} />
      </Pressable>
      {children}
    </View>
  );
}

function InfoRow({ label, value, colors, last = false }: {
  label: string; value: string; colors: any; last?: boolean;
}) {
  return (
    <>
      <View style={s.infoRow}>
        <Text style={[s.infoLabel, { color: colors.subText }]}>{label}</Text>
        <Text style={[s.infoValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
      </View>
      {!last && <View style={[s.divider, { backgroundColor: colors.border }]} />}
    </>
  );
}

// ─── Shared modal shell ───────────────────────────────────────────────────────

function ModalShell({ visible, title, colors, onClose, onSave, saving, children }: {
  visible: boolean;
  title: string;
  colors: any;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[ms.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={[ms.cancel, { color: colors.subText }]}>Cancel</Text>
          </Pressable>
          <Text style={[ms.title, { color: colors.text }]}>{title}</Text>
          <Pressable onPress={onSave} disabled={saving} hitSlop={10}>
            <Text style={[ms.save, { color: colors.primary, opacity: saving ? 0.5 : 1 }]}>
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={ms.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Personal modal ───────────────────────────────────────────────────────────

function PersonalModal({ visible, colors, onClose, onSaved }: {
  visible: boolean; colors: any; onClose: () => void; onSaved: () => void;
}) {
  const [fullName, setFullName] = useState('');
  const [dobInput, setDobInput] = useState('');
  const [gender, setGender]     = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        await loadAccountProfileForCurrentUser({ syncToStorage: true });
      } catch {}
      const [n, d, g] = await AsyncStorage.multiGet(['onboard.fullName', 'onboard.dob', 'onboard.gender']);
      setFullName(n[1] ?? '');
      setGender(g[1] ?? '');
      if (d[1]) {
        const date = new Date(d[1]);
        if (!isNaN(date.getTime())) {
          setDobInput(
            `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`
          );
        }
      } else {
        setDobInput('');
      }
    })();
  }, [visible]);

  const handleSave = async () => {
    if (!fullName.trim()) { Alert.alert('Missing field', 'Please enter your full name.'); return; }
    if (!gender) { Alert.alert('Missing field', 'Please select a gender.'); return; }
    let dobIso = '';
    if (dobInput.trim()) {
      const parsed = parseDobInput(dobInput);
      if (!parsed) { Alert.alert('Invalid date', 'Enter date of birth as MM/DD/YYYY.'); return; }
      dobIso = parsed;
    }
    setSaving(true);
    try {
      const pairs: [string, string][] = [
        ['onboard.fullName', fullName.trim()],
        ['onboard.gender',   gender],
      ];
      if (dobIso) pairs.push(['onboard.dob', dobIso]);
      await AsyncStorage.multiSet(pairs);
      await saveAccountProfileForCurrentUser({
        fullName: fullName.trim(),
        gender,
        ...(dobIso ? { dob: dobIso } : {}),
      });
      onSaved();
    } catch { Alert.alert('Error', 'Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  const inp = [ms.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }];
  const lbl = [ms.label, { color: colors.subText }];

  return (
    <ModalShell visible={visible} title="Personal" colors={colors} onClose={onClose} onSave={handleSave} saving={saving}>
      <Text style={lbl}>Full name</Text>
      <TextInput style={inp} value={fullName} onChangeText={setFullName} placeholder="Your full name" placeholderTextColor={colors.subText} />

      <Text style={lbl}>Date of birth</Text>
      <TextInput style={inp} value={dobInput} onChangeText={setDobInput} placeholder="MM/DD/YYYY" placeholderTextColor={colors.subText} keyboardType="numeric" />

      <Text style={lbl}>Gender</Text>
      <ChipRow
        options={[{ key: 'male', label: 'Male' }, { key: 'female', label: 'Female' }]}
        selected={gender} onSelect={setGender} colors={colors}
      />
    </ModalShell>
  );
}

// ─── Physical modal ───────────────────────────────────────────────────────────

const GOAL_IMPLIES_LOWER = new Set(['lose']);
const GOAL_IMPLIES_HIGHER = new Set(['gain']);

function PhysicalModal({ visible, colors, onClose, onSaved }: {
  visible: boolean; colors: any; onClose: () => void; onSaved: () => void;
}) {
  const [units, setUnits]               = useState<'imperial' | 'metric'>('imperial');
  const [heightFt, setHeightFt]         = useState('');
  const [heightIn, setHeightIn]         = useState('');
  const [heightCm, setHeightCm]         = useState('');
  const [weightLbs, setWeightLbs]       = useState('');
  const [weightKg, setWeightKg]         = useState('');
  const [weightGoalLbs, setWeightGoalLbs] = useState('');
  const [weightGoalKg, setWeightGoalKg]   = useState('');
  const [saving, setSaving]               = useState(false);
  // Store original goal values so "Keep weight goal" can restore them
  const prevGoalLbs = React.useRef('');
  const prevGoalKg  = React.useRef('');

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        await loadAccountProfileForCurrentUser({ syncToStorage: true });
      } catch {}
      const [u, hFt, hIn, hCm, wLbs, wKg, wGLbs, wGKg] = await AsyncStorage.multiGet([
        'onboard.units', 'onboard.heightFt', 'onboard.heightIn',
        'onboard.heightCm', 'onboard.weightLbs', 'onboard.weightKg',
        'onboard.weightGoalLbs', 'onboard.weightGoalKg',
      ]);
      setUnits((u[1] ?? 'imperial') as 'imperial' | 'metric');
      setHeightFt(hFt[1] ?? '');
      setHeightIn(hIn[1] ?? '');
      setHeightCm(hCm[1] ?? '');
      setWeightLbs(wLbs[1] ?? '');
      setWeightKg(wKg[1] ?? '');
      const gLbs = wGLbs[1] ?? '';
      const gKg  = wGKg[1]  ?? '';
      setWeightGoalLbs(gLbs);
      setWeightGoalKg(gKg);
      prevGoalLbs.current = gLbs;
      prevGoalKg.current  = gKg;
    })();
  }, [visible]);

  const doSave = async (overrideGoal?: string) => {
    let saveHeightFt  = parseInt(heightFt  || '0', 10);
    let saveHeightIn  = parseInt(heightIn  || '0', 10);
    let saveHeightCm  = parseFloat(heightCm  || '0');
    let saveWeightLbs = parseFloat(weightLbs || '0');
    let saveWeightKg  = parseFloat(weightKg  || '0');

    if (units === 'imperial') {
      saveHeightCm  = Math.round((saveHeightFt * 12 + saveHeightIn) * 2.54);
      saveWeightKg  = Math.round(saveWeightLbs * 0.453592 * 10) / 10;
    } else {
      const totalInches = Math.round(saveHeightCm / 2.54);
      saveHeightFt  = Math.floor(totalInches / 12);
      saveHeightIn  = totalInches - saveHeightFt * 12;
      saveWeightLbs = Math.round(saveWeightKg / 0.453592);
    }

    // Weight goal cross-unit
    const goalInput = parseFloat((units === 'imperial' ? weightGoalLbs : weightGoalKg) || '0');
    let saveGoalLbs = goalInput;
    let saveGoalKg  = goalInput;
    if (units === 'imperial' && goalInput > 0) {
      saveGoalKg  = Math.round(goalInput * 0.453592 * 10) / 10;
    } else if (units === 'metric' && goalInput > 0) {
      saveGoalKg  = goalInput;
      saveGoalLbs = Math.round(goalInput / 0.453592);
    }

    setSaving(true);
    try {
      const pairs: [string, string][] = [
        ['onboard.units',         units],
        ['onboard.heightFt',      String(saveHeightFt)],
        ['onboard.heightIn',      String(saveHeightIn)],
        ['onboard.heightCm',      String(saveHeightCm)],
        ['onboard.weightLbs',     String(saveWeightLbs)],
        ['onboard.weightKg',      String(saveWeightKg)],
        ['onboard.weightGoalLbs', String(saveGoalLbs)],
        ['onboard.weightGoalKg',  String(saveGoalKg)],
      ];
      if (overrideGoal) pairs.push(['onboard.goal', overrideGoal]);
      await AsyncStorage.multiSet(pairs);
      await saveAccountProfileForCurrentUser({
        units,
        heightFt: String(saveHeightFt),
        heightIn: String(saveHeightIn),
        heightCm: String(saveHeightCm),
        weightLbs: String(saveWeightLbs),
        weightKg: String(saveWeightKg),
        weightGoalLbs: String(saveGoalLbs),
        weightGoalKg: String(saveGoalKg),
        ...(overrideGoal ? { goal: overrideGoal } : {}),
      });
      await ensureStartWeight(saveWeightKg, saveWeightLbs);
      await upsertTodayWeight(saveWeightKg, saveWeightLbs);
      onSaved();
    } catch { Alert.alert('Error', 'Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    let saveHeightFt  = parseInt(heightFt  || '0', 10);
    let saveHeightIn  = parseInt(heightIn  || '0', 10);
    let saveHeightCm  = parseFloat(heightCm  || '0');
    let saveWeightLbs = parseFloat(weightLbs || '0');
    let saveWeightKg  = parseFloat(weightKg  || '0');

    // Basic validation
    if (units === 'imperial') {
      if (saveHeightFt < 3 || saveHeightFt > 8) { Alert.alert('Invalid height', 'Enter a valid height in feet.'); return; }
      if (saveWeightLbs < 50 || saveWeightLbs > 700) { Alert.alert('Invalid weight', 'Enter a valid weight in lbs.'); return; }
    } else {
      if (saveHeightCm < 100 || saveHeightCm > 250) { Alert.alert('Invalid height', 'Enter a valid height in cm.'); return; }
      if (saveWeightKg < 20 || saveWeightKg > 300) { Alert.alert('Invalid weight', 'Enter a valid weight in kg.'); return; }
    }

    const currentKg  = units === 'imperial' ? saveWeightLbs * 0.453592 : saveWeightKg;
    const goalInput  = parseFloat((units === 'imperial' ? weightGoalLbs : weightGoalKg) || '0');
    const goalKg     = units === 'imperial' ? goalInput * 0.453592 : goalInput;

    if (goalInput > 0) {
      // Fetch stored goal to check for mismatch
      const storedGoal = (await AsyncStorage.getItem('onboard.goal')) ?? '';
      const wantsLower = goalKg < currentKg;   // goal weight is less → should be "lose"
      const wantsHigher = goalKg > currentKg;  // goal weight is more → should be "gain"

      const mismatchLose = wantsHigher && GOAL_IMPLIES_LOWER.has(storedGoal);
      const mismatchGain = wantsLower  && GOAL_IMPLIES_HIGHER.has(storedGoal);

      if (mismatchLose) {
        Alert.alert(
          'Goal mismatch',
          'Your weight goal is higher than your current weight, but your fitness goal is set to "Lose weight". Keep the previous weight goal, or switch your fitness goal to "Gain weight"?',
          [
            {
              text: 'Keep previous weight goal',
              onPress: () => {
                setWeightGoalLbs(prevGoalLbs.current);
                setWeightGoalKg(prevGoalKg.current);
              },
            },
            { text: 'Switch to "Gain weight"', style: 'default', onPress: () => doSave('gain') },
          ]
        );
        return;
      }

      if (mismatchGain) {
        Alert.alert(
          'Goal mismatch',
          'Your weight goal is lower than your current weight, but your fitness goal is set to "Gain weight". Keep the previous weight goal, or switch your fitness goal to "Lose weight"?',
          [
            {
              text: 'Keep previous weight goal',
              onPress: () => {
                setWeightGoalLbs(prevGoalLbs.current);
                setWeightGoalKg(prevGoalKg.current);
              },
            },
            { text: 'Switch to "Lose weight"', style: 'default', onPress: () => doSave('lose') },
          ]
        );
        return;
      }
    }

    doSave();
  };

  const imperial = units === 'imperial';
  const inp = [ms.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }];
  const lbl = [ms.label, { color: colors.subText }];

  return (
    <ModalShell visible={visible} title="Physical Stats" colors={colors} onClose={onClose} onSave={handleSave} saving={saving}>
      <Text style={lbl}>Units</Text>
      <ChipRow
        options={[{ key: 'imperial', label: 'Imperial (ft / lbs)' }, { key: 'metric', label: 'Metric (cm / kg)' }]}
        selected={units} onSelect={(v) => setUnits(v as 'imperial' | 'metric')} colors={colors}
      />

      <Text style={lbl}>Height</Text>
      {imperial ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput style={[inp, { flex: 1 }]} value={heightFt} onChangeText={setHeightFt} placeholder="ft" placeholderTextColor={colors.subText} keyboardType="numeric" />
          <TextInput style={[inp, { flex: 1 }]} value={heightIn} onChangeText={setHeightIn} placeholder="in" placeholderTextColor={colors.subText} keyboardType="numeric" />
        </View>
      ) : (
        <TextInput style={inp} value={heightCm} onChangeText={setHeightCm} placeholder="cm" placeholderTextColor={colors.subText} keyboardType="numeric" />
      )}

      <Text style={lbl}>Current Weight</Text>
      <TextInput
        style={inp}
        value={imperial ? weightLbs : weightKg}
        onChangeText={imperial ? setWeightLbs : setWeightKg}
        placeholder={imperial ? 'lbs' : 'kg'}
        placeholderTextColor={colors.subText}
        keyboardType="decimal-pad"
      />

      <Text style={lbl}>Weight Goal</Text>
      <TextInput
        style={inp}
        value={imperial ? weightGoalLbs : weightGoalKg}
        onChangeText={imperial ? setWeightGoalLbs : setWeightGoalKg}
        placeholder={imperial ? 'lbs' : 'kg'}
        placeholderTextColor={colors.subText}
        keyboardType="decimal-pad"
      />
    </ModalShell>
  );
}

// ─── Goal modal ───────────────────────────────────────────────────────────────

function GoalModal({ visible, colors, onClose, onSaved }: {
  visible: boolean; colors: any; onClose: () => void; onSaved: () => void;
}) {
  const [goal, setGoal]       = useState('');
  const [activity, setActivity] = useState('');
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        await loadAccountProfileForCurrentUser({ syncToStorage: true });
      } catch {}
      const [g, a] = await AsyncStorage.multiGet(['onboard.goal', 'onboard.activity']);
      setGoal(g[1] ?? '');
      setActivity(a[1] ?? '');
    })();
  }, [visible]);

  const handleSave = async () => {
    if (!goal) { Alert.alert('Missing field', 'Please select a goal.'); return; }
    if (!activity) { Alert.alert('Missing field', 'Please select an activity level.'); return; }
    setSaving(true);
    try {
      await AsyncStorage.multiSet([['onboard.goal', goal], ['onboard.activity', activity]]);
      await saveAccountProfileForCurrentUser({ goal, activity });
      onSaved();
    } catch { Alert.alert('Error', 'Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  const lbl = [ms.label, { color: colors.subText }];

  return (
    <ModalShell visible={visible} title="Goal & Activity" colors={colors} onClose={onClose} onSave={handleSave} saving={saving}>
      <Text style={lbl}>Goal</Text>
      <ChipRow
        options={[
          { key: 'lose',     label: 'Lose weight' },
          { key: 'maintain', label: 'Maintain weight' },
          { key: 'gain',     label: 'Gain weight' },
          { key: 'recomp',   label: 'Body recomp' },
        ]}
        selected={goal} onSelect={setGoal} colors={colors} wrap
      />

      <Text style={lbl}>Activity level</Text>
      <ChipRow
        options={[
          { key: 'sedentary', label: 'Sedentary' },
          { key: 'light',     label: 'Lightly active' },
          { key: 'moderate',  label: 'Moderately active' },
          { key: 'active',    label: 'Very active' },
          { key: 'athlete',   label: 'Athlete' },
        ]}
        selected={activity} onSelect={setActivity} colors={colors} wrap
      />
    </ModalShell>
  );
}

// ─── Chip selector ────────────────────────────────────────────────────────────

function ChipRow({ options, selected, onSelect, colors, wrap = false }: {
  options: { key: string; label: string }[];
  selected: string;
  onSelect: (key: string) => void;
  colors: any;
  wrap?: boolean;
}) {
  return (
    <View style={[ms.chipRow, wrap && { flexWrap: 'wrap' }]}>
      {options.map((o) => {
        const active = selected === o.key;
        return (
          <Pressable
            key={o.key}
            onPress={() => onSelect(o.key)}
            style={[
              ms.chip,
              { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + '20' : colors.card },
              wrap && { marginBottom: 8 },
            ]}
          >
            <Text style={[ms.chipText, { color: active ? colors.primary : colors.subText }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 18, fontWeight: '900' },
  scroll: { padding: 20, gap: 16 },
  heroCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center', gap: 6, marginBottom: 4 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  heroName:  { fontSize: 22, fontWeight: '900' },
  heroEmail: { fontSize: 14, fontWeight: '600' },
  card: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '900' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoLabel: { fontSize: 14, fontWeight: '700', flex: 1 },
  infoValue: { fontSize: 14, fontWeight: '800', flex: 1, textAlign: 'right' },
  divider: { height: 1 },
});

const ms = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  title:  { fontSize: 17, fontWeight: '900' },
  cancel: { fontSize: 16, fontWeight: '700' },
  save:   { fontSize: 16, fontWeight: '900' },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  label:  { fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 20 },
  input: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontWeight: '700',
  },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  chip: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  chipText: { fontSize: 13, fontWeight: '800' },
});

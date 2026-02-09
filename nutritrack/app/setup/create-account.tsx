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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function CreateAccountScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [tEmail, setTEmail] = useState(false);
  const [tPass, setTPass] = useState(false);
  const [tConfirm, setTConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const emailOk = useMemo(() => {
    const e = email.trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }, [email]);

  const passOk = useMemo(() => password.length >= 6, [password]);
  const confirmOk = useMemo(() => confirm.length > 0 && confirm === password, [confirm, password]);

  const formValid = emailOk && passOk && confirmOk;

  const friendlyFirebaseError = (code?: string) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'That email is already in use. Try logging in instead.';
      case 'auth/invalid-email':
        return 'That email address is invalid.';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 6 characters.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      default:
        return 'Signup failed. Please try again.';
    }
  };

  const handleCreate = async () => {
    if (!formValid || loading) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const cleanEmail = email.trim().toLowerCase();

      await createUserWithEmailAndPassword(auth, cleanEmail, password);

      // Optional: store email for display later
      await AsyncStorage.setItem('onboard.email', cleanEmail);

      // Go to dashboard after account creation
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      setErrorMsg(friendlyFirebaseError(err?.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="key-outline" size={28} color="#FFFFFF" />
              </View>

              <Text style={styles.headerTitle}>Create your account</Text>
              <Text style={styles.headerSubtitle}>
                Save your plan and start logging meals.
              </Text>

              {/* Progress: after summary (optional visual) */}
              <View style={styles.progressRow}>
                <View style={[styles.progressBar, styles.progressActive]} />
                <View style={[styles.progressBar, styles.progressActive]} />
                <View style={[styles.progressBar, styles.progressActive]} />
                <View style={[styles.progressBar, styles.progressActive]} />
                <View style={[styles.progressBar, styles.progressActive]} />
              </View>
            </View>

            {/* Form */}
            <View style={styles.card}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                onBlur={() => setTEmail(true)}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, tEmail && !emailOk ? styles.inputError : null]}
              />
              {tEmail && !emailOk && (
                <Text style={styles.errorText}>Enter a valid email address.</Text>
              )}

              <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                onBlur={() => setTPass(true)}
                placeholder="At least 6 characters"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                style={[styles.input, tPass && !passOk ? styles.inputError : null]}
              />
              {tPass && !passOk && (
                <Text style={styles.errorText}>Password must be at least 6 characters.</Text>
              )}

              <Text style={[styles.label, { marginTop: 12 }]}>Confirm Password</Text>
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                onBlur={() => setTConfirm(true)}
                placeholder="Re-enter password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                style={[styles.input, tConfirm && !confirmOk ? styles.inputError : null]}
              />
              {tConfirm && !confirmOk && (
                <Text style={styles.errorText}>Passwords do not match.</Text>
              )}

              {errorMsg ? <Text style={styles.firebaseError}>{errorMsg}</Text> : null}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <LinearGradient
              colors={
                formValid && !loading
                  ? ['#4CA1DE', '#1E90D6']
                  : ['#C7D2FE', '#A5B4FC']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaWrap}
            >
              <Pressable
                onPress={handleCreate}
                disabled={!formValid || loading}
                style={[styles.ctaButton, (!formValid || loading) && { opacity: 0.75 }]}
              >
                <Text style={styles.ctaText}>
                  {loading ? 'Creating...' : 'Create Account'}
                </Text>
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
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 24 },

  header: { alignItems: 'center', marginTop: 90, marginBottom: 18 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E90D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, color: '#0B2C5E', fontWeight: '800', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: '#4CA1DE', textAlign: 'center', marginTop: 6 },

  progressRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  progressBar: { width: 36, height: 6, backgroundColor: '#E5E7EB', borderRadius: 999 },
  progressActive: { backgroundColor: '#1E90D6' },

  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  label: { fontSize: 12, color: '#64748B', fontWeight: '800', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  inputError: { borderColor: '#F87171' },

  errorText: { color: '#DC2626', fontSize: 12, marginTop: 6, fontWeight: '700' },
  firebaseError: { marginTop: 12, color: '#DC2626', fontSize: 13, fontWeight: '900' },

  footer: { paddingBottom: 28 },
  ctaWrap: { borderRadius: 14, overflow: 'hidden' },
  ctaButton: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.2 },

  backLink: {
    color: '#1E90D6',
    fontWeight: '800',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

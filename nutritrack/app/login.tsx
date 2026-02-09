// app/login.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Firebase
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const emailOk = useMemo(() => {
    const v = email.trim();
    // simple email check 
    return v.length > 3 && v.includes('@') && v.includes('.');
  }, [email]);

  const passOk = useMemo(() => password.length >= 6, [password]);

  const formValid = emailOk && passOk && !loading;

  const friendlyFirebaseError = (code?: string) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'That email address is not valid.';
      case 'auth/user-not-found':
        return 'No account found with that email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Try again.';
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a bit and try again.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      default:
        return 'Login failed. Please try again.';
    }
  };

  const handleLogin = async () => {
    setTouched({ email: true, password: true });
    setErrorMsg('');

    if (!formValid) return;

    try {
      setLoading(true);

      const cleanEmail = email.trim().toLowerCase();
      await signInWithEmailAndPassword(auth, cleanEmail, password);

      // Auth guard in app/_layout.tsx will route  to /(tabs)/dashboard automatically.
      // But we can still force it here for instant navigation:
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      const code = err?.code as string | undefined;
      setErrorMsg(friendlyFirebaseError(code));
    } finally {
      setLoading(false);
    }
  };

  const goBackToOnboarding = () => {
    router.replace('/(onboarding)');
  };

  const goToSignup = () => {
    router.push('/setup/signup');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="log-in-outline" size={28} color="#FFFFFF" />
            </View>

            <Text style={styles.headerTitle}>Welcome back</Text>
            <Text style={styles.headerSubtitle}>Login to continue tracking</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errorMsg) setErrorMsg('');
              }}
              onBlur={() => setTouched((p) => ({ ...p, email: true }))}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.input,
                touched.email && !emailOk ? styles.inputError : null,
              ]}
              placeholderTextColor="#9CA3AF"
            />
            {touched.email && !emailOk && (
              <Text style={styles.errorText}>Enter a valid email.</Text>
            )}

            <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
            <TextInput
              placeholder="Minimum 6 characters"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errorMsg) setErrorMsg('');
              }}
              onBlur={() => setTouched((p) => ({ ...p, password: true }))}
              secureTextEntry
              autoCapitalize="none"
              style={[
                styles.input,
                touched.password && !passOk ? styles.inputError : null,
              ]}
              placeholderTextColor="#9CA3AF"
            />
            {touched.password && !passOk && (
              <Text style={styles.errorText}>
                Password must be at least 6 characters.
              </Text>
            )}

            {/* Firebase error */}
            {!!errorMsg && (
              <View style={styles.bannerError}>
                <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
                <Text style={styles.bannerErrorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Login button */}
            <LinearGradient
              colors={formValid ? ['#4CA1DE', '#1E90D6'] : ['#C7D2FE', '#A5B4FC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaWrap}
            >
              <Pressable
                style={[styles.ctaButton, !formValid && { opacity: 0.75 }]}
                onPress={handleLogin}
                disabled={!formValid}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.ctaText}>Login</Text>
                )}
              </Pressable>
            </LinearGradient>

            {/* Links */}
            <Pressable onPress={goToSignup} style={styles.linkRow} hitSlop={10}>
              <Text style={styles.linkText}>
                Don’t have an account? <Text style={styles.linkStrong}>Sign up</Text>
              </Text>
            </Pressable>
          </View>

          {/* Back */}
          <Pressable onPress={goBackToOnboarding} hitSlop={10} style={styles.backRow}>
            <Text style={styles.backLink}>Back</Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 24 },

  header: {
    alignItems: 'center',
    marginTop: 110,
    marginBottom: 22,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E90D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0B2C5E',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4CA1DE',
    textAlign: 'center',
  },

  form: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  inputError: {
    borderColor: '#F87171',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '700',
  },

  bannerError: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  bannerErrorText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },

  ctaWrap: { borderRadius: 16, overflow: 'hidden', marginTop: 14 },
  ctaButton: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },

  linkRow: { marginTop: 14, alignItems: 'center' },
  linkText: { color: '#4CA1DE', fontSize: 13, fontWeight: '700' },
  linkStrong: { color: '#0B2C5E', fontWeight: '900', textDecorationLine: 'underline' },

  backRow: { marginTop: 14, alignItems: 'center' },
  backLink: {
    color: '#1E90D6',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});

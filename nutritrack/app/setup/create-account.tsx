// app/setup/create-account.tsx

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
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CreateAccountScreen() {
  // Final onboarding step: user sets email + password for login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Track if user has interacted with fields so errors don't show immediately
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);

  // Basic email validation (just enough for onboarding)
  const emailOk = useMemo(() => {
    const trimmed = email.trim();
    return trimmed.length > 3 && trimmed.includes('@');
  }, [email]);

  // Basic password validation
  const passwordOk = useMemo(() => password.length >= 6, [password]);

  const formValid = emailOk && passwordOk;

  const handleFinish = async () => {
    if (!formValid) return;

    const cleanEmail = email.trim().toLowerCase();

    // Store email + flag that user finished full onboarding
    await AsyncStorage.setItem('onboard.email', cleanEmail);
    await AsyncStorage.setItem('onboard.hasFinished', 'true');

    // Later this is where real auth (Firebase, Supabase, custom API) will plug in
    router.replace('/(tabs)/dashboard');
  };

  const handleGoogleSignUp = () => {
    // Placeholder for Google auth wiring
    console.log('TODO: Google sign up');
  };

  const handleAppleSignUp = () => {
    // Placeholder for Apple auth wiring
    console.log('TODO: Apple sign up');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          {/* Header: final step messaging */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed-outline" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Set up your login</Text>
            <Text style={styles.headerSubtitle}>
              Create your email and password so you can sign back into NutriTrack.
            </Text>
          </View>

          {/* Scrollable content so smaller screens can still reach everything */}
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Email field */}
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onBlur={() => setTouchedEmail(true)}
              style={[
                styles.input,
                !emailOk && touchedEmail && styles.inputError,
              ]}
              placeholderTextColor="#9CA3AF"
            />
            {!emailOk && touchedEmail && (
              <Text style={styles.errorText}>Enter a valid email address.</Text>
            )}

            {/* Password field */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Password</Text>
            <TextInput
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onBlur={() => setTouchedPassword(true)}
              style={[
                styles.input,
                !passwordOk && touchedPassword && styles.inputError,
              ]}
              placeholderTextColor="#9CA3AF"
            />
            {!passwordOk && touchedPassword && (
              <Text style={styles.errorText}>
                Password should be at least 6 characters.
              </Text>
            )}

            {/* OR divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social auth buttons */}
            <View style={styles.socialRow}>
              <Pressable style={styles.socialButton} onPress={handleGoogleSignUp}>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={styles.socialText}>Google</Text>
              </Pressable>

              <Pressable
                style={[styles.socialButton, styles.appleButton]}
                onPress={handleAppleSignUp}
              >
                <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                <Text style={[styles.socialText, { color: '#FFFFFF' }]}>
                  Apple
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          {/* Footer: final CTA */}
          <View style={styles.footer}>
            <LinearGradient
              colors={formValid ? ['#4CA1DE', '#1E90D6'] : ['#C7D2FE', '#A5B4FC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaWrap}
            >
              <Pressable
                style={[styles.ctaButton, !formValid && { opacity: 0.7 }]}
                onPress={handleFinish}
                disabled={!formValid}
              >
                <Text style={styles.ctaText}>Finish!</Text>
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

  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 16,
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
    color: '#0B2C5E',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#4CA1DE',
    textAlign: 'center',
    marginBottom: 4,
  },

  formScroll: {
    flex: 1,
  },

  formContent: {
    paddingBottom: 24,
  },

  fieldLabel: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 6,
    fontWeight: '500',
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },

  inputError: {
    borderColor: '#F87171',
  },

  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  dividerText: {
    marginHorizontal: 8,
    fontSize: 12,
    color: '#6B7280',
  },

  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },

  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },

  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },

  socialText: {
    fontSize: 14,
    color: '#111827',
  },

  footer: {
    paddingBottom: 32,
  },

  ctaWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },

  ctaButton: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  backLink: {
    color: '#1E90D6',
    fontWeight: '700',
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 4,
  },
});

// app/signup.tsx
import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Poppins_500Medium,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function SignUpNameStep() {
  const [fontsLoaded] = useFonts({
    Poppins_500Medium,
    Poppins_700Bold,
  });

  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  const nameOk = useMemo(() => name.trim().length >= 2, [name]);
  const formValid = nameOk;

  const handleContinue = async () => {
    if (!formValid) return;

    await AsyncStorage.setItem('onboard.fullName', name.trim());
    router.push('/setup/sex-dob');
  };

  if (!fontsLoaded) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={28} color="#FFFFFF" />
            </View>

            <Text style={styles.headerTitle}>Let’s get to know you</Text>
            <Text style={styles.headerSubtitle}>What’s your name?</Text>

            {/* progress bar */}
            <View style={styles.progressRow}>
              <View style={[styles.progressBar, styles.progressActive]} />
              <View style={styles.progressBar} />
              <View style={styles.progressBar} />
              <View style={styles.progressBar} />
              <View style={styles.progressBar} />
            </View>
          </View>

          {/* Name input */}
          <View style={styles.center}>
            <TextInput
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              onBlur={() => setTouched(true)}
              style={[
                styles.input,
                !nameOk && touched ? styles.inputError : null,
              ]}
              placeholderTextColor="#9CA3AF"
            />
            {!nameOk && touched && (
              <Text style={styles.errorText}>Please enter your name.</Text>
            )}
          </View>

          {/* Continue button + Back */}
          <View style={styles.footer}>
            <LinearGradient
              colors={formValid ? ['#4CA1DE', '#1E90D6'] : ['#C7D2FE', '#A5B4FC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaWrap}
            >
              <Pressable
                style={[styles.ctaButton, !formValid && { opacity: 0.7 }]}
                onPress={handleContinue}
                disabled={!formValid}
              >
                <Text style={styles.ctaText}>Continue</Text>
              </Pressable>
            </LinearGradient>

            {/* This is the matching BACK BUTTON */}
            <Pressable
              onPress={() => router.push('/')}
              hitSlop={10}
              style={{ marginTop: 8 }}
            >
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
    marginTop: 120,
    marginBottom: 30,
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
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#0B2C5E',
    marginBottom: 4,
    textAlign: 'center',
  },

  headerSubtitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: '#4CA1DE',
    textAlign: 'center',
    marginBottom: 16,
  },

  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },

  progressBar: {
    width: 36,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
  },

  progressActive: { backgroundColor: '#1E90D6' },

  center: {
    flex: 1,
    width: '100%',
    marginTop: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 17,
    fontFamily: 'Poppins_500Medium',
    backgroundColor: '#FFFFFF',
  },

  inputError: {
    borderColor: '#F87171',
  },

  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 6,
    fontFamily: 'Poppins_500Medium',
  },

  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },

  ctaWrap: {
    width: '100%',
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
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.3,
  },

  backLink: {
    color: '#1E90D6',
    fontWeight: '700',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});

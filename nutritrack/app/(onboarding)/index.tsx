// app/(onboarding)/index.tsx

import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { markOnboardingSeen } from '@/lib/onboarding';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();

  // When user taps "Get Started"
  const handleStart = async () => {
    await markOnboardingSeen(); // Save onboarding completion
    router.replace('/(tabs)'); // Navigate to the main tabs screen
  };

  // When user taps "Login"
  const handleLogin = () => {
    router.push('/login'); // route to login page (root-level)
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Logo */}
      <Image
        source={require('@/assets/images/Logo.png')}
        style={styles.image}
        resizeMode="contain"
      />

      {/* Tagline */}
      <Text style={styles.subtitle}>
        Welcome to NutriFit, where nutrition goals are made for your fit.
      </Text>

      {/* Bottom Blue Block */}
      <LinearGradient
        colors={['#4CA1DE', '#1E90D6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.bottomBlock,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        <Pressable style={styles.ctaButton} onPress={handleStart}>
          <Text style={styles.ctaText}>GET STARTED</Text>
        </Pressable>

        <Pressable onPress={handleLogin} style={styles.loginRow}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.loginLink}>Login</Text>
          </Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
  },
  image: {
    width: 370,
    height: 120,
    marginTop: 200,
    marginBottom: 20,
  },
  subtitle: {
    color: '#4CA1DE',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontFamily: 'momoTrustDisplay-Regular', 
  },
  bottomBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButton: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginRow: { paddingVertical: 6, paddingHorizontal: 8 },
  footerText: { color: 'rgba(255,255,255,0.95)', fontSize: 14 },
  loginLink: {
    color: '#FFFFFF',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

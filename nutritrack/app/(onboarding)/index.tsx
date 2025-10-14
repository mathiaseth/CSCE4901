import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { markOnboardingSeen } from '@/lib/onboarding';

export default function OnboardingScreen() {
  // When user taps "Get Started"
  const handleStart = async () => {
    await markOnboardingSeen(); // save onboarding completion
    router.replace('/(tabs)');  // navigate to main app
  };

  // When user taps "Login"
  const handleLogin = () => {
    router.push('/login'); // route to login (once you add that page)
  };

  return (
    <View style={styles.container}>
      {/* App title */}
      <Text style={styles.title}>NutriFit</Text>

      {/* Apple illustration */}
      <Image
        source={require('@/assets/images/apple.png')} // export from Figma
        style={styles.image}
        resizeMode="contain"
      />

      {/* Tagline */}
      <Text style={styles.subtitle}>
        Easy to Track{'\n'}
        Easy to Reach{'\n'}
        Easy to Crack
      </Text>

      {/* Get Started button */}
      <Pressable style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>

      {/* Footer with login link */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text style={styles.loginLink} onPress={handleLogin}>
            Login
          </Text>
        </Text>
      </View>
    </View>
  );
}

// Styles — matching the figma design
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#26A9E1', // blue background for the frame
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 40,
  },
  image: {
    width: 160,
    height: 160,
    marginBottom: 40,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 60,
  },
  button: {
    backgroundColor: '#26A9E1', // matches background
    borderColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  footerText: {
    color: '#1E293B',
    fontSize: 14,
  },
  loginLink: {
    color: '#26A9E1',
    fontWeight: '700',
  },
});
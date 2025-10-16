import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/constants/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Login failed');
      }
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('userName', data.user?.name || '');
      router.replace('/(tabs)');
    } catch (err:any) {
      Alert.alert('Login error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome Back</Text>
        <Text style={styles.toNutriFit}>to NutriFit</Text>
        <Image source={require('@/assets/images/apple.png')} style={styles.apple} resizeMode="contain" />
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#6ED3F6"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#6ED3F6"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <Pressable onPress={() => Alert.alert('Forgot Password', 'Feature coming soon')} style={styles.forgotWrap}>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </Pressable>

        <Pressable style={styles.btn} onPress={onLogin} disabled={loading}>
          {loading ? <ActivityIndicator /> : <Text style={styles.btnText}>Login</Text>}
        </Pressable>

        <View style={styles.signupRow}>
          <Text style={styles.smallText}>Don&apos;t have an account?</Text>
          <Pressable onPress={() => router.push('/(onboarding)')}>
            <Text style={styles.link}> Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const BLUE = '#26A9E1';
const LIGHT_BLUE = '#6ED3F6';
const WHITE = '#ffffff';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLUE, paddingHorizontal: 24, paddingTop: 80 },
  header: { alignItems: 'center', marginBottom: 28 },
  welcome: { fontSize: 28, fontWeight: '800', color: WHITE, marginBottom: 2 },
  toNutriFit: { fontSize: 12, color: WHITE, opacity: 0.9 },
  apple: { width: 140, height: 140, marginTop: 16 },
  form: { marginTop: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    color: WHITE,
    marginBottom: 12,
  },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 16 },
  forgot: { color: WHITE, opacity: 0.9, fontSize: 12 },
  btn: {
    backgroundColor: WHITE,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  btnText: { color: BLUE, fontWeight: '800', fontSize: 16 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  smallText: { color: WHITE, opacity: 0.9, fontSize: 12 },
  link: { color: WHITE, fontWeight: '700', fontSize: 12 },
});

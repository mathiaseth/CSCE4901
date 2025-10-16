import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { BASE_URL } from '@/constants/api';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Missing Info', 'Please fill out all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Sign Up failed');

      Alert.alert('Success', 'Account created successfully!');
      router.replace('/login');
    } catch (err: any) {
      Alert.alert('Sign Up Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>For NutriFit</Text>

      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#6ED3F6"
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        placeholder="Email"
        placeholderTextColor="#6ED3F6"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#6ED3F6"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor="#6ED3F6"
        secureTextEntry
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <Text style={styles.terms}>I agree to the Terms & Conditions</Text>

      <Pressable style={styles.btn} onPress={onSignUp} disabled={loading}>
        {loading ? <ActivityIndicator /> : <Text style={styles.btnText}>Sign Up</Text>}
      </Pressable>

      <View style={styles.loginRow}>
        <Text style={styles.smallText}>Already have an account?</Text>
        <Pressable onPress={() => router.replace('/login')}>
          <Text style={styles.link}> Login</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const BLUE = '#26A9E1';
const WHITE = '#ffffff';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: BLUE,
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: WHITE,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: WHITE,
    opacity: 0.9,
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    color: WHITE,
    width: '100%',
    marginBottom: 12,
  },
  terms: {
    fontSize: 10,
    color: WHITE,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 20,
  },
  btn: {
    backgroundColor: WHITE,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 18,
  },
  btnText: {
    color: BLUE,
    fontWeight: '800',
    fontSize: 16,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  smallText: {
    color: WHITE,
    opacity: 0.9,
    fontSize: 12,
  },
  link: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 12,
  },
});

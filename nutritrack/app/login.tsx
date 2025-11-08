// app/login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd,
      });

      if (error) {
        Alert.alert('Login failed', error.message ?? 'Unknown error');
        return;
      }

      // Session present -> route into app
      router.replace('/(tabs)/dashboard');
    } catch (e: any) {
      Alert.alert('Login failed', e?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={pwd}
        onChangeText={setPwd}
      />

      <Pressable style={[styles.btn, submitting && { opacity: 0.7 }]} onPress={handleLogin} disabled={submitting}>
        <Text style={styles.btnText}>{submitting ? 'Signing in…' : 'Continue'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12 },
  btn: { backgroundColor: '#26A9E1', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});

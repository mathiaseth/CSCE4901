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
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons'; // 👈 Import icon set

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [showPwd, setShowPwd] = useState(false); // 👈 password visibility
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Basic validators
  const emailOk = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const pwdOk = useMemo(() => pwd.length >= 8, [pwd]);
  const confirmOk = useMemo(() => confirm === pwd && confirm.length > 0, [confirm, pwd]);
  const nameOk = useMemo(() => name.trim().length >= 2, [name]);
  const formValid = nameOk && emailOk && pwdOk && confirmOk;

  const handleContinue = async () => {
    //router.replace('/setup/personal-info');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Let’s get a few details to personalize NutriTrack.</Text>

          {/* Name */}
          <TextInput
            placeholder="Full name"
            value={name}
            onChangeText={setName}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            style={[styles.input, !nameOk && touched.name ? styles.inputError : null]}
            placeholderTextColor="#9CA3AF"
          />
          {!nameOk && touched.name && (
            <Text style={styles.errorText}>Please enter your name.</Text>
          )}

          {/* Email */}
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, !emailOk && touched.email ? styles.inputError : null]}
            placeholderTextColor="#9CA3AF"
          />
          {!emailOk && touched.email && (
            <Text style={styles.errorText}>Enter a valid email address.</Text>
          )}

          {/* Password */}
          <View style={[styles.inputContainer, !pwdOk && touched.pwd ? styles.inputError : null]}>
            <TextInput
              placeholder="Password (min 8 chars)"
              value={pwd}
              onChangeText={setPwd}
              onBlur={() => setTouched((t) => ({ ...t, pwd: true }))}
              secureTextEntry={!showPwd} // 👈 hide or show
              style={styles.inputField}
              placeholderTextColor="#9CA3AF"
            />
            <Pressable onPress={() => setShowPwd(!showPwd)}>
              <Ionicons
                name={showPwd ? 'eye-off-outline' : 'eye-outline'} // 👁 toggle
                size={22}
                color="#9CA3AF"
              />
            </Pressable>
          </View>
          {!pwdOk && touched.pwd && (
            <Text style={styles.errorText}>Password must be at least 8 characters.</Text>
          )}

          {/* Confirm Password */}
          <View style={[styles.inputContainer, !confirmOk && touched.confirm ? styles.inputError : null]}>
            <TextInput
              placeholder="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              secureTextEntry={!showConfirm}
              style={styles.inputField}
              placeholderTextColor="#9CA3AF"
            />
            <Pressable onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#9CA3AF"
              />
            </Pressable>
          </View>
          {!confirmOk && touched.confirm && (
            <Text style={styles.errorText}>Passwords do not match.</Text>
          )}

          {/* Continue Button */}
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
              <Text style={styles.ctaText}>Create Account</Text>
            </Pressable>
          </LinearGradient>

          {/* Footer: Login link */}
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.loginLink} onPress={() => router.push('/login')}>
              Login
            </Text>
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 10, justifyContent: 'center' },
  title: {
    fontFamily: 'MomoTrustDisplay_400Regular',
    fontSize: 28,
    color: '#4CA1DE',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Kavoon_400Regular',
    fontSize: 14,
    color: '#4CA1DE',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  inputField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#F87171',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: -6,
    marginBottom: 6,
  },
  ctaWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 12,
  },
  ctaButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerText: {
    textAlign: 'center',
    color: '#1E293B',
    marginTop: 2,
    fontSize: 14,
  },
  loginLink: {
    color: '#26A9E1',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
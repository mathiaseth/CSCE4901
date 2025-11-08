// lib/supabase.ts
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Read from app.config.ts -> expo.extra
const extra =
  (Constants.expoConfig?.extra as any) ??
  (Constants.manifest?.extra as any) ?? {};

const SUPABASE_URL: string = extra.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY: string = extra.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase env missing from expo.extra', {
    hasUrl: !!SUPABASE_URL,
    hasKey: !!SUPABASE_ANON_KEY,
  });
  throw new Error(
    'Supabase URL/key missing. Add them to app.config.ts -> expo.extra and restart with "npx expo start -c".'
  );
}

// Native (iOS/Android): SecureStore; Web: in-memory fallback
const memory = new Map<string, string>();
const WebMemoryAdapter = {
  getItem: async (key: string) => (memory.has(key) ? memory.get(key)! : null),
  setItem: async (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: async (key: string) => {
    memory.delete(key);
  },
};

const SecureStoreAdapter = {
  getItem: async (key: string) => {
    const v = await SecureStore.getItemAsync(key);
    return v ?? null;
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

const StorageAdapter = Platform.OS === 'web' ? WebMemoryAdapter : SecureStoreAdapter;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: StorageAdapter as any,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

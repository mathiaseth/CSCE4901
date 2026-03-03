// lib/theme.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

export type AppThemeMode = 'light' | 'dark';

const KEY_THEME_MODE = 'theme_mode';

export const LightColors = {
  background: '#FFFFFF',
  card: '#F9FAFB',
  border: '#E5E7EB',
  text: '#0B2C5E',
  subText: '#64748B',
  primary: '#1E90D6',
};

export const DarkColors = {
  background: '#0B1220',
  card: '#0F1A2B',
  border: '#23324A',
  text: '#E6EEF8',
  subText: '#A8B6CC',
  primary: '#4CA1DE',
};

export function colorsFor(mode: AppThemeMode) {
  return mode === 'dark' ? DarkColors : LightColors;
}

export async function getThemeMode(): Promise<AppThemeMode> {
  const v = await AsyncStorage.getItem(KEY_THEME_MODE);
  return v === 'dark' ? 'dark' : 'light';
}

export async function setThemeMode(mode: AppThemeMode): Promise<void> {
  await AsyncStorage.setItem(KEY_THEME_MODE, mode);
}

type ThemeContextValue = {
  mode: AppThemeMode;
  colors: typeof LightColors;
  setMode: (mode: AppThemeMode) => void;
};

export const ThemeContext = React.createContext<ThemeContextValue>({
  mode: 'light',
  colors: LightColors,
  setMode: () => {},
});

export function useAppTheme() {
  return React.useContext(ThemeContext);
}
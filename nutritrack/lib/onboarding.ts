import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nutritrack_seen_onboarding';

// Save that onboarding was completed
export const markOnboardingSeen = async () => {
  await AsyncStorage.setItem(KEY, 'true');
};

// Check if onboarding has been completed before
export const hasSeenOnboarding = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(KEY);
  return value === 'true';
};

// Export key for optional dev reset use
export const ONBOARDING_KEY = KEY;
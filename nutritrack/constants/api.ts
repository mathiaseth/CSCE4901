import { Platform } from 'react-native';

/**
 * Helper to choose a sensible base URL for the server depending on the device.
 * - iOS simulator can reach localhost directly
 * - Android emulator needs 10.0.2.2 to reach host machine
 * - Physical devices should point to your machine's LAN IP (override BASE_URL if needed)
 */
const host =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000'
    : 'http://localhost:5000';

export const BASE_URL = host; // override to your LAN IP if testing on device

// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
  apiKey: "AIzaSyBjSL7eTki5PKjyUlNV3_hwGkEzI-H3O4c",
  authDomain: "nutrifit-31b64.firebaseapp.com",
  projectId: "nutrifit-31b64",
  storageBucket: "nutrifit-31b64.firebasestorage.app",
  messagingSenderId: "397234740919",
  appId: "1:397234740919:web:d26d480044eeef7f66f732",
  measurementId: "G-4YK07J70E5"
};

// Prevent re-initializing in Expo Fast Refresh
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);


export const auth = getApps().length
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

export default app;
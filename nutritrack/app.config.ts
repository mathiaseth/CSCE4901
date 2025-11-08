// app.config.ts
export default {
  expo: {
    name: "NutriTrack",
    slug: "nutritrack",
    scheme: "nutritrack",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    updates: { fallbackToCacheTimeout: 0 },
    assetBundlePatterns: ["**/*"],
    ios: { supportsTablet: true },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
    },
    web: { favicon: "./assets/favicon.png" },

    // Supabase environment variables
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: "https://ktxcxlblzxaycuesjilf.supabase.co",
      EXPO_PUBLIC_SUPABASE_ANON_KEY:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eGN4bGJsenhheWN1ZXNqaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTgxOTYsImV4cCI6MjA3ODE5NDE5Nn0.4qZfWjg7No7xy57jdE0bKCvJuFHBiHuxM9EmPHTr6ms",
    },
  },
};

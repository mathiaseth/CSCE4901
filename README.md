# NutriFit

A cross-platform mobile nutrition and fitness tracking app built with React Native (Expo) and Firebase.

---

## Features

- **Food Logging** — Search the USDA FoodData Central database, log meals by category (breakfast, lunch, dinner, snacks), and track daily macros and calories.
- **Custom Meals** — Create and save custom meals with per-ingredient nutritional detail.
- **Dashboard** — Daily calorie ring, macro breakdown (protein, carbs, fat), water intake tracker, calorie history calendar (week / month / year views), and today's food log.
- **Goals & Progress** — TDEE calculator using the Mifflin-St Jeor formula, personalized macro targets, and weight goal tracking with smart conflict detection.
- **Profile & Account** — Edit personal info (name, gender, date of birth, height, weight, weight goal, fitness goal, activity level) via per-section modals directly inside the app.
- **Streak Tracking** — Active streak, longest streak, and total tracked days shown consistently across Settings and Dashboard.
- **Water Reminders** — Scheduled push notifications to remind you to drink water throughout the day (powered by expo-notifications).
- **Dark Mode** — Full light/dark theme toggle with a persistent theme context.
- **Authentication** — Firebase Auth (email/password) with onboarding flow for new users and inline profile editing for accounts created externally.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native via Expo SDK 54 |
| Router | Expo Router v6 (file-based, typed routes) |
| Language | TypeScript |
| Auth & DB | Firebase Authentication + Firestore |
| Local Storage | AsyncStorage |
| Nutrition API | USDA FoodData Central (REST) |
| Notifications | expo-notifications |
| Icons | @expo/vector-icons (Ionicons) |

---

## Project Structure

```
nutritrack/
├── app/
│   ├── (tabs)/
│   │   ├── dashboard.tsx     # Home screen — calories, macros, water, calendar
│   │   ├── log-entry.tsx     # Food search and logging
│   │   ├── settings.tsx      # Settings, profile card, theme toggle
│   │   └── _layout.tsx       # Tab bar + auth route guard
│   ├── goals.tsx             # TDEE, macro targets, weight goal
│   ├── profile.tsx           # Account info with editable section modals
│   ├── login.tsx             # Login screen
│   ├── signup.tsx            # Sign-up screen
│   ├── onboarding.tsx        # First-run profile setup
│   └── notifications.tsx     # Notification preferences
├── context/
│   ├── ProfileContext.tsx    # Global user profile (single source of truth)
│   └── WaterContext.tsx      # Daily water intake state
├── lib/
│   ├── firebase.ts           # Firebase app, auth, Firestore init
│   └── theme.ts              # ThemeContext — light/dark colors
├── components/               # Shared UI components
└── assets/                   # Images, fonts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator / Android Emulator, or the Expo Go app on a physical device

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/CSCE4901.git
cd CSCE4901/nutritrack

# Install dependencies
npm install
```

### Environment Setup

Add your Firebase credentials to `lib/firebase.ts`:

```ts
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

You will also need a USDA FoodData Central API key. Add it to your food search logic:

```ts
const USDA_API_KEY = 'YOUR_USDA_API_KEY';
```

Get a free key at: https://fdc.nal.usda.gov/api-key-signup

### Running the App

```bash
npx expo start
```

Then press:
- `i` — open in iOS Simulator
- `a` — open in Android Emulator
- Scan the QR code with Expo Go on your phone

---

## Calorie & Macro Calculations

TDEE is calculated using the **Mifflin-St Jeor BMR** formula:

| Sex | Formula |
|---|---|
| Male | (10 x weight_kg) + (6.25 x height_cm) - (5 x age) + 5 |
| Female | (10 x weight_kg) + (6.25 x height_cm) - (5 x age) - 161 |

Activity multipliers:

| Level | Multiplier |
|---|---|
| Sedentary | 1.2 |
| Lightly active | 1.375 |
| Moderately active | 1.55 |
| Very active | 1.725 |
| Athlete | 1.9 |

Goal calorie adjustments:

| Goal | Adjustment |
|---|---|
| Lose weight | -500 kcal |
| Maintain weight | 0 kcal |
| Gain weight | +300 kcal |
| Body recomposition | 0 kcal |

Macro split (30 / 40 / 30):

- Protein = (targetCalories x 0.30) / 4
- Carbs   = (targetCalories x 0.40) / 4
- Fat     = (targetCalories x 0.30) / 9

---

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b feature/my-feature`
2. Commit your changes: `git commit -m "Add my feature"`
3. Push to the branch: `git push origin feature/my-feature`
4. Open a pull request

---

## License

This project was developed as part of CSCE 4901. All rights reserved.

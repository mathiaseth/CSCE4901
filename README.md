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

## Getting Started
### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/CSCE4901.git
cd CSCE4901/nutritrack

# Install dependencies
npm install
```

### Running the App

```bash
npx expo start
```

## License

This project was developed as part of CSCE 4901. All rights reserved.

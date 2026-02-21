# SaltSync Support Duty Scheduler - Deployment Guide

## 1. Firebase Setup
1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Firestore Database** in production mode.
3. Enable **Authentication** (Email/Password provider).
4. Create a **Web App** in your Firebase project settings.
5. Copy the configuration values to your environment variables in AI Studio.

## 2. Environment Variables
Set the following variables in the AI Studio Secrets panel:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## 3. Firestore Rules
Copy the content of `firestore.rules` from this project and paste it into the **Rules** tab of your Firestore Database in the Firebase Console.

## 4. Usage
- The system automatically seeds initial employees and 2026 holidays on first run.
- Use the **Generate Roster** button to create a 7-day schedule starting from the selected Saturday.
- Shifts rotate automatically for the *next* week's generation whenever a roster is saved.
- Export buttons allow downloading the current view as PDF or Excel.

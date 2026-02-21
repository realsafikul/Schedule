import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const getFirebaseConfig = () => {
  const configJson = import.meta.env.VITE_FIREBASE_CONFIG;
  
  if (configJson && configJson !== 'undefined') {
    try {
      // 1. Clean up common JS wrappers
      let cleaned = configJson
        .replace(/const firebaseConfig = /g, '')
        .replace(/let firebaseConfig = /g, '')
        .replace(/var firebaseConfig = /g, '')
        .replace(/;/g, '')
        .trim();

      // 2. If it's already valid JSON, parse it
      try {
        return JSON.parse(cleaned);
      } catch (e) {
        // 3. If not valid JSON (e.g. unquoted keys), try to convert it
        // This regex adds quotes to unquoted keys
        const jsonLike = cleaned
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/'/g, '"'); // Replace single quotes with double quotes
        return JSON.parse(jsonLike);
      }
    } catch (e) {
      console.error("Failed to parse VITE_FIREBASE_CONFIG. Please ensure it is a valid JSON or JS object.", e);
    }
  }

  // Fallback to individual variables
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
};

const firebaseConfig = getFirebaseConfig();

export const isConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { db, auth };

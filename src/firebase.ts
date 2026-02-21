import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const getFirebaseConfig = () => {
  const configJson = import.meta.env.VITE_FIREBASE_CONFIG;
  
  if (configJson && configJson !== 'undefined') {
    try {
      // Handle both raw JSON and the JS object format Firebase provides
      const cleanJson = configJson
        .replace(/const firebaseConfig = /g, '')
        .replace(/;/g, '')
        .trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      // If JSON.parse fails, it might be a JS object literal, which is harder to parse safely
      // but we can try a basic regex approach for the most common format
      console.warn("Failed to parse VITE_FIREBASE_CONFIG as JSON, trying fallback...");
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

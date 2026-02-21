import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const getFirebaseConfig = () => {
  const configJson = import.meta.env.VITE_FIREBASE_CONFIG;
  
  if (configJson && configJson !== 'undefined') {
    try {
      return JSON.parse(configJson);
    } catch (e) {
      // Try to clean up common JS object format if it's not pure JSON
      const cleaned = configJson
        .replace(/const firebaseConfig = /g, '')
        .replace(/let firebaseConfig = /g, '')
        .replace(/var firebaseConfig = /g, '')
        .replace(/;/g, '')
        .trim();
      
      try {
        // Simple regex to add quotes to keys
        const jsonLike = cleaned
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/'/g, '"');
        return JSON.parse(jsonLike);
      } catch (err) {
        console.error("Failed to parse Firebase config", err);
      }
    }
  }

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

export let db: Firestore | undefined;
export let auth: Auth | undefined;

if (isConfigured) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  console.warn("Firebase not configured. Please set VITE_FIREBASE_CONFIG.");
}

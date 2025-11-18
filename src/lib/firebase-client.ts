/**
 * Firebase client initialization.
 * Uses environment variables from .env.local
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    "❌ Firebase configuration is incomplete or missing.\n\n" +
      "Please fill in your Firebase credentials in .env.local:\n" +
      "1. Go to https://console.firebase.google.com\n" +
      "2. Create a project or select existing one\n" +
      "3. Get Web App credentials from Project Settings\n" +
      "4. Fill in these values in .env.local:\n" +
      "   - NEXT_PUBLIC_FIREBASE_API_KEY\n" +
      "   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\n" +
      "   - NEXT_PUBLIC_FIREBASE_PROJECT_ID\n" +
      "   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET\n" +
      "   - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID\n" +
      "   - NEXT_PUBLIC_FIREBASE_APP_ID\n" +
      "   - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID (optional)\n\n" +
      "See AUTH_SETUP.md for detailed instructions."
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

export default app;

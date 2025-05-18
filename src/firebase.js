import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAh0ss01IHpRSEpV-WKQwBKoexgkafCmUo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gama-jk-640c6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gama-jk-640c6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gama-jk-640c6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1001354199272",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1001354199272:web:78a1ac6837bb5e38dc495d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XFK6D95CE4"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 
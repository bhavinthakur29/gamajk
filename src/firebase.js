import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAh0ss01IHpRSEpV-WKQwBKoexgkafCmUo",
    authDomain: "gama-jk-640c6.firebaseapp.com",
    projectId: "gama-jk-640c6",
    storageBucket: "gama-jk-640c6.firebasestorage.app",
    messagingSenderId: "1001354199272",
    appId: "1:1001354199272:web:78a1ac6837bb5e38dc495d",
    measurementId: "G-XFK6D95CE4"
  };
  

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

let app;
let analytics = null;
let storage;
let auth;
let googleProvider;
let db;

try {
  app = initializeApp(firebaseConfig);
  
  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('Firebase Analytics no disponible:', error);
    }
  }

  storage = getStorage(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  db = getFirestore(app);
} catch (error) {
  console.error('Error crítico al inicializar Firebase:', error);
}

export { app, analytics, storage, auth, googleProvider, db };
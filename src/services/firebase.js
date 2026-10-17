// Firebase Client Configuration & Real-Time Sync Service
// Project: isb-portal (Ma'had Imam Syafi'i Brebes - Maisya-Saku)
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDocs, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAwuR_YnHLeikl1HE6KsveXjZVy8xSwdsw",
  authDomain: "isb-portal.firebaseapp.com",
  projectId: "isb-portal",
  storageBucket: "isb-portal.firebasestorage.app",
  messagingSenderId: "440240262246",
  appId: "1:440240262246:web:0f314f7fa19cd8d0f8f1a7"
};

// Default / Stored configuration
const STORAGE_CONFIG_KEY = 'maisya_saku_firebase_config';
const USE_DEMO_KEY = 'maisya_saku_use_demo_mode';

export function getSavedFirebaseConfig() {
  const local = localStorage.getItem(STORAGE_CONFIG_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed && parsed.apiKey) return parsed;
    } catch (e) {
      console.error('Failed to parse stored firebase config', e);
    }
  }
  
  // Fallback to Vite environment variables or production isb-portal config
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId
  };
}

export function saveFirebaseConfig(config) {
  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
  window.location.reload();
}

export function isDemoMode() {
  const saved = localStorage.getItem(USE_DEMO_KEY);
  if (saved !== null) {
    return saved === 'true';
  }
  // Default to live Firebase since credentials are provided
  const config = getSavedFirebaseConfig();
  return !config.apiKey || !config.projectId;
}

export function setDemoMode(isDemo) {
  localStorage.setItem(USE_DEMO_KEY, isDemo ? 'true' : 'false');
  window.location.reload();
}

let app = null;
let db = null;

const currentConfig = getSavedFirebaseConfig();
if (currentConfig.apiKey && currentConfig.projectId && !isDemoMode()) {
  try {
    app = getApps().length === 0 ? initializeApp(currentConfig) : getApps()[0];
    db = getFirestore(app);
    console.log('Firebase Firestore connected successfully for project:', currentConfig.projectId);
  } catch (err) {
    console.warn('Firebase init error, falling back to local sync mode:', err);
  }
}

export { app, db };

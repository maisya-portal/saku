// Firebase Client Configuration & Real-Time Sync Service
// Supports both live Firebase Project and Zero-Config Offline/Demo Mode
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

// Default / Stored configuration
const STORAGE_CONFIG_KEY = 'maisya_saku_firebase_config';
const USE_DEMO_KEY = 'maisya_saku_use_demo_mode';

export function getSavedFirebaseConfig() {
  const local = localStorage.getItem(STORAGE_CONFIG_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error('Failed to parse stored firebase config', e);
    }
  }
  
  // Fallback to Vite environment variables if defined
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
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
    console.log('Firebase initialized successfully for project:', currentConfig.projectId);
  } catch (err) {
    console.warn('Firebase init error, falling back to local sync mode:', err);
  }
}

export { app, db };

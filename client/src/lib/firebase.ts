import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Debug the exact API key value
const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
console.log('🔍 Raw API Key Debug:');
console.log('- Length:', rawApiKey?.length);
console.log('- First 20 chars:', rawApiKey?.substring(0, 20));
console.log('- Last 10 chars:', rawApiKey?.substring(-10));
console.log('- Has whitespace:', /\s/.test(rawApiKey || ''));
console.log('- Has quotes:', rawApiKey?.includes('"') || rawApiKey?.includes("'"));
console.log('- Character codes (first 10):', Array.from(rawApiKey?.substring(0, 10) || '').map(c => c.charCodeAt(0)));

const firebaseConfig = {
  apiKey: rawApiKey?.trim(), // Trim any whitespace
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('🔥 Final API Key being used:', firebaseConfig.apiKey?.substring(0, 20) + '...');

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

export default app;

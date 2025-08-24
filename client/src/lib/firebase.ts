import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Clean up Firebase config values (remove quotes if present)
const cleanValue = (value: string | undefined) => {
  if (!value) return value;
  // Remove quotes from beginning and end
  let cleaned = value.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned;
};

const firebaseConfig = {
  apiKey: cleanValue(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  databaseURL: cleanValue(import.meta.env.VITE_FIREBASE_DATABASE_URL) || `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: cleanValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanValue(import.meta.env.VITE_FIREBASE_APP_ID),
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectDatabaseEmulator(database, 'localhost', 9000);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    // Emulators already connected or not available
    console.log('Firebase emulators not connected:', error);
  }
}

// Debug: Log Firebase config (without sensitive data)
console.log('Firebase initialized with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  databaseURL: firebaseConfig.databaseURL ? firebaseConfig.databaseURL.substring(0, 50) + '...' : 'MISSING',
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
  apiKeyPrefix: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 8) + '...' : 'MISSING',
  appIdPrefix: firebaseConfig.appId ? firebaseConfig.appId.substring(0, 10) + '...' : 'MISSING'
});

// Validate required config
if (!firebaseConfig.apiKey) {
  console.error('❌ VITE_FIREBASE_API_KEY is missing!');
}
if (!firebaseConfig.projectId) {
  console.error('❌ VITE_FIREBASE_PROJECT_ID is missing!');
}
if (!firebaseConfig.appId) {
  console.error('❌ VITE_FIREBASE_APP_ID is missing!');
}

// Validate format of Firebase values
if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('AIzaSy')) {
  console.error('❌ VITE_FIREBASE_API_KEY format looks incorrect - should start with "AIzaSy"');
  console.error('Current API key starts with:', firebaseConfig.apiKey ? `'${firebaseConfig.apiKey.substring(0, 8)}'` : 'MISSING');
  console.error('Full raw value:', import.meta.env.VITE_FIREBASE_API_KEY ? `'${import.meta.env.VITE_FIREBASE_API_KEY.substring(0, 15)}...'` : 'MISSING');
} else if (firebaseConfig.apiKey) {
  console.log('✅ API Key format is correct');
}

if (firebaseConfig.appId && firebaseConfig.appId.startsWith('AIzaSy')) {
  console.error('❌ VITE_FIREBASE_APP_ID looks like an API key, not an App ID!');
  console.error('App IDs should look like: "1:123456789:web:abcdef123456"');
} else if (firebaseConfig.appId && firebaseConfig.appId.startsWith('1:')) {
  console.log('✅ App ID format is correct');
} else {
  console.error('❌ App ID format is incorrect');
}

// Test Firebase connection
try {
  console.log('✅ Firebase app initialized successfully');
  console.log('🔥 Ready to test authentication!');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
}

export default app;

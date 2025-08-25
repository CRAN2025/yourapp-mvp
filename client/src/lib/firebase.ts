import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Direct configuration for Replit (since env vars aren't working)
const firebaseConfig = {
  apiKey: "AIzaSyCXu0cNdLCaqll7l5USNK2NeHo2OjM3OOg",
  authDomain: "yourapp-mvp.firebaseapp.com",
  databaseURL: "https://yourapp-mvp-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "yourapp-mvp",
  storageBucket: "yourapp-mvp.firebasestorage.app",
  messagingSenderId: "784289207075",
  appId: "1:784289207075:web:c33ce2d8a576ba90bfb296"
};

// Debug log to verify config
console.log('Firebase Config Loaded:', {
  hasApiKey: !!firebaseConfig.apiKey,
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

export default app;

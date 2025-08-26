import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { firebaseConfig } from './firebase';

export const eventsApp =
  getApps().find(a => a.name === 'events') ?? initializeApp(firebaseConfig, 'events');

export const eventsAuth = getAuth(eventsApp);
export const eventsDb = getDatabase(eventsApp);

export async function ensureAnonymousEventsAuth() {
  if (!eventsAuth.currentUser) {
    try { 
      await signInAnonymously(eventsAuth); 
    } catch (e) { 
      console.warn('Anonymous auth failed', e); 
    }
  }
}
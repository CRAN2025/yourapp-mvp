// src/lib/ensureBootstrap.ts
import { db, auth } from '@/lib/firebase';
import {
  doc, collection, runTransaction, serverTimestamp,
  type DocumentReference
} from 'firebase/firestore';

export async function ensureBootstrap(uid: string) {
  return runTransaction(db, async (tx) => {
    const now = serverTimestamp();

    const profileRef = doc(db, 'profiles', uid);
    const obRef = doc(db, 'onboarding', uid);

    // --- READS ---
    const [profileSnap, obSnap] = await Promise.all([
      tx.get(profileRef),
      tx.get(obRef),
    ]);

    let storeId = obSnap.exists() ? (obSnap.data() as any).storeId ?? null : null;
    let needProfile = !profileSnap.exists();
    let needOnboarding = !obSnap.exists();
    let needStore = !storeId;
    let storeRef: DocumentReference | null = null;

    if (storeId) {
      storeRef = doc(db, 'stores', storeId);
      const storeSnap = await tx.get(storeRef);
      if (!storeSnap.exists()) needStore = true;
    }

    // --- WRITES ---
    if (needProfile) {
      tx.set(profileRef, {
        uid,
        email: auth.currentUser?.email ?? '',
        roles: { seller: true },
        createdAt: now,
      });
    }

    if (needStore) {
      storeRef = doc(collection(db, 'stores'));
      storeId = storeRef.id;
      tx.set(storeRef, {
        ownerUid: uid,
        status: 'draft',
        name: '',
        createdAt: now,
      });
    }

    if (needOnboarding) {
      tx.set(obRef, {
        storeId,
        currentStep: 1,
        completed: [],
        updatedAt: now,
      });
    } else if (!obSnap.data()?.storeId && storeId) {
      tx.update(obRef, { storeId, updatedAt: now });
    }

    const progress = needOnboarding
      ? { storeId, currentStep: 1, completed: [] }
      : obSnap.data();

    return { storeId, progress };
  });
}
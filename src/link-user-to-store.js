// src/link-user-to-store.js
// Safely link a user to an existing store and (optionally) copy legacy /<uid> → /stores/<uid>
// Nothing is deleted; canonical copy only happens if /stores/<uid> does not exist.

import { ref as dbRef, get, set, update, serverTimestamp } from 'firebase/database';
import { db } from './firebase';

/**
 * Link the user to their store and set activeStoreId/onboarding flags.
 * Optionally copy legacy store data from "/<uid>" to "/stores/<uid>" if needed.
 *
 * @param {object} opts
 * @param {string} opts.uid                       - Firebase Auth UID
 * @param {string} opts.email                     - User email
 * @param {boolean} [opts.copyLegacy=true]        - Copy /<uid> → /stores/<uid> when canonical is missing
 * @param {string} [opts.canonicalPath]           - Canonical store path (default: stores/<uid>)
 * @param {string} [opts.legacyPath]              - Legacy store path (default: <uid> at the root)
 */
export async function linkUserToStore({
  uid,
  email,
  copyLegacy = true,
  canonicalPath,
  legacyPath,
}) {
  if (!uid) throw new Error('UID is required');

  const storeId = uid; // using UID as store key
  const canonical = canonicalPath ?? `stores/${storeId}`;
  const legacy = legacyPath ?? `${storeId}`;

  // 1) If /stores/<uid> is missing but /<uid> exists, copy it over (no delete)
  let copied = false;
  if (copyLegacy) {
    const [legacySnap, canonicalSnap] = await Promise.all([
      get(dbRef(db, legacy)),
      get(dbRef(db, canonical)),
    ]);

    if (!canonicalSnap.exists() && legacySnap.exists()) {
      await set(dbRef(db, canonical), legacySnap.val());
      copied = true;
      /* eslint-disable no-console */
      console.log('✅ Copied legacy store →', canonical);
    } else {
      console.log('ℹ️ Canonical store exists or legacy not found. Skipping copy.');
    }
  }

  // 2) Write membership + active store + onboarding flags
  const updates = {
    // root user helpers
    [`users/${uid}/email`]: email ?? null,
    [`users/${uid}/activeStoreId`]: storeId,
    [`users/${uid}/onboardingComplete`]: true, // keep for any old code

    // what YOUR App.jsx checks (nested under profile):
    [`users/${uid}/profile/onboardingCompleted`]: true,
    [`users/${uid}/profile/onboardingCompletedAt`]: serverTimestamp(),
    // optional: persist email in profile as well (won’t overwrite other fields)
    [`users/${uid}/profile/email`]: email ?? null,

    // membership maps
    [`storeMembers/${storeId}/${uid}`]: {
      role: 'owner',
      addedAt: serverTimestamp(),
    },
    [`storeMembersByUser/${uid}/${storeId}`]: true,
  };

  await update(dbRef(db), updates);
  console.log('✅ Linked user to store:', { uid, storeId });

  return { copied, storeId, canonicalPath: canonical };
}

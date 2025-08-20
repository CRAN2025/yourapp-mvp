/* Run with: node --input-type=module scripts/link-user-to-store.mjs */
import { ref as dbRef, get, set, update, serverTimestamp } from 'firebase/database';
import { db } from '../src/firebase.js';

// ---- YOUR ACCOUNT ----
const UID = 'OPAslZR16zMTmjHi4PMSYyNFhdE2';
const EMAIL = 'test1@gmail.com';
// We’ll use the UID as the storeId, per your DB screenshot
const STORE_ID = UID;

// Set this true if you want to COPY legacy /<uid> → /stores/<uid> when /stores/<uid> is empty
const COPY_LEGACY_TO_CANONICAL = true;

async function main() {
  console.log('Linking user → store');
  console.log({ UID, STORE_ID, EMAIL });

  // 1) Optional: copy legacy store data to /stores/<uid> if not present
  if (COPY_LEGACY_TO_CANONICAL) {
    const legacyRef = dbRef(db, `${STORE_ID}`);          // e.g., top-level /<uid>
    const canonicalRef = dbRef(db, `stores/${STORE_ID}`); // canonical path

    const [legacySnap, canonicalSnap] = await Promise.all([get(legacyRef), get(canonicalRef)]);
    if (!canonicalSnap.exists() && legacySnap.exists()) {
      await set(canonicalRef, legacySnap.val());
      console.log('✅ Copied legacy store → /stores/<uid>');
    } else {
      console.log('ℹ️ Canonical store already exists or legacy not found; skipping copy.');
    }
  }

  // 2) Add membership + active store + onboarding flag
  const updates = {
    [`users/${UID}/email`]: EMAIL,
    [`users/${UID}/onboardingComplete`]: true,
    [`users/${UID}/activeStoreId`]: STORE_ID,

    [`storeMembers/${STORE_ID}/${UID}`]: {
      role: 'owner',
      addedAt: serverTimestamp(),
    },
    [`storeMembersByUser/${UID}/${STORE_ID}`]: true,
  };

  await update(dbRef(db), updates);
  console.log('✅ Linked user to store and set activeStoreId/onboardingComplete.');

  console.log('\nNext step: ensure post-login routing reads users/<uid>/activeStoreId and routes to your dashboard.');
}

main().catch((e) => {
  console.error('❌ Failed:', e);
  process.exitCode = 1;
});

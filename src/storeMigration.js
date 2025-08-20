// src/storeMigration.js
/* eslint-disable no-console */
import { ref as dbRef, get, set, update, serverTimestamp } from 'firebase/database';
import { db } from './firebase';

// Read once
async function read(path) {
  const snap = await get(dbRef(db, path));
  return snap.exists() ? snap.val() : null;
}

// Copy a JSON subtree src -> dest (no delete, overwrite dest if exists = true)
export async function copyTree(srcPath, destPath) {
  const data = await read(srcPath);
  if (data == null) {
    throw new Error(`Source not found at ${srcPath}`);
  }
  await set(dbRef(db, destPath), data);
  return { bytes: JSON.stringify(data).length };
}

/**
 * Migrate legacy store under "/<uid>" into "/stores/<newStoreId>"
 * and link the user to the destination store.
 *
 * - Copies selected nodes (products/profile/analytics or entire subtree)
 * - Adds membership + activeStoreId + onboardingComplete
 * - Never deletes the legacy source
 */
export async function migrateStore({
  sourceUid,                // e.g., 'OPAslZR16zMTmjHi4PMSYyNFhdE2'
  destStoreId,              // e.g., 'bow-tech-gadgets' (your choice)
  copyProducts = true,
  copyProfile = true,
  copyAnalytics = true,
  copyEverything = false,   // if true, copies entire "/<uid>" subtree
  linkUserUid,              // usually same as sourceUid
  linkUserEmail,            // optional, for users/<uid>/email
}) {
  if (!sourceUid) throw new Error('sourceUid is required');
  if (!destStoreId) throw new Error('destStoreId is required');

  const srcRoot = `${sourceUid}`;             // legacy path you showed in screenshot
  const destRoot = `stores/${destStoreId}`;   // canonical destination

  const report = { copied: [], skipped: [] };

  // 1) Create destination container if missing
  const existingDest = await read(destRoot);
  if (!existingDest) {
    await set(dbRef(db, destRoot), { createdAt: serverTimestamp() });
  }

  // 2) Copy data
  if (copyEverything) {
    await copyTree(srcRoot, destRoot);
    report.copied.push({ from: srcRoot, to: destRoot, note: 'full subtree' });
  } else {
    // granular
    const tasks = [];
    if (copyProducts)   tasks.push({ from: `${srcRoot}/products`,  to: `${destRoot}/products` });
    if (copyProfile)    tasks.push({ from: `${srcRoot}/profile`,   to: `${destRoot}/profile` });
    if (copyAnalytics)  tasks.push({ from: `${srcRoot}/analytics`, to: `${destRoot}/analytics` });

    for (const t of tasks) {
      const data = await read(t.from);
      if (data == null) {
        report.skipped.push({ from: t.from, reason: 'not found' });
        continue;
      }
      await set(dbRef(db, t.to), data);
      report.copied.push({ from: t.from, to: t.to });
    }
  }

  // 3) Link the user to the new store
  if (linkUserUid) {
    const updates = {
      [`users/${linkUserUid}/onboardingComplete`]: true,
      [`users/${linkUserUid}/activeStoreId`]: destStoreId,
      [`storeMembers/${destStoreId}/${linkUserUid}`]: { role: 'owner', addedAt: serverTimestamp() },
      [`storeMembersByUser/${linkUserUid}/${destStoreId}`]: true,
    };
    if (linkUserEmail) updates[`users/${linkUserUid}/email`] = linkUserEmail;
    await update(dbRef(db), updates);
  }

  return { destPath: destRoot, report };
}

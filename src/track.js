/* Minimal client-side event tracking into Realtime DB */
import { ref as dbRef, push, set, get, update, serverTimestamp } from 'firebase/database';
import { db } from './lib/firebase';
import { PATHS } from './constants';

/** Low-level event writer */
export async function trackEvent(uid, type, payload = {}) {
  if (!uid || !type) return; // guard
  const evRef = push(dbRef(db, PATHS.events(uid)));
  await set(evRef, {
    type,                     // 'catalog_shared', 'inquiry_submitted', 'order_marked_sold', etc.
    ts: serverTimestamp(),    // use server time to avoid client clock skew
    ...payload
  });
}

/** Derived activation stamps (firsts) */
export async function stampActivationOnOrder(uid) {
  if (!uid) return; // guard
  const activationRef = dbRef(db, PATHS.activation(uid));
  const snap = await get(activationRef);
  const current = snap.exists() ? snap.val() : {};

  const ordersCount = (current.ordersCount ?? 0) + 1;
  const updates = {
    [`${PATHS.activation(uid)}/lastOrderAt`]: serverTimestamp(),
    [`${PATHS.activation(uid)}/ordersCount`]: ordersCount,
  };
  if (!current.firstOrderAt) {
    updates[`${PATHS.activation(uid)}/firstOrderAt`] = serverTimestamp();
  }
  await update(dbRef(db), updates);
}

/** Helpers to call from UI actions */
export async function trackCatalogShared(uid, channel = 'whatsapp') {
  if (!uid) return; // guard
  await trackEvent(uid, 'catalog_shared', { channel });
  await update(dbRef(db), {
    [`${PATHS.activation(uid)}/lastSharedAt`]: serverTimestamp()
  });
}

export async function trackInquirySubmitted(uid) {
  if (!uid) return; // guard
  await trackEvent(uid, 'inquiry_submitted');
  await update(dbRef(db), {
    [`${PATHS.activation(uid)}/lastInquiryAt`]: serverTimestamp()
  });
}

export async function trackOrderMarkedSold(uid, productId) {
  if (!uid) return; // guard
  await trackEvent(uid, 'order_marked_sold', { productId });
  await stampActivationOnOrder(uid);
}

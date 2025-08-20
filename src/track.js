/* Minimal client-side event tracking into Realtime DB */
import { ref as dbRef, push, set, get, update, serverTimestamp } from 'firebase/database';
import { db } from './firebase';
import { PATHS } from './constants';

/** Low-level event writer */
export async function trackEvent(uid, type, payload = {}) {
  const evRef = push(dbRef(db, PATHS.events(uid)));
  await set(evRef, {
    type,                    // e.g., 'catalog_shared', 'inquiry_submitted', 'order_marked_sold'
    ts: Date.now(),          // client timestamp for MVP
    ...payload
  });
}

/** Derived activation stamps (firsts) */
export async function stampActivationOnOrder(uid) {
  const activationRef = dbRef(db, PATHS.activation(uid));
  const snap = await get(activationRef);
  const firstOrderAt = snap.exists() ? snap.val().firstOrderAt : null;

  const updates = {};
  if (!firstOrderAt) updates[`${PATHS.activation(uid)}/firstOrderAt`] = serverTimestamp();
  updates[`${PATHS.activation(uid)}/lastOrderAt`] = serverTimestamp();
  updates[`${PATHS.activation(uid)}/ordersCount`] =
    (snap.exists() && snap.val().ordersCount ? snap.val().ordersCount : 0) + 1;

  await update(dbRef(db), updates);
}

/** Helpers to call from UI actions */
export async function trackCatalogShared(uid, channel = 'whatsapp') {
  await trackEvent(uid, 'catalog_shared', { channel });
  await update(dbRef(db), { [`${PATHS.activation(uid)}/lastSharedAt`]: serverTimestamp() });
}

export async function trackInquirySubmitted(uid) {
  await trackEvent(uid, 'inquiry_submitted');
  await update(dbRef(db), { [`${PATHS.activation(uid)}/lastInquiryAt`]: serverTimestamp() });
}

export async function trackOrderMarkedSold(uid, productId) {
  await trackEvent(uid, 'order_marked_sold', { productId });
  await stampActivationOnOrder(uid);
}

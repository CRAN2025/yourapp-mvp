// Multi-path update function for single source of truth sync
import { ref, update } from 'firebase/database';
import { database } from './firebase';
import type { PaymentMethodSlug, DeliveryOptionSlug } from '@shared/canonicalOptions';

export async function saveSellerCheckoutSettings(
  uid: string, 
  pmFlags: Record<PaymentMethodSlug, boolean>, 
  doFlags: Record<DeliveryOptionSlug, boolean>
) {
  // Compute enabled lists from boolean flags
  const selectedPm = Object.entries(pmFlags)
    .filter(([, enabled]) => enabled)
    .map(([slug]) => slug);
  
  const selectedDo = Object.entries(doFlags)
    .filter(([, enabled]) => enabled)
    .map(([slug]) => slug);

  // Multi-path atomic update
  const updates: any = {};

  // 1) Private (authoritative) seller settings - boolean flags
  updates[`/sellers/${uid}/settings/paymentMethods`] = pmFlags;
  updates[`/sellers/${uid}/settings/deliveryOptions`] = doFlags;

  // 2) Public storefront snapshot - enabled slugs only  
  updates[`/public/${uid}/storefront/paymentMethods`] = selectedPm;
  updates[`/public/${uid}/storefront/deliveryOptions`] = selectedDo;
  
  // 3) Summary counts for pills
  updates[`/public/${uid}/summary/paymentCount`] = selectedPm.length;
  updates[`/public/${uid}/summary/deliveryCount`] = selectedDo.length;
  updates[`/public/${uid}/summary/updatedAt`] = Date.now();

  console.log('💾 Multi-path update:', updates);
  
  await update(ref(database), updates);
  
  console.log('✅ Settings saved with public sync:', {
    enabledPayments: selectedPm,
    enabledDelivery: selectedDo,
    counts: { payments: selectedPm.length, delivery: selectedDo.length }
  });
}

// Load seller's private settings (boolean flags)
export async function loadSellerSettings(uid: string) {
  const { get, ref: dbRef } = await import('firebase/database');
  
  const [pmSnap, doSnap] = await Promise.all([
    get(dbRef(database, `/sellers/${uid}/settings/paymentMethods`)),
    get(dbRef(database, `/sellers/${uid}/settings/deliveryOptions`))
  ]);
  
  return {
    paymentMethods: pmSnap.val() || {},
    deliveryOptions: doSnap.val() || {}
  };
}

// Load public storefront data (enabled slugs + counts)
export async function loadPublicStorefront(sellerId: string) {
  const { get, ref: dbRef } = await import('firebase/database');
  
  const [pmSnap, doSnap, summarySnap] = await Promise.all([
    get(dbRef(database, `/public/${sellerId}/storefront/paymentMethods`)),
    get(dbRef(database, `/public/${sellerId}/storefront/deliveryOptions`)),
    get(dbRef(database, `/public/${sellerId}/summary`))
  ]);
  
  return {
    paymentMethods: pmSnap.val() || [],
    deliveryOptions: doSnap.val() || [],
    summary: summarySnap.val() || { paymentCount: 0, deliveryCount: 0 }
  };
}
// client/src/lib/paymentDelivery.ts - Payment and delivery data management

import { ref as dbRef, update, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase';
import { 
  PaymentMethod, 
  DeliveryOption, 
  toPublicPayments, 
  toPublicDelivery 
} from '@shared/paymentDelivery';

/**
 * Atomic save function for payment and delivery settings
 * Writes to both private seller settings and public mirror
 */
export async function savePaymentAndDelivery(
  uid: string, 
  payments: Record<string, PaymentMethod>, 
  delivery: Record<string, DeliveryOption>
) {
  const root = dbRef(database); // IMPORTANT: root ref for multi-path update
  const updates: any = {};
  
  // Update seller's private settings
  updates[`sellers/${uid}/storeSettings/payments`] = payments;
  updates[`sellers/${uid}/storeSettings/deliveryOptions`] = delivery;
  
  // Update public mirror (sanitized data only)
  updates[`publicStores/${uid}/meta/paymentMethods`] = toPublicPayments(payments);
  updates[`publicStores/${uid}/meta/deliveryOptions`] = toPublicDelivery(delivery);
  updates[`publicStores/${uid}/meta/updatedAt`] = serverTimestamp();
  
  console.log('💾 Saving payment/delivery data:', { payments, delivery, updates });
  
  await update(root, updates);
  
  console.log('✅ Payment/delivery data saved successfully');
}

/**
 * Read payment and delivery settings for Settings page
 */
export async function loadSellerPaymentDelivery(uid: string): Promise<{
  payments: Record<string, PaymentMethod>;
  delivery: Record<string, DeliveryOption>;
}> {
  const { get, ref } = await import('firebase/database');
  
  const [paymentsSnap, deliverySnap] = await Promise.all([
    get(ref(database, `sellers/${uid}/storeSettings/payments`)),
    get(ref(database, `sellers/${uid}/storeSettings/deliveryOptions`))
  ]);
  
  return {
    payments: paymentsSnap.val() || {},
    delivery: deliverySnap.val() || {}
  };
}

/**
 * Read public payment and delivery data for storefront
 */
export async function loadPublicPaymentDelivery(sellerId: string) {
  const { get, ref } = await import('firebase/database');
  
  const metaSnap = await get(ref(database, `publicStores/${sellerId}/meta`));
  const meta = metaSnap.val() || {};
  
  return {
    paymentMethods: meta.paymentMethods || {},
    deliveryOptions: meta.deliveryOptions || {},
    updatedAt: meta.updatedAt
  };
}

/**
 * Migration function for legacy array data
 */
export async function migrateLegacyPaymentDelivery(uid: string) {
  const { get, ref } = await import('firebase/database');
  const { normalizeArrayToMap } = await import('@shared/paymentDelivery');
  
  // Check for legacy array data
  const [legacyPaymentsSnap, legacyDeliverySnap] = await Promise.all([
    get(ref(database, `sellers/${uid}/paymentMethods`)),
    get(ref(database, `sellers/${uid}/deliveryOptions`))
  ]);
  
  const legacyPayments = legacyPaymentsSnap.val();
  const legacyDelivery = legacyDeliverySnap.val();
  
  if (Array.isArray(legacyPayments) || Array.isArray(legacyDelivery)) {
    console.log('🔄 Migrating legacy payment/delivery data for:', uid);
    
    const migratedPayments = Array.isArray(legacyPayments) 
      ? normalizeArrayToMap(legacyPayments.map((label: string) => ({
          type: label.toLowerCase().replace(/\s+/g, '') as any,
          label,
          enabled: true
        })))
      : {};
    
    const migratedDelivery = Array.isArray(legacyDelivery)
      ? normalizeArrayToMap(legacyDelivery.map((label: string) => ({
          type: label.toLowerCase().replace(/\s+/g, '') as any,
          label,
          enabled: true
        })))
      : {};
    
    // Save migrated data
    await savePaymentAndDelivery(uid, migratedPayments, migratedDelivery);
    
    // Clean up legacy data
    const root = dbRef(database);
    const cleanupUpdates: any = {};
    if (Array.isArray(legacyPayments)) {
      cleanupUpdates[`sellers/${uid}/paymentMethods`] = null;
    }
    if (Array.isArray(legacyDelivery)) {
      cleanupUpdates[`sellers/${uid}/deliveryOptions`] = null;
    }
    
    if (Object.keys(cleanupUpdates).length > 0) {
      await update(root, cleanupUpdates);
      console.log('✅ Legacy data cleanup completed');
    }
    
    return { migrated: true, payments: migratedPayments, delivery: migratedDelivery };
  }
  
  return { migrated: false, payments: {}, delivery: {} };
}
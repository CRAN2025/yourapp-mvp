// Split write approach for payment/delivery data to handle permission issues
import { ref as dbRef, update, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase';
import { 
  PaymentMethod, 
  DeliveryOption, 
  toPublicPayments, 
  toPublicDelivery 
} from '@shared/paymentDelivery';

/**
 * Split save function - saves private data first, then attempts public mirror
 * Private save will succeed even if public mirror fails
 */
export async function savePaymentAndDeliverySplit(
  uid: string, 
  payments: Record<string, PaymentMethod>, 
  delivery: Record<string, DeliveryOption>
) {
  const root = dbRef(database);
  
  // First, save to private seller settings (should always work)
  console.log('💾 Saving private payment/delivery data...');
  const privateUpdates: any = {};
  privateUpdates[`sellers/${uid}/storeSettings/payments`] = payments;
  privateUpdates[`sellers/${uid}/storeSettings/deliveryOptions`] = delivery;
  
  await update(root, privateUpdates);
  console.log('✅ Private data saved successfully');

  // Then, attempt to save to public mirror (may fail due to permissions)
  try {
    console.log('💾 Saving public payment/delivery mirror...');
    const publicUpdates: any = {};
    publicUpdates[`publicStores/${uid}/meta/paymentMethods`] = toPublicPayments(payments);
    publicUpdates[`publicStores/${uid}/meta/deliveryOptions`] = toPublicDelivery(delivery);
    publicUpdates[`publicStores/${uid}/meta/updatedAt`] = serverTimestamp();
    
    await update(root, publicUpdates);
    console.log('✅ Public mirror saved successfully');
    
    return { privateSuccess: true, publicSuccess: true };
  } catch (error: any) {
    console.warn('[public mirror] skipped due to permissions:', {
      code: error?.code,
      message: error?.message
    });
    
    return { 
      privateSuccess: true, 
      publicSuccess: false, 
      publicError: error 
    };
  }
}
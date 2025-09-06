// Initialize canonical meta data in Firebase Realtime Database
import { ref, set } from 'firebase/database';
import { database } from './firebase';
import { CANONICAL_PAYMENT_METHODS, CANONICAL_DELIVERY_OPTIONS } from '@shared/canonicalOptions';

export async function initializeCanonicalMeta() {
  try {
    // Initialize the global canonical meta data
    const updates = {
      '/meta/paymentMethods': CANONICAL_PAYMENT_METHODS,
      '/meta/deliveryOptions': CANONICAL_DELIVERY_OPTIONS,
    };
    
    await Promise.all([
      set(ref(database, 'meta/paymentMethods'), CANONICAL_PAYMENT_METHODS),
      set(ref(database, 'meta/deliveryOptions'), CANONICAL_DELIVERY_OPTIONS)
    ]);
    
    console.log('✅ Canonical meta data initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to initialize canonical meta data:', error);
    return { success: false, error };
  }
}

// Call this function once to set up the canonical data
// This should be called during app initialization or when needed
export async function ensureCanonicalMeta() {
  const { get } = await import('firebase/database');
  
  try {
    // Check if meta data already exists
    const metaSnapshot = await get(ref(database, 'meta'));
    
    if (!metaSnapshot.exists()) {
      console.log('🔧 No canonical meta found, initializing...');
      return await initializeCanonicalMeta();
    } else {
      console.log('✅ Canonical meta data already exists');
      return { success: true };
    }
  } catch (error) {
    console.error('❌ Error checking canonical meta:', error);
    return { success: false, error };
  }
}
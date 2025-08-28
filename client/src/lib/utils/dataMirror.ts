import { ref, set, remove } from 'firebase/database';
import { database } from '../firebase';

/**
 * Mirror seller profile data to public stores
 */
export async function mirrorSellerProfile(uid: string, profileData: any) {
  try {
    console.log('🔄 RTDB: Mirroring seller profile for UID:', uid);
    console.log('🔄 RTDB: Profile data:', profileData);
    
    const publicProfileRef = ref(database, `publicStores/${uid}/profile`);
    await set(publicProfileRef, profileData);
    
    console.log('✅ RTDB: Seller profile mirrored successfully to publicStores/' + uid + '/profile');
    
    // Also mirror to the main sellers path for Settings page access
    const sellerProfileRef = ref(database, `sellers/${uid}/profile`);
    await set(sellerProfileRef, profileData);
    
    console.log('✅ RTDB: Seller profile mirrored successfully to sellers/' + uid + '/profile');
  } catch (error) {
    console.error('❌ RTDB: Failed to mirror seller profile:', error);
    console.error('❌ RTDB: UID:', uid);
    console.error('❌ RTDB: Profile data:', profileData);
    throw error;
  }
}

/**
 * Mirror product data to public stores
 */
export async function mirrorProduct(uid: string, productId: string, productData: any) {
  try {
    const shouldPublish = shouldPublishProduct(productData);
    const publicProductRef = ref(database, `publicStores/${uid}/products/${productId}`);
    
    if (shouldPublish) {
      await set(publicProductRef, productData);
    } else {
      // Remove from public if it shouldn't be published
      await remove(publicProductRef);
    }
  } catch (error) {
    console.error('Failed to mirror product:', error);
    throw error;
  }
}

/**
 * Determine if a product should be published to public stores
 * Publish when quantity > 0 by default; treat status:'inactive' (or false) as hidden
 */
function shouldPublishProduct(productData: any): boolean {
  const quantity = Number(productData?.quantity ?? 0);
  const inactive = String(productData?.status ?? '').toLowerCase() === 'inactive' || productData?.status === false;
  return quantity > 0 && !inactive;
}

/**
 * Mirror all seller data (profile + all products) to public stores
 */
export async function mirrorAllSellerData(uid: string, profileData: any, productsData: Record<string, any>) {
  try {
    // Mirror profile
    await mirrorSellerProfile(uid, profileData);
    
    // Mirror all products
    for (const [productId, productData] of Object.entries(productsData)) {
      await mirrorProduct(uid, productId, productData);
    }
  } catch (error) {
    console.error('Failed to mirror all seller data:', error);
    throw error;
  }
}
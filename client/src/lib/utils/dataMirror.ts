import { ref, set, remove } from 'firebase/database';
import { database } from '../firebase';

/**
 * Mirror seller profile data to public stores
 */
export async function mirrorSellerProfile(uid: string, profileData: any) {
  try {
    const publicProfileRef = ref(database, `publicStores/${uid}/profile`);
    await set(publicProfileRef, profileData);
  } catch (error) {
    console.error('Failed to mirror seller profile:', error);
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
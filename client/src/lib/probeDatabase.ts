// Probe database paths to isolate permission issues
import { ref, set, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase';

export async function probeSellerPath(uid: string): Promise<boolean> {
  try {
    console.log('🔍 Probing sellers path...');
    await set(ref(database, `sellers/${uid}/storeSettings/__probe`), serverTimestamp());
    console.log('✅ Sellers path: SUCCESS');
    return true;
  } catch (error: any) {
    console.error('❌ Sellers path: FAILED', {
      code: error?.code,
      message: error?.message,
      name: error?.name
    });
    return false;
  }
}

export async function probePublicStorePath(uid: string): Promise<boolean> {
  try {
    console.log('🔍 Probing publicStores path...');
    await set(ref(database, `publicStores/${uid}/meta/__probe`), serverTimestamp());
    console.log('✅ PublicStores path: SUCCESS');
    return true;
  } catch (error: any) {
    console.error('❌ PublicStores path: FAILED', {
      code: error?.code,
      message: error?.message,
      name: error?.name
    });
    return false;
  }
}

export async function runPathProbes(uid: string) {
  console.log('🔍 Running database path probes for UID:', uid);
  
  const [sellersOk, publicOk] = await Promise.all([
    probeSellerPath(uid),
    probePublicStorePath(uid)
  ]);
  
  console.log('📊 Probe results:', { sellersOk, publicOk });
  
  return { sellersOk, publicOk };
}
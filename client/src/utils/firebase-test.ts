import { auth, database } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';

export async function testFirebaseConnection() {
  console.log('🧪 Starting Firebase connection test...');
  
  try {
    // Test 1: Auth service availability
    console.log('✅ Auth service:', !!auth);
    console.log('✅ Database service:', !!database);
    
    // Test 2: Anonymous sign-in (requires no setup)
    console.log('Testing anonymous authentication...');
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Anonymous auth successful:', userCredential.user.uid);
    
    // Test 3: Database write (simple test)
    console.log('Testing database write...');
    const testRef = ref(database, `test/${userCredential.user.uid}`);
    await set(testRef, { timestamp: Date.now(), test: true });
    console.log('✅ Database write successful');
    
    // Test 4: Database read
    console.log('Testing database read...');
    const snapshot = await get(testRef);
    console.log('✅ Database read successful:', snapshot.val());
    
    // Clean up
    await set(testRef, null);
    console.log('✅ Test data cleaned up');
    
    await auth.signOut();
    console.log('✅ All Firebase tests passed!');
    
    return { success: true, message: 'Firebase connection working perfectly!' };
    
  } catch (error: any) {
    console.error('❌ Firebase test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Common error codes and solutions
    const solutions: Record<string, string> = {
      'auth/operation-not-allowed': 'Enable Anonymous authentication in Firebase Console',
      'auth/unauthorized-domain': 'Add your domain to authorized domains in Firebase Console',
      'permission-denied': 'Check Firebase Database rules',
      'auth/network-request-failed': 'Check internet connection and Firebase configuration'
    };
    
    const solution = solutions[error.code] || 'Check Firebase Console configuration';
    console.log('💡 Suggested solution:', solution);
    
    return { 
      success: false, 
      error: error.message, 
      code: error.code,
      solution 
    };
  }
}
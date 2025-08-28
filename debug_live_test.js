// LIVE DEBUGGING SCRIPT
// Copy this to browser console when authenticated to debug field issues

console.log("=== LIVE FIELD DEBUGGING ===");

async function testFieldSaveLoad() {
  try {
    // Get Firebase instances
    const { getFirestore, doc, getDoc, setDoc } = await import('firebase/firestore');
    const { getAuth } = await import('firebase/auth');
    
    const auth = getAuth();
    const db = getFirestore();
    
    if (!auth.currentUser) {
      console.log("❌ No authenticated user");
      return;
    }
    
    const uid = auth.currentUser.uid;
    console.log("🔍 Testing for user:", uid);
    
    // Test data to save
    const testData = {
      // Step 1 fields
      fullName: "Test User " + Date.now(),
      storeName: "Test Store " + Date.now(),
      whatsappNumber: "+1234567890",
      country: "United States",
      category: "electronics",
      subscriptionPlan: "beta-free",
      
      // Step 2 fields
      logoUrl: "test-logo.png",
      bannerUrl: "test-banner.png", 
      storeDescription: "Test description",
      socialMedia: {
        instagram: "test_instagram",
        tiktok: "test_tiktok",
        facebook: "test_facebook"
      },
      preferredLanguage: "English",
      returnPolicy: "Test return policy",
      operatingHours: "9-5 weekdays",
      tags: ["test", "debug"],
      
      // Step 3 fields
      paymentMethods: ["credit_card", "paypal"],
      deliveryOptions: ["pickup", "local_delivery"],
      
      // Meta fields
      onboardingCompleted: false,
      isAdmin: false,
      email: auth.currentUser.email,
      id: uid,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    console.log("💾 Saving test data...");
    const sellerRef = doc(db, 'sellers', uid);
    await setDoc(sellerRef, testData, { merge: true });
    console.log("✅ Save completed");
    
    // Wait a moment then read back
    setTimeout(async () => {
      console.log("📖 Reading back data...");
      const sellerSnap = await getDoc(sellerRef);
      
      if (sellerSnap.exists()) {
        const savedData = sellerSnap.data();
        console.log("✅ Data found:", savedData);
        
        // Check each field
        Object.keys(testData).forEach(field => {
          const saved = savedData[field];
          const original = testData[field];
          const match = JSON.stringify(saved) === JSON.stringify(original);
          console.log(`${match ? '✅' : '❌'} ${field}: ${match ? 'MATCH' : 'MISMATCH'}`);
          if (!match) {
            console.log(`  Expected: ${JSON.stringify(original)}`);
            console.log(`  Got: ${JSON.stringify(saved)}`);
          }
        });
      } else {
        console.log("❌ No data found after save!");
      }
    }, 2000);
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Auto-run the test
console.log("🚀 Starting field save/load test...");
testFieldSaveLoad();
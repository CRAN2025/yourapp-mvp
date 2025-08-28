// FIELD MAPPING DEBUG SCRIPT
// Run this in browser console to debug field saving/loading

console.log("=== ONBOARDING FIELD MAPPING DEBUG ===");

// Expected field mappings between forms and database
const fieldMappings = {
  step1: {
    formFields: ['fullName', 'businessName', 'whatsappNumber', 'country', 'category', 'subscriptionPlan'],
    dbFields: ['fullName', 'storeName', 'whatsappNumber', 'country', 'category', 'subscriptionPlan'],
    mapping: {
      'fullName': 'fullName',
      'businessName': 'storeName',  // ⚠️ businessName maps to storeName
      'whatsappNumber': 'whatsappNumber',
      'country': 'country',
      'category': 'category',
      'subscriptionPlan': 'subscriptionPlan'
    }
  },
  step2: {
    formFields: ['storeLogo', 'storeBanner', 'storeBio', 'socialMedia', 'preferredLanguage', 'returnPolicy', 'operatingHours', 'tags'],
    dbFields: ['logoUrl', 'bannerUrl', 'storeDescription', 'socialMedia', 'preferredLanguage', 'returnPolicy', 'operatingHours', 'tags'],
    mapping: {
      'storeLogo': 'logoUrl',        // ⚠️ storeLogo maps to logoUrl
      'storeBanner': 'bannerUrl',    // ⚠️ storeBanner maps to bannerUrl
      'storeBio': 'storeDescription', // ⚠️ storeBio maps to storeDescription
      'socialMedia': 'socialMedia',
      'preferredLanguage': 'preferredLanguage',
      'returnPolicy': 'returnPolicy',
      'operatingHours': 'operatingHours',
      'tags': 'tags'
    }
  },
  step3: {
    formFields: ['paymentMethods', 'deliveryOptions'],
    dbFields: ['paymentMethods', 'deliveryOptions'],
    mapping: {
      'paymentMethods': 'paymentMethods',
      'deliveryOptions': 'deliveryOptions'
    }
  },
  settings: {
    formSections: {
      storeProfile: ['storeName', 'storeDescription', 'category', 'tags'],
      contactVisibility: ['whatsappNumber', 'email', 'socialMedia', 'preferredLanguage'],
      paymentsDelivery: ['paymentMethods', 'deliveryOptions'],
      accountSecurity: ['subscriptionPlan', 'country']
    }
  }
};

// Test function to check current user data
async function debugCurrentUserData() {
  try {
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');
    const { getAuth } = await import('firebase/auth');
    
    const auth = getAuth();
    const db = getFirestore();
    
    if (!auth.currentUser) {
      console.log("❌ No authenticated user");
      return;
    }
    
    const sellerRef = doc(db, 'sellers', auth.currentUser.uid);
    const sellerSnap = await getDoc(sellerRef);
    
    if (sellerSnap.exists()) {
      const data = sellerSnap.data();
      console.log("✅ Current seller data:", data);
      
      // Check each expected field
      Object.entries(fieldMappings.step1.mapping).forEach(([formField, dbField]) => {
        const hasValue = data[dbField] !== undefined && data[dbField] !== '';
        console.log(`${hasValue ? '✅' : '❌'} ${formField} → ${dbField}: ${data[dbField]}`);
      });
      
      Object.entries(fieldMappings.step2.mapping).forEach(([formField, dbField]) => {
        const hasValue = data[dbField] !== undefined && data[dbField] !== '';
        console.log(`${hasValue ? '✅' : '❌'} ${formField} → ${dbField}: ${data[dbField]}`);
      });
      
      Object.entries(fieldMappings.step3.mapping).forEach(([formField, dbField]) => {
        const hasValue = data[dbField] !== undefined;
        console.log(`${hasValue ? '✅' : '❌'} ${formField} → ${dbField}: ${JSON.stringify(data[dbField])}`);
      });
      
    } else {
      console.log("❌ No seller document found");
    }
  } catch (error) {
    console.error("❌ Debug error:", error);
  }
}

console.log("Run: debugCurrentUserData() to check your current data");
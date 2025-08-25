// Migration Script: Move storefronts/* data to publicStores/*
// This script migrates existing data from storefronts/{sellerId} to publicStores/{sellerId}

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, remove } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXu0cNdLCaqll7l5USNK2NeHo2OjM3OOg",
  authDomain: "yourapp-mvp.firebaseapp.com",
  databaseURL: "https://yourapp-mvp-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "yourapp-mvp",
  storageBucket: "yourapp-mvp.firebasestorage.app",
  messagingSenderId: "784289207075",
  appId: "1:784289207075:web:c33ce2d8a576ba90bfb296"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function migrateData() {
  console.log('🚀 Starting migration from storefronts/* to publicStores/*');
  
  try {
    // Check if storefronts path exists
    const storefrontsRef = ref(database, 'storefronts');
    const storefrontsSnapshot = await get(storefrontsRef);
    
    if (!storefrontsSnapshot.exists()) {
      console.log('ℹ️  No storefronts data found to migrate');
      return;
    }
    
    const storefrontsData = storefrontsSnapshot.val();
    const sellerIds = Object.keys(storefrontsData);
    
    console.log(`📊 Found ${sellerIds.length} sellers to migrate`);
    
    for (const sellerId of sellerIds) {
      console.log(`🔄 Migrating seller: ${sellerId}`);
      
      const sellerData = storefrontsData[sellerId];
      
      // Create public profile
      const publicProfile = {
        storeName: sellerData.storeName || 'Store',
        storeDescription: sellerData.storeDescription || '',
        category: sellerData.category || '',
        country: sellerData.country || '',
        city: sellerData.city || '',
        whatsappNumber: sellerData.whatsappNumber || '',
        logoUrl: sellerData.logoUrl || '',
        coverUrl: sellerData.coverUrl || '',
        deliveryOptions: Array.isArray(sellerData.deliveryOptions) ? sellerData.deliveryOptions : [],
        paymentMethods: Array.isArray(sellerData.paymentMethods) ? sellerData.paymentMethods : [],
        createdAt: sellerData.createdAt || Date.now()
      };
      
      // Migrate profile
      const publicProfileRef = ref(database, `publicStores/${sellerId}/profile`);
      await set(publicProfileRef, publicProfile);
      console.log(`✅ Migrated profile for ${sellerId}`);
      
      // Migrate products if they exist
      if (sellerData.products) {
        const products = sellerData.products;
        const productIds = Object.keys(products);
        
        for (const productId of productIds) {
          const product = products[productId];
          
          // Only migrate active products with stock
          if (product.isActive && (product.quantity || 0) > 0) {
            const publicProduct = {
              id: productId,
              name: product.name || '',
              description: product.description || '',
              price: Number(product.price) || 0,
              quantity: Number(product.quantity) || 0,
              category: product.category || '',
              images: Array.isArray(product.images) ? product.images : [],
              brand: product.brand || '',
              material: product.material || '',
              color: product.color || '',
              size: product.size || '',
              weight: product.weight || '',
              dimensions: product.dimensions || '',
              tags: Array.isArray(product.tags) ? product.tags : [],
              isActive: true,
              createdAt: product.createdAt || Date.now(),
              updatedAt: Date.now()
            };
            
            const publicProductRef = ref(database, `publicStores/${sellerId}/products/${productId}`);
            await set(publicProductRef, publicProduct);
          }
        }
        
        console.log(`✅ Migrated ${productIds.length} products for ${sellerId}`);
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('⚠️  Remember to update your Firebase security rules');
    console.log('💡 You can now delete the old storefronts/* data after verification');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
migrateData();
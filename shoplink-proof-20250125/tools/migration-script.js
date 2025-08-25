/**
 * ShopLink Migration Script
 * Migrates seller data from legacy format to publicStores structure
 */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set, remove } = require('firebase/database');

// Firebase config (replace with your actual config)
const firebaseConfig = {
  // Your Firebase configuration
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

/**
 * Mirror seller profile to public store
 */
async function mirrorSellerToPublic(sellerId) {
  try {
    console.log(`Migrating seller: ${sellerId}`);
    
    // Get seller data from private path
    const sellerRef = ref(database, `sellers/${sellerId}`);
    const sellerSnapshot = await get(sellerRef);
    
    if (!sellerSnapshot.exists()) {
      console.log(`Seller ${sellerId} not found`);
      return;
    }
    
    const sellerData = sellerSnapshot.val();
    
    // Mirror profile to public store
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
    
    await set(ref(database, `publicStores/${sellerId}/profile`), publicProfile);
    
    // Mirror active products
    const productsRef = ref(database, `sellers/${sellerId}/products`);
    const productsSnapshot = await get(productsRef);
    
    if (productsSnapshot.exists()) {
      const products = productsSnapshot.val();
      const publicProductsRef = ref(database, `publicStores/${sellerId}/products`);
      
      for (const [productId, product] of Object.entries(products)) {
        // Only mirror active products with stock
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
          
          await set(ref(database, `publicStores/${sellerId}/products/${productId}`), publicProduct);
          console.log(`✓ Migrated product: ${product.name}`);
        }
      }
    }
    
    console.log(`✅ Successfully migrated seller: ${sellerId}`);
    
  } catch (error) {
    console.error(`❌ Failed to migrate seller ${sellerId}:`, error);
  }
}

/**
 * Migrate all sellers
 */
async function migrateAllSellers() {
  try {
    const sellersRef = ref(database, 'sellers');
    const snapshot = await get(sellersRef);
    
    if (!snapshot.exists()) {
      console.log('No sellers found');
      return;
    }
    
    const sellers = snapshot.val();
    const sellerIds = Object.keys(sellers);
    
    console.log(`Found ${sellerIds.length} sellers to migrate`);
    
    for (const sellerId of sellerIds) {
      await mirrorSellerToPublic(sellerId);
    }
    
    console.log('🎉 Migration completed');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration
if (require.main === module) {
  migrateAllSellers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { mirrorSellerToPublic, migrateAllSellers };
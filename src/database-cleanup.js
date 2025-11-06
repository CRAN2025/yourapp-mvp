// database-cleanup.js - Complete file for fixing Firebase image fields
// Create this file in your src/ folder next to App.jsx

/* eslint-disable no-console */
import { ref, get, update } from 'firebase/database';
import { db } from './lib/firebase';

/** Helpers */
const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';

/**
 * Main cleanup function - consolidates all image fields into images.primary
 * Removes confusing legacy fields that cause fallback issues
 * @param {string} userId - Your Firebase user ID
 */
export const cleanupImageFields = async (userId) => {
  if (!userId) {
    console.error('❌ User ID is required');
    return;
  }

  try {
    console.log('🧹 Starting image field cleanup...');
    console.log(`📍 Cleaning products for user: ${userId}`);

    const productsRef = ref(db, `users/${userId}/products`);
    const snapshot = await get(productsRef);

    if (!snapshot.exists()) {
      console.log('ℹ️ No products found for this user');
      return;
    }

    const products = snapshot.val();
    const updates = {};
    const report = {
      total: 0,
      cleaned: 0,
      alreadyClean: 0,
      noImages: 0,
    };

    Object.keys(products).forEach((productId) => {
      const product = products[productId] || {};
      report.total++;

      console.log(`\n📦 Processing: ${product.name || 'Unnamed Product'}`);

      // Determine what image to keep as primary
      let primaryImage = '';
      let imageSource = 'none';

      // Priority order: check what exists (guard against non-strings)
      if (isNonEmptyString(product.images?.primary)) {
        primaryImage = product.images.primary.trim();
        imageSource = 'images.primary (already correct)';
      } else if (isNonEmptyString(product.imageUrl)) {
        primaryImage = product.imageUrl.trim();
        imageSource = 'imageUrl (legacy)';
      } else if (isNonEmptyString(product.image)) {
        primaryImage = product.image.trim();
        imageSource = 'image (legacy)';
      } else if (isNonEmptyString(product.coverImage)) {
        primaryImage = product.coverImage.trim();
        imageSource = 'coverImage (legacy)';
      } else if (isNonEmptyString(product.thumbnailUrl)) {
        primaryImage = product.thumbnailUrl.trim();
        imageSource = 'thumbnailUrl (legacy)';
      }

      console.log(`   🖼️ Image source: ${imageSource}`);
      console.log(`   🔗 URL: ${primaryImage || 'NONE'}`);

      // Track statistics
      if (!primaryImage) {
        report.noImages++;
        console.log('   ⚠️ No image found');
      } else if (imageSource === 'images.primary (already correct)') {
        report.alreadyClean++;
        console.log('   ✅ Already using correct structure');
      } else {
        report.cleaned++;
        console.log(`   🔧 Will migrate from ${imageSource} to images.primary`);
      }

      // Set the clean structure - always ensure images.primary exists
      updates[`${productId}/images/primary`] = primaryImage || '';

      // Remove ALL legacy fields to prevent confusion
      const legacyFields = ['imageUrl', 'image', 'coverImage', 'thumbnailUrl'];
      legacyFields.forEach((field) => {
        if (product[field] !== undefined) {
          updates[`${productId}/${field}`] = null;
          console.log(`   🗑️ Removing legacy field: ${field}`);
        }
      });

      // Ensure gallery exists (preserve existing gallery or create empty)
      if (!Array.isArray(product.images?.gallery)) {
        updates[`${productId}/images/gallery`] = [];
        console.log('   📁 Adding empty gallery array');
      }
    });

    console.log('\n📊 Cleanup Summary:');
    console.log(`   📦 Total products: ${report.total}`);
    console.log(`   🔧 Products cleaned: ${report.cleaned}`);
    console.log(`   ✅ Already clean: ${report.alreadyClean}`);
    console.log(`   ⚠️ No images: ${report.noImages}`);

    // Apply updates to Firebase
    if (Object.keys(updates).length > 0) {
      console.log('\n🚀 Applying changes to Firebase...');
      await update(productsRef, updates);
      console.log('✅ Database cleanup completed successfully!');

      console.log('\n🎉 Results:');
      console.log('   • All products now use images.primary structure');
      console.log('   • Legacy image fields removed');
      console.log('   • getProductImageUrl() will now work correctly');
      console.log('   • No more seed data interference');
    } else {
      console.log('ℹ️ No changes needed - database is already clean');
    }

    return report;
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};

/**
 * Diagnostic function to analyze your current database structure
 * Run this first to see what needs to be cleaned
 * @param {string} userId - Your Firebase user ID
 */
export const analyzeImageFields = async (userId) => {
  if (!userId) {
    console.error('❌ User ID is required');
    return;
  }

  try {
    console.log('🔍 Analyzing image field structure...');
    console.log(`📍 Analyzing products for user: ${userId}`);

    const productsRef = ref(db, `users/${userId}/products`);
    const snapshot = await get(productsRef);

    if (!snapshot.exists()) {
      console.log('ℹ️ No products found for this user');
      return;
    }

    const products = snapshot.val();
    const analysis = {
      total: 0,
      imagesPrimary: 0,
      imageUrl: 0,
      image: 0,
      coverImage: 0,
      thumbnailUrl: 0,
      noImages: 0,
      mixed: 0,
      unsplashUrls: 0,
      firebaseUrls: 0,
    };

    console.log('\n📋 Individual Product Analysis:');

    Object.entries(products).forEach(([productId, productRaw]) => {
      const product = productRaw || {};
      analysis.total++;

      const fields = {
        'images.primary': product.images?.primary,
        imageUrl: product.imageUrl,
        image: product.image,
        coverImage: product.coverImage,
        thumbnailUrl: product.thumbnailUrl,
      };

      const existingFields = Object.entries(fields)
        .filter(([, value]) => isNonEmptyString(value))
        .map(([field, value]) => ({ field, value: value.trim() }));

      console.log(`\n📦 ${product.name || 'Unnamed Product'} (${productId})`);

      if (existingFields.length === 0) {
        analysis.noImages++;
        console.log('   ⚠️ No images found');
      } else {
        existingFields.forEach(({ field, value }) => {
          const isUnsplash = value.includes('unsplash.com');
          const isFirebase = value.includes('firebasestorage.googleapis.com');

          console.log(
            `   🖼️ ${field}: ${value.substring(0, 60)}${value.length > 60 ? '...' : ''}`
          );
          console.log(`       ${isUnsplash ? '📸 Unsplash' : isFirebase ? '🔥 Firebase' : '🔗 Other'}`);

          // Count field types
          if (field === 'images.primary') analysis.imagesPrimary++;
          if (field === 'imageUrl') analysis.imageUrl++;
          if (field === 'image') analysis.image++;
          if (field === 'coverImage') analysis.coverImage++;
          if (field === 'thumbnailUrl') analysis.thumbnailUrl++;

          // Count URL types
          if (isUnsplash) analysis.unsplashUrls++;
          if (isFirebase) analysis.firebaseUrls++;
        });

        if (existingFields.length > 1) {
          analysis.mixed++;
          console.log('   🔄 MIXED: Multiple image fields (causes confusion)');
        }
      }
    });

    console.log('\n📊 Database Analysis Summary:');
    console.log(`   📦 Total products: ${analysis.total}`);
    console.log(`   🎯 Using images.primary: ${analysis.imagesPrimary}`);
    console.log(`   📎 Using imageUrl: ${analysis.imageUrl}`);
    console.log(`   🖼️ Using image: ${analysis.image}`);
    console.log(`   📋 Using coverImage: ${analysis.coverImage}`);
    console.log(`   🔗 Using thumbnailUrl: ${analysis.thumbnailUrl}`);
    console.log(`   ⚠️ No images: ${analysis.noImages}`);
    console.log(`   🔄 Mixed fields: ${analysis.mixed}`);
    console.log(`   📸 Unsplash URLs: ${analysis.unsplashUrls}`);
    console.log(`   🔥 Firebase URLs: ${analysis.firebaseUrls}`);

    console.log('\n💡 Recommendations:');
    if (analysis.mixed > 0) {
      console.log(`   🔧 ${analysis.mixed} products have mixed image fields - run cleanup`);
    }
    if (analysis.imageUrl > 0 || analysis.image > 0 || analysis.coverImage > 0 || analysis.thumbnailUrl > 0) {
      console.log(
        `   🔧 ${
          analysis.imageUrl + analysis.image + analysis.coverImage + analysis.thumbnailUrl
        } products use legacy fields - run cleanup`
      );
    }
    if (analysis.mixed === 0 && analysis.imageUrl === 0 && analysis.image === 0 && analysis.coverImage === 0 && analysis.thumbnailUrl === 0) {
      console.log('   ✅ Database is already clean!');
    }

    return analysis;
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};

/**
 * Quick test function to verify the cleanup worked
 * @param {string} userId - Your Firebase user ID
 */
export const verifyCleanup = async (userId) => {
  if (!userId) {
    console.error('❌ User ID is required');
    return;
  }

  try {
    console.log('🔍 Verifying cleanup results...');

    const productsRef = ref(db, `users/${userId}/products`);
    const snapshot = await get(productsRef);

    if (!snapshot.exists()) {
      console.log('ℹ️ No products found');
      return;
    }

    const products = snapshot.val();
    let allClean = true;
    const issues = [];

    Object.entries(products).forEach(([productId, productRaw]) => {
      const product = productRaw || {};
      const hasLegacyFields =
        isNonEmptyString(product.imageUrl) ||
        isNonEmptyString(product.image) ||
        isNonEmptyString(product.coverImage) ||
        isNonEmptyString(product.thumbnailUrl);

      const hasPrimaryField = product.images && 'primary' in product.images;

      if (hasLegacyFields) {
        allClean = false;
        issues.push(`${product.name || productId}: Still has legacy image fields`);
      }

      if (!hasPrimaryField) {
        allClean = false;
        issues.push(`${product.name || productId}: Missing images.primary field`);
      }
    });

    if (allClean) {
      console.log('✅ Verification passed! All products are clean:');
      console.log('   • All products have images.primary field');
      console.log('   • No legacy image fields remain');
      console.log('   • getProductImageUrl() will work correctly');
    } else {
      console.log('❌ Verification failed! Issues found:');
      issues.forEach((issue) => console.log(`   • ${issue}`));
    }

    return allClean;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
};

// Usage examples and instructions
export const runFullCleanup = async (userId) => {
  console.log('🚀 Starting full image field cleanup process...\n');

  try {
    // Step 1: Analyze current state
    console.log('STEP 1: Analyzing current database structure');
    console.log('='.repeat(50));
    await analyzeImageFields(userId);

    // Step 2: Cleanup
    console.log('\n\nSTEP 2: Cleaning up image fields');
    console.log('='.repeat(50));
    await cleanupImageFields(userId);

    // Step 3: Verify
    console.log('\n\nSTEP 3: Verifying cleanup results');
    console.log('='.repeat(50));
    const isClean = await verifyCleanup(userId);

    if (isClean) {
      console.log('\n🎉 SUCCESS! Your database is now clean and optimized.');
      console.log('📝 What was fixed:');
      console.log('   ✅ All products now use only images.primary field');
      console.log('   ✅ Legacy imageUrl/image fields removed');
      console.log('   ✅ No more complex fallback logic needed');
      console.log('   ✅ Direct save/display system working');
      console.log('\n🔄 Test your app now - images should display correctly!');
    } else {
      console.log('\n⚠️ Some issues remain. Check the verification output above.');
    }
  } catch (error) {
    console.error('\n❌ Cleanup process failed:', error);
    console.log('\n🔧 Try running individual steps:');
    console.log('   1. analyzeImageFields(userId)');
    console.log('   2. cleanupImageFields(userId)');
    console.log('   3. verifyCleanup(userId)');
  }
};

// Export for easy use
export default {
  analyzeImageFields,
  cleanupImageFields,
  verifyCleanup,
  runFullCleanup,
};

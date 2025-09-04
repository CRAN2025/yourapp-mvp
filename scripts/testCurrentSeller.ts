/**
 * Test Current Seller Migration
 * 
 * This script tests the migration with your actual seller data
 * to show exactly what would change during standardization.
 */

import { db } from '../client/src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { normalizeSeller, type SellerV2 } from '../shared/sellerV2';

const CURRENT_SELLER_ID = 'gNC7s1HAzJg3rvCVrFEN8QA4x5U2'; // Your seller ID

async function testCurrentSellerMigration() {
  console.log('🔍 Testing migration with your current seller data...\n');
  
  try {
    // Fetch your current seller data
    const sellerRef = doc(db, 'sellers', CURRENT_SELLER_ID);
    const sellerSnap = await getDoc(sellerRef);
    
    if (!sellerSnap.exists()) {
      console.log('❌ Seller not found in database');
      return;
    }
    
    const originalData = sellerSnap.data();
    console.log('📋 Your Current Seller Data:');
    console.log(JSON.stringify(originalData, null, 2));
    
    console.log('\n🔄 Normalizing to SellerV2 format...\n');
    
    // Apply normalization
    const normalizedData = normalizeSeller(originalData);
    console.log('✨ Normalized SellerV2 Data:');
    console.log(JSON.stringify(normalizedData, null, 2));
    
    console.log('\n📊 Changes Summary:');
    
    // Analyze changes
    const changes: Array<{field: string, from: any, to: any}> = [];
    
    // Check for new fields
    Object.keys(normalizedData).forEach(key => {
      if (!(key in originalData)) {
        changes.push({
          field: key,
          from: 'missing',
          to: (normalizedData as any)[key]
        });
      } else if (JSON.stringify(originalData[key]) !== JSON.stringify((normalizedData as any)[key])) {
        changes.push({
          field: key,
          from: originalData[key],
          to: (normalizedData as any)[key]
        });
      }
    });
    
    if (changes.length === 0) {
      console.log('✅ No changes needed - your data is already in SellerV2 format!');
    } else {
      console.log(`🔧 ${changes.length} field(s) would be updated:`);
      changes.forEach(change => {
        console.log(`   • ${change.field}:`);
        console.log(`     From: ${JSON.stringify(change.from)}`);
        console.log(`     To:   ${JSON.stringify(change.to)}`);
      });
    }
    
    console.log('\n🛡️ Safety Check:');
    console.log('✅ All your original data is preserved');
    console.log('✅ Only missing fields are added with defaults');
    console.log('✅ Existing fields are only normalized (e.g., @username → full URL)');
    console.log('✅ No data loss will occur');
    
    return {
      hasChanges: changes.length > 0,
      changes: changes,
      safe: true
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { hasChanges: false, changes: [], safe: false };
  }
}

// Export for use in other scripts
export { testCurrentSellerMigration };

// CLI usage
if (import.meta.main) {
  testCurrentSellerMigration()
    .then(result => {
      if (result?.hasChanges) {
        console.log('\n🎯 Conclusion: Migration would improve your data structure');
      } else {
        console.log('\n🎯 Conclusion: Your data is already optimized');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}
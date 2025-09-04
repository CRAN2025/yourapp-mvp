/**
 * Direct Migration Runner - Standardize All Sellers
 * 
 * Executes the SellerV2 standardization migration safely
 */

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { normalizeSeller, type SellerV2 } from '@shared/sellerV2';

interface MigrationResult {
  sellerId: string;
  success: boolean;
  changes: number;
  error?: string;
}

export async function executeSellerStandardization(): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: MigrationResult[];
}> {
  console.log('🚀 Starting SellerV2 Standardization Migration...');
  
  const results: MigrationResult[] = [];
  let total = 0;
  let successful = 0;
  let failed = 0;
  
  try {
    // Get all sellers from Firestore
    const sellersRef = collection(db, 'sellers');
    const snapshot = await getDocs(sellersRef);
    
    total = snapshot.docs.length;
    console.log(`📊 Found ${total} seller(s) to standardize`);
    
    if (total === 0) {
      console.log('ℹ️  No sellers found in database');
      return { total: 0, successful: 0, failed: 0, results: [] };
    }
    
    // Process each seller
    for (const docSnap of snapshot.docs) {
      const sellerId = docSnap.id;
      const originalData = docSnap.data();
      
      try {
        console.log(`🔄 Processing seller: ${sellerId}`);
        
        // Normalize to SellerV2 format
        const normalizedData = normalizeSeller(originalData);
        
        // Count changes (fields that were added or modified)
        const originalKeys = new Set(Object.keys(originalData));
        const normalizedKeys = new Set(Object.keys(normalizedData));
        
        let changeCount = 0;
        
        // Check for new fields
        for (const key of normalizedKeys) {
          if (!originalKeys.has(key)) {
            changeCount++;
            console.log(`   ✨ Added field: ${key} = ${JSON.stringify((normalizedData as any)[key])}`);
          } else if (JSON.stringify(originalData[key]) !== JSON.stringify((normalizedData as any)[key])) {
            changeCount++;
            console.log(`   🔧 Modified field: ${key}`);
            console.log(`      From: ${JSON.stringify(originalData[key])}`);
            console.log(`      To: ${JSON.stringify((normalizedData as any)[key])}`);
          }
        }
        
        if (changeCount === 0) {
          console.log(`   ✅ Already standardized, no changes needed`);
        } else {
          // Update the document with standardized data
          const sellerRef = doc(db, 'sellers', sellerId);
          await updateDoc(sellerRef, {
            ...normalizedData,
            migrationVersion: '1.0',
            migratedAt: Date.now()
          });
          
          console.log(`   ✅ Successfully standardized ${changeCount} field(s)`);
        }
        
        results.push({
          sellerId,
          success: true,
          changes: changeCount
        });
        
        successful++;
        
      } catch (error) {
        console.error(`   ❌ Failed to standardize seller ${sellerId}:`, error);
        results.push({
          sellerId,
          success: false,
          changes: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failed++;
      }
      
      // Small delay to avoid overwhelming Firebase
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 Migration Complete!');
    console.log('📊 Final Statistics:');
    console.log(`   Total sellers: ${total}`);
    console.log(`   Successfully standardized: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Success rate: ${Math.round((successful/total)*100)}%`);
    
    const totalChanges = results.reduce((sum, r) => sum + r.changes, 0);
    console.log(`   Total fields standardized: ${totalChanges}`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
  
  return { total, successful, failed, results };
}

export async function verifyMigration(): Promise<void> {
  console.log('🔍 Verifying migration results...');
  
  try {
    const sellersRef = collection(db, 'sellers');
    const snapshot = await getDocs(sellersRef);
    
    let allStandardized = true;
    let verificationCount = 0;
    
    for (const docSnap of snapshot.docs) {
      const sellerId = docSnap.id;
      const data = docSnap.data();
      
      // Check if seller has migration marker
      if (data.migrationVersion === '1.0') {
        verificationCount++;
        
        // Verify it can be normalized without changes
        const normalized = normalizeSeller(data);
        const hasUnexpectedChanges = JSON.stringify(data) !== JSON.stringify(normalized);
        
        if (hasUnexpectedChanges) {
          console.warn(`⚠️  Seller ${sellerId} may need additional normalization`);
          allStandardized = false;
        }
      } else {
        console.log(`ℹ️  Seller ${sellerId} not marked as migrated`);
        allStandardized = false;
      }
    }
    
    console.log(`✅ Verification complete: ${verificationCount}/${snapshot.docs.length} sellers standardized`);
    
    if (allStandardized && verificationCount === snapshot.docs.length) {
      console.log('🎯 All sellers successfully standardized to SellerV2 format!');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}
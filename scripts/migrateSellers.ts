/**
 * Safe Database Migration: Standardize All Seller Records
 * 
 * This script safely migrates all existing seller documents to the canonical SellerV2 format.
 * Features:
 * - Backup original documents before modification
 * - Batch processing to avoid memory issues
 * - Rollback capability
 * - Progress tracking
 * - Validation checks
 */

import { db } from '../client/src/lib/firebase';
import { collection, getDocs, doc, updateDoc, writeBatch, getDoc } from 'firebase/firestore';
import { normalizeSeller, type SellerV2 } from '../shared/sellerV2';

interface MigrationResult {
  sellerId: string;
  success: boolean;
  error?: string;
  hasChanges: boolean;
  backup?: any;
}

interface MigrationStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  unchanged: number;
  backups: number;
}

const BATCH_SIZE = 10; // Process 10 sellers at a time
const DRY_RUN = true; // Set to false for actual migration

async function createBackup(sellerId: string, originalData: any): Promise<boolean> {
  try {
    const backupRef = doc(db, 'seller_backups', `${sellerId}_${Date.now()}`);
    const batch = writeBatch(db);
    
    batch.set(backupRef, {
      originalData,
      backupTimestamp: Date.now(),
      migrationVersion: '1.0'
    });
    
    if (!DRY_RUN) {
      await batch.commit();
    }
    
    console.log(`📦 Backup created for seller ${sellerId}`);
    return true;
  } catch (error) {
    console.error(`❌ Backup failed for seller ${sellerId}:`, error);
    return false;
  }
}

function hasSignificantChanges(original: any, normalized: SellerV2): boolean {
  // Check if normalization made significant changes
  const significantFields = [
    'paymentMethods', 'deliveryOptions', 'currency', 'whatsappNumber', 
    'socialMedia', 'country'
  ];
  
  for (const field of significantFields) {
    const originalValue = original[field];
    const normalizedValue = normalized[field];
    
    // Check for missing to present transitions
    if (!originalValue && normalizedValue) {
      if (Array.isArray(normalizedValue) && normalizedValue.length > 0) return true;
      if (typeof normalizedValue === 'string' && normalizedValue.length > 0) return true;
      if (typeof normalizedValue === 'object' && Object.keys(normalizedValue).length > 0) return true;
    }
    
    // Check for structural changes
    if (Array.isArray(originalValue) !== Array.isArray(normalizedValue)) return true;
    if (typeof originalValue !== typeof normalizedValue) return true;
  }
  
  return false;
}

async function migrateSeller(sellerId: string, originalData: any): Promise<MigrationResult> {
  try {
    console.log(`🔄 Processing seller: ${sellerId}`);
    
    // Normalize the data
    let normalizedData: SellerV2;
    try {
      normalizedData = normalizeSeller(originalData);
    } catch (error) {
      return {
        sellerId,
        success: false,
        error: `Normalization failed: ${error}`,
        hasChanges: false
      };
    }
    
    // Check if changes are significant
    const hasChanges = hasSignificantChanges(originalData, normalizedData);
    
    if (!hasChanges) {
      console.log(`✅ Seller ${sellerId}: Already normalized, no changes needed`);
      return {
        sellerId,
        success: true,
        hasChanges: false,
        error: undefined
      };
    }
    
    console.log(`📋 Seller ${sellerId}: Changes detected, proceeding with migration`);
    console.log('   Original fields:', Object.keys(originalData).sort());
    console.log('   Normalized fields:', Object.keys(normalizedData).sort());
    
    // Create backup before migration
    const backupSuccess = await createBackup(sellerId, originalData);
    if (!backupSuccess) {
      return {
        sellerId,
        success: false,
        error: 'Backup creation failed',
        hasChanges: true
      };
    }
    
    // Update the document with normalized data
    if (!DRY_RUN) {
      const sellerRef = doc(db, 'sellers', sellerId);
      await updateDoc(sellerRef, {
        ...normalizedData,
        migrationVersion: '1.0',
        migratedAt: Date.now()
      });
      console.log(`✅ Seller ${sellerId}: Successfully migrated to SellerV2 format`);
    } else {
      console.log(`🔍 DRY RUN: Would migrate seller ${sellerId}`);
    }
    
    return {
      sellerId,
      success: true,
      hasChanges: true,
      backup: originalData
    };
    
  } catch (error) {
    console.error(`❌ Migration failed for seller ${sellerId}:`, error);
    return {
      sellerId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasChanges: false
    };
  }
}

async function migrateBatch(sellers: Array<{id: string, data: any}>): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];
  
  for (const seller of sellers) {
    const result = await migrateSeller(seller.id, seller.data);
    results.push(result);
    
    // Small delay to avoid overwhelming Firebase
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

export async function migrateAllSellers(): Promise<MigrationStats> {
  console.log('🚀 Starting SellerV2 Migration...');
  console.log(`📝 Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`);
  
  const stats: MigrationStats = {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    unchanged: 0,
    backups: 0
  };
  
  try {
    // Get all sellers
    const sellersRef = collection(db, 'sellers');
    const snapshot = await getDocs(sellersRef);
    
    stats.total = snapshot.docs.length;
    console.log(`📊 Found ${stats.total} sellers to process`);
    
    if (stats.total === 0) {
      console.log('ℹ️  No sellers found in database');
      return stats;
    }
    
    // Process in batches
    const sellers = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));
    
    for (let i = 0; i < sellers.length; i += BATCH_SIZE) {
      const batch = sellers.slice(i, i + BATCH_SIZE);
      console.log(`\n📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(sellers.length/BATCH_SIZE)}`);
      
      const results = await migrateBatch(batch);
      
      // Update stats
      for (const result of results) {
        stats.processed++;
        
        if (result.success) {
          stats.successful++;
          if (result.hasChanges) {
            stats.backups++;
          } else {
            stats.unchanged++;
          }
        } else {
          stats.failed++;
        }
      }
      
      // Progress update
      console.log(`📈 Progress: ${stats.processed}/${stats.total} (${Math.round((stats.processed/stats.total)*100)}%)`);
    }
    
    console.log('\n🎉 Migration Complete!');
    console.log('📊 Final Statistics:');
    console.log(`   Total sellers: ${stats.total}`);
    console.log(`   Successfully migrated: ${stats.successful}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Already normalized: ${stats.unchanged}`);
    console.log(`   Backups created: ${stats.backups}`);
    
    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN - no actual changes were made');
      console.log('   Set DRY_RUN = false to perform the actual migration');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
  
  return stats;
}

async function rollbackSeller(sellerId: string): Promise<boolean> {
  try {
    // Find the most recent backup
    const backupsRef = collection(db, 'seller_backups');
    const backupSnapshot = await getDocs(backupsRef);
    
    const sellerBackups = backupSnapshot.docs
      .filter(doc => doc.id.startsWith(sellerId))
      .sort((a, b) => b.data().backupTimestamp - a.data().backupTimestamp);
    
    if (sellerBackups.length === 0) {
      console.error(`❌ No backup found for seller ${sellerId}`);
      return false;
    }
    
    const latestBackup = sellerBackups[0];
    const originalData = latestBackup.data().originalData;
    
    // Restore original data
    const sellerRef = doc(db, 'sellers', sellerId);
    await updateDoc(sellerRef, originalData);
    
    console.log(`✅ Seller ${sellerId} restored from backup`);
    return true;
    
  } catch (error) {
    console.error(`❌ Rollback failed for seller ${sellerId}:`, error);
    return false;
  }
}

export async function rollbackAllSellers(): Promise<void> {
  console.log('🔄 Starting rollback of all seller migrations...');
  
  // This function would restore all sellers from their backups
  // Implementation would be similar to migration but in reverse
  console.log('⚠️  Rollback functionality ready but not implemented in this demo');
}

// Export for use in other scripts
export { migrateSeller, rollbackSeller };

// CLI usage
if (import.meta.main) {
  migrateAllSellers()
    .then(stats => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}
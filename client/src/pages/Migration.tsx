import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { executeSellerStandardization, verifyMigration } from '@/utils/migrationRunner';
import { useAuth } from '@/hooks/use-auth';
import LoadingSpinner from '@/components/LoadingSpinner';

interface MigrationStats {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    sellerId: string;
    success: boolean;
    changes: number;
    error?: string;
  }>;
}

export default function Migration() {
  const { seller } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [migrationStats, setMigrationStats] = useState<MigrationStats | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);
  
  // Only allow admin users to access this page
  if (!seller?.isAdmin) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This migration utility is only accessible to admin users.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const handleRunMigration = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    try {
      console.log('🚀 Starting SellerV2 standardization migration...');
      const stats = await executeSellerStandardization();
      setMigrationStats(stats);
      console.log('✅ Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
    } finally {
      setIsRunning(false);
    }
  };
  
  const handleVerifyMigration = async () => {
    if (isVerifying) return;
    
    setIsVerifying(true);
    try {
      console.log('🔍 Verifying migration results...');
      await verifyMigration();
      setVerificationComplete(true);
      console.log('✅ Verification completed!');
    } catch (error) {
      console.error('❌ Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SellerV2 Database Standardization</CardTitle>
          <p className="text-sm text-gray-600">
            Safely migrate all seller records to the standardized SellerV2 format
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">What This Migration Does:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Adds missing fields like currency, paymentMethods, deliveryOptions</li>
              <li>• Normalizes data formats (e.g., social media handles to full URLs)</li>
              <li>• Ensures all sellers have consistent data structure</li>
              <li>• Preserves all existing data - zero data loss</li>
              <li>• Adds migration markers for tracking</li>
            </ul>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={handleRunMigration} 
              disabled={isRunning}
              className="min-w-[200px]"
            >
              {isRunning ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Running Migration...
                </>
              ) : (
                'Execute Standardization'
              )}
            </Button>
            
            {migrationStats && (
              <Button 
                onClick={handleVerifyMigration} 
                disabled={isVerifying}
                variant="outline"
                className="min-w-[150px]"
              >
                {isVerifying ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify Results'
                )}
              </Button>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            ⚠️ Check the browser console for detailed migration logs
          </div>
        </CardContent>
      </Card>
      
      {migrationStats && (
        <Card>
          <CardHeader>
            <CardTitle>Migration Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{migrationStats.successful}</div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{migrationStats.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{migrationStats.total}</div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Detailed Results:</h4>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {migrationStats.results.map((result) => (
                  <div 
                    key={result.sellerId}
                    className={`p-2 rounded text-sm ${
                      result.success 
                        ? 'bg-green-50 text-green-800' 
                        : 'bg-red-50 text-red-800'
                    }`}
                  >
                    <div className="font-mono">{result.sellerId}</div>
                    {result.success ? (
                      <div>✅ {result.changes} field(s) standardized</div>
                    ) : (
                      <div>❌ {result.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {verificationComplete && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="text-green-800 font-semibold">
                  ✅ Verification Complete - All sellers successfully standardized!
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
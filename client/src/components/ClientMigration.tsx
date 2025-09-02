import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ClientMigration() {
  const [oldUserId, setOldUserId] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [userData, setUserData] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthContext();

  const handleMigration = async () => {
    if (!oldUserId || !newUserId || !userData) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Parse user data
      const parsedData = JSON.parse(userData);
      
      // Use Firebase client SDK for migration
      const { doc, setDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      console.log('🔄 Client Migration: Starting migration...');
      console.log('🔄 From:', oldUserId, 'To:', newUserId);
      console.log('🔄 Data:', parsedData);
      
      // Create seller document
      const sellerRef = doc(db, 'sellers', newUserId);
      const sellerData = {
        ...parsedData,
        id: newUserId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        onboardingCompleted: false,
        isAdmin: false
      };
      
      await setDoc(sellerRef, sellerData, { merge: true });
      console.log('✅ Created seller document');
      
      // Create profile document
      const profileRef = doc(db, 'profiles', newUserId);
      const profileData = {
        sellerId: newUserId,
        uid: newUserId,
        email: parsedData.email,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await setDoc(profileRef, profileData, { merge: true });
      console.log('✅ Created profile document');
      
      // Mirror to RTDB if available
      try {
        const { mirrorSellerProfile } = await import('@/lib/utils/dataMirror');
        await mirrorSellerProfile(newUserId, sellerData);
        console.log('✅ Mirrored to RTDB');
      } catch (error) {
        console.warn('⚠️ RTDB mirroring failed:', error);
      }
      
      toast({
        title: 'Migration Successful',
        description: `Successfully migrated user ${oldUserId} to seller ${newUserId}`,
      });
      
      // Clear form
      setOldUserId('');
      setNewUserId('');
      setUserData('');
      
    } catch (error: any) {
      console.error('❌ Migration failed:', error);
      toast({
        title: 'Migration Failed',
        description: error?.message || 'An error occurred during migration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill with sample data
  const loadSampleData = () => {
    setOldUserId('old-user-123');
    setNewUserId(user?.uid || 'new-user-456');
    setUserData(JSON.stringify({
      email: 'user@example.com',
      fullName: 'John Doe',
      storeName: 'My Store',
      category: '🛍️ General Store',
      country: 'US',
      whatsappNumber: '+1234567890',
      phone: '+1234567890',
      subscriptionPlan: 'beta-free'
    }, null, 2));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Client-Side Data Migration</CardTitle>
        <CardDescription>
          Migrate old user data to new seller structure using Firebase client SDK
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="old-user-id">Old User ID</Label>
          <Input
            id="old-user-id"
            value={oldUserId}
            onChange={(e) => setOldUserId(e.target.value)}
            placeholder="Enter old user ID"
          />
        </div>

        <div>
          <Label htmlFor="new-user-id">New Firebase Auth UID</Label>
          <Input
            id="new-user-id"
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            placeholder="Enter new Firebase Auth UID"
          />
        </div>

        <div>
          <Label htmlFor="user-data">User Data JSON</Label>
          <Textarea
            id="user-data"
            value={userData}
            onChange={(e) => setUserData(e.target.value)}
            placeholder="Paste user data JSON here"
            className="min-h-[200px] font-mono text-sm"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={loadSampleData}
            variant="outline"
            className="flex-1"
          >
            Load Sample Data
          </Button>
          
          <Button
            onClick={handleMigration}
            disabled={loading || !oldUserId || !newUserId || !userData}
            className="flex-1"
          >
            {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            Migrate Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
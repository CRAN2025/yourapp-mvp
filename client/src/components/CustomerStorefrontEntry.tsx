import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Seller } from '@shared/schema';

interface CustomerStorefrontEntryProps {
  sellerId: string;
}

export default function CustomerStorefrontEntry({ sellerId }: CustomerStorefrontEntryProps) {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<Seller | null>(null);

  useEffect(() => {
    const validateSellerAndRedirect = async () => {
      try {
        setLoading(true);
        
        // Check if seller exists
        const sellerRef = ref(database, `sellers/${sellerId}`);
        const sellerSnapshot = await get(sellerRef);
        
        if (sellerSnapshot.exists()) {
          const sellerData = sellerSnapshot.val() as Seller;
          setSeller(sellerData);
          
          // Redirect to public storefront
          navigate(`/store/${sellerId}`, { replace: true });
        } else {
          // Seller not found, redirect to marketing page with error
          navigate('/?error=seller-not-found', { replace: true });
        }
      } catch (error) {
        console.error('Error validating seller:', error);
        navigate('/?error=validation-failed', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    validateSellerAndRedirect();
  }, [sellerId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Finding store...</p>
        </div>
      </div>
    );
  }

  return null;
}

// Hook for customer storefront routing
export function useCustomerStorefrontRouting() {
  const [match, params] = useRoute('/customer/:sellerId');
  
  if (match && params?.sellerId) {
    return <CustomerStorefrontEntry sellerId={params.sellerId} />;
  }
  
  return null;
}
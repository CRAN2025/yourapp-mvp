import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth } from '@/lib/firebase';
import { completeStep } from '@/lib/onboarding';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const step3Schema = z.object({
  paymentMethods: z.array(z.string()).default([]),
  deliveryOptions: z.array(z.string()).default([]),
});

type Step3FormData = z.infer<typeof step3Schema>;

interface OnboardingStep3Props {
  storeId: string;
}

export default function OnboardingStep3({ storeId }: OnboardingStep3Props) {
  const [, navigate] = useLocation();
  const [user] = useAuthState(auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      paymentMethods: [],
      deliveryOptions: [],
    },
  });

  // Load existing data on component mount
  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return;
      
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        const sellerRef = doc(db, 'sellers', user.uid);
        const sellerSnap = await getDoc(sellerRef);
        
        if (sellerSnap.exists()) {
          const data = sellerSnap.data();
          form.reset({
            paymentMethods: data.paymentMethods || [],
            deliveryOptions: data.deliveryOptions || [],
          });
        }
      } catch (error) {
        console.error('Error loading existing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, [user, form]);

  // Remove auto-save - using explicit save buttons instead

  const onSubmit = async (data: Step3FormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    console.log('✅ Step 3: Starting save with data:', data);
    try {
      // Save the form data to Firestore sellers collection
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const sellerRef = doc(db, 'sellers', user.uid);
      const saveData = {
        paymentMethods: data.paymentMethods || [],
        deliveryOptions: data.deliveryOptions || [],
        onboardingCompleted: true,
        updatedAt: Date.now(),
      };
      
      console.log('✅ Step 3: Saving to Firestore:', saveData);
      await updateDoc(sellerRef, saveData);
      console.log('✅ Step 3: Firestore save completed');
      
      // Get the updated seller data to mirror to RTDB
      const { getDoc } = await import('firebase/firestore');
      const updatedSellerSnap = await getDoc(sellerRef);
      const updatedSellerData = updatedSellerSnap.data();
      
      if (updatedSellerData) {
        const { mirrorSellerProfile } = await import('@/lib/utils/dataMirror');
        await mirrorSellerProfile(user.uid, updatedSellerData);
        console.log('✅ Step 3: RTDB mirroring completed');
      }
      
      await completeStep(user.uid, 'step-3');
      
      // Force reload the seller profile in auth context after onboarding completion
      console.log('🔄 Step 3: Triggering seller profile reload after onboarding completion');
      
      // Small delay to ensure RTDB mirroring is complete, then refresh auth and navigate
      setTimeout(async () => {
        // Trigger auth context refresh
        window.dispatchEvent(new CustomEvent('force-auth-refresh'));
        console.log('🔄 Step 3: Navigating to dashboard with onboarding complete');
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (error) {
      console.error('Error completing step 3:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    navigate('/onboarding/step-2', { replace: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment & Delivery Options</CardTitle>
        <CardDescription>
          Select the payment methods and delivery options you'll offer customers. These are display-only during beta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="paymentMethods"
              render={() => (
                <FormItem>
                  <FormLabel className="text-lg font-medium">Payment Methods</FormLabel>
                  <p className="text-sm text-gray-600 mb-3">Select the payment methods you accept (display-only during beta)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'mobile-money', label: 'Mobile Money (M-Pesa, Airtel Money, MTN MoMo)' },
                      { id: 'bank-transfer', label: 'Bank Transfer' },
                      { id: 'cash-on-delivery', label: 'Cash on Delivery (COD)' },
                      { id: 'card-payments', label: 'Card Payments' },
                      { id: 'paypal', label: 'PayPal' },
                      { id: 'other-wallets', label: 'Other Local Wallets' },
                    ].map((method) => (
                      <FormField
                        key={method.id}
                        control={form.control}
                        name="paymentMethods"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(method.id)}
                                onCheckedChange={(checked) => {
                                  const updatedValue = checked
                                    ? [...(field.value || []), method.id]
                                    : (field.value || []).filter((value) => value !== method.id);
                                  field.onChange(updatedValue);
                                }}
                                data-testid={`checkbox-${method.id}`}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {method.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryOptions"
              render={() => (
                <FormItem>
                  <FormLabel className="text-lg font-medium">Delivery Options</FormLabel>
                  <p className="text-sm text-gray-600 mb-3">Select your delivery methods (display-only during beta)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'pickup', label: 'In-Store Pickup' },
                      { id: 'local-delivery', label: 'Local Delivery' },
                      { id: 'national-courier', label: 'National Courier Service' },
                      { id: 'international', label: 'International Shipping' },
                    ].map((option) => (
                      <FormField
                        key={option.id}
                        control={form.control}
                        name="deliveryOptions"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(option.id)}
                                onCheckedChange={(checked) => {
                                  const updatedValue = checked
                                    ? [...(field.value || []), option.id]
                                    : (field.value || []).filter((value) => value !== option.id);
                                  field.onChange(updatedValue);
                                }}
                                data-testid={`checkbox-${option.id}`}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {option.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900">Beta Notice</h4>
              <p className="text-sm text-blue-800 mt-1">
                During the beta phase, ShopLynk displays your selected payment and delivery options to customers, 
                but you'll handle all transactions and logistics directly. We'll add automated processing in future updates.
              </p>
            </div>

            <div className="flex justify-between">
              <Button 
                type="button"
                variant="outline"
                onClick={goBack}
                data-testid="button-back"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                data-testid="button-complete"
                className="min-w-[140px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Completing...
                  </div>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
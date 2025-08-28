import { useState } from 'react';
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

  const form = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      paymentMethods: [],
      deliveryOptions: [],
    },
  });

  const onSubmit = async (data: Step3FormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Here you would typically save the store configuration
      // For now, we'll just complete the step
      
      await completeStep(user.uid, 'step-3');
      navigate('/dashboard', { replace: true });
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
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Payment Methods</h3>
              <p className="text-sm text-gray-600">Select the payment methods you accept (display-only during beta)</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'mobile-money', label: 'Mobile Money (M-Pesa, Airtel Money, MTN MoMo)' },
                  { id: 'bank-transfer', label: 'Bank Transfer' },
                  { id: 'cash-on-delivery', label: 'Cash on Delivery (COD)' },
                  { id: 'card-payments', label: 'Card Payments' },
                  { id: 'paypal', label: 'PayPal' },
                  { id: 'other-wallets', label: 'Other Local Wallets' },
                ].map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={method.id}
                      className="rounded border-gray-300"
                      data-testid={`checkbox-${method.id}`}
                    />
                    <label htmlFor={method.id} className="text-sm font-medium">
                      {method.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Delivery Options</h3>
              <p className="text-sm text-gray-600">Select your delivery methods (display-only during beta)</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'pickup', label: 'In-Store Pickup' },
                  { id: 'local-delivery', label: 'Local Delivery' },
                  { id: 'national-courier', label: 'National Courier Service' },
                  { id: 'international', label: 'International Shipping' },
                ].map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={option.id}
                      className="rounded border-gray-300"
                      data-testid={`checkbox-${option.id}`}
                    />
                    <label htmlFor={option.id} className="text-sm font-medium">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

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
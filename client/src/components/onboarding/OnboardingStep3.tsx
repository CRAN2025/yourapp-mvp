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
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  storeDescription: z.string().min(10, 'Store description must be at least 10 characters'),
  whatsappNumber: z.string().min(10, 'Please enter a valid WhatsApp number'),
  policies: z.object({
    returnPolicy: z.string().min(10, 'Return policy is required'),
    shippingPolicy: z.string().min(10, 'Shipping policy is required'),
  }),
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
      storeName: '',
      storeDescription: '',
      whatsappNumber: '',
      policies: {
        returnPolicy: '',
        shippingPolicy: '',
      },
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
        <CardTitle>Store Setup</CardTitle>
        <CardDescription>
          Final step! Configure your store settings and policies to start selling.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your store name" 
                      {...field}
                      data-testid="input-store-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storeDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your store and what makes it special..."
                      className="min-h-[100px]"
                      {...field}
                      data-testid="textarea-store-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsappNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    WhatsApp Number
                    <Badge variant="secondary" className="ml-2">Required</Badge>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your WhatsApp number (with country code)" 
                      type="tel"
                      {...field}
                      data-testid="input-whatsapp"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-gray-600 mt-1">
                    Customers will use this number to contact you directly through WhatsApp
                  </p>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Store Policies</h3>
              
              <FormField
                control={form.control}
                name="policies.returnPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Return Policy</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your return and refund policy..."
                        className="min-h-[80px]"
                        {...field}
                        data-testid="textarea-return-policy"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="policies.shippingPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Policy</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your shipping methods and delivery times..."
                        className="min-h-[80px]"
                        {...field}
                        data-testid="textarea-shipping-policy"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
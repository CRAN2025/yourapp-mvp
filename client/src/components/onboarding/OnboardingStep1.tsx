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

const step1Schema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
});

type Step1FormData = z.infer<typeof step1Schema>;

interface OnboardingStep1Props {
  storeId: string;
}

export default function OnboardingStep1({ storeId }: OnboardingStep1Props) {
  const [, navigate] = useLocation();
  const [user] = useAuthState(auth);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      businessName: '',
      description: '',
      category: '',
    },
  });

  const onSubmit = async (data: Step1FormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Here you would typically save the business info to the store
      // For now, we'll just complete the step
      
      await completeStep(user.uid, 'step-1');
      navigate('/onboarding/step-2', { replace: true });
    } catch (error) {
      console.error('Error completing step 1:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    navigate('/', { replace: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tell us about your business</CardTitle>
        <CardDescription>
          Let's start by setting up your store's basic information. This helps customers understand what you offer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your business name" 
                      {...field}
                      data-testid="input-business-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what your business offers..."
                      className="min-h-[100px]"
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Category</FormLabel>
                  <FormControl>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      {...field}
                      data-testid="select-category"
                    >
                      <option value="">Select a category</option>
                      <option value="fashion">Fashion & Clothing</option>
                      <option value="electronics">Electronics</option>
                      <option value="home">Home & Garden</option>
                      <option value="beauty">Beauty & Personal Care</option>
                      <option value="sports">Sports & Outdoors</option>
                      <option value="books">Books & Media</option>
                      <option value="food">Food & Beverages</option>
                      <option value="other">Other</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button 
                type="button"
                variant="outline"
                onClick={goBack}
                data-testid="button-back"
              >
                Back to Home
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                data-testid="button-continue"
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </div>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
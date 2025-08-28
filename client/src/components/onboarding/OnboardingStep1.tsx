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

const step1Schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  businessName: z.string().min(2, 'Store/Business name must be at least 2 characters'),
  whatsappNumber: z.string().min(10, 'Please enter a valid WhatsApp number'),
  country: z.string().min(1, 'Please select a country'),
  category: z.string().min(1, 'Please select a business category'),
  subscriptionPlan: z.string().default('beta-free'),
});

type Step1FormData = z.infer<typeof step1Schema>;

interface OnboardingStep1Props {
  storeId: string;
}

export default function OnboardingStep1({ storeId }: OnboardingStep1Props) {
  const [, navigate] = useLocation();
  const [user] = useAuthState(auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fullName: '',
      businessName: '',
      whatsappNumber: '',
      country: '',
      category: '',
      subscriptionPlan: 'beta-free',
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
            fullName: data.fullName || '',
            businessName: data.storeName || '',
            whatsappNumber: data.whatsappNumber || '',
            country: data.country || '',
            category: data.category || '',
            subscriptionPlan: data.subscriptionPlan || 'beta-free',
          });
        }
      } catch (error) {
        console.error('❌ Error loading Step 1 existing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, [user, form]);

  // Remove auto-save - using explicit save buttons instead

  const onSubmit = async (data: Step1FormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      console.log('✅ Step 1: Starting save with data:', data);
      
      // Save the form data to Firestore sellers collection
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const sellerRef = doc(db, 'sellers', user.uid);
      const saveData = {
        id: user.uid,
        email: user.email || '',
        fullName: data.fullName,
        storeName: data.businessName,
        whatsappNumber: data.whatsappNumber,
        country: data.country,
        category: data.category,
        subscriptionPlan: data.subscriptionPlan,
        onboardingCompleted: false,
        isAdmin: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      console.log('✅ Step 1: Saving to Firestore:', saveData);
      await setDoc(sellerRef, saveData, { merge: true });
      console.log('✅ Step 1: Firestore save completed');
      
      // Mirror seller profile to Firebase Realtime Database
      const { mirrorSellerProfile } = await import('@/lib/utils/dataMirror');
      await mirrorSellerProfile(user.uid, saveData);
      console.log('✅ Step 1: RTDB mirroring completed');
      
      await completeStep(user.uid, 'step-1');
      navigate('/onboarding/step-2', { replace: true });
    } catch (error) {
      console.error('❌ Error completing step 1:', error);
      console.error('❌ Attempted to save on submit:', data);
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
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your full name" 
                      {...field}
                      data-testid="input-full-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store/Business Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your store or business name" 
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
              name="whatsappNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Number *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your WhatsApp number with country code" 
                      type="tel"
                      {...field}
                      data-testid="input-whatsapp"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-gray-600">This is how customers will contact you</p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
                  <FormControl>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      {...field}
                      data-testid="select-country"
                    >
                      <option value="">Select your country</option>
                      <option value="kenya">Kenya</option>
                      <option value="uganda">Uganda</option>
                      <option value="tanzania">Tanzania</option>
                      <option value="ghana">Ghana</option>
                      <option value="nigeria">Nigeria</option>
                      <option value="south-africa">South Africa</option>
                      <option value="rwanda">Rwanda</option>
                      <option value="zambia">Zambia</option>
                      <option value="zimbabwe">Zimbabwe</option>
                      <option value="senegal">Senegal</option>
                      <option value="other">Other</option>
                    </select>
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
                  <FormLabel>Business Category *</FormLabel>
                  <FormControl>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      {...field}
                      data-testid="select-category"
                    >
                      <option value="">Select a category</option>
                      <option value="food">Food & Beverages</option>
                      <option value="fashion">Fashion & Clothing</option>
                      <option value="decor">Home Decor</option>
                      <option value="electronics">Electronics</option>
                      <option value="services">Services</option>
                      <option value="beauty">Beauty & Personal Care</option>
                      <option value="crafts">Arts & Crafts</option>
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
                data-testid="button-save-continue"
                className="min-w-[140px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </div>
                ) : (
                  'Save & Continue'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
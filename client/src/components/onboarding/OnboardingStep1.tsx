import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth } from '@/lib/firebase';
import { completeStep } from '@/lib/onboarding';
import { categories } from '@shared/schema';
import { GLOBAL_COUNTRIES, formatPhoneNumber, validatePhoneNumber } from '@/lib/data/countries';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const step1Schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  businessName: z.string().min(2, 'Store/Business name must be at least 2 characters'),
  whatsappNumber: z.string().refine((phone) => {
    // Basic format check
    if (!phone || phone.length < 10) return false;
    // Phone validation will be done with country context
    return true;
  }, 'Please enter a valid WhatsApp number'),
  country: z.string().min(1, 'Please select a country'),
  category: z.enum(categories, { errorMap: () => ({ message: 'Please select a business category' }) }),
  subscriptionPlan: z.string().default('beta-free'),
}).refine((data) => {
  // Validate phone number with country context
  if (data.country && data.whatsappNumber) {
    return validatePhoneNumber(data.whatsappNumber, data.country);
  }
  return true;
}, {
  message: 'WhatsApp number format is invalid for selected country',
  path: ['whatsappNumber'],
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
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  const form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fullName: '',
      businessName: '',
      whatsappNumber: '',
      country: '',
      category: undefined, // No default - user must select
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
            category: data.category, // Load existing or undefined (no default)
            subscriptionPlan: data.subscriptionPlan || 'beta-free',
          });
          // Set selected country state for form interactions
          if (data.country) {
            setSelectedCountry(data.country);
          }
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
                      placeholder={selectedCountry ? `Example: ${GLOBAL_COUNTRIES.find(c => c.code === selectedCountry)?.dialCode}7XXXXXXXX` : "Select country first, then enter WhatsApp number"}
                      type="tel"
                      {...field}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Auto-format with country code if country is selected
                        if (selectedCountry && value && !value.startsWith('+')) {
                          const country = GLOBAL_COUNTRIES.find(c => c.code === selectedCountry);
                          if (country && !value.startsWith(country.dialCode)) {
                            value = formatPhoneNumber(value, selectedCountry);
                          }
                        }
                        field.onChange(value);
                      }}
                      data-testid="input-whatsapp"
                    />
                  </FormControl>
                  <FormMessage />
                  {selectedCountry && (
                    <p className="text-sm text-gray-600">
                      Format: {GLOBAL_COUNTRIES.find(c => c.code === selectedCountry)?.dialCode}XXXXXXXXX
                    </p>
                  )}
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
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedCountry(value);
                      // Auto-format phone number when country changes
                      const currentPhone = form.getValues('whatsappNumber');
                      if (currentPhone && value) {
                        const formattedPhone = formatPhoneNumber(currentPhone, value);
                        form.setValue('whatsappNumber', formattedPhone);
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-country">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GLOBAL_COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name} ({country.dialCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a business category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
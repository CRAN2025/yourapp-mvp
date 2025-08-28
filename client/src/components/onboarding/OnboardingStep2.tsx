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

const step2Schema = z.object({
  storeLogo: z.string().optional(),
  storeBanner: z.string().optional(),
  storeBio: z.string().optional(),
  socialMedia: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    facebook: z.string().optional(),
  }).optional(),
  preferredLanguage: z.string().optional(),
  returnPolicy: z.string().optional(),
  operatingHours: z.string().optional(),
  tags: z.string().optional(),
});

type Step2FormData = z.infer<typeof step2Schema>;

interface OnboardingStep2Props {
  storeId: string;
}

export default function OnboardingStep2({ storeId }: OnboardingStep2Props) {
  const [, navigate] = useLocation();
  const [user] = useAuthState(auth);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      storeLogo: '',
      storeBanner: '',
      storeBio: '',
      socialMedia: {
        instagram: '',
        tiktok: '',
        facebook: '',
      },
      preferredLanguage: '',
      returnPolicy: '',
      operatingHours: '',
      tags: '',
    },
  });

  const onSubmit = async (data: Step2FormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Here you would typically save the contact info
      // For now, we'll just complete the step
      
      await completeStep(user.uid, 'step-2');
      navigate('/onboarding/step-3', { replace: true });
    } catch (error) {
      console.error('Error completing step 2:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    navigate('/onboarding/step-1', { replace: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enhance Your Store</CardTitle>
        <CardDescription>
          Optional: Add branding and details to make your store more attractive to customers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="storeBio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description about your store and what makes it special..." 
                      className="min-h-[80px]"
                      {...field}
                      data-testid="textarea-store-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Social Media Links (Optional)</h3>
              <FormField
                control={form.control}
                name="socialMedia.instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://instagram.com/your-handle" 
                        {...field}
                        data-testid="input-instagram"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="socialMedia.tiktok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TikTok</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://tiktok.com/@your-handle" 
                        {...field}
                        data-testid="input-tiktok"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="socialMedia.facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://facebook.com/your-page" 
                        {...field}
                        data-testid="input-facebook"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferredLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Language (Optional)</FormLabel>
                  <FormControl>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      {...field}
                      data-testid="select-language"
                    >
                      <option value="">Select language</option>
                      <option value="english">English</option>
                      <option value="swahili">Swahili</option>
                      <option value="french">French</option>
                      <option value="arabic">Arabic</option>
                      <option value="hausa">Hausa</option>
                      <option value="yoruba">Yoruba</option>
                      <option value="igbo">Igbo</option>
                      <option value="other">Other</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operatingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operating Hours (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Mon-Fri 9AM-6PM, Sat 10AM-4PM" 
                      {...field}
                      data-testid="input-hours"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags/Keywords (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., organic, handmade, local, affordable" 
                      {...field}
                      data-testid="input-tags"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-gray-600">Comma-separated keywords to help customers find you</p>
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
                Back
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
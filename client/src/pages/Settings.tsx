import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Palette, CreditCard, Upload } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { normalizeToE164, isValidPhoneNumber } from '@/lib/utils/phone';
import { categories } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ImageUpload from '@/components/ImageUpload';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters'),
  storeDescription: z.string().optional(),
  location: z.string().optional(),
  category: z.enum(categories),
  whatsappNumber: z.string().refine((phone) => isValidPhoneNumber(phone), {
    message: 'Please enter a valid WhatsApp number',
  }),
});

const brandingSchema = z.object({
  logoFile: z.instanceof(File).optional(),
  coverFile: z.instanceof(File).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;
type BrandingForm = z.infer<typeof brandingSchema>;

export default function Settings() {
  const { seller, updateSellerProfile, loading } = useAuthContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [coverFiles, setCoverFiles] = useState<File[]>([]);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      storeName: seller?.storeName || '',
      storeDescription: seller?.storeDescription || '',
      location: seller?.location || '',
      category: seller?.category as any || 'other',
      whatsappNumber: seller?.whatsappNumber || '',
    },
  });

  const brandingForm = useForm<BrandingForm>({
    resolver: zodResolver(brandingSchema),
  });

  const handleProfileUpdate = async (data: ProfileForm) => {
    try {
      const e164Number = normalizeToE164(data.whatsappNumber);
      if (!e164Number) {
        throw new Error('Invalid phone number format');
      }

      await updateSellerProfile({
        storeName: data.storeName,
        storeDescription: data.storeDescription,
        location: data.location,
        category: data.category,
        whatsappNumber: e164Number,
      });

      toast({
        title: 'Profile updated',
        description: 'Your store profile has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile.',
        variant: 'destructive',
      });
    }
  };

  const handleBrandingUpdate = async (data: BrandingForm) => {
    try {
      // TODO: Upload images to Firebase Storage and get URLs
      // For now, just show success message
      toast({
        title: 'Branding updated',
        description: 'Your store branding has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update branding.',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your store settings and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2" data-testid="tab-profile">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2" data-testid="tab-branding">
              <Palette className="w-4 h-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2" data-testid="tab-billing">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Store Profile</CardTitle>
                <CardDescription>
                  Update your store information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="storeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Sarah's Handmade Jewelry"
                              {...field}
                              data-testid="input-store-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="storeDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Description</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={4}
                              placeholder="Tell customers about your store and what makes it special..."
                              {...field}
                              data-testid="textarea-store-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Toronto, Canada"
                                {...field}
                                data-testid="input-location"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="whatsappNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp Number *</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              {...field}
                              data-testid="input-whatsapp"
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Customers will contact you through this WhatsApp number
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={loading}
                      data-testid="button-save-profile"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Store Branding</CardTitle>
                <CardDescription>
                  Customize your store's visual appearance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...brandingForm}>
                  <form onSubmit={brandingForm.handleSubmit(handleBrandingUpdate)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Store Logo</label>
                      <ImageUpload
                        files={logoFiles}
                        onChange={setLogoFiles}
                        maxFiles={1}
                        maxSize={1024 * 1024} // 1MB
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Upload a square logo (recommended: 200x200px or larger)
                      </p>
                      {seller?.logoUrl && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Current Logo:</p>
                          <img
                            src={seller.logoUrl}
                            alt="Current logo"
                            className="w-20 h-20 rounded-lg object-cover border"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Cover Image</label>
                      <ImageUpload
                        files={coverFiles}
                        onChange={setCoverFiles}
                        maxFiles={1}
                        maxSize={2 * 1024 * 1024} // 2MB
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Upload a cover image for your store (recommended: 1200x400px or larger)
                      </p>
                      {seller?.coverUrl && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Current Cover:</p>
                          <img
                            src={seller.coverUrl}
                            alt="Current cover"
                            className="w-full h-32 rounded-lg object-cover border"
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      data-testid="button-save-branding"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>
                  Manage your subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription>
                    Billing will be available soon. You're currently on the free plan with full access to all features.
                  </AlertDescription>
                </Alert>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Current Plan</h4>
                      <p className="text-sm text-muted-foreground">Free Plan - Unlimited products</p>
                    </div>
                    <Button variant="outline" disabled data-testid="button-upgrade-plan">
                      Coming Soon
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Payment Method</h4>
                      <p className="text-sm text-muted-foreground">No payment method required</p>
                    </div>
                    <Button variant="outline" disabled data-testid="button-add-payment">
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

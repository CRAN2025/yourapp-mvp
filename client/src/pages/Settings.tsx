import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, Phone, CreditCard, Shield, User, Globe, MessageSquare, Tag, Palette, Mail, Languages } from 'lucide-react';
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

const storeProfileSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters'),
  storeDescription: z.string().optional(),
  category: z.enum(categories),
  tags: z.string().optional(),
  logoFile: z.instanceof(File).optional(),
  bannerFile: z.instanceof(File).optional(),
});

const contactVisibilitySchema = z.object({
  whatsappNumber: z.string().refine((phone) => isValidPhoneNumber(phone), {
    message: 'Please enter a valid WhatsApp number',
  }),
  email: z.string().email('Please enter a valid email address'),
  socialMedia: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    facebook: z.string().optional(),
  }).optional(),
  preferredLanguage: z.string().optional(),
});

const paymentsDeliverySchema = z.object({
  paymentMethods: z.array(z.string()).default([]),
  deliveryOptions: z.array(z.string()).default([]),
});

const accountSecuritySchema = z.object({
  subscriptionPlan: z.string(),
  country: z.string(),
});

type StoreProfileForm = z.infer<typeof storeProfileSchema>;
type ContactVisibilityForm = z.infer<typeof contactVisibilitySchema>;
type PaymentsDeliveryForm = z.infer<typeof paymentsDeliverySchema>;
type AccountSecurityForm = z.infer<typeof accountSecuritySchema>;

export default function Settings() {
  const { seller, updateSellerProfile, loading } = useAuthContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('store');
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);

  const storeProfileForm = useForm<StoreProfileForm>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: {
      storeName: seller?.storeName || '',
      storeDescription: seller?.storeDescription || '',
      category: seller?.category as any || 'other',
      tags: '',
    },
  });

  const contactVisibilityForm = useForm<ContactVisibilityForm>({
    resolver: zodResolver(contactVisibilitySchema),
    defaultValues: {
      whatsappNumber: seller?.whatsappNumber || '',
      email: seller?.email || '',
      socialMedia: {
        instagram: '',
        tiktok: '',
        facebook: '',
      },
      preferredLanguage: '',
    },
  });

  const paymentsDeliveryForm = useForm<PaymentsDeliveryForm>({
    resolver: zodResolver(paymentsDeliverySchema),
    defaultValues: {
      paymentMethods: seller?.paymentMethods || [],
      deliveryOptions: seller?.deliveryOptions || [],
    },
  });

  const accountSecurityForm = useForm<AccountSecurityForm>({
    resolver: zodResolver(accountSecuritySchema),
    defaultValues: {
      subscriptionPlan: 'beta-free',
      country: seller?.country || '',
    },
  });

  const handleStoreProfileUpdate = async (data: StoreProfileForm) => {
    try {
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      await updateSellerProfile({
        storeName: data.storeName,
        storeDescription: data.storeDescription,
        category: data.category,
        tags: tags,
      });

      toast({
        title: 'Store profile updated',
        description: 'Your store profile has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update store profile.',
        variant: 'destructive',
      });
    }
  };

  const handleContactVisibilityUpdate = async (data: ContactVisibilityForm) => {
    try {
      const e164Number = normalizeToE164(data.whatsappNumber);
      if (!e164Number) {
        throw new Error('Invalid phone number format');
      }

      await updateSellerProfile({
        whatsappNumber: e164Number,
        email: data.email,
        socialMedia: data.socialMedia,
        preferredLanguage: data.preferredLanguage,
      });

      toast({
        title: 'Contact information updated',
        description: 'Your contact and visibility settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update contact information.',
        variant: 'destructive',
      });
    }
  };

  const handlePaymentsDeliveryUpdate = async (data: PaymentsDeliveryForm) => {
    try {
      await updateSellerProfile({
        paymentMethods: data.paymentMethods,
        deliveryOptions: data.deliveryOptions,
      });

      toast({
        title: 'Payment & delivery updated',
        description: 'Your payment and delivery options have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update payment and delivery options.',
        variant: 'destructive',
      });
    }
  };

  const handleAccountSecurityUpdate = async (data: AccountSecurityForm) => {
    try {
      await updateSellerProfile({
        subscriptionPlan: data.subscriptionPlan,
        country: data.country,
      });

      toast({
        title: 'Account settings updated',
        description: 'Your account and security settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update account settings.',
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="store" className="flex items-center gap-2" data-testid="tab-store-profile">
              <Store className="w-4 h-4" />
              Store Profile
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2" data-testid="tab-contact-visibility">
              <Phone className="w-4 h-4" />
              Contact & Visibility
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2" data-testid="tab-payments-delivery">
              <CreditCard className="w-4 h-4" />
              Payments & Delivery
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2" data-testid="tab-account-security">
              <Shield className="w-4 h-4" />
              Account & Security
            </TabsTrigger>
          </TabsList>

          {/* Store Profile Tab */}
          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Store Profile
                </CardTitle>
                <CardDescription>
                  Manage your store's branding, description, and visual presentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...storeProfileForm}>
                  <form onSubmit={storeProfileForm.handleSubmit(handleStoreProfileUpdate)} className="space-y-6">
                    {/* Store Logo & Banner */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <Palette className="w-4 h-4 inline mr-1" />
                          Store Logo
                        </label>
                        <ImageUpload
                          files={logoFiles}
                          onChange={setLogoFiles}
                          maxFiles={1}
                          maxSize={1024 * 1024} // 1MB
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          Square format recommended (200x200px+)
                        </p>
                        {seller?.logoUrl && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Current:</p>
                            <img
                              src={seller.logoUrl}
                              alt="Current logo"
                              className="w-16 h-16 rounded-lg object-cover border"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <Palette className="w-4 h-4 inline mr-1" />
                          Store Banner
                        </label>
                        <ImageUpload
                          files={bannerFiles}
                          onChange={setBannerFiles}
                          maxFiles={1}
                          maxSize={2 * 1024 * 1024} // 2MB
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          Wide format recommended (1200x400px+)
                        </p>
                        {seller?.bannerUrl && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Current:</p>
                            <img
                              src={seller.bannerUrl}
                              alt="Current banner"
                              className="w-full h-20 rounded-lg object-cover border"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Store Info */}
                    <FormField
                      control={storeProfileForm.control}
                      name="storeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Store className="w-4 h-4" />
                            Store Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Sarah's Handmade Jewelry"
                              {...field}
                              data-testid="input-store-name"
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Changing your store name may require verification
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={storeProfileForm.control}
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

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={storeProfileForm.control}
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

                      <FormField
                        control={storeProfileForm.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Tag className="w-4 h-4" />
                              Tags/Keywords
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., organic, handmade, local, affordable"
                                {...field}
                                data-testid="input-tags"
                              />
                            </FormControl>
                            <p className="text-sm text-muted-foreground">
                              Comma-separated keywords to help customers find you
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      data-testid="button-save-store-profile"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : 'Save Store Profile'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact & Visibility Tab */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact & Visibility
                </CardTitle>
                <CardDescription>
                  Manage how customers can reach you and your store's visibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...contactVisibilityForm}>
                  <form onSubmit={contactVisibilityForm.handleSubmit(handleContactVisibilityUpdate)} className="space-y-6">
                    {/* Primary Contact */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Primary Contact
                      </h3>
                      
                      <FormField
                        control={contactVisibilityForm.control}
                        name="whatsappNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp Number *</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+254 700 123 456"
                                {...field}
                                data-testid="input-whatsapp"
                              />
                            </FormControl>
                            <Alert>
                              <AlertDescription>
                                Changing your WhatsApp number will require OTP verification
                              </AlertDescription>
                            </Alert>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={contactVisibilityForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Email Address *
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="your.email@example.com"
                                {...field}
                                data-testid="input-email"
                              />
                            </FormControl>
                            <p className="text-sm text-muted-foreground">
                              Email changes require confirmation
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Social Media */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Social Media Links
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={contactVisibilityForm.control}
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
                          control={contactVisibilityForm.control}
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
                          control={contactVisibilityForm.control}
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

                        <FormField
                          control={contactVisibilityForm.control}
                          name="preferredLanguage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Languages className="w-4 h-4" />
                                Preferred Language
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-language">
                                    <SelectValue placeholder="Select language" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="english">English</SelectItem>
                                  <SelectItem value="swahili">Swahili</SelectItem>
                                  <SelectItem value="french">French</SelectItem>
                                  <SelectItem value="arabic">Arabic</SelectItem>
                                  <SelectItem value="hausa">Hausa</SelectItem>
                                  <SelectItem value="yoruba">Yoruba</SelectItem>
                                  <SelectItem value="igbo">Igbo</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      data-testid="button-save-contact"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : 'Save Contact Settings'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments & Delivery Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payments & Delivery
                </CardTitle>
                <CardDescription>
                  Configure your payment methods and delivery options for customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...paymentsDeliveryForm}>
                  <form onSubmit={paymentsDeliveryForm.handleSubmit(handlePaymentsDeliveryUpdate)} className="space-y-6">
                    {/* Payment Methods */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Payment Methods</h3>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            data-testid="payment-cash"
                          />
                          <span>Cash on Delivery</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            data-testid="payment-mobile-money"
                          />
                          <span>Mobile Money (M-Pesa, MTN, etc.)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            data-testid="payment-bank-transfer"
                          />
                          <span>Bank Transfer</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            data-testid="payment-card"
                          />
                          <span>Credit/Debit Card (Coming Soon)</span>
                        </label>
                      </div>
                    </div>

                    {/* Delivery Options */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Delivery Options</h3>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            data-testid="delivery-pickup"
                          />
                          <span>Customer Pickup</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            data-testid="delivery-local"
                          />
                          <span>Local Delivery</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            data-testid="delivery-nationwide"
                          />
                          <span>Nationwide Shipping</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            data-testid="delivery-international"
                          />
                          <span>International Shipping</span>
                        </label>
                      </div>
                    </div>

                    <Alert>
                      <AlertDescription>
                        These options will be displayed to customers when they view your products. You can manage specific pricing and delivery details for each product separately.
                      </AlertDescription>
                    </Alert>

                    <Button
                      type="submit"
                      disabled={loading}
                      data-testid="button-save-payments-delivery"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : 'Save Payment & Delivery Settings'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account & Security Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Account & Security
                </CardTitle>
                <CardDescription>
                  Manage your account details, subscription, and security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Account Information - Read Only */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Account Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Full Name
                        </label>
                        <Input
                          value={seller?.fullName || ''}
                          disabled
                          className="bg-muted"
                          data-testid="display-full-name"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Contact support to change your legal name
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Country
                        </label>
                        <Input
                          value={seller?.country || ''}
                          disabled
                          className="bg-muted"
                          data-testid="display-country"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Set during registration - contact support to change
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subscription */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Subscription</h3>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                      <div>
                        <h4 className="font-medium text-green-800">Beta Free Plan</h4>
                        <p className="text-sm text-green-600">All features included during beta period</p>
                      </div>
                      <Button variant="outline" disabled className="bg-white">
                        Active
                      </Button>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Security</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Change Password</h4>
                          <p className="text-sm text-muted-foreground">Update your account password</p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: 'Change Password',
                              description: 'Password change functionality will be available soon.',
                            });
                          }}
                          data-testid="button-change-password"
                        >
                          Change
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Two-Factor Authentication</h4>
                          <p className="text-sm text-muted-foreground">Add extra security with 2FA</p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: 'Two-Factor Authentication',
                              description: '2FA setup will be available soon.',
                            });
                          }}
                          data-testid="button-setup-2fa"
                        >
                          Setup
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
                    <div className="border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-red-800">Delete Account</h4>
                          <p className="text-sm text-red-600">
                            Permanently delete your account and all associated data
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            toast({
                              title: 'Account Deletion',
                              description: 'Please contact support to delete your account.',
                              variant: 'destructive',
                            });
                          }}
                          data-testid="button-delete-account"
                        >
                          Delete Account
                        </Button>
                      </div>
                    </div>
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

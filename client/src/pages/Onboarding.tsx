import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { validatePhoneNumber, getPhoneHint } from '@/lib/utils/phone';
import { categories, countries, deliveryOptions, paymentMethods } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import ImageUpload from '@/components/ImageUpload';

const storeDetailsSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters'),
  storeDescription: z.string().min(20, 'Description should be at least 20 characters'),
  category: z.enum(categories, { required_error: 'Please select a category' }),
});

const businessInfoSchema = z.object({
  businessEmail: z.string().email('Please enter a valid business email').optional(),
  country: z.string().min(1, 'Please select a country'),
  city: z.string().min(2, 'City is required'),
  businessType: z.enum(['individual', 'business']),
  whatsappNumber: z.string().min(1, 'WhatsApp number is required'),
});

const deliveryPaymentSchema = z.object({
  deliveryOptions: z.array(z.string()).min(1, 'Select at least one delivery option'),
  paymentMethods: z.array(z.string()).min(1, 'Select at least one payment method'),
});

const brandingSchema = z.object({
  logoFile: z.instanceof(File).optional(),
  coverFile: z.instanceof(File).optional(),
});

type StoreDetailsForm = z.infer<typeof storeDetailsSchema>;
type BusinessInfoForm = z.infer<typeof businessInfoSchema>;
type DeliveryPaymentForm = z.infer<typeof deliveryPaymentSchema>;
type BrandingForm = z.infer<typeof brandingSchema>;

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, navigate] = useLocation();
  const { seller, updateSellerProfile, loading } = useAuthContext();
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [phoneHint, setPhoneHint] = useState(getPhoneHint('US'));

  const steps = [
    { id: 1, name: 'Store Details', description: "Let's start with the basics about your store" },
    { id: 2, name: 'Business Info', description: 'Business information and contact details' },
    { id: 3, name: 'Delivery & Payment', description: 'How customers will pay and receive orders' },
    { id: 4, name: 'Branding', description: 'Make your store look professional (optional)' },
  ];

  const currentStepData = steps.find(step => step.id === currentStep)!;
  const progress = (currentStep / steps.length) * 100;

  // Step 1: Store Details
  const storeForm = useForm<StoreDetailsForm>({
    resolver: zodResolver(storeDetailsSchema),
    defaultValues: {
      storeName: seller?.storeName || '',
      storeDescription: seller?.storeDescription || '',
      category: seller?.category as any || '',
    },
  });

  // Step 2: Business Info
  const businessForm = useForm<BusinessInfoForm>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessEmail: seller?.businessEmail || seller?.email || '',
      country: seller?.country || 'US',
      city: seller?.city || '',
      businessType: seller?.businessType || 'individual',
      whatsappNumber: seller?.whatsappNumber || '',
    },
  });

  // Step 3: Delivery & Payment
  const deliveryForm = useForm<DeliveryPaymentForm>({
    resolver: zodResolver(deliveryPaymentSchema),
    defaultValues: {
      deliveryOptions: seller?.deliveryOptions || [],
      paymentMethods: seller?.paymentMethods || [],
    },
  });

  // Step 4: Branding
  const brandingForm = useForm<BrandingForm>({
    resolver: zodResolver(brandingSchema),
  });

  const [logoFiles, setLogoFiles] = useState<File[]>([]);

  // Handle country change to update currency and phone hint
  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(countryCode);
      setPhoneHint(getPhoneHint(countryCode));
      businessForm.setValue('country', country.name);
    }
  };

  const handleStoreDetails = async (data: StoreDetailsForm) => {
    try {
      await updateSellerProfile({
        storeName: data.storeName,
        storeDescription: data.storeDescription,
        category: data.category,
      });

      setCurrentStep(2);
      toast({
        title: 'Store details saved',
        description: 'Your store information has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save store details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBusinessInfo = async (data: BusinessInfoForm) => {
    try {
      // Validate phone number
      const phoneValidation = validatePhoneNumber(data.whatsappNumber, selectedCountry);
      if (!phoneValidation.isValid) {
        toast({
          title: 'Invalid phone number',
          description: phoneValidation.error,
          variant: 'destructive',
        });
        return;
      }

      const country = countries.find(c => c.name === data.country);
      await updateSellerProfile({
        businessEmail: data.businessEmail,
        country: data.country,
        city: data.city,
        businessType: data.businessType,
        whatsappNumber: phoneValidation.normalized!,
        currency: country?.currency || 'USD',
      });

      setCurrentStep(3);
      toast({
        title: 'Business info saved',
        description: 'Your business information has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save business info. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeliveryPayment = async (data: DeliveryPaymentForm) => {
    try {
      await updateSellerProfile({
        deliveryOptions: data.deliveryOptions,
        paymentMethods: data.paymentMethods,
      });

      setCurrentStep(4);
      toast({
        title: 'Delivery & payment saved',
        description: 'Your delivery and payment options have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save delivery & payment options. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBranding = async (data: BrandingForm) => {
    try {
      // TODO: Upload logo to Firebase Storage and get URL
      // For now, complete onboarding
      navigate('/products');
      toast({
        title: 'Welcome to ShopLink!',
        description: 'Your store setup is complete. Start adding products!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete onboarding. Please try again.',
        variant: 'destructive',
      });
    }
  };


  const handleSkip = () => {
    if (currentStep === 4) {
      navigate('/products');
      toast({
        title: 'Welcome to ShopLink!',
        description: 'Your store setup is complete. Start adding products!',
      });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm font-medium text-gray-500 mb-2">
            <span>Step {currentStep} of {steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>{currentStepData.name}</CardTitle>
            <CardDescription>{currentStepData.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <Form {...storeForm}>
                <form onSubmit={storeForm.handleSubmit(handleStoreDetails)} className="space-y-6">
                  <FormField
                    control={storeForm.control}
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
                    control={storeForm.control}
                    name="storeDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="Tell customers about your store and what makes it special... (minimum 20 characters)"
                            {...field}
                            data-testid="textarea-store-description"
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          {field.value?.length || 0}/20 characters minimum
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={storeForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select a category" />
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

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button
                      type="submit"
                      className="sm:flex-1"
                      disabled={loading}
                      data-testid="button-continue"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : 'Continue'}
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {currentStep === 2 && (
              <Form {...businessForm}>
                <form onSubmit={businessForm.handleSubmit(handleBusinessInfo)} className="space-y-6">
                  <FormField
                    control={businessForm.control}
                    name="businessEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Email (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="business@example.com"
                            {...field}
                            data-testid="input-business-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={businessForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country *</FormLabel>
                          <Select onValueChange={(value) => {
                            const country = countries.find(c => c.name === value);
                            if (country) {
                              handleCountryChange(country.code);
                              field.onChange(value);
                            }
                          }} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-country">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[200px]">
                              {countries.map((country) => (
                                <SelectItem key={country.code} value={country.name}>
                                  {country.flag} {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={businessForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., New York"
                              {...field}
                              data-testid="input-city"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={businessForm.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-2 gap-4"
                          >
                            <div className="flex items-center space-x-2 p-4 border rounded-lg">
                              <RadioGroupItem value="individual" id="individual" />
                              <Label htmlFor="individual" className="font-medium">
                                👤 Individual Seller
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-4 border rounded-lg">
                              <RadioGroupItem value="business" id="business" />
                              <Label htmlFor="business" className="font-medium">
                                🏢 Business/Company
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessForm.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number *</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder={phoneHint}
                            {...field}
                            data-testid="input-whatsapp"
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Expected format: {phoneHint}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Customers will contact you through this WhatsApp number
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      data-testid="button-back"
                    >
                      <ChevronLeft className="mr-2 w-4 h-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="sm:flex-1"
                      disabled={loading}
                      data-testid="button-continue-business"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : 'Continue'}
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {currentStep === 3 && (
              <Form {...deliveryForm}>
                <form onSubmit={deliveryForm.handleSubmit(handleDeliveryPayment)} className="space-y-6">
                  <FormField
                    control={deliveryForm.control}
                    name="deliveryOptions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Options * (Select at least one)</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {deliveryOptions.map((option) => (
                            <div key={option.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                              <Checkbox
                                id={option.id}
                                checked={field.value.includes(option.id)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...field.value, option.id]
                                    : field.value.filter(v => v !== option.id);
                                  field.onChange(newValue);
                                }}
                              />
                              <div className="space-y-1">
                                <Label htmlFor={option.id} className="font-medium">
                                  {option.label}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {option.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={deliveryForm.control}
                    name="paymentMethods"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Methods * (Select at least one)</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {paymentMethods.map((method) => (
                            <div key={method.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                              <Checkbox
                                id={method.id}
                                checked={field.value.includes(method.id)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...field.value, method.id]
                                    : field.value.filter(v => v !== method.id);
                                  field.onChange(newValue);
                                }}
                              />
                              <div className="space-y-1">
                                <Label htmlFor={method.id} className="font-medium">
                                  {method.label}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {method.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      data-testid="button-back-delivery"
                    >
                      <ChevronLeft className="mr-2 w-4 h-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="sm:flex-1"
                      disabled={loading}
                      data-testid="button-continue-delivery"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : 'Continue'}
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {currentStep === 4 && (
              <Form {...brandingForm}>
                <form onSubmit={brandingForm.handleSubmit(handleBranding)} className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl text-white">🎨</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Almost Done!</h3>
                      <p className="text-muted-foreground">
                        Add your store logo to make your brand stand out (optional)
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Store Logo (Optional)</label>
                    <ImageUpload
                      files={logoFiles}
                      onChange={setLogoFiles}
                      maxFiles={1}
                      maxSize={2 * 1024 * 1024} // 2MB
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended: Square image, minimum 200x200 pixels
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      data-testid="button-back-branding"
                    >
                      <ChevronLeft className="mr-2 w-4 h-4" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSkip}
                      className="sm:flex-1"
                      data-testid="button-skip-branding"
                    >
                      Skip & Complete Setup
                    </Button>
                    <Button
                      type="submit"
                      className="sm:flex-1"
                      disabled={loading}
                      data-testid="button-complete-onboarding"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : 'Complete Setup'}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground mt-6">
          <p>Need help? Contact our support team anytime.</p>
        </div>
      </div>
    </div>
  );
}

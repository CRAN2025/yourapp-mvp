import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, Link } from 'wouter';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { validatePhoneNumber, getPhoneHint } from '@/lib/utils/phone';
import { categories, countries, deliveryOptions, paymentMethods } from '@shared/schema';
import { ONBOARDING_STEP_NAMES } from '@shared/config';
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
import logoUrl from '@/assets/logo.png';

const storeDetailsSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters').max(80, 'Store name too long'),
  storeDescription: z.string().min(20, 'Description should be at least 20 characters').max(500, 'Description too long'),
  category: z.enum(categories, { required_error: 'Please select a category' }),
});

const businessInfoSchema = z.object({
  businessEmail: z.string().email('Please enter a valid business email').optional().or(z.literal('')),
  country: z.string().min(1, 'Please select a country'),
  city: z.string().min(2, 'City is required'),
  businessType: z.enum(['individual', 'business']),
  whatsappNumber: z.string().min(1, 'WhatsApp number is required'),
});

const deliveryPaymentSchema = z.object({
  deliveryOptions: z.array(z.string()).min(1, 'Select at least one delivery option'),
  paymentMethods: z.array(z.string()).min(1, 'Select at least one payment method'),
});

const confirmSchema = z.object({
  confirmed: z.boolean().refine(val => val === true, 'You must confirm the details are accurate'),
});

type StoreDetailsForm = z.infer<typeof storeDetailsSchema>;
type BusinessInfoForm = z.infer<typeof businessInfoSchema>;
type DeliveryPaymentForm = z.infer<typeof deliveryPaymentSchema>;
type ConfirmForm = z.infer<typeof confirmSchema>;

export default function Onboarding() {
  const { user } = useAuth();
  const { onboardingState, saveStep, completeOnboarding, canAccessStep, getNextStep, loading: onboardingLoading } = useOnboardingProgress();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Get step from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlStep = parseInt(urlParams.get('step') || '1');
  
  // Simple step state - OnboardingGuard handles validation
  const [currentStep, setCurrentStep] = useState(urlStep >= 1 && urlStep <= 4 ? urlStep : 1);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [phoneHint, setPhoneHint] = useState(getPhoneHint('US'));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync currentStep with URL parameter changes
  useEffect(() => {
    if (urlStep >= 1 && urlStep <= 4) {
      setCurrentStep(urlStep);
    }
  }, [urlStep]);

  // Pre-fill forms with existing data
  useEffect(() => {
    const stepData = onboardingState.steps[currentStep as keyof typeof onboardingState.steps];
    if (stepData && currentStep === 2) {
      setSelectedCountry(stepData.country || 'US');
      setPhoneHint(getPhoneHint(stepData.country || 'US'));
    }
  }, [currentStep, onboardingState]);

  const steps = [
    { id: 1, name: ONBOARDING_STEP_NAMES[1], description: "Let's start with the basics about your store" },
    { id: 2, name: ONBOARDING_STEP_NAMES[2], description: 'Business information and contact details' },
    { id: 3, name: ONBOARDING_STEP_NAMES[3], description: 'How customers will pay and receive orders' },
    { id: 4, name: ONBOARDING_STEP_NAMES[4], description: 'Confirm your store details' },
  ];

  const currentStepData = steps.find(step => step.id === currentStep)!;
  const progress = (currentStep / steps.length) * 100;

  // Step 1: Store Details
  const storeForm = useForm<StoreDetailsForm>({
    resolver: zodResolver(storeDetailsSchema),
    defaultValues: {
      storeName: onboardingState.steps[1]?.storeName || '',
      storeDescription: onboardingState.steps[1]?.storeDescription || '',
      category: onboardingState.steps[1]?.category || '',
    },
  });

  // Step 2: Business Info
  const businessForm = useForm<BusinessInfoForm>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessEmail: onboardingState.steps[2]?.businessEmail || '',
      country: onboardingState.steps[2]?.country || 'US',
      city: onboardingState.steps[2]?.city || '',
      businessType: onboardingState.steps[2]?.businessType || 'individual',
      whatsappNumber: onboardingState.steps[2]?.whatsappNumber || '',
    },
  });

  // Step 3: Delivery & Payment
  const deliveryForm = useForm<DeliveryPaymentForm>({
    resolver: zodResolver(deliveryPaymentSchema),
    defaultValues: {
      deliveryOptions: onboardingState.steps[3]?.deliveryOptions || [],
      paymentMethods: onboardingState.steps[3]?.paymentMethods || [],
    },
  });

  // Step 4: Confirmation
  const confirmForm = useForm<ConfirmForm>({
    resolver: zodResolver(confirmSchema),
    defaultValues: {
      confirmed: false,
    },
  });

  // Handle country change for phone validation
  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(countryCode);
      setPhoneHint(getPhoneHint(countryCode));
      businessForm.setValue('country', country.name);
    }
  };

  // Step handlers with proper state management
  const handleStoreDetails = async (data: StoreDetailsForm) => {
    setIsSubmitting(true);
    try {
      await saveStep(1, data);
      
      const nextStep = Math.max(onboardingState.lastCompletedStep + 1, 2);
      setCurrentStep(nextStep);
      navigate(`/onboarding?step=${nextStep}`);
      
      console.log('onboarding_advanced', { from: 1, to: nextStep });
      
      toast({
        title: 'Store details saved',
        description: 'Your store information has been saved.',
      });
    } catch (error) {
      console.error('Store details save error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save store details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBusinessInfo = async (data: BusinessInfoForm) => {
    setIsSubmitting(true);
    try {
      // Validate phone number
      const phoneValidation = validatePhoneNumber(data.whatsappNumber, selectedCountry);
      if (!phoneValidation.isValid) {
        toast({
          title: 'Invalid phone number',
          description: phoneValidation.error,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const stepData = {
        ...data,
        whatsappNumber: phoneValidation.normalized!,
      };

      await saveStep(2, stepData);
      
      const nextStep = Math.max(onboardingState.lastCompletedStep + 1, 3);
      setCurrentStep(nextStep);
      navigate(`/onboarding?step=${nextStep}`);
      
      console.log('onboarding_advanced', { from: 2, to: nextStep });
      
      toast({
        title: 'Business info saved',
        description: 'Your business information has been saved.',
      });
    } catch (error) {
      console.error('Business info save error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save business info. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeliveryPayment = async (data: DeliveryPaymentForm) => {
    setIsSubmitting(true);
    try {
      await saveStep(3, data);
      
      const nextStep = Math.max(onboardingState.lastCompletedStep + 1, 4);
      setCurrentStep(nextStep);
      navigate(`/onboarding?step=${nextStep}`);
      
      console.log('onboarding_advanced', { from: 3, to: nextStep });
      
      toast({
        title: 'Delivery & payment saved',
        description: 'Your delivery and payment options have been saved.',
      });
    } catch (error) {
      console.error('Delivery payment save error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save delivery options. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmation = async (data: ConfirmForm) => {
    console.log('Starting handleConfirmation with data:', data);
    setIsSubmitting(true);
    
    try {
      if (!data.confirmed) {
        toast({
          title: 'Confirmation required',
          description: 'Please confirm your details are accurate to continue.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      console.log('Saving step 4...');
      await saveStep(4, data);
      
      console.log('Generating store ID...');
      // Generate store ID and complete onboarding
      const storeId = `store_${user?.uid}_${Date.now()}`;
      
      console.log('Completing onboarding with storeId:', storeId);
      await completeOnboarding(storeId);
      
      console.log('Onboarding completed, navigating to /products...');
      
      // Add a small delay to ensure state is updated before navigation
      setTimeout(() => {
        console.log('Navigating to /products after completion');
        navigate('/products');
      }, 200);
      
      toast({
        title: 'Welcome to ShopLynk!',
        description: 'Your store setup is complete. Start adding products!',
      });
    } catch (error) {
      console.error('Confirmation error:', error);
      toast({
        title: 'Error',
        description: `Failed to complete onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      navigate(`/onboarding?step=${prevStep}`);
    }
  };

  if (onboardingLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link to="/" aria-label="ShopLynk home">
            <img 
              src={logoUrl} 
              alt="ShopLynk" 
              className="h-8 sm:h-9 md:h-10 w-auto cursor-pointer"
            />
          </Link>
        </div>
      </header>
      
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
                            placeholder="Tell customers what makes your store special..."
                            className="min-h-[100px]"
                            {...field}
                            data-testid="input-store-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={storeForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                  <div className="flex justify-end pt-6">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      data-testid="button-continue-store"
                    >
                      {isSubmitting ? <LoadingSpinner size="sm" /> : 'Continue'}
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

                  <FormField
                    control={businessForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            const country = countries.find(c => c.name === value);
                            if (country) {
                              handleCountryChange(country.code);
                              field.onChange(value);
                            }
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue placeholder="Select a country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.code} value={country.name}>
                                {country.name}
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
                            placeholder="Your city"
                            {...field}
                            data-testid="input-city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessForm.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="individual" id="individual" />
                              <Label htmlFor="individual">
                                👤 Individual/Solo
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="business" id="business" />
                              <Label htmlFor="business">
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
                      disabled={isSubmitting}
                      data-testid="button-continue-business"
                    >
                      {isSubmitting ? <LoadingSpinner size="sm" /> : 'Continue'}
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
                      disabled={isSubmitting}
                      data-testid="button-continue-delivery"
                    >
                      {isSubmitting ? <LoadingSpinner size="sm" /> : 'Continue'}
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {currentStep === 4 && (
              <Form {...confirmForm}>
                <form onSubmit={confirmForm.handleSubmit(handleConfirmation)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Review Your Store Details</h3>
                    
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-700">Store Name:</span>
                        <span className="ml-2">{onboardingState.steps[1]?.storeName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Category:</span>
                        <span className="ml-2">{onboardingState.steps[1]?.category}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Country:</span>
                        <span className="ml-2">{onboardingState.steps[2]?.country}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">WhatsApp:</span>
                        <span className="ml-2">{onboardingState.steps[2]?.whatsappNumber}</span>
                      </div>
                    </div>

                    <FormField
                      control={confirmForm.control}
                      name="confirmed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-confirm"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I confirm these details are accurate
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              You can update these details later in your store settings
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      data-testid="button-back-confirm"
                    >
                      <ChevronLeft className="mr-2 w-4 h-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="sm:flex-1"
                      disabled={isSubmitting}
                      data-testid="button-complete"
                    >
                      {isSubmitting ? <LoadingSpinner size="sm" /> : 'Complete Setup'}
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { normalizeToE164, isValidPhoneNumber } from '@/lib/utils/phone';
import { categories } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import ImageUpload from '@/components/ImageUpload';

const storeDetailsSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters'),
  storeDescription: z.string().optional(),
  location: z.string().optional(),
  category: z.enum(categories, { required_error: 'Please select a category' }),
});

const whatsappSchema = z.object({
  whatsappNumber: z.string().refine((phone) => isValidPhoneNumber(phone), {
    message: 'Please enter a valid WhatsApp number',
  }),
});

const brandingSchema = z.object({
  logoFile: z.instanceof(File).optional(),
  coverFile: z.instanceof(File).optional(),
});

const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters').optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  description: z.string().optional(),
  images: z.array(z.instanceof(File)).optional(),
});

type StoreDetailsForm = z.infer<typeof storeDetailsSchema>;
type WhatsappForm = z.infer<typeof whatsappSchema>;
type BrandingForm = z.infer<typeof brandingSchema>;
type ProductForm = z.infer<typeof productSchema>;

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, navigate] = useLocation();
  const { seller, updateSellerProfile, loading } = useAuthContext();
  const { toast } = useToast();

  const steps = [
    { id: 1, name: 'Store Details', description: "Let's start with the basics about your store" },
    { id: 2, name: 'WhatsApp Number', description: 'Connect with customers through WhatsApp' },
    { id: 3, name: 'Branding', description: 'Make your store look professional' },
    { id: 4, name: 'First Product', description: 'Add your first product (optional)' },
  ];

  const currentStepData = steps.find(step => step.id === currentStep)!;
  const progress = (currentStep / steps.length) * 100;

  // Step 1: Store Details
  const storeForm = useForm<StoreDetailsForm>({
    resolver: zodResolver(storeDetailsSchema),
    defaultValues: {
      storeName: seller?.storeName || '',
      storeDescription: seller?.storeDescription || '',
      location: seller?.location || '',
      category: seller?.category as any || '',
    },
  });

  // Step 2: WhatsApp
  const whatsappForm = useForm<WhatsappForm>({
    resolver: zodResolver(whatsappSchema),
    defaultValues: {
      whatsappNumber: seller?.whatsappNumber || '',
    },
  });

  // Step 3: Branding
  const brandingForm = useForm<BrandingForm>({
    resolver: zodResolver(brandingSchema),
  });

  // Step 4: First Product
  const productForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [productFiles, setProductFiles] = useState<File[]>([]);

  const handleStoreDetails = async (data: StoreDetailsForm) => {
    try {
      await updateSellerProfile({
        storeName: data.storeName,
        storeDescription: data.storeDescription,
        location: data.location,
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

  const handleWhatsApp = async (data: WhatsappForm) => {
    try {
      const e164Number = normalizeToE164(data.whatsappNumber);
      if (!e164Number) {
        throw new Error('Invalid phone number format');
      }

      await updateSellerProfile({
        whatsappNumber: e164Number,
      });

      setCurrentStep(3);
      toast({
        title: 'WhatsApp number saved',
        description: 'Your WhatsApp number has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save WhatsApp number. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBranding = async (data: BrandingForm) => {
    try {
      // TODO: Upload logo to Firebase Storage and get URL
      // For now, just proceed to next step
      setCurrentStep(4);
      toast({
        title: 'Branding saved',
        description: 'Your branding has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save branding. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFirstProduct = async (data: ProductForm) => {
    try {
      // TODO: Create first product if provided
      // For now, just complete onboarding
      navigate('/products');
      toast({
        title: 'Welcome to ShopLink!',
        description: 'Your store setup is complete. Start adding products!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save product. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSkip = () => {
    if (currentStep === 4) {
      navigate('/products');
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

                  <FormField
                    control={storeForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location (City, Country)</FormLabel>
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
                                {category.charAt(0).toUpperCase() + category.slice(1)}
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
                      type="button"
                      variant="outline"
                      onClick={handleSkip}
                      data-testid="button-skip"
                    >
                      Skip for now
                    </Button>
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
              <Form {...whatsappForm}>
                <form onSubmit={whatsappForm.handleSubmit(handleWhatsApp)} className="space-y-6">
                  <FormField
                    control={whatsappForm.control}
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
                      data-testid="button-continue-whatsapp"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : 'Continue'}
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {currentStep === 3 && (
              <Form {...brandingForm}>
                <form onSubmit={brandingForm.handleSubmit(handleBranding)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Store Logo (Optional)</label>
                    <ImageUpload
                      files={logoFiles}
                      onChange={setLogoFiles}
                      maxFiles={1}
                      maxSize={1024 * 1024} // 1MB
                    />
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
                      data-testid="button-skip-branding"
                    >
                      Skip
                    </Button>
                    <Button
                      type="submit"
                      className="sm:flex-1"
                      disabled={loading}
                      data-testid="button-continue-branding"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : 'Continue'}
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {currentStep === 4 && (
              <Form {...productForm}>
                <form onSubmit={productForm.handleSubmit(handleFirstProduct)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Product Images</label>
                    <ImageUpload
                      files={productFiles}
                      onChange={setProductFiles}
                      maxFiles={3}
                      maxSize={1024 * 1024} // 1MB
                    />
                  </div>

                  <FormField
                    control={productForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Premium Handmade Necklace"
                            {...field}
                            data-testid="input-product-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={productForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (CAD)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-8"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-product-price"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={productForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Describe your product..."
                            {...field}
                            data-testid="textarea-product-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      data-testid="button-back-product"
                    >
                      <ChevronLeft className="mr-2 w-4 h-4" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSkip}
                      data-testid="button-skip-product"
                    >
                      Skip & Complete
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
      </div>
    </div>
  );
}

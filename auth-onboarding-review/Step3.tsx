// Step3 Component extracted from OnboardingNew.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const step3Schema = z.object({
  storeName: z.string().min(1, 'Store name is required').max(100),
  storeSlug: z.string()
    .min(3, 'Store URL must be at least 3 characters')
    .max(50, 'Store URL must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Store URL can only contain lowercase letters, numbers, and hyphens'),
  storeDescription: z.string().max(300, 'Description must be less than 300 characters').optional(),
  category: z.string().min(1, 'Please select a category'),
  currency: z.string().min(1, 'Please select a currency')
});

type Step3Data = z.infer<typeof step3Schema>;

interface Step3Props {
  onNext: (data: Step3Data) => void;
  onBack: () => void;
  defaultValues?: Partial<Step3Data>;
}

export default function Step3({ onNext, onBack, defaultValues }: Step3Props) {
  const form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      storeName: defaultValues?.storeName || '',
      storeSlug: defaultValues?.storeSlug || '',
      storeDescription: defaultValues?.storeDescription || '',
      category: defaultValues?.category || '',
      currency: defaultValues?.currency || 'USD'
    }
  });

  const watchStoreName = form.watch('storeName');

  // Auto-generate slug from store name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  };

  // Update slug when store name changes
  React.useEffect(() => {
    if (watchStoreName && !form.getValues('storeSlug')) {
      form.setValue('storeSlug', generateSlug(watchStoreName));
    }
  }, [watchStoreName, form]);

  const onSubmit = (data: Step3Data) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Store Setup</h2>
        <p className="text-gray-600">Let's create your online store!</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Store Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store Name *
          </label>
          <input
            {...form.register('storeName')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Sarah's Handmade Jewelry"
            data-testid="input-store-name"
          />
          {form.formState.errors.storeName && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.storeName.message}</p>
          )}
        </div>

        {/* Store URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store URL *
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              shoplynk.com/store/
            </span>
            <input
              {...form.register('storeSlug')}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="sarahs-jewelry"
              data-testid="input-store-slug"
            />
          </div>
          {form.formState.errors.storeSlug && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.storeSlug.message}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            This will be your public store URL
          </p>
        </div>

        {/* Store Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store Description (Optional)
          </label>
          <textarea
            {...form.register('storeDescription')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell customers what makes your store special..."
            data-testid="textarea-store-description"
          />
          {form.formState.errors.storeDescription && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.storeDescription.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            {...form.register('category')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="select-category"
          >
            <option value="">Select a category</option>
            <option value="fashion">Fashion & Accessories</option>
            <option value="electronics">Electronics</option>
            <option value="home">Home & Garden</option>
            <option value="beauty">Beauty & Personal Care</option>
            <option value="food">Food & Beverages</option>
            <option value="books">Books & Media</option>
            <option value="sports">Sports & Outdoors</option>
            <option value="toys">Toys & Games</option>
            <option value="automotive">Automotive</option>
            <option value="other">Other</option>
          </select>
          {form.formState.errors.category && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.category.message}</p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency *
          </label>
          <select
            {...form.register('currency')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="select-currency"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD ($)</option>
            <option value="AUD">AUD ($)</option>
          </select>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            data-testid="button-back-step3"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-complete-onboarding"
          >
            {form.formState.isSubmitting ? 'Creating Store...' : 'Complete Setup'}
          </button>
        </div>
      </form>
    </div>
  );
}
// Step1 Component extracted from OnboardingNew.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const step1Schema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(100),
  businessDescription: z.string().min(10, 'Please provide at least 10 characters').max(500),
  businessType: z.enum(['product', 'service', 'both']),
  targetAudience: z.string().min(5, 'Please describe your target audience').max(200)
});

type Step1Data = z.infer<typeof step1Schema>;

interface Step1Props {
  onNext: (data: Step1Data) => void;
  defaultValues?: Partial<Step1Data>;
}

export default function Step1({ onNext, defaultValues }: Step1Props) {
  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      businessName: defaultValues?.businessName || '',
      businessDescription: defaultValues?.businessDescription || '',
      businessType: defaultValues?.businessType || 'product',
      targetAudience: defaultValues?.targetAudience || ''
    }
  });

  const onSubmit = (data: Step1Data) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Tell us about your business</h2>
        <p className="text-gray-600">This information helps us customize your store experience.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <input
            {...form.register('businessName')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Sarah's Handmade Jewelry"
            data-testid="input-business-name"
          />
          {form.formState.errors.businessName && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.businessName.message}</p>
          )}
        </div>

        {/* Business Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Description *
          </label>
          <textarea
            {...form.register('businessDescription')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe what you sell and what makes it special..."
            data-testid="textarea-business-description"
          />
          {form.formState.errors.businessDescription && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.businessDescription.message}</p>
          )}
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What do you sell? *
          </label>
          <select
            {...form.register('businessType')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="select-business-type"
          >
            <option value="product">Physical Products</option>
            <option value="service">Services</option>
            <option value="both">Both Products & Services</option>
          </select>
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience *
          </label>
          <input
            {...form.register('targetAudience')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Young professionals who love unique accessories"
            data-testid="input-target-audience"
          />
          {form.formState.errors.targetAudience && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.targetAudience.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="button-next-step1"
        >
          {form.formState.isSubmitting ? 'Saving...' : 'Continue to Contact Info'}
        </button>
      </form>
    </div>
  );
}
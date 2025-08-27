// Step2 Component extracted from OnboardingNew.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';

const step2Schema = z.object({
  contactEmail: z.string().email('Please enter a valid email address'),
  phone: z.string().refine((phone) => {
    if (!phone) return true; // Phone is optional
    try {
      return isValidPhoneNumber(phone);
    } catch {
      return false;
    }
  }, 'Please enter a valid phone number'),
  whatsappNumber: z.string().optional(),
  preferredContactMethod: z.enum(['email', 'phone', 'whatsapp'])
});

type Step2Data = z.infer<typeof step2Schema>;

interface Step2Props {
  onNext: (data: Step2Data) => void;
  onBack: () => void;
  defaultValues?: Partial<Step2Data>;
}

export default function Step2({ onNext, onBack, defaultValues }: Step2Props) {
  const form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      contactEmail: defaultValues?.contactEmail || '',
      phone: defaultValues?.phone || '',
      whatsappNumber: defaultValues?.whatsappNumber || '',
      preferredContactMethod: defaultValues?.preferredContactMethod || 'email'
    }
  });

  const onSubmit = (data: Step2Data) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Contact Information</h2>
        <p className="text-gray-600">How can customers reach you?</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Contact Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email *
          </label>
          <input
            {...form.register('contactEmail')}
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="contact@yourbusiness.com"
            data-testid="input-contact-email"
          />
          {form.formState.errors.contactEmail && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.contactEmail.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number (Optional)
          </label>
          <input
            {...form.register('phone')}
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+1 (555) 123-4567"
            data-testid="input-phone"
          />
          {form.formState.errors.phone && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.phone.message}</p>
          )}
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WhatsApp Number (Optional)
          </label>
          <input
            {...form.register('whatsappNumber')}
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+1 (555) 123-4567"
            data-testid="input-whatsapp"
          />
          <p className="text-sm text-gray-500 mt-1">
            Customers can contact you directly via WhatsApp
          </p>
        </div>

        {/* Preferred Contact Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Contact Method *
          </label>
          <select
            {...form.register('preferredContactMethod')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="select-contact-method"
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            data-testid="button-back-step2"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-next-step2"
          >
            {form.formState.isSubmitting ? 'Saving...' : 'Continue to Store Setup'}
          </button>
        </div>
      </form>
    </div>
  );
}
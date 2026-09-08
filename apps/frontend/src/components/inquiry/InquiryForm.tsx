'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useCreateInquiry } from '../../hooks';
import { useAuthStore } from '../../store/auth.store';
import { getErrorMessage } from '../../lib/api/client';
import { UserRole } from '../../types';

const inquirySchema = z.object({
  budgetMin: z.coerce.number().min(0).optional(),
  budgetMax: z.coerce.number().min(0).optional(),
  stakeInterestPct: z.coerce.number().min(0).max(100).optional(),
  timeline: z.string().max(100).optional(),
  message: z.string().min(20, 'Please provide at least 20 characters').max(2000),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

interface InquiryFormProps {
  listingId: string;
  askingPrice: number;
  onSuccess?: () => void;
}

export function InquiryForm({ listingId, askingPrice, onSuccess }: InquiryFormProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { mutateAsync: createInquiry, isPending } = useCreateInquiry();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { message: '' },
  });

  if (!isAuthenticated || user?.role !== UserRole.INVESTOR) {
    return (
      <div className="bg-gold-light border border-gold/20 rounded-xl p-5 text-sm">
        <div className="font-semibold text-gray-800 mb-1">Interested in this listing?</div>
        <p className="text-gray-500 mb-3">
          Sign in as an investor to submit an inquiry and access financial details.
        </p>
        <a
          href="/auth/login?role=investor"
          className="inline-block bg-gold text-white px-4 py-2 rounded-lg
                     text-sm font-medium hover:bg-gold-dark transition-colors"
        >
          Sign in as Investor
        </a>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-white border border-cream3 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">📨</div>
        <h3 className="font-serif text-lg font-semibold mb-2">Inquiry Submitted</h3>
        <p className="text-gray-500 text-sm">
          The seller will review your inquiry and respond within 48 hours.
          You'll be notified via email and WhatsApp.
        </p>
      </div>
    );
  }

  const onSubmit = async (values: InquiryFormValues) => {
    setErrorMsg(null);
    try {
      await createInquiry({ listingId, ...values });
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  return (
    <div className="bg-white border border-cream3 rounded-xl overflow-hidden">
      <div className="bg-ink p-5">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">
          Asking Price
        </div>
        <div className="font-serif text-3xl font-semibold text-gold">
          AED {askingPrice.toLocaleString()}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">Submit an Inquiry</h3>

        {/* Budget range */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase
                            tracking-wider mb-2">
            Your Budget Range (AED)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                {...register('budgetMin')}
                type="number"
                placeholder="Min"
                className="w-full border border-cream3 rounded-lg px-3 py-2 text-sm
                           outline-none focus:border-teal transition-colors"
              />
            </div>
            <div>
              <input
                {...register('budgetMax')}
                type="number"
                placeholder="Max"
                className="w-full border border-cream3 rounded-lg px-3 py-2 text-sm
                           outline-none focus:border-teal transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Stake interest */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase
                            tracking-wider mb-1.5">
            Desired Stake % (optional)
          </label>
          <input
            {...register('stakeInterestPct')}
            type="number"
            min={1}
            max={100}
            placeholder="e.g. 30"
            className="w-full border border-cream3 rounded-lg px-3 py-2 text-sm
                       outline-none focus:border-teal transition-colors"
          />
        </div>

        {/* Timeline */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase
                            tracking-wider mb-1.5">
            Timeline
          </label>
          <select
            {...register('timeline')}
            className="w-full border border-cream3 rounded-lg px-3 py-2 text-sm
                       outline-none focus:border-teal bg-white text-gray-700"
          >
            <option value="">Select timeline</option>
            <option>Immediately</option>
            <option>Within 1 month</option>
            <option>Within 3 months</option>
            <option>Within 6 months</option>
            <option>Exploring only</option>
          </select>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase
                            tracking-wider mb-1.5">
            Message to Seller *
          </label>
          <textarea
            {...register('message')}
            rows={4}
            placeholder="Introduce yourself and explain your interest in this clinic..."
            className="w-full border border-cream3 rounded-lg px-3 py-2.5 text-sm
                       outline-none focus:border-teal transition-colors resize-none"
          />
          {errors.message && (
            <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
          )}
        </div>

        {errorMsg && (
          <p className="text-red-500 text-xs bg-red-50 border border-red-100
                        rounded-lg p-3">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-gold text-white rounded-xl text-sm font-semibold
                     hover:bg-gold-dark transition-colors disabled:opacity-60"
        >
          {isPending ? 'Submitting...' : '💼 Submit Inquiry'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Your details are shared with the seller after submission
        </p>
      </form>
    </div>
  );
}

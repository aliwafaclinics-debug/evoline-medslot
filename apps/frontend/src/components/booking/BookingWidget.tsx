'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, isSameDay } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateBooking, useLockSlot } from '../../hooks';
import { SlotStatus } from '../../types';
import type { Clinic, Slot } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import { getErrorMessage } from '../../lib/api/client';

const bookingSchema = z.object({
  reason: z.string().max(500).optional(),
  patientNotes: z.string().max(1000).optional(),
  isFirstVisit: z.boolean().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingWidgetProps {
  clinic: Clinic;
  slots: Slot[];
  selectedSlot: Slot | null;
  selectedDate: Date;
  dateOptions: Date[];
  onDateChange: (date: Date) => void;
  onSlotSelect: (slot: Slot | null) => void;
}

export function BookingWidget({
  clinic,
  slots,
  selectedSlot,
  selectedDate,
  dateOptions,
  onDateChange,
  onSlotSelect,
}: BookingWidgetProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<'slot' | 'details' | 'success'>('slot');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { mutateAsync: createBooking, isPending: isBooking } = useCreateBooking();
  const { mutateAsync: lockSlot } = useLockSlot();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
  });

  const availableSlots = slots.filter(
    (s) =>
      s.status === SlotStatus.AVAILABLE &&
      isSameDay(new Date(s.startTime), selectedDate),
  );

  const handleSlotSelect = async (slot: Slot) => {
    onSlotSelect(slot);
    if (!isAuthenticated) return; // Will prompt login on confirm

    try {
      await lockSlot(slot.id);
    } catch {
      // Lock failed — slot may have just been taken
      setErrorMsg('This slot was just taken. Please choose another time.');
      onSlotSelect(null);
    }
  };

  const onSubmit = async (values: BookingFormValues) => {
    if (!selectedSlot) return;

    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/clinics/${clinic.slug}`);
      return;
    }

    setErrorMsg(null);
    try {
      const appointment = await createBooking({
        slotId: selectedSlot.id,
        ...values,
      });
      setStep('success');
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  if (step === 'success') {
    return (
      <div className="bg-white border border-cream3 rounded-2xl p-7 text-center shadow-md">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="font-serif text-xl font-semibold mb-2">Booking Confirmed!</h3>
        <p className="text-gray-500 text-sm mb-4">
          We've sent a confirmation to your WhatsApp & email.
        </p>
        <div className="bg-teal-light rounded-xl p-4 text-left text-sm mb-5">
          <div className="flex justify-between py-1 border-b border-teal/10">
            <span className="text-gray-500">Clinic</span>
            <span className="font-medium">{clinic.name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-teal/10">
            <span className="text-gray-500">Date</span>
            <span className="font-medium">
              {format(new Date(selectedSlot!.startTime), 'EEE, MMM d yyyy')}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Time</span>
            <span className="font-medium">
              {format(new Date(selectedSlot!.startTime), 'h:mm a')}
            </span>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard/bookings')}
          className="w-full py-3 bg-teal text-white rounded-xl text-sm font-medium
                     hover:bg-teal-600 transition-colors"
        >
          View My Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-cream3 rounded-2xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-cream2">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
          Consultation Fee
        </div>
        <div className="font-serif text-3xl font-semibold text-teal">
          AED {selectedSlot?.fee ?? '—'}
          <span className="text-sm font-sans font-normal text-gray-400 ml-1">
            / session
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-1">💳 Pay at clinic</div>
      </div>

      <div className="p-5">
        {step === 'slot' && (
          <>
            {/* Date Picker */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-500 uppercase
                                tracking-wider mb-2.5">
                Select Date
              </label>
              <div className="grid grid-cols-7 gap-1">
                {dateOptions.map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => onDateChange(date)}
                    className={`flex flex-col items-center py-2 px-1 rounded-lg text-center
                                transition-all border text-xs
                                ${isSameDay(date, selectedDate)
                                  ? 'bg-teal border-teal text-white'
                                  : 'border-cream3 hover:border-teal text-gray-600'
                                }`}
                  >
                    <span className="opacity-70">{format(date, 'EEE')[0]}</span>
                    <span className="font-semibold text-sm mt-0.5">{format(date, 'd')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-500 uppercase
                                tracking-wider mb-2.5">
                Available Times · {format(selectedDate, 'EEE MMM d')}
              </label>

              {availableSlots.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm bg-cream2
                                rounded-xl border border-cream3">
                  No slots available on this date
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                  {slots
                    .filter((s) => isSameDay(new Date(s.startTime), selectedDate))
                    .map((slot) => {
                      const isAvailable = slot.status === SlotStatus.AVAILABLE;
                      const isSelected = selectedSlot?.id === slot.id;

                      return (
                        <button
                          key={slot.id}
                          disabled={!isAvailable}
                          onClick={() => handleSlotSelect(slot)}
                          className={`py-2.5 px-2 rounded-lg text-xs font-medium border
                                      transition-all text-center
                                      ${isSelected
                                        ? 'bg-teal border-teal text-white'
                                        : isAvailable
                                        ? 'border-cream3 text-gray-700 hover:border-teal hover:text-teal'
                                        : 'border-cream2 text-gray-300 bg-cream2 cursor-not-allowed'
                                      }`}
                        >
                          {format(new Date(slot.startTime), 'h:mm a')}
                          {!isAvailable && (
                            <span className="block text-[10px] opacity-60 mt-0.5">Booked</span>
                          )}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {errorMsg && (
              <p className="text-red-500 text-xs mb-3 bg-red-50 border border-red-100
                            rounded-lg p-3">
                {errorMsg}
              </p>
            )}

            <button
              disabled={!selectedSlot}
              onClick={() => setStep('details')}
              className="w-full py-3 bg-teal text-white rounded-xl text-sm font-medium
                         hover:bg-teal-600 transition-colors disabled:opacity-40
                         disabled:cursor-not-allowed"
            >
              {selectedSlot ? 'Continue' : 'Select a time slot'}
            </button>
          </>
        )}

        {step === 'details' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <button
              type="button"
              onClick={() => setStep('slot')}
              className="text-xs text-teal hover:underline mb-1"
            >
              ← Change slot
            </button>

            <div className="bg-teal-light rounded-xl p-3 text-sm">
              <div className="font-medium">{clinic.name}</div>
              <div className="text-gray-500 text-xs mt-0.5">
                {format(new Date(selectedSlot!.startTime), 'EEE, MMM d · h:mm a')}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Reason for visit (optional)
              </label>
              <input
                {...register('reason')}
                placeholder="e.g. Routine checkup, tooth pain..."
                className="w-full border border-cream3 rounded-lg px-3 py-2.5 text-sm
                           outline-none focus:border-teal transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Additional notes (optional)
              </label>
              <textarea
                {...register('patientNotes')}
                rows={3}
                placeholder="Any additional information for the clinic..."
                className="w-full border border-cream3 rounded-lg px-3 py-2.5 text-sm
                           outline-none focus:border-teal transition-colors resize-none"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                {...register('isFirstVisit')}
                className="accent-teal w-4 h-4"
              />
              <span className="text-sm text-gray-600">This is my first visit</span>
            </label>

            {errorMsg && (
              <p className="text-red-500 text-xs bg-red-50 border border-red-100
                            rounded-lg p-3">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isBooking}
              className="w-full py-3 bg-teal text-white rounded-xl text-sm font-semibold
                         hover:bg-teal-600 transition-colors disabled:opacity-60"
            >
              {isBooking ? 'Confirming...' : '✓ Confirm Appointment'}
            </button>

            <p className="text-center text-xs text-gray-400">
              Free cancellation up to 24 hours before
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

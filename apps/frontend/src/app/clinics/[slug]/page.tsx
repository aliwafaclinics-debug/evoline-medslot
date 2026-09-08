'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { format, addDays, startOfDay } from 'date-fns';
import { useClinicBySlug, useSlots, useClinicReviews } from '../../../hooks';
import { BookingWidget } from '../../../components/booking/BookingWidget';
import { InquiryForm } from '../../../components/inquiry/InquiryForm';
import { StarRating } from '../../../components/ui/StarRating';
import { Skeleton } from '../../../components/ui/Skeleton';
import { VerifiedBadge } from '../../../components/ui/VerifiedBadge';
import type { Slot } from '../../../types';

export default function ClinicDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'reviews' | 'location'>('overview');

  const { data: clinic, isLoading } = useClinicBySlug(slug);
  const { data: slots = [] } = useSlots(
    clinic?.id ?? '',
    format(selectedDate, 'yyyy-MM-dd'),
  );
  const { data: reviews = [] } = useClinicReviews(clinic?.id ?? '');

  // Generate 7 date options starting tomorrow
  const dateOptions = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfDay(new Date()), i + 1),
  );

  if (isLoading) return <ClinicDetailSkeleton />;
  if (!clinic) return <div className="p-12 text-center text-gray-500">Clinic not found</div>;

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <div className="relative bg-ink h-72 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ink2 to-teal opacity-90" />
        <div className="absolute inset-0 flex items-end">
          <div className="p-8 md:px-12 z-10 w-full">
            <div className="flex flex-wrap gap-2 mb-3">
              {clinic.isAdminVerified && <VerifiedBadge />}
              {clinic.specialties?.slice(0, 2).map((s) => (
                <span key={s} className="badge badge-glass capitalize">{s}</span>
              ))}
            </div>
            <h1 className="text-white font-serif text-4xl md:text-5xl font-semibold leading-tight">
              {clinic.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-white/70 text-sm">
              <span>📍 {clinic.area}, {clinic.emirate?.replace('_', ' ')}</span>
              <span>•</span>
              <StarRating rating={clinic.ratingAvg} size="sm" showValue />
              <span className="text-white/50">({clinic.reviewCount} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT — Main content */}
          <div className="flex-1 min-w-0">
            {/* Quick stats bar */}
            <div className="bg-white border border-cream3 rounded-xl p-5
                            grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <QuickStat label="Languages" value={clinic.languages?.join(', ') || 'N/A'} />
              <QuickStat label="Specialties" value={`${clinic.specialties?.length ?? 0} offered`} />
              <QuickStat label="Total Bookings" value={clinic.bookingCount.toLocaleString()} />
              <QuickStat label="DHA License" value={clinic.dhaLicenseNo || 'N/A'} />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-cream3 mb-6 overflow-x-auto">
              {(['overview', 'doctors', 'reviews', 'location'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-medium capitalize whitespace-nowrap
                              border-b-2 transition-colors -mb-px
                              ${activeTab === tab
                                ? 'border-teal text-teal'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                              }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-xl font-semibold mb-3 font-serif">About the Clinic</h2>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {clinic.description || 'No description provided yet.'}
                </p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-center">
                    <div className="font-serif text-5xl font-semibold text-teal">
                      {Number(clinic.ratingAvg).toFixed(1)}
                    </div>
                    <StarRating rating={clinic.ratingAvg} size="sm" />
                    <div className="text-xs text-gray-400 mt-1">
                      {clinic.reviewCount} reviews
                    </div>
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <p className="text-gray-400 text-sm">No reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white border border-cream3 rounded-xl p-5"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-teal flex items-center
                                            justify-center text-white text-xs font-bold">
                              {review.isAnonymous ? '?' :
                                (review.patient?.firstName?.[0] ?? 'P')}
                            </div>
                            <span className="font-medium text-sm">
                              {review.isAnonymous ? 'Anonymous' : review.patient?.fullName}
                            </span>
                          </div>
                          <StarRating rating={review.ratingOverall} size="sm" />
                        </div>
                        {review.body && (
                          <p className="text-gray-600 text-sm leading-relaxed">{review.body}</p>
                        )}
                        {review.clinicResponse && (
                          <div className="mt-3 pl-4 border-l-2 border-teal">
                            <p className="text-xs text-gray-500 mb-1 font-medium">
                              Clinic Response
                            </p>
                            <p className="text-sm text-gray-600">{review.clinicResponse}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'location' && (
              <div>
                <div className="bg-cream2 border border-cream3 rounded-xl h-64
                                flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🗺</div>
                    <p className="text-sm">{clinic.addressLine1}</p>
                    <p className="text-sm">{clinic.area}, {clinic.emirate?.replace('_',' ')}</p>
                    {clinic.latitude && (
                      <a
                        href={`https://maps.google.com/?q=${clinic.latitude},${clinic.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal text-sm mt-2 inline-block hover:underline"
                      >
                        Open in Google Maps →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Booking card */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="sticky top-4">
              <BookingWidget
                clinic={clinic}
                slots={slots}
                selectedSlot={selectedSlot}
                selectedDate={selectedDate}
                dateOptions={dateOptions}
                onDateChange={(date) => { setSelectedDate(date); setSelectedSlot(null); }}
                onSlotSelect={setSelectedSlot}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm font-semibold text-gray-800 capitalize">{value}</div>
    </div>
  );
}

function ClinicDetailSkeleton() {
  return (
    <div className="min-h-screen bg-cream">
      <Skeleton className="h-72 w-full" />
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex gap-8">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="w-96 h-96 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

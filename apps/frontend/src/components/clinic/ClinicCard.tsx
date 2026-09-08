import Link from 'next/link';
import { MapPin, Star, CheckCircle } from 'lucide-react';
import type { Clinic } from '../../types';
import { cn } from '../../lib/utils';

interface ClinicCardProps {
  clinic: Clinic;
  className?: string;
}

export function ClinicCard({ clinic, className }: ClinicCardProps) {
  return (
    <Link
      href={`/clinics/${clinic.slug}`}
      className={cn(
        `group block bg-white border border-cream3 rounded-xl overflow-hidden
         shadow-sm hover:shadow-md hover:-translate-y-0.5
         transition-all duration-200 cursor-pointer`,
        className,
      )}
    >
      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-teal-light to-cream2
                      flex items-center justify-center overflow-hidden">
        {clinic.coverPhotoUrl ? (
          <img
            src={clinic.coverPhotoUrl}
            alt={clinic.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-5xl opacity-30">🏥</span>
        )}

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {clinic.isAdminVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal/90
                             text-white text-xs font-medium rounded-full backdrop-blur-sm">
              <CheckCircle size={10} /> Verified
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
          {clinic.specialties?.slice(0, 2).map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 bg-white/80 backdrop-blur-sm text-gray-700
                         text-xs rounded-full capitalize"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-serif font-semibold text-lg text-ink leading-snug
                         group-hover:text-teal transition-colors line-clamp-2">
            {clinic.name}
          </h3>
          <AvailabilityDot />
        </div>

        <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
          <MapPin size={11} />
          <span className="capitalize">
            {clinic.area ? `${clinic.area}, ` : ''}{clinic.emirate?.replace('_', ' ')}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <Star size={13} className="fill-gold text-gold" />
          <span className="font-semibold text-sm text-gray-800">
            {Number(clinic.ratingAvg).toFixed(1)}
          </span>
          <span className="text-gray-400 text-xs">
            ({clinic.reviewCount} reviews)
          </span>
        </div>

        {/* Languages */}
        {clinic.languages?.length ? (
          <div className="text-xs text-gray-400 mb-4">
            🌍 {clinic.languages.join(', ')}
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-cream2">
          <div className="text-sm font-semibold text-teal">
            {clinic.subscriptionTier === 'pro' || clinic.subscriptionTier === 'enterprise' ? (
              <span className="text-xs bg-gold/10 text-gold border border-gold/20
                               rounded-full px-2 py-0.5 font-medium">
                Premium
              </span>
            ) : null}
          </div>
          <button
            className="px-4 py-1.5 bg-teal text-white text-xs font-medium rounded-lg
                       hover:bg-teal-600 transition-colors"
            onClick={(e) => { e.preventDefault(); window.location.href = `/clinics/${clinic.slug}`; }}
          >
            Book Now
          </button>
        </div>
      </div>
    </Link>
  );
}

function AvailabilityDot() {
  return (
    <span className="flex items-center gap-1 text-xs text-green-600 flex-shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      Open
    </span>
  );
}

'use client';
import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useClinics } from '../../hooks';
import { ClinicCard } from '../../components/clinic/ClinicCard';
import { SearchFilters } from '../../components/clinic/SearchFilters';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import type { ClinicSearchParams } from '../../types';
import { Emirate } from '../../types';

export default function ClinicsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL search params into filter state
  const [params, setParams] = useState<ClinicSearchParams>({
    q: searchParams.get('q') || undefined,
    emirate: (searchParams.get('emirate') as Emirate) || undefined,
    specialties: searchParams.get('specialties')?.split(',') || undefined,
    minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
    verifiedOnly: searchParams.get('verifiedOnly') === 'true',
    sortBy: (searchParams.get('sortBy') as any) || 'rating',
    page: Number(searchParams.get('page')) || 1,
    limit: 12,
  });

  const { data, isLoading, isFetching } = useClinics(params);

  const updateParams = useCallback((updates: Partial<ClinicSearchParams>) => {
    const newParams = { ...params, ...updates, page: 1 };
    setParams(newParams);

    // Sync to URL for shareability
    const url = new URLSearchParams();
    if (newParams.q) url.set('q', newParams.q);
    if (newParams.emirate) url.set('emirate', newParams.emirate);
    if (newParams.specialties?.length) url.set('specialties', newParams.specialties.join(','));
    if (newParams.minRating) url.set('minRating', String(newParams.minRating));
    if (newParams.verifiedOnly) url.set('verifiedOnly', 'true');
    if (newParams.sortBy) url.set('sortBy', newParams.sortBy);

    router.push(`/clinics?${url.toString()}`, { scroll: false });
  }, [params, router]);

  const clinics = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="min-h-screen bg-cream">
      {/* Page Header */}
      <div className="bg-ink text-white py-10 px-6 md:px-12">
        <h1 className="font-serif text-4xl font-semibold mb-2">
          Find a Clinic
        </h1>
        <p className="text-white/60 text-sm">
          {meta?.total ?? '—'} verified clinics across the UAE
        </p>

        {/* Search Bar */}
        <div className="mt-6 flex gap-3 max-w-2xl">
          <input
            type="text"
            placeholder="Search by clinic name, specialty, or area..."
            defaultValue={params.q}
            onChange={(e) => updateParams({ q: e.target.value || undefined })}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3
                       text-white placeholder:text-white/40 text-sm outline-none
                       focus:border-teal-400 transition-colors"
          />
          <button
            className="bg-teal px-6 py-3 rounded-lg text-white text-sm font-medium
                       hover:bg-teal-600 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Filters */}
        <aside className="hidden md:block w-72 flex-shrink-0 border-r border-cream3
                          bg-white sticky top-0 h-screen overflow-y-auto">
          <SearchFilters params={params} onChange={updateParams} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">
              {isFetching ? (
                <span className="text-teal animate-pulse">Updating...</span>
              ) : (
                <>
                  Showing{' '}
                  <strong className="text-gray-800">
                    {clinics.length}
                  </strong>{' '}
                  of{' '}
                  <strong className="text-gray-800">{meta?.total ?? 0}</strong>{' '}
                  clinics
                </>
              )}
            </p>

            <select
              value={params.sortBy}
              onChange={(e) => updateParams({ sortBy: e.target.value as any })}
              className="text-sm border border-cream3 rounded-lg px-3 py-2 bg-white
                         text-gray-700 outline-none focus:border-teal cursor-pointer"
            >
              <option value="rating">Best Match</option>
              <option value="newest">Newest</option>
              <option value="price">Price ↑</option>
            </select>
          </div>

          {/* Active Filter Chips */}
          {(params.emirate || params.specialties?.length || params.verifiedOnly || params.minRating) && (
            <div className="flex flex-wrap gap-2 mb-5">
              {params.emirate && (
                <FilterChip
                  label={params.emirate.replace('_', ' ')}
                  onRemove={() => updateParams({ emirate: undefined })}
                />
              )}
              {params.specialties?.map((s) => (
                <FilterChip
                  key={s}
                  label={s}
                  onRemove={() =>
                    updateParams({
                      specialties: params.specialties?.filter((x) => x !== s),
                    })
                  }
                />
              ))}
              {params.minRating && (
                <FilterChip
                  label={`${params.minRating}★+`}
                  onRemove={() => updateParams({ minRating: undefined })}
                />
              )}
              {params.verifiedOnly && (
                <FilterChip
                  label="Verified Only"
                  onRemove={() => updateParams({ verifiedOnly: false })}
                />
              )}
              <button
                onClick={() => updateParams({
                  emirate: undefined,
                  specialties: undefined,
                  minRating: undefined,
                  verifiedOnly: false,
                })}
                className="text-xs text-teal font-medium hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Clinic Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : clinics.length === 0 ? (
            <EmptyState onReset={() => setParams({ limit: 12, page: 1 })} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {clinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-10 flex justify-center">
              <Pagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                onPageChange={(page) => setParams((p) => ({ ...p, page }))}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-light
                     border border-teal/20 rounded-full text-xs font-medium text-teal capitalize">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-red-500 transition-colors font-bold"
        aria-label={`Remove ${label} filter`}
      >
        ×
      </button>
    </span>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No clinics found</h3>
      <p className="text-gray-500 text-sm mb-6">
        Try adjusting your filters or search terms
      </p>
      <button
        onClick={onReset}
        className="bg-teal text-white px-5 py-2.5 rounded-lg text-sm font-medium
                   hover:bg-teal-600 transition-colors"
      >
        Reset all filters
      </button>
    </div>
  );
}

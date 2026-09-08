'use client';
import { Emirate } from '../../types';
import type { ClinicSearchParams } from '../../types';

const SPECIALTIES = [
  'dentistry', 'cardiology', 'dermatology', 'ophthalmology',
  'pediatrics', 'general practice', 'orthopedics', 'neurology',
  'psychiatry', 'obs/gynecology', 'physiotherapy', 'oncology',
];

const LANGUAGES = ['Arabic', 'English', 'Urdu', 'Hindi', 'French'];

interface SearchFiltersProps {
  params: ClinicSearchParams;
  onChange: (updates: Partial<ClinicSearchParams>) => void;
}

export function SearchFilters({ params, onChange }: SearchFiltersProps) {
  const toggleSpecialty = (s: string) => {
    const current = params.specialties ?? [];
    const updated = current.includes(s)
      ? current.filter((x) => x !== s)
      : [...current, s];
    onChange({ specialties: updated.length ? updated : undefined });
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-800">Filters</h2>
        <button
          onClick={() =>
            onChange({
              emirate: undefined,
              specialties: undefined,
              minRating: undefined,
              verifiedOnly: false,
            })
          }
          className="text-xs text-teal hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Emirate */}
      <FilterGroup title="Emirate">
        <select
          value={params.emirate ?? ''}
          onChange={(e) =>
            onChange({ emirate: (e.target.value as Emirate) || undefined })
          }
          className="w-full text-sm border border-cream3 rounded-lg px-3 py-2
                     bg-white text-gray-700 outline-none focus:border-teal"
        >
          <option value="">All Emirates</option>
          {Object.values(Emirate).map((e) => (
            <option key={e} value={e} className="capitalize">
              {e.replace('_', ' ')}
            </option>
          ))}
        </select>
      </FilterGroup>

      {/* Specialties */}
      <FilterGroup title="Specialty">
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {SPECIALTIES.map((s) => (
            <label
              key={s}
              className="flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer
                         hover:bg-cream2 transition-colors"
            >
              <input
                type="checkbox"
                checked={params.specialties?.includes(s) ?? false}
                onChange={() => toggleSpecialty(s)}
                className="accent-teal w-3.5 h-3.5"
              />
              <span className="text-sm text-gray-600 capitalize">{s}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Min Rating */}
      <FilterGroup title="Minimum Rating">
        <div className="flex gap-2">
          {[3, 4, 4.5, 5].map((r) => (
            <button
              key={r}
              onClick={() =>
                onChange({ minRating: params.minRating === r ? undefined : r })
              }
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors
                          ${params.minRating === r
                            ? 'bg-teal border-teal text-white'
                            : 'border-cream3 text-gray-600 hover:border-teal hover:text-teal'
                          }`}
            >
              {r}★
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Language */}
      <FilterGroup title="Language">
        <div className="space-y-1">
          {LANGUAGES.map((l) => (
            <label
              key={l}
              className="flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer
                         hover:bg-cream2 transition-colors"
            >
              <input
                type="checkbox"
                checked={params.language === l.toLowerCase()}
                onChange={(e) =>
                  onChange({ language: e.target.checked ? l.toLowerCase() : undefined })
                }
                className="accent-teal w-3.5 h-3.5"
              />
              <span className="text-sm text-gray-600">{l}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Verified only toggle */}
      <FilterGroup title="Verification">
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
            Verified clinics only
          </span>
          <button
            role="switch"
            aria-checked={params.verifiedOnly}
            onClick={() => onChange({ verifiedOnly: !params.verifiedOnly })}
            className={`relative inline-flex h-5 w-10 items-center rounded-full
                        transition-colors ${params.verifiedOnly ? 'bg-teal' : 'bg-gray-200'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white
                          shadow transition-transform
                          ${params.verifiedOnly ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </label>
      </FilterGroup>

      <button
        onClick={() => {}} // Already filters on change
        className="w-full mt-4 py-2.5 bg-teal text-white text-sm font-medium
                   rounded-lg hover:bg-teal-600 transition-colors"
      >
        Apply Filters
      </button>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
        {title}
      </h3>
      {children}
    </div>
  );
}

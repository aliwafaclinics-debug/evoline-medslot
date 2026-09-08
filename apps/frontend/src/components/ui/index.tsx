// StarRating.tsx
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function StarRating({ rating, size = 'md', showValue, className }: StarRatingProps) {
  const sizes = { sm: 11, md: 14, lg: 18 };
  const px = sizes[size];

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={px}
          className={
            star <= Math.round(rating)
              ? 'fill-gold text-gold'
              : 'fill-gray-200 text-gray-200'
          }
        />
      ))}
      {showValue && (
        <span className={cn('font-semibold text-gray-800 ml-1',
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
        )}>
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
}

// Skeleton.tsx
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-cream2 via-cream3 to-cream2 bg-[length:200%_100%]',
        className,
      )}
      style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}
    />
  );
}

// Pagination.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = getPaginationRange(currentPage, totalPages);

  return (
    <div className="flex items-center gap-1">
      <PageButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </PageButton>

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">
            ...
          </span>
        ) : (
          <PageButton
            key={page}
            onClick={() => onPageChange(page as number)}
            active={page === currentPage}
          >
            {page}
          </PageButton>
        ),
      )}

      <PageButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </PageButton>
    </div>
  );
}

function PageButton({
  children,
  onClick,
  active,
  disabled,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all',
        active
          ? 'bg-teal text-white'
          : 'border border-cream3 text-gray-600 hover:border-teal hover:text-teal',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );
}

function getPaginationRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];

  return [1, '...', current - 1, current, current + 1, '...', total];
}

// VerifiedBadge.tsx
import { ShieldCheck } from 'lucide-react';

export function VerifiedBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 bg-teal/10 border border-teal/20 text-teal rounded-full font-medium',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
      )}
    >
      <ShieldCheck size={size === 'sm' ? 10 : 13} />
      DHA Verified
    </span>
  );
}

// Badge.tsx
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'teal' | 'gold' | 'green' | 'red' | 'gray';
  className?: string;
}

export function Badge({ children, variant = 'teal', className }: BadgeProps) {
  const variants = {
    teal: 'bg-teal-light text-teal border-teal/20',
    gold: 'bg-gold-light text-gold border-gold/20',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

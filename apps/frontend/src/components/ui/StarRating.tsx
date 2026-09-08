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

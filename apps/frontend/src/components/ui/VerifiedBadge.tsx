import { ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

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

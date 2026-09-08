import { cn } from '../../lib/utils';

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

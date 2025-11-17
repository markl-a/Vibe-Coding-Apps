import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  className?: string;
}

export function Rating({
  rating,
  maxRating = 5,
  size = 'md',
  showNumber = true,
  className,
}: RatingProps) {
  const sizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        {[...Array(maxRating)].map((_, index) => {
          const filled = index < Math.floor(rating);
          const partial = index === Math.floor(rating) && rating % 1 !== 0;

          return (
            <Star
              key={index}
              className={cn(
                sizes[size],
                filled
                  ? 'fill-yellow-400 text-yellow-400'
                  : partial
                  ? 'fill-yellow-400/50 text-yellow-400'
                  : 'fill-gray-200 text-gray-200'
              )}
            />
          );
        })}
      </div>
      {showNumber && (
        <span className={cn('font-medium text-gray-700', textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

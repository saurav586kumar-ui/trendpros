import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0 to 5, fractional supported e.g. 3.7, 4.2
  reviewCount?: number;
  showCount?: boolean;
  showBadge?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  reviewCount,
  showCount = true,
  showBadge = false,
  size = 'sm',
  interactive = false,
  onRatingChange,
  className = '',
}) => {
  const normalizedRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const hasRating = normalizedRating > 0 || (reviewCount !== undefined && reviewCount > 0);

  const sizeClasses = {
    xs: { star: 'w-3 h-3', text: 'text-[11px]', badge: 'text-[10px] px-1.5 py-0.5' },
    sm: { star: 'w-3.5 h-3.5', text: 'text-xs', badge: 'text-[11px] px-1.5 py-0.5' },
    md: { star: 'w-4 h-4', text: 'text-sm', badge: 'text-xs px-2 py-0.5' },
    lg: { star: 'w-5 h-5', text: 'text-base', badge: 'text-sm px-2.5 py-1' },
  }[size];

  const renderStars = () => {
    return (
      <div className="flex items-center gap-0.5" aria-label={`Rating: ${normalizedRating.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((starIndex) => {
          // Calculate fill percentage for this individual star
          let fillPct = 0;
          if (normalizedRating >= starIndex) {
            fillPct = 100;
          } else if (normalizedRating > starIndex - 1) {
            fillPct = Math.round((normalizedRating - (starIndex - 1)) * 100);
          }

          if (interactive) {
            return (
              <button
                type="button"
                key={starIndex}
                onClick={() => onRatingChange?.(starIndex)}
                className="cursor-pointer transition-transform hover:scale-110 p-0.5 focus:outline-none"
                title={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
              >
                <Star
                  className={`${sizeClasses.star} ${
                    starIndex <= Math.round(normalizedRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-slate-100 text-slate-300 hover:text-amber-300'
                  }`}
                />
              </button>
            );
          }

          return (
            <div key={starIndex} className="relative inline-flex items-center justify-center">
              {/* Background empty star */}
              <Star className={`${sizeClasses.star} text-slate-200 fill-slate-100`} />

              {/* Foreground accurately filled star with clip width */}
              {fillPct > 0 && (
                <div
                  className="absolute top-0 left-0 overflow-hidden h-full pointer-events-none"
                  style={{ width: `${fillPct}%` }}
                >
                  <Star className={`${sizeClasses.star} text-amber-400 fill-amber-400 shrink-0`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Optional Compact Badge like Flipkart/Amazon */}
      {showBadge && (
        <div
          className={`flex items-center gap-1 rounded font-extrabold text-white shadow-xs ${sizeClasses.badge} ${
            hasRating ? 'bg-emerald-600' : 'bg-slate-400'
          }`}
        >
          <span>{hasRating ? normalizedRating.toFixed(1) : '—'}</span>
          <Star className="w-2.5 h-2.5 fill-white" />
        </div>
      )}

      {/* Proportional Stars */}
      {renderStars()}

      {/* Average numerical display */}
      {!showBadge && hasRating && (
        <span className={`font-bold text-slate-800 ${sizeClasses.text}`}>
          {normalizedRating.toFixed(1)}
        </span>
      )}

      {/* Review Count or Empty state */}
      {showCount && (
        <span className={`text-slate-400 font-normal ${sizeClasses.text}`}>
          {reviewCount !== undefined && reviewCount > 0 ? (
            `(${reviewCount.toLocaleString()})`
          ) : hasRating ? (
            `(${normalizedRating.toFixed(1)})`
          ) : (
            <span className="text-slate-400 text-[11px]">(No ratings yet)</span>
          )}
        </span>
      )}
    </div>
  );
};

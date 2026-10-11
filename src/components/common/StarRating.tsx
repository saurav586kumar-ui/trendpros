import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  ratingCount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showCount?: boolean;
  showScore?: boolean;
  interactive?: boolean;
  onRatingChange?: (newRating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  ratingCount,
  size = 'sm',
  showCount = true,
  showScore = true,
  interactive = false,
  onRatingChange,
  className = '',
}) => {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));

  const sizeConfig = {
    xs: { iconSize: 'w-3 h-3', textSize: 'text-[11px]' },
    sm: { iconSize: 'w-3.5 h-3.5', textSize: 'text-xs' },
    md: { iconSize: 'w-4 h-4', textSize: 'text-sm' },
    lg: { iconSize: 'w-6 h-6', textSize: 'text-base' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          // Calculate percentage fill for this star (0 to 100)
          let fillPercent = 0;
          if (safeRating >= starIndex) {
            fillPercent = 100;
          } else if (safeRating > starIndex - 1) {
            fillPercent = Math.round((safeRating - (starIndex - 1)) * 100);
          }

          return (
            <div
              key={starIndex}
              className={`relative select-none ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
              onClick={() => interactive && onRatingChange?.(starIndex)}
              title={`${safeRating.toFixed(1)} out of 5 stars`}
            >
              {/* Background empty star */}
              <Star
                className={`${sizeConfig.iconSize} text-slate-200 fill-slate-100`}
                strokeWidth={1.5}
              />
              {/* Foreground filled star with exact width clipping */}
              {fillPercent > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${fillPercent}%` }}
                >
                  <Star
                    className={`${sizeConfig.iconSize} text-amber-400 fill-amber-400 drop-shadow-xs`}
                    strokeWidth={1.5}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showScore && (
        <span className={`font-bold text-slate-800 ${sizeConfig.textSize}`}>
          {safeRating > 0 ? safeRating.toFixed(1) : '0.0'}
        </span>
      )}

      {showCount && typeof ratingCount === 'number' && (
        <span className={`text-slate-600 font-medium ${sizeConfig.textSize}`}>
          {ratingCount > 0 ? `(${ratingCount.toLocaleString()})` : '(No reviews yet)'}
        </span>
      )}
    </div>
  );
};

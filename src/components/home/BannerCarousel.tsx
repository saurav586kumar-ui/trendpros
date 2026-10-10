import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Banner } from '../../types';

interface BannerCarouselProps {
  banners: Banner[];
  onNavigate: (route: string, params?: Record<string, any>) => void;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners, onNavigate }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeBanners = banners.filter((b) => b.isActive);

  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % activeBanners.length);
    }, 2500);

    return () => clearInterval(timer);
  }, [activeBanners.length, isPaused]);

  if (activeBanners.length === 0) return null;

  const currentBanner = activeBanners[currentIdx];

  const handleBannerClick = () => {
    if (currentBanner.link) {
      if (currentBanner.link.startsWith('/products')) {
        const queryParams: Record<string, any> = {};
        if (currentBanner.link.includes('category=')) {
          const cat = currentBanner.link.split('category=')[1];
          queryParams.category = cat;
        }
        onNavigate('products', queryParams);
      } else if (currentBanner.link.startsWith('http')) {
        window.location.href = currentBanner.link;
      } else {
        onNavigate('products');
      }
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4"
    >
      <div
        onClick={handleBannerClick}
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg bg-slate-100 aspect-[21/9] sm:aspect-[24/9] md:aspect-[3/1] max-h-[380px] w-full flex items-center justify-center cursor-pointer group"
        title="Click to visit offer"
      >
        {/* ONLY THE BANNER IMAGE - NO TEXT OVERLAY AS REQUESTED */}
        <img
          src={currentBanner.imageUrl}
          alt={currentBanner.title || 'Promotional Banner'}
          className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-500 ease-out"
        />

        {/* Previous / Next Controls */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIdx((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/70 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous banner"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIdx((prev) => (prev + 1) % activeBanners.length);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/70 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Pagination Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1.5">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIdx(idx);
                  }}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                    idx === currentIdx
                      ? 'w-6 sm:w-8 bg-indigo-600 shadow-xs'
                      : 'w-2 bg-white/70 hover:bg-white'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

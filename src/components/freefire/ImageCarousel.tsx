'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const NavButton = ({ direction, onClick }: { direction: 'prev' | 'next', onClick: () => void }) => {
  const isPrev = direction === 'prev';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 z-10 hidden md:block',
        isPrev ? 'left-4' : 'right-4'
      )}
    >
      {isPrev ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
    </button>
  );
};

export function ImageCarousel() {
  const banners = useMemo(() => [
    { src: 'https://contentgarena-a.akamaihd.net/GOP/newshop_banners/100067br-JAN22-pc.png?v=1750094508', alt: 'Banner 1' },
    { src: 'https://contentgarena-a.akamaihd.net/GOP/newshop_banners/26B06340B596B357.png?v=1729016596', alt: 'Banner 2' },
    { src: 'https://contentgarena-a.akamaihd.net/GOP/newshop_banners/47BED91C7ABCF1EA.png?v=1750167188', alt: 'Banner 3' },
  ], []);

  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loopedBanners = useMemo(() => {
    if (banners.length === 0) return [];
    const first = banners[0];
    const last = banners[banners.length - 1];
    return [last, ...banners, first];
  }, [banners]);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    setCurrentIndex(prev => prev + 1);
  }, [isTransitioning]);

  const handlePrev = () => {
    if (isTransitioning) return;
    setCurrentIndex(prev => prev - 1);
  };

  const handleDotClick = (index: number) => {
    if (isTransitioning) return;
    setCurrentIndex(index + 1);
  };

  const handleTransitionEnd = useCallback(() => {
    if (currentIndex <= 0) {
      setIsTransitioning(true);
      setCurrentIndex(banners.length);
    } else if (currentIndex >= banners.length + 1) {
      setIsTransitioning(true);
      setCurrentIndex(1);
    }
  }, [currentIndex, banners.length]);

  // Auto-play
  useEffect(() => {
    resetTimeout();
    if (!isTransitioning) {
      timeoutRef.current = setTimeout(handleNext, 3000);
    }
    return () => {
      resetTimeout();
    };
  }, [currentIndex, isTransitioning, handleNext, resetTimeout]);

  // Re-enable transitions after the jump
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 50);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  return (
    <div className="bg-[#151515]">
      <div className="mx-auto w-full max-w-[900px] py-2.5 lg:py-5">
        <div className="relative overflow-hidden">
          <div
            className="flex"
            onTransitionEnd={handleTransitionEnd}
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: isTransitioning ? 'none' : 'transform 500ms ease-in-out',
            }}
          >
            {loopedBanners.map((banner, index) => (
              <div key={index} className="relative w-full flex-shrink-0 pt-[37.77%]">
                <Image
                  className="absolute inset-0 h-full w-full object-cover md:rounded-xl"
                  src={banner.src}
                  alt={banner.alt}
                  fill
                  priority={index > 0 && index <= banners.length}
                  data-ai-hint="game banner"
                />
              </div>
            ))}
          </div>

          <NavButton direction="prev" onClick={() => { resetTimeout(); handlePrev(); }} />
          <NavButton direction="next" onClick={() => { resetTimeout(); handleNext(); }} />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={cn(
                  "h-2 w-2 cursor-pointer rounded-full transition-colors",
                  (currentIndex === index + 1 || (currentIndex === 0 && index === banners.length - 1) || (currentIndex === banners.length + 1 && index === 0)) ? 'bg-destructive' : 'bg-white/50'
                )}
                aria-label={`Go to slide ${index + 1}`}
              ></button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

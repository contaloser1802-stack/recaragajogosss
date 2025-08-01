'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { banners } from '@/lib/data';

export function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(1); // Start at the first real slide
  const [isTransitioning, setIsTransitioning] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loopedBanners = [banners[banners.length - 1], ...banners, banners[0]];

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (!isTransitioning) return;
    setCurrentIndex(prevIndex => prevIndex + 1);
  }, [isTransitioning]);

  const handlePrev = () => {
    if (!isTransitioning) return;
    setCurrentIndex(prevIndex => prevIndex - 1);
  };
  
  const handleDotClick = (index: number) => {
    setCurrentIndex(index + 1);
  };

  useEffect(() => {
    resetTimeout();
    timeoutRef.current = setTimeout(handleNext, 3000);

    return () => {
      resetTimeout();
    };
  }, [currentIndex, handleNext, resetTimeout]);

  useEffect(() => {
    if (currentIndex === 0) { // After transitioning to the last clone
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(banners.length);
      }, 500);
      return () => clearTimeout(timer);
    }
    if (currentIndex === banners.length + 1) { // After transitioning to the first clone
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(1);
      }, 500);
      return () => clearTimeout(timer);
    }
    if (!isTransitioning) {
        // A very short timeout to re-enable transition after the jump
        const timer = setTimeout(() => setIsTransitioning(true), 50);
        return () => clearTimeout(timer);
    }
  }, [currentIndex, banners.length, isTransitioning]);

  return (
    <div className="bg-[#151515]">
      <div className="relative mx-auto w-full max-w-[1366px] overflow-hidden md:py-2.5 lg:py-5 group">
        <div className="relative w-full pt-[43.478%] md:pt-[19.106%]">
          <div
            className="absolute inset-0 flex"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: isTransitioning ? 'transform 0.5s ease-in-out' : 'none',
            }}
          >
            {loopedBanners.map((banner, index) => (
              <Link
                key={index}
                href={banner.href || '#'}
                className="block h-full w-full shrink-0"
              >
                <Image
                  className="pointer-events-none h-full w-full object-contain md:rounded-xl"
                  src={banner.src}
                  alt={banner.alt}
                  fill
                  sizes="100vw"
                  priority={index >= 1 && index <= 3}
                  data-ai-hint="game banner"
                />
              </Link>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={handlePrev}
          className="absolute top-1/2 left-4 -translate-y-1/2 z-10 hidden md:block rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 opacity-0 group-hover:opacity-100"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={handleNext}
          className="absolute top-1/2 right-4 -translate-y-1/2 z-10 hidden md:block rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 opacity-0 group-hover:opacity-100"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={cn(
                'h-2 w-2 cursor-pointer rounded-full transition-colors',
                (currentIndex === index + 1 || (currentIndex === banners.length + 1 && index === 0) || (currentIndex === 0 && index === banners.length - 1))
                  ? 'bg-destructive'
                  : 'bg-white/50'
              )}
            ></button>
          ))}
        </div>
      </div>
    </div>
  );
}

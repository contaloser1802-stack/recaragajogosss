'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { banners } from '@/lib/data';

const NavButton = ({ direction, onClick }: { direction: 'prev' | 'next'; onClick: () => void }) => {
  const isPrev = direction === 'prev';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'pointer-events-auto hidden rounded-full bg-black/70 p-4 text-sm text-white transition-colors hover:bg-black md:group-hover:block',
        isPrev ? 'absolute inset-y-0 start-0 my-auto justify-end' : 'absolute inset-y-0 end-0 my-auto justify-start'
      )}
    >
      {isPrev ? <ChevronLeft className="-scale-x-100 rtl:scale-x-100" /> : <ChevronRight className="scale-x-100 rtl:-scale-x-100" />}
    </button>
  );
};

export function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loopedBanners = useMemo(() => {
    if (banners.length === 0) return [];
    const first = banners[0];
    const last = banners[banners.length - 1];
    return [last, ...banners, first];
  }, []);

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
    setIsTransitioning(false);
    if (currentIndex <= 0) {
      setCurrentIndex(banners.length);
      setIsTransitioning(true);
    } else if (currentIndex >= banners.length + 1) {
      setCurrentIndex(1);
      setIsTransitioning(true);
    }
  }, [currentIndex, banners.length]);

  useEffect(() => {
    resetTimeout();
    timeoutRef.current = setTimeout(handleNext, 3000);
    return () => resetTimeout();
  }, [currentIndex, handleNext, resetTimeout]);
  
  useEffect(() => {
      const slider = document.querySelector('.scrollbar-none');
      if (slider) {
          slider.addEventListener('transitionend', handleTransitionEnd);
      }
      return () => {
          if (slider) {
              slider.removeEventListener('transitionend', handleTransitionEnd);
          }
      };
  }, [handleTransitionEnd]);

  useEffect(() => {
    if (isTransitioning) {
        const timer = setTimeout(() => {
            setIsTransitioning(false);
        }, 50); // a small delay to allow the jump to happen without transition
        return () => clearTimeout(timer);
    }
}, [isTransitioning]);


  return (
    <div className="bg-[#151515]">
      <div className="group mx-auto w-full max-w-[1366px] md:py-2.5 lg:py-5">
        <div className="relative justify-center pt-[43.478%] md:pt-[19.106%]">
            <div 
                className="scrollbar-none absolute inset-0 flex overflow-hidden"
                style={{ 
                    transform: `translateX(-${currentIndex * 100 / (loopedBanners.length)}%)`,
                    transition: isTransitioning ? 'none' : 'transform 500ms ease-in-out',
                    width: `${loopedBanners.length * 100}%`
                }}
                onTransitionEnd={handleTransitionEnd}
            >
              {loopedBanners.map((banner, index) => (
                <Link
                  key={index}
                  className="block h-full w-full shrink-0 snap-center md:w-[calc(50.577%_/_var(--banner-count))] md:rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
                  style={{ '--banner-count': loopedBanners.length } as React.CSSProperties}
                  href={banner.href || '#'}
                  target="_blank"
                  data-index={index}
                >
                  <Image
                    className={cn(
                        "pointer-events-none h-full w-full object-contain transition-all", 
                        "md:rounded-xl",
                        index === currentIndex ? "md:scale-[1] md:opacity-100" : "md:scale-[0.94211] md:opacity-50"
                    )}
                    src={banner.src}
                    alt={banner.alt}
                    width={700}
                    height={300}
                    priority={index === 1}
                  />
                </Link>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 hidden w-[21.783%] items-center from-[#151515] md:flex start-0 justify-end bg-gradient-to-r rtl:bg-gradient-to-l">
                <NavButton direction="prev" onClick={handlePrev} />
            </div>
             <div className="pointer-events-none absolute inset-y-0 hidden w-[21.783%] items-center from-[#151515] md:flex end-0 justify-start bg-gradient-to-l rtl:bg-gradient-to-r">
                <NavButton direction="next" onClick={handleNext} />
            </div>
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3">
              {banners.map((_, index) => {
                  const actualIndex = (currentIndex -1 + banners.length) % banners.length;
                  return (
                    <div
                        key={index}
                        role="button"
                        aria-label={`Go to slide ${index + 1}`}
                        aria-checked={actualIndex === index}
                        onClick={() => handleDotClick(index)}
                        className="h-1.5 w-1.5 cursor-pointer rounded-full bg-white/80 aria-checked:bg-destructive md:h-2.5 md:w-2.5 md:bg-white/40 md:aria-checked:bg-[linear-gradient(209deg,#DA1C1C_-7.14%,#8C1515_102.95%)]"
                    ></div>
                  )
              })}
            </div>
        </div>
      </div>
    </div>
  );
}

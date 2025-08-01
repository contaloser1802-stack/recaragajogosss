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
        'pointer-events-auto rounded-full bg-black/70 p-4 text-sm text-white transition-colors hover:bg-black md:group-hover:block hidden',
        isPrev ? 'absolute inset-y-0 start-0 my-auto justify-end' : 'absolute inset-y-0 end-0 my-auto justify-start'
      )}
      aria-label={isPrev ? 'Go to previous slide' : 'Go to next slide'}
    >
      {isPrev ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
    </button>
  );
};

export function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create a looped array of banners: [last, ...all, first]
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
    if (!isTransitioning) {
        setCurrentIndex(prev => prev + 1);
        setIsTransitioning(true);
    }
  }, [isTransitioning]);

  const handlePrev = () => {
     if (!isTransitioning) {
        setCurrentIndex(prev => prev - 1);
        setIsTransitioning(true);
    }
  };
  
  const handleDotClick = (index: number) => {
    if (!isTransitioning) {
      setCurrentIndex(index + 1);
      setIsTransitioning(true);
    }
  };

  // Set up the auto-play timer
  useEffect(() => {
    resetTimeout();
    timeoutRef.current = setTimeout(handleNext, 3000);
    return () => resetTimeout();
  }, [currentIndex, handleNext, resetTimeout]);

  // Handle the "loop" effect after a transition ends
  const handleTransitionEnd = () => {
      if (currentIndex <= 0) {
          setIsTransitioning(false);
          setCurrentIndex(banners.length);
      } else if (currentIndex >= banners.length + 1) {
          setIsTransitioning(false);
          setCurrentIndex(1);
      }
  };

  return (
    <div className="bg-[#151515]">
      <div className="group mx-auto w-full max-w-[1366px] md:py-2.5 lg:py-5">
        <div className="relative overflow-hidden">
            <div 
                className="flex"
                style={{ 
                    transform: `translateX(-${currentIndex * 100}%)`,
                    transition: isTransitioning ? 'transform 500ms ease-in-out' : 'none',
                    width: `${loopedBanners.length * 100}%`
                }}
                onTransitionEnd={handleTransitionEnd}
            >
              {loopedBanners.map((banner, index) => (
                <div key={index} className="w-full shrink-0 relative pt-[43.478%] md:pt-[19.106%]">
                    <Link
                        href={banner.href || '#'}
                        target="_blank"
                        className={cn("absolute inset-0 flex justify-center items-center transition-transform duration-500",
                         (index === currentIndex) ? "scale-100" : "scale-[0.94211] opacity-50"
                        )}
                        style={{
                           width: '50.577%', // Central image width on desktop
                           left: '24.7115%', // Center alignment
                        }}
                    >
                        <Image
                            className="pointer-events-none object-contain md:rounded-xl"
                            src={banner.src}
                            alt={banner.alt}
                            fill
                            priority={index === 1} // Prioritize the first real banner
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </Link>
                </div>
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
                    <button
                        key={index}
                        onClick={() => handleDotClick(index)}
                        aria-label={`Go to slide ${index + 1}`}
                        className={cn("h-1.5 w-1.5 cursor-pointer rounded-full md:h-2.5 md:w-2.5 transition-colors",
                          actualIndex === index ? 'bg-destructive md:bg-[linear-gradient(209deg,#DA1C1C_-7.14%,#8C1515_102.95%)]' : 'bg-white/80 md:bg-white/40'
                        )}
                    ></button>
                  )
              })}
            </div>
        </div>
      </div>
    </div>
  );
}
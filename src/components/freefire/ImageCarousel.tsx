'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { banners } from '@/lib/data';

export function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToSlide = useCallback((index: number) => {
    const container = scrollContainerRef.current;
    if (container) {
      const slide = container.children[index] as HTMLElement;
      if (slide) {
        slide.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
        setCurrentIndex(index);
      }
    }
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex(prevIndex => {
      const nextIndex = (prevIndex + 1) % banners.length;
      scrollToSlide(nextIndex);
      return nextIndex;
    });
  }, [banners.length, scrollToSlide]);

  const handlePrev = () => {
    setCurrentIndex(prevIndex => {
      const nextIndex = (prevIndex - 1 + banners.length) % banners.length;
      scrollToSlide(nextIndex);
      return nextIndex;
    });
  };

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      handleNext();
    }, 3000);
  }, [handleNext]);

  const stopAutoPlay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay]);

  // Handle scroll snap to update active dot
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollEndTimer: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(() => {
        const scrollLeft = container.scrollLeft;
        const slideWidth = container.clientWidth;
        const newIndex = Math.round(scrollLeft / slideWidth);
        if (newIndex !== currentIndex) {
          setCurrentIndex(newIndex % banners.length);
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentIndex]);
  
  return (
    <div className="bg-[#151515]">
        <div className="group mx-auto w-full max-w-[1366px] md:py-2.5 lg:py-5">
            <div className="relative">
                {/* This div creates the aspect ratio box */}
                <div className="relative w-full pt-[43.478%] md:pt-[19.106%]">
                    {/* This div is the scroll container */}
                    <div 
                        ref={scrollContainerRef}
                        onMouseEnter={stopAutoPlay}
                        onMouseLeave={startAutoPlay}
                        className="scrollbar-none absolute inset-0 flex overflow-x-auto snap-x snap-mandatory"
                    >
                        {banners.map((banner, index) => (
                            <Link
                                key={index}
                                href={banner.href || '#'}
                                target="_blank"
                                className="block h-full w-full shrink-0 snap-center md:w-[50.577%] md:px-[0.3%]"
                            >
                                <Image
                                    className={cn(
                                        "pointer-events-none h-full w-full object-contain transition-all duration-300 md:rounded-xl",
                                        index === currentIndex ? "md:scale-100 md:opacity-100" : "md:scale-[94.211%] md:opacity-50"
                                    )}
                                    src={banner.src}
                                    alt={banner.alt}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 51vw"
                                    priority={index === 0}
                                />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="pointer-events-none absolute inset-y-0 hidden w-[24.7%] items-center from-[#151515] md:flex start-0 justify-end bg-gradient-to-r rtl:bg-gradient-to-l">
                  <button onClick={handlePrev} type="button" className="pointer-events-auto hidden rounded-full bg-black/70 p-4 text-sm text-white transition-colors hover:bg-black md:group-hover:block" aria-label="Previous slide">
                      <ChevronLeft className="h-6 w-6"/>
                  </button>
                </div>
                <div className="pointer-events-none absolute inset-y-0 hidden w-[24.7%] items-center from-[#151515] md:flex end-0 justify-start bg-gradient-to-l rtl:bg-gradient-to-r">
                    <button onClick={handleNext} type="button" className="pointer-events-auto hidden rounded-full bg-black/70 p-4 text-sm text-white transition-colors hover:bg-black md:group-hover:block" aria-label="Next slide">
                        <ChevronRight className="h-6 w-6"/>
                    </button>
                </div>

                {/* Dots */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollToSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                            className={cn(
                                "h-1.5 w-1.5 cursor-pointer rounded-full transition-colors md:h-2.5 md:w-2.5",
                                currentIndex === index
                                    ? "bg-destructive md:bg-[linear-gradient(209deg,#DA1C1C_-7.14%,#8C1515_102.95%)]"
                                    : "bg-white/80 md:bg-white/40"
                            )}
                        ></button>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}

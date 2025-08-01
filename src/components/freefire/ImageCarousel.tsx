'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { banners } from '@/lib/data';

export function ImageCarousel() {
    const [currentIndex, setCurrentIndex] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const loopedBanners = [banners[banners.length - 1], ...banners, banners[0]];

    const resetTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    const handleNext = useCallback(() => {
        setIsTransitioning(true);
        setCurrentIndex(prevIndex => prevIndex + 1);
    }, []);
    
    const handlePrev = () => {
        setIsTransitioning(true);
        setCurrentIndex(prevIndex => prevIndex - 1);
    };

    const handleDotClick = (index: number) => {
        setIsTransitioning(true);
        setCurrentIndex(index + 1); 
    };

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(handleNext, 3000);
        return () => resetTimeout();
    }, [currentIndex, handleNext, resetTimeout]);

    useEffect(() => {
        if (!isTransitioning) {
            if (currentIndex === 0) {
                setCurrentIndex(banners.length);
            } else if (currentIndex === banners.length + 1) {
                setCurrentIndex(1);
            }
        }
    }, [currentIndex, isTransitioning, banners.length]);

    const handleTransitionEnd = () => {
        setIsTransitioning(false);
    };

    const getRealIndex = (index: number) => {
        if (index === 0) return banners.length - 1;
        if (index === banners.length + 1) return 0;
        return index - 1;
    };
    
    return (
        <div className="bg-[#151515]">
            <div className="group mx-auto w-full max-w-[1366px] md:py-2.5 lg:py-5">
                <div className="relative overflow-hidden">
                    <div className="relative h-0 pt-[43.478%] md:pt-[19.106%]">
                        <div
                            className="absolute inset-0 flex"
                            style={{
                                transform: `translateX(calc(-${currentIndex * 100}%))`,
                                transition: isTransitioning ? 'transform 500ms ease-in-out' : 'none',
                            }}
                            onTransitionEnd={handleTransitionEnd}
                        >
                            {loopedBanners.map((banner, index) => {
                                const realIndex = getRealIndex(index);
                                const isActive = getRealIndex(currentIndex) === realIndex;
                                return (
                                    <div key={index} className="w-full flex-shrink-0">
                                        <Link
                                            href={banner.href || '#'}
                                            className="block h-full w-full relative"
                                            target="_blank"
                                            data-index={realIndex}
                                        >
                                            <Image
                                                className={cn(
                                                    "pointer-events-none h-full w-full object-contain transition-all duration-500 md:rounded-xl",
                                                    isActive ? "md:scale-100 md:opacity-100" : "md:scale-[0.94] md:opacity-50"
                                                )}
                                                src={banner.src}
                                                alt={banner.alt}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 50.577vw"
                                                priority={realIndex === 0}
                                            />
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Desktop Navigation Arrows */}
                    <div className="pointer-events-none absolute inset-y-0 hidden w-[21.783%] items-center from-[#151515] md:flex start-0 justify-end bg-gradient-to-r rtl:bg-gradient-to-l">
                        <button onClick={handlePrev} type="button" className="pointer-events-auto hidden rounded-full bg-black/70 p-4 text-sm text-white transition-colors hover:bg-black md:group-hover:block">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 hidden w-[21.783%] items-center from-[#151515] md:flex end-0 justify-start bg-gradient-to-l rtl:bg-gradient-to-r">
                        <button onClick={handleNext} type="button" className="pointer-events-auto hidden rounded-full bg-black/70 p-4 text-sm text-white transition-colors hover:bg-black md:group-hover:block">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => handleDotClick(index)}
                                aria-label={`Go to slide ${index + 1}`}
                                className={cn(
                                    "h-1.5 w-1.5 cursor-pointer rounded-full",
                                    getRealIndex(currentIndex) === index ? "bg-destructive" : "bg-white/40",
                                    "md:h-2.5 md:w-2.5",
                                     getRealIndex(currentIndex) === index ? "md:bg-[linear-gradient(209deg,#DA1C1C_-7.14%,#8C1515_102.95%)]" : "md:bg-white/40"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
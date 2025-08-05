'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { banners } from '@/lib/data';
import { useIsMobile } from '@/hooks/use-mobile';

export function ImageCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMobile = useIsMobile();

    const resetTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    const handleNext = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex === banners.length - 1 ? 0 : prevIndex + 1));
    }, []);
    
    const handlePrev = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex === 0 ? banners.length - 1 : prevIndex - 1));
    }, []);

    const handleDotClick = (index: number) => {
        setCurrentIndex(index); 
    };
    
    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(handleNext, 3000);
        return () => resetTimeout();
    }, [currentIndex, handleNext, resetTimeout]);

    const getSlideOffset = () => {
        if (isMobile) {
            return `-${currentIndex * 100}%`;
        }
        // Centraliza o slide ativo e mostra partes dos adjacentes
        return `calc(-${currentIndex * 50}% + 25%)`;
    };

    const getTransitionStyle = (): React.CSSProperties => {
        return {
          transition: 'transform 500ms ease-in-out',
        };
    };

    if (banners.length === 0) {
        return null;
    }

    return (
        <div className="bg-[#151515]">
            <div className="group mx-auto max-w-[1366px] md:py-2.5 lg:py-5">
                <div className="relative overflow-hidden">
                    <div className="relative h-0 pt-[43.478%] md:pt-[19.106%]">
                        <div
                            className="absolute inset-0 flex"
                            style={{
                                transform: `translateX(${getSlideOffset()})`,
                                ...getTransitionStyle(),
                            }}
                        >
                            {banners.map((banner, index) => {
                                const isActive = currentIndex === index;
                                return (
                                    <div key={index} className="flex-shrink-0 w-full md:w-[50.577%]">
                                        <div
                                            className="block h-full w-full relative"
                                        >
                                            <Image
                                                className={cn(
                                                    "pointer-events-none h-full w-full object-contain transition-all duration-500",
                                                    "md:rounded-xl",
                                                    isActive 
                                                        ? "md:scale-100 md:opacity-100" 
                                                        : "md:scale-[0.94] md:opacity-50"
                                                )}
                                                src={banner.src}
                                                alt={banner.alt}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 50.577vw"
                                                priority={index >= 0 && index <= 2}
                                                data-ai-hint="game banner"
                                            />
                                        </div>
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
                        {banners.map((_, index) => {
                            const isActive = currentIndex === index;
                            return(
                                <button
                                    key={index}
                                    onClick={() => handleDotClick(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                    className={cn(
                                        "h-1.5 w-1.5 cursor-pointer rounded-full",
                                        isActive
                                          ? "bg-destructive" 
                                          : "bg-white/40",
                                        "md:h-2.5 md:w-2.5",
                                        isActive 
                                          ? "md:bg-[linear-gradient(209deg,#DA1C1C_-7.14%,#8C1515_102.95%)]" 
                                          : "md:bg-white/40"
                                    )}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { banners } from '@/lib/data';

export function ImageCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    const handleNext = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, []);

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
    };

    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
    };

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(handleNext, 3000);

        return () => {
            resetTimeout();
        };
    }, [currentIndex, handleNext, resetTimeout]);

    useEffect(() => {
        if (scrollRef.current) {
            const scrollWidth = scrollRef.current.scrollWidth;
            const childWidth = scrollWidth / banners.length;
            scrollRef.current.scrollTo({
                left: childWidth * currentIndex,
                behavior: 'smooth',
            });
        }
    }, [currentIndex]);


    return (
        <div className="bg-[#151515]">
            <div className="group mx-auto w-full max-w-[1366px] md:py-2.5 lg:py-5">
                <div className="relative flex justify-center pt-[43.478%] md:pt-[19.106%]">
                    <div ref={scrollRef} className="scrollbar-none absolute inset-0 flex overflow-auto snap-x snap-mandatory">
                        {banners.map((banner, index) => (
                            <Link
                                key={index}
                                href={banner.href || '#'}
                                className={cn(
                                    "block h-full w-full shrink-0 snap-center md:w-[50.577%] md:rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2",
                                )}
                                target="_blank"
                                data-index={index}
                            >
                                <Image
                                    className={cn(
                                        "pointer-events-none h-full w-full object-contain transition-all md:rounded-xl",
                                        currentIndex !== index && "md:scale-[94.211%] md:opacity-50"
                                    )}
                                    src={banner.src}
                                    alt={banner.alt}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50.577vw"
                                    priority={index === 0}
                                />
                            </Link>
                        ))}
                    </div>
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
                    <div className="absolute bottom-2.5 flex gap-2 md:gap-3">
                        {banners.map((_, index) => (
                            <div
                                key={index}
                                onClick={() => handleDotClick(index)}
                                aria-checked={currentIndex === index}
                                className={cn(
                                    "h-1.5 w-1.5 cursor-pointer rounded-full bg-white/80 aria-checked:bg-destructive",
                                    "md:h-2.5 md:w-2.5 md:bg-white/40 md:aria-checked:bg-[linear-gradient(209deg,#DA1C1C_-7.14%,#8C1515_102.95%)]"
                                )}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

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
        if (scrollRef.current) {
            const children = scrollRef.current.children;
            if (children[currentIndex]) {
                children[currentIndex].scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [currentIndex]);
    
    useEffect(() => {
        const timer = setTimeout(handleNext, 3000);
        return () => clearTimeout(timer);
    }, [currentIndex, handleNext]);


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
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    priority={index === 0}
                                />
                            </Link>
                        ))}
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 hidden w-[21.783%] items-center from-[#151515] md:flex start-0 justify-end bg-gradient-to-r rtl:bg-gradient-to-l">
                        <button onClick={handlePrev} type="button" className="pointer-events-auto hidden rounded-full bg-black/70 p-4 text-sm text-white transition-colors hover:bg-black md:group-hover:block">
                            <svg width="1em" height="1em" viewBox="0 0 7 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="-scale-x-100 rtl:scale-x-100"><path d="M6.81438 5.99466L1.68092 0.209207C1.43343 -0.0697356 1.03194 -0.0697356 0.784449 0.209207L0.185654 0.884087C-0.0615759 1.16273 -0.0618396 1.61404 0.184598 1.89328L4.25306 6.49985L0.184862 11.1067C-0.0618401 11.386 -0.0613112 11.8373 0.185919 12.1159L0.784713 12.7908C1.03221 13.0697 1.43369 13.0697 1.68119 12.7908L6.81438 7.00504C7.06187 6.7261 7.06187 6.2736 6.81438 5.99466Z" fill="currentColor"></path></svg>
                        </button>
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 hidden w-[21.783%] items-center from-[#151515] md:flex end-0 justify-start bg-gradient-to-l rtl:bg-gradient-to-r">
                        <button onClick={handleNext} type="button" className="pointer-events-auto hidden rounded-full bg-black/70 p-4 text-sm text-white transition-colors hover:bg-black md:group-hover:block">
                            <svg width="1em" height="1em" viewBox="0 0 7 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="scale-x-100 rtl:-scale-x-100"><path d="M6.81438 5.99466L1.68092 0.209207C1.43343 -0.0697356 1.03194 -0.0697356 0.784449 0.209207L0.185654 0.884087C-0.0615759 1.16273 -0.0618396 1.61404 0.184598 1.89328L4.25306 6.49985L0.184862 11.1067C-0.0618401 11.386 -0.0613112 11.8373 0.185919 12.1159L0.784713 12.7908C1.03221 13.0697 1.43369 13.0697 1.68119 12.7908L6.81438 7.00504C7.06187 6.7261 7.06187 6.2736 6.81438 5.99466Z" fill="currentColor"></path></svg>
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

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageSliderProps {
    images: string[];
    className?: string;
    autoplay?: boolean;
    autoSlide?: boolean;
    interval?: number;
    showDots?: boolean;
}

export const ImageSlider = ({
    images: rawImages = [],
    className,
    autoplay = true,
    autoSlide = true,
    interval = 5000,
    showDots = true,
}: ImageSliderProps) => {
    const images = Array.isArray(rawImages) ? rawImages : [];
    const finalAutoplay = autoplay && autoSlide;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const minSwipeDistance = 50;

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, [images.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    useEffect(() => {
        if (finalAutoplay && images.length > 1) {
            timerRef.current = setInterval(nextSlide, interval);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [finalAutoplay, nextSlide, interval, images.length]);

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) nextSlide();
        if (isRightSwipe) prevSlide();
    };

    if (!images || images.length === 0) {
        return (
            <div className={cn("w-full bg-slate-50 flex items-center justify-center rounded-2xl min-h-[300px] border border-slate-100", className)}>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <Camera size={20} />
                    </div>
                    <span className="text-slate-400 font-bold capitalize tracking-widest text-[10px]">Visuals being prepared</span>
                </div>
            </div>
        );
    }

    return (
        <div 
            className={cn("relative w-full h-full overflow-hidden group select-none", className)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div 
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((img, idx) => (
                    <div key={idx} className="w-full flex-shrink-0 h-full">
                        <img
                            src={img}
                            alt={`Slide ${idx + 1}`}
                            loading={idx === 0 ? "eager" : "lazy"}
                            decoding="async"
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>

            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-black/40"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-black/40"
                    >
                        <ChevronRight size={24} />
                    </button>
                </>
            )}

            {showDots && images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                    {images.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => goToSlide(idx)}
                            className={cn(
                                "h-1.5 transition-all duration-300 rounded-full",
                                currentIndex === idx ? "w-8 bg-white shadow-lg" : "w-1.5 bg-white/40 shadow-sm"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

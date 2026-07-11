"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { normalizeImageUrl } from "@/lib/api";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface Slide {
  title?: string;
  subtitle?: string;
  image: string;
  link?: string;
}

interface CinematicBannerProps {
  slides?: Slide[];
  autoPlay?: boolean;
  interval?: number;
  titleSize?: string | number;
  titleWeight?: string | number;
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0
  })
};

export default function CinematicBanner({
  slides = [],
  autoPlay = true,
  interval = 5000,
  titleSize,
  titleWeight,
}: CinematicBannerProps) {
  const [[page, direction], setPage] = useState([0, 0]);

  const index = Math.abs(page % slides.length);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;
    const timer = setInterval(() => {
      paginate(1);
    }, interval);
    return () => clearInterval(timer);
  }, [slides.length, autoPlay, interval, page]);

  if (!slides || slides.length === 0) return null;

  const current = slides[index];

  return (
    <section 
      className="pt-2 pb-6 md:pt-4 md:pb-8 px-6 overflow-hidden relative"
      style={{
        background: `linear-gradient(to bottom, #ffffff 0%, #ffffff 50%, #D4D6D9 50%, #D4D6D9 100%)`
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Large Banner Style with Responsive Height and 32px Radius */}
        <div className="relative h-[180px] sm:h-[280px] md:h-[380px] w-full rounded-[20px] md:rounded-[32px] overflow-hidden group shadow-[0_15px_30px_rgba(0,0,0,0.35)] bg-zinc-900">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 200, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0"
            >
              <OptimizedImage 
                src={normalizeImageUrl(current.image)} 
                alt={current.title || "Cinematic View"} 
                cloudinaryWidth={1600}
                sizes="100vw"
                className="w-full h-full object-cover" // Image fills without distortion
              />
              
              {/* Optional Overlay - Slight dark gradient for text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 flex flex-col items-start justify-end h-full">
                {current.subtitle && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-primary-orange font-bold tracking-[0.4em] text-[10px] md:text-xs mb-3"
                  >
                    {current.subtitle}
                  </motion.p>
                )}
                {current.title && (
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl md:text-6xl font-semibold text-white tracking-tighter mb-8 leading-[0.9]"
                    style={{ 
                      fontSize: titleSize ? (isNaN(Number(titleSize)) ? titleSize : `${titleSize}px`) : undefined,
                      fontWeight: titleWeight || undefined
                    }}
                  >
                    {current.title}
                  </motion.h2>
                )}
                {current.link && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Link 
                      href={current.link}
                      className="bg-white text-charcoal px-10 py-5 rounded-2xl font-bold text-xs tracking-widest flex items-center gap-3 hover:bg-primary-orange hover:text-white transition-all shadow-xl group"
                    >
                      Explore Now
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          {slides.length > 1 && (
            <>
              <button 
                onClick={() => paginate(-1)}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-charcoal z-20 shadow-2xl"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button 
                onClick={() => paginate(1)}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-charcoal z-20 shadow-2xl"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
              
              {/* Pagination Dots */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {slides.map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setPage([i, i > index ? 1 : -1])}
                    className={`h-1.5 rounded-full transition-all duration-700 ${i === index ? 'w-12 bg-white' : 'w-3 bg-white/40'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

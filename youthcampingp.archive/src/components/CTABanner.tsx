"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useIsMobile } from "@/hooks/useIsMobile";

interface CTABannerProps {
  title?: string;
  tagline?: string;
  backgroundImage?: string;
  ctaText?: string;
  ctaLink?: string;
  titleSize?: string | number;
  titleWeight?: string | number;
}

export default function CTABanner({
  title = "Group Trips",
  tagline = "for 18-35 Year Olds",
  backgroundImage = "https://images.unsplash.com/photo-1539635278303-d4002c07dee3",
  ctaText = "Join solo or bring your buddy",
  ctaLink = "/trips",
  titleSize,
  titleWeight,
}: CTABannerProps) {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const reduceMotion = prefersReducedMotion || isMobile;

  return (
    <div 
      className="relative w-full z-10 py-6 md:py-10"
      style={{
        background: 'linear-gradient(to bottom, #f3f3f3 0%, #f3f3f3 50%, #ffffff 50%, #ffffff 100%)'
      }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 lg:px-20">
        <div className="relative h-[400px] md:h-[500px] w-full rounded-[32px] overflow-hidden shadow-2xl group border border-zinc-50">
          {/* Background Image */}
          <div className="absolute inset-0">
            <OptimizedImage 
              src={normalizeImageUrl(backgroundImage)} 
              alt={title} 
              cloudinaryWidth={1600}
              sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1440px) calc(100vw - 96px), 1280px"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">
            {/* Top Badge */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/95 backdrop-blur-md px-10 py-4 rounded-full mb-8 shadow-2xl"
            >
              <span className="text-navy font-medium text-xs md:text-sm uppercase tracking-widest">{ctaText}</span>
            </motion.div>
            
            <motion.h2
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={reduceMotion ? { duration: 0 } : { delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl text-white capitalize leading-[1.05] tracking-tighter mb-4"
              style={{ 
                fontSize: titleSize ? (isNaN(Number(titleSize)) ? titleSize : `${titleSize}px`) : undefined,
                fontWeight: 'var(--font-weight-heading, 300)'
              }}
            >
              Group <br className="hidden md:block" /> Trips
            </motion.h2>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={reduceMotion ? { duration: 0 } : { delay: 0.2 }}
              className="text-white font-normal capitalize tracking-[0.2em] text-sm md:text-base mt-8 opacity-95"
            >
              {tagline}
            </motion.p>

            {/* Bottom Labels (Ba Na Hills, etc.) - Decorative */}
            <div className="absolute inset-x-0 bottom-10 px-12 flex justify-between items-end opacity-0 md:opacity-60 pointer-events-none">
              <div className="text-left">
                <p className="text-white font-semibold text-sm capitalize leading-none">Ba Na Hills</p>
                <p className="text-white/70 text-[10px] capitalize font-normal">Vietnam</p>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold text-sm capitalize leading-none">Chandra Taal Lake</p>
                <p className="text-white/70 text-[10px] capitalize font-normal">Spiti Valley</p>
              </div>
            </div>
          </div>

          {/* Link Overlay for entire banner */}
          <Link href={ctaLink} prefetch={false} className="absolute inset-0 z-20 cursor-pointer">
            <span className="sr-only">View {title}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

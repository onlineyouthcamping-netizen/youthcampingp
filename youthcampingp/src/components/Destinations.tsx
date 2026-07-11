"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";
import { WavyEdges } from "./ui/WavyEdges";
import { useIsMobile } from "@/hooks/useIsMobile";

const DestinationInquiryModal = dynamic(() => import("./DestinationInquiryModal"), { ssr: false });

interface Destination {
  name: string;
  img: string;
  duration?: string;
  subtext?: string;
}

interface DestinationsProps {
  title?: string;
  subtitle?: string;
  destinations?: Destination[];
  titleSize?: string | number;
  titleWeight?: string | number;
  topLabel?: string;
  titleStyle?: 'standard' | 'boxed';
  wavyEdges?: boolean;
  topColor?: string;
  bottomColor?: string;
}

const DESTINATION_FALLBACK = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80";

const DESTINATION_PHOTO_MAP: Record<string, string> = {
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
  maldives: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
  thailand: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80",
  singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80",
  malaysia: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80",
  himachal: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
  uttarakhand: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
  kedarnath: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
  manali: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
  ladakh: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80",
  spiti: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80",
  goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80"
};

function getDestinationPhoto(dest: Destination): string {
  if (dest.img && dest.img !== "/page-builder-defaults/destination-card.svg" && !dest.img.includes("destination-card.svg")) {
    const normalized = normalizeImageUrl(dest.img);
    if (normalized) return normalized;
  }
  const key = (dest.name || "").toLowerCase().trim();
  for (const [nameKey, photoUrl] of Object.entries(DESTINATION_PHOTO_MAP)) {
    if (key.includes(nameKey)) return photoUrl;
  }
  return DESTINATION_FALLBACK;
}

const defaultDestinations: Destination[] = [
  { 
    name: "Bali", 
    img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
    duration: "7 Days 6 Nights",
    subtext: "Spiritual retreats and world-famous surf breaks"
  },
  { 
    name: "Maldives", 
    img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
    duration: "5 Days 4 Nights",
    subtext: "Luxury overwater villas and crystal clear lagoons"
  },
  { 
    name: "Thailand", 
    img: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80",
    duration: "6 Days 5 Nights",
    subtext: "Tropical beaches and vibrant street life"
  },
  { 
    name: "Singapore", 
    img: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80",
    duration: "4 Days 3 Nights",
    subtext: "City in a garden and world-class attractions"
  },
  { 
    name: "Himachal Expedition", 
    img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
    duration: "6 Days 5 Nights",
    subtext: "Snowy peaks, valley treks, and serene monasteries"
  },
];

/** Individual destination card with loading skeleton and error fallback */
function DestinationCard({ dest, index, reduceMotion, onClick }: {
  dest: Destination;
  index: number;
  reduceMotion: boolean;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = imgError ? DESTINATION_FALLBACK : getDestinationPhoto(dest);

  // Dynamic styling mapping based on destination name to match SIKKIM, UTTARAKHAND, HIMACHAL, Ladakh, GOA, MALDIVES styles
  const getDestinationStyle = (name: string) => {
    const lower = name.toLowerCase();
    
    if (lower.includes('ladakh') || lower.includes('bali')) {
      return {
        fontFamily: "'Great Vibes', 'Dancing Script', 'Playball', cursive",
        textTransform: 'none' as const,
        fontSizeClass: 'text-[38px] md:text-[45px] font-medium leading-[1.1]',
        letterSpacing: 'normal',
        subtitle: lower.includes('ladakh') ? 'Road Trip' : ''
      };
    }
    if (lower.includes('sikkim')) {
      return {
        fontFamily: "'Rubik Mono One', 'Impact', 'Montserrat', sans-serif",
        textTransform: 'uppercase' as const,
        fontSizeClass: 'text-[22px] md:text-[25px] font-bold',
        letterSpacing: '0.08em',
        subtitle: ''
      };
    }
    if (lower.includes('uttarakhand') || lower.includes('uttrakhand')) {
      return {
        fontFamily: "'Cinzel Decorative', 'Cinzel', 'Playfair Display', serif",
        textTransform: 'uppercase' as const,
        fontSizeClass: 'text-[20px] md:text-[23px] font-bold',
        letterSpacing: '0.12em',
        subtitle: ''
      };
    }
    if (lower.includes('himachal')) {
      return {
        fontFamily: "'Oswald', 'Montserrat', sans-serif",
        textTransform: 'uppercase' as const,
        fontSizeClass: 'text-[26px] md:text-[30px] font-bold tracking-tight',
        letterSpacing: '0.06em',
        subtitle: '⛰️'
      };
    }
    if (lower.includes('goa')) {
      return {
        fontFamily: "'Pacifico', 'Satisfy', 'Caveat', cursive",
        textTransform: 'none' as const,
        fontSizeClass: 'text-[28px] md:text-[34px] font-normal',
        letterSpacing: 'normal',
        subtitle: '🌊'
      };
    }
    if (lower.includes('maldives')) {
      return {
        fontFamily: "'Brush Script MT', 'Dancing Script', 'Great Vibes', cursive",
        textTransform: 'none' as const,
        fontSizeClass: 'text-[38px] md:text-[46px] font-medium',
        letterSpacing: 'normal',
        subtitle: ''
      };
    }
    
    // Default (e.g. Singapore, etc.)
    return {
      fontFamily: "'Montserrat', 'Inter', sans-serif",
      textTransform: 'uppercase' as const,
      fontSizeClass: 'text-[22px] md:text-[26px] font-extrabold',
      letterSpacing: '0.15em',
      subtitle: ''
    };
  };

  const style = getDestinationStyle(dest.name);

  return (
    <motion.div
      key={index}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { delay: index * 0.1, duration: 0.6 }}
      viewport={{ once: true }}
      onClick={() => onClick()}
      className="relative min-w-[200px] w-[200px] md:min-w-[250px] md:w-[250px] aspect-[3/4.2] rounded-[24px] md:rounded-[32px] overflow-hidden group snap-start shadow-[0_10px_25px_rgba(0,0,0,0.08)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-500 cursor-pointer bg-zinc-800 isolate transform-gpu"
    >
      <OptimizedImage
        src={imgSrc}
        alt={dest.name}
        width={680}
        height={952}
        cloudinaryWidth={640}
        bunnyVariant="x540gt"
        priority={true}
        sizes="(max-width: 768px) 280px, 340px"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 transform-gpu"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/35" />
      <div className="absolute top-12 left-0 right-0 flex flex-col items-center justify-start p-4 z-20">
        {/* Render graphic decorators like waves or mountain icons above specific names */}
        {style.subtitle === '🌊' && (
          <span className="text-white text-2xl mb-1.5 opacity-90 select-none animate-pulse">🌊</span>
        )}
        {style.subtitle === '⛰️' && (
          <span className="text-white text-2xl mb-1.5 opacity-90 select-none">⛰️</span>
        )}
        
        <h3
          className={cn(
            "text-white text-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] select-none transition-transform duration-700 group-hover:scale-105",
            style.fontSizeClass
          )}
          style={{
            fontFamily: style.fontFamily,
            textTransform: style.textTransform,
            letterSpacing: style.letterSpacing
          }}
        >
          {dest.name}
        </h3>
        
        {/* Render text subheadings below, e.g., "Road Trip" for Ladakh */}
        {style.subtitle && style.subtitle !== '🌊' && style.subtitle !== '⛰️' && (
          <span className="text-white text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase mt-1 drop-shadow-md opacity-80 select-none">
            {style.subtitle}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function Destinations({ 
  title = "Top Destinations",
  subtitle,
  destinations = [],
  titleSize,
  titleWeight,
  topLabel,
  titleStyle = 'standard',
  wavyEdges = false,
  topColor = "#ffffff",
  bottomColor = "#ffffff",
}: DestinationsProps) {
  const rawItems = (destinations && destinations.length > 0) ? destinations : defaultDestinations;
  const items = rawItems.map(d => ({
    ...d,
    img: getDestinationPhoto(d)
  }));
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const reduceMotion = prefersReducedMotion || isMobile;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="section-wrapper bg-transparent overflow-hidden relative !pt-0 pb-8 md:!pt-0 md:pb-10 max-md:!px-0">
      {wavyEdges && <WavyEdges color={topColor === '#ffffff' ? '#D4D6D9' : topColor} position="top" />}
      <div className="max-w-[1440px] mx-auto px-4 md:px-0">
        <div className="flex flex-row items-end justify-between mb-8">
          <div className="flex flex-col">
            {topLabel && (
              <span className="section-label">
                {topLabel}
              </span>
            )}
            <div className={cn(
              titleStyle === 'boxed' && "p-6 md:px-10 md:py-8 rounded-[20px] md:rounded-[32px] border border-slate-200 bg-white shadow-sm max-w-fit"
            )}>
              <h2 
                className="section-heading text-[#082B5B] !font-extrabold capitalize"
                style={{ 
                  fontSize: titleSize ? (isNaN(Number(titleSize)) ? titleSize : `${titleSize}px`) : undefined
                }}
              >
                {title || "Popular Destinations"}
              </h2>
            </div>
          </div>
          <div className="hidden md:flex gap-3 pb-2">
            <button onClick={() => scroll('left')} className="w-12 h-12 rounded-full border border-zinc-200/50 flex items-center justify-center hover:bg-white hover:text-navy text-navy transition-all bg-white/95 shadow-sm" aria-label="Scroll Left">
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
            <button onClick={() => scroll('right')} className="w-12 h-12 rounded-full border border-zinc-200/50 flex items-center justify-center hover:bg-white hover:text-navy text-navy transition-all bg-white/95 shadow-sm" aria-label="Scroll Right">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex gap-3 md:gap-[28px] overflow-x-auto no-scrollbar pb-6 snap-x -mx-4 px-4 md:mx-0 md:px-0 scroll-pl-4 md:scroll-pl-0">
          {items.map((dest, i) => (
            <DestinationCard
              key={i}
              dest={dest}
              index={i}
              reduceMotion={reduceMotion}
              onClick={() => setSelectedDest(dest)}
            />
          ))}
        </div>
      </div>

      <DestinationInquiryModal 
        isOpen={!!selectedDest}
        onClose={() => setSelectedDest(null)}
        destination={selectedDest}
      />
      {wavyEdges && <WavyEdges color={bottomColor} position="bottom" />}
    </section>
  );
}

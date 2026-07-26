"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { normalizeImageUrl } from "@/lib/api";

interface RecentPhoto {
  id: string;
  url: string;
  caption: string;
  location: string;
}

const DEFAULT_PHOTOS: RecentPhoto[] = [
  {
    id: "p1",
    url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1000&q=85",
    caption: "Bonfire Night & Acoustic Music",
    location: "Manali, Himachal Pradesh",
  },
  {
    id: "p2",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1000&q=85",
    caption: "Conquering Snow Pass Together",
    location: "Hampta Pass Trek",
  },
  {
    id: "p3",
    url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1000&q=85",
    caption: "Divine Vibes at Kedarnath Gate",
    location: "Kedarnath, Uttarakhand",
  },
  {
    id: "p4",
    url: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=1000&q=85",
    caption: "Sunset Jump Celebration",
    location: "Spiti Valley",
  },
  {
    id: "p5",
    url: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1000&q=85",
    caption: "YouthCamping Peak Victory Flag",
    location: "Kedarkantha Summit",
  },
  {
    id: "p6",
    url: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=1000&q=85",
    caption: "Himalayan Trekking Trail",
    location: "Pangong Tso & Nubra Valley",
  },
  {
    id: "p7",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&q=85",
    caption: "Beachside Sunset Camping",
    location: "Gokarna & Goa",
  },
  {
    id: "p8",
    url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&q=85",
    caption: "Green Valley Exploration",
    location: "Matheran & Western Ghats",
  },
];

interface RecentPhotosSectionProps {
  photos?: RecentPhoto[];
  title?: string;
  subtitle?: string;
}

export default function RecentPhotosSection({
  photos = DEFAULT_PHOTOS,
  title = "Recent Photos",
  subtitle = "From Our Trips",
}: RecentPhotosSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const basePhotos = (photos && photos.length >= 4) ? photos : DEFAULT_PHOTOS;
  const marqueePhotos = [...basePhotos, ...basePhotos, ...basePhotos];

  // Hardware-accelerated continuous scroll loop
  useEffect(() => {
    let lastTime = performance.now();
    
    const step = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      if (scrollRef.current && !isHovered && !isDragging && selectedIndex === null) {
        scrollRef.current.scrollLeft += delta * 0.045;

        const maxScroll = scrollRef.current.scrollWidth / 3;
        if (scrollRef.current.scrollLeft >= maxScroll * 2) {
          scrollRef.current.scrollLeft -= maxScroll;
        }
      }

      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isHovered, isDragging, selectedIndex]);

  const handlePrevModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + basePhotos.length) % basePhotos.length);
  };

  const handleNextModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % basePhotos.length);
  };

  const displayPhotos = (photos && photos.length >= 4)
    ? photos.map((p: any, idx: number) => ({
        id: p.id || `photo-${idx}`,
        url: normalizeImageUrl(p.url || p.image || DEFAULT_PHOTOS[idx % DEFAULT_PHOTOS.length].url) || DEFAULT_PHOTOS[idx % DEFAULT_PHOTOS.length].url,
        caption: p.caption || p.title || DEFAULT_PHOTOS[idx % DEFAULT_PHOTOS.length].caption,
        location: p.location || DEFAULT_PHOTOS[idx % DEFAULT_PHOTOS.length].location,
      }))
    : DEFAULT_PHOTOS;

  // Automatic Cinematic Slider photo index auto-scroll
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePhotoIdx((prev) => (prev + 1) % displayPhotos.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [displayPhotos.length]);

  return (
    <section className="py-8 md:py-10 font-montserrat overflow-hidden bg-[#F5F5F5]">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 md:px-12">
        
        {/* HEADER ROW - FITS TITLE ON ONE LINE */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3 flex-nowrap">
          <div className="flex items-baseline gap-2 min-w-0 overflow-hidden whitespace-nowrap">
            <h2 className="text-[#1B2A4A] font-montserrat font-bold text-[18px] sm:text-[26px] md:text-[32px] leading-tight truncate">
              {title}
            </h2>
            <span className="font-caveat font-bold text-[#D4541A] text-[22px] sm:text-[30px] md:text-[38px] leading-none shrink-0">
              {subtitle}
            </span>
          </div>

          <Link
            href="/trips"
            className="group shrink-0 inline-flex items-center gap-1.5 text-xs sm:text-[15px] font-bold text-[#111827] hover:text-[#D4541A] transition-colors whitespace-nowrap"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4541A] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* AUTOMATIC CINEMATIC PHOTO MARQUEE SLIDER */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setIsDragging(false);
          }}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar py-3 scroll-smooth touch-pan-x cursor-grab active:cursor-grabbing select-none"
        >
          {marqueePhotos.map((photo, idx) => {
            const actualIndex = idx % displayPhotos.length;
            return (
              <div
                key={`${photo.id}-${idx}`}
                onClick={() => setSelectedIndex(actualIndex)}
                className="group relative shrink-0 flex-none w-[200px] sm:w-[240px] md:w-[270px] aspect-[4/3] sm:aspect-[16/10] rounded-[24px] overflow-hidden bg-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.22)] hover:-translate-y-1.5 transition-all duration-500 cursor-pointer isolate"
              >
                <Image
                  src={photo.url}
                  alt={photo.caption}
                  fill
                  sizes="(max-width: 640px) 200px, 270px"
                  className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = DEFAULT_PHOTOS[actualIndex % DEFAULT_PHOTOS.length].url;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-85 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                  <p className="text-white font-bold text-xs sm:text-sm leading-tight line-clamp-1">{photo.caption}</p>
                  <p className="text-zinc-300 text-[11px] truncate mt-0.5">{photo.location}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIndex(null)}
            className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8"
          >
            {/* TOP BAR */}
            <div className="flex items-center justify-between text-white z-10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold bg-[#D4541A] px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-xs">
                  {selectedIndex + 1} of {basePhotos.length}
                </span>
                <span className="text-sm font-semibold text-zinc-300 hidden sm:inline">
                  {basePhotos[selectedIndex].location}
                </span>
              </div>

              <button
                onClick={() => setSelectedIndex(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close photo"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* MAIN IMAGE CONTAINER WITH NAVIGATION ARROWS */}
            <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
              <button
                onClick={handlePrevModal}
                className="absolute left-2 sm:left-6 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-[#D4541A] text-white flex items-center justify-center transition-all border border-white/20 active:scale-95 shadow-lg cursor-pointer"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="relative w-full h-full max-w-5xl max-h-[75vh]">
                <Image
                  src={basePhotos[selectedIndex].url}
                  alt={basePhotos[selectedIndex].caption}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <button
                onClick={handleNextModal}
                className="absolute right-2 sm:right-6 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-[#D4541A] text-white flex items-center justify-center transition-all border border-white/20 active:scale-95 shadow-lg cursor-pointer"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* BOTTOM CAPTION BAR */}
            <div className="text-center text-white z-10 pb-2">
              <h3 className="font-bold text-lg sm:text-xl text-white mb-1">
                {basePhotos[selectedIndex].caption}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                {basePhotos[selectedIndex].location}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

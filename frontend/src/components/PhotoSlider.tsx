"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface Slide {
  image: string;
  link?: string;
  title?: string;
}

interface PhotoSliderProps {
  slides?: Slide[];
  title?: string;
}

export default function PhotoSlider({
  slides = [],
  title = "GLIMPSES OF ADVENTURE"
}: PhotoSliderProps) {
  const defaultSlides: Slide[] = [
    { image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80", title: "Alpine Lakes" },
    { image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800&q=80", title: "Sunset Valleys" },
    { image: "https://images.unsplash.com/photo-1493246507139-91e8bef99c17?w=800&q=80", title: "High Pass Treks" },
    { image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80", title: "Spiti Expeditions" },
    { image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80", title: "Himalayan Ridge" },
    { image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&q=80", title: "Stargazing Nights" },
    { image: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=800&q=80", title: "Summit Trails" },
    { image: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&q=80", title: "Group Memories" }
  ];

  const list = slides.length > 0 ? slides : defaultSlides;
  const infiniteList = [...list, ...list, ...list];

  return (
    <section className="py-8 sm:py-12 bg-white overflow-hidden border-t border-zinc-100 font-montserrat">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 md:px-12 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B1528] tracking-tight font-montserrat leading-none">
              {title.split(' ')[0]}{' '}
              <span className="text-[#D4541A] font-caveat italic">{title.split(' ').slice(1).join(' ')}</span>
            </h2>
          </div>
          <p className="text-zinc-500 font-semibold text-xs sm:text-sm font-montserrat max-w-sm">
            Capturing unfiltered traveler moments across the mountains.
          </p>
        </div>
      </div>

      {/* CONTINUOUS AUTOMATIC INFINITE MARQUEE SLIDER */}
      <div className="w-full overflow-hidden relative py-2">
        <motion.div
          animate={{ x: ["0%", "-33.333%"] }}
          transition={{
            repeat: Infinity,
            repeatType: "loop",
            duration: 35,
            ease: "linear",
          }}
          className="flex gap-5 w-max"
        >
          {infiniteList.map((slide, i) => (
            <div
              key={i}
              className="flex-none w-[180px] sm:w-[240px] md:w-[280px] h-[130px] sm:h-[160px] md:h-[180px] bg-zinc-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group relative"
            >
              <Link href={slide.link || "/trips"} prefetch={false} className="block w-full h-full relative">
                <OptimizedImage
                  src={normalizeImageUrl(slide.image)}
                  alt={slide.title || `Adventure ${i + 1}`}
                  cloudinaryWidth={600}
                  bunnyVariant="x540gt"
                  sizes="(max-width: 768px) 280px, 320px"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white font-bold text-xs sm:text-sm tracking-wide">
                    {slide.title || "YouthCamping Vibes"}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

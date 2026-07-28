"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface Slide {
  image: string;
  link?: string;
}

interface PhotoSliderProps {
  slides?: Slide[];
  title?: string;
}

export default function PhotoSlider({
  slides = [],
  title
}: PhotoSliderProps) {
  // Fallback slides if none provided
  const displaySlides = slides.length > 0 ? slides : [
    { image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470" },
    { image: "https://images.unsplash.com/photo-1472396961693-142e6e269027" },
    { image: "https://images.unsplash.com/photo-1493246507139-91e8bef99c17" },
    { image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb" },
    { image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b" },
    { image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470" }
  ];

  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative">
        {title && (
          <h2 className="text-3xl font-bold text-navy capitalize tracking-tighter mb-10">{title}</h2>
        )}
        
        <div 
          id="photo-slider-container"
          className="flex gap-6 overflow-x-auto no-scrollbar snap-x pb-8"
        >
          {/* Duplicate slides for a semi-infinite feel if few items */}
          {[...displaySlides, ...displaySlides].map((slide, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: (i % displaySlides.length) * 0.1 }}
              viewport={{ once: true }}
              className="flex-none w-[260px] md:w-[280px] h-[160px] md:h-[180px] snap-start bg-white rounded-[24px] overflow-hidden shadow-md hover:shadow-xl transition-all group"
            >
              <Link href={slide.link || "/trips"} prefetch={false} className="block w-full h-full">
                <OptimizedImage 
                  src={normalizeImageUrl(slide.image)} 
                  alt={`Slide ${i + 1}`} 
                  cloudinaryWidth={480}
                  bunnyVariant="x540gt"
                  sizes="280px"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

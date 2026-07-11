"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HighlightItem {
  name: string;
  description?: string;
  image: string;
  slug: string;
  order?: number;
}

interface TripHighlightsListProps {
  title: string;
  items?: HighlightItem[];
  defaultItems?: any[];
}

export default function TripHighlightsList({ title, items, defaultItems = [] }: TripHighlightsListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeList = (items && items.length > 0) ? items : defaultItems;

  if (activeList.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const container = containerRef.current;
      // Scroll by roughly one card width plus gap (e.g. 300px)
      const scrollAmount = 320;
      if (direction === "left") {
        container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  return (
    <section className="relative">
      <div className="bg-white border border-zinc-100 rounded-[40px] p-10 md:p-14 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-bold text-navy">{title}</h2>
          
          {/* Slide Navigation Buttons */}
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 hover:text-navy hover:border-zinc-400 transition-all cursor-pointer focus:outline-none"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 hover:text-navy hover:border-zinc-400 transition-all cursor-pointer focus:outline-none"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div 
          ref={containerRef}
          className="flex flex-nowrap overflow-x-auto pb-4 gap-6 md:gap-8 no-scrollbar scroll-smooth"
        >
          {activeList.map((item, i) => {
            const isString = typeof item === "string";
            const name = isString ? item : ((item as any).name || (item as any).title || "Highlight");
            const imageUrl = isString ? "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6" : ((item as any).image || (item as any).img || (item as any).url || "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6");
            const slug = isString ? i.toString() : ((item as any).slug || (item as any).id || i.toString());
            const desc = isString ? "" : ((item as any).description || (item as any).desc || "");
            
            const isClickable = title.toLowerCase().includes('attractions') || title.toLowerCase().includes('activities');
            
            const cardContent = (
              <>
                <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden mb-4 shadow-sm bg-zinc-50 border border-zinc-100">
                  <OptimizedImage 
                     src={normalizeImageUrl(imageUrl) || "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6"} 
                     alt={name} 
                     loading="lazy"
                     className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="font-bold text-navy text-sm mb-1 line-clamp-1">{name}</h3>
                {desc && <p className="text-[10px] text-zinc-400 font-medium line-clamp-2 leading-relaxed">{desc}</p>}
              </>
            );

            const cardClass = "group shrink-0 w-[240px] md:w-[280px] select-none";

            if (isClickable) {
              return (
                <Link 
                  key={i} 
                  href={`/attractions/${slug}`} 
                  className={cardClass}
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <div 
                key={i} 
                className={cardClass}
              >
                {cardContent}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

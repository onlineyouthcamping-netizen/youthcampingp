"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { normalizeImageUrl } from "@/lib/api";

const DestinationInquiryModal = dynamic(() => import("./DestinationInquiryModal"), { ssr: false });

interface Destination {
  name: string;
  img: string;
  subtext?: string;
}

interface DestinationsProps {
  title?: string;
  subtitle?: string;
  destinations?: Destination[];
}

const DEFAULT_DESTINATIONS: Destination[] = [
  {
    name: "Matheran",
    img: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
    subtext: "Hill Station Trek",
  },
  {
    name: "Valley of Flowers",
    img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
    subtext: "UNESCO World Heritage",
  },
  {
    name: "Discover The Dangs",
    img: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    subtext: "Waterfalls & Forest Trail",
  },
  {
    name: "Saputara",
    img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
    subtext: "Mist & Valley Views",
  },
  {
    name: "Mahabaleshwar",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    subtext: "Plateau & Sunrise Points",
  },
  {
    name: "Spiti Valley",
    img: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80",
    subtext: "High Altitude Circuit",
  },
  {
    name: "Ladakh",
    img: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=800&q=80",
    subtext: "Pangong & Nubra",
  },
];

const DEST_IMAGE_MAP: Record<string, string> = {
  "himachal": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
  "himachal pradesh": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
  "uttarakhand": "https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=800&q=80",
  "spiti": "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80",
  "spiti valley": "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80",
  "ladakh": "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=800&q=80",
  "kerala": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
  "sikkim": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
  "goa": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  "matheran": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
  "valley of flowers": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
  "discover the dangs": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
  "the dangs": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
  "dangs": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
  "saputara": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
  "mahabaleshwar": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
};

export default function Destinations({
  title = "Popular Destinations",
  destinations,
}: DestinationsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);

  const displayItems: Destination[] = (Array.isArray(destinations) && destinations.length > 0)
    ? destinations.map((d: any, i: number) => {
        const fallback = DEFAULT_DESTINATIONS[i % DEFAULT_DESTINATIONS.length];
        const rawName = typeof d === 'string' ? d : (d?.name || fallback.name);
        const customImg = (typeof d === 'object' && (d?.img || d?.imageUrl)) ? normalizeImageUrl(d.img || d.imageUrl) : undefined;
        const cleanKey = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const mappedImg = customImg || Object.entries(DEST_IMAGE_MAP).find(([key]) => cleanKey.includes(key.replace(/[^a-z0-9]/g, '')))?.[1] || fallback.img;
        return {
          name: rawName,
          subtext: (typeof d === 'object' && d?.subtext) ? d.subtext : (fallback.subtext || "Explore Group Trip"),
          img: mappedImg,
        };
      })
    : DEFAULT_DESTINATIONS;

  const nudge = (dir: "l" | "r") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "l" ? -250 : 250, behavior: "smooth" });
    }
  };

  return (
    <section className="popular-destinations popular-section destinations-grid py-6 sm:py-8 font-montserrat overflow-hidden" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 md:px-12">
        
        {/* HEADER ROW - FITS TITLE ON ONE LINE */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3 flex-nowrap">
          <div className="flex items-baseline gap-2 min-w-0 overflow-hidden whitespace-nowrap">
            <h2 className="text-[#1B2A4A] font-montserrat font-black text-2xl sm:text-3xl md:text-4xl lg:text-[40px] tracking-tight capitalize leading-tight">
              {(title.split(' ')[0] || "Popular").toLowerCase()}
            </h2>
            <span className="font-caveat font-bold text-[#D4541A] text-[26px] sm:text-[34px] md:text-[40px] lg:text-[46px] leading-none shrink-0 capitalize pr-2 sm:pr-3">
              {(title.split(' ').slice(1).join(' ') || "Destinations").toLowerCase()}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={() => nudge("l")}
              aria-label="Previous Destinations"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-zinc-200 shadow-xs hover:bg-zinc-100 flex items-center justify-center text-zinc-800 transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-700" />
            </button>
            <button
              onClick={() => nudge("r")}
              aria-label="Next Destinations"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-zinc-200 shadow-xs hover:bg-zinc-100 flex items-center justify-center text-zinc-800 transition-all cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-700" />
            </button>
          </div>
        </div>

        {/* DESTINATION PORTRAIT CARDS SLIDER WITH NAME OVERLAY & INQUIRY FORM CLICK */}
        <div
          ref={scrollRef}
          className="flex gap-3.5 sm:gap-5 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth touch-manipulation"
        >
          {displayItems.map((item, idx) => (
            <motion.div
              key={item.name + idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07, duration: 0.5 }}
              viewport={{ once: true }}
              onClick={() => setSelectedDest(item)}
              className="group relative flex-none snap-start w-[68vw] sm:w-[190px] md:w-[210px] max-w-[220px] aspect-[9/13.5] rounded-2xl overflow-hidden bg-zinc-900 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer isolate"
            >
              {/* DESTINATION BACKGROUND IMAGE */}
              <Image
                src={item.img}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 140px, 190px"
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </motion.div>
          ))}
        </div>

      </div>

      {/* INQUIRY MODAL */}
      <DestinationInquiryModal
        isOpen={!!selectedDest}
        onClose={() => setSelectedDest(null)}
        destination={selectedDest}
      />
    </section>
  );
}

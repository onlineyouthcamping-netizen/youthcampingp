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
    <section className="popular-destinations popular-section destinations-grid py-8 md:py-10 font-montserrat overflow-hidden" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 md:px-12">
        
        {/* HEADER ROW */}
        <div className="flex items-center justify-between mb-8 sm:mb-10 flex-wrap gap-4">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <h2 className="text-[#1B2A4A] font-montserrat font-semibold text-[28px] sm:text-[32px] md:text-[36px] leading-tight">
              {title.split(' ')[0] || "Popular"}
            </h2>
            <span className="font-caveat font-bold text-[#D4541A] text-[32px] sm:text-[36px] md:text-[42px] leading-none">
              {title.split(' ').slice(1).join(' ') || "Destinations"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => nudge("l")}
              aria-label="Previous Destinations"
              className="w-10 h-10 rounded-full bg-white border border-zinc-200 shadow-xs hover:bg-zinc-100 flex items-center justify-center text-zinc-800 transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-700" />
            </button>
            <button
              onClick={() => nudge("r")}
              aria-label="Next Destinations"
              className="w-10 h-10 rounded-full bg-white border border-zinc-200 shadow-xs hover:bg-zinc-100 flex items-center justify-center text-zinc-800 transition-all cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-5 h-5 text-zinc-700" />
            </button>
          </div>
        </div>

        {/* DESTINATION PORTRAIT CARDS SLIDER WITH NAME OVERLAY & INQUIRY FORM CLICK */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar py-3 px-1 scroll-smooth"
        >
          {displayItems.map((item, idx) => (
            <motion.div
              key={item.name + idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07, duration: 0.5 }}
              viewport={{ once: true }}
              onClick={() => setSelectedDest(item)}
              className="group relative flex-none snap-start w-[190px] sm:w-[215px] md:w-[230px] aspect-[9/16] rounded-[24px] overflow-hidden bg-zinc-900 shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.22)] hover:-translate-y-1.5 transition-all duration-500 cursor-pointer isolate"
            >
              {/* DESTINATION BACKGROUND IMAGE */}
              <Image
                src={item.img}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 190px, 230px"
                className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
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

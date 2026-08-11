"use client";

import { useState, useRef, useMemo } from "react";
import { Trip } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import TripCard from "@/components/TripCard";

const MOCK_TRIPS: Trip[] = [
  {
    id: "mock-1",
    title: "Manali Kasol Amritsar Backpacking Trip",
    slug: "manali-kasol-amritsar",
    description: "Hills, Culture & Vibes",
    heroImage:
      "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&q=80",
    price: 12999,
    location: "Himachal Pradesh",
    duration: "9 Days / 8 Nights",
    departureCity: "Ahmedabad",
    category: "Backpacking",
    images: [],
    itinerary: [],
    highlights: [],
    inclusions: [],
    exclusions: [],
    faqs: [],
    availableDates: [{ date: "2026-08-01", capacity: 20, bookedCount: 8 }],
    variants: [
      {
        location: "Ahmedabad",
        duration: "9 Days / 8 Nights",
        originalPrice: 15999,
        discountedPrice: 12999,
        image: "",
      },
    ],
    travelOptions: [],
    roomOptions: [],
    addons: [],
    status: "published",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "mock-2",
    title: "Spiti Valley Road Trip",
    slug: "spiti-valley-road-trip",
    description: "High Roads & Higher Vibes",
    heroImage:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
    price: 19999,
    location: "Himachal Pradesh",
    duration: "11 Days / 10 Nights",
    departureCity: "Chandigarh",
    category: "Road Trip",
    images: [],
    itinerary: [],
    highlights: [],
    inclusions: [],
    exclusions: [],
    faqs: [],
    availableDates: [{ date: "2026-08-10", capacity: 20, bookedCount: 8 }],
    variants: [
      {
        location: "Chandigarh",
        duration: "11 Days / 10 Nights",
        originalPrice: 24999,
        discountedPrice: 19999,
        image: "",
      },
    ],
    travelOptions: [],
    roomOptions: [],
    addons: [],
    status: "published",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "mock-3",
    title: "Winter Spiti Road Trip",
    slug: "winter-spiti-road-trip",
    description: "Snow & Solitude",
    heroImage:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    price: 19999,
    location: "Himachal Pradesh",
    duration: "10 Days / 9 Nights",
    departureCity: "Chandigarh",
    category: "Road Trip",
    images: [],
    itinerary: [],
    highlights: [],
    inclusions: [],
    exclusions: [],
    faqs: [],
    availableDates: [{ date: "2026-12-01", capacity: 15, bookedCount: 5 }],
    variants: [
      {
        location: "Chandigarh",
        duration: "10 Days / 9 Nights",
        originalPrice: 24999,
        discountedPrice: 19999,
        image: "",
      },
    ],
    travelOptions: [],
    roomOptions: [],
    addons: [],
    status: "published",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "mock-4",
    title: "Kerala Backwater Escape",
    slug: "kerala-escape",
    description: "Backwaters, Beaches & Bliss",
    heroImage:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80",
    price: 14499,
    location: "Kerala",
    duration: "6 Days / 5 Nights",
    departureCity: "Kochi",
    category: "Backpacking",
    images: [],
    itinerary: [],
    highlights: [],
    inclusions: [],
    exclusions: [],
    faqs: [],
    availableDates: [{ date: "2026-08-18", capacity: 25, bookedCount: 10 }],
    variants: [
      {
        location: "Kochi",
        duration: "6 Days / 5 Nights",
        originalPrice: 17999,
        discountedPrice: 14499,
        image: "",
      },
    ],
    travelOptions: [],
    roomOptions: [],
    addons: [],
    status: "published",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "mock-5",
    title: "Kerala Trip",
    slug: "kerala-trip",
    description: "Waterfalls, Beaches & Houseboat",
    heroImage:
      "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?w=800&q=80",
    price: 19999,
    location: "Kerala",
    duration: "9 Days / 8 Nights",
    departureCity: "Cochin",
    category: "Backpacking",
    images: [],
    itinerary: [],
    highlights: [],
    inclusions: [],
    exclusions: [],
    faqs: [],
    availableDates: [{ date: "2026-09-05", capacity: 20, bookedCount: 12 }],
    variants: [
      {
        location: "Cochin",
        duration: "9 Days / 8 Nights",
        originalPrice: 24999,
        discountedPrice: 19999,
        image: "",
      },
    ],
    travelOptions: [],
    roomOptions: [],
    addons: [],
    status: "published",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "mock-6",
    title: "Kedarkantha Trek",
    slug: "kedarkantha-trek",
    description: "Summit Dreams",
    heroImage:
      "https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=800&q=80",
    price: 6499,
    location: "Uttarakhand",
    duration: "6 Days / 5 Nights",
    departureCity: "Dehradun",
    category: "Trekking",
    images: [],
    itinerary: [],
    highlights: [],
    inclusions: [],
    exclusions: [],
    faqs: [],
    availableDates: [{ date: "2026-08-05", capacity: 15, bookedCount: 6 }],
    variants: [
      {
        location: "Dehradun",
        duration: "6 Days / 5 Nights",
        originalPrice: 8999,
        discountedPrice: 6499,
        image: "",
      },
    ],
    travelOptions: [],
    roomOptions: [],
    addons: [],
    status: "published",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "mock-7",
    title: "Leh Ladakh Road Trip",
    slug: "leh-ladakh-road-trip",
    description: "High Passes & Pangong",
    heroImage:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    price: 15999,
    location: "Ladakh",
    duration: "8 Days / 7 Nights",
    departureCity: "Delhi",
    category: "Road Trip",
    images: [],
    itinerary: [],
    highlights: [],
    inclusions: [],
    exclusions: [],
    faqs: [],
    availableDates: [{ date: "2026-08-10", capacity: 20, bookedCount: 8 }],
    variants: [
      {
        location: "Delhi",
        duration: "8 Days / 7 Nights",
        originalPrice: 18999,
        discountedPrice: 15999,
        image: "",
      },
    ],
    travelOptions: [],
    roomOptions: [],
    addons: [],
    status: "published",
    createdAt: "",
    updatedAt: "",
  },
];

// Group trips by location
function groupByLocation(trips: Trip[]): Record<string, Trip[]> {
  const groups: Record<string, Trip[]> = {};
  trips.forEach((t) => {
    const loc = t.location || "Other";
    if (!groups[loc]) groups[loc] = [];
    groups[loc].push(t);
  });
  return groups;
}

// ── Horizontal Row Component ────────────────────────────────────────────
function DestinationRow({
  location,
  trips,
}: {
  location: string;
  trips: Trip[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "l" | "r") =>
    scrollRef.current?.scrollBy({
      left: dir === "l" ? -320 : 320,
      behavior: "smooth",
    });

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black text-[#0B1528] font-montserrat tracking-tight">
          {location}{" "}
          <span className="text-[#D4541A] font-bold">Tour Packages</span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("l")}
            aria-label="Scroll left"
            className="w-9 h-9 rounded-full border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-700" />
          </button>
          <button
            onClick={() => scroll("r")}
            aria-label="Scroll right"
            className="w-9 h-9 rounded-full border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs"
          >
            <ChevronRight className="w-4 h-4 text-zinc-700" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrolling Standard TripCards */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-2"
      >
        {trips.map((trip, idx) => (
          <div key={trip.id} className="w-[280px] sm:w-[310px] shrink-0">
            <TripCard trip={trip} index={idx} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page Component ─────────────────────────────────────────────────
interface Props {
  trips?: Trip[];
}

export default function UpcomingTripsClient({ trips: propTrips = [] }: Props) {
  const sortedTrips = useMemo(() => {
    const raw = propTrips || [];
    const sorted = [...raw].sort((a, b) => {
      const orderA = typeof a.order === "number" ? a.order : 999;
      const orderB = typeof b.order === "number" ? b.order : 999;
      return orderA - orderB;
    });

    const seen = new Set<string>();
    return sorted.filter((t) => {
      const key = (t.id || t.slug || t.title || "").toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [propTrips]);

  const groups = groupByLocation(sortedTrips);
  const locationKeys = Object.keys(groups);

  return (
    <main className="bg-white min-h-screen font-montserrat">
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-[#0B1528] pt-24 pb-10 md:pt-28 md:pb-14">
        <div className="absolute inset-0 z-0 opacity-25">
          <Image
            src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1800&q=85"
            alt="Community travellers"
            fill
            className="object-cover object-center"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1528] via-[#0B1528]/70 to-[#0B1528]/40 z-[1]" />

        <div className="relative z-10 max-w-[1440px] w-full mx-auto px-6 sm:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 bg-[#D4541A]/20 text-[#D4541A] font-extrabold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-3 font-montserrat">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4541A]" />
              Explore All Destinations
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-montserrat">
              Tour Packages
            </h1>
            <div className="w-12 h-1.5 bg-[#D4541A] rounded-full mt-3 mb-3" />
            <p className="text-zinc-300 text-sm font-semibold max-w-md font-montserrat leading-relaxed">
              Browse curated group trips by destination. Book your next
              adventure today.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── DESTINATION ROWS ─────────────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-6 sm:px-10 py-10 space-y-10">
        {locationKeys.map((loc, idx) => (
          <motion.div
            key={loc}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05, duration: 0.4 }}
          >
            <DestinationRow location={loc} trips={groups[loc]} />
          </motion.div>
        ))}
      </section>
    </main>
  );
}

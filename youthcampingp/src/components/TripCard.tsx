"use client";

import { Trip } from "@/types";
import { motion } from "framer-motion";
import Link from "next/link";

import { MapPin } from "lucide-react";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";

interface TripCardProps {
  trip: Trip;
  index: number;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  activeMonth?: string;
}

export default function TripCard({ trip, index, className, onClick, activeMonth }: TripCardProps) {
  // Original Price Formatter (Calculated from variants or defaults)
  const getOriginalPrice = () => {
    let variantsList: any[] = [];
    if (trip.variants) {
      try {
        variantsList = typeof trip.variants === 'string'
          ? JSON.parse(trip.variants)
          : trip.variants;
      } catch (e) {}
    }

    if (Array.isArray(variantsList) && variantsList.length > 0) {
      const firstVariant = variantsList[0];
      if (firstVariant && (firstVariant.originalPrice || firstVariant.discountedPrice)) {
        return firstVariant.originalPrice || (firstVariant.discountedPrice + 3000);
      }
    }

    return (trip.price || 12000) + 3000;
  };

  // Route Summary Formatter (Extracts key stops for subtitle)
  const getRouteSummary = () => {
    let routeList: any[] = [];
    if (trip.route) {
      try {
        routeList = typeof trip.route === 'string'
          ? JSON.parse(trip.route)
          : trip.route;
      } catch (e) {}
    }

    const routeLabels = routeList.map(r => typeof r === 'string' ? r : r.label).filter(Boolean);
    if (routeLabels.length > 1) {
      return `with ${routeLabels.slice(0, 2).join(" & ")}`;
    }
    return trip.location ? `Expedition in ${trip.location}` : trip.description || "";
  };

  // Split title helper for orange & navyblue color theme uniformity
  const renderFormattedTitle = (rawTitle: string) => {
    return <span className="text-[#082B5B]">{rawTitle.trim()}</span>;
  };

  // Duration Formatter to match "X Days Y Nights" style
  const getFormattedDuration = (dur: string) => {
    if (!dur) return "";
    const nightsMatch = dur.match(/(\d+)\s*(?:Nights|N)/i);
    const daysMatch = dur.match(/(\d+)\s*(?:Days|D)/i);
    if (nightsMatch && daysMatch) {
      const nights = parseInt(nightsMatch[1]);
      const days = parseInt(daysMatch[1]);
      return `${days} Days ${nights} Nights`;
    }
    return dur;
  };

  const originalPrice = getOriginalPrice();
  const discount = originalPrice - (trip.price || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className={cn(
        "avian-card group relative bg-white rounded-[24px] overflow-hidden border border-zinc-100/50 shadow-md hover:shadow-xl hover:scale-[1.015] active:scale-[0.985] cursor-pointer transition-all duration-300 w-full h-[345px] md:h-[375px] lg:h-[405px] max-w-[var(--card-width)] mx-auto flex flex-col p-2.5 md:p-3",
        className
      )}
    >
      {/* Invisible Link Overlay - Ensures 100% clickability */}
      <Link 
        href={`/trips/${trip.slug}`} 
        prefetch={false}
        className="absolute inset-0 z-30 cursor-pointer"
        aria-label={`View ${trip.title}`}
        onClick={onClick}
      />

      {/* Photo Container (Occupies 63% of the card height, large rounded corners) */}
      <div className="relative w-full h-[185px] md:h-[205px] lg:h-[225px] rounded-[20px] md:rounded-[24px] overflow-hidden shrink-0 avian-photo-container">
        <OptimizedImage
          src={normalizeImageUrl(trip.heroImage) || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070"}
          alt={trip.title}
          width={400}
          height={250}
          cloudinaryWidth={800}
          bunnyVariant="x540gt"
          sizes="(max-width: 768px) 280px, 400px"
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          style={{
            filter: "contrast(1.08) saturate(1.1)"
          }}
        />

        {/* Carousel Pagination Dots Overlay */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 select-none">
          {[0, 1, 2, 3, 4].map((dot, dIdx) => (
            <div 
              key={dIdx} 
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                dIdx === 0 ? "bg-white scale-110 shadow-sm" : "bg-white/50"
              )}
            />
          ))}
        </div>

        {/* Floating Place/Category Badge on Top-Right */}
        {(trip.location || trip.category) && (
          <div 
            className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full shadow-sm flex items-center border border-white/10 select-none"
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)"
            }}
          >
            <MapPin className="w-3 h-3 text-[#FFA366] mr-1 shrink-0" />
            <span className="text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wide">
              {trip.location || trip.category}
            </span>
          </div>
        )}
      </div>

      {/* Content Area (Matched to the Kashmir Tour Package layout) */}
      <div className="flex-1 flex flex-col pt-2 md:pt-2.5 px-0.5 avian-content-container">
        {/* Duration */}
        <span className="text-xs md:text-sm text-zinc-400 font-medium mb-0.5 block">
          {getFormattedDuration(trip.duration)}
        </span>

        {/* Title */}
        <h3 className="font-extrabold text-[14px] md:text-[16px] text-[#082B5B] leading-tight tracking-tight line-clamp-1 mb-0.5 select-none">
          {renderFormattedTitle(trip.title)}
        </h3>

        {/* Route Summary */}
        <p className="text-[13px] md:text-[14px] text-zinc-500 font-medium line-clamp-1 mb-1.5">
          {getRouteSummary()}
        </p>

        {/* Divider */}
        <div className="h-px bg-zinc-200/80 my-2 w-full shrink-0" />

        {/* Save Badge (Positioned above price, matching pill outline design) */}
        {discount > 0 && (
          <div className="flex items-center gap-1 border border-[#22C55E] text-[#22C55E] bg-[#E8F8F0]/30 px-2.5 py-0.5 rounded-full text-[10px] md:text-[11px] font-extrabold w-fit mb-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-[#22C55E] shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Save {Number(discount).toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* Pricing Row (Vibrant Orange Price + Original Strikethrough) */}
        <div className="flex items-baseline gap-2 mt-auto pb-0.5 pl-0.5 select-none w-full shrink-0">
          <span className="text-[#FF5B00] text-base md:text-lg lg:text-xl font-extrabold">
            ₹{Number(trip.price).toLocaleString('en-IN')}
          </span>
          {discount > 0 && (
            <span className="text-zinc-400 text-xs md:text-sm line-through font-normal">
              ₹{originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Trip } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin } from "lucide-react";
import { normalizeImageUrl } from "@/lib/api";

interface TripCardProps {
  trip: Trip;
  index?: number;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  activeMonth?: string;
}

export default function TripCard({ trip, index = 0, className, onClick }: TripCardProps) {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  const price = Number(trip.price || 12999);
  const heroImg =
    normalizeImageUrl(trip.heroImage) ||
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80";

  // Build unique images list STRICTLY from Admin uploaded trip.heroImage and trip.images
  const imagesList = (() => {
    const list: string[] = [];

    const heroNorm = normalizeImageUrl(trip.heroImage);
    if (heroNorm) list.push(heroNorm);

    if (trip.images && Array.isArray(trip.images)) {
      trip.images.forEach((img) => {
        const norm = normalizeImageUrl(img);
        if (norm && !list.includes(norm)) list.push(norm);
      });
    }

    if (list.length === 0) {
      list.push(heroImg);
    }

    return list;
  })();

  // Staggered automatic photo slider across Admin-uploaded photos
  useEffect(() => {
    if (imagesList.length <= 1) return;

    const intervalMs = 3500;
    const intervalId = setInterval(() => {
      setCurrentImgIdx((prev) => (prev + 1) % imagesList.length);
    }, intervalMs + ((index % 4) * 400));

    return () => clearInterval(intervalId);
  }, [imagesList.length, index]);

  const activePhotoIndex = currentImgIdx % imagesList.length;

  // Location Badge (e.g., HIMACHAL, LADAKH, UTTARAKHAND, KERALA)
  const locationBadge = (trip.location || "HIMACHAL").toUpperCase();

  // Compact Duration formatting (e.g. "9 D / 8 N")
  const durationText = (() => {
    if (!trip.duration) return "9 D / 8 N";
    let text = trip.duration;
    if (!text.includes("Night") && !text.includes("night") && !text.includes("N") && !text.includes("n")) {
      const daysMatch = text.match(/(\d+)\s*Days?/i);
      if (daysMatch) {
        const days = parseInt(daysMatch[1], 10);
        const nights = Math.max(1, days - 1);
        text = `${days} D / ${nights} N`;
      }
    } else {
      text = text
        .replace(/Days?/gi, "D")
        .replace(/Nights?/gi, "N")
        .replace(/(\d+)\s*D/gi, "$1 D")
        .replace(/(\d+)\s*N/gi, "$1 N")
        .replace(/\s*\/\s*/g, " / ");
    }
    return text;
  })();

  // Compact Ex-city location (Always formatted as "Ex. Chandigarh", "Ex. Cochin", "Ex. Ahmedabad", "Ex. Delhi")
  const exCity = (() => {
    let raw = "";
    if (trip.departureCity) {
      raw = trip.departureCity;
    } else if (trip.variants && trip.variants.length > 0 && trip.variants[0].location) {
      raw = trip.variants[0].location;
    } else {
      const titleLower = (trip.title || "").toLowerCase();
      const locLower = (trip.location || "").toLowerCase();
      if (locLower.includes("ladakh") || titleLower.includes("ladakh") || titleLower.includes("spiti")) {
        raw = "Delhi";
      } else if (locLower.includes("uttarakhand") || titleLower.includes("kedarkantha")) {
        raw = "Dehradun";
      } else if (locLower.includes("kerala")) {
        raw = "Cochin";
      } else {
        raw = "Ahmedabad";
      }
    }

    // Strip " to X", " To X", parenthetical details, and secondary cities
    let clean = raw
      .replace(/\s+to\s+.*$/i, "")
      .replace(/\s*\(.*?\)/g, "")
      .split("/")[0]
      .split("&")[0]
      .split(",")[0]
      .trim();

    return `Ex. ${clean}`;
  })();

  const title = trip.title || "Manali Kasol Amritsar Backpacking Trip";
  const tagline = (trip.description || "Get ready for an unforgettable...").replace(/<[^>]*>/g, '').trim();

  return (
    <div className={`trip-card group relative flex flex-col w-full hover:-translate-y-1.5 transition-all duration-300 ${className || ""}`}>

      {/* TOP FLOATING PHOTO CONTAINER WITH RICH DROP SHADOW */}
      <div
        className="relative z-20 w-full rounded-[26px] overflow-hidden bg-zinc-100 shadow-[0_16px_36px_rgba(0,0,0,0.22)] group-hover:shadow-[0_20px_44px_rgba(0,0,0,0.28)] transition-shadow duration-300"
        style={{ aspectRatio: "16/10.5" }}
      >
        <Link
          href={`/trips/${trip.slug}`}
          className="absolute inset-0 z-10"
          onClick={onClick}
          aria-label={`View ${title}`}
        />

        {/* AESTHETIC CROSSFADE PHOTO CAROUSEL */}
        {imagesList.map((imgUrl, imgIdx) => (
          <Image
            key={imgIdx}
            src={imgUrl}
            alt={title}
            fill
            className={`object-cover group-hover:scale-[1.04] transition-all duration-700 ease-in-out ${
              imgIdx === activePhotoIndex ? "opacity-100 z-0" : "opacity-0 -z-10"
            }`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={imgIdx === 0}
          />
        ))}

        {/* TOP LEFT BADGE */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none max-w-[85%]">
          <span className="inline-block bg-[#0a0f1d]/90 text-white font-montserrat font-semibold text-[9px] sm:text-[10px] tracking-wider uppercase px-3 py-1 rounded-full backdrop-blur-sm shadow-sm truncate max-w-full">
            {locationBadge}
          </span>
        </div>

        {/* BOTTOM PAGINATION DOTS FOR AESTHETIC AUTO-SLIDER */}
        {imagesList.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 pointer-events-auto">
            {imagesList.slice(0, 5).map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImgIdx(dotIdx);
                }}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  dotIdx === activePhotoIndex
                    ? "w-2.5 h-2.5 bg-white shadow-md scale-110"
                    : "w-1.5 h-1.5 bg-white/60 backdrop-blur-sm hover:bg-white/90"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* LOWER WHITE CARD CONTENT CONTAINER WITH GENEROUS SIDE WHITESPACE PADDING */}
      <div className="relative z-10 -mt-4 pt-6 pb-5 px-6 sm:px-7 mx-1 sm:mx-1.5 bg-white rounded-b-[26px] rounded-t-[16px] border border-zinc-200/80 shadow-[0_6px_24px_rgba(0,0,0,0.05)] flex flex-col flex-1 font-montserrat justify-between">
        <div>
          {/* META ROW: DURATION & EX-CITY */}
          <div className="flex items-center justify-between font-montserrat text-[12px] sm:text-[13px] font-normal text-[#666666] mb-2.5 gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{durationText}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0 ml-2">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{exCity}</span>
            </div>
          </div>

          {/* TITLE — MONTSERRAT EXTRA BOLD (800), 16-18PX, NAVY BLUE #0B1528 */}
          <div className="min-h-[46px] flex items-center mb-1">
            <h3 
              className="trip-card-title font-montserrat text-[16px] sm:text-[18px] leading-[1.35] line-clamp-2 group-hover:text-[#D4541A] transition-colors"
              style={{ fontWeight: 800, color: '#0B1528' }}
            >
              {title}
            </h3>
          </div>

          {/* TAGLINE — MONTSERRAT REGULAR (400), 13-14PX, #666666 */}
          <p className="font-montserrat text-[#666666] text-[13px] sm:text-[14px] font-normal line-clamp-1 mb-3.5">
            {tagline}
          </p>
        </div>

        <div className="mt-auto">
          {/* PRICE ROW — MONTSERRAT BOLD 700, 16-18PX, #D4541A */}
          <div className="flex items-baseline gap-1.5 mb-2.5">
            <span className="font-montserrat text-[#D4541A] font-normal text-xs sm:text-sm">From</span>
            <span className="font-montserrat text-[#D4541A] font-bold text-[16px] sm:text-[18px] leading-none">
              ₹{price.toLocaleString("en-IN")}
            </span>
          </div>

          {/* VIEW TRIP LINK */}
          <Link
            href={`/trips/${trip.slug}`}
            onClick={onClick}
            className="inline-flex items-center gap-1.5 font-montserrat font-bold text-xs sm:text-[14px] text-[#1B2A4A] group-hover:text-[#D4541A] transition-colors"
          >
            <span>View Trip</span>
            <span className="text-[#D4541A] font-bold text-sm group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Clock, MapPin, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Trip } from "@/types";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";
import { WavyEdges } from "./ui/WavyEdges";
import { useTheme } from "@/components/DynamicThemeProvider";
import { useIsMobile } from "@/hooks/useIsMobile";
import TripCard from "./TripCard";
import { parseTripDate } from "@/lib/parseTripDate";

interface CommunityTripsProps {
  trips: Trip[];
  title?: string;
  titleSize?: string | number;
  titleWeight?: string | number;
  topLabel?: string;
  titleStyle?: 'standard' | 'boxed';
  subtitle?: string;
  months?: string[];
  tripIds?: string[];
  wavyEdges?: boolean;
  topColor?: string;
  bottomColor?: string;
}

export default function CommunityTrips({ 
  trips, 
  title = "Upcoming Community Trips",
  titleSize,
  titleWeight,
  topLabel,
  titleStyle = 'standard',
  subtitle,
  months: propMonths,
  tripIds = [],
  wavyEdges = false,
  topColor = "#ffffff",
  bottomColor = "#ffffff",
}: CommunityTripsProps) {
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // Filter trips by IDs first if provided
  const baseTrips = tripIds && tripIds.length > 0 
    ? trips.filter(t => tripIds.includes(t.id))
    : trips;

  // Generate dynamic months if none provided
  const dynamicMonths = Array.from(new Set(baseTrips.flatMap(t => {
    if (!t.availableDates) return [];
    try {
      const dates = typeof t.availableDates === 'string' ? JSON.parse(t.availableDates) : t.availableDates;
      return (dates || []).map((d: any) => {
        const dateStr = d.date || d;
        const date = parseTripDate(dateStr);
        if (!date) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Invalid trip date format for trip: ${t.id}, date: ${dateStr}`);
          }
          return null;
        }
        const mName = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const mYear = date.toLocaleString('en-US', { year: '2-digit' });
        return `${mName} '${mYear}`;
      }).filter(Boolean) as string[];
    } catch (e) { return []; }
  }))).sort((a, b) => {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const [ma, yaWithApostrophe] = a.split(" '");
    const [mb, ybWithApostrophe] = b.split(" '");
    if (yaWithApostrophe !== ybWithApostrophe) return yaWithApostrophe.localeCompare(ybWithApostrophe);
    return months.indexOf(ma) - months.indexOf(mb);
  });

  const displayMonths = (propMonths && propMonths.length > 0 
    ? propMonths 
    : (dynamicMonths.length > 0 ? dynamicMonths : ["APR '26", "MAY '26", "JUN '26", "JUL '26", "AUG '26", "SEP '26", "OCT '26"]))
    .map(m => {
      // Enhanced normalization: "JUNE 26" -> "JUN '26", "MAY 2025" -> "MAY '25"
      let normalized = m.trim().toUpperCase();
      
      // Match parts: [Month (3+ letters)] [Optional separator] [Year (2 or 4 digits)]
      const match = normalized.match(/^([A-Z]{3,10})[\s']*(20\d{2}|\d{2})$/);
      if (match) {
        const month = match[1].substring(0, 3);
        const year = match[2].length === 4 ? match[2].substring(2) : match[2];
        normalized = `${month} '${year}`;
      }
      
      return normalized;
    });

  const [activeMonth, setActiveMonth] = useState(displayMonths[0]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsMouseDown(true);
    isDraggingRef.current = false;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
    
    // Disable snapping and scroll instantly during active drag
    scrollRef.current.style.scrollSnapType = 'none';
    scrollRef.current.style.scrollBehavior = 'auto';
  };

  const handleMouseLeave = () => {
    if (!isMouseDown) return;
    setIsMouseDown(false);
    if (scrollRef.current) {
      scrollRef.current.style.scrollSnapType = 'x mandatory';
      scrollRef.current.style.scrollBehavior = 'smooth';
    }
  };

  const handleMouseUp = () => {
    if (!isMouseDown) return;
    setIsMouseDown(false);
    if (scrollRef.current) {
      scrollRef.current.style.scrollSnapType = 'x mandatory';
      scrollRef.current.style.scrollBehavior = 'smooth';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      isDraggingRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const overlayOpacity = theme?.cardOverlayDarkness != null ? theme.cardOverlayDarkness / 100 : 0.5;

  const reduceMotion = prefersReducedMotion || isMobile;

  const displayTitle = (!title || title.trim() === "" || title === "-" || title === "—") 
    ? "Upcoming Community Trips" 
    : title;

  const renderFormattedTitle = (rawTitle: string) => {
    const trimmed = rawTitle.trim();
    const words = trimmed.split(" ");
    if (words.length > 1) {
      const lastWord = words.pop();
      const rest = words.join(" ");
      return (
        <span className="font-extrabold whitespace-nowrap">
          <span className="text-[#082B5B]">{rest} </span>
          <span className="text-[#FF5B00]">{lastWord}</span>
        </span>
      );
    }
    return <span className="text-[#082B5B] font-extrabold whitespace-nowrap">{trimmed}</span>;
  };

  return (
    <div className="overflow-hidden section-wrapper bg-transparent relative max-md:!px-0">
      {wavyEdges && <WavyEdges color={topColor} position="top" />}
      
      <div className="max-w-[1440px] mx-auto relative px-4 md:px-2">
        {/* Header Section */}
        <div className="flex flex-col mb-5">
          {topLabel && (
            <span className="section-label">
              {topLabel}
            </span>
          )}
          
          <div className="flex flex-row items-center justify-between gap-4 mb-2">
            <div className={cn(
              "flex-1 min-w-0",
              titleStyle === 'boxed' && "p-4 md:px-10 md:py-8 rounded-[20px] md:rounded-[32px] border border-slate-200 bg-white shadow-sm max-w-fit"
            )}>
              <h2 
                className="section-heading force-single-line truncate whitespace-nowrap max-md:!text-[3.8vw] max-md:!leading-none"
                style={{ 
                  fontSize: isMobile 
                    ? undefined 
                    : (titleSize ? (isNaN(Number(titleSize)) ? titleSize : `${titleSize}px`) : undefined),
                  fontWeight: titleWeight ? titleWeight : undefined
                }}
              >
                {renderFormattedTitle(displayTitle)}
              </h2>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <Link href="/trips" className="flex items-center gap-2 text-navy font-bold hover:text-primary-orange transition-all group">
                <span className="text-xs md:text-sm capitalize tracking-wide font-bold">View All</span>
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-navy flex items-center justify-center text-white group-hover:bg-primary-orange transition-colors">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Month Pills */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6 pb-1">
          {displayMonths.map((m) => {
            const isActive = activeMonth === m;
            return (
              <button
                key={m}
                onClick={() => setActiveMonth(m)}
                className={`px-6 py-2.5 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                  isActive 
                  ? "bg-navy text-white border-navy shadow-sm" 
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-navy/20 hover:bg-zinc-50"
                }`}
              >
                {isActive && (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                )}
                {m}
              </button>
            );
          })}
        </div>

        {/* Trips Slider Wrapper */}
        <div className="relative group/slider px-0 md:px-4">
          {/* Left Arrow Button */}
          <button 
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white hover:bg-zinc-50 text-navy items-center justify-center shadow-lg border border-zinc-200/80 pointer-events-auto cursor-pointer transition-all hover:scale-105"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Scroll List Container */}
          <div 
            ref={scrollRef}
            className={cn(
              "flex gap-4 md:gap-[28px] overflow-x-auto no-scrollbar pb-6 select-none -mx-4 px-4 md:mx-0 md:px-10 scroll-pl-4 md:scroll-pl-0",
              isMouseDown ? "cursor-grabbing scroll-auto" : "cursor-grab snap-x snap-mandatory scroll-smooth"
            )}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            <AnimatePresence mode="wait">
              {baseTrips.filter(trip => {
                if (!activeMonth) return true;
                try {
                  const dates = typeof trip.availableDates === 'string' ? JSON.parse(trip.availableDates) : trip.availableDates;
                  return (dates || []).some((d: any) => {
                    const dateStr = d.date || d;
                    const date = parseTripDate(dateStr);
                    if (!date) return false;
                    const mName = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                    const mYear = date.toLocaleString('en-US', { year: '2-digit' });
                    const mStr = `${mName} '${mYear}`;
                    return mStr === activeMonth;
                  });
                } catch (e) { return false; }
              }).map((trip, i) => {
                return (
                  <motion.div
                    key={trip.id}
                    initial={reduceMotion ? false : { opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={reduceMotion ? { duration: 0 } : { delay: i * 0.05 }}
                    className="flex-none snap-start"
                    style={{ width: 'var(--card-width)' }}
                  >
                    <TripCard 
                      trip={trip} 
                      index={i} 
                      onClick={handleLinkClick}
                      activeMonth={activeMonth}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Right Arrow Button */}
          <button 
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-navy hover:bg-[#1E3A8A] text-white items-center justify-center shadow-lg pointer-events-auto cursor-pointer transition-all hover:scale-105"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {wavyEdges && <WavyEdges color={bottomColor} position="bottom" />}
    </div>
  );
}

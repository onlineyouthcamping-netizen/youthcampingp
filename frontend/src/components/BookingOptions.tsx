"use client";

import { useState, useEffect, useMemo } from "react";

import { Check, MapPin, ArrowRight, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { Trip } from "@/types";
import { normalizeImageUrl } from "@/lib/api";
import { useTripSelection } from "@/store/trip-selection";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { parseTripDate } from "@/lib/parseTripDate";
import { useTheme } from "@/components/DynamicThemeProvider";

interface BookingOptionsProps {
  trip: Trip;
  onDateSelect?: (date: string | null) => void;
  onVariantSelect?: (index: number) => void;
  onTravelSelect?: (index: number) => void;
  onRoomSelect?: (index: number) => void;
  onPriceChange?: (price: number) => void;
}

export default function BookingOptions({ 
  trip, 
  onDateSelect, 
  onVariantSelect, 
  onTravelSelect, 
  onRoomSelect, 
  onPriceChange
}: BookingOptionsProps) {
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedTravel, setSelectedTravel] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(0);

  const variants = useMemo(() => trip.variants || [], [trip.variants]);
  const travelOptions = useMemo(() => trip.travelOptions || [
    { label: "Non AC Sleeper Train", priceDelta: 0 },
    { label: "AC Sleeper Train", priceDelta: 2000 }
  ], [trip.travelOptions]);
  const roomOptions = useMemo(() => trip.roomOptions || [
    { label: "Quad", priceDelta: 0 },
    { label: "Triple", priceDelta: 1500 },
    { label: "Double", priceDelta: 3000 }
  ], [trip.roomOptions]);


  const { currentPrice, setCurrentPrice } = useTripSelection();

  useEffect(() => {
    const variant = variants[selectedVariant];
    const basePrice = variant?.discountedPrice || trip.price;
    const isDirectJoin = variant?.excludeTravel === true;
    const travelDelta = isDirectJoin ? 0 : (travelOptions[selectedTravel]?.priceDelta || 0);
    const roomDelta = roomOptions[selectedRoom]?.priceDelta || 0;
    
    const total = basePrice + travelDelta + roomDelta;
    
    if (total !== currentPrice) {
      onPriceChange?.(total);
      setCurrentPrice(total);
    }
  }, [selectedVariant, selectedTravel, selectedRoom, trip.price, onPriceChange, setCurrentPrice, currentPrice, variants, travelOptions, roomOptions]);

  const [activeMonth, setActiveMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { settings } = useTheme();

  // Group dates by month
  const groupedDates: Record<string, any[]> = {};
  (trip.availableDates || []).forEach(ad => {
    const d = parseTripDate(ad.date);
    if (!d) return;
    const month = d.toLocaleString('default', { month: 'long' });
    if (!groupedDates[month]) groupedDates[month] = [];
    groupedDates[month].push(ad);
  });

  const months = Object.keys(groupedDates);

  useEffect(() => {
    if (months.length > 0 && !activeMonth) {
      setActiveMonth(months[0]);
    }
  }, [months, activeMonth]);

  const phone = settings?.contactPhone || "99242 46267";
  const whatsappNumber = phone.replace(/\D/g, '');

  const handleWhatsAppBooking = () => {
    const selectedLocation = variants[selectedVariant]?.location || "";
    const message = encodeURIComponent(`Hi! I want to book the "${trip.title}" expedition from ${selectedLocation} starting at ₹${currentPrice.toLocaleString()}. Please help me with the booking.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const isDirectJoin = variants[selectedVariant]?.excludeTravel === true;

  return (
    <div className="space-y-6">
      {/* Unified Booking Box */}
      <section className="bg-white rounded-[20px] p-4 md:p-5 border border-zinc-100 shadow-sm space-y-6">
                {/* Starting Location Section - Horizontal Slide */}
        <div>
          <div className="flex flex-row overflow-x-auto no-scrollbar gap-[14px] pb-4 -mx-1 px-1 snap-x">
            {variants.map((v, i) => {
              const displayDuration = v.duration || trip.duration;
              return (
                <div 
                  key={i}
                  onClick={() => {
                    setSelectedVariant(i);
                    onVariantSelect?.(i);
                  }}
                  className={cn(
                    "min-w-[200px] md:min-w-[240px] bg-white rounded-[16px] overflow-hidden border-2 transition-all p-3 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.05)] snap-start flex flex-col justify-between",
                    selectedVariant === i ? "border-[#FF6B00]" : "border-[#E5E7EB] hover:border-zinc-300"
                  )}
                >
                  <div className="relative aspect-[4/3] rounded-[10px] overflow-hidden mb-3 w-full">
                    <OptimizedImage 
                      src={normalizeImageUrl(v.image) || "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6"} 
                      alt={v.location} className="absolute inset-0 w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <h3 className="text-[18px] font-semibold text-[#111827] line-clamp-2 leading-tight mb-2">
                      {v.location}
                    </h3>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[12px] font-semibold text-[#6B7280]">
                        ₹{v.discountedPrice?.toLocaleString()}/-
                      </span>
                      {displayDuration && (
                        <div className="flex items-center gap-1 text-[#6B7280] text-[12px]">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span className="font-semibold whitespace-nowrap">{displayDuration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-zinc-50" />

        {/* Travelling & Room Options Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {!isDirectJoin && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-navy">Travelling Options</h3>
              <div className="flex flex-wrap gap-2">
                {travelOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedTravel(i);
                      onTravelSelect?.(i);
                    }}
                    className={cn(
                      "relative px-4 py-2 rounded-lg border-2 text-xs font-medium transition-all",
                      selectedTravel === i 
                        ? "border-primary-orange text-primary-orange bg-primary-orange/5" 
                        : "border-zinc-100 text-zinc-400 hover:border-zinc-200"
                    )}
                  >
                    {opt.label}
                    {selectedTravel === i && (
                      <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary-orange rounded-full flex items-center justify-center">
                        <Check className="w-2 h-2 text-white stroke-[4]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={cn("space-y-4", isDirectJoin ? "md:col-span-2" : "")}>
            <h3 className="text-base font-semibold text-navy">Room Sharing</h3>
            <div className="flex flex-wrap gap-2">
              {roomOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedRoom(i);
                    onRoomSelect?.(i);
                  }}
                  className={cn(
                    "relative px-4 py-2 rounded-lg border-2 text-xs font-medium transition-all",
                    selectedRoom === i 
                      ? "border-primary-orange text-primary-orange bg-primary-orange/5" 
                      : "border-zinc-100 text-zinc-400 hover:border-zinc-200"
                  )}
                >
                  {opt.label}
                  {selectedRoom === i && (
                    <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary-orange rounded-full flex items-center justify-center">
                      <Check className="w-2 h-2 text-white stroke-[4]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-px bg-zinc-50" />

        {/* Dates Section */}
        <div className="space-y-6">
          <h2 className="text-base font-semibold text-navy">Departure Dates</h2>
          
          <div className="flex flex-wrap gap-2">
            {months.map((month) => (
              <button
                key={month}
                onClick={() => setActiveMonth(month)}
                className={cn(
                  "relative px-4 py-2 rounded-lg border-2 text-xs font-medium transition-all",
                  activeMonth === month 
                    ? "border-primary-orange text-primary-orange bg-primary-orange/5" 
                    : "border-zinc-100 text-zinc-400 hover:border-zinc-200"
                )}
              >
                {month}
                {activeMonth === month && (
                  <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary-orange rounded-full flex items-center justify-center">
                    <Check className="w-2 h-2 text-white stroke-[4]" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {(groupedDates[activeMonth] || []).map((ad, i) => {
              const parsedDate = parseTripDate(ad.date);
              const dateStr = parsedDate ? parsedDate.getDate().toString() : ad.date;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedDate(ad.date);
                    onDateSelect?.(ad.date);
                  }}
                  className={cn(
                    "w-9 h-9 rounded-full border flex items-center justify-center font-medium text-xs transition-all shadow-sm",
                    selectedDate === ad.date 
                      ? "border-primary-orange text-primary-orange bg-white scale-105" 
                      : "border-zinc-200 text-navy bg-white hover:border-zinc-300"
                  )}
                >
                  {dateStr}
                </button>
              );
            })}
          </div>

          <button 
            onClick={handleWhatsAppBooking}
            className="hidden md:block w-full py-3.5 bg-primary-orange text-white rounded-xl font-medium text-sm hover:bg-[#FF5B00]/90 transition-all shadow-lg shadow-orange-100 uppercase tracking-widest"
          >
             Book My Spot
          </button>

        </div>
      </section>
    </div>
  );
}

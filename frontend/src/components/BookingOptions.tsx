"use client";

import { useState, useEffect, useMemo } from "react";

import { Check, MapPin, ArrowRight, Plane, Train, BedDouble } from "lucide-react";
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

  const defaultVariants = useMemo(() => [
    {
      name: "Delhi Expedition",
      location: "Ex-Delhi",
      price: 15999,
      discountedPrice: 12999,
      image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=800"
    },
    {
      name: "Ahmedabad Expedition",
      location: "Ex-Ahmedabad",
      price: 17999,
      discountedPrice: 14999,
      image: "https://images.unsplash.com/photo-1605140885332-f4ad6071b03c?q=80&w=800"
    },
    {
      name: "Chandigarh Expedition",
      location: "Ex-Chandigarh",
      price: 14999,
      discountedPrice: 11999,
      image: "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=800"
    },
    {
      name: "Mumbai Expedition",
      location: "Ex-Mumbai",
      price: 18999,
      discountedPrice: 15999,
      image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=800"
    }
  ], []);

  const variants = useMemo(() => {
    if (trip.variants && trip.variants.length >= 3) {
      return trip.variants;
    }
    return defaultVariants;
  }, [trip.variants, defaultVariants]);

  const travelOptions = useMemo(() => trip.travelOptions || [
    { label: "Non AC Sleeper Train", priceDelta: 0 },
    { label: "3 AC Train", priceDelta: 2000 }
  ], [trip.travelOptions]);

  const roomOptions = useMemo(() => trip.roomOptions || [
    { label: "Quad Sharing", priceDelta: 0 },
    { label: "Triple Sharing", priceDelta: 1500 },
    { label: "Double Sharing", priceDelta: 3000 }
  ], [trip.roomOptions]);


  const { currentPrice, setCurrentPrice } = useTripSelection();

  useEffect(() => {
    const variant = variants[selectedVariant];
    const basePrice = variant?.discountedPrice ?? trip.price;
    const isDirectJoin = (variant as any)?.excludeTravel === true;
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

  const isDirectJoin = (variants[selectedVariant] as any)?.excludeTravel === true;

  return (
    <div className="space-y-6">
      {/* Unified Booking Box */}
      <section className="bg-white rounded-[20px] p-4 md:p-5 border border-zinc-100 shadow-sm space-y-6">
                {/* Starting Location Section - Horizontal Slide */}
        <div>
          <div className="flex flex-row overflow-x-auto no-scrollbar gap-[14px] pb-4 -mx-1 px-1 snap-x">
            {variants.map((v, i) => {
              const displayDuration = (v as any).duration || trip.duration;
              return (
                <div 
                  key={i}
                  onClick={() => {
                    setSelectedVariant(i);
                    onVariantSelect?.(i);
                  }}
                  className={cn(
                    "min-w-[200px] md:min-w-[240px] bg-white rounded-[16px] overflow-hidden border-2 transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.05)] snap-start flex flex-col justify-between",
                    selectedVariant === i ? "border-[#FF6B00]" : "border-[#E5E7EB] hover:border-zinc-300"
                  )}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-[14px]">
                    <OptimizedImage 
                      src={normalizeImageUrl(v.image) || "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6"} 
                      alt={v.location} className="absolute inset-0 w-full h-full object-cover" 
                    />
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <h3 className="text-[14px] sm:text-[15px] font-bold text-[#111827] line-clamp-2 leading-tight mb-2 font-montserrat">
                      {v.location}
                    </h3>
                    
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100">
                      <span className="text-[13px] font-bold text-[#FF6B00] font-montserrat">
                        ₹{v.discountedPrice?.toLocaleString()}/-
                      </span>
                      {displayDuration && (
                        <div className="flex items-center gap-1 text-[#6B7280] text-[11px] font-montserrat">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2.5">
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

        {/* Travel Options Section */}
        {!isDirectJoin && travelOptions.length > 0 && (
          <div className="space-y-2.5 pt-3 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-[#0B1528] font-montserrat flex items-center gap-1.5">
                <Train className="w-4 h-4 text-[#D4541A]" />
                <span>Travel Mode Option</span>
              </h3>
              <span className="text-[11px] text-zinc-500 font-semibold font-montserrat">
                {travelOptions[selectedTravel]?.label}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {travelOptions.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedTravel(idx);
                    onTravelSelect?.(idx);
                  }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border text-xs font-semibold font-montserrat transition-all cursor-pointer text-left",
                    selectedTravel === idx
                      ? "border-[#D4541A] bg-orange-50/40 text-[#0B1528] ring-1 ring-[#D4541A]"
                      : "border-zinc-200 text-zinc-600 bg-white hover:border-zinc-300"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                      selectedTravel === idx ? "border-[#D4541A] bg-[#D4541A]" : "border-zinc-300"
                    )}>
                      {selectedTravel === idx && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </div>
                    <span>{opt.label}</span>
                  </div>
                  {opt.priceDelta > 0 ? (
                    <span className="text-[#D4541A] font-extrabold text-[11px]">
                      +₹{opt.priceDelta.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-extrabold text-[10px] uppercase bg-emerald-50 px-1.5 py-0.5 rounded">
                      Included
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Room Sharing Options Section */}
        {roomOptions.length > 0 && (
          <div className="space-y-2.5 pt-3 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-[#0B1528] font-montserrat flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-[#D4541A]" />
                <span>Room Sharing Option</span>
              </h3>
              <span className="text-[11px] text-zinc-500 font-semibold font-montserrat">
                {roomOptions[selectedRoom]?.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {roomOptions.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedRoom(idx);
                    onRoomSelect?.(idx);
                  }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border text-xs font-semibold font-montserrat transition-all cursor-pointer text-left",
                    selectedRoom === idx
                      ? "border-[#D4541A] bg-orange-50/40 text-[#0B1528] ring-1 ring-[#D4541A]"
                      : "border-zinc-200 text-zinc-600 bg-white hover:border-zinc-300"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                      selectedRoom === idx ? "border-[#D4541A] bg-[#D4541A]" : "border-zinc-300"
                    )}>
                      {selectedRoom === idx && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </div>
                    <span>{opt.label}</span>
                  </div>
                  {opt.priceDelta > 0 ? (
                    <span className="text-[#D4541A] font-extrabold text-[11px]">
                      +₹{opt.priceDelta.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-extrabold text-[10px] uppercase bg-emerald-50 px-1.5 py-0.5 rounded">
                      Base
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

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

          {/* View All Dates Button (Matching Reference Screenshot) */}
          <button 
            onClick={() => {}}
            className="w-full py-2.5 px-4 border border-[#D4541A] text-[#0B1528] bg-white rounded-xl font-bold text-xs hover:bg-orange-50/30 transition-all font-montserrat flex items-center justify-center gap-2 cursor-pointer shadow-2xs mt-4"
          >
            <svg className="w-4 h-4 text-[#D4541A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            View All Dates
          </button>

        </div>
      </section>
    </div>
  );
}

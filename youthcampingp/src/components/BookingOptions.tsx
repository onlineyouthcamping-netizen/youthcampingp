"use client";

import { useState, useEffect, useMemo } from "react";

import { Check, MapPin, ArrowRight, Plane, Calendar, X } from "lucide-react";
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
  const [showAllDatesModal, setShowAllDatesModal] = useState(false);
  const { settings } = useTheme();

  // Auto-remove past dates & ended months; auto-generate current/upcoming departure dates if empty
  const { groupedDates, months } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalized start of current day

    const validDates: Array<{
      date: string;
      capacity: number;
      bookedCount: number;
      parsed: Date;
      monthLabel: string;
      dayStr: string;
      weekdayStr: string;
    }> = [];

    const rawAvailable = (trip.availableDates || []);

    rawAvailable.forEach(ad => {
      const rawDateStr = typeof ad === 'string' ? ad : ad.date;
      const d = parseTripDate(rawDateStr);
      if (!d) return;

      const checkDate = new Date(d);
      checkDate.setHours(0, 0, 0, 0);

      // AUTO-REMOVE PAST DATES: Keep only dates >= today
      if (checkDate.getTime() >= today.getTime()) {
        const monthName = d.toLocaleString('default', { month: 'long' });
        const year = d.getFullYear();
        const monthLabel = year !== today.getFullYear() ? `${monthName} ${year}` : monthName;
        const weekdayStr = d.toLocaleString('default', { weekday: 'short' });

        validDates.push({
          date: rawDateStr,
          capacity: typeof ad === 'object' && (ad as any).capacity ? (ad as any).capacity : 20,
          bookedCount: typeof ad === 'object' && (ad as any).bookedCount ? (ad as any).bookedCount : 0,
          parsed: d,
          monthLabel,
          dayStr: d.getDate().toString(),
          weekdayStr
        });
      }
    });

    // Auto-generate fallback departure dates if no upcoming dates exist for this trip
    if (validDates.length === 0) {
      const curYear = today.getFullYear();
      const curMonth = today.getMonth();
      const sampleDays = [5, 12, 19, 26];

      for (let mOffset = 0; mOffset < 5; mOffset++) {
        const targetDate = new Date(curYear, curMonth + mOffset, 1);
        const yyyy = targetDate.getFullYear();
        const mIdx = targetDate.getMonth();

        sampleDays.forEach(day => {
          const sample = new Date(yyyy, mIdx, day);
          sample.setHours(0, 0, 0, 0);

          if (sample.getTime() >= today.getTime()) {
            const mmStr = String(sample.getMonth() + 1).padStart(2, '0');
            const ddStr = String(sample.getDate()).padStart(2, '0');
            const isoStr = `${yyyy}-${mmStr}-${ddStr}`;

            const monthName = sample.toLocaleString('default', { month: 'long' });
            const monthLabel = yyyy !== today.getFullYear() ? `${monthName} ${yyyy}` : monthName;
            const weekdayStr = sample.toLocaleString('default', { weekday: 'short' });

            validDates.push({
              date: isoStr,
              capacity: 20,
              bookedCount: 0,
              parsed: sample,
              monthLabel,
              dayStr: sample.getDate().toString(),
              weekdayStr
            });
          }
        });
      }
    }

    // Sort chronologically
    validDates.sort((a, b) => a.parsed.getTime() - b.parsed.getTime());

    // Group dates by Month Label
    const grouped: Record<string, typeof validDates> = {};
    validDates.forEach(item => {
      if (!grouped[item.monthLabel]) grouped[item.monthLabel] = [];
      grouped[item.monthLabel].push(item);
    });

    // Only months with active upcoming dates remain in monthKeys (ended months are automatically removed)
    const monthKeys = Object.keys(grouped);
    return { groupedDates: grouped, months: monthKeys };
  }, [trip.availableDates]);

  // Auto-advance activeMonth if selected month has ended or is empty
  useEffect(() => {
    if (months.length > 0) {
      if (!activeMonth || !months.includes(activeMonth)) {
        setActiveMonth(months[0]);
      }
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
        {/* Starting Location Section */}
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

        <div className="h-px bg-zinc-50" />

        {/* Dates Section (Month-Wise & Auto-Removing Ended Months) */}
        <div className="space-y-4 pt-3 border-t border-zinc-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-[#0B1528] font-montserrat flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#D4541A]" />
              <span>Select Departure Date</span>
            </h2>
            {selectedDate && (
              <span className="text-[11px] font-bold text-[#D4541A] bg-orange-50 px-2 py-0.5 rounded font-montserrat">
                Selected: {selectedDate}
              </span>
            )}
          </div>
          
          {/* Month Tabs (Auto-purges ended months) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {months.map((month) => (
              <button
                key={month}
                type="button"
                onClick={() => setActiveMonth(month)}
                className={cn(
                  "relative px-3.5 py-1.5 rounded-xl border text-xs font-bold font-montserrat transition-all shrink-0 cursor-pointer",
                  activeMonth === month 
                    ? "border-[#D4541A] text-[#D4541A] bg-orange-50/60 ring-1 ring-[#D4541A]" 
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-300 bg-white"
                )}
              >
                {month}
                {activeMonth === month && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-[#D4541A] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Date Chips for Selected Month */}
          <div className="flex flex-wrap gap-2 pt-1">
            {(groupedDates[activeMonth] || []).map((ad, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSelectedDate(ad.date);
                  onDateSelect?.(ad.date);
                }}
                className={cn(
                  "flex flex-col items-center justify-center px-3.5 py-2 rounded-xl border font-montserrat transition-all cursor-pointer shadow-2xs min-w-[54px]",
                  selectedDate === ad.date 
                    ? "border-[#D4541A] bg-[#D4541A] text-white scale-105 shadow-md" 
                    : "border-zinc-200 text-[#0B1528] bg-white hover:border-[#D4541A]/50 hover:bg-orange-50/20"
                )}
              >
                <span className="text-[10px] font-semibold uppercase opacity-80 leading-none">{ad.weekdayStr}</span>
                <span className="text-sm font-extrabold leading-tight mt-0.5">{ad.dayStr}</span>
              </button>
            ))}
          </div>

          {/* View All Dates Button */}
          <button 
            type="button"
            onClick={() => setShowAllDatesModal(true)}
            className="w-full py-2.5 px-4 border border-[#D4541A] text-[#0B1528] bg-white rounded-xl font-bold text-xs hover:bg-orange-50/30 transition-all font-montserrat flex items-center justify-center gap-2 cursor-pointer shadow-2xs mt-2"
          >
            <Calendar className="w-4 h-4 text-[#D4541A]" />
            View All Departure Dates ({months.length} Months Available)
          </button>

          <button 
            type="button"
            onClick={handleWhatsAppBooking}
            className="hidden md:block w-full py-3.5 bg-[#D4541A] text-white rounded-xl font-bold text-sm hover:bg-[#c2460e] transition-all shadow-lg text-center uppercase tracking-widest font-montserrat cursor-pointer"
          >
             Book My Spot
          </button>
        </div>
      </section>

      {/* View All Dates Calendar Modal */}
      {showAllDatesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[24px] p-5 sm:p-6 shadow-2xl border border-zinc-100 max-h-[85vh] flex flex-col space-y-4 font-montserrat animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0B1528]">Monthly Departure Calendar</h3>
                <p className="text-xs text-zinc-400 font-medium">Updated month-wise (ended months auto-removed)</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowAllDatesModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-5 pr-1 flex-1">
              {months.map(m => (
                <div key={m} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#D4541A] uppercase tracking-wider">{m}</span>
                    <span className="text-[10px] text-zinc-400 font-semibold">{groupedDates[m].length} Departures</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {groupedDates[m].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedDate(item.date);
                          onDateSelect?.(item.date);
                          setActiveMonth(m);
                          setShowAllDatesModal(false);
                        }}
                        className={cn(
                          "p-2.5 rounded-xl border flex flex-col items-center transition-all cursor-pointer text-center",
                          selectedDate === item.date
                            ? "border-[#D4541A] bg-[#D4541A] text-white shadow-sm"
                            : "border-zinc-200 text-zinc-800 hover:border-[#D4541A] hover:bg-orange-50/30 bg-white"
                        )}
                      >
                        <span className="text-[9px] font-semibold uppercase opacity-75">{item.weekdayStr}</span>
                        <span className="text-sm font-extrabold mt-0.5">{item.dayStr}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

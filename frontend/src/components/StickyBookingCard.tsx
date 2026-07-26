"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useTripSelection } from "@/store/trip-selection";
import { Trip } from "@/types";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/DynamicThemeProvider";

interface StickyBookingCardProps {
  trip: Trip;
}

export default function StickyBookingCard({ trip }: StickyBookingCardProps) {
  const { currentPrice, setCurrentPrice } = useTripSelection();
  const { settings } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedTravel, setSelectedTravel] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(0);

  const travelOptions = trip.travelOptions && trip.travelOptions.length > 0 ? trip.travelOptions : [
    { label: "Non AC Sleeper", priceDelta: 0 },
    { label: "3 AC Train", priceDelta: 2000 }
  ];

  const roomOptions = trip.roomOptions && trip.roomOptions.length > 0 ? trip.roomOptions : [
    { label: "Quad Sharing (4 People)", priceDelta: 0 },
    { label: "Triple Sharing", priceDelta: 1500 },
    { label: "Double Sharing", priceDelta: 3000 }
  ];

  const basePrice = trip.price || 12999;
  const travelDelta = travelOptions[selectedTravel]?.priceDelta || 0;
  const roomDelta = roomOptions[selectedRoom]?.priceDelta || 0;
  const calculatedPrice = basePrice + travelDelta + roomDelta;

  useEffect(() => {
    setCurrentPrice(calculatedPrice);
  }, [calculatedPrice, setCurrentPrice]);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const phone = settings?.contactPhone || "99242 46267";
  const whatsappNumber = phone.replace(/\D/g, '');

  const handleWhatsAppBooking = () => {
    const travelLabel = travelOptions[selectedTravel]?.label || "Non AC Sleeper";
    const roomLabel = roomOptions[selectedRoom]?.label || "Quad Sharing";
    const message = encodeURIComponent(
      `Hi! I want to book the "${trip.title}" expedition.\n\n` +
      `📌 Package Config:\n` +
      `- Duration: ${trip.duration || "9 Days / 8 Nights"}\n` +
      `- Travel: ${travelLabel}\n` +
      `- Sharing: ${roomLabel}\n` +
      `- Total Price: ₹${calculatedPrice.toLocaleString()}/-\n\n` +
      `Please assist me with the booking.`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <>
      <div className="sticky top-[90px] space-y-4 hidden md:block pb-16">
        {/* Main Booking Card (Dark Navy Matching Reference Screenshot) */}
        <div className="bg-[#0B1528] rounded-[24px] overflow-hidden shadow-xl p-6 md:p-7 text-white border border-slate-800">
          <span className="text-zinc-400 font-bold text-xs uppercase tracking-wider block mb-2 font-montserrat">
            STARTING FROM
          </span>
          
          <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-1 font-montserrat flex items-baseline gap-2">
            ₹ {calculatedPrice.toLocaleString()}
          </div>
          
          <div className="text-zinc-400 text-xs font-normal mb-5 font-montserrat">
            per person + taxes
          </div>

          <div className="h-px bg-white/10 mb-5" />

          <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider mb-1 font-montserrat">
            CURRENT PACKAGE CONFIGURATION
          </p>
          <p className="text-white font-bold text-base mb-5 font-montserrat">
            {trip.duration || "9 Days / 8 Nights"}
          </p>

          <button 
            onClick={handleWhatsAppBooking}
            className="w-full py-4 bg-[#D4541A] text-white rounded-[16px] font-bold text-sm uppercase tracking-wide hover:bg-[#c2460e] transition-all shadow-lg text-center font-montserrat cursor-pointer active:scale-98 mb-3"
          >
            Book My Spot
          </button>

          <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-xs font-medium font-montserrat">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secure & Easy Booking
          </div>
        </div>

        {/* Travelling Options Card */}
        <div className="bg-white border border-zinc-100 rounded-[20px] p-5 shadow-xs">
          <h4 className="text-zinc-900 font-bold text-sm font-montserrat mb-3.5">Travelling Options</h4>
          <div className="grid grid-cols-2 gap-3">
            {travelOptions.map((opt, i) => (
              <button 
                key={i}
                onClick={() => setSelectedTravel(i)}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-xs font-bold text-center font-montserrat transition-all cursor-pointer relative",
                  selectedTravel === i 
                    ? "border-2 border-[#D4541A] text-[#D4541A] bg-orange-50/20 shadow-2xs" 
                    : "border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Room Sharing Card */}
        <div className="bg-white border border-zinc-100 rounded-[20px] p-5 shadow-xs">
          <h4 className="text-zinc-900 font-bold text-sm font-montserrat mb-3.5">Room Sharing</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setSelectedRoom(0)}
                className={cn(
                  "py-2.5 px-2 rounded-xl text-xs text-center font-montserrat transition-all cursor-pointer leading-tight",
                  selectedRoom === 0 
                    ? "border-2 border-[#D4541A] text-[#D4541A] font-bold bg-orange-50/20 shadow-2xs" 
                    : "border border-zinc-200 text-zinc-700 font-semibold hover:border-zinc-300 hover:bg-zinc-50"
                )}
              >
                Quad Sharing <span className="block text-[10px] opacity-80 font-normal">(4 People)</span>
              </button>
              <button 
                onClick={() => setSelectedRoom(1)}
                className={cn(
                  "py-2.5 px-2 rounded-xl text-xs text-center font-montserrat transition-all cursor-pointer flex items-center justify-center font-semibold",
                  selectedRoom === 1 
                    ? "border-2 border-[#D4541A] text-[#D4541A] font-bold bg-orange-50/20 shadow-2xs" 
                    : "border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                )}
              >
                Triple Sharing
              </button>
            </div>
            <button 
              onClick={() => setSelectedRoom(2)}
              className={cn(
                "w-full py-2.5 px-3 rounded-xl text-xs text-center font-montserrat transition-all cursor-pointer font-semibold",
                selectedRoom === 2 
                  ? "border-2 border-[#D4541A] text-[#D4541A] font-bold bg-orange-50/20 shadow-2xs" 
                  : "border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
              )}
            >
              Double Sharing
            </button>
          </div>
        </div>

        {/* Private Trips Available Card */}
        <div className="bg-white border border-zinc-100 rounded-[20px] p-5 shadow-xs">
          <h4 className="text-zinc-900 font-bold text-sm font-montserrat mb-0.5">Private Trips Available</h4>
          <p className="text-zinc-400 font-medium text-xs font-montserrat mb-4">for Group of 12+ Travellers</p>
          <button 
            onClick={handleWhatsAppBooking}
            className="w-full py-2.5 px-4 border border-zinc-200 rounded-xl text-xs font-bold text-[#0B1528] hover:bg-zinc-50 transition-all font-montserrat flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#D4541A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Request a Callback
          </button>
        </div>

        {/* Chat on WhatsApp Card */}
        <button
          onClick={handleWhatsAppBooking}
          className="w-full bg-white border border-zinc-100 rounded-[20px] p-4 shadow-xs flex items-center justify-center gap-3 text-sm font-bold text-[#0B1528] hover:bg-zinc-50 transition-all font-montserrat cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-2xs">
            <MessageCircle className="w-4.5 h-4.5 fill-current" />
          </div>
          Chat on WhatsApp
        </button>

        {/* Got Questions? Dark Navy Card */}
        <div className="bg-[#0B1528] rounded-[24px] p-6 text-white shadow-xl space-y-4 border border-slate-800">
          <h4 className="text-lg font-extrabold font-montserrat tracking-tight">Got Questions?</h4>
          <p className="text-zinc-400 text-xs font-montserrat leading-relaxed">
            We're here to help. Chat with our team for any queries.
          </p>

          <div className="space-y-2.5 pt-2">
            {[
              "Quick Responses",
              "Trip Customisation",
              "Transparent & Honest"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs font-bold text-white font-montserrat">
                <div className="w-4 h-4 rounded-full bg-[#D4541A] flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA Bar (Always Fixed at Bottom on Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-[999] md:hidden bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.12)] border-t border-zinc-200 px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col shrink-0">
            <span className="text-xl font-extrabold text-[#0B1528] leading-none font-montserrat">
              ₹ {calculatedPrice.toLocaleString()}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-zinc-400 line-through text-[11px] font-normal">₹ {(calculatedPrice + 3000).toLocaleString()}</span>
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">per person</span>
            </div>
          </div>
          <button 
            onClick={handleWhatsAppBooking}
            className="flex-1 max-w-[200px] h-12 min-h-[48px] bg-[#D4541A] text-white px-6 rounded-xl font-extrabold text-sm uppercase tracking-wider active:scale-95 transition-all shadow-md flex items-center justify-center font-montserrat"
          >
            Book Now
          </button>
        </div>
      </div>

    </>
  );
}

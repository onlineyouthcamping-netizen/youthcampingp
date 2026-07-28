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
  const { currentPrice } = useTripSelection();
  const { settings } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show mobile sticky bar only after scrolling 300px down
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Initial price if store is empty
  const displayPrice = currentPrice || trip.price;
  const phone = settings?.contactPhone || "99242 46267";
  const whatsappNumber = phone.replace(/\D/g, '');

  const handleWhatsAppBooking = () => {
    const message = encodeURIComponent(`Hi! I want to book the "${trip.title}" expedition starting at ₹${displayPrice.toLocaleString()}. Please help me with the booking.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <>
      <div className="sticky top-32 space-y-6 hidden md:block">
        {/* Main Booking Card */}
        <div className="bg-white border border-zinc-100 rounded-[40px] overflow-hidden shadow-2xl shadow-zinc-200/50">
          <div className="p-10">
            <div className="flex justify-between items-start mb-8">
              <span className="text-zinc-500 font-semibold text-xs uppercase tracking-wide">Starting from</span>
              <div className="text-right">
                <div className="text-3xl font-semibold tracking-wide text-navy mb-1 transition-all duration-300">₹ {displayPrice.toLocaleString()}</div>
                <div className="text-zinc-400 line-through font-normal text-sm decoration-2">₹ {(displayPrice + 3000).toLocaleString()}</div>
                <div className="text-[10px] font-normal text-zinc-400 uppercase tracking-wide mt-2">per person + taxes</div>
              </div>
            </div>

            <div className="h-px bg-zinc-100 mb-8" />

            <div className="text-center mb-8">
              <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wide mb-1">Current Package Configuration</p>
              <p className="text-navy font-semibold">{trip.duration}</p>
            </div>

            <button 
              onClick={handleWhatsAppBooking}
              className="w-full py-6 bg-primary-orange text-white rounded-[24px] font-medium uppercase text-sm tracking-widest hover:bg-[#FF5B00]/90 transition-all shadow-xl shadow-orange-100"
            >
              Book My Spot
            </button>
          </div>
        </div>

        {/* Private Trips Card */}
        <div className="bg-white border border-zinc-100 rounded-[35px] p-8 shadow-xl shadow-zinc-100/50">
           <h3 className="text-xl font-semibold text-navy mb-1">Private Trips Available</h3>
           <p className="text-zinc-400 text-xs font-normal mb-6">for Group of 2+ Travellers</p>
           <button 
             onClick={handleWhatsAppBooking}
             className="flex items-center gap-3 px-6 py-3 border border-zinc-200 rounded-xl text-xs font-medium uppercase tracking-widest text-zinc-500 hover:bg-zinc-50 transition-all"
           >
              <MessageCircle className="w-4 h-4" /> Request a Callback
           </button>
        </div>

        {/* WhatsApp Button */}
        <a 
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi! I'm interested in the ${trip.title} trip.`)}`} 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-6 bg-white border border-zinc-100 rounded-[24px] shadow-lg hover:bg-zinc-50 transition-all"
        >
           <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white fill-current" />
           </div>
           <span className="text-sm font-medium text-navy uppercase tracking-widest">Whatsapp</span>
        </a>
      </div>

      {/* Mobile Sticky CTA */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.06)] border-t border-zinc-100 transition-all duration-500 ease-in-out pb-[env(safe-area-inset-bottom)]",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      )}>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-2xl font-semibold tracking-wide text-navy leading-none">₹ {displayPrice.toLocaleString()}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-zinc-400 line-through text-xs font-normal">₹ {(displayPrice + 3000).toLocaleString()}</span>
              <span className="text-zinc-400 text-[10px] font-normal uppercase tracking-wide">per person</span>
            </div>
          </div>
          <button 
            onClick={handleWhatsAppBooking}
            className="bg-primary-orange text-white px-8 py-4 rounded-xl font-medium uppercase text-sm tracking-widest active:scale-95 transition-all shadow-lg shadow-orange-500/20"
          >
            Book Now
          </button>
        </div>
      </div>

    </>
  );
}

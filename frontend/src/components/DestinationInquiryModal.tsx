"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Users, Send, AlertCircle } from "lucide-react";
import { normalizeImageUrl, submitInquiry } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface DestinationInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: {
    id?: string;
    name: string;
    img: string;
    duration?: string;
    subtext?: string;
    availableDates?: string[];
  } | null;
  title?: string;
  description?: string;
  source?: string;
}

export default function DestinationInquiryModal({
  isOpen,
  onClose,
  destination,
  title,
  description,
  source = 'website_booking_button'
}: DestinationInquiryModalProps) {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    city: "",
    date: "",
    count: "",
    message: ""
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollLockCounter = useRef(0);

  useEffect(() => {
    if (isOpen) {
      scrollLockCounter.current += 1;
      document.body.style.overflow = "hidden";
      // Prefill date if available
      if (destination?.availableDates && destination.availableDates.length > 0) {
        const firstDate = destination.availableDates[0];
        // Format date string from YYYY-MM-DD or similar to YYYY-MM-DD if possible
        try {
          const d = new Date(firstDate);
          if (!isNaN(d.getTime())) {
            const formattedDate = d.toISOString().split('T')[0];
            setFormData(prev => ({ ...prev, date: formattedDate }));
          }
        } catch (e) {
          // ignore formatting errors
        }
      }
    } else {
      setIsSuccess(false);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      scrollLockCounter.current -= 1;
      if (scrollLockCounter.current <= 0) {
        document.body.style.overflow = "";
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, destination, onClose]);

  const modalTitle = title || "Plan Your Next Trip";
  const modalDescription = description || "Connect with our destination experts";

  if (!mounted || !destination) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Append city to message for database compatibility
      const formattedMessage = formData.city
        ? `City: ${formData.city}${formData.message ? `\nMessage: ${formData.message}` : ""}`
        : formData.message;

      const result = await submitInquiry({
        name: formData.name,
        phone: formData.mobile,
        email: formData.email,
        date: formData.date || (destination.availableDates?.[0] || undefined),
        count: formData.count ? parseInt(formData.count) : undefined,
        message: formattedMessage,
        tripId: destination?.id,
        tripTitle: destination?.name,
        source: source
      });

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => onClose(), 2000); // Close after 2 seconds
      } else {
        setError(result.message || "Failed to submit inquiry. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full md:w-full md:max-w-5xl rounded-t-[32px] rounded-b-none md:rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh] md:max-h-[88vh]"
          >
            {/* Clean Close Button */}
            <button 
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 md:top-5 md:right-5 w-9 h-9 md:w-10 md:h-10 rounded-full bg-transparent hover:bg-zinc-100 text-zinc-800 md:bg-zinc-900/80 md:hover:bg-zinc-900 md:text-white flex items-center justify-center transition-all z-[110] focus:outline-none cursor-pointer md:border md:border-white/20"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 md:w-5 md:h-5 text-zinc-800 md:text-white" />
            </button>

            {/* Left side: Image & Info - Hidden on mobile to prevent layout/keyboard overflow */}
            <div className="relative w-full md:w-1/2 h-64 md:h-auto hidden md:block">
              <OptimizedImage 
                src={normalizeImageUrl(destination.img)} 
                alt={destination.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <p className="text-sm font-bold capitalize tracking-widest mb-2 opacity-90">
                  {destination.duration || "Custom Itinerary"}
                </p>
                <h2 className="text-3xl md:text-5xl font-bold mb-2 tracking-tighter capitalize italic leading-[0.9]">
                  {destination.name} Highlights
                </h2>
                <p className="text-sm font-medium opacity-80">
                  {destination.subtext || "Curated experiences and local exploration"}
                </p>
              </div>
            </div>

            {/* Right side: Form */}
            <div className="w-full md:w-1/2 p-5 sm:p-6 md:p-10 overflow-y-auto bg-white flex flex-col justify-start md:justify-center scrollbar-thin">
              {/* Mobile-only Header */}
              <div className="flex md:hidden items-center gap-3.5 mb-5 pr-8">
                <div className="w-14 h-14 rounded-[18px] overflow-hidden shrink-0 bg-zinc-100">
                  <OptimizedImage 
                    src={normalizeImageUrl(destination.img)} 
                    alt={destination.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[17px] font-extrabold text-zinc-900 leading-tight tracking-tight line-clamp-1 capitalize">
                    {destination.name}
                  </h4>
                  <span className="text-xs text-zinc-500 font-medium block mt-0.5">
                    Plan your next trip
                  </span>
                  {destination.duration && (
                    <span className="text-[10px] font-bold text-zinc-400 block mt-0.5 uppercase tracking-wider">
                      {destination.duration}
                    </span>
                  )}
                </div>
              </div>

              <div className="hidden md:block mb-4 md:mb-6 pr-6">
                <h3 className="text-2xl md:text-3xl font-bold text-navy tracking-tighter leading-none mb-2 italic capitalize">{modalTitle}</h3>
                <p className="text-zinc-400 font-bold text-xs capitalize tracking-widest">{modalDescription}</p>
              </div>

              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
                    <Send className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-bold text-navy mb-1.5 capitalize italic tracking-tighter">Request Received!</h4>
                  <p className="text-zinc-500 font-bold text-sm font-montserrat">Our expert will reach out to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3 md:space-y-3.5">
                  {error && (
                    <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-red-600 text-xs font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                  <div>
                    <input
                      required
                      type="text"
                      placeholder="Your Name"
                      className="w-full px-5 py-3 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-primary-orange focus:ring-0 outline-none transition-all font-bold text-sm placeholder:text-zinc-300 h-11 md:h-12"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2.5 px-4 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-100 focus-within:border-primary-orange focus-within:ring-0 transition-all h-11 md:h-12">
                    <span className="text-zinc-400 font-bold text-sm select-none shrink-0 border-r border-zinc-200/80 pr-2.5">
                      +91
                    </span>
                    <input
                      required
                      type="tel"
                      placeholder="Mobile No."
                      className="flex-1 bg-transparent border-0 focus:ring-0 outline-none transition-all font-bold text-sm placeholder:text-zinc-300 p-0 h-full w-full"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    />
                  </div>

                  <div>
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      className="w-full px-5 py-3 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-primary-orange focus:ring-0 outline-none transition-all font-bold text-sm placeholder:text-zinc-300 h-11 md:h-12"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <input
                      required
                      type="text"
                      placeholder="City of Residence"
                      className="w-full px-5 py-3 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-primary-orange focus:ring-0 outline-none transition-all font-bold text-sm placeholder:text-zinc-300 h-11 md:h-12"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none z-10" />
                      <input
                        required
                        type="date"
                        className="w-full pl-9 pr-2 sm:pl-10 sm:pr-3 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-primary-orange focus:ring-0 outline-none transition-all font-bold text-xs sm:text-sm text-zinc-700 h-11 md:h-12 [color-scheme:light]"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div className="relative">
                      <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none z-10" />
                      <input
                        required
                        type="number"
                        placeholder="Travellers"
                        className="w-full pl-9 pr-3 sm:pl-10 sm:pr-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-primary-orange focus:ring-0 outline-none transition-all font-bold text-xs sm:text-sm placeholder:text-zinc-300 h-11 md:h-12"
                        value={formData.count}
                        onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <textarea
                      placeholder="Message (optional)"
                      rows={2}
                      className="w-full px-5 py-3 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-primary-orange focus:ring-0 outline-none transition-all font-bold text-sm placeholder:text-zinc-300 resize-none"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full py-3.5 md:py-4 bg-primary-orange text-white rounded-xl sm:rounded-2xl font-bold text-base md:text-lg capitalize tracking-tighter shadow-xl hover:bg-primary-orange/90 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:scale-100 mt-1"
                  >
                    {isSubmitting ? "Connecting..." : "Connect with Expert"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

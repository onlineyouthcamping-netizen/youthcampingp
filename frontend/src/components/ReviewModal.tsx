"use client";

import React, { useEffect } from "react";
import { X, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Review } from "@/types";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
}

export default function ReviewModal({ isOpen, onClose, review }: ReviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!review) return null;

  const initials = review.userName ? review.userName.charAt(0).toUpperCase() : "U";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content - clean simple layout for both mobile and desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-[420px] bg-white rounded-[32px] p-6 shadow-2xl overflow-hidden flex flex-col z-10"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-50 text-zinc-950 hover:text-black hover:scale-110 transition-all"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Header: User Profile Info */}
            <div className="flex items-center gap-3 pr-8">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-100 flex-shrink-0 flex items-center justify-center text-navy font-bold text-xl border-2 border-white shadow-md">
                {review.userImage ? (
                  <OptimizedImage 
                    src={normalizeImageUrl(review.userImage)} 
                    alt={review.userName} 
                    className="w-full h-full object-cover" 
                  />
                ) : initials}
              </div>
              <div className="text-left">
                <h3 className="font-extrabold text-navy text-[17px] leading-tight capitalize">
                  {review.userName}
                </h3>
                <p className="text-[12px] font-medium text-zinc-400 capitalize mt-0.5">
                  {review.tripName || "Adventure Trip"}
                </p>
              </div>
            </div>

            {/* 5 Gold Rating Stars */}
            <div className="flex gap-0.5 mt-4 mb-3 justify-start">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < (review.rating || 5) ? "fill-[#fbbf24] text-[#fbbf24]" : "text-zinc-200 fill-zinc-200"}`} 
                />
              ))}
            </div>

            {/* Review Comment Body */}
            <div className="text-left">
              <p className="text-zinc-700 text-[14px] leading-relaxed font-normal whitespace-pre-wrap">
                {review.comment}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

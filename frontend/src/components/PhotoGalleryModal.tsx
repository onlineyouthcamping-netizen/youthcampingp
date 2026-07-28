"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { normalizeImageUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripTitle?: string;
  heroImage?: string;
  images?: string[];
  itinerary?: {
    day: number;
    title: string;
    photos: string[];
  }[];
}

export default function PhotoGalleryModal({
  isOpen,
  onClose,
  tripTitle,
  heroImage,
  images,
  itinerary
}: PhotoGalleryModalProps) {
  const [activeTab, setActiveTab] = useState<string>("Trip");
  const [errorImages, setErrorImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const tripPhotos = [heroImage, ...(images || [])].filter((p): p is string => Boolean(p));
  
  const tabs = [
    { id: "Trip", label: "Trip", photos: tripPhotos.map(p => p.split('|')[0]) },
    ...(itinerary || []).map(day => ({
      id: `Day ${day.day}`,
      label: `Day ${day.day}`,
      photos: (day.photos || []).map(p => p.split('|')[0])
    })).filter(tab => tab.photos.length > 0)
  ];

  const currentPhotos = tabs.find(t => t.id === activeTab)?.photos || [];

  const handleImageError = (photoUrl: string) => {
    setErrorImages(prev => ({ ...prev, [photoUrl]: true }));
  };

  const FALLBACK = "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=2070";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-0 z-[10000] bg-white flex flex-col"
      >
        {/* Minimal Header */}
        <header className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-zinc-100 bg-white sticky top-0 z-10">
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-[#0B1528]" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-[#0B1528] truncate font-montserrat">
              {tripTitle}
            </h2>
            <p className="text-[11px] text-zinc-400 font-medium font-montserrat">
              {currentPhotos.length} photo{currentPhotos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4.5 h-4.5 text-zinc-400" />
          </button>
        </header>

        {/* Minimal Tab Pills */}
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 px-4 sm:px-6 py-2.5 bg-zinc-50/80 border-b border-zinc-100/60">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-1.5 rounded-full font-semibold text-[13px] whitespace-nowrap transition-all cursor-pointer font-montserrat",
                activeTab === tab.id 
                  ? "bg-[#0B1528] text-white shadow-sm" 
                  : "bg-white text-zinc-500 border border-zinc-200/80 hover:border-zinc-300 hover:text-zinc-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Photo Grid — Clean Masonry-style */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 no-scrollbar bg-zinc-50/40">
          {currentPhotos.length > 0 && (
            <div className="columns-2 sm:columns-3 gap-2.5 max-w-5xl mx-auto pb-10">
              {currentPhotos.map((photo, i) => (
                <motion.div
                  key={`${activeTab}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  className="relative mb-2.5 rounded-xl overflow-hidden bg-zinc-100 group break-inside-avoid"
                >
                  <OptimizedImage
                    src={errorImages[photo] ? FALLBACK : (normalizeImageUrl(photo) || FALLBACK)}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    width={600}
                    height={400}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {currentPhotos.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
              <Camera className="w-8 h-8 mb-2" />
              <p className="text-sm font-medium font-montserrat">No photos available</p>
            </div>
          )}
        </main>
      </motion.div>
    </AnimatePresence>
  );
}

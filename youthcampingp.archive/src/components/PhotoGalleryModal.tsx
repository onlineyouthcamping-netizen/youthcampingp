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
  tripTitle: string;
  heroImage: string;
  images: string[];
  itinerary: {
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

  const tripPhotos = [heroImage, ...images].filter(Boolean);
  
  const tabs = [
    { id: "Trip", label: "Trip", photos: tripPhotos.map(p => p.split('|')[0]) },
    ...itinerary.map(day => ({
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
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white sticky top-0 z-10">
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-navy" />
          </button>
          <h2 className="text-lg font-bold text-navy text-center flex-1 truncate mx-4">
            {tripTitle}
          </h2>
          <div className="w-10" />
        </header>

        <div className="flex overflow-x-auto no-scrollbar gap-2 px-6 py-4 bg-white border-b border-zinc-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all border-2",
                activeTab === tab.id 
                  ? "bg-navy text-white border-navy shadow-lg" 
                  : "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <main className="flex-1 overflow-y-auto p-4 no-scrollbar">
          {currentPhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 max-w-5xl mx-auto pb-10">
              {currentPhotos.map((photo, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative aspect-square rounded-[24px] overflow-hidden shadow-md bg-zinc-100 group"
                >
                  <OptimizedImage
                    src={errorImages[photo] ? FALLBACK : (normalizeImageUrl(photo) || FALLBACK)}
                    alt={`Photo ${i}`}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </motion.div>
              ))}
            </div>
          )}
        </main>


      </motion.div>
    </AnimatePresence>
  );
}

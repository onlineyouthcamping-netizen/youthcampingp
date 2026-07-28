"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Home, Coffee, Maximize2, MapPin, X } from "lucide-react";
import { normalizeImageUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface AccommodationGallery {
  url: string;
  category: string;
}

interface Accommodation {
  name: string;
  location: string;
  nights: string;
  type: string;
  starRating: string;
  roomType: string;
  meals: string;
  image: string;
  gallery: AccommodationGallery[];
}

interface StaySectionProps {
  accommodations: Accommodation[];
}

export default function StaySection({ accommodations }: StaySectionProps) {
  const [selectedStay, setSelectedStay] = useState<Accommodation | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    if (!selectedStay) return ["All"];
    const cats = new Set(selectedStay.gallery?.map(img => img.category) || []);
    return ["All", ...Array.from(cats).filter(c => c !== "All")];
  }, [selectedStay]);

  const filteredImages = useMemo(() => {
    if (!selectedStay) return [];
    if (activeCategory === "All") return selectedStay.gallery || [];
    return selectedStay.gallery.filter(img => img.category === activeCategory);
  }, [selectedStay, activeCategory]);

  if (!accommodations || accommodations.length === 0) return null;

  return (
    <section className="relative">
      <div className="bg-white border border-zinc-100 rounded-[40px] p-10 md:p-14 shadow-sm relative">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-bold text-navy capitalize">Stay Options</h2>
        </div>
        
        <div className="flex flex-nowrap md:grid md:grid-cols-2 lg:grid-cols-4 gap-8 overflow-x-auto pb-6 md:pb-0 scroll-mt-32 no-scrollbar">
          {accommodations.map((stay, i) => (
            <div 
              key={i} 
              className="group cursor-pointer shrink-0 w-[260px] md:w-auto"
              onClick={() => {
                setSelectedStay(stay);
                setActiveCategory("All");
              }}
            >
              <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden mb-4 shadow-md">
                <OptimizedImage 
                  src={normalizeImageUrl(stay.image) || "https://images.unsplash.com/photo-1566073771259-6a8506099945"} 
                  alt={stay.name} 
                  cloudinaryWidth={600}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-navy text-sm capitalize">{stay.name}</h3>
                  <span className="text-[9px] font-bold text-primary-orange capitalize">{stay.nights}</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium capitalize tracking-widest">{stay.type} • {stay.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gallery Modal */}
      <AnimatePresence>
        {selectedStay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
          >
            <div className="absolute inset-0 bg-navy/95 backdrop-blur-xl" onClick={() => setSelectedStay(null)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-7xl h-full max-h-[90vh] bg-white rounded-[40px] overflow-hidden flex flex-col shadow-2xl shadow-black/50"
            >
              {/* Modal Header */}
              <div className="p-8 md:p-10 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl md:text-3xl font-bold text-navy capitalize italic">{selectedStay.name}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold capitalize tracking-widest text-zinc-400">
                    <span>{selectedStay.type}</span>
                    <span>•</span>
                    <span>{selectedStay.roomType}</span>
                    <span>•</span>
                    <span>{selectedStay.meals}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-6 py-2.5 rounded-full text-[10px] font-bold capitalize tracking-widest transition-all whitespace-nowrap ${
                        activeCategory === cat 
                          ? "bg-primary-orange text-white shadow-lg shadow-primary-orange/20" 
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setSelectedStay(null)}
                  className="absolute top-8 right-8 md:relative md:top-0 md:right-0 w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-destructive hover:text-white transition-all group"
                >
                  <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
                </button>
              </div>

              {/* Modal Content - Scrollable Gallery */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-zinc-50/50">
                {filteredImages.length > 0 ? (
                  <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                    {filteredImages.map((img, idx) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={`${img.url}-${idx}`}
                        className="relative rounded-[24px] overflow-hidden group shadow-lg"
                      >
                        <OptimizedImage 
                          src={normalizeImageUrl(img.url)} 
                          alt={`${selectedStay.name} - ${img.category}`} 
                          cloudinaryWidth={1200}
                          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                           <span className="text-[10px] font-bold text-white capitalize tracking-widest bg-primary-orange px-3 py-1.5 rounded-full">
                              {img.category}
                           </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                    <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center">
                      <Maximize2 className="w-8 h-8 text-zinc-300" />
                    </div>
                    <p className="text-zinc-400 font-bold capitalize text-xs tracking-widest">No photos in this category</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}


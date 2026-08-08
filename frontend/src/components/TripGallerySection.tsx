"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { normalizeImageUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import PhotoGalleryModal from "./PhotoGalleryModal";

import { Trip } from "@/types";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface TripGallerySectionProps {
  trip: Trip;
}

export default function TripGallerySection({ trip }: TripGallerySectionProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [errorImages, setErrorImages] = useState<Record<number, boolean>>({});

  const displayImages = [trip.heroImage, ...(trip.images || [])]
    .filter(Boolean)
    .slice(0, 5);

  // Fallback images - High-quality Manali/Himalayan themed
  const fallbacks = [
    "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=2070", // Solang Balloons
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070", // Snow Peaks
    "https://images.unsplash.com/photo-1605140885332-f4ad6071b03c?q=80&w=2070", // Jogini Falls
    "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?q=80&w=2070", // Mall Road
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070", // Lakeside
  ];

  const finalImages = [...displayImages];
  while (finalImages.length < 5) {
    finalImages.push(fallbacks[finalImages.length]);
  }

  const handleImageError = (index: number) => {
    setErrorImages((prev) => ({ ...prev, [index]: true }));
  };

  const totalPhotos = (trip.images?.length || 0) + (trip.heroImage ? 1 : 0);

  return (
    <>
      <div className="w-full mb-6 md:mb-8 relative z-0 clear-both">
        {/* Mobile: Single hero image with floating badge */}
        <div
          className="relative md:hidden w-full aspect-[16/10] rounded-[20px] overflow-hidden cursor-pointer shadow-lg bg-zinc-100"
          onClick={() => setIsGalleryOpen(true)}
        >
          <OptimizedImage
            src={
              errorImages[0]
                ? fallbacks[0]
                : normalizeImageUrl(finalImages[0]) || fallbacks[0]
            }
            alt={trip.title}
            priority={true}
            cloudinaryWidth={1200}
            className="w-full h-full object-cover"
          />
          {/* Floating photo count badge */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsGalleryOpen(true);
            }}
            className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md border border-zinc-100"
          >
            <ImageIcon className="w-3.5 h-3.5 text-primary-orange" />
            <span className="text-[10px] font-bold capitalize tracking-widest text-navy">
              {totalPhotos}+ Photos
            </span>
          </button>
        </div>

        {/* Desktop: Multi-image grid with 7:5 split (object-top prevents top image cropping) */}
        <div className="hidden md:grid md:grid-cols-12 gap-3.5 h-[400px] lg:h-[450px] w-full bg-white p-0 overflow-hidden rounded-[20px]">
          {/* Main Large Image (Left 7 Cols) */}
          <div
            className="relative col-span-7 h-full cursor-pointer overflow-hidden group/item rounded-[16px] lg:rounded-[20px] shadow-sm bg-zinc-100"
            onClick={() => setIsGalleryOpen(true)}
          >
            <OptimizedImage
              src={
                errorImages[0]
                  ? fallbacks[0]
                  : normalizeImageUrl(finalImages[0]) || fallbacks[0]
              }
              alt={trip.title}
              priority={true}
              cloudinaryWidth={1400}
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover/item:scale-103"
            />

            {/* Location Pill Badge (Top Left) */}
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-[#0B1528]/85 text-white font-montserrat font-bold text-[11px] tracking-wider uppercase px-3.5 py-1.5 rounded-full shadow-md backdrop-blur-md">
                {trip.location || "HIMACHAL PRADESH"}
              </span>
            </div>

            {/* View All Photos Button (Bottom Right of main photo) */}
            <div className="absolute bottom-4 right-4 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsGalleryOpen(true);
                }}
                className="bg-white/95 text-[#0B1528] hover:bg-white font-montserrat font-bold text-xs tracking-wide px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all border border-zinc-200/80 active:scale-95 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-[#D4541A]" />
                View All Photos
              </button>
            </div>
          </div>

          {/* Right 2x2 Grid (Right 5 Cols) */}
          <div className="col-span-5 grid grid-cols-2 grid-rows-2 gap-3.5 h-full">
            {finalImages.slice(1, 5).map((img, i) => {
              const idx = i + 1;
              return (
                <div
                  key={i}
                  className="relative cursor-pointer overflow-hidden group/item w-full h-full rounded-[14px] lg:rounded-[18px] shadow-sm bg-zinc-100"
                  onClick={() => setIsGalleryOpen(true)}
                >
                  <OptimizedImage
                    src={
                      errorImages[idx]
                        ? fallbacks[idx]
                        : normalizeImageUrl(img) || fallbacks[idx]
                    }
                    alt=""
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover/item:scale-104"
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover/item:bg-transparent transition-colors duration-300" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <PhotoGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        tripTitle={trip.title}
        heroImage={trip.heroImage}
        images={trip.images}
        itinerary={trip.itinerary || []}
      />
    </>
  );
}

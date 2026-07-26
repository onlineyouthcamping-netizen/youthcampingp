"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { Review } from "@/types";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface TripReviewsProps {
  reviews?: Review[];
}

const defaultPhotoReviews = [
  {
    id: "pr1",
    userName: "Bhumit Rabadiya",
    tripName: "Manali & Solang Valley",
    rating: 5,
    comment: "Thank you for crafting a trip that perfectly matched our style and interests. Your attention to detail and trip captain support made all the difference!",
    photo: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300"
  },
  {
    id: "pr2",
    userName: "Janak Chauhan",
    tripName: "Spiti & Chhitkul Expedition",
    rating: 5,
    comment: "Just few weeks back I took the trip to Spiti Valley & Chhitkul with YouthCamping and believe me I had an amazing expedition of a lifetime!",
    photo: "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=1200",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300"
  },
  {
    id: "pr3",
    userName: "Priya & Friends",
    tripName: "Kasol & Parvati Valley",
    rating: 5,
    comment: "The bonfire nights, riverfront camping, and café crawls in Kasol were out of this world. Super safe for solo travelers too!",
    photo: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300"
  }
];

export default function TripReviews({ reviews }: TripReviewsProps) {
  const displayList = (reviews && reviews.length > 0) ? reviews.map((r, i) => ({
    id: r.id || r._id || `r-${i}`,
    userName: r.userName || "Happy Traveler",
    tripName: (r as any).userLocation || "Himalayan Expedition",
    rating: r.rating || 5,
    comment: r.comment || "An incredible experience from start to finish!",
    photo: defaultPhotoReviews[i % defaultPhotoReviews.length].photo,
    avatar: r.userImage || defaultPhotoReviews[i % defaultPhotoReviews.length].avatar
  })) : defaultPhotoReviews;

  return (
    <section className="space-y-6 scroll-mt-28" id="reviews">
      {/* Header System */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-100 pb-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0B1528] tracking-tight uppercase font-montserrat leading-none">
            WHAT <span className="text-[#D4541A]">TRAVELERS SAY</span>
          </h2>
        </div>

        <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs font-montserrat shrink-0 pb-1">
          <span>5.0</span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" />
            ))}
          </div>
          <span className="text-zinc-400 font-normal ml-1">(500+ Verified Reviews)</span>
        </div>
      </div>

      {/* Visual Photo Review Cards (Horizontal 1.5 Cards Peek Slider on Mobile) */}
      <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 overflow-x-auto no-scrollbar py-2 scroll-smooth snap-x snap-mandatory touch-pan-x flex-nowrap sm:flex-wrap">
        {displayList.map((item) => (
          <div key={item.id} className="flex-none snap-start w-[58vw] min-w-[195px] max-w-[230px] sm:w-auto h-full flex flex-col">
            <VisualReviewCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}

function VisualReviewCard({ item }: { item: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const comment = item.comment || "";
  const isLong = comment.length > 110;
  const displayedText = isExpanded || !isLong ? comment : comment.slice(0, 110) + "...";
  const ratingCount = Math.min(5, Math.max(1, Number(item.rating) || 5));

  return (
    <div className="bg-white rounded-[20px] overflow-hidden border border-zinc-200/90 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group h-full">
      <div>
        {/* Top Full-Bleed Photo */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
          <OptimizedImage 
            src={normalizeImageUrl(item.photo)} 
            alt={item.tripName} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        {/* Rating Stars & Comment */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-0.5 text-amber-400">
            {[...Array(ratingCount)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current stroke-amber-400" />
            ))}
          </div>

          <p className="text-xs sm:text-sm font-bold text-zinc-900 font-montserrat leading-relaxed">
            {displayedText}
          </p>

          {isLong && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] font-semibold text-zinc-400 hover:text-[#D4541A] transition-colors font-montserrat cursor-pointer block"
            >
              {isExpanded ? "Show less" : "Read more..."}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Profile Footer */}
      <div className="px-5 pb-5 pt-1 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden shadow-xs shrink-0 border border-zinc-100">
          <OptimizedImage 
            src={normalizeImageUrl(item.avatar)} 
            alt={item.userName} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <h4 className="font-extrabold text-xs sm:text-sm text-[#0B1528] font-montserrat truncate leading-snug">
            {item.userName}
          </h4>
          <p className="text-[11px] font-medium text-zinc-400 font-montserrat truncate">
            {item.tripName}
          </p>
        </div>
      </div>
    </div>
  );
}

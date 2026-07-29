"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, ExternalLink, Camera, X } from "lucide-react";
import { Review } from "@/types";
import { normalizeImageUrl } from "@/lib/api";

interface TripReviewsProps {
  reviews?: Review[];
}

const MOCK_HOMEPAGE_REVIEWS = [
  {
    id: "gr1",
    name: "Kathan Patel",
    badge: "Joined Group Trip",
    tripName: "Spiti Valley Bike Trip",
    date: "1 month ago",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    comment: "I travelled with YouthCamping Spiti Valley Bike Trip this June first week. My experience was very thrilling with them. The management was super awesome. Marshal Abhinav and Dhruvil sir were extremely supportive throughout!",
    rating: 5,
    photos: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80",
      "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=600&q=80",
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80",
    ],
  },
  {
    id: "gr2",
    name: "Bhumit Rabadiya",
    badge: "Joined Group Trip",
    tripName: "Thailand Explorer Exp",
    date: "2 weeks ago",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
    comment: "Thank you for crafting a trip that perfectly matched our style and interests. Your attention to detail made all the difference! Will definitely book another trip soon.",
    rating: 5,
    photos: [
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
    ],
  },
  {
    id: "gr3",
    name: "Janak Chauhan",
    badge: "Joined Group Trip",
    tripName: "Hampta Pass Trek",
    date: "3 weeks ago",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    comment: "Just few weeks back I took the trip to Spiti Valley with YouthCamping and believe me I had an amazing expedition of a lifetime. The captains were top class!",
    rating: 5,
    photos: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=600&q=80",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80",
    ],
  },
];

export default function TripReviews({ reviews }: TripReviewsProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);

  const displayList = (reviews && reviews.length > 0) ? reviews.map((r: any, idx: number) => {
    const fallback = MOCK_HOMEPAGE_REVIEWS[idx % MOCK_HOMEPAGE_REVIEWS.length];
    const coverPhotos = (r.photos && r.photos.length >= 2) 
      ? r.photos 
      : (r.photo ? [r.photo, fallback.photos[1], fallback.photos[2]] : fallback.photos);

    return {
      id: r._id || r.id || `r-${idx}`,
      name: r.userName || fallback.name,
      badge: r.tripType || fallback.badge,
      tripName: r.tripName || r.city || fallback.tripName,
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : fallback.date,
      avatar: r.userImage || fallback.avatar,
      comment: r.comment || fallback.comment,
      rating: r.rating || 5,
      photos: coverPhotos,
    };
  }) : MOCK_HOMEPAGE_REVIEWS;

  return (
    <section className="space-y-6 scroll-mt-[140px] font-montserrat" id="reviews">
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
              <Star key={i} className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800]" />
            ))}
          </div>
          <span className="text-zinc-400 font-normal ml-1">(500+ Verified Reviews)</span>
        </div>
      </div>

      {/* Homepage Style Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 py-2">
        {displayList.map((rev) => (
          <div
            key={rev.id}
            className="w-full bg-white border border-zinc-200/80 rounded-[28px] overflow-hidden p-5 sm:p-6 pb-0 sm:pb-0 shadow-[0_6px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* USER HEADER ROW */}
              <div className="flex items-start gap-3.5 mb-3.5">
                <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full overflow-hidden shrink-0 border border-zinc-100 shadow-2xs">
                  <Image
                    src={normalizeImageUrl(rev.avatar) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"}
                    alt={rev.name}
                    fill
                    sizes="52px"
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-[#111827] text-[15px] sm:text-[16px] leading-tight font-montserrat capitalize truncate">
                      {rev.name}
                    </h3>
                  </div>

                  <p className="text-[#888888] font-medium text-[12px] sm:text-[13px] leading-tight">
                    {rev.badge}
                  </p>

                  <div className="flex items-center gap-1 mt-0.5 text-[12px] sm:text-[13px] text-[#777777]">
                    <span>Booked:</span>
                    <span className="font-bold text-[#111827] flex items-center gap-0.5 truncate hover:text-[#D4541A] transition-colors cursor-pointer">
                      {rev.tripName}
                      <ExternalLink className="w-3 h-3 text-[#111827] inline shrink-0" />
                    </span>
                  </div>
                </div>
              </div>

              {/* RATING STARS & DATE */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                    <Star key={i} className="w-[15px] h-[15px] fill-[#FFB800] text-[#FFB800]" />
                  ))}
                </div>
                <span className="text-[#777777] font-medium text-xs">
                  {rev.date}
                </span>
              </div>

              {/* REVIEW COMMENT TEXT */}
              <p className="text-[#1B2A4A] font-normal text-[13px] sm:text-[14px] leading-[1.55] line-clamp-4 mb-4 font-montserrat">
                {rev.comment}{" "}
                <button
                  onClick={() => setSelectedReview(rev)}
                  className="font-bold text-[#111827] hover:text-[#D4541A] transition-colors cursor-pointer inline"
                >
                  Read More
                </button>
              </p>
            </div>

            {/* ATTACHED 3-PHOTO GALLERY GRID */}
            {rev.photos && rev.photos.length >= 2 && (
              <div className="-mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-2 grid grid-cols-2 gap-1.5 overflow-hidden rounded-b-[27px] bg-zinc-100">
                {/* LEFT PORTRAIT PHOTO */}
                <div
                  onClick={() => setSelectedPhoto(rev.photos[0])}
                  className="relative aspect-[3/4] overflow-hidden bg-zinc-100 cursor-pointer group/img"
                >
                  <Image
                    src={normalizeImageUrl(rev.photos[0]) || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80"}
                    alt={`Review photo by ${rev.name}`}
                    fill
                    sizes="200px"
                    className="object-cover group-hover/img:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>

                {/* RIGHT 2 LANDSCAPE PHOTOS */}
                <div className="flex flex-col gap-1.5">
                  {rev.photos.slice(1, 3).map((imgUrl: string, pIdx: number) => (
                    <div
                      key={pIdx}
                      onClick={() => setSelectedPhoto(imgUrl)}
                      className="relative aspect-[16/9.5] overflow-hidden bg-zinc-100 cursor-pointer group/img flex-1"
                    >
                      <Image
                        src={normalizeImageUrl(imgUrl) || "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=600&q=80"}
                        alt={`Review photo ${pIdx + 2} by ${rev.name}`}
                        fill
                        sizes="200px"
                        className="object-cover group-hover/img:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Camera className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FULL-SCREEN PHOTO LIGHTBOX MODAL */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full">
            <Image
              src={normalizeImageUrl(selectedPhoto) || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80"}
              alt="Enlarged review photo"
              fill
              className="object-contain"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* READ MORE REVIEW MODAL */}
      {selectedReview && (
        <div
          onClick={() => setSelectedReview(null)}
          className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[85vh] overflow-y-auto space-y-4 relative border border-zinc-200 shadow-2xl"
          >
            <button
              onClick={() => setSelectedReview(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-2 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border border-zinc-100">
                <Image
                  src={normalizeImageUrl(selectedReview.avatar) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"}
                  alt={selectedReview.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-zinc-900">{selectedReview.name}</h3>
                <p className="text-xs font-bold text-[#D4541A]">Booked: {selectedReview.tripName}</p>
                <div className="flex items-center gap-1 mt-1 text-amber-500">
                  {[...Array(selectedReview.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800]" />
                  ))}
                  <span className="text-xs text-zinc-400 font-medium ml-1">{selectedReview.date}</span>
                </div>
              </div>
            </div>

            <p className="text-sm font-medium text-zinc-800 leading-relaxed pt-2">
              "{selectedReview.comment}"
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

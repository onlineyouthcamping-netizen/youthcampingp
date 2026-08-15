"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Camera,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWheelPassThrough } from "@/lib/useWheelPassThrough";

interface GoogleReviewItem {
  id: string;
  name: string;
  avatar: string;
  badge?: string;
  tripName: string;
  date: string;
  rating: number;
  comment: string;
  photos?: string[];
}

const MOCK_GOOGLE_REVIEWS: GoogleReviewItem[] = [
  {
    id: "gr1",
    name: "kathan patel",
    badge: "Joined Group Trip",
    tripName: "Spiti Valley Bike Trip",
    date: "1 month ago",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    comment:
      "I travelled with YouthCamping Spiti Valley Bike Trip this June first week. My experience was very thrilling with them. The management was super awesome. Marshal Abhinav and Dhruvil sir were extremely supportive throughout!",
    rating: 5,
    photos: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80", // Tall photo left
      "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=600&q=80", // Top right photo
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80", // Bottom right photo
    ],
  },
  {
    id: "gr2",
    name: "Bhumit Rabadiya",
    badge: "Joined Group Trip",
    tripName: "Thailand Explorer Expedition",
    date: "2 weeks ago",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
    comment:
      "Thank you for crafting a trip that perfectly matched our style and interests. Your attention to detail made all the difference! Will definitely book another trip soon.",
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
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    comment:
      "Just few weeks back I took the trip to Spiti Valley with YouthCamping and believe me I had an amazing expedition of a lifetime. The captains were top class!",
    rating: 5,
    photos: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=600&q=80",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80",
    ],
  },
  {
    id: "gr4",
    name: "Utsav Nathvani",
    badge: "Joined Group Trip",
    tripName: "Kedarkantha Winter Trek",
    date: "1 month ago",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    comment:
      "It won't be wrong to say YouthCamping is synonymous with great experiences. And it also won't be wrong to say that you can trust them blindly!",
    rating: 5,
    photos: [
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80",
    ],
  },
];

interface ReviewsSectionProps {
  reviews?: any[];
  title?: string;
}

export default function ReviewsSection({
  reviews,
  title,
}: ReviewsSectionProps) {
  const displayTitle =
    !title ||
    title === "New reviews" ||
    title === "Reviews" ||
    title.toLowerCase().includes("review")
      ? "What Travelers Say"
      : title;
  const scrollRef = useRef<HTMLDivElement>(null);
  useWheelPassThrough(scrollRef);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<GoogleReviewItem | null>(
    null,
  );
  const [expandedReviewIds, setExpandedReviewIds] = useState<string[]>([]);

  const toggleReviewExpand = (id: string) => {
    setExpandedReviewIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const apiMappedReviews: GoogleReviewItem[] =
    reviews && reviews.length > 0
      ? reviews.map((r: any, idx: number) => ({
          id: r._id || r.id || `gr-${idx}`,
          name: r.userName || r.name || MOCK_GOOGLE_REVIEWS[idx % 4].name,
          badge: r.tripType || r.badge || "Joined Group Trip",
          tripName:
            r.tripName || r.city || MOCK_GOOGLE_REVIEWS[idx % 4].tripName,
          date: r.createdAt
            ? new Date(r.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : MOCK_GOOGLE_REVIEWS[idx % 4].date,
          avatar: r.userImage || MOCK_GOOGLE_REVIEWS[idx % 4].avatar,
          comment: r.comment || MOCK_GOOGLE_REVIEWS[idx % 4].comment,
          rating: r.rating || 5,
          photos:
            r.photos && r.photos.length > 0
              ? r.photos
              : r.photo
                ? [r.photo]
                : MOCK_GOOGLE_REVIEWS[idx % 4].photos,
        }))
      : [];

  const displayReviews: GoogleReviewItem[] = apiMappedReviews;

  const nudge = (dir: "l" | "r") => {
    if (scrollRef.current) {
      const cardEl = scrollRef.current.firstElementChild as HTMLElement | null;
      const cardWidth = cardEl ? cardEl.offsetWidth : 320;
      const scrollAmount = cardWidth + 24;
      scrollRef.current.scrollBy({
        left: dir === "l" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="testimonials testimonials-slider module-center bg-white pt-3 pb-8 md:pt-4 md:pb-10 font-montserrat">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 md:px-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3 flex-nowrap">
          <h2 className="text-[#1B2A4A] font-montserrat font-black text-2xl sm:text-3xl md:text-4xl lg:text-[40px] tracking-tight capitalize leading-tight">
            {displayTitle}
          </h2>

          <Link
            href="/reviews"
            className="group inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-[15px] font-bold text-[#0B1528] hover:text-[#D4541A] transition-colors whitespace-nowrap shrink-0"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4541A] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* REVIEW CARDS HORIZONTAL SCROLL / GRID */}
        <div
          ref={scrollRef}
          className="carousel-track w-full max-w-full flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2 scroll-smooth snap-x snap-mandatory"
        >
          {displayReviews.map((rev, idx) => {
            const photoList = rev.photos || [];
            const extraCount = photoList.length > 3 ? photoList.length - 3 : 0;

            return (
              <motion.div
                key={rev.id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="flex-none snap-start w-[62vw] min-w-[220px] max-w-[270px] sm:w-[320px] md:w-[340px] bg-white border border-zinc-200/80 rounded-2xl overflow-hidden p-3.5 sm:p-5 pb-0 sm:pb-0 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* USER HEADER ROW */}
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 border border-zinc-100 shadow-2xs">
                      <Image
                        src={rev.avatar}
                        alt={rev.name}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <h3 className="font-bold text-[#0B1528] text-sm sm:text-base leading-tight font-montserrat capitalize">
                          {rev.name}
                        </h3>
                        {rev.badge && (
                          <span className="text-[#888888] font-medium text-[11px] sm:text-xs">
                            {rev.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-0.5 text-xs text-[#777777]">
                        <span>Booked:</span>
                        <span className="font-bold text-[#0B1528] flex items-center gap-0.5 truncate hover:text-[#D4541A] transition-colors cursor-pointer">
                          {rev.tripName}
                          <ExternalLink className="w-3 h-3 text-[#0B1528] inline shrink-0" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RATING STARS */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800]"
                        />
                      ))}
                    </div>
                    <span className="text-[#777777] font-medium text-[11px] sm:text-xs">
                      {rev.date}
                    </span>
                  </div>

                  {/* COMMENT & TOGGLE */}
                  <div className="mb-2.5">
                    <p
                      className={cn(
                        "text-[#1B2A4A] font-normal text-xs sm:text-sm leading-snug font-montserrat transition-all",
                        !expandedReviewIds.includes(rev.id) && "line-clamp-3",
                      )}
                    >
                      {rev.comment}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      {rev.comment && rev.comment.length > 80 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleReviewExpand(rev.id);
                          }}
                          className="font-bold text-xs text-[#D4541A] hover:underline cursor-pointer inline-flex items-center gap-0.5"
                        >
                          {expandedReviewIds.includes(rev.id)
                            ? "Show Less"
                            : "Read More"}
                        </button>
                      ) : <span />}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReview(rev);
                        }}
                        className="font-semibold text-[11px] text-zinc-400 hover:text-[#0B1528] cursor-pointer"
                      >
                        Full Story
                      </button>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC PHOTO GALLERY GRID */}
                {photoList.length > 0 && (
                  <div className="-mx-3.5 -mb-3.5 sm:-mx-4.5 sm:-mb-4.5 mt-2 overflow-hidden rounded-b-2xl bg-zinc-100">
                    {photoList.length === 1 ? (
                      /* SINGLE PHOTO */
                      <div
                        onClick={() => setSelectedPhoto(photoList[0])}
                        className="relative aspect-[16/10] overflow-hidden bg-zinc-100 cursor-pointer group/img"
                      >
                        <Image
                          src={photoList[0]}
                          alt={`Review photo by ${rev.name}`}
                          fill
                          sizes="400px"
                          className="object-cover group-hover/img:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : photoList.length === 2 ? (
                      /* 2 PHOTOS SIDE BY SIDE */
                      <div className="grid grid-cols-2 gap-1.5">
                        {photoList.map((imgUrl, pIdx) => (
                          <div
                            key={pIdx}
                            onClick={() => setSelectedPhoto(imgUrl)}
                            className="relative aspect-[4/3] overflow-hidden bg-zinc-100 cursor-pointer group/img"
                          >
                            <Image
                              src={imgUrl}
                              alt={`Review photo by ${rev.name}`}
                              fill
                              sizes="200px"
                              className="object-cover group-hover/img:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* 3+ PHOTOS MOSAIC GRID WITH +N OVERLAY */
                      <div className="grid grid-cols-2 gap-1.5">
                        <div
                          onClick={() => setSelectedPhoto(photoList[0])}
                          className="relative aspect-[3/4] sm:aspect-[3/3.8] overflow-hidden bg-zinc-100 cursor-pointer group/img"
                        >
                          <Image
                            src={photoList[0]}
                            alt={`Review photo by ${rev.name}`}
                            fill
                            sizes="200px"
                            className="object-cover group-hover/img:scale-105 transition-transform duration-500"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div
                            onClick={() => setSelectedPhoto(photoList[1])}
                            className="relative aspect-[16/9.5] overflow-hidden bg-zinc-100 cursor-pointer group/img flex-1"
                          >
                            <Image
                              src={photoList[1]}
                              alt={`Review photo 2 by ${rev.name}`}
                              fill
                              sizes="200px"
                              className="object-cover group-hover/img:scale-105 transition-transform duration-500"
                            />
                          </div>

                          <div
                            onClick={() => setSelectedPhoto(photoList[2])}
                            className="relative aspect-[16/9.5] overflow-hidden bg-zinc-100 cursor-pointer group/img flex-1"
                          >
                            <Image
                              src={photoList[2]}
                              alt={`Review photo 3 by ${rev.name}`}
                              fill
                              sizes="200px"
                              className="object-cover group-hover/img:scale-105 transition-transform duration-500"
                            />
                            {extraCount > 0 && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white font-extrabold text-xs sm:text-sm font-montserrat">
                                +{extraCount} More
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* PHOTO LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="relative max-w-4xl max-h-[85vh] w-full h-full">
              <Image
                src={selectedPhoto}
                alt="Enlarged review photo"
                fill
                className="object-contain"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/80 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL REVIEW MODAL */}
      <AnimatePresence>
        {selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedReview(null)}
            className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[32px] p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl"
            >
              <button
                onClick={() => setSelectedReview(null)}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4 mb-4">
                <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border border-zinc-200">
                  <Image
                    src={selectedReview.avatar}
                    alt={selectedReview.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#111827] text-lg capitalize">
                      {selectedReview.name}
                    </h4>
                    {selectedReview.badge && (
                      <span className="text-[#888888] font-medium text-sm">
                        {selectedReview.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-sm font-medium mt-0.5">
                    Booked:{" "}
                    <span className="font-bold text-[#111827]">
                      {selectedReview.tripName}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(selectedReview.rating || 5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-[#FFB800] text-[#FFB800]"
                    />
                  ))}
                </div>
                <span className="text-[#777777] text-xs font-medium">
                  {selectedReview.date}
                </span>
              </div>

              <p className="text-[#111827] font-normal text-base leading-relaxed mb-6">
                {selectedReview.comment}
              </p>

              {selectedReview.photos && selectedReview.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {selectedReview.photos.map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-[4/3] rounded-[18px] overflow-hidden bg-zinc-100"
                    >
                      <Image
                        src={img}
                        alt="Photo"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

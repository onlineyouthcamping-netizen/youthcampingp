"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, ArrowUpRight } from "lucide-react";
import { Review } from "@/types";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface TripReviewsProps {
  reviews: Review[];
}

const getRelativeTime = (dateStr: string) => {
  if (!dateStr) return "1 year ago";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "1 year ago";

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30.436875);
  const diffInYears = Math.floor(diffInDays / 365.2425);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? "1 minute ago" : `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  } else if (diffInDays < 7) {
    return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
  } else if (diffInWeeks < 4.3) {
    return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
  } else if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
  } else {
    return diffInYears <= 1 ? "1 year ago" : `${diffInYears} years ago`;
  }
};

export default function TripReviews({ reviews }: TripReviewsProps) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="relative">
      <div className="bg-white border border-zinc-100 rounded-[40px] p-10 md:p-14 shadow-sm">
        <div className="mb-10 animate-fade-in">
          <h2 className="text-2xl font-bold text-navy">Reviews</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id || review._id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowReadMore = review.comment && review.comment.length > 150;
  const displayedComment = isExpanded ? review.comment : (review.comment || "").slice(0, 150) + (shouldShowReadMore ? "... " : "");

  const defaultAvatar = review.userImage ? normalizeImageUrl(review.userImage) : null;
  const initials = review.userName ? review.userName.charAt(0).toUpperCase() : "U";

  const getAvatarColor = (name: string) => {
    // Google review avatar colors
    const colors = ["#1a73e8", "#ea4335", "#fbbc05", "#34a853", "#ab47bc", "#00acc1", "#ff7043"];
    const charCode = name ? name.charCodeAt(0) : 0;
    return colors[charCode % colors.length];
  };
  const avatarBg = getAvatarColor(review.userName);

  const relativeTime = getRelativeTime(review.createdAt);

  return (
    <div className="w-full bg-white border border-[#dadce0] rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Profile Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div 
            className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white font-bold text-[16px] shadow-sm"
            style={{ backgroundColor: avatarBg }}
          >
            {defaultAvatar ? (
              <OptimizedImage 
                src={defaultAvatar} 
                alt={review.userName} 
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          {/* Name & Booking Details (Google layout style with inline group trip subtext) */}
          <div className="min-w-0 flex-1 flex flex-col">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h4 className="text-[14px] md:text-[15px] font-bold text-[#202124] leading-tight truncate">
                {review.userName}
              </h4>
              <span className="text-[11px] md:text-[12px] text-[#5f6368] font-normal whitespace-nowrap">
                Joined Group Trip
              </span>
            </div>
            {review.tripName && (
              <div className="mt-1">
                <Link 
                  href="/trips" 
                  className="inline-flex items-center gap-0.5 text-[11px] md:text-[12px] text-[#5f6368] hover:text-[#1a73e8] transition-colors group"
                >
                  <span>Booked:</span>
                  <span className="font-bold text-[#202124] group-hover:text-[#1a73e8] transition-colors ml-1">{review.tripName}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#5f6368] group-hover:text-[#1a73e8] transition-colors" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Rating Stars and Time */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-[14px] h-[14px] ${i < (review.rating || 5) ? "fill-[#fbbc05] text-[#fbbc05]" : "fill-[#e8eaed] text-[#e8eaed]"}`} 
              />
            ))}
          </div>
          <span className="text-[11px] md:text-[12px] text-[#70757a]">
            {relativeTime}
          </span>
        </div>

        {/* Comment Text */}
        <p className="text-[#3c4043] text-[13px] md:text-[14px] leading-[1.5] font-normal mb-4">
          {displayedComment}
          {shouldShowReadMore && !isExpanded && (
            <button 
              onClick={() => setIsExpanded(true)}
              className="text-[#1a73e8] text-[13px] font-medium cursor-pointer hover:underline ml-1"
            >
              Read more
            </button>
          )}
        </p>
      </div>

      {/* 2x2 Photo Grid (matches screenshot) */}
      {review.photos && review.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {review.photos.slice(0, 4).map((photo, pIdx) => (
            <div key={pIdx} className="aspect-square rounded-[12px] overflow-hidden bg-zinc-50 border border-zinc-100">
              <OptimizedImage 
                src={normalizeImageUrl(photo)} 
                alt={`Review photo ${pIdx + 1}`} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

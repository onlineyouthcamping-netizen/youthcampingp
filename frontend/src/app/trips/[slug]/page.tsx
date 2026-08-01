import { fetchTripBySlug } from "@/lib/api";
import { notFound } from "next/navigation";
export const revalidate = 30;

import {
  Clock3, Mountain, Backpack, MountainSnow, ChevronLeft
} from "lucide-react";
import TripGallerySection from "@/components/TripGallerySection";
import TripSubNav from "@/components/TripSubNav";
import StickyBookingCard from "@/components/StickyBookingCard";
import TripDetailView from "@/components/TripDetailView";
import Link from "next/link";
import TripInquiryAutoTrigger from "@/components/TripInquiryAutoTrigger";

export default async function TripDetailPage({ params }: { params: Promise<{ slug: string }> }) {

  const { slug } = await params;
  const trip = await fetchTripBySlug(slug);

  if (!trip) {
    notFound();
  }

  const navSections = [
    { id: "about", label: "About" },
    { id: "itinerary", label: "Itinerary" },
    { id: "inclusions", label: "Inclusions" },
    { id: "highlights", label: "Highlights" },
    { id: "stay", label: "Stay" },
    { id: "reviews", label: "Reviews" },
    { id: "faqs", label: "FAQs" },
  ];

  return (
    <div className="bg-white min-h-screen font-montserrat pb-20 lg:pb-0">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-[84px] pb-8 space-y-4 md:space-y-6">
        {/* 1. Title Section (Top Full Width) */}
        <div>
          {(() => {
            const fullTitle = trip.title || "Manali Kasol Amritsar Backpacking Trip";
            const keywords = ["Backpacking Trip", "Road Trip", "Group Trip", "Backpacking", "Roadtrip", "Trek", "Expedition", "Tour", "Trip"];
            let main = fullTitle;
            let sub = "";
            for (const kw of keywords) {
              const idx = fullTitle.toLowerCase().lastIndexOf(kw.toLowerCase());
              if (idx > 0) {
                main = fullTitle.substring(0, idx).trim();
                sub = fullTitle.substring(idx).trim();
                break;
              }
            }
            if (!sub) {
              const words = fullTitle.split(" ");
              if (words.length > 1) {
                main = words.slice(0, -1).join(" ");
                sub = words[words.length - 1];
              }
            }
            return (
              <div>
                <h1 
                  style={{ fontWeight: 800, color: '#0B1528' }} 
                  className="text-[26px] sm:text-[34px] md:text-[40px] font-black tracking-tight leading-[1.15] font-montserrat"
                >
                  {main}
                </h1>
                {sub && (
                  <span className="font-caveat font-bold text-[#D4541A] text-[28px] sm:text-[36px] md:text-[42px] leading-tight block mt-0.5">
                    {sub}
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        {/* 2. Photo Gallery Grid (Full Width) */}
        <TripGallerySection trip={trip} />

        {/* 3. Quick Info Bar (Full Width) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:gap-8 gap-y-3 gap-x-4 py-3.5 border-y border-zinc-200/80 w-full">
          {[
            { label: "Duration", val: trip.duration || "9 Days / 8 Nights", icon: Clock3 },
            { 
              label: "Difficulty", 
              val: trip.difficulty ? (trip.difficulty.charAt(0).toUpperCase() + trip.difficulty.slice(1)) : "Easy to Moderate", 
              icon: Mountain 
            },
            { label: "Age Group", val: trip.ageLimit || "12-35 Years", icon: Backpack },
            { label: "Max Altitude", val: trip.maxAltitude || "10,000 ft", icon: MountainSnow },
          ].map((info, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <info.icon className="w-[18px] h-[18px] text-[#0B1528] stroke-[1.8] shrink-0" />
              <div className="min-w-0">
                <p className="text-[#0B1528] font-semibold text-[13px] sm:text-sm leading-tight font-montserrat truncate">{info.val}</p>
                <p className="text-zinc-400 font-medium text-[11px] leading-tight font-montserrat mt-0.5">{info.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Main 12-Column Layout Grid (Tab SubNav + Detailed View | Sidebar Booking Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pt-2">
          {/* Left Column (8 Cols): Tab SubNav & Detailed Section Content */}
          <div className="lg:col-span-8 space-y-6 min-w-0">
            <TripSubNav sections={navSections} />
            <TripDetailView trip={trip} />
          </div>

          {/* Right Column (4 Cols): Sticky Booking Sidebar */}
          <div className="lg:col-span-4 relative min-w-0">
            <StickyBookingCard trip={trip} />
          </div>
        </div>
      </div>
      <TripInquiryAutoTrigger trip={trip} />
    </div>
  );
}

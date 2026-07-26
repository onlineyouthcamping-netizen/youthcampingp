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
    { id: "faqs", label: "FAQs" },
    { id: "reviews", label: "Reviews" },
  ];

  return (
    <div className="bg-white min-h-screen font-montserrat pb-32 md:pb-0">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-[84px] pb-8">
        {/* Photo Gallery Grid on Top */}
        <TripGallerySection trip={trip} />

        {/* Main 12-Column Layout Grid (Matching Reference Screenshot Exactly) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mt-6 md:mt-8">
          {/* Left Column (8 Cols): Title, Quick Info, Tabs, & Content */}
          <div className="lg:col-span-8 space-y-4">
            {/* Title Section */}
            <div className="mb-2">
              <h1 className="text-2xl sm:text-3xl md:text-[36px] font-extrabold text-[#0B1528] tracking-tight leading-tight font-montserrat">
                {trip.title || "Manali Kasol Amritsar Backpacking Trip"}
              </h1>
            </div>

            {/* Quick Info Bar (2-Column Grid on Mobile, Flex Row on Desktop) */}
            <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-3 sm:gap-4 py-3.5 px-1 border-y border-zinc-100/90 w-full mb-3">
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
                <div key={i} className="flex items-center gap-2.5 sm:gap-3">
                  <info.icon className="w-5 h-5 text-[#0B1528] stroke-[1.8] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[#0B1528] font-bold text-xs sm:text-sm leading-tight font-montserrat truncate">{info.val}</p>
                    <p className="text-zinc-400 font-medium text-[11px] leading-tight font-montserrat mt-0.5">{info.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tab Navigation Bar */}
            <TripSubNav sections={navSections} />

            {/* Detailed Content Views (About, Itinerary, Inclusions, Stay, FAQs, Reviews) */}
            <TripDetailView trip={trip} />
          </div>

          {/* Right Column (4 Cols): Dark Navy Card, Travelling Options, Room Sharing */}
          <div className="lg:col-span-4">
            <StickyBookingCard trip={trip} />
          </div>
        </div>
      </div>
      <TripInquiryAutoTrigger trip={trip} />
    </div>
  );
}

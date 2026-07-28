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
    <div className="bg-white min-h-screen font-montserrat pb-20 lg:pb-0">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-[84px] pb-8">
        {/* Photo Gallery Grid on Top */}
        <TripGallerySection trip={trip} />

        {/* Main 12-Column Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 mt-4 md:mt-6">
          {/* Left Column (8 Cols): Title, Quick Info, Tabs, & Content */}
          <div className="lg:col-span-8 space-y-3">
            {/* Title Section */}
            <div>
              <h1 
                style={{ fontWeight: 600, color: '#0B1528' }} 
                className="text-[24px] sm:text-[30px] md:text-[36px] font-semibold tracking-tight leading-[1.2] font-montserrat"
              >
                {trip.title || "Manali Kasol Amritsar Backpacking Trip"}
              </h1>
            </div>

            {/* Quick Info Bar (2-Column Grid on Mobile, Flex Row on Desktop) */}
            <div className="grid grid-cols-2 sm:flex sm:items-center sm:gap-6 gap-y-3 gap-x-4 py-3 border-y border-zinc-200/80 w-full">
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

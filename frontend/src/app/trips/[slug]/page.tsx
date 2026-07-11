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
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-20 pb-20">
        {/* Photo Gallery on Top */}
        <TripGallerySection trip={trip} />

        {/* Title Section (Below Photo Gallery) */}
        <div className="mt-6 md:mt-8 mb-6 md:mb-10">
          <h1 className="text-2xl md:text-5xl font-bold text-black mb-2 md:mb-3 tracking-tighter leading-tight">
            <span className="text-black font-semibold">{trip.title || "Our Expedition"}</span>
          </h1>
        </div>

        <TripSubNav sections={navSections} />

        {/* Quick Info Bar - Open Grid Style */}
        <div className="flex flex-row overflow-x-auto no-scrollbar gap-x-8 md:gap-x-16 gap-y-4 mb-8 md:mb-20 py-5 md:py-8 border-y border-zinc-100 w-full">
          {[
            { label: "Duration", val: trip.duration || "9 Days", icon: Clock3 },
            { label: "Difficulty", val: trip.difficulty || "Moderate", icon: Mountain },
            { label: "Age Group", val: trip.ageLimit || "15-35 years", icon: Backpack },
            { label: "Max Altitude", val: trip.maxAltitude || "15,000 ft", icon: MountainSnow },
          ].map((info, i) => (
            <div key={i} className="flex items-center gap-2.5 md:gap-4 shrink-0">
              <div className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-black">
                <info.icon className="w-5 h-5 md:w-8 md:h-8" />
              </div>
              <div>
                <p className="text-zinc-500 font-bold text-sm md:text-lg leading-none mb-0.5 md:mb-1 whitespace-nowrap">{info.label}</p>
                <p className="text-zinc-400 font-medium text-xs md:text-base whitespace-nowrap">{info.val}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <TripDetailView trip={trip} />

          <div className="lg:col-span-4">
            <StickyBookingCard trip={trip} />
          </div>
        </div>
      </div>
      <TripInquiryAutoTrigger trip={trip} />
    </div>
  );
}

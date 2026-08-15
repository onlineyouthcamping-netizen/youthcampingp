"use client";

import { useState, useEffect } from "react";
import AboutTrip from "./AboutTrip";
import TripBookingSection from "./TripBookingSection";
import InclusionsExclusions from "./InclusionsExclusions";
import TripHighlightsList from "./TripHighlightsList";
import StaySection from "./StaySection";
import TripFAQ from "./TripFAQ";
import ReviewReels from "./ReviewReels";
import TripReviews from "./TripReviews";
import PopupDetails from "./PopupDetails";
import { Trip } from "@/types";

interface TripDetailViewProps {
  trip: Trip;
}

export default function TripDetailView({ trip }: TripDetailViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [trip.id]);

  return (
    <div className="lg:col-span-8 space-y-7 md:space-y-8 pt-2.5 md:pt-3">
      <div id="about" className="scroll-mt-[124px] md:scroll-mt-[128px]">
        <AboutTrip
          description={trip.description || ""}
          customAboutTrip={(trip as any).customSections?.aboutTrip}
        />
      </div>

      <div id="itinerary" className="scroll-mt-[124px] md:scroll-mt-[128px]">
        <TripBookingSection
          trip={trip}
          onDateSelect={(date) => setSelectedDate(date)}
        />
      </div>

      <div id="inclusions" className="scroll-mt-[124px] md:scroll-mt-[128px]">
        <InclusionsExclusions
          inclusions={trip.inclusions || []}
          exclusions={trip.exclusions || []}
        />
      </div>

      <div id="highlights" className="scroll-mt-[124px] md:scroll-mt-[128px]">
        <TripHighlightsList
          items={
            trip.highlights &&
            Array.isArray(trip.highlights) &&
            trip.highlights.length > 0
              ? trip.highlights
              : trip.gallery &&
                  Array.isArray(trip.gallery) &&
                  trip.gallery.length > 0
                ? trip.gallery
                : trip.images || []
          }
        />
      </div>

      {trip.accommodations &&
        Array.isArray(trip.accommodations) &&
        trip.accommodations.length > 0 && (
          <div id="stay" className="scroll-mt-[124px] md:scroll-mt-[128px]">
            <StaySection accommodations={trip.accommodations} />
          </div>
        )}

      <div id="reviews" className="scroll-mt-[124px] md:scroll-mt-[128px]">
        <TripReviews reviews={trip.reviews || []} />
      </div>

      <ReviewReels reels={trip.reels || []} />

      <div id="faqs" className="scroll-mt-[124px] md:scroll-mt-[128px]">
        <TripFAQ faqs={trip.faqs || []} />
      </div>

      <PopupDetails details={trip.popupDetails} startDate={selectedDate} />
    </div>
  );
}

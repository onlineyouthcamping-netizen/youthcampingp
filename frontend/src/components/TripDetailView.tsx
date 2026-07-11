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
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [trip.id]);

  return (
    <div className="lg:col-span-8 space-y-8 md:space-y-16">
      <div id="about">
        <AboutTrip description={trip.description || ""} />
      </div>
      
      <div id="itinerary">
        <TripBookingSection 
          trip={trip} 
          onDateSelect={(date) => setSelectedDate(date)}
        />
      </div>

      <div id="inclusions">
        <InclusionsExclusions 
          inclusions={trip.inclusions || []}
          exclusions={trip.exclusions || []}
        />
      </div>

      <div id="highlights" className="space-y-16">
        {trip.attractions && trip.attractions.length > 0 && (
          <TripHighlightsList title="Major Attractions" items={trip.attractions} />
        )}
        {trip.activities && trip.activities.length > 0 && (
          <TripHighlightsList title="Activities & Experiences" items={trip.activities} />
        )}
        {trip.highlights && trip.highlights.length > 0 && (
          <TripHighlightsList title="Trip Highlights" items={trip.highlights} />
        )}
      </div>

      <div id="stay">
        <StaySection accommodations={trip.accommodations || []} />
      </div>

      <div id="faqs">
        <TripFAQ faqs={trip.faqs || []} />
      </div>


      <ReviewReels reels={trip.reels || []} />
      
      <div id="reviews">
        <TripReviews reviews={trip.reviews || []} />
      </div>

      <PopupDetails details={trip.popupDetails} startDate={selectedDate} />
    </div>
  );
}

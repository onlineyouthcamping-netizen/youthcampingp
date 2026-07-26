"use client";

import { Check, X } from "lucide-react";

interface InclusionsExclusionsProps {
  inclusions?: string[];
  exclusions?: string[];
}

const defaultInclusions = [
  "All transfers by Tempo Traveller/Car",
  "Round trip train tickets as per your package",
  "Comfortable stays in hotel/Homestays on 3 & 4 sharing",
  "Bonfire, Music Party",
  "Veg food as mentioned above",
  "All sightseeing mentioned in itinerary",
  "Trip Captain",
  "24*7 Support throughout trip",
  "Sightseeing & \"Dher Saari Masti\"",
  "Toll, Parking and Transport Taxes"
];

const defaultExclusions = [
  "Additional accommodation/food costs incurred due to any",
  "Any cost arising due to natural calamities like landslides, road blocks etc. to be borne by the client directly on the spot",
  "Heater Charges, Tips, Pony Rides, Entry fee, snow suit rents, adventure activities, 4*4 Vehicle",
  "Personal Expense of any kind, anything not specifically mentioned under the head 'Includes'",
  "Any additional meals or stays other than mentioned in itinerary",
  "Inter railway station transfers are not included",
  "5% GST"
];

export default function InclusionsExclusions({ inclusions, exclusions }: InclusionsExclusionsProps) {
  const incList = inclusions && inclusions.length > 0 ? inclusions : defaultInclusions;
  const excList = exclusions && exclusions.length > 0 ? exclusions : defaultExclusions;

  return (
    <div className="space-y-6 scroll-mt-28" id="inclusions">
      {/* Header Section (Matching Reference Screenshot) */}
      <div>
        <h2 className="text-3xl sm:text-4xl font-black text-[#0B1528] tracking-tight uppercase font-montserrat leading-none">
          INCLUSIONS &
        </h2>
        <h2 className="text-3xl sm:text-4xl font-black text-[#D4541A] tracking-tight uppercase font-montserrat leading-none mt-1">
          EXCLUSIONS
        </h2>
        <div className="w-12 h-1 bg-[#D4541A] rounded-full my-3" />
        <p className="text-zinc-800 font-semibold text-sm sm:text-base font-montserrat leading-tight">
          We believe in Being transparent.
        </p>
        <p className="text-[#D4541A] font-semibold text-sm sm:text-base font-montserrat leading-tight mt-0.5">
          Here's what's Included and what's not.
        </p>
      </div>

      {/* 2 Side-by-Side Cards (Matching Reference Screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 pt-2">
        {/* Left Card: Inclusions */}
        <div className="bg-white border border-zinc-200/90 rounded-[20px] p-5 sm:p-6 shadow-2xs">
          <div className="divide-y divide-zinc-100">
            {incList.map((item, i) => (
              <div key={i} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 stroke-[2.5]" />
                <span className="text-xs sm:text-sm font-semibold text-zinc-700 font-montserrat leading-relaxed">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Exclusions */}
        <div className="bg-white border border-zinc-200/90 rounded-[20px] p-5 sm:p-6 shadow-2xs">
          <div className="divide-y divide-zinc-100">
            {excList.map((item, i) => (
              <div key={i} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3.5">
                <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5 stroke-[2.5]" />
                <span className="text-xs sm:text-sm font-semibold text-zinc-700 font-montserrat leading-relaxed">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  "Additional accommodation/food costs incurred due to any delays",
  "Any cost arising due to natural calamities like landslides, road blocks etc.",
  "Heater Charges, Tips, Pony Rides, Entry fee, snow suit rents, adventure activities",
  "Personal Expense of any kind, anything not specifically mentioned under Included",
  "Any additional meals or stays other than mentioned in itinerary",
  "Inter railway station transfers are not included",
  "5% GST"
];

export default function InclusionsExclusions({ inclusions, exclusions }: InclusionsExclusionsProps) {
  const [activeTab, setActiveTab] = useState<"inclusions" | "exclusions">("inclusions");

  const incList = inclusions && inclusions.length > 0 ? inclusions : defaultInclusions;
  const excList = exclusions && exclusions.length > 0 ? exclusions : defaultExclusions;

  return (
    <div className="space-y-4 scroll-mt-[140px]" id="inclusions">
      {/* Header System — Title + Tab Switcher inline */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl sm:text-2xl font-black text-[#0B1528] tracking-tight uppercase font-montserrat leading-none shrink-0">
          INCLUSIONS & <span className="text-[#D4541A]">EXCLUSIONS</span>
        </h2>

        {/* Segmented Tab Switcher */}
        <div className="flex p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("inclusions")}
            className={cn(
              "py-1.5 px-3 rounded-lg text-xs font-bold font-montserrat transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
              activeTab === "inclusions"
                ? "bg-white text-emerald-700 shadow-2xs font-extrabold"
                : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Included ({incList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("exclusions")}
            className={cn(
              "py-1.5 px-3 rounded-lg text-xs font-bold font-montserrat transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
              activeTab === "exclusions"
                ? "bg-white text-rose-700 shadow-2xs font-extrabold"
                : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Excluded ({excList.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-1">
        {/* Inclusions Card */}
        <div className={cn(
          "bg-white border border-zinc-200/90 rounded-[20px] overflow-hidden shadow-2xs flex flex-col",
          activeTab === "inclusions" ? "flex" : "hidden md:flex"
        )}>
          {/* Header Banner */}
          <div className="bg-[#ECFDF5] border-b border-emerald-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-900 font-montserrat">
                What's Included
              </span>
            </div>
            <span className="text-[11px] font-bold bg-white text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200/70 font-montserrat">
              {incList.length} Items
            </span>
          </div>

          {/* Items List */}
          <div className="p-3 sm:p-4 space-y-1 divide-y divide-zinc-100/80">
            {incList.map((item, i) => (
              <div key={i} className="py-2.5 px-2.5 first:pt-1 flex items-start gap-3 hover:bg-zinc-50/70 rounded-xl transition-colors">
                <div className="w-5 h-5 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#0B1528] font-montserrat leading-relaxed">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Exclusions Card */}
        <div className={cn(
          "bg-white border border-zinc-200/90 rounded-[20px] overflow-hidden shadow-2xs flex flex-col",
          activeTab === "exclusions" ? "flex" : "hidden md:flex"
        )}>
          {/* Header Banner */}
          <div className="bg-[#FFF1F2] border-b border-rose-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-rose-900 font-montserrat">
                What's Excluded
              </span>
            </div>
            <span className="text-[11px] font-bold bg-white text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200/70 font-montserrat">
              {excList.length} Items
            </span>
          </div>

          {/* Items List */}
          <div className="p-3 sm:p-4 space-y-1 divide-y divide-zinc-100/80">
            {excList.map((item, i) => (
              <div key={i} className="py-2.5 px-2.5 first:pt-1 flex items-start gap-3 hover:bg-zinc-50/70 rounded-xl transition-colors">
                <div className="w-5 h-5 rounded-full bg-rose-100/80 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#0B1528] font-montserrat leading-relaxed">
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

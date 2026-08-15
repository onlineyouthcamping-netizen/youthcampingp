"use client";

import { useState } from "react";
import { Check, X, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InclusionsExclusionsProps {
  inclusions?: any[];
  exclusions?: any[];
}

function getItemText(item: any): string {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    return item.text || item.name || item.title || item.description || "";
  }
  return String(item);
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
  'Sightseeing & "Dher Saari Masti"',
  "Toll, Parking and Transport Taxes",
];

const defaultExclusions = [
  "Additional accommodation/food costs incurred due to any delays",
  "Any cost arising due to natural calamities like landslides, road blocks etc.",
  "Heater Charges, Tips, Pony Rides, Entry fee, snow suit rents, adventure activities, 4*4 Vehicle charges",
  "Personal Expense of any kind, anything not specifically mentioned under head 'Includes'",
  "Any additional meals or stays other than mentioned in itinerary",
  "Inter railway station transfers are not included",
  "5% GST",
];

export default function InclusionsExclusions({
  inclusions,
  exclusions,
}: InclusionsExclusionsProps) {
  const [activeTab, setActiveTab] = useState<"inclusions" | "exclusions">(
    "inclusions",
  );

  const incList = inclusions || [];
  const excList = exclusions || [];

  return (
    <div className="space-y-2.5 scroll-mt-[140px]" id="inclusions">
      {/* Header System — Title + Tab Switcher inline */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-zinc-100/90 pb-2">
        <h2 className="text-xl sm:text-2xl font-black text-[#0B1528] tracking-tight font-montserrat leading-none shrink-0">
          Inclusions &{" "}
          <span className="text-[#D4541A] font-caveat italic">Exclusions</span>
        </h2>

        {/* Segmented Tab Switcher for Mobile Screens */}
        <div className="flex p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 shrink-0 md:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("inclusions")}
            className={cn(
              "py-1.5 px-3 rounded-lg text-xs font-bold font-montserrat transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
              activeTab === "inclusions"
                ? "bg-white text-emerald-700 shadow-2xs font-extrabold"
                : "text-zinc-500 hover:text-zinc-800",
            )}
          >
            <Check className="w-3.5 h-3.5 text-[#00C853] stroke-[3]" />
            <span>Included ({incList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("exclusions")}
            className={cn(
              "py-1.5 px-3 rounded-lg text-xs font-bold font-montserrat transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
              activeTab === "exclusions"
                ? "bg-white text-rose-700 shadow-2xs font-extrabold"
                : "text-zinc-500 hover:text-zinc-800",
            )}
          >
            <X className="w-3.5 h-3.5 text-[#FF2D55] stroke-[3]" />
            <span>Excluded ({excList.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Inclusions Card */}
        <div
          className={cn(
            "bg-white border border-zinc-200/90 rounded-[20px] overflow-hidden shadow-2xs flex flex-col",
            activeTab === "inclusions" ? "flex" : "hidden md:flex",
          )}
        >
          {/* Inclusions Header — count lives on the toggle; section title already says Inclusions */}
          <div className="bg-emerald-50/70 border-b border-emerald-100/90 px-4 sm:px-5 py-2.5 flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-emerald-950 font-montserrat">
              Included
            </span>
          </div>

          {/* Inclusions Items List */}
          <div className="p-4 sm:p-5 divide-y divide-zinc-200/60">
            {incList.map((item, i) => (
              <div
                key={i}
                className="py-3 flex items-start gap-3.5 first:pt-0 last:pb-0 group"
              >
                <Check className="w-5 h-5 text-[#00C853] shrink-0 mt-0.5 stroke-[3.5]" />
                <span className="text-xs sm:text-sm font-semibold text-[#1B2A4A] font-montserrat leading-snug">
                  {getItemText(item)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Exclusions Card */}
        <div
          className={cn(
            "bg-white border border-zinc-200/90 rounded-[20px] overflow-hidden shadow-2xs flex flex-col",
            activeTab === "exclusions" ? "flex" : "hidden md:flex",
          )}
        >
          {/* Exclusions Header — count lives on the toggle; section title already says Exclusions */}
          <div className="bg-rose-50/70 border-b border-rose-100/90 px-4 sm:px-5 py-2.5 flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 text-rose-600" />
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-rose-950 font-montserrat">
              Excluded
            </span>
          </div>

          {/* Exclusions Items List */}
          <div className="p-4 sm:p-5 divide-y divide-zinc-200/60">
            {excList.map((item, i) => (
              <div
                key={i}
                className="py-3 flex items-start gap-3.5 first:pt-0 last:pb-0 group"
              >
                <X className="w-5 h-5 text-[#FF2D55] shrink-0 mt-0.5 stroke-[3.5]" />
                <span className="text-xs sm:text-sm font-semibold text-[#1B2A4A] font-montserrat leading-snug">
                  {getItemText(item)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

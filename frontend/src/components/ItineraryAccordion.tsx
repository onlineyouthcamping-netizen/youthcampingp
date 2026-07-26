"use client";

import { useState } from "react";
import { ChevronDown, BedDouble, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { ItineraryDay } from "@/types";

function renderFormattedText(text: string) {
  if (!text) return "";
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="font-bold text-zinc-900">
          {part}
        </strong>
      );
    }
    return part;
  });
}

interface ItineraryAccordionProps {
  itinerary: ItineraryDay[];
  startDate?: string | null;
  skipDays?: number;
}

export default function ItineraryAccordion({
  itinerary,
  startDate,
  skipDays = 0,
}: ItineraryAccordionProps) {
  const [openDays, setOpenDays] = useState<number[]>([1]);
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  const rawList = Array.isArray(itinerary) ? itinerary : [];
  
  const displayItinerary = rawList.map((day, idx) => ({
    ...day,
    originalDay: day.day || idx + 1,
    displayDay: idx + 1
  }));

  const toggleDay = (dayNumber: number) => {
    if (openDays.includes(dayNumber)) {
      setOpenDays(openDays.filter((d) => d !== dayNumber));
    } else {
      setOpenDays([...openDays, dayNumber]);
    }
  };

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setOpenDays([]);
    } else {
      setOpenDays(displayItinerary.map((d) => d.displayDay));
    }
    setIsAllExpanded(!isAllExpanded);
  };

  return (
    <div className="space-y-6 scroll-mt-28" id="itinerary">
      {/* Header Row: Itinerary Overview & Expand All Toggle */}
      <div className="flex items-center justify-between border-b border-zinc-100/90 pb-3">
        <h2 className="text-xl md:text-2xl font-extrabold text-[#0B1528] font-montserrat">
          Itinerary Overview
        </h2>
        <button
          onClick={toggleExpandAll}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-[#0B1528] transition-all font-montserrat cursor-pointer"
        >
          <ChevronDown
            className={cn(
              "w-4 h-4 text-zinc-500 transition-transform duration-200",
              isAllExpanded ? "rotate-180" : ""
            )}
          />
          {isAllExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>

      {/* Accordion Days List */}
      <div className="space-y-3">
        {displayItinerary.map((day) => {
          const isExpanded = openDays.includes(day.displayDay);
          const dayNumStr =
            day.displayDay < 10 ? `Day 0${day.displayDay}` : `Day ${day.displayDay}`;

          return (
            <div key={day.displayDay} className="group rounded-2xl transition-all duration-300">
              <div className="flex items-center gap-3 md:gap-4">
                {/* Left: Dark Navy Day Pill Badge */}
                <div className="bg-[#0B1528] text-white rounded-full font-extrabold text-sm px-3.5 sm:px-4 text-center shadow-xs border border-slate-800 shrink-0 min-w-[88px] sm:min-w-[100px] flex items-center justify-center font-montserrat min-h-[40px] h-10">
                  {dayNumStr}
                </div>

                {/* Right: Pure White Pill Title Bar */}
                <button
                  onClick={() => toggleDay(day.displayDay)}
                  className="flex-1 bg-white border border-zinc-200/90 rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-2xs hover:border-[#D4541A]/50 transition-all text-left cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-semibold text-[#0B1528] font-montserrat truncate flex-1">
                    {day.title}
                  </span>

                  <ChevronDown
                    className={cn(
                      "w-4.5 h-4.5 text-[#D4541A] shrink-0 ml-3 transition-transform duration-300",
                      isExpanded ? "rotate-180" : ""
                    )}
                  />
                </button>
              </div>

              {/* Expanded Details Body */}
              {isExpanded && (
                <div className="ml-[104px] sm:ml-[116px] mt-2.5 p-5 bg-[#F8F9FA] border border-zinc-100 rounded-2xl space-y-3 animate-fade-in">
                  {day.description && (
                    <p className="text-xs sm:text-sm text-zinc-600 font-montserrat leading-relaxed">
                      {renderFormattedText(day.description)}
                    </p>
                  )}

                  {day.activities && day.activities.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-[#0B1528] font-montserrat">
                        Key Highlights:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-zinc-600 font-montserrat">
                        {day.activities.map((act, ai) => (
                          <li key={ai}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(day.stay || day.meals) && (
                    <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-zinc-200/60 text-xs text-zinc-500 font-montserrat">
                      {day.stay && (
                        <div className="flex items-center gap-1.5 font-medium">
                          <BedDouble className="w-3.5 h-3.5 text-[#D4541A]" />
                          <span>Stay: {day.stay}</span>
                        </div>
                      )}
                      {day.meals && (
                        <div className="flex items-center gap-1.5 font-medium">
                          <Utensils className="w-3.5 h-3.5 text-[#D4541A]" />
                          <span>Meals: {day.meals}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

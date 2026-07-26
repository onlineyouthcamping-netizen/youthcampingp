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

function getStayAndMeals(day: ItineraryDay, index: number, totalDays: number) {
  let stay = day.stay?.trim();
  let meals = day.meals?.trim();

  const fullText = `${day.title || ""} ${day.description || ""} ${day.location || ""}`.toLowerCase();
  const locName = day.location?.trim() || "";

  // Smart inference if stay is empty
  if (!stay) {
    if (fullText.includes("houseboat")) {
      stay = locName ? `${locName} (Houseboat)` : "Luxury Houseboat";
    } else if (fullText.includes("homestay")) {
      stay = locName ? `${locName} (Homestay)` : "Cozy Homestay";
    } else if (fullText.includes("camp") || fullText.includes("tent")) {
      stay = locName ? `${locName} (Campsite)` : "Alpine Camping";
    } else if (fullText.includes("resort")) {
      stay = locName ? `${locName} (Resort)` : "3-Star Resort";
    } else if (fullText.includes("hotel")) {
      stay = locName ? `${locName} (Hotel)` : "3-Star Hotel";
    } else if (fullText.includes("train") || fullText.includes("railway") || fullText.includes("sleeper")) {
      stay = "Overnight Train Journey";
    } else if (fullText.includes("journey") || fullText.includes("overnight") || fullText.includes("departure") || fullText.includes("drive to")) {
      stay = locName ? `${locName} (Enroute / Hotel)` : "Overnight Journey";
    } else if (locName) {
      stay = `${locName} (Hotel / Homestay)`;
    } else {
      if (index === 0) stay = "Overnight Journey";
      else if (index === totalDays - 1) stay = "Hotel / Checkout";
      else stay = "Hotel / Homestay";
    }
  }

  // Smart inference if meals is empty
  if (!meals) {
    const hasB = fullText.includes("breakfast");
    const hasL = fullText.includes("lunch");
    const hasD = fullText.includes("dinner") || fullText.includes("supper");

    if (hasB && hasL && hasD) {
      meals = "Breakfast, Lunch & Dinner";
    } else if (hasB && hasD) {
      meals = "Breakfast & Dinner";
    } else if (hasB && hasL) {
      meals = "Breakfast & Lunch";
    } else if (hasL && hasD) {
      meals = "Lunch & Dinner";
    } else if (hasD) {
      meals = "Dinner";
    } else if (hasB) {
      meals = "Breakfast";
    } else {
      // Guaranteed defaults based on day position
      if (index === 0) {
        meals = "Dinner"; // Arrival day
      } else if (index === totalDays - 1) {
        meals = "Breakfast"; // Departure day
      } else {
        meals = "Breakfast & Dinner"; // Middle days
      }
    }
  }

  return { stay, meals };
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
    <div className="space-y-6 scroll-mt-[140px]" id="itinerary">
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
              <div className="flex items-center gap-2 sm:gap-3 w-full">
                {/* Left: Dark Navy Day Pill Badge */}
                <div className="bg-[#0B1528] text-white rounded-2xl sm:rounded-full font-extrabold text-xs sm:text-sm px-2.5 sm:px-3 text-center shadow-xs border border-slate-800 shrink-0 min-w-[68px] sm:min-w-[88px] flex items-center justify-center font-montserrat min-h-[42px] py-2">
                  {dayNumStr}
                </div>

                {/* Right: Pure White Pill Title Bar */}
                <button
                  onClick={() => toggleDay(day.displayDay)}
                  className="flex-1 min-w-0 bg-white border border-zinc-200/90 rounded-2xl sm:rounded-full px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shadow-2xs hover:border-[#D4541A]/50 transition-all text-left cursor-pointer min-h-[42px]"
                >
                  <span className="text-xs sm:text-sm font-semibold text-[#0B1528] font-montserrat leading-snug flex-1 min-w-0 pr-1 line-clamp-2">
                    {day.title}
                  </span>

                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-[#D4541A] shrink-0 ml-1.5 transition-transform duration-300",
                      isExpanded ? "rotate-180" : ""
                    )}
                  />
                </button>
              </div>

              {/* Expanded Details Body */}
              {isExpanded && (
                <div className="ml-[84px] sm:ml-[112px] mt-2.5 p-4 sm:p-5 bg-[#F8F9FA] border border-zinc-100 rounded-2xl space-y-3 animate-fade-in">
                  {day.description && (() => {
                    // Split on bullet character or newline
                    const bullets = day.description
                      .split(/\s*[•·]\s*/)
                      .map(s => s.trim())
                      .filter(Boolean);

                    return bullets.length > 1 ? (
                      <ul className="space-y-2">
                        {bullets.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-600 font-montserrat leading-relaxed">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#D4541A] shrink-0" />
                            <span>{renderFormattedText(item)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs sm:text-sm text-zinc-600 font-montserrat leading-relaxed">
                        {renderFormattedText(day.description)}
                      </p>
                    );
                  })()}

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

                  {(() => {
                    const { stay: effectiveStay, meals: effectiveMeals } = getStayAndMeals(day, day.displayDay - 1, displayItinerary.length);
                    if (!effectiveStay && !effectiveMeals) return null;

                    return (
                      <div className="border-t border-zinc-200/60 pt-3 flex flex-col gap-2">
                        {effectiveStay && (
                          <div className="flex items-center gap-3 pl-3 border-l-2 border-[#D4541A]">
                            <BedDouble className="w-4 h-4 text-[#0B1528] shrink-0" />
                            <span className="text-xs font-semibold text-[#0B1528] font-montserrat">
                              {effectiveStay}
                            </span>
                          </div>
                        )}
                        {effectiveMeals && (
                          <div className="flex items-center gap-3 pl-3 border-l-2 border-[#D4541A]">
                            <Utensils className="w-4 h-4 text-[#D4541A] shrink-0" />
                            <span className="text-xs font-bold text-[#D4541A] font-montserrat">
                              {effectiveMeals}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

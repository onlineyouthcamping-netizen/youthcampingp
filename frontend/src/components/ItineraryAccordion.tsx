"use client";

import { useState } from "react";
import { ChevronDown, BedDouble, Utensils, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { ItineraryDay } from "@/types";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

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

function getDayFullDate(startDateStr?: string | Date | null, dayIdx: number = 0): string | null {
  if (!startDateStr) return null;
  try {
    const baseDate = new Date(startDateStr);
    if (isNaN(baseDate.getTime())) return null;
    
    const targetDate = new Date(baseDate);
    targetDate.setDate(targetDate.getDate() + dayIdx);
    
    const dayNum = String(targetDate.getDate()).padStart(2, "0");
    const month = targetDate.toLocaleDateString("en-US", { month: "short" });
    const year = targetDate.getFullYear();
    
    return `${dayNum} ${month} ${year}`;
  } catch (e) {
    return null;
  }
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
      if (index === 0) {
        meals = "Dinner";
      } else if (index === totalDays - 1) {
        meals = "Breakfast";
      } else {
        meals = "Breakfast & Dinner";
      }
    }
  }

  return { stay, meals };
}

interface ItineraryAccordionProps {
  itinerary: ItineraryDay[];
  startDate?: string | Date | null;
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
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-[#0B1528] transition-all font-montserrat cursor-pointer shrink-0"
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
        {displayItinerary.map((day, idx) => {
          const isExpanded = openDays.includes(day.displayDay);
          const dayNumStr =
            day.displayDay < 10 ? `Day 0${day.displayDay}` : `Day ${day.displayDay}`;
          const calDateFull = getDayFullDate(startDate, idx + skipDays);

          return (
            <div key={day.displayDay} className="group rounded-2xl transition-all duration-300">
              {/* FULL CLICKABLE HEADER BAR */}
              <button
                onClick={() => toggleDay(day.displayDay)}
                className="flex items-center gap-2 sm:gap-3 w-full text-left cursor-pointer group/header focus:outline-none"
              >
                {/* Left: Dark Navy Day Pill Badge */}
                <div className="bg-[#0B1528] text-white rounded-2xl sm:rounded-full font-extrabold text-xs sm:text-sm px-2.5 sm:px-3 text-center shadow-xs border border-slate-800 shrink-0 min-w-[68px] sm:min-w-[88px] flex items-center justify-center font-montserrat min-h-[42px] py-2 group-hover/header:bg-[#112240] transition-colors">
                  {dayNumStr}
                </div>

                {/* Right: Pure White Pill Title Bar */}
                <div
                  className="flex-1 min-w-0 bg-white border border-zinc-200/90 rounded-2xl sm:rounded-full px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shadow-2xs group-hover/header:border-[#D4541A]/50 transition-all min-h-[42px]"
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
                </div>
              </button>

              {/* Expanded Details Body */}
              {isExpanded && (
                <div className="mt-2.5 p-3.5 sm:p-5 bg-[#F8F9FA] border border-zinc-100 rounded-2xl space-y-3 animate-fade-in">
                  {/* STARTING POINT DATE LINE */}
                  {calDateFull && (
                    <p className="text-xs sm:text-sm font-semibold text-[#0B1528] font-montserrat pb-0.5">
                      {calDateFull}
                    </p>
                  )}

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
                    const rawItems = [
                      ...(Array.isArray(day.photos) ? day.photos : []),
                      ...(Array.isArray((day as any).images) ? (day as any).images : []),
                      ...(typeof (day as any).photo === 'string' || typeof (day as any).photo === 'object' ? [(day as any).photo] : []),
                      ...(typeof (day as any).image === 'string' || typeof (day as any).image === 'object' ? [(day as any).image] : []),
                    ].filter(Boolean);

                    const parsedPhotos = rawItems.map((item: any, idx: number) => {
                      if (typeof item === 'string') {
                        const parts = item.split('|');
                        const url = parts[0];
                        const caption = parts.slice(1).join('|').trim();
                        return { url: normalizeImageUrl(url), caption, tag: null };
                      }
                      if (item && typeof item === 'object') {
                        const rawUrl = item.url || item.src || item.path || '';
                        const cap = item.caption || item.alt || item.title || item.name || item.place || item.activity || '';
                        
                        let tag: 'included' | 'self-paid' | null = null;
                        const status = String(item.inclusion || item.type || item.status || item.tag || item.inclusionStatus || '').toLowerCase();
                        
                        if (status.includes('included') || item.included === true || item.isIncluded === true) {
                          tag = 'included';
                        } else if (status.includes('self') || status.includes('paid') || status.includes('optional') || item.included === false || item.isIncluded === false) {
                          tag = 'self-paid';
                        }

                        return { url: normalizeImageUrl(rawUrl), caption: cap, tag };
                      }
                      return null;
                    }).filter((p): p is { url: string; caption: string; tag: 'included' | 'self-paid' | null } => Boolean(p && p.url));

                    if (parsedPhotos.length === 0) return null;

                    return (
                      <div className="pt-2">
                        <p className="text-xs font-bold text-[#0B1528] font-montserrat mb-2.5 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-[#D4541A]" />
                          <span>Day Highlights & Photos</span>
                        </p>

                        <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-1 scroll-smooth snap-x touch-pan-x -mr-3.5 sm:mr-0 pr-3.5 sm:pr-0">
                          {parsedPhotos.map((photo, pIdx) => (
                            <div
                              key={pIdx}
                              className="group relative flex-none snap-start w-[115px] sm:w-[135px] aspect-[16/10.5] rounded-xl overflow-hidden bg-zinc-200/60 shadow-2xs border border-zinc-200/80 shrink-0"
                            >
                              <OptimizedImage
                                src={photo.url}
                                alt={photo.caption || "Activity photo"}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                width={220}
                                height={140}
                              />

                              {/* Inclusion Badge: Included vs Self Paid */}
                              {photo.tag && (
                                <div className="absolute top-1.5 left-1.5 z-10">
                                  {photo.tag === 'included' ? (
                                    <span className="bg-emerald-600/90 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-2xs backdrop-blur-xs tracking-tight">
                                      Included
                                    </span>
                                  ) : (
                                    <span className="bg-amber-600/90 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-2xs backdrop-blur-xs tracking-tight">
                                      Self Paid
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Bottom Overlay: Place / Activity Name */}
                              {photo.caption && !photo.caption.startsWith('Photo ') && (
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5 pt-3.5 z-10">
                                  <p className="text-[10px] font-bold text-white truncate font-montserrat leading-none">
                                    {photo.caption}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Redesigned Premium Stay & Meals Footer */}
                  {(() => {
                    const { stay, meals } = getStayAndMeals(day, idx, displayItinerary.length);
                    if (!stay && !meals) return null;

                    return (
                      <div className="pt-3.5 border-t border-zinc-200/60 flex flex-wrap items-center gap-2.5 sm:gap-3 font-montserrat">
                        {stay && (
                          <div className="inline-flex items-center gap-2 bg-slate-100/90 border border-slate-200/70 px-3 py-1.5 rounded-full text-xs font-bold text-[#0B1528] shadow-2xs">
                            <BedDouble className="w-3.5 h-3.5 text-[#0B1528] shrink-0" />
                            <span>{stay}</span>
                          </div>
                        )}
                        {meals && (
                          <div className="inline-flex items-center gap-2 bg-orange-50/90 border border-orange-200/80 px-3 py-1.5 rounded-full text-xs font-bold text-[#D4541A] shadow-2xs">
                            <Utensils className="w-3.5 h-3.5 text-[#D4541A] shrink-0" />
                            <span>{meals}</span>
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

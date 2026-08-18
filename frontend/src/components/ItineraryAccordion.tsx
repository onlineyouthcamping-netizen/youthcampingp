"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  BedDouble,
  Utensils,
  Camera,
  Check,
} from "lucide-react";
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
        <strong key={index} className="font-bold text-[#0B1528]">
          {part}
        </strong>
      );
    }
    return part;
  });
}

function getDayFullDate(
  startDateStr?: string | Date | null,
  dayIdx: number = 0,
): string | null {
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

  const fullText =
    `${day.title || ""} ${day.description || ""} ${day.location || ""}`.toLowerCase();
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
    } else if (
      fullText.includes("train") ||
      fullText.includes("railway") ||
      fullText.includes("sleeper")
    ) {
      stay = "Overnight Train Journey";
    } else if (
      fullText.includes("journey") ||
      fullText.includes("overnight") ||
      fullText.includes("departure") ||
      fullText.includes("drive to")
    ) {
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
  const [openDays, setOpenDays] = useState<number[]>([]);
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  const rawList = Array.isArray(itinerary) ? itinerary : [];

  const displayItinerary = rawList.map((day, idx) => ({
    ...day,
    originalDay: day.day || idx + 1,
    displayDay: idx + 1,
  }));

  const toggleDay = (dayNumber: number) => {
    setOpenDays((prev) => {
      const next = prev.includes(dayNumber)
        ? prev.filter((d) => d !== dayNumber)
        : [...prev, dayNumber];
      setIsAllExpanded(next.length === displayItinerary.length && next.length > 0);
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setOpenDays([]);
      setIsAllExpanded(false);
    } else {
      setOpenDays(displayItinerary.map((d) => d.displayDay));
      setIsAllExpanded(true);
    }
  };

  return (
    <div className="space-y-6 scroll-mt-[140px]" id="itinerary">
      {/* Header Row: Itinerary Overview & Expand All Toggle */}
      <div className="itinerary-header flex items-center justify-between border-b border-zinc-100/90 pb-3 mb-4">
        <h2 className="text-xl md:text-2xl font-extrabold text-[#0B1528] font-montserrat">
          Itinerary{" "}
          <span className="text-[#D4541A] font-caveat italic">Overview</span>
        </h2>
        <button
          onClick={toggleExpandAll}
          className="expand-all-btn mr-3 flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-[#0B1528] transition-all font-montserrat cursor-pointer shrink-0"
        >
          <ChevronDown
            className={cn(
              "w-4 h-4 text-zinc-500 transition-transform duration-200",
              isAllExpanded ? "rotate-180" : "",
            )}
          />
          {isAllExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>

      {/* Accordion Days List */}
      <div className="space-y-1">
        {displayItinerary.map((day, idx) => {
          const isExpanded = openDays.includes(day.displayDay);
          const dayNumStr =
            day.displayDay < 10
              ? `Day 0${day.displayDay}`
              : `Day ${day.displayDay}`;
          const calDateFull = getDayFullDate(startDate, idx + skipDays);

          return (
            <div
              key={day.displayDay}
              className="day-item group transition-all duration-300"
            >
              {/* CLICKABLE HEADER ROW — Two Separate Boxes Side by Side */}
              <button
                onClick={() => toggleDay(day.displayDay)}
                className="flex items-center gap-2.5 w-full text-left cursor-pointer group/header focus:outline-none"
              >
                {/* Box 1: Day Badge */}
                <div className="day-badge px-3.5 py-2 bg-[#0E1726] text-white rounded-lg font-bold text-xs flex items-center justify-center shrink-0 font-montserrat whitespace-nowrap min-w-[68px]">
                  {dayNumStr}
                </div>

                {/* Box 2: Title Box (separate bordered container) */}
                <div className="flex-1 min-w-0 bg-white border border-zinc-200 rounded-lg px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#0B1528] font-montserrat leading-snug truncate flex-1 min-w-0">
                    {day.title}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-[#D4541A] shrink-0 ml-2 transition-transform duration-300",
                      isExpanded ? "rotate-180" : "",
                    )}
                  />
                </div>
              </button>

              {/* Expanded Details Body — Popup Card Style */}
              {isExpanded && (
                <div className="mt-2.5 p-5 bg-white border border-zinc-200/80 rounded-xl shadow-xs space-y-4 animate-in fade-in duration-200">
                  {/* STARTING POINT DATE LINE */}
                  {calDateFull && (
                    <div className="border-b border-zinc-100 pb-2.5">
                      <p suppressHydrationWarning className="text-xs sm:text-sm font-bold text-[#0B1528] font-montserrat">
                        {calDateFull}
                      </p>
                    </div>
                  )}

                  {day.description &&
                    (() => {
                      // Split on bullet character, newline, or numbers
                      const bullets = day.description
                        .split(/\s*[•·]\s*/)
                        .map((s) => s.trim())
                        .filter(Boolean);

                      return bullets.length > 1 ? (
                        <ul className="space-y-2.5">
                          {bullets.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-700 font-montserrat leading-relaxed"
                            >
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{renderFormattedText(item)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs sm:text-sm text-zinc-700 font-montserrat leading-relaxed">
                          {renderFormattedText(day.description)}
                        </p>
                      );
                    })()}

                  {day.activities && day.activities.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-zinc-100">
                      <p className="text-xs font-bold text-[#0B1528] font-montserrat">
                        Key Highlights:
                      </p>
                      <ul className="space-y-1.5">
                        {day.activities.map((act, ai) => (
                          <li
                            key={ai}
                            className="flex items-start gap-2 text-xs text-zinc-600 font-montserrat"
                          >
                            <Check className="w-3.5 h-3.5 text-[#F97316] shrink-0 mt-0.5" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(() => {
                    const rawItems = [
                      ...(Array.isArray(day.photos) ? day.photos : []),
                      ...(Array.isArray((day as any).images)
                        ? (day as any).images
                        : []),
                      ...(typeof (day as any).photo === "string" ||
                      typeof (day as any).photo === "object"
                        ? [(day as any).photo]
                        : []),
                      ...(typeof (day as any).image === "string" ||
                      typeof (day as any).image === "object"
                        ? [(day as any).image]
                        : []),
                    ].filter(Boolean);

                    const parsedPhotos = rawItems
                      .map((item: any, idx: number) => {
                        if (typeof item === "string") {
                          const parts = item.split("|");
                          const url = parts[0];
                          let caption = parts[1] || "";
                          let tag: "included" | "self-paid" | null = null;

                          if (parts[2]) {
                            caption = parts[1];
                            const rawTag = parts[2].toLowerCase();
                            if (rawTag === "included") tag = "included";
                            else if (
                              rawTag === "self-paid" ||
                              rawTag === "selfpaid"
                            )
                              tag = "self-paid";
                          } else if (
                            parts[1] === "included" ||
                            parts[1] === "self-paid"
                          ) {
                            caption = "";
                            tag =
                              parts[1] === "included"
                                ? "included"
                                : "self-paid";
                          }

                          return { url: normalizeImageUrl(url), caption, tag };
                        }
                        if (item && typeof item === "object") {
                          const rawUrl =
                            item.url || item.src || item.path || "";
                          const cap =
                            item.caption ||
                            item.alt ||
                            item.title ||
                            item.name ||
                            item.place ||
                            item.activity ||
                            "";

                          let tag: "included" | "self-paid" | null = null;
                          const status = String(
                            item.inclusion ||
                              item.type ||
                              item.status ||
                              item.tag ||
                              item.inclusionStatus ||
                              "",
                          ).toLowerCase();

                          if (
                            status.includes("included") ||
                            item.included === true ||
                            item.isIncluded === true
                          ) {
                            tag = "included";
                          } else if (
                            status.includes("self") ||
                            status.includes("paid") ||
                            status.includes("optional") ||
                            item.included === false ||
                            item.isIncluded === false
                          ) {
                            tag = "self-paid";
                          }

                          return {
                            url: normalizeImageUrl(rawUrl),
                            caption: cap,
                            tag,
                          };
                        }
                        return null;
                      })
                      .filter(
                        (
                          p,
                        ): p is {
                          url: string;
                          caption: string;
                          tag: "included" | "self-paid" | null;
                        } => Boolean(p && p.url),
                      );

                    if (parsedPhotos.length === 0) return null;

                    return (
                      <div className="pt-2">
                        <p className="text-xs font-bold text-[#0B1528] font-montserrat mb-2.5 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-[#D4541A]" />
                          <span>Day Highlights & Photos</span>
                        </p>

                        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 scroll-smooth snap-x touch-manipulation w-full max-w-full px-1">
                          {parsedPhotos.map((photo, pIdx) => (
                            <div
                              key={pIdx}
                              className="group relative flex-none snap-start w-[122px] sm:w-[145px] h-[105px] sm:h-[118px] rounded-2xl overflow-hidden bg-slate-900 shadow-[0_8px_25px_rgba(0,0,0,0.12)] border border-slate-200/60 hover:shadow-[0_16px_35px_rgba(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-300 shrink-0 flex flex-col justify-end"
                            >
                              {/* Photo Background */}
                              <OptimizedImage
                                src={photo.url}
                                alt={photo.caption || "Activity photo"}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                width={300}
                                height={200}
                                cloudinaryWidth={400}
                                loading="eager"
                                priority={true}
                              />

                              {/* Apple Glass Floating Badge Top-Left */}
                              {photo.tag && (
                                <div className="absolute top-2 left-2 z-10">
                                  {photo.tag === "included" ? (
                                    <span className="backdrop-blur-md bg-black/45 border border-white/20 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-lg tracking-wider uppercase flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                                      Included
                                    </span>
                                  ) : (
                                    <span className="backdrop-blur-md bg-black/45 border border-white/20 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-lg tracking-wider uppercase flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                                      Self Paid
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Transparent Gradient Caption Overlay */}
                              {photo.caption &&
                                !photo.caption.startsWith("Photo ") && (
                                  <div className="relative z-10 w-full bg-gradient-to-t from-black/85 via-black/30 to-transparent p-2.5 pt-6">
                                    <p
                                      className="text-[11px] font-bold text-white truncate font-montserrat tracking-tight leading-none drop-shadow-sm"
                                      title={photo.caption}
                                    >
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
                    const { stay, meals } = getStayAndMeals(
                      day,
                      idx,
                      displayItinerary.length,
                    );
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

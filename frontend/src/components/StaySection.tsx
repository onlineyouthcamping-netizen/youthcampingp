"use client";

import React, { useState, useMemo } from "react";
import {
  Maximize2,
  MapPin,
  X,
  BedDouble,
  Utensils,
  Building,
  Bath,
  Sparkles,
} from "lucide-react";
import { normalizeImageUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface AccommodationGallery {
  url: string;
  category: string;
  title?: string;
}

interface Accommodation {
  name: string;
  location: string;
  nights: string;
  type: string;
  starRating?: string;
  roomType?: string;
  meals?: string;
  image: string;
  amenities?: string[];
  gallery?: AccommodationGallery[];
}

interface StaySectionProps {
  accommodations?: Accommodation[];
}

const STAY_TYPE_WORDS = [
  "cottage",
  "cottages",
  "hotel",
  "homestay",
  "camp",
  "camping",
  "resort",
  "villa",
  "tent",
  "tents",
];

function isRedundantStayTypeChip(amenity: string, stay: Accommodation) {
  const text = amenity.toLowerCase().trim();
  if (!text) return true;
  const name = (stay.name || "").toLowerCase();
  const type = (stay.type || "").toLowerCase();
  const isTypeWord = STAY_TYPE_WORDS.includes(text);
  if (!isTypeWord) return false;
  if (name.includes(text.replace(/s$/, "")) || name.includes(text)) return true;
  if (type && (type.includes(text) || text.includes(type.replace(/s$/, "")))) {
    return name.includes(type.replace(/s$/, "")) || name.includes(type);
  }
  return false;
}

const defaultStaysList: Accommodation[] = [
  {
    name: "Boutique Alpine Resort & Spa",
    location: "Manali, Himachal Pradesh",
    nights: "3 Nights",
    type: "Boutique Hotel",
    starRating: "4-Star",
    roomType: "Quad / Triple Sharing",
    meals: "Breakfast & Dinner Included",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200",
    amenities: [
      "24/7 Hot Water",
      "En-Suite Clean Washrooms",
      "Mountain View Balcony",
      "In-House Buffet Restaurant",
      "Free Wi-Fi",
      "Room Heater Available",
    ],
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200",
        category: "Interior / Rooms",
        title: "Deluxe Alpine Bedroom",
      },
      {
        url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200",
        category: "Interior / Rooms",
        title: "Cozy Mountain View Suite",
      },
      {
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200",
        category: "Bathroom",
        title: "Clean Modern En-Suite Washroom",
      },
      {
        url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=1200",
        category: "Bathroom",
        title: "Hot Water Shower & Amenities",
      },
      {
        url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200",
        category: "Dining Area",
        title: "Buffet Dining Restaurant",
      },
      {
        url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200",
        category: "Dining Area",
        title: "Cozy Cafe & Breakfast Lounge",
      },
      {
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200",
        category: "Property & Views",
        title: "Outdoor Swimming Pool & Sun Deck",
      },
      {
        url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200",
        category: "Property & Views",
        title: "Mountain Lawn & Resort Exterior",
      },
    ],
  },
  {
    name: "Traditional Kinnauri Heritage Homestay",
    location: "Chhitkul Village, Kinnaur",
    nights: "2 Nights",
    type: "Heritage Homestay",
    starRating: "Authentic Stay",
    roomType: "Triple Sharing",
    meals: "Local Organic Meals",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200",
    amenities: [
      "Hot Water Geyser",
      "Attached Washrooms",
      "Traditional Wood Architecture",
      "Home-cooked Himalayan Food",
      "Bonfire Area",
    ],
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200",
        category: "Interior / Rooms",
        title: "Wooden Panelled Alpine Bedroom",
      },
      {
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200",
        category: "Bathroom",
        title: "Attached Western Bathroom with Geyser",
      },
      {
        url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200",
        category: "Dining Area",
        title: "Traditional Dining Room",
      },
      {
        url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200",
        category: "Property & Views",
        title: "Snow Valley Balcony View",
      },
    ],
  },
  {
    name: "High-Altitude Stargazing Dome Camps",
    location: "Kasol & Parvati Valley",
    nights: "2 Nights",
    type: "Luxury Dome Camping",
    starRating: "Adventure Camp",
    roomType: "Dome Tents",
    meals: "Bonfire & Barbecue Dinner",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200",
    amenities: [
      "Private Attached Washrooms",
      "Insulated Bedding & Blankets",
      "Evening Music & Bonfire",
      "Riverfront Campsite",
    ],
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200",
        category: "Interior / Rooms",
        title: "Cozy Glamping Dome Tent Interior",
      },
      {
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200",
        category: "Bathroom",
        title: "Private Attached Camp Washroom",
      },
      {
        url: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1200",
        category: "Dining Area",
        title: "Outdoor Open-Air Dining & Cafe",
      },
      {
        url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200",
        category: "Property & Views",
        title: "Night Stargazing Camp Site",
      },
    ],
  },
  {
    name: "Grand Regency Hotel",
    location: "Amritsar, Punjab",
    nights: "1 Night",
    type: "City Hotel",
    starRating: "4-Star",
    roomType: "Twin / Double Sharing",
    meals: "Buffet Breakfast",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200",
    amenities: [
      "Air Conditioning",
      "Free High-Speed Wi-Fi",
      "24/7 Room Service",
      "Buffet Breakfast Lounge",
    ],
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200",
        category: "Interior / Rooms",
        title: "Luxury King Bedroom",
      },
      {
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200",
        category: "Bathroom",
        title: "Modern Marble Bathroom",
      },
      {
        url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200",
        category: "Dining Area",
        title: "Grand Buffet Dining Restaurant",
      },
    ],
  },
];

export default function StaySection({ accommodations }: StaySectionProps) {
  const [selectedStay, setSelectedStay] = useState<Accommodation | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const staysList = accommodations || [];

  const modalCategories = useMemo(() => {
    if (!selectedStay) return ["All"];
    const gallery = selectedStay.gallery || [];
    const catSet = new Set<string>();
    gallery.forEach((img) => {
      if (img && img.category) catSet.add(img.category);
    });
    if (catSet.size === 0) return ["All", "Property & Views"];
    return ["All", ...Array.from(catSet)];
  }, [selectedStay]);

  const filteredImages = useMemo(() => {
    if (!selectedStay) return [];
    const gallery =
      selectedStay.gallery && selectedStay.gallery.length > 0
        ? selectedStay.gallery
        : [
            {
              url: selectedStay.image,
              category: "Property & Views",
              title: selectedStay.name,
            },
          ];
    if (activeCategory === "All") return gallery;
    return gallery.filter((img) => img && img.category === activeCategory);
  }, [selectedStay, activeCategory]);

  const highlightAmenities = useMemo(() => {
    if (!selectedStay?.amenities) return [];
    return selectedStay.amenities.filter(
      (amenity) =>
        Boolean(String(amenity || "").trim()) &&
        !isRedundantStayTypeChip(String(amenity), selectedStay),
    );
  }, [selectedStay]);

  if (staysList.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 scroll-mt-[140px]" id="stay">
      {/* Header System */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0B1528] tracking-tight font-montserrat leading-none">
          Stay &{" "}
          <span className="text-[#D4541A] font-caveat italic">
            Accommodations
          </span>
        </h2>
      </div>

      {/* Stays Horizontal 1.5 Cards Peek Slider on Mobile & Grid on Desktop */}
      <div
        className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden no-scrollbar py-2 scroll-smooth snap-x snap-mandatory touch-manipulation flex-nowrap sm:flex-wrap"
        style={{ touchAction: "pan-x" }}
      >
        {staysList.map((stay, i) => (
          <div
            key={i}
            className="flex-none snap-start w-[58vw] min-w-[200px] sm:w-auto sm:min-w-0 sm:max-w-none max-w-[220px] flex flex-col"
          >
            <div
              onClick={() => {
                setSelectedStay(stay);
                setActiveCategory("All");
              }}
              className="bg-white border border-zinc-200/80 rounded-[14px] overflow-hidden shadow-[0_6px_20px_rgba(11,21,40,0.06)] hover:shadow-[0_12px_28px_rgba(11,21,40,0.1)] hover:border-[#D4541A]/60 transition-all duration-300 cursor-pointer group flex flex-col h-full"
            >
              {/* Photo */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                <OptimizedImage
                  src={normalizeImageUrl(stay.image)}
                  alt={stay.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 hidden sm:flex bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center">
                  <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-col flex-1 px-3 pt-2.5 pb-2 sm:px-3.5 sm:pt-3 sm:pb-2.5">
                <h3 className="text-[13px] sm:text-sm font-extrabold text-[#0B1528] font-montserrat line-clamp-2 leading-snug group-hover:text-[#D4541A] transition-colors min-h-[2.5rem] sm:min-h-0">
                  {stay.name}
                </h3>

                <div className="flex items-start gap-1 mt-1.5 text-[11px] text-zinc-500 font-medium font-montserrat leading-snug">
                  <MapPin className="w-3.5 h-3.5 text-[#D4541A] shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{stay.location}</span>
                </div>

                {stay.amenities && stay.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {stay.amenities
                      .filter(
                        (amenity) =>
                          Boolean(String(amenity || "").trim()) &&
                          !isRedundantStayTypeChip(String(amenity), stay),
                      )
                      .slice(0, 2)
                      .map((amenity, idx) => (
                        <span
                          key={idx}
                          className="inline-flex max-w-full items-center rounded-md bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 font-montserrat"
                        >
                          <span className="truncate">{amenity}</span>
                        </span>
                      ))}
                  </div>
                )}

                <div className="mt-auto pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-semibold text-zinc-500 font-montserrat">
                  <div className="min-w-0 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate text-zinc-600">{stay.type}</span>
                  </div>
                  {stay.starRating &&
                    stay.starRating.toLowerCase().trim() !==
                      (stay.type || "").toLowerCase().trim() && (
                      <span className="shrink-0 rounded-md bg-[#FFF7F2] px-1.5 py-0.5 text-[10px] font-bold text-[#C2410C]">
                        {stay.starRating}
                      </span>
                    )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stay detail modal */}
      <AnimatePresence>
        {selectedStay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-6 md:p-8 pt-[72px] sm:pt-6 pb-0 sm:pb-6 overflow-hidden"
          >
            <div
              className="fixed inset-0 bg-[#0B1528]/75 backdrop-blur-sm"
              onClick={() => setSelectedStay(null)}
              aria-hidden
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="stay-modal-title"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-t-[20px] border border-zinc-200/80 bg-white shadow-[0_24px_64px_rgba(11,21,40,0.18)] sm:rounded-[22px] max-h-[calc(100vh-72px)] sm:max-h-[min(88vh,820px)]"
            >
              {/* Hero + header */}
              <div className="relative shrink-0">
                <div className="relative h-[140px] sm:h-[168px] w-full overflow-hidden bg-zinc-100">
                  <OptimizedImage
                    src={normalizeImageUrl(selectedStay.image)}
                    alt={selectedStay.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528]/88 via-[#0B1528]/35 to-transparent" />
                  <button
                    type="button"
                    onClick={() => setSelectedStay(null)}
                    aria-label="Close stay details"
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#0B1528] shadow-md transition-colors hover:bg-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <h3
                      id="stay-modal-title"
                      className="font-montserrat text-lg sm:text-xl font-extrabold leading-tight text-white"
                    >
                      {selectedStay.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {selectedStay.location}
                      </span>
                      {selectedStay.nights && (
                        <span className="rounded-full bg-[#D4541A] px-2.5 py-1 text-[11px] font-bold text-white">
                          {selectedStay.nights}
                        </span>
                      )}
                      {selectedStay.type && (
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#0B1528]">
                          {selectedStay.type}
                        </span>
                      )}
                      {selectedStay.starRating &&
                        selectedStay.starRating.toLowerCase().trim() !==
                          (selectedStay.type || "").toLowerCase().trim() && (
                          <span className="rounded-full bg-[#FFF1E8] px-2.5 py-1 text-[11px] font-bold text-[#C2410C]">
                            {selectedStay.starRating}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category filters */}
              <div className="shrink-0 border-b border-zinc-100 px-4 py-2.5 sm:px-5">
                <div
                  className="flex gap-2 overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth"
                  style={{ touchAction: "pan-x" }}
                >
                  {modalCategories.map((cat) => {
                    const active = activeCategory === cat;
                    const Icon =
                      cat === "Interior / Rooms"
                        ? BedDouble
                        : cat === "Bathroom"
                          ? Bath
                          : cat === "Dining Area"
                            ? Utensils
                            : cat === "Property & Views"
                              ? Sparkles
                              : null;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold font-montserrat transition-colors cursor-pointer ${
                          active
                            ? "bg-[#0B1528] text-white"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80"
                        }`}
                      >
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-16 sm:px-5 sm:py-5 sm:pb-20 custom-scrollbar space-y-6">
                {highlightAmenities.length > 0 && (
                  <section>
                    <h4 className="mb-2.5 font-montserrat text-xs font-bold uppercase tracking-wide text-zinc-500">
                      Highlights
                    </h4>
                    <ul className="flex flex-wrap gap-2">
                      {highlightAmenities.map((amenity, idx) => (
                        <li
                          key={idx}
                          className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-700 font-montserrat"
                        >
                          {amenity}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {((selectedStay as any).mealsBreakdown ||
                  (selectedStay as any).meals) && (
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-[#D4541A]" />
                      <h4 className="font-montserrat text-sm font-bold text-[#0B1528]">
                        Meals included
                      </h4>
                    </div>
                    {((selectedStay as any).mealsBreakdown?.breakfast ||
                      (selectedStay as any).mealsBreakdown?.lunch ||
                      (selectedStay as any).mealsBreakdown?.dinner) ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 font-montserrat">
                        {(
                          [
                            ["Breakfast", (selectedStay as any).mealsBreakdown?.breakfast],
                            ["Lunch", (selectedStay as any).mealsBreakdown?.lunch],
                            ["Dinner", (selectedStay as any).mealsBreakdown?.dinner],
                          ] as const
                        )
                          .filter(([, text]) => Boolean(text))
                          .map(([label, text]) => (
                            <div
                              key={label}
                              className="rounded-xl border border-zinc-200/80 bg-white p-3.5"
                            >
                              <p className="text-[11px] font-bold uppercase tracking-wide text-[#D4541A]">
                                {label}
                              </p>
                              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">
                                {text}
                              </p>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-[13px] leading-relaxed text-zinc-600 font-montserrat">
                        {(selectedStay as any).meals}
                      </p>
                    )}
                    {(selectedStay as any).disclaimer && (
                      <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-400 font-montserrat">
                        {(selectedStay as any).disclaimer}
                      </p>
                    )}
                  </section>
                )}

                <section>
                  <h4 className="mb-3 font-montserrat text-sm font-bold text-[#0B1528]">
                    {activeCategory === "All"
                      ? "Property photos"
                      : `${activeCategory} photos`}
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3">
                    {filteredImages.map((img, idx) => (
                      <figure
                        key={`${img.url}-${idx}`}
                        className="group overflow-hidden rounded-xl bg-zinc-100"
                      >
                        <div className="relative aspect-[4/3] w-full">
                          <OptimizedImage
                            src={normalizeImageUrl(img.url) || selectedStay.image}
                            alt={img.title || selectedStay.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                          {img.category && (
                            <figcaption className="absolute left-2 top-2 rounded-md bg-[#0B1528]/75 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                              {img.category}
                            </figcaption>
                          )}
                        </div>
                        {img.title && (
                          <p className="truncate px-2 py-1.5 text-[11px] font-semibold text-zinc-600 font-montserrat">
                            {img.title}
                          </p>
                        )}
                      </figure>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

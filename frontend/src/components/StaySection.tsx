"use client";

import React, { useState, useMemo } from "react";
import { Maximize2, MapPin, X, BedDouble, Utensils, Star, Building, Bath, Coffee, Wifi, Flame, Sparkles, CheckCircle2 } from "lucide-react";
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

const defaultStaysList: Accommodation[] = [
  {
    name: "Boutique Alpine Resort & Spa",
    location: "Manali, Himachal Pradesh",
    nights: "3 Nights",
    type: "Boutique Hotel",
    starRating: "4-Star",
    roomType: "Quad / Triple Sharing",
    meals: "Breakfast & Dinner Included",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200",
    amenities: ["24/7 Hot Water", "En-Suite Clean Washrooms", "Mountain View Balcony", "In-House Buffet Restaurant", "Free Wi-Fi", "Room Heater Available"],
    gallery: [
      { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200", category: "Interior / Rooms", title: "Deluxe Alpine Bedroom" },
      { url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200", category: "Interior / Rooms", title: "Cozy Mountain View Suite" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200", category: "Bathroom", title: "Clean Modern En-Suite Washroom" },
      { url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=1200", category: "Bathroom", title: "Hot Water Shower & Amenities" },
      { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200", category: "Dining Area", title: "Buffet Dining Restaurant" },
      { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200", category: "Dining Area", title: "Cozy Cafe & Breakfast Lounge" },
      { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200", category: "Property & Views", title: "Outdoor Swimming Pool & Sun Deck" },
      { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200", category: "Property & Views", title: "Mountain Lawn & Resort Exterior" }
    ]
  },
  {
    name: "Traditional Kinnauri Heritage Homestay",
    location: "Chhitkul Village, Kinnaur",
    nights: "2 Nights",
    type: "Heritage Homestay",
    starRating: "Authentic Stay",
    roomType: "Triple Sharing",
    meals: "Local Organic Meals",
    image: "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=1200",
    amenities: ["Hot Water Geyser", "Attached Washrooms", "Traditional Wood Architecture", "Home-cooked Himalayan Food", "Bonfire Area"],
    gallery: [
      { url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200", category: "Interior / Rooms", title: "Wooden Panelled Alpine Bedroom" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200", category: "Bathroom", title: "Attached Western Bathroom with Geyser" },
      { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200", category: "Dining Area", title: "Traditional Dining Room" },
      { url: "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=1200", category: "Property & Views", title: "Snow Valley Balcony View" }
    ]
  },
  {
    name: "High-Altitude Stargazing Dome Camps",
    location: "Kasol & Parvati Valley",
    nights: "2 Nights",
    type: "Luxury Dome Camping",
    starRating: "Adventure Camp",
    roomType: "Dome Tents",
    meals: "Bonfire & Barbecue Dinner",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200",
    amenities: ["Private Attached Washrooms", "Insulated Bedding & Blankets", "Evening Music & Bonfire", "Riverfront Campsite"],
    gallery: [
      { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200", category: "Interior / Rooms", title: "Cozy Glamping Dome Tent Interior" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200", category: "Bathroom", title: "Private Attached Camp Washroom" },
      { url: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1200", category: "Dining Area", title: "Outdoor Open-Air Dining & Cafe" },
      { url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200", category: "Property & Views", title: "Night Stargazing Camp Site" }
    ]
  },
  {
    name: "Grand Regency Hotel",
    location: "Amritsar, Punjab",
    nights: "1 Night",
    type: "City Hotel",
    starRating: "4-Star",
    roomType: "Twin / Double Sharing",
    meals: "Buffet Breakfast",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200",
    amenities: ["Air Conditioning", "Free High-Speed Wi-Fi", "24/7 Room Service", "Buffet Breakfast Lounge"],
    gallery: [
      { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200", category: "Interior / Rooms", title: "Luxury King Bedroom" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200", category: "Bathroom", title: "Modern Marble Bathroom" },
      { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200", category: "Dining Area", title: "Grand Buffet Dining Restaurant" }
    ]
  }
];

export default function StaySection({ accommodations }: StaySectionProps) {
  const [selectedStay, setSelectedStay] = useState<Accommodation | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const staysList = accommodations && accommodations.length > 0 ? accommodations : defaultStaysList;

  const modalCategories = useMemo(() => {
    if (!selectedStay) return ["All"];
    const gallery = selectedStay.gallery || [];
    const catSet = new Set(gallery.map(img => img.category).filter(Boolean));
    const knownCats = ["Interior / Rooms", "Bathroom", "Dining Area", "Property & Views"];
    const hasAliases = (cat: string) => {
      if (catSet.has(cat)) return true;
      if (cat === "Property & Views" && (catSet.has("Exterior") || catSet.has("Swimming Pool"))) return true;
      if (cat === "Interior / Rooms" && (catSet.has("Interior") || catSet.has("Premium Room"))) return true;
      if (cat === "Dining Area" && catSet.has("Dining")) return true;
      return false;
    };
    const activeKnown = knownCats.filter(hasAliases);
    const extraCats = Array.from(catSet).filter(c => !knownCats.includes(c) && !["Exterior", "Swimming Pool", "Interior", "Premium Room", "Dining"].includes(c));
    return ["All", ...activeKnown, ...extraCats];
  }, [selectedStay]);

  const filteredImages = useMemo(() => {
    if (!selectedStay) return [];
    const gallery = selectedStay.gallery && selectedStay.gallery.length > 0
      ? selectedStay.gallery
      : [{ url: selectedStay.image, category: "Property & Views", title: selectedStay.name }];
    if (activeCategory === "All") return gallery;
    return gallery.filter(img => {
      if (img.category === activeCategory) return true;
      if (activeCategory === "Property & Views" && (img.category === "Exterior" || img.category === "Swimming Pool")) return true;
      if (activeCategory === "Interior / Rooms" && (img.category === "Interior" || img.category === "Premium Room")) return true;
      if (activeCategory === "Dining Area" && img.category === "Dining") return true;
      return false;
    });
  }, [selectedStay, activeCategory]);

  return (
    <section className="space-y-6 scroll-mt-[140px]" id="stay">
      {/* Header System */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0B1528] tracking-tight uppercase font-montserrat leading-none">
          STAY & <span className="text-[#D4541A]">ACCOMMODATIONS</span>
        </h2>
      </div>

      {/* Stays Horizontal 1.5 Cards Peek Slider on Mobile & Grid on Desktop */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 overflow-x-auto no-scrollbar py-2 scroll-smooth snap-x snap-mandatory touch-pan-x flex-nowrap sm:flex-wrap">
        {staysList.map((stay, i) => (
          <div key={i} className="flex-none snap-start w-[62vw] min-w-[210px] max-w-[250px] sm:w-auto flex flex-col">
            <div 
              onClick={() => {
                setSelectedStay(stay);
                setActiveCategory("All");
              }}
              className="bg-white border border-zinc-200/90 rounded-[18px] overflow-hidden shadow-2xs hover:border-[#D4541A] transition-all cursor-pointer group flex flex-col justify-between h-full"
            >
              <div>
                {/* Full-Bleed Stay Photo with Nights Badge */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 shadow-2xs">
                  <OptimizedImage 
                    src={normalizeImageUrl(stay.image) || defaultStaysList[i % defaultStaysList.length].image} 
                    alt={stay.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 bg-[#D4541A] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs font-montserrat">
                    {stay.nights}
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Stay Details */}
                <div className="p-3 pb-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#0B1528] font-montserrat line-clamp-1 group-hover:text-[#D4541A] transition-colors">
                    {stay.name}
                  </h3>
                  
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium font-montserrat mt-1">
                    <MapPin className="w-3 h-3 text-[#D4541A] shrink-0" />
                    <span className="truncate">{stay.location}</span>
                  </div>
                </div>
              </div>

              {/* Amenities Tag Row */}
              <div className="p-3 pt-2 mt-1.5 border-t border-zinc-100 flex items-center justify-between text-[10px] font-semibold text-zinc-600 font-montserrat">
                <div className="flex items-center gap-1 truncate mr-1">
                  <Building className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="truncate">{stay.type}</span>
                </div>
                {stay.starRating && (
                  <span className="text-[#D4541A] font-bold bg-orange-50 px-1.5 py-0.5 rounded text-[9px] shrink-0">
                    {stay.starRating}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Redesigned Stay Modal Popup with Interior / Bathroom / Dining / Views Section Tabs */}
      <AnimatePresence>
        {selectedStay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-3.5 sm:p-6 md:p-8 pt-[84px] sm:pt-6 pb-4 sm:pb-6 overflow-hidden"
          >
            <div className="fixed inset-0 bg-[#0B1528]/85 backdrop-blur-md" onClick={() => setSelectedStay(null)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-2xl z-10 max-h-[calc(100vh-104px)] sm:max-h-[88vh] flex flex-col border border-zinc-100"
            >
              {/* Modal Header (Full clearance from fixed navbar) */}
              <div className="p-4 sm:p-5 md:p-6 border-b border-zinc-100 flex items-start justify-between bg-white shrink-0">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-[#0B1528] font-montserrat tracking-tight leading-snug">
                    {selectedStay.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-zinc-500 font-montserrat">
                    <span className="font-semibold text-zinc-700">{selectedStay.location}</span>
                    <span>•</span>
                    <span className="text-[#D4541A] font-bold">{selectedStay.nights}</span>
                    {selectedStay.starRating && (
                      <>
                        <span>•</span>
                        <span className="bg-orange-50 text-[#D4541A] px-2 py-0.5 rounded font-bold text-[11px]">
                          {selectedStay.starRating}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStay(null)}
                  className="p-1.5 sm:p-2 rounded-full text-zinc-400 hover:text-[#0B1528] hover:bg-zinc-100 transition-colors cursor-pointer shrink-0 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Filter Pills (Interior / Rooms, Bathroom, Dining Area, Views) */}
              <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-zinc-100 bg-[#F8F9FA] shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {modalCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-montserrat transition-all shrink-0 cursor-pointer ${
                        activeCategory === cat
                          ? "bg-[#D4541A] text-white shadow-xs"
                          : "bg-white text-zinc-600 border border-zinc-200/80 hover:border-zinc-300"
                      }`}
                    >
                      {cat === "Interior / Rooms" && <BedDouble className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />}
                      {cat === "Bathroom" && <Bath className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />}
                      {cat === "Dining Area" && <Utensils className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />}
                      {cat === "Property & Views" && <Sparkles className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />}
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Body with Extra Bottom Scroll Padding so bottom photos are 100% unclipped */}
              <div className="p-4 sm:p-6 pb-12 sm:pb-16 overflow-y-auto flex-1 custom-scrollbar space-y-5">
                {/* Amenities Highlights Bar */}
                {selectedStay.amenities && selectedStay.amenities.length > 0 && (
                  <div className="p-4 bg-orange-50/40 border border-orange-100 rounded-2xl">
                    <p className="text-xs font-bold text-[#0B1528] uppercase tracking-wider font-montserrat mb-2">
                      Key Stay Highlights:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedStay.amenities.map((amenity, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-white border border-orange-200/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-700 font-montserrat shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#D4541A]" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photos Grid with Category Badge Overlay */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredImages.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="group bg-white border border-zinc-100 rounded-[18px] overflow-hidden shadow-xs"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                        <OptimizedImage 
                          src={normalizeImageUrl(img.url) || selectedStay.image} 
                          alt={img.title || selectedStay.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2.5 left-2.5 bg-[#0B1528]/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full font-montserrat">
                          {img.category}
                        </div>
                      </div>
                      {img.title && (
                        <div className="p-3">
                          <p className="text-xs font-bold text-[#0B1528] font-montserrat line-clamp-1">
                            {img.title}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

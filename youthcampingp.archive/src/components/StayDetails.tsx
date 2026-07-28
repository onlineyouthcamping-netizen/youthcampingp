"use client";

import { useState } from "react";
import { Bed, Utensils, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface Stay {
  location: string;
  nights: string;
  hotelName: string;
  rating: string;
  image: string;
  roomType: string;
  meals: string;
}

const MOCK_STAYS: Stay[] = [
  { 
    location: "Shimla", 
    nights: "1N", 
    hotelName: "Snow Land Shimla", 
    rating: "3 Star Hotel", 
    image: "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6", 
    roomType: "Deluxe Room", 
    meals: "Breakfast & Dinner" 
  },
  { 
    location: "Chitkul", 
    nights: "1N", 
    hotelName: "Riverview Cottage", 
    rating: "Boutique Cottage", 
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23", 
    roomType: "Wooden Room", 
    meals: "Breakfast & Dinner" 
  },
  { 
    location: "Tabo", 
    nights: "1N", 
    hotelName: "Tabo Homestay", 
    rating: "Heritage Stay", 
    image: "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c", 
    roomType: "Traditional Room", 
    meals: "Breakfast & Dinner" 
  },
  { 
    location: "Kaza", 
    nights: "3N", 
    hotelName: "Spiti Sarai", 
    rating: "Best in Kaza", 
    image: "https://images.unsplash.com/photo-1533130061792-64b345e4a833", 
    roomType: "Premium Room", 
    meals: "Breakfast & Dinner" 
  }
];

export default function StayDetails() {
  const [activeTab, setActiveTab] = useState(0);
  const stay = MOCK_STAYS[activeTab];

  return (
    <section className="mb-24">
      <h2 className="text-3xl font-bold text-navy mb-8">Stay Details</h2>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {MOCK_STAYS.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={cn(
              "px-6 py-3 rounded-xl border-2 transition-all font-bold text-sm relative",
              activeTab === i 
              ? "border-primary-orange bg-rose-50 text-primary-orange" 
              : "border-zinc-800 text-zinc-800"
            )}
          >
            {s.location} ({s.nights})
            {activeTab === i && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary-orange rounded-full flex items-center justify-center text-white">
                <Check className="w-3 h-3" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Stay Card */}
      <div className="bg-zinc-50 rounded-[40px] p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center">
        <div className="w-full md:w-80 aspect-video relative rounded-[30px] overflow-hidden shadow-xl">
           <OptimizedImage src={stay.image} alt={stay.hotelName} className="object-cover" />
           <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg text-[10px] font-bold capitalize">
              Gallery
           </div>
        </div>
        
        <div className="flex-1 text-left">
           <h3 className="text-2xl font-bold text-navy mb-2">{stay.hotelName}</h3>
           <p className="text-zinc-500 font-bold mb-8">{stay.rating}</p>
           
           <div className="space-y-4">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Bed className="w-5 h-5 text-zinc-400" />
                 </div>
                 <p className="font-bold text-navy">{stay.roomType}</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Utensils className="w-5 h-5 text-zinc-400" />
                 </div>
                 <p className="font-bold text-navy">{stay.meals}</p>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
}

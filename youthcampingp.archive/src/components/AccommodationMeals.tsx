"use client";

import { useState } from "react";
import { Bed, Utensils, Hotel, Tent, Home, Coffee, Info, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STAYS = [
  { location: "Shimla", type: "Hotel", icon: Hotel, tag: "Comfort", features: ["Centrally located", "Attached washrooms", "Room service"] },
  { location: "Chitkul", type: "Cottage", icon: Home, tag: "Raw Experience", features: ["River view", "Wooden interiors", "Last village vibe"] },
  { location: "Tabo", type: "Homestay", icon: Home, tag: "Authentic", features: ["Local host", "Cultural insight", "Traditional meals"] },
  { location: "Kaza", type: "Homestay", icon: Home, tag: "Comfort", features: ["Modern amenities", "Cozy bedding", "Near main market"] },
  { location: "Chandratal", type: "Camp", icon: Tent, tag: "Raw Experience", features: ["Luxury tents", "Stargazing", "Near Moon Lake"] },
  { location: "Manali", type: "Hotel", icon: Hotel, tag: "Comfort", features: ["Balcony rooms", "Hot water", "Mountain view"] },
];

const MEALS = [
  { label: "7 Breakfast", icon: Coffee },
  { label: "6 Dinner", icon: Utensils },
  { label: "Pure Veg", icon: Sparkles },
];

export default function AccommodationMeals() {
  const [selectedRoom, setSelectedRoom] = useState("4 Sharing");

  return (
    <div className="space-y-16 py-12">
      

      {/* C. Food Section */}
      <section className="bg-zinc-950 rounded-[40px] p-10 md:p-16 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-orange/10 blur-[100px] -z-0" />
        
        <div className="relative z-10">
          <h3 className="text-3xl font-semibold mb-12 flex items-center gap-4">
             <Utensils className="w-8 h-8 text-primary-orange" />
             Meals & Dining
          </h3>

          {/* Meal Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
             {MEALS.map((m, i) => (
               <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 flex items-center gap-6">
                  <div className="w-12 h-12 bg-primary-orange rounded-2xl flex items-center justify-center text-white">
                     <m.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xl font-semibold">{m.label}</span>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
             <div>
                <h4 className="text-primary-orange font-semibold uppercase tracking-wide text-xs mb-6">Breakfast Menu</h4>
                <p className="text-white/60 font-normal leading-relaxed italic">
                   Start your day with Hot Parathas, Poha, Sandwich, Omelettes, Bread-Jam, and local Himalayan Tea.
                </p>
             </div>
             <div>
                <h4 className="text-primary-orange font-semibold uppercase tracking-wide text-xs mb-6">Dinner Menu</h4>
                <p className="text-white/60 font-normal leading-relaxed italic">
                   A hearty spread featuring Paneer/Chicken Sabzi, Dal Tadka, Seasonal Veggies, Jeera Rice, Chapati, and a Sweet dish.
                </p>
             </div>
          </div>

          <div className="mt-16 pt-10 border-t border-white/5 flex items-center gap-4">
             <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                <Info className="w-5 h-5" />
             </div>
             <p className="font-semibold text-white/80">Important: Lunch is not included to allow exploration of local cafes.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
    </svg>
  );
}

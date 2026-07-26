import React from "react";
import Metadata from "next";
import Link from "next/link";
import { Compass, Heart, ShieldCheck, Zap, Users, Award, MapPin, Star, Phone, ArrowRight } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

const values = [
  {
    title: "Boutique Scale & Small Batches",
    description: "We cap group sizes to ensure every traveler receives personal attention, safe handling, and authentic team camaraderie.",
    icon: Heart
  },
  {
    title: "Deep Local Connection",
    description: "Our itineraries are built on long-standing relationships with Himalayan homestays, local drivers, and native guides.",
    icon: Compass
  },
  {
    title: "High Altitude Safety & Care",
    description: "Remote mountain travel demands precision. All our trip captains are certified in wilderness first aid and high-altitude protocols.",
    icon: ShieldCheck
  },
  {
    title: "Sustainable & Conscious Travel",
    description: "We adhere strictly to leave-no-trace principles, supporting local mountain economies and preserving pristine ecosystems.",
    icon: Zap
  }
];

const stats = [
  { label: "Expeditions Completed", value: "500+" },
  { label: "Happy Travelers", value: "15,000+" },
  { label: "Google Review Rating", value: "4.9 ★" },
  { label: "Repeat Traveler Rate", value: "98%" }
];

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen pt-24 font-montserrat pb-20">
      {/* Hero Header */}
      <section className="py-16 sm:py-20 px-5 sm:px-8 max-w-7xl mx-auto text-center border-b border-zinc-100">
        <span className="bg-orange-50 text-[#D4541A] font-extrabold tracking-widest uppercase text-xs px-3.5 py-1.5 rounded-full inline-block mb-4 shadow-2xs font-montserrat">
          OUR STORY & PHILOSOPHY
        </span>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-[#0B1528] tracking-tight uppercase leading-none font-montserrat">
          REDEFINING THE <br />
          <span className="text-[#D4541A]">MOUNTAIN JOURNEY</span>
        </h1>
        <div className="w-16 h-1.5 bg-[#D4541A] rounded-full mx-auto my-6" />
        <p className="text-base sm:text-xl text-zinc-600 font-semibold max-w-3xl mx-auto leading-relaxed">
          YouthCamping was born from a passion for raw, untouched landscapes and authentic group travels across India and beyond.
        </p>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#0B1528] text-white py-12 px-5 sm:px-8 my-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((st, i) => (
            <div key={i} className="space-y-1">
              <p className="text-3xl sm:text-5xl font-black text-[#D4541A] font-montserrat">{st.value}</p>
              <p className="text-xs sm:text-sm font-bold text-zinc-300 uppercase tracking-wider font-montserrat">{st.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story & Philosophy Section */}
      <section className="py-12 px-5 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative aspect-[4/3] rounded-[28px] overflow-hidden shadow-xl border border-zinc-100">
            <OptimizedImage 
              src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1600" 
              alt="YouthCamping Himalayan Trip" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0B1528] tracking-tight leading-tight uppercase font-montserrat">
              More Than A Travel Company — <br />
              <span className="text-[#D4541A]">A Community Of Explorers</span>
            </h2>
            <div className="space-y-4 text-xs sm:text-sm text-zinc-600 font-semibold leading-relaxed">
              <p>
                Founded in 2018, YouthCamping started as a group of passionate mountain enthusiasts exploring the high passes of Himachal Pradesh and Ladakh. Today, we are one of India&apos;s leading experiential travel platforms.
              </p>
              <p>
                We believe that the best stories are written off the beaten path — sipping hot chai at 14,000 feet, stargazing at remote high-altitude campsites, or exploring ancient Himalayan villages.
              </p>
              <p>
                Every itinerary is designed with meticulous detail — from handpicked cozy homestays to experienced local drivers and certified trip captains who ensure 100% safety and top-tier hospitality.
              </p>
            </div>

            <div className="pt-2">
              <Link 
                href="/trips" 
                className="inline-flex items-center gap-2 bg-[#D4541A] hover:bg-[#c24813] text-white px-6 py-3.5 rounded-full font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20 active:scale-95"
              >
                <span>Explore Our Expeditions</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-16 px-5 sm:px-8 max-w-7xl mx-auto border-t border-zinc-100">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-[#D4541A] font-extrabold text-xs uppercase tracking-widest font-montserrat">
            WHY TRAVEL WITH US
          </span>
          <h3 className="text-2xl sm:text-4xl font-black text-[#0B1528] uppercase tracking-tight font-montserrat">
            OUR CORE FOUNDATIONS
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <div key={i} className="bg-slate-50 border border-zinc-200/80 rounded-[24px] p-6 space-y-3 hover:bg-white hover:border-[#D4541A] hover:shadow-lg transition-all">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#D4541A] flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-extrabold text-[#0B1528] font-montserrat leading-tight">{v.title}</h4>
                <p className="text-xs text-zinc-500 font-semibold leading-relaxed font-montserrat">{v.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

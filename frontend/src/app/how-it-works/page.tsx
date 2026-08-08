import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import {
  Compass,
  Calendar,
  CheckCircle2,
  MapPin,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works | YouthCamping OS",
  description:
    "Learn how to book, customize, and embark on your YouthCamping expedition in 4 easy steps.",
};

const steps = [
  {
    step: "01",
    title: "Explore & Select Destination",
    description:
      "Browse our curated expeditions across Spiti, Ladakh, Kasol, Kerala, and international circuits. Filter by starting stations (Ex-Delhi, Ex-Ahmedabad, Ex-Chandigarh, Ex-Mumbai).",
    icon: Compass,
  },
  {
    step: "02",
    title: "Customize & Reserve Seat",
    description:
      "Select your preferred departure dates, room sharing preferences (Quad / Triple / Twin), and optional add-ons. Reserve your seat with an advance booking amount.",
    icon: Calendar,
  },
  {
    step: "03",
    title: "Receive Confirmation & Vouchers",
    description:
      "Get instant confirmation receipts, IRCTC train ticket updates, pre-trip packing checklists, and join your batch's WhatsApp coordination group.",
    icon: CheckCircle2,
  },
  {
    step: "04",
    title: "Embark On The Expedition",
    description:
      "Meet your certified trip captain at the designated starting station, check into cozy homestays, and create unforgettable memories with fellow travelers!",
    icon: MapPin,
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-white min-h-screen pt-24 font-montserrat pb-20">
      {/* Top Banner */}
      <section className="bg-[#0B1528] text-white py-16 sm:py-20 px-5 sm:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-3 relative z-10">
          <span className="bg-white/10 text-[#D4541A] font-extrabold tracking-widest uppercase text-xs px-3.5 py-1.5 rounded-full inline-block font-montserrat">
            SIMPLE & SEAMLESS BOOKING PROCESS
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-montserrat">
            HOW IT <span className="text-[#D4541A]">WORKS</span>
          </h1>
          <div className="w-16 h-1.5 bg-[#D4541A] rounded-full mx-auto my-3" />
          <p className="text-xs sm:text-sm text-zinc-300 font-semibold max-w-xl mx-auto leading-relaxed">
            From picking your destination to landing at the campsite — here is
            your 4-step journey.
          </p>
        </div>
      </section>

      {/* 4-Step Cards Grid */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div
              key={i}
              className="bg-white border border-zinc-200/90 rounded-[28px] p-6 shadow-2xs hover:border-[#D4541A] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="w-12 h-12 rounded-2xl bg-orange-50 text-[#D4541A] font-black text-lg flex items-center justify-center font-montserrat shadow-xs group-hover:bg-[#D4541A] group-hover:text-white transition-all">
                    {s.step}
                  </span>
                  <s.icon className="w-6 h-6 text-zinc-400 group-hover:text-[#D4541A] transition-colors" />
                </div>

                <h3 className="text-base font-extrabold text-[#0B1528] mb-2 font-montserrat">
                  {s.title}
                </h3>
                <p className="text-xs text-zinc-500 font-semibold leading-relaxed font-montserrat">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="mt-16 bg-[#F8F9FA] border border-zinc-200/90 rounded-[32px] p-8 sm:p-12 text-center max-w-4xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0B1528] font-montserrat uppercase tracking-tight">
            Ready To Start Your{" "}
            <span className="text-[#D4541A]">Adventure?</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 font-semibold max-w-lg mx-auto">
            Check out our upcoming weekend getaways and mountain expeditions
            with guaranteed departures.
          </p>
          <div className="pt-2">
            <Link
              href="/trips"
              className="inline-flex items-center gap-2 bg-[#D4541A] hover:bg-[#c24813] text-white px-8 py-3.5 rounded-full font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20 active:scale-95"
            >
              <span>Browse All Trips</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

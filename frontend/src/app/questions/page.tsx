"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, MessageSquare, Phone } from "lucide-react";

const faqs = [
  {
    category: "Booking & Payments",
    questions: [
      {
        q: "How do I book a trip with YouthCamping?",
        a: "Simply browse our trips, select your preferred departure date and station (Ex-Delhi, Ex-Ahmedabad, Ex-Chandigarh, Ex-Mumbai), fill out the inquiry form, and our team will confirm your seat within 24 hours.",
      },
      {
        q: "What payment modes are accepted?",
        a: "We accept bank transfers (NEFT/IMPS), UPI payments, and cash at our Ahmedabad office. We do not accept payments via third-party portals or agents not listed on our website.",
      },
      {
        q: "When is full payment due?",
        a: "Full payment must be completed before your departure date. An advance booking amount is required to secure your seat at the time of booking.",
      },
    ],
  },
  {
    category: "Train Tickets & Travel",
    questions: [
      {
        q: "Who books the train tickets?",
        a: "YouthCamping handles all train ticket bookings via IRCTC. Ticket status (Confirmed / RAC / WL) is communicated to you before and after booking. We do not guarantee confirmed status but try our best to secure confirmed seats.",
      },
      {
        q: "What if my train ticket is on Waiting List?",
        a: "We proactively monitor WL ticket status and inform you. In case of non-confirmation closer to departure, we arrange alternative transport or issue refunds for the ticket cost.",
      },
    ],
  },
  {
    category: "Stays & Accommodation",
    questions: [
      {
        q: "What types of stays are included in the trip?",
        a: "Depending on the route, stays include Boutique Hotels, Heritage Himalayan Homestays, and Luxury Dome Camping sites — all handpicked for cleanliness, hot water, and scenic value.",
      },
      {
        q: "Are meals included in the package?",
        a: "Most packages include breakfast and dinner. Local organic meals are served at homestay properties. All dietary restrictions should be communicated 5 days prior to departure.",
      },
    ],
  },
  {
    category: "Safety & Group Dynamics",
    questions: [
      {
        q: "How large are the travel groups?",
        a: "Our standard group size ranges from 15 to 40 travelers per batch. Smaller groups of under 10 travelers are handled as private custom expeditions.",
      },
      {
        q: "Is this safe for solo female travelers?",
        a: "Absolutely! Thousands of solo female travelers have explored with us. Our certified trip captains maintain strict group safety protocols and regular safety briefings.",
      },
      {
        q: "What happens in a medical emergency at high altitude?",
        a: "Our trip captains carry first-aid kits and emergency oxygen cylinders. We work with local mountain rescue teams and have direct contact with emergency hospitals in all key route cities.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white min-h-screen font-montserrat pt-24 pb-20">
      {/* Top Banner */}
      <section className="bg-[#0B1528] text-white py-16 sm:py-20 px-5 sm:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-3 relative z-10">
          <span className="bg-white/10 text-[#D4541A] font-extrabold tracking-widest uppercase text-xs px-3.5 py-1.5 rounded-full inline-block font-montserrat">
            QUICK ANSWERS FOR TRAVELERS
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-montserrat">
            FREQUENTLY ASKED <span className="text-[#D4541A]">QUESTIONS</span>
          </h1>
          <div className="w-16 h-1.5 bg-[#D4541A] rounded-full mx-auto my-3" />
          <p className="text-xs sm:text-sm text-zinc-300 font-semibold max-w-xl mx-auto leading-relaxed">
            Answers to the most common questions from our traveler community.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12 space-y-10">
        {faqs.map((group, gi) => (
          <div key={gi} className="space-y-3">
            {/* Category Label */}
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-[#D4541A] text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-montserrat">
                {group.category}
              </span>
            </div>

            {group.questions.map((item, qi) => {
              const key = `${gi}-${qi}`;
              const isOpen = !!openMap[key];
              return (
                <div
                  key={qi}
                  className={`bg-white border rounded-[20px] overflow-hidden transition-all shadow-2xs ${isOpen ? "border-[#D4541A]" : "border-zinc-200/90"}`}
                >
                  <button
                    onClick={() => toggle(key)}
                    className="w-full px-5 sm:px-6 py-4 flex items-center justify-between gap-3 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle
                        className={`w-4 h-4 shrink-0 transition-colors ${isOpen ? "text-[#D4541A]" : "text-zinc-400"}`}
                      />
                      <span className="text-sm font-extrabold text-[#0B1528] font-montserrat leading-snug">
                        {item.q}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-[#D4541A] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-4 pt-0 border-t border-zinc-100 text-xs sm:text-sm text-zinc-600 font-semibold leading-relaxed pl-[calc(1.25rem+28px)] font-montserrat">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Still Have Questions Banner */}
        <div className="bg-[#0B1528] rounded-[28px] p-7 sm:p-10 mt-10 text-center space-y-3">
          <h3 className="text-lg sm:text-2xl font-black text-white font-montserrat uppercase tracking-tight">
            Still Have Questions?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 font-semibold font-montserrat max-w-md mx-auto leading-relaxed">
            Our 24/7 expedition team is available Mon–Sat 10 AM to 7 PM to
            answer any specific itinerary or booking questions.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
            <a
              href="https://wa.me/919924246267"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#D4541A] text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-full transition-all hover:bg-[#c24813] active:scale-95 cursor-pointer shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Us</span>
            </a>
            <a
              href="tel:+919924246267"
              className="inline-flex items-center gap-2 bg-white/10 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-full hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>+91-99242 46267</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { X, ArrowRight, ShieldCheck, FileText, Backpack, ShoppingBag, Info, CheckCircle, MessageSquare } from "lucide-react";
import { parseTripDate } from "@/lib/parseTripDate";

interface Section {
  id: string;
  label: string;
  type: "list" | "simple" | "table" | "categorical";
  content: any[];
  note?: string;
}

const SECTIONS: Section[] = [
  { 
    id: "cancellation", 
    label: "Cancellation Policy", 
    type: "list",
    content: [
      { label: "Before more than 40 days of Departure", val: "10% deduction" },
      { label: "Before 21 to 40 days of Departure", val: "25% deduction" },
      { label: "Before 11 to 20 days of Departure", val: "40% deduction" },
      { label: "Before 2 to 10 days of Departure", val: "60% deduction" },
      { label: "In the last 48 hours of Departure", val: "90% deduction" }
    ],
    note: "Cancellation would be granted by the Senior Registration Manager on receiving cancellation requests through the website."
  },
  { 
    id: "inclusions", 
    label: "Inclusion & Exclusion", 
    type: "simple",
    content: ["Check the detailed section on the main page for a full breakdown of what's covered and what's not."]
  },
  { 
    id: "terms", 
    label: "Terms & Conditions", 
    type: "simple",
    content: [
      "The itinerary is subject to change due to weather or unforeseen conditions.",
      "All travellers must carry a valid ID proof.",
      "The decision of the trip captain will be final in case of any disputes.",
      "YouthCamping is not responsible for any personal loss or damage."
    ]
  },
  { 
    id: "carry", 
    label: "Things to Carry", 
    type: "categorical",
    content: [
      {
        category: "Mandatory Requirements",
        items: [
          { text: "Medical Certificate", link: "#", linkText: "(Click here for Download)" },
          { text: "Original ID Proof with 2 Xerox Copy" },
          { text: "Screenshot of Fees Receipt" }
        ]
      },
      {
        category: "Trekking Gears (Available on Rent/Sale)",
        items: [
          { text: "Trekking Shoes" },
          { text: "Micro Spikes & Gaiters" },
          { text: "Feather/Down Jacket (-10 Degree)" },
          { text: "Backpack with Raincover (60-70 litres)" },
          { text: "Rainwear (Poncho)" },
          { text: "Head Torch" },
          { text: "Thermal Inner Wear" },
          { text: "Snow Proof Hand Gloves" },
          { text: "Thick Woolen Socks" },
          { text: "Woolen Cap" }
        ]
      },
      {
        category: "Clothes",
        items: [
          { text: "Full Sleeve T-Shirts" },
          { text: "Normal Jacket/Fleece" },
          { text: "Trek Pants (Quick Dry would be Better)" },
          { text: "Face Mask/Buff" }
        ]
      },
      {
        category: "Personal Items",
        items: [
          { text: "Woolen Hand Gloves" },
          { text: "Sun Cap" },
          { text: "Sun Glass" },
          { text: "Sanitiser & Face Mask" },
          { text: "Slipper & Socks" },
          { text: "Plastic Bags (for wet clothes)" },
          { text: "Personal Sanitary Items" },
          { text: "2 Water Bottles & Snacks" },
          { text: "Lunch Box, Mug & Spoon" },
          { text: "Sunscreen (SPF 40+)" },
          { text: "Camera & Power Banks" },
          { text: "Personal Medication if any" }
        ]
      }
    ]
  }
];

interface PopupDetailsProps {
  startDate?: string | null;
  details?: {
    cancellation: { label: string; val: string }[];
    gears: { item: string; price: string }[];
    terms: string[];
    carry: any[];
    etiquette: { title: string; desc: string }[];
    customPolicies?: { label: string; type: string; content: any[] }[];
    showRentedGears?: boolean;
  };
}

export default function PopupDetails({ details, startDate }: PopupDetailsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const formatDate = (days: number) => {
    if (!startDate) return null;
    const d = parseTripDate(startDate);
    if (!d) return null;
    d.setDate(d.getDate() - days);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  // Merge dynamic data if available
  let activeSections = [...SECTIONS];

  if (details) {
    activeSections = activeSections.map(sec => {
      let content = sec.content;
      if (sec.id === "cancellation" && details.cancellation?.length > 0) content = details.cancellation;
      if (sec.id === "terms" && details.terms?.length > 0) content = details.terms;
      if (sec.id === "carry" && details.carry?.length > 0) content = details.carry;

      // Dynamic date formatting for cancellation policy
      if (sec.id === "cancellation" && startDate) {
        content = content.map((item: any) => {
          let label = item.label;
          if (label.toLowerCase().includes("more than 40 days")) {
            label = `Before ${formatDate(41)}`;
          } else if (label.toLowerCase().includes("21 to 40 days")) {
            label = `${formatDate(40)} to ${formatDate(21)}`;
          } else if (label.toLowerCase().includes("11 to 20 days")) {
            label = `${formatDate(20)} to ${formatDate(11)}`;
          } else if (label.toLowerCase().includes("2 to 10 days")) {
            label = `${formatDate(10)} to ${formatDate(2)}`;
          } else if (label.toLowerCase().includes("48 hours")) {
            label = `After ${formatDate(2)}`;
          }
          return { ...item, label };
        });
      }

      return { ...sec, content };
    });

    // Add Rented Gears if available
    if (details.gears?.length > 0 && details.showRentedGears !== false) {
      activeSections.push({
        id: "gears",
        label: "Rented Gears",
        type: "categorical",
        content: details.gears.map((cat: any) => ({
          category: cat.category,
          items: (cat.items || []).map((i: any) => ({
            text: i.item,
            linkText: i.price ? `(₹${i.price})` : ""
          }))
        }))
      });
    }

    // Add Local Etiquette if available
    if (details.etiquette?.length > 0) {
      activeSections.push({
        id: "etiquette",
        label: "Local Etiquette",
        type: "categorical",
        content: details.etiquette.map(e => ({
          category: e.title,
          items: [{ text: e.desc }]
        }))
      });
    }

    // Append custom policies
    if (details.customPolicies?.length) {
      const customs = details.customPolicies.map((cp, idx) => ({
        id: `custom-${idx}`,
        label: cp.label,
        type: (cp.type || "simple") as any,
        content: cp.content
      }));
      activeSections = [...activeSections, ...customs];
    }
  }

  const activeSection = activeSections.find(s => s.id === activeId);

  return (
    <section className="mb-0 scroll-mt-[140px]" id="policies">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {activeSections.map((sec) => {
          const Icon = sec.id === "cancellation" ? ShieldCheck 
                    : sec.id === "terms" ? FileText
                    : sec.id === "carry" ? Backpack
                    : sec.id === "gears" ? ShoppingBag
                    : sec.id === "etiquette" ? Info
                    : sec.id === "inclusions" ? CheckCircle
                    : MessageSquare;

          return (
            <button
              key={sec.id}
              onClick={() => setActiveId(sec.id)}
              className="group relative bg-[#F8F9FB] border border-zinc-200/80 rounded-[14px] px-3 py-2.5 flex items-center gap-2.5 hover:bg-[#0B1528] hover:border-[#0B1528] transition-all duration-300 cursor-pointer text-left overflow-hidden shadow-2xs"
            >
              {/* Accent dot top-right */}
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#D4541A] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Icon badge */}
              <div className="w-8 h-8 rounded-[8px] bg-white group-hover:bg-[#D4541A] border border-zinc-200/80 group-hover:border-[#D4541A] flex items-center justify-center shadow-xs transition-all duration-300 shrink-0">
                <Icon className="w-4 h-4 text-[#0B1528] group-hover:text-white transition-colors duration-300" />
              </div>

              {/* Label */}
              <span className="font-bold text-xs text-[#0B1528] group-hover:text-white font-montserrat leading-tight transition-colors duration-300 truncate">
                {sec.label}
              </span>
            </button>
          );
        })}
      </div>

      {activeId && (
        <div 
          onClick={() => setActiveId(null)}
          className="fixed inset-0 z-[100000] flex items-center justify-center p-3.5 sm:p-6 pt-[84px] sm:pt-6 pb-4 sm:pb-6 bg-[#0B1528]/85 backdrop-blur-md transition-all duration-300 overflow-hidden"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-xl rounded-[28px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] relative flex flex-col max-h-[calc(100vh-104px)] sm:max-h-[86vh]"
          >
            {/* Dark Navy Header */}
            <div className="bg-[#0B1528] px-5 sm:px-6 py-4.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-[#D4541A]/20 flex items-center justify-center">
                  {(() => {
                    const Icon = activeId === "cancellation" ? ShieldCheck 
                              : activeId === "terms" ? FileText
                              : activeId === "carry" ? Backpack
                              : activeId === "gears" ? ShoppingBag
                              : activeId === "etiquette" ? Info
                              : activeId === "inclusions" ? CheckCircle
                              : MessageSquare;
                    return <Icon className="w-4.5 h-4.5 text-[#D4541A]" />;
                  })()}
                </div>
                <h2 className="text-base font-extrabold text-white font-montserrat tracking-tight">
                  {activeSection?.label}
                </h2>
              </div>
              <button 
                onClick={() => setActiveId(null)}
                className="text-zinc-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 md:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">

              {/* CATEGORICAL type (Things to Carry / Gears) */}
              {activeSection?.type === "categorical" && (
                <div className="space-y-5">
                  {activeSection.content.map((cat: any, idx: number) => {
                    if (!cat || !cat.items) return null;
                    return (
                      <div key={idx} className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-3.5 bg-[#D4541A] rounded-full shrink-0" />
                          <h3 className="text-xs font-extrabold text-[#0B1528] uppercase tracking-widest font-montserrat">
                            {cat.category || "GENERAL ITEMS"}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {cat.items.map((item: any, i: number) => {
                            const text = item.text || item.label || item;
                            return (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 bg-[#F8F9FB] border border-zinc-200/80 text-[#0B1528] font-semibold text-xs font-montserrat px-3 py-1.5 rounded-full"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4541A] shrink-0" />
                                {text}
                                {item.link ? (
                                  <a 
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#D4541A] font-bold hover:underline text-[10px] ml-0.5"
                                  >
                                    {item.linkText || "Download"}
                                  </a>
                                ) : item.linkText ? (
                                  <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full ml-0.5">
                                    {item.linkText}
                                  </span>
                                ) : null}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TABLE type (Rented Gears with price) */}
              {activeSection?.type === "table" && (
                <div className="space-y-4">
                  <div className="rounded-[16px] border border-zinc-200/80 overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#0B1528]">
                          <th className="text-left px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 font-montserrat">Item</th>
                          <th className="text-right px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 font-montserrat">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {activeSection.content.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-orange-50/30 transition-colors">
                            <td className="px-5 py-3.5 font-semibold text-[#0B1528] text-xs font-montserrat">{row.item}</td>
                            <td className="px-5 py-3.5 text-right">
                              <span className="font-extrabold text-xs text-[#D4541A] bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full font-montserrat">
                                {row.price}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {activeSection.note && (
                    <div className="flex items-start gap-3 p-4 bg-orange-50/50 rounded-[14px] border border-orange-100">
                      <Info className="w-4 h-4 text-[#D4541A] shrink-0 mt-0.5" />
                      <p className="text-[11px] text-zinc-600 font-semibold font-montserrat leading-relaxed italic">{activeSection.note}</p>
                    </div>
                  )}
                </div>
              )}

              {/* LIST type (Cancellation Policy) */}
              {activeSection?.type === "list" && (
                <div className="space-y-2.5">
                  {activeSection.content.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-4 bg-[#F8F9FB] border border-zinc-200/80 rounded-[14px] px-4 py-3.5 hover:border-[#D4541A]/30 transition-all">
                      <span className="text-xs font-semibold text-zinc-500 font-montserrat leading-snug flex-1">{item.label}</span>
                      <span className="font-extrabold text-xs text-[#D4541A] bg-orange-50 border border-orange-100 px-3 py-1 rounded-full font-montserrat shrink-0 whitespace-nowrap">
                        {item.val}
                      </span>
                    </div>
                  ))}
                  {activeSection.note && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50/50 rounded-[14px] border border-amber-100 mt-3">
                      <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-zinc-600 font-semibold font-montserrat leading-relaxed italic">{activeSection.note}</p>
                    </div>
                  )}
                </div>
              )}

              {/* SIMPLE type (Terms & Conditions, Inclusions) */}
              {activeSection?.type === "simple" && (
                <div className="space-y-2.5">
                  {activeSection.content.map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-[#F8F9FB] border border-zinc-200/80 rounded-[14px]">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#D4541A] shrink-0" />
                      <p className="text-xs text-zinc-700 font-semibold font-montserrat leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </section>

  );
}

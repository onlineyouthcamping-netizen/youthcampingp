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
    <section className="mb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-12 px-6">
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
              className="flex items-center justify-between py-8 border-b border-zinc-100 hover:bg-zinc-50/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-50 group-hover:bg-primary-orange/10 flex items-center justify-center transition-all group-hover:scale-110">
                   <Icon className="w-5 h-5 text-zinc-400 group-hover:text-primary-orange transition-colors" />
                </div>
                <span className="font-bold text-xs capitalize tracking-widest text-zinc-400 group-hover:text-navy transition-colors">{sec.label}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-primary-orange transition-all transform group-hover:translate-x-1" />
            </button>
          );
        })}
      </div>

      {activeId && (
        <div 
          onClick={() => setActiveId(null)}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-navy/60 backdrop-blur-md transition-all duration-500 animate-in fade-in"
        >
           <div 
             onClick={(e) => e.stopPropagation()}
             className="bg-white w-full max-w-2xl rounded-[24px] md:rounded-[32px] overflow-hidden shadow-[0_32px_80px_-20px_rgba(0,0,0,0.3)] relative animate-in zoom-in slide-in-from-bottom-8 duration-500 flex flex-col max-h-[90vh] md:max-h-[85vh]"
           >
              {/* Modal Header */}
              <div className="p-5 md:p-8 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
                 <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                   {activeSection?.id === "carry" ? "Packing List" : activeSection?.label}
                 </h2>
                 <button 
                   onClick={() => setActiveId(null)}
                   className="text-slate-500 hover:text-slate-900 transition-colors p-1"
                 >
                   <X className="w-6 h-6" />
                 </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-5 md:p-10 overflow-y-auto flex-1 custom-scrollbar">
                {activeSection?.type === "categorical" && (
                  <div className="space-y-8">
                    {activeSection.content.map((cat: any, idx: number) => {
                      if (!cat || !cat.items) return null;
                      return (
                        <div key={idx} className="space-y-3">
                          <h3 className="text-sm font-bold text-slate-800">{cat.category}</h3>
                          <ul className="list-disc pl-5 space-y-2 text-zinc-700 font-medium text-sm">
                            {cat.items.map((item: any, i: number) => {
                              const text = item.text || item.label || item;
                              return (
                                <li key={i} className="leading-relaxed">
                                  <span className="inline-flex items-center gap-2">
                                    {text}
                                    {item.linkText && (
                                      <span className="text-[9px] font-bold text-navy bg-slate-50 px-2 py-0.5 rounded border border-zinc-100 shadow-sm">
                                        {item.linkText}
                                      </span>
                                    )}
                                    {item.link && (
                                      <a href={item.link} className="text-primary-orange hover:underline text-xs inline-flex items-center gap-1">
                                        {item.linkText || "Download"} <ArrowRight className="w-3 h-3" />
                                      </a>
                                    )}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeSection?.type === "table" && (
                  <div className="space-y-8">
                    <div className="bg-zinc-50/50 rounded-[24px] border border-zinc-100 overflow-hidden">
                      <table className="w-full border-collapse">
                        <thead>
                           <tr className="bg-zinc-100/50">
                             <th className="text-left px-6 py-4 text-[10px] font-bold capitalize tracking-widest text-zinc-400">Item Name</th>
                             <th className="text-right px-6 py-4 text-[10px] font-bold capitalize tracking-widest text-zinc-400">Rent Price</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {activeSection.content.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-white transition-colors">
                              <td className="px-6 py-5 font-bold text-navy text-sm">{row.item}</td>
                              <td className="px-6 py-5 text-right font-bold text-primary-orange">{row.price}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {activeSection.note && (
                      <div className="flex items-start gap-3 p-4 bg-primary-orange/5 rounded-2xl border border-primary-orange/10">
                        <ArrowRight className="w-4 h-4 text-primary-orange shrink-0 mt-0.5" />
                        <p className="text-[10px] text-zinc-500 font-bold capitalize tracking-wider italic">{activeSection.note}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeSection?.type === "list" && (
                  <div className="space-y-4">
                    {activeSection.content.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-zinc-50/50 rounded-[24px] border border-zinc-100 hover:bg-white hover:shadow-lg hover:shadow-zinc-100 transition-all">
                        <span className="text-xs font-bold text-zinc-400 capitalize tracking-widest">{item.label}</span>
                        <span className="text-sm font-bold text-navy bg-white px-4 py-2 rounded-xl shadow-sm border border-zinc-100">{item.val}</span>
                      </div>
                    ))}
                    {activeSection.note && (
                       <p className="p-6 text-sm text-zinc-500 font-medium leading-relaxed bg-zinc-50 rounded-[24px] border border-zinc-100 italic">
                         {activeSection.note}
                       </p>
                    )}
                  </div>
                )}

                {activeSection?.type === "simple" && (
                  <div className="space-y-4">
                    {activeSection.content.map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-5 p-6 bg-zinc-50/30 rounded-[24px] border border-zinc-100">
                        <div className="mt-1 w-2 h-2 rounded-full bg-primary-orange shadow-[0_0_10px_rgba(255,87,34,0.4)] shrink-0" />
                        <p className="text-zinc-600 font-bold text-sm leading-relaxed">{item}</p>
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

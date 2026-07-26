import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { RefreshCw, Clock, AlertTriangle, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Cancellation Policy | YouthCamping OS",
  description: "Cancellation and refund terms for YouthCamping trips.",
};

export default function CancellationPolicyPage() {
  return (
    <div className="bg-white min-h-screen pt-24 font-montserrat pb-20">
      {/* Top Banner */}
      <section className="bg-[#0B1528] text-white py-16 sm:py-20 px-5 sm:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-3 relative z-10">
          <span className="bg-white/10 text-[#D4541A] font-extrabold tracking-widest uppercase text-xs px-3.5 py-1.5 rounded-full inline-block font-montserrat">
            TRANSPARENT REFUND TIMELINES
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-montserrat">
            CANCELLATION & <span className="text-[#D4541A]">REFUND POLICY</span>
          </h1>
          <div className="w-16 h-1.5 bg-[#D4541A] rounded-full mx-auto my-3" />
          <p className="text-xs sm:text-sm text-zinc-300 font-semibold max-w-xl mx-auto leading-relaxed">
            We understand plans can change. Here is our transparent refund and cancellation policy.
          </p>
        </div>
      </section>

      {/* Main Content Document Container */}
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
        <div className="bg-white border border-zinc-200/90 rounded-[28px] p-6 sm:p-10 shadow-2xs space-y-10">
          <section className="space-y-3 border-b border-zinc-100 pb-8">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-orange-50 text-[#D4541A] font-black text-xs flex items-center justify-center font-montserrat">
                01
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#0B1528] font-montserrat uppercase tracking-tight">
                Cancellation Request Timelines
              </h2>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-zinc-600 font-semibold leading-relaxed pl-9">
              <p>• Cancellation 30+ days before trip start: 90% refund or 100% trip voucher.</p>
              <p>• Cancellation 15-30 days before trip start: 50% refund or 75% trip voucher.</p>
              <p>• Cancellation less than 15 days before trip start: Non-refundable due to pre-booked hotel, transport & permit commitments.</p>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-orange-50 text-[#D4541A] font-black text-xs flex items-center justify-center font-montserrat">
                02
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#0B1528] font-montserrat uppercase tracking-tight">
                Unforeseen Weather & Natural Calamities
              </h2>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-zinc-600 font-semibold leading-relaxed pl-9">
              <p>
                In case of trip cancellation due to unexpected landslides, snow blockages, or government advisories, a trip credit voucher of equal value will be issued for future travel within 12 months.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

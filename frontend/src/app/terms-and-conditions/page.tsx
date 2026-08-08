import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Shield,
  AlertTriangle,
  Phone,
  Mail,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Terms and Conditions | YouthCamping OS",
  description:
    "Terms and conditions for YouthCamping adventure and leisure trips.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="bg-white min-h-screen pt-24 font-montserrat pb-20">
      {/* Top Banner */}
      <section className="bg-[#0B1528] text-white py-16 sm:py-20 px-5 sm:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-3 relative z-10">
          <span className="bg-white/10 text-[#D4541A] font-extrabold tracking-widest uppercase text-xs px-3.5 py-1.5 rounded-full inline-block font-montserrat">
            LEGAL POLICIES & GUIDELINES
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-montserrat">
            TERMS & <span className="text-[#D4541A]">CONDITIONS</span>
          </h1>
          <div className="w-16 h-1.5 bg-[#D4541A] rounded-full mx-auto my-3" />
          <p className="text-xs sm:text-sm text-zinc-300 font-semibold max-w-xl mx-auto leading-relaxed">
            Please read these terms carefully before booking any adventure
            expedition with YouthCamping.
          </p>
        </div>
      </section>

      {/* Main Content Document Container */}
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
        <div className="bg-white border border-zinc-200/90 rounded-[28px] p-6 sm:p-10 shadow-2xs space-y-10">
          {/* Section 1: Declaration & Risk Acceptance */}
          <section className="space-y-3 border-b border-zinc-100 pb-8">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-orange-50 text-[#D4541A] font-black text-xs flex items-center justify-center font-montserrat">
                01
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#0B1528] font-montserrat uppercase tracking-tight">
                Declaration & Voluntary Participation
              </h2>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-zinc-600 font-semibold leading-relaxed pl-9">
              <p>
                By booking a trip with YouthCamping, you declare that you are
                participating in this adventure & leisure trip on your own free
                will and at your own risk. Remote mountain exploration carries
                inherent terrain and climate risks.
              </p>
              <p>
                YouthCamping, its trip captains, and affiliated partners shall
                not be held liable for personal injury, illness, or loss/damage
                to personal baggage resulting from participant negligence or
                unapproved hazardous activities.
              </p>
            </div>
          </section>

          {/* Section 2: Booking & Payment Terms */}
          <section className="space-y-3 border-b border-zinc-100 pb-8">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-orange-50 text-[#D4541A] font-black text-xs flex items-center justify-center font-montserrat">
                02
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#0B1528] font-montserrat uppercase tracking-tight">
                Booking & Payment Terms
              </h2>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-zinc-600 font-semibold leading-relaxed pl-9">
              <p>
                A minimum deposit is required at time of booking to reserve
                seats. Full remaining balance must be cleared at least 7 days
                prior to departure date.
              </p>
            </div>
          </section>

          {/* Section 3: Code of Conduct */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-orange-50 text-[#D4541A] font-black text-xs flex items-center justify-center font-montserrat">
                03
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#0B1528] font-montserrat uppercase tracking-tight">
                Code of Conduct & Captain Authority
              </h2>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-zinc-600 font-semibold leading-relaxed pl-9">
              <p>
                Participants are expected to respect local mountain cultures,
                environmental guidelines, and fellow group travelers. The
                decision of the assigned trip captain is final in all matters of
                group safety.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

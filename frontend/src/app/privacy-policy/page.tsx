import React from "react";
import { Metadata } from "next";
import { ShieldCheck, Lock, Eye, Database } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | YouthCamping OS",
  description:
    "Learn about how YouthCamping protects and handles your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-screen pt-24 font-montserrat pb-20">
      {/* Top Banner */}
      <section className="bg-[#0B1528] text-white py-16 sm:py-20 px-5 sm:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-3 relative z-10">
          <span className="bg-white/10 text-[#D4541A] font-extrabold tracking-widest uppercase text-xs px-3.5 py-1.5 rounded-full inline-block font-montserrat">
            DATA PRIVACY & SECURITY
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-montserrat">
            PRIVACY <span className="text-[#D4541A]">POLICY</span>
          </h1>
          <div className="w-16 h-1.5 bg-[#D4541A] rounded-full mx-auto my-3" />
          <p className="text-xs sm:text-sm text-zinc-300 font-semibold max-w-xl mx-auto leading-relaxed">
            Your privacy is our utmost priority. Read how we collect, safeguard,
            and use your travel data.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12 space-y-8">
        <div className="bg-white border border-zinc-200/90 rounded-[28px] p-6 sm:p-10 shadow-2xs space-y-8">
          <section className="space-y-3 border-b border-zinc-100 pb-6">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#D4541A]" />
              <h2 className="text-lg sm:text-xl font-black text-[#0B1528] font-montserrat uppercase tracking-tight">
                Information We Collect
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 font-semibold leading-relaxed pl-7">
              We collect essential personal information required to process your
              bookings, issue train/flight tickets, and ensure emergency safety
              during expeditions. This includes your name, phone number, email
              address, city of residence, and government ID numbers for permit
              processing.
            </p>
          </section>

          <section className="space-y-3 border-b border-zinc-100 pb-6">
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-[#D4541A]" />
              <h2 className="text-lg sm:text-xl font-black text-[#0B1528] font-montserrat uppercase tracking-tight">
                Data Protection & Encryption
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 font-semibold leading-relaxed pl-7">
              All personal traveler records are stored on secure servers with
              strict role-based access control. We never sell, rent, or lease
              your private information to third-party marketing companies.
            </p>
          </section>

          <section className="space-y-3 border-b border-zinc-100 pb-6">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-[#D4541A]" />
              <h2 className="text-lg sm:text-xl font-black text-[#0B1528] font-montserrat uppercase tracking-tight">
                Cookies & Web Analytics
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 font-semibold leading-relaxed pl-7">
              We use standard session cookies to remember your destination
              preferences, simplify seat booking checkouts, and analyze website
              traffic to continuously improve your user experience.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Eye className="w-5 h-5 text-[#D4541A]" />
              <h2 className="text-lg sm:text-xl font-black text-[#0B1528] font-montserrat uppercase tracking-tight">
                Your Rights & Assistance
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 font-semibold leading-relaxed pl-7">
              You have the right to request access to or deletion of your stored
              booking profile. For any data inquiries, contact our compliance
              team at{" "}
              <a
                href="mailto:info@youthcamping.com"
                className="text-[#D4541A] font-bold underline"
              >
                info@youthcamping.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

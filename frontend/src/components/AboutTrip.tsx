"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AboutTripProps {
  description: string;
}

// Helper functions to decode and clean HTML content
function decodeHtml(html: string) {
  if (!html) return "";
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(html: string) {
  if (!html) return "";
  const decoded = decodeHtml(html);
  return decoded.replace(/<[^>]*>/g, "");
}

export default function AboutTrip({ description }: AboutTripProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpandedInline, setIsExpandedInline] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const decodedDescription = decodeHtml(description);
  const plainText = stripHtml(description);
  
  // Check if content is long enough (approx > 250 chars)
  const isLong = plainText.length > 250;

  // Truncate clean plain text for preview
  const previewText = plainText.length > 280 
    ? plainText.substring(0, 280) + "..." 
    : plainText;

  const handleToggle = () => {
    if (isMobile) {
      setIsExpandedInline(!isExpandedInline);
    } else {
      setIsOpen(true);
    }
  };

  return (
    <section className="relative space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-[#0B1528] font-montserrat">About This Trip</h2>
      
      <div className="bg-[#F8F9FA] border border-zinc-100/90 rounded-[20px] p-6 sm:p-7 relative">
        {/* Mobile View */}
        
        {/* Mobile View */}
        <div className="md:hidden relative">
          {isExpandedInline ? (
            <div 
              className="prose prose-zinc max-w-none text-zinc-600 font-normal leading-normal text-sm [&>p]:mb-4 [&>p:last-child]:mb-0 [&>strong]:font-bold [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mb-1"
              dangerouslySetInnerHTML={{ __html: decodedDescription }}
            />
          ) : (
            <p className="text-zinc-600 font-normal leading-normal text-sm line-clamp-5">
              {plainText}
            </p>
          )}
          {isLong && (
            <button 
              onClick={handleToggle}
              className="text-[#D4541A] font-bold hover:text-navy transition-all mt-3 cursor-pointer text-sm font-montserrat"
            >
              {isExpandedInline ? "Show Less" : "Read More"}
            </button>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block relative">
          <p className="text-zinc-600 font-normal leading-relaxed text-sm sm:text-base font-montserrat">
            {previewText}
          </p>
          {plainText.length > 280 && (
            <button 
              onClick={handleToggle}
              className="text-[#D4541A] font-bold hover:text-navy transition-all mt-3 float-right cursor-pointer text-sm font-montserrat"
            >
              Read More
            </button>
          )}
          {/* 4 Feature Badges Bar with Vertical Dividers (Matching Reference Screenshot Exactly) */}
          <div className="grid grid-cols-2 md:grid-cols-4 border border-zinc-100/90 rounded-2xl bg-white p-3 md:p-4 mt-6 divide-y md:divide-y-0 md:divide-x divide-zinc-100 shadow-2xs">
            <div className="flex items-center gap-3 p-2 md:px-3">
              <div className="w-9 h-9 rounded-full bg-orange-50/80 flex items-center justify-center text-[#D4541A] shrink-0">
                <svg className="w-4.5 h-4.5 text-[#D4541A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-zinc-900 font-bold text-xs sm:text-sm font-montserrat leading-tight">Group Trips</p>
                <p className="text-zinc-400 font-medium text-[11px] font-montserrat leading-tight mt-0.5">For Solo & Friends</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 md:px-3">
              <div className="w-9 h-9 rounded-full bg-orange-50/80 flex items-center justify-center text-[#D4541A] shrink-0">
                <svg className="w-4.5 h-4.5 text-[#D4541A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-zinc-900 font-bold text-xs sm:text-sm font-montserrat leading-tight">Verified & Safe</p>
                <p className="text-zinc-400 font-medium text-[11px] font-montserrat leading-tight mt-0.5">Trusted by 10K+</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 md:px-3">
              <div className="w-9 h-9 rounded-full bg-orange-50/80 flex items-center justify-center text-[#D4541A] shrink-0">
                <svg className="w-4.5 h-4.5 text-[#D4541A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-zinc-900 font-bold text-xs sm:text-sm font-montserrat leading-tight">Trip Captain</p>
                <p className="text-zinc-400 font-medium text-[11px] font-montserrat leading-tight mt-0.5">Expert & Friendly</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 md:px-3">
              <div className="w-9 h-9 rounded-full bg-orange-50/80 flex items-center justify-center text-[#D4541A] shrink-0">
                <svg className="w-4.5 h-4.5 text-[#D4541A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-zinc-900 font-bold text-xs sm:text-sm font-montserrat leading-tight">24x7 Support</p>
                <p className="text-zinc-400 font-medium text-[11px] font-montserrat leading-tight mt-0.5">We've got you!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-24 bg-navy/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-4xl max-h-full overflow-y-auto rounded-[40px] p-10 md:p-20 shadow-2xl relative animate-scale-up">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-8 right-8 p-3 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-all"
            >
              <X className="w-6 h-6 text-navy" />
            </button>
            
            <h2 className="text-3xl font-semibold text-navy mb-10 capitalize tracking-tight">The Full Story</h2>
            <div 
              className="prose prose-zinc lg:prose-xl max-w-none text-zinc-600 font-normal leading-relaxed [&>p]:mb-6 [&>p:last-child]:mb-0 [&>strong]:font-bold [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mb-2"
              dangerouslySetInnerHTML={{ __html: decodedDescription }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

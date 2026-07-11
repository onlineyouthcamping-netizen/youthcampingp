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
    <section className="relative">
      <div className="bg-white border border-zinc-100 rounded-[24px] md:rounded-[40px] p-6 md:p-14 shadow-sm relative">
        <h2 className="text-lg md:text-2xl font-bold text-navy mb-3 md:mb-6">About this Trip</h2>
        
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
              className="text-primary-orange font-bold hover:text-navy transition-all mt-3 cursor-pointer text-sm"
            >
              {isExpandedInline ? "Show Less" : "Read More"}
            </button>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block relative">
          <p className="text-zinc-600 font-normal leading-relaxed text-base md:text-lg">
            {previewText}
          </p>
          {plainText.length > 280 && (
            <button 
              onClick={handleToggle}
              className="text-primary-orange font-bold hover:text-navy transition-all mt-4 float-right cursor-pointer"
            >
              Read More
            </button>
          )}
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

"use client";

import { useState, useEffect } from "react";
import {
  X,
  Users,
  ShieldCheck,
  UserCheck,
  PhoneCall,
  Award,
  Clock,
  Compass,
  Heart,
  MapPin,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AboutTripCard {
  id?: string;
  title: string;
  subtitle: string;
  icon?: string;
  iconColor?: string;
  bgColor?: string;
  borderColor?: string;
  isVisible?: boolean;
}

interface AboutTripProps {
  description: string;
  customAboutTrip?: {
    title?: string;
    description?: string;
    cards?: AboutTripCard[];
  };
}

const ICON_MAP: Record<string, any> = {
  Users,
  ShieldCheck,
  UserCheck,
  PhoneCall,
  Award,
  Clock,
  Compass,
  Heart,
  MapPin,
  Sparkles,
};

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

const DEFAULT_CARDS: AboutTripCard[] = [
  { title: "Group Trips", subtitle: "For Solo & Friends", icon: "Users" },
  {
    title: "Verified & Safe",
    subtitle: "Trusted by 10K+",
    icon: "ShieldCheck",
  },
  { title: "Trip Captain", subtitle: "Expert & Friendly", icon: "UserCheck" },
  { title: "24×7 Support", subtitle: "We're here for you", icon: "PhoneCall" },
];

export default function AboutTrip({
  description,
  customAboutTrip,
}: AboutTripProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpandedInline, setIsExpandedInline] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setIsMobile(window.innerWidth < 768), 150);
    };
    setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const sectionTitle = customAboutTrip?.title || "About This Trip";
  const rawDesc = customAboutTrip?.description || description || "";
  const decodedDescription = decodeHtml(rawDesc);
  const plainText = stripHtml(rawDesc);
  const isLong = plainText.length > 250;
  const previewText =
    plainText.length > 280 ? plainText.substring(0, 280) + "..." : plainText;

  const cardsToRender =
    customAboutTrip?.cards && customAboutTrip.cards.length > 0
      ? customAboutTrip.cards.filter((c) => c.isVisible !== false)
      : [];

  const handleToggle = () => {
    setIsExpandedInline(!isExpandedInline);
  };

  return (
    <section className="relative space-y-5">
      <h2 className="text-xl md:text-2xl font-bold text-[#0B1528] font-montserrat">
        {sectionTitle.split(" ")[0]}{" "}
        <span className="text-[#D4541A] font-caveat italic">
          {sectionTitle.split(" ").slice(1).join(" ")}
        </span>
      </h2>

      <div className="@container bg-[#F8F9FA] border border-zinc-100/90 rounded-[20px] p-6 sm:p-7 relative">
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
          {isExpandedInline ? (
            <div
              className="prose prose-zinc max-w-none text-zinc-600 font-normal leading-relaxed text-sm sm:text-base font-montserrat [&>p]:mb-4 [&>p:last-child]:mb-0 [&>strong]:font-bold [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mb-1"
              dangerouslySetInnerHTML={{ __html: decodedDescription }}
            />
          ) : (
            <p className="text-zinc-600 font-normal leading-relaxed text-sm sm:text-base font-montserrat">
              {previewText}
            </p>
          )}
          {plainText.length > 280 && (
            <div className="flex items-center justify-end gap-3 mt-3">
              <button
                onClick={handleToggle}
                className="text-[#D4541A] font-bold hover:underline transition-all cursor-pointer text-sm font-montserrat"
              >
                {isExpandedInline ? "Show Less" : "Read More"}
              </button>
              <button
                onClick={() => setIsOpen(true)}
                className="text-zinc-400 font-semibold hover:text-[#0B1528] transition-all cursor-pointer text-xs font-montserrat"
              >
                Full Window
              </button>
            </div>
          )}
        </div>

        {cardsToRender.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 @3xl:grid-cols-4 gap-4 border border-zinc-100/90 rounded-2xl bg-white p-3 sm:p-4 mt-6 shadow-2xs overflow-hidden">
            {cardsToRender.map((card, idx) => {
              const IconComponent =
                card.icon && ICON_MAP[card.icon]
                  ? ICON_MAP[card.icon]
                  : Sparkles;

              return (
                <div
                  key={card.id || idx}
                  className={cn(
                    "flex items-center gap-3 min-w-0 p-2",
                    idx < cardsToRender.length - 1 &&
                      "@3xl:border-r @3xl:border-zinc-100",
                  )}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: card.bgColor || "#fff7ed",
                      border: `1px solid ${card.borderColor || "#ffedd5"}`,
                    }}
                  >
                    <IconComponent
                      className="w-4.5 h-4.5"
                      style={{ color: card.iconColor || "#D4541A" }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#0B1528] font-bold text-xs sm:text-sm font-montserrat leading-snug">
                      {card.title}
                    </p>
                    <p className="text-zinc-400 font-medium text-[11px] font-montserrat leading-snug mt-0.5 break-words">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Read More Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] p-6 sm:p-8 flex flex-col relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 p-1 text-zinc-400 hover:text-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-[#0B1528] mb-4 font-montserrat">
              {sectionTitle}
            </h3>
            <div
              className="flex-1 overflow-y-auto prose prose-zinc max-w-none text-zinc-600 font-normal leading-relaxed text-sm sm:text-base pr-2"
              dangerouslySetInnerHTML={{ __html: decodedDescription }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

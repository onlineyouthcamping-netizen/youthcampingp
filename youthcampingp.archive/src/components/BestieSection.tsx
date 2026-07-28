"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

import { WavyEdges } from "./ui/WavyEdges";
import { useIsMobile } from "@/hooks/useIsMobile";

interface Reason {
  title: string;
  desc: string;
  image?: string;
}

interface BestieSectionProps {
  title?: string;
  subtitle?: string;
  reasons?: Reason[];
  topColor?: string;
  bottomColor?: string;
  titleSize?: string | number;
  titleWeight?: string | number;
  wavyEdges?: boolean;
}

const defaultReasons = [
  // ... (reasons remain the same)
  {
    title: "Solo is safe.",
    desc: "Girlies, you're safe AF. No need to wait on fam or besties—just pack and go! Explore stress-free with 100% freedom!",
    image: "/page-builder-defaults/solo-safe.svg"
  },
  {
    title: "We're the greenest flag.",
    desc: "We ensure safety with verified stays, reliable transport, and trained guides for a secure, comfy, and hassle-free trip.",
    image: "/page-builder-defaults/green-flag.svg"
  },
  {
    title: "Our Group Captains are fire.",
    desc: "Our awesome trip captains are part-guide, part-friend and full time vibe curators.",
    image: "/page-builder-defaults/group-captains.svg"
  },
  {
    title: "No kebab main haddi.",
    desc: "No middlemen, no hidden fees. Enjoy direct bookings, lower costs, and personalized support for a seamless and affordable trip.",
    image: "/page-builder-defaults/no-middleman.svg"
  },
  {
    title: "Vibe check comes first.",
    desc: "We customize your trips based on age groups, so you're not stuck vibing to someone else's playlist without permission.",
    image: "/page-builder-defaults/vibe-check.svg"
  }
];

export default function BestieSection({ 
  title = "Reasons To Make Us Your Travel Bestie",
  subtitle,
  reasons = [],
  topColor = "#ffffff",
  bottomColor = "#ffffff",
  titleSize,
  titleWeight,
  wavyEdges = true, // Default true for this section as per branding
}: BestieSectionProps) {
  const displayReasons = (reasons && reasons.length > 0) ? reasons : defaultReasons;
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const reduceMotion = prefersReducedMotion || isMobile;

  return (
    <section className="relative bg-[#BDD5D5] section-wrapper overflow-hidden">
      {/* Scalloped Top */}
      {wavyEdges && <WavyEdges color={topColor} position="top" />}

      <div className="max-w-[1440px] mx-auto relative z-20 px-6">
        {/* ... (rest of content) */}
        <div className="mb-6 md:mb-10 text-center">
          <motion.h2 
            initial={reduceMotion ? false : { opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-heading text-[#1B2A4A]"
            style={{ 
              fontSize: titleSize ? (isNaN(Number(titleSize)) ? titleSize : `${titleSize}px`) : undefined,
              fontWeight: titleWeight ? titleWeight : undefined
            }}
          >
            {title}
          </motion.h2>
          {subtitle && (
            <motion.p
              initial={reduceMotion ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-zinc-600 font-bold mt-4 tracking-widest text-[11px] md:text-sm capitalize"
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        {/* Reason Grid - 3+2 Layout */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-4 md:mt-8">
          {displayReasons.map((reason, i) => (
            <motion.div
              key={i}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={reduceMotion ? { duration: 0 } : { delay: i * 0.1, duration: 0.5 }}
              className={`w-full ${i < 3 ? 'lg:w-[calc(33.333%-16px)]' : 'md:w-[calc(50%-12px)] lg:w-[calc(42%-16px)]'} flex-none`}
            >
              <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-xl hover:shadow-2xl flex flex-row items-start gap-4 md:gap-6 h-full border border-white transition-all duration-500 group/card">
                <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 flex items-center justify-center rounded-xl overflow-hidden bg-zinc-50">
                  {reason.image ? (
                    <OptimizedImage 
                      src={normalizeImageUrl(reason.image)} 
                      alt={reason.title} 
                      cloudinaryWidth={200}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover transition-transform group-hover/card:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="font-bold text-lg">{i+1}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left pt-1">
                  <h3 className="text-[16px] md:text-lg font-bold text-[#1B2A4A] mb-2 tracking-tight">{reason.title}</h3>
                  <p className="text-zinc-500 text-[12px] md:text-sm font-medium leading-relaxed">
                    {reason.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scalloped Bottom */}
      {wavyEdges && <WavyEdges color={bottomColor} position="bottom" />}
    </section>
  );
}

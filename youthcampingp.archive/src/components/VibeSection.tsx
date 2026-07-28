"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Volume2, Play } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useIsMobile } from "@/hooks/useIsMobile";

const reels = [
  { img: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=2070", text: "Places on Earth that don't feel real" },
  { img: "https://images.unsplash.com/photo-1533130061792-64b345e4a833?q=80&w=2070", text: "Vibe check passed" },
  { img: "https://images.unsplash.com/photo-1581793745862-99f579601e1b?q=80&w=2070", text: "Ladakh Diariess" },
  { img: "https://images.unsplash.com/photo-1589133041042-45e03a958b45?q=80&w=2070", text: "Mountain magic" },
  { img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070", text: "Exploring the wild" },
];

interface VibeSectionProps {
  title?: string;
  subtitle?: string;
  titleSize?: string | number;
  titleWeight?: string | number;
}

export default function VibeSection({
  title = "Vibe with Us",
  subtitle,
  titleSize,
  titleWeight,
}: VibeSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const reduceMotion = prefersReducedMotion || isMobile;

  return (
    <section className="section-wrapper bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <h2 
          className="section-heading text-center text-navy mb-8"
          style={{ 
            fontSize: titleSize ? (isNaN(Number(titleSize)) ? titleSize : `${titleSize}px`) : undefined,
            fontWeight: titleWeight ? titleWeight : undefined
          }}
        >
          {title}
        </h2>

        <div className="flex gap-4 md:gap-[28px] overflow-x-auto no-scrollbar pb-6 snap-x">
          {reels.map((reel, i) => (
            <motion.div
              key={i}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={reduceMotion ? { duration: 0 } : { delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative min-w-[280px] h-[500px] rounded-[30px] overflow-hidden group snap-center shadow-2xl cursor-pointer"
            >
              <OptimizedImage src={reel.img} alt="Reel" cloudinaryWidth={480} sizes="280px" className="object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 p-8 flex flex-col justify-between">
                <div className="flex justify-end">
                  <div className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                    <Volume2 className="w-5 h-5" />
                  </div>
                </div>
                
                <div>
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white mb-6 border border-white/30 group-hover:bg-white group-hover:text-black transition-all">
                    <Play className="w-6 h-6 -current" />
                  </div>
                  <h4 className="text-xl font-bold text-white tracking-tight leading-tight capitalize">
                    {reel.text}
                  </h4>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

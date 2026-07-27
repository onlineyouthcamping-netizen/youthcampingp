"use client";

import { useState, useEffect, useRef } from "react";
import { normalizeImageUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface CTASliderProps {
  title?: string;
  showTitle?: boolean;
  videoUrl?: string;
  mediaList?: string[];
  videoPosterUrl?: string;
  borderRadius?: string;
  topColor?: string;
  bottomColor?: string;
  [key: string]: any;
}

export default function CTASlider({
  title = "",
  showTitle = false,
  videoUrl,
  mediaList = [],
  videoPosterUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&q=85",
  borderRadius = "rounded-[24px]",
  topColor = "#ffffff",
  bottomColor = "#ffffff",
}: CTASliderProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse media list items (videos or photos)
  const items: string[] = (() => {
    const list: string[] = [];
    if (Array.isArray(mediaList) && mediaList.length > 0) {
      mediaList.forEach((m) => {
        const norm = normalizeImageUrl(m);
        if (norm && !list.includes(norm)) list.push(norm);
      });
    }
    if (videoUrl) {
      const norm = normalizeImageUrl(videoUrl);
      if (norm && !list.includes(norm)) list.unshift(norm);
    }
    if (list.length === 0) {
      list.push("https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&q=85");
      list.push("https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1600&q=85");
    }
    return list;
  })();

  const currentMedia = items[activeIdx % items.length];
  const isVideo = (url: string) => url && (/\.(mp4|webm|mov|ogg)$/i.test(url) || url.includes('/video/'));
  const isYouTube = (url: string) => url && /youtube\.com|youtu\.be/.test(url);
  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Cycle media if multiple slides exist
  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <section className="relative overflow-hidden font-sans my-4 sm:my-6">
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12">
        {showTitle && title && (
          <div className="mb-4 text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1528] tracking-tight">
              {title}
            </h2>
          </div>
        )}

        <div
          ref={containerRef}
          className={`relative w-full max-w-[1240px] h-[220px] sm:h-[320px] md:h-[420px] lg:h-[480px] overflow-hidden bg-zinc-900 mx-auto shadow-xl border border-slate-100 ${borderRadius}`}
        >
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentMedia}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0, ease: "easeInOut" }}
              className="w-full h-full relative"
            >
              {isYouTube(currentMedia) ? (
                <iframe
                  className="w-full h-full object-cover pointer-events-none"
                  src={`https://www.youtube.com/embed/${getYouTubeId(currentMedia)}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeId(currentMedia)}&controls=0&showinfo=0&rel=0`}
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : isVideo(currentMedia) ? (
                <video
                  src={currentMedia}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <img
                  src={currentMedia}
                  alt={title || "CTA Banner"}
                  className="w-full h-full object-cover object-center"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

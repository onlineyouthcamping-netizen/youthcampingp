"use client";

import { useState, useEffect, useRef } from "react";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";

interface CTASliderProps {
  title?: string;
  showTitle?: boolean;
  videoUrl?: string;
  videoPosterUrl?: string;
  borderRadius?: string;
  topColor?: string;
  bottomColor?: string;
}

export default function CTASlider({
  title = "",
  showTitle = false,
  videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-motorcyclist-riding-on-a-mountain-road-41916-large.mp4",
  videoPosterUrl = "https://images.unsplash.com/photo-1581793745862-99f579601e1b?q=80&w=2070",
  borderRadius = "rounded-[20px] md:rounded-[32px]",
  topColor = "#ffffff",
  bottomColor = "#f3f4f6",
}: CTASliderProps) {
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, []);

  const posterSrc = videoPosterUrl ? normalizeImageUrl(videoPosterUrl) : undefined;
  const normalizedVideoUrl = videoUrl ? normalizeImageUrl(videoUrl) : undefined;

  // Map admin custom values or handle direct tailwind class strings
  const radiusClass = borderRadius || "rounded-[20px] md:rounded-[32px]";

  // Normalize colors to force pure white and premium light grey (#f5f5f5) as requested
  const bgTop = (topColor === "#ffffff" || topColor === "#f6f6f6") ? "#ffffff" : topColor;
  const bgBottom = (bottomColor === "#f3f4f6" || bottomColor === "#f3f3f3" || bottomColor === "#f5f5f5") ? "#f5f5f5" : bottomColor;

  return (
    <section className="relative overflow-hidden">
      {/* Background split - clean hard split with vertical bleed to prevent bottom border gap */}
      <div className="absolute -inset-y-1 inset-x-0 flex flex-col pointer-events-none">
        <div className="h-[51%] -mb-[1%]" style={{ backgroundColor: bgTop }} />
        <div className="h-[51%]" style={{ backgroundColor: bgBottom }} />
      </div>

      <div className="relative z-10 px-3 md:px-14 py-4 md:py-24">
        {showTitle && title && (
          <div className="max-w-[1440px] mx-auto px-2 mb-6 md:mb-10 text-center">
            <h2 className="section-heading text-navy capitalize">
              {title}
            </h2>
          </div>
        )}
        <div 
          ref={containerRef}
          className={cn(
            "relative w-full md:w-[80%] h-[175px] sm:h-[225px] md:h-[295px] lg:h-[440px] overflow-hidden bg-zinc-900 mx-auto",
            "shadow-[0_20px_50px_rgba(0,0,0,0.15),0_4px_20px_rgba(0,0,0,0.08)]",
            "border-0",
            radiusClass
          )}
        >
          {isInView ? (
            <video
              src={normalizedVideoUrl || "https://assets.mixkit.co/videos/preview/mixkit-motorcyclist-riding-on-a-mountain-road-41916-large.mp4"}
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              poster={posterSrc}
              className="w-full h-full object-cover object-center scale-[1.02]"
            />
          ) : (
            posterSrc && (
              <OptimizedImage
                src={posterSrc}
                alt={title || "Cinematic Travel Video"}
                cloudinaryWidth={1200}
                sizes="100vw"
                className="w-full h-full object-cover object-center scale-[1.02]"
              />
            )
          )}
        </div>
      </div>
    </section>
  );
}

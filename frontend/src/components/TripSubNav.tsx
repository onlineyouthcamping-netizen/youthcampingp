"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TripSubNavProps {
  sections: { id: string; label: string }[];
}

export default function TripSubNav({ sections }: TripSubNavProps) {
  const [activeSection, setActiveSection] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Use IntersectionObserver on a sentinel element for reliable sticky detection
    const sentinel = sentinelRef.current;
    if (sentinel) {
      const stickyObserver = new IntersectionObserver(
        ([entry]) => {
          setIsSticky(!entry.isIntersecting);
        },
        { threshold: 0 }
      );
      stickyObserver.observe(sentinel);
      return () => stickyObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    // Active Section Observer
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  // Horizontal Scroll Sync: Center the active tab
  useEffect(() => {
    if (activeSection && scrollContainerRef.current) {
      const activeBtn = scrollContainerRef.current.querySelector(`[data-section="${activeSection}"]`);
      if (activeBtn) {
        const container = scrollContainerRef.current;
        const btnLeft = (activeBtn as HTMLElement).offsetLeft;
        const btnWidth = (activeBtn as HTMLElement).offsetWidth;
        const containerWidth = container.offsetWidth;
        
        container.scrollTo({
          left: btnLeft - (containerWidth / 2) + (btnWidth / 2),
          behavior: "smooth"
        });
      }
    }
  }, [activeSection]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const isMob = window.innerWidth < 768;
      const offset = isMob ? 130 : 170;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      {/* Sentinel — when this scrolls out of view, the nav becomes sticky */}
      <div ref={sentinelRef} className="h-0" />

      <div 
        ref={navRef}
        className="sticky z-40 bg-white border-b border-zinc-100 mb-6 mt-1"
        style={{ top: 'var(--navbar-height)' }}
      >
        <div className="w-full">
          <div 
            ref={scrollContainerRef}
            className="flex items-center gap-6 md:gap-9 overflow-x-auto no-scrollbar pb-3 pt-1"
          >
            {sections.map((section, idx) => (
              <button
                key={section.id}
                data-section={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "group relative text-xs sm:text-sm font-bold capitalize tracking-wide whitespace-nowrap py-1 transition-all font-montserrat cursor-pointer",
                  idx === 0 ? "pl-0" : "",
                  activeSection === section.id 
                    ? "text-[#D4541A]" 
                    : "text-zinc-500 hover:text-[#0B1528]"
                )}
              >
                {section.label}
                {/* Animated Underline */}
                <span className={cn(
                  "absolute -bottom-[12px] left-0 w-full h-[3px] bg-[#D4541A] rounded-full transition-all duration-300 transform origin-center",
                  activeSection === section.id ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-50 group-hover:opacity-50"
                )} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

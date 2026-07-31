"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TripSubNavProps {
  sections: { id: string; label: string }[];
}

export default function TripSubNav({ sections }: TripSubNavProps) {
  const [activeSection, setActiveSection] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const checkScrollState = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }
  };

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

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScrollState();
    const handleScroll = () => checkScrollState();
    const handleResize = () => checkScrollState();

    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [sections]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const canScroll = (e.deltaY > 0 && canScrollRight) || (e.deltaY < 0 && canScrollLeft);
        if (canScroll) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [canScrollLeft, canScrollRight]);

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
      const offset = isMob ? 142 : 160;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.6;
      el.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
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
        className={cn(
          "sticky top-[80px] z-[9990] bg-white border-b border-zinc-200/90 mb-6 py-2.5 transition-all group/subnav",
          isSticky ? "shadow-md" : "shadow-2xs"
        )}
      >
        <div className="relative w-full flex items-center">
          {/* Left Arrow & Fade */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pr-4 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none">
              <button
                type="button"
                onClick={() => scrollByAmount("left")}
                aria-label="Scroll left"
                className="pointer-events-auto flex items-center justify-center w-7 h-7 rounded-full bg-white border border-zinc-200 shadow-md text-zinc-700 hover:text-[#D4541A] hover:border-[#D4541A] transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          <div 
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className="flex items-center gap-6 md:gap-9 overflow-x-auto no-scrollbar pb-3 pt-1 w-full select-none cursor-grab active:cursor-grabbing scroll-smooth touch-pan-x"
          >
            {sections.map((section, idx) => (
              <button
                key={section.id}
                data-section={section.id}
                onClick={(e) => {
                  if (hasDraggedRef.current) {
                    e.preventDefault();
                    return;
                  }
                  scrollToSection(section.id);
                }}
                className={cn(
                  "group relative text-xs sm:text-sm font-bold capitalize tracking-wide whitespace-nowrap py-1 transition-all font-montserrat cursor-pointer shrink-0",
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

          {/* Right Arrow & Fade */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pl-4 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none">
              <button
                type="button"
                onClick={() => scrollByAmount("right")}
                aria-label="Scroll right"
                className="pointer-events-auto flex items-center justify-center w-7 h-7 rounded-full bg-white border border-zinc-200 shadow-md text-zinc-700 hover:text-[#D4541A] hover:border-[#D4541A] transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useTheme } from "@/components/DynamicThemeProvider";

import { useIsMobile } from "@/hooks/useIsMobile";

// Custom Typewriter Component
function Typewriter({ phrases, typingSpeed = 100, deletingSpeed = 50, pauseDelay = 2000 }: { phrases: string[], typingSpeed?: number, deletingSpeed?: number, pauseDelay?: number }) {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeedState, setTypingSpeedState] = useState(typingSpeed);

  useEffect(() => {
    if (phrases.length === 0) return;

    const handleType = () => {
      const i = loopNum % phrases.length;
      const fullText = phrases[i].trim();

      setText(isDeleting 
        ? fullText.substring(0, text.length - 1) 
        : fullText.substring(0, text.length + 1)
      );

      setTypingSpeedState(isDeleting ? deletingSpeed : typingSpeed);

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), pauseDelay);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleType, typingSpeedState);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, phrases, typingSpeed, deletingSpeed, pauseDelay, typingSpeedState]);

  return (
    <span className="text-primary-orange" style={{ display: 'inline-block', minHeight: '1.2em' }}>{text || "\u00A0"}</span>
  );
}

const SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1581793745862-99f579601e1b?q=80&w=2070",
    alt: "Scenic winding roads in Ladakh mountains"
  },
  {
    url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2070",
    alt: "Adventure campsite under high mountain pass in Spiti Valley"
  },
  {
    url: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=2070",
    alt: "Travellers kayaking on pristine mountain lake in Kashmir"
  },
  {
    url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=2070",
    alt: "Beautiful palm-lined backwaters of Kerala"
  },
  {
    url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=2070",
    alt: "Stargazing and camping under the night sky"
  }
];

interface HeroProps {
  headline?: string;
  subheadline?: string;
  videoUrl?: string;
  backgroundImage?: string;
  titleSize?: string | number;
  titleWeight?: string | number;
  settings?: any;
  videoEnabled?: boolean;
  videoPosterUrl?: string;
  slides?: Array<{ image?: string; url?: string; alt?: string }>;
}

export default function Hero({ 
  headline = "One Trip At a Time",
  subheadline,
  videoUrl,
  backgroundImage,
  titleSize,
  titleWeight,
  settings,
  videoEnabled,
  videoPosterUrl,
  slides = [],
}: HeroProps) {
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // Map custom slides from page builder or fallback to default slides
  const activeSlides = (slides && slides.length > 0)
    ? slides.map(s => ({ url: s.image || s.url || "", alt: s.alt || "" }))
    : SLIDES;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedSlides, setLoadedSlides] = useState<Set<number>>(() => new Set([0]));

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const nextSlide = (currentSlide + 1) % activeSlides.length;
    const preloadTimer = setTimeout(() => {
      setLoadedSlides((current) => {
        if (current.has(nextSlide)) return current;
        const next = new Set(current);
        next.add(nextSlide);
        return next;
      });
    }, 2500);
    return () => clearTimeout(preloadTimer);
  }, [currentSlide, activeSlides.length]);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const cleanupTimer = setTimeout(() => {
      setLoadedSlides((current) => {
        if (current.size === 1 && current.has(currentSlide)) return current;
        return new Set([currentSlide]);
      });
    }, 900);
    return () => clearTimeout(cleanupTimer);
  }, [currentSlide, activeSlides.length]);

  const normalizedBg = normalizeImageUrl(backgroundImage);
  
  // Theme-driven animated texts with hardcoded fallback
  const defaultPhrases = [
    "Find Freedom",
    "Collect Stories",
    "Meet Strangers",
    "Feel Alive",
    "Escape Routines",
    "Explore Deeply"
  ];

  // Subheadline: theme animated texts > subheadline prop (comma-separated) > defaults
  let typingPhrases: string[] = [];
  if (theme?.heroAnimatedTexts?.length) {
    typingPhrases = theme.heroAnimatedTexts;
  } else if (subheadline && typeof subheadline === 'string' && subheadline.includes(',')) {
    typingPhrases = subheadline.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (!typingPhrases.length) {
    typingPhrases = defaultPhrases;
  }

  // Headline priority: theme heroTitle > prop from page builder > default
  const displayHeadline = theme?.heroTitle || headline || "One Trip At a Time";

  // Hero overlay: theme value (0-100) converted to 0-1 opacity, CSS var as fallback
  const overlayOpacity = theme?.heroOverlayDarkness != null
    ? theme.heroOverlayDarkness / 100
    : undefined;

  // CTA from theme
  const ctaText = theme?.heroCtaText;
  const ctaLink = theme?.heroCtaLink;

  // Alignment from theme (default: center)
  const heroAlign = theme?.heroAlign || "center";
  const alignClass = heroAlign === "left" ? "items-start text-left" : heroAlign === "right" ? "items-end text-right" : "items-center text-center";

  const reduceMotion = prefersReducedMotion || isMobile;

  return (
    <div 
      className="hero-container relative w-full overflow-hidden bg-navy max-md:aspect-video"
      style={{ 
        transform: 'scale(1.001)',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        aspectRatio: '16/9',
        minHeight: '100svh',
      }}
    >
      {/* Background Media */}
      <div className="absolute inset-0 z-0" style={{ transform: 'scale(1.01)', backfaceVisibility: 'hidden' }}>
        {normalizedBg ? (
          <OptimizedImage 
            src={normalizedBg} 
            priority={true}
            cloudinaryWidth={1920}
            sizes="100vw"
            className="w-full h-full object-cover" 
            alt="Hero Background"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full overflow-hidden bg-navy">
            {activeSlides.map((slide, index) => {
              if (!loadedSlides.has(index)) return null;
              const isActive = index === currentSlide;
              return (
                <motion.div
                  key={slide.url}
                  initial={{ opacity: index === 0 ? 1 : 0 }}
                  animate={{ opacity: isActive ? 1 : 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full"
                  style={{
                    zIndex: isActive ? 10 : 1,
                    pointerEvents: "none",
                  }}
                >
                  <motion.div
                    animate={isActive && !reduceMotion ? { scale: 1.03 } : { scale: 1.00 }}
                    transition={isActive && !reduceMotion ? { duration: 4.5, ease: "linear" } : { duration: 0 }}
                    className="w-full h-full"
                  >
                    <OptimizedImage
                      src={slide.url}
                      priority={index === 0}
                      cloudinaryWidth={1920}
                      sizes="100vw"
                      className="w-full h-full object-cover"
                      alt={slide.alt}
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                    />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        )}
        
        {/* Subtle Premium Dark Overlay (Capped at 15-30% to showcase vibrant natural colors) */}
        <div 
          className="absolute inset-0 bg-black transition-opacity duration-700" 
          style={{ 
            opacity: overlayOpacity != null 
              ? Math.min(overlayOpacity, 0.30) 
              : 0.25 
          }} 
        />
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 py-3 md:px-10 md:py-8 text-white">
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto transform translate-y-[40%]">
          {/* Title + Subtitle Group */}
          <div className="flex flex-col items-center mb-6 md:mb-8">
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="hero-title mb-0"
              style={{ 
                ['--title-size-desktop' as any]: titleSize 
                  ? (isNaN(Number(titleSize)) 
                      ? `calc(var(--title-size-multiplier, 1) * ${titleSize})` 
                      : `calc(var(--title-size-multiplier, 1) * ${titleSize}px)`) 
                  : undefined,
                fontWeight: titleWeight || undefined
              }}
            >
              {displayHeadline}
            </motion.h1>
   
            {typingPhrases.length > 0 && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={reduceMotion ? { duration: 0 } : { delay: 0.5, duration: 1 }}
                className="flex items-center justify-center font-extrabold hero-subheadline whitespace-nowrap"
                style={{ 
                  marginTop: '6px', // Reduced gap between title and subtitle
                  ['--subheadline-size-desktop' as any]: 'clamp(1.2rem, 2.5vw, 1.875rem)'
                }}
              >
                <Typewriter phrases={typingPhrases} /><span className="inline-block w-[2px] h-[1em] bg-primary-orange animate-pulse ml-[2px] align-middle" style={{ verticalAlign: 'middle' }} />
              </motion.div>
            )}
          </div>

          {ctaText && ctaLink && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { delay: 1, duration: 0.8 }}
              className="mt-0"
            >
              <Link
                href={ctaLink}
                className="inline-flex items-center gap-1.5 px-4 py-2 md:px-8 md:py-4 bg-primary-orange text-white font-semibold rounded-lg hover:opacity-90 transition-opacity hero-btn"
                style={{
                  ['--btn-padding' as any]: `var(--button-padding-y) var(--button-padding-x)`,
                  ['--btn-font-size' as any]: 'var(--button-font-size)',
                  borderRadius: 'var(--radius-button)',
                  textTransform: 'var(--button-text-transform)' as any,
                  letterSpacing: 'var(--button-letter-spacing)',
                }}
              >
                {ctaText}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </div>
      </div></div>
  );
}

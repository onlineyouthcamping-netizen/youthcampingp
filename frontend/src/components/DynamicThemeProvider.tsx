"use client";

import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { fetchPublicSettings, fetchTheme } from '@/lib/api';
import { MotionConfig } from 'framer-motion';

interface ThemeContextType {
  theme: any | null;
  settings: any | null;
}

const ThemeContext = createContext<ThemeContextType>({ theme: null, settings: null });

export const useTheme = () => useContext(ThemeContext);

export const DynamicThemeProvider = ({
  children,
  initialTheme,
  initialSettings,
}: {
  children: React.ReactNode;
  initialTheme?: any;
  initialSettings?: any;
}) => {
  const [theme, setTheme] = useState<any | null>(initialTheme || null);
  const [settings, setSettings] = useState<any | null>(initialSettings || null);

  const applyTheme = (config: any) => {
    if (!config || typeof window === 'undefined') return;
    const root = document.documentElement;
    
    // Core Colors
    if (config.primaryColor) root.style.setProperty('--primary', config.primaryColor);
    if (config.secondaryColor) root.style.setProperty('--secondary', config.secondaryColor);
    if (config.backgroundColor) root.style.setProperty('--background', config.backgroundColor);
    if (config.textColor) root.style.setProperty('--foreground', config.textColor);
    if (config.accentColor) root.style.setProperty('--accent-color', config.accentColor);
    if (config.borderColor) root.style.setProperty('--border', config.borderColor);
    if (config.borderWidth) root.style.setProperty('--border-width', `${config.borderWidth}px`);
    
    // Buttons
    if (config.buttonColor) root.style.setProperty('--button-bg', config.buttonColor);
    if (config.buttonHoverColor) root.style.setProperty('--button-hover', config.buttonHoverColor);
    if (config.buttonTextColor) root.style.setProperty('--button-text', config.buttonTextColor);
    if (config.buttonRadius) root.style.setProperty('--radius-button', `${config.buttonRadius}px`);
    if (config.buttonPaddingX) root.style.setProperty('--button-padding-x', `${config.buttonPaddingX}px`);
    if (config.buttonPaddingY) root.style.setProperty('--button-padding-y', `${config.buttonPaddingY}px`);
    if (config.buttonShadow) root.style.setProperty('--button-shadow', config.buttonShadow);
    if (config.buttonTextTransform) root.style.setProperty('--button-text-transform', config.buttonTextTransform);
    if (config.buttonLetterSpacing) root.style.setProperty('--button-letter-spacing', config.buttonLetterSpacing);
    if (config.buttonFontSize) root.style.setProperty('--button-font-size', `${config.buttonFontSize}px`);
    if (config.buttonSecondaryBg) root.style.setProperty('--button-secondary-bg', config.buttonSecondaryBg);
    if (config.buttonSecondaryText) root.style.setProperty('--button-secondary-text', config.buttonSecondaryText);
    
    // Cards
    if (config.cardBgColor) root.style.setProperty('--card', config.cardBgColor);
    if (config.cardRadius) root.style.setProperty('--radius-card', `${config.cardRadius}px`);
    if (config.cardShadow) root.style.setProperty('--shadow-card', config.cardShadow);
    if (config.cardHeight) root.style.setProperty('--card-height', `${config.cardHeight}px`);
    if (config.cardWidth) root.style.setProperty('--card-width', `${config.cardWidth}px`);
    if (config.cardOverlayDarkness) root.style.setProperty('--card-overlay', `${config.cardOverlayDarkness}`);
    if (config.cardImageBrightness) root.style.setProperty('--card-brightness', `${config.cardImageBrightness}%`);
    if (config.cardTitleSize) root.style.setProperty('--card-title-size', `${config.cardTitleSize}px`);
    if (config.cardPriceColor) root.style.setProperty('--card-price-color', config.cardPriceColor);
    if (config.cardBadgeBg) root.style.setProperty('--card-badge-bg', config.cardBadgeBg);
    if (config.cardBadgeText) root.style.setProperty('--card-badge-text', config.cardBadgeText);
    
    // Typography
    if (config.fontFamily || config.bodyFont) root.style.setProperty('--font-primary', config.fontFamily || config.bodyFont);
    if (config.headingFont) root.style.setProperty('--font-heading', config.headingFont);
    if (config.bodyFont) root.style.setProperty('--font-body', config.bodyFont);
    if (config.fontSizeBase) root.style.setProperty('--text-base', `${config.fontSizeBase}px`);
    if (config.fontSizeHeading) {
      root.style.setProperty('--text-heading', `${config.fontSizeHeading}px`);
      root.style.setProperty('--h1-size', `${config.fontSizeHeading}px`);
    }
    if (config.fontSizeH2) {
      root.style.setProperty('--text-h2', `${config.fontSizeH2}px`);
      root.style.setProperty('--h2-size', `${config.fontSizeH2}px`);
    }
    if (config.fontSizeH3) {
      root.style.setProperty('--text-h3', `${config.fontSizeH3}px`);
      root.style.setProperty('--h3-size', `${config.fontSizeH3}px`);
    }
    if (config.fontSizeH4) root.style.setProperty('--text-h4', `${config.fontSizeH4}px`);
    if (config.navbarFontSize) root.style.setProperty('--navbar-font-size', `${config.navbarFontSize}px`);
    if (config.fontWeightHeading) {
      root.style.setProperty('--font-weight-heading', config.fontWeightHeading);
      root.style.setProperty('--heading-weight', config.fontWeightHeading);
    }
    if (config.headingLetterSpacing) {
      root.style.setProperty('--heading-letter-spacing', config.headingLetterSpacing);
    }
    if (config.headingTextTransform) root.style.setProperty('--heading-text-transform', config.headingTextTransform);
    if (config.bodyLineHeight) root.style.setProperty('--body-line-height', config.bodyLineHeight);
    if (config.bodyLetterSpacing) root.style.setProperty('--body-letter-spacing', config.bodyLetterSpacing);
    
    // Layout
    if (config.containerWidth) root.style.setProperty('--container-width', `${config.containerWidth}px`);
    if (config.spacingUnit) root.style.setProperty('--spacing-unit', `${config.spacingUnit}px`);
    if (config.sectionSpacing) root.style.setProperty('--section-spacing', `${config.sectionSpacing}px`);
    
    // Hero
    if (config.heroHeight) root.style.setProperty('--hero-height', `${config.heroHeight}vh`);
    if (config.heroOverlayDarkness) root.style.setProperty('--hero-overlay', `${config.heroOverlayDarkness}`);
    
    // Navbar
    if (config.navbarHeight) root.style.setProperty('--navbar-height', `${config.navbarHeight}px`);
    if (config.navbarLogoSize) root.style.setProperty('--navbar-logo-size', `${config.navbarLogoSize}px`);
    if (config.navbarActiveColor) root.style.setProperty('--navbar-active-color', config.navbarActiveColor);
    if (config.navbarHoverColor) root.style.setProperty('--navbar-hover-color', config.navbarHoverColor);
    if (config.navbarSpacing) root.style.setProperty('--navbar-spacing', `${config.navbarSpacing}px`);
    
    // Mobile overrides
    if (config.mobileFontSizeBase) root.style.setProperty('--mobile-font-base', `${config.mobileFontSizeBase}px`);
    if (config.mobileFontSizeHeading) root.style.setProperty('--mobile-font-heading', `${config.mobileFontSizeHeading}px`);
    if (config.mobileHeroHeight) root.style.setProperty('--mobile-hero-height', `${config.mobileHeroHeight}vh`);
    if (config.mobileHeroVideoHeight) {
      if (config.mobileHeroVideoHeight === 'aspect-video') {
        root.style.setProperty('--mobile-hero-video-height', 'auto');
        root.style.setProperty('--mobile-hero-video-aspect', '16/9');
      } else {
        root.style.setProperty('--mobile-hero-video-height', `${config.mobileHeroVideoHeight}vh`);
        root.style.setProperty('--mobile-hero-video-aspect', 'auto');
      }
    }
    if (config.mobileNavbarHeight) root.style.setProperty('--mobile-navbar-height', `${config.mobileNavbarHeight}px`);

    // Animations
    if (config.transitionSpeed) root.style.setProperty('--transition-speed', `${config.transitionSpeed}ms`);
    if (config.transitionEasing) root.style.setProperty('--transition-easing', config.transitionEasing);

    // VacationLabs Style Presets
    if (config.buttonStylePreset) {
      let radius = '12px';
      let borderStyle = 'none';
      let bg = config.buttonColor || '#FF6B00';
      let text = config.buttonTextColor || '#FFFFFF';
      let border = 'none';
      
      if (config.buttonStylePreset.includes('box')) radius = '0px';
      else if (config.buttonStylePreset.includes('curved')) radius = '8px';
      else if (config.buttonStylePreset.includes('rounded')) radius = '9999px';

      if (config.buttonStylePreset.includes('hollow')) {
        borderStyle = 'solid';
        bg = 'transparent';
        text = config.buttonColor || '#FF6B00';
        border = `2px solid ${config.buttonColor || '#FF6B00'}`;
      }
      
      root.style.setProperty('--radius-button', radius);
      root.style.setProperty('--button-bg', bg);
      root.style.setProperty('--button-text', text);
      root.style.setProperty('--button-border', border);
      root.style.setProperty('--button-border-style', borderStyle);
    }
    
    if (config.sectionHeadingStyle) root.style.setProperty('--section-heading-style', config.sectionHeadingStyle);
    if (config.tourCardStyle) root.style.setProperty('--tour-card-style', config.tourCardStyle);
    if (config.collectionCardStyle) root.style.setProperty('--collection-card-style', config.collectionCardStyle);
    if (config.headerStylePreset) root.style.setProperty('--header-style-preset', config.headerStylePreset);

    // Force font family on body
    if (config.bodyFont || config.fontFamily) {
      root.style.fontFamily = config.bodyFont || config.fontFamily;
    }
  };

  useLayoutEffect(() => {
    if (initialTheme) {
      applyTheme(initialTheme);
    }
  }, [initialTheme]);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const config = await fetchTheme();
        if (config) {
          setTheme(config);
          applyTheme(config);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };

    const loadSettings = async () => {
      try {
        const config = await fetchPublicSettings();
        if (config) setSettings(config);
      } catch (error) {
        console.error('Failed to load public settings:', error);
      }
    };

    // Server-fetched values are authoritative for the initial render. Only fall
    // back to a browser request when the bounded server fetch could not finish.
    if (!initialTheme) {
      loadTheme();
    }
    if (!initialSettings) {
      loadSettings();
    }
  }, [initialTheme, initialSettings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastWasMobile = false;
    let rafId: number | null = null;

    const adjustWrappedHeadings = (forceRestore = false) => {
      const isMobileSize = window.innerWidth < 768;

      // Prevent repeated full-body DOM queries/scans on desktop size
      if (!isMobileSize && !forceRestore && !lastWasMobile) {
        return;
      }

      lastWasMobile = isMobileSize;

      const headings = document.querySelectorAll('.hero-title, .section-heading, .main-heading, h1, h2');

      if (!isMobileSize) {
        // Restore original font sizes on desktop
        headings.forEach(node => {
          const el = node as HTMLElement;
          if (el.dataset.originalFontSize) {
            el.style.removeProperty('font-size');
            el.removeAttribute('data-original-font-size');
          }
        });
        return;
      }
      
      // Phase 1: Read all layout metrics in a single batch (no layout thrashing)
      const measurements: { el: HTMLElement; originalHeight: number; singleLineHeight: number; originalFontSize: string }[] = [];
      
      headings.forEach(node => {
        const el = node as HTMLElement;
        if (!el.textContent || el.textContent.trim() === '') return;

        // Save original font size if not already saved
        if (!el.dataset.originalFontSize) {
          el.dataset.originalFontSize = el.style.fontSize || window.getComputedStyle(el).fontSize;
        }

        const originalFontSize = el.dataset.originalFontSize;
        
        // Temporarily reset to original size to measure height accurately
        el.style.setProperty('font-size', originalFontSize, 'important');
        const originalHeight = el.getBoundingClientRect().height;
        
        // Measure single line height by forcing nowrap
        const originalWhiteSpace = el.style.whiteSpace;
        el.style.whiteSpace = 'nowrap';
        const singleLineHeight = el.getBoundingClientRect().height;
        el.style.whiteSpace = originalWhiteSpace;

        measurements.push({ el, originalHeight, singleLineHeight, originalFontSize });
      });

      // Phase 2: Batch all style updates inside requestAnimationFrame to prevent thrashing
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        measurements.forEach(({ el, originalHeight, singleLineHeight, originalFontSize }) => {
          if (originalHeight > singleLineHeight * 1.2) {
            const currentSize = parseFloat(originalFontSize);
            const unit = originalFontSize.replace(/[0-9.]/g, '') || 'px';
            
            // Single-pass reduction fits text in a single line immediately without measuring in a loop
            const fittedSize = Math.max(currentSize * 0.75, currentSize - 6); 
            el.style.setProperty('font-size', `${fittedSize}${unit}`, 'important');
          } else {
            el.style.setProperty('font-size', originalFontSize, 'important');
          }
        });
      });
    };

    // Run immediately since we are guaranteed to be mounted/hydrated
    adjustWrappedHeadings(true);

    // Listen to window resize events with throttling/passive listener
    let resizeTimeout: any;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => adjustWrappedHeadings(true), 150);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Observe only the page content and only react when a heading was added.
    // This preserves responsive heading fitting without rescanning the body for
    // unrelated mutations such as button state, overlays, or icon changes.
    let resizeTimer: any;
    const contentRoot = document.querySelector('main');
    const observer = new MutationObserver((mutations) => {
      const hasNewHeading = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some((node) => {
          if (!(node instanceof Element)) return false;
          return node.matches('h1, h2, .hero-title, .section-heading, .main-heading') ||
            Boolean(node.querySelector('h1, h2, .hero-title, .section-heading, .main-heading'));
        })
      );
      if (!hasNewHeading) return;

      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => adjustWrappedHeadings(false));
      }, 150);
    });

    if (contentRoot) {
      observer.observe(contentRoot, {
        childList: true,
        subtree: true
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      clearTimeout(resizeTimer);
      clearTimeout(resizeTimeout);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, settings }}>
      <MotionConfig 
        reducedMotion="user"
        transition={{ duration: isMobile ? 0.3 : 0.6, ease: "easeOut" }}
      >
        {children}
      </MotionConfig>
    </ThemeContext.Provider>
  );
};

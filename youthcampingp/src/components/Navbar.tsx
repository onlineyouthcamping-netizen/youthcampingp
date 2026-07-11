"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { normalizeImageUrl } from "@/lib/api";
import { useTheme } from "@/components/DynamicThemeProvider";

interface NavLink {
  name: string;
  href: string;
}

interface NavbarProps {
  logoUrl?: string;
  navLinks?: NavLink[];
}

const defaultNavLinks = [
  { name: "Home", href: "/" },
  { name: "Trips", href: "/trips" },
];

export default function Navbar({ 
  logoUrl = "/logo.png",
  navLinks
}: NavbarProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { theme, settings } = useTheme();
  const resolvedNavLinks = navLinks || settings?.navbar?.links || defaultNavLinks;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const isSticky = theme?.navbarSticky ?? true;
  const isTransparent = theme?.navbarTransparent ?? false;
  const blurClass = (theme?.navbarBlur ?? true) ? "backdrop-blur-md" : "backdrop-blur-none";

  // Force solid background on mobile so that pushed-down page content does not cause text visibility issues
  const showTransparent = isTransparent && !isMobile;

  // Determine bg color class based on scroll and transparency settings
  const bgClass = isScrolled 
    ? (isMobile ? "bg-white shadow-lg" : "bg-white/95 shadow-lg") 
    : showTransparent 
      ? "bg-transparent" 
      : "bg-white shadow-md";

  const textColorClass = isScrolled || !showTransparent ? "text-navy" : "text-white";

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 px-4 sm:px-6 flex items-center",
          bgClass,
          blurClass
        )}
        style={{ height: 'var(--navbar-height)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <Link 
            href="/" 
            className="relative z-[60] flex items-center justify-start shrink-0"
          >
            <img 
              src="/logo.png"
              alt="Youthcamping Logo" 
              fetchPriority="high"
              loading="eager"
              width={140}
              height={40}
              className="w-auto max-w-[140px] md:max-w-none object-contain transition-transform hover:scale-105 pointer-events-auto"
              style={{
                height: 'calc(var(--navbar-height) * 0.53)',
                maxHeight: '42px'
              }}
            />
          </Link>

          {/* Desktop Nav */}
          <div 
            className="relative z-20 hidden md:flex items-center"
            style={{ gap: 'var(--navbar-spacing)' }}
          >
            {resolvedNavLinks.map((link: NavLink) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  prefetch={link.href === '/contact' ? false : undefined}
                  className={cn(
                    "nav-link transition-colors",
                    isActive ? "text-primary-orange" : textColorClass
                  )}
                  style={{
                    color: isActive ? 'var(--navbar-active-color)' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--navbar-hover-color)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = '';
                  }}
                >
                  {link.name}
                </Link>
              );
            })}
            <Link 
              href="/contact" 
              prefetch={false}
              className={cn("nav-link transition-colors hover:text-primary-orange", textColorClass)}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--navbar-hover-color)'}
              onMouseLeave={(e) => e.currentTarget.style.color = ''}
            >
              Contact
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden relative z-[60] p-2 w-11 h-11 flex items-center justify-center"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-navy" />
            ) : (
              <Menu className={cn("w-6 h-6", textColorClass)} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={cn(
        "fixed inset-0 bg-white z-50 transition-transform duration-500 md:hidden flex flex-col pt-32 px-8 gap-8",
        isMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {resolvedNavLinks.map((link: NavLink) => (
          <Link
            key={link.name}
            href={link.href}
            prefetch={link.href === '/contact' ? false : undefined}
            onClick={() => setIsMenuOpen(false)}
            className="text-2xl font-medium text-navy capitalize tracking-tighter"
          >
            {link.name}
          </Link>
        ))}
        <Link 
          href="/contact" 
          prefetch={false}
          onClick={() => setIsMenuOpen(false)}
          className="text-2xl font-medium text-navy capitalize tracking-tighter"
        >
          Contact
        </Link>
      </div>
    </>
  );
}

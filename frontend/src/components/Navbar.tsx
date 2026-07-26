"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useTheme } from "@/components/DynamicThemeProvider";

interface NavLink {
  name: string;
  href: string;
}

const defaultNavLinks: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Trips", href: "/trips" },
  { name: "Contact Us", href: "/contact" },
];

interface NavbarProps {
  logoUrl?: string;
  navLinks?: NavLink[];
}

export default function Navbar({ 
  logoUrl = "/logo.png",
  navLinks
}: NavbarProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, settings } = useTheme();
  const rawLinks = navLinks || (settings?.navbar?.links && settings.navbar.links.length > 0 ? settings.navbar.links : defaultNavLinks);
  const resolvedNavLinks = rawLinks.filter(
    (link: NavLink) =>
      !["Destinations", "About Us", "Journal"].includes(link.name) &&
      !["/destinations", "/about", "/blogs"].includes(link.href)
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
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

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 px-5 sm:px-8 md:px-10 flex items-center bg-white/95 backdrop-blur-md border-b border-zinc-100/80 shadow-xs h-[80px]"
        )}
      >
        <div className="max-w-[1440px] mx-auto flex items-center justify-between w-full">
          {/* LOGO */}
          <Link 
            href="/" 
            className="relative z-[60] flex items-center justify-start shrink-0"
          >
            <img 
              src="/logo.png"
              alt="Youthcamping Logo" 
              width={160}
              height={44}
              className="h-10 sm:h-11 max-h-10 sm:max-h-11 w-auto max-w-[160px] object-contain transition-transform hover:scale-105"
            />
          </Link>

          {/* DESKTOP NAV LINKS */}
          <div className="hidden md:flex items-center gap-10 text-[16px] font-semibold text-[#1B2A4A]">
            {resolvedNavLinks.map((link: NavLink) => {
              const isActive = pathname === link.href || (link.href === '/trips' && pathname.startsWith('/trips'));
              return (
                <div key={link.name} className="relative flex flex-col items-center py-2">
                  <Link
                    href={link.href}
                    className={cn(
                      "transition-colors hover:text-[#D4541A]",
                      isActive ? "text-[#1B2A4A] font-bold" : "text-[#555555]"
                    )}
                  >
                    {link.name}
                  </Link>
                  {/* Active Orange Underline Bar */}
                  {isActive && (
                    <div className="absolute bottom-0 w-6 h-[3px] bg-[#D4541A] rounded-full" />
                  )}
                </div>
              );
            })}
          </div>

          {/* RIGHT ACTION BUTTONS: Plan Your Trip + Hamburger Menu */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/trips"
              className="px-7 py-3 bg-[#D4541A] hover:bg-[#B8451A] text-white font-bold text-[16px] rounded-full transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95"
            >
              Plan Your Trip
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-[#1B2A4A] hover:text-[#D4541A] transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* MOBILE HAMBURGER BUTTON */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden relative z-[60] p-2"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-[#1B2A4A]" />
            ) : (
              <Menu className="w-6 h-6 text-[#1B2A4A]" />
            )}
          </button>
        </div>
      </nav>

      {/* MOBILE OVERLAY MENU */}
      <div
        className={cn(
          "fixed inset-0 bg-white z-50 transition-transform duration-300 md:hidden flex flex-col pt-24 px-8 gap-6",
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {resolvedNavLinks.map((link: NavLink) => (
          <Link
            key={link.name}
            href={link.href}
            onClick={() => setIsMenuOpen(false)}
            className="text-xl font-bold text-[#1B2A4A] hover:text-[#D4541A]"
          >
            {link.name}
          </Link>
        ))}
        <Link
          href="/trips"
          onClick={() => setIsMenuOpen(false)}
          className="mt-4 w-full py-3.5 bg-[#D4541A] text-white text-center font-bold text-lg rounded-full shadow-md"
        >
          Plan Your Trip
        </Link>
      </div>
    </>
  );
}

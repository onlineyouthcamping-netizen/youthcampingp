"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useTheme } from "@/components/DynamicThemeProvider";

interface NavLink {
  id?: string;
  name?: string;
  label?: string;
  href: string;
}

const defaultNavLinks: NavLink[] = [
  { id: "nav-home", name: "Home", href: "/" },
  { id: "nav-trips", name: "Trips", href: "/trips" },
  { id: "nav-[#D4541A]", name: "About Us", href: "/about-us" },
  { id: "nav-contact", name: "Contact Us", href: "/contact" },
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
  const [mounted, setMounted] = useState(false);
  const { settings } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use props/defaults on server & initial hydration pass to guarantee 100% SSR match
  const rawLinks = (mounted && settings?.navbar?.links && settings.navbar.links.length > 0)
    ? settings.navbar.links
    : (navLinks || defaultNavLinks);

  const resolvedNavLinks = rawLinks
    .map((link: any, idx: number) => ({
      id: link.id || `nav-${idx}-${link.href || 'link'}`,
      name: link.name || link.label || "Link",
      href: link.href || "/",
    }))
    .filter(
      (link: any) =>
        !["Destinations", "Journal"].includes(link.name) &&
        !["/destinations", "/blogs"].includes(link.href)
    );

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
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between">
          {/* BRAND LOGO */}
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
            {resolvedNavLinks.map((link: any) => {
              const isActive = pathname === link.href || (link.href === '/trips' && pathname.startsWith('/trips'));
              return (
                <div key={link.id} className="relative flex flex-col items-center py-2">
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
          </div>

          {/* MOBILE HAMBURGER BUTTON */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden relative z-[60] p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
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

      {/* MOBILE FULL-SCREEN OVERLAY MENU */}
      <div
        className={cn(
          "fixed inset-0 bg-white z-[9998] transition-transform duration-300 md:hidden flex flex-col pt-28 px-6 sm:px-8 gap-4 overflow-y-auto",
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col gap-2">
          {resolvedNavLinks.map((link: any) => (
            <Link
              key={link.id}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-extrabold text-[#1B2A4A] hover:text-[#D4541A] min-h-[52px] flex items-center border-b border-zinc-100/80 px-2 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <Link
          href="/trips"
          onClick={() => setIsMenuOpen(false)}
          className="mt-6 w-full min-h-[56px] bg-[#D4541A] text-white text-center font-extrabold text-base rounded-full shadow-md flex items-center justify-center active:scale-95 transition-transform"
        >
          Plan Your Trip
        </Link>
      </div>
    </>
  );
}

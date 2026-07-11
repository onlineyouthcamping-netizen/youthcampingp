"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/DynamicThemeProvider";

interface FooterProps {
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  companyName?: string;
  cin?: string;
}

const fallbackFooterConfig = {
  brandName: "YOUTHCAMPING",
  address: "Money Plant High Street, A 738, Jagatpur Rd, Gota, Ahmedabad, Gujarat 382470",
  phone: "+91-99242 46267",
  email: "info@youthcamping.com",
  website: "youthcamping.in",
  copyright: "ALL RIGHTS RESERVED.",
  logoUrl: "/logo-stacked.png",
  showSocial: true,
  showAddress: true,
  showContact: true,
  showCopyright: true,
  socialLinks: [
    { platform: "facebook", url: "https://facebook.com/youthcamping" },
    { platform: "instagram", url: "https://instagram.com/youthcamping" },
    { platform: "linkedin", url: "https://linkedin.com/company/youthcamping" },
    { platform: "youtube", url: "https://youtube.com/youthcamping" }
  ],
  columns: [
    {
      id: "col-intl",
      title: "International Trips",
      visible: true,
      links: [
        { id: "l-intl-1", label: "Europe", href: "/trips", visible: true },
        { id: "l-intl-2", label: "Bali", href: "/trips", visible: true },
        { id: "l-intl-3", label: "Vietnam", href: "/trips", visible: true },
        { id: "l-intl-4", label: "Thailand", href: "/trips", visible: true },
        { id: "l-intl-5", label: "Kazakhstan", href: "/trips", visible: true },
        { id: "l-intl-6", label: "Singapore", href: "/trips", visible: true },
        { id: "l-intl-7", label: "Bhutan", href: "/trips", visible: true },
        { id: "l-intl-8", label: "Maldives", href: "/trips", visible: true },
        { id: "l-intl-9", label: "Dubai", href: "/trips", visible: true },
        { id: "l-intl-10", label: "Malaysia", href: "/trips", visible: true }
      ]
    },
    {
      id: "col-india",
      title: "India Trips",
      visible: true,
      links: [
        { id: "l-ind-1", label: "Ladakh", href: "/trips", visible: true },
        { id: "l-ind-2", label: "Spiti Valley", href: "/trips", visible: true },
        { id: "l-ind-3", label: "Meghalaya", href: "/trips", visible: true },
        { id: "l-ind-4", label: "Kashmir", href: "/trips", visible: true },
        { id: "l-ind-5", label: "Himachal Pradesh", href: "/trips", visible: true },
        { id: "l-ind-6", label: "Andaman", href: "/trips", visible: true },
        { id: "l-ind-7", label: "Kerala", href: "/trips", visible: true },
        { id: "l-ind-8", label: "Rajasthan", href: "/trips", visible: true },
        { id: "l-ind-9", label: "Nagaland", href: "/trips", visible: true }
      ]
    },
    {
      id: "col-special",
      title: "YouthCamping Special",
      visible: true,
      links: [
        { id: "l-sp-1", label: "Community Trips", href: "/trips", visible: true },
        { id: "l-sp-2", label: "Honeymoon Trips", href: "/trips", visible: true },
        { id: "l-sp-3", label: "Corporate Trips", href: "/trips", visible: true },
        { id: "l-sp-4", label: "Weekend Getaways", href: "/trips", visible: true }
      ]
    },
    {
      id: "col-quick",
      title: "Quick Links",
      visible: true,
      links: [
        { id: "l-ql-1", label: "About Us", href: "/about-us", visible: true },
        { id: "l-ql-2", label: "Privacy Policy", href: "/privacy", visible: true },
        { id: "l-ql-3", label: "Terms & Conditions", href: "/terms-and-conditions", visible: true },
        { id: "l-ql-4", label: "Customer Success & Support", href: "/questions", visible: true },
        { id: "l-ql-5", label: "Cancellation Policy", href: "/cancellation-policy", visible: true },
        { id: "l-ql-6", label: "Careers", href: "/contact", visible: true },
        { id: "l-ql-7", label: "Blogs", href: "/blogs", visible: true },
        { id: "l-ql-8", label: "Payments", href: "/trips", visible: true }
      ]
    }
  ]
};

const getSocialIcon = (platform: string) => {
  const name = platform.toLowerCase().trim();
  switch (name) {
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#1877F2]" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#E4405F]" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204 0-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#0A66C2]" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#FF0000]" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#25D366]" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.178 1.447 4.953 1.449 5.549 0 10.061-4.512 10.064-10.067.002-2.69-1.043-5.22-2.944-7.121-1.9-1.901-4.43-2.946-7.123-2.948-5.553 0-10.066 4.512-10.069 10.068-.001 1.848.49 3.654 1.42 5.257L1.17 20.77l4.887-1.282-.41.266z"/>
        </svg>
      );
    default:
      return <Globe className="w-4 h-4 text-zinc-400" />;
  }
};

export default function Footer({
  logoUrl,
  address,
  phone,
  email,
  website,
  companyName,
}: FooterProps) {
  const { settings } = useTheme();
  const [openSection, setOpenSection] = useState<number | null>(null);

  // Load the manageable footer settings config, with a safe visual fallback
  const config = settings?.footerConfig || fallbackFooterConfig;

  // Resolve properties with overrides
  const resolvedBrandName = config.brandName || companyName?.split(' ')[0] || "YOUTHCAMPING";
  const resolvedLogoUrl = logoUrl || config.logoUrl || "/logo-stacked.png";
  const resolvedAddress = address || config.address || "Money Plant High Street, A 738, Jagatpur Rd, Gota, Ahmedabad, Gujarat 382470";
  const resolvedPhone = phone || config.phone || "+91-99242 46267";
  const resolvedEmail = email || config.email || "info@youthcamping.com";
  const resolvedWebsite = website || config.website || "youthcamping.in";
  const resolvedCopyright = config.copyright || "ALL RIGHTS RESERVED.";

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index);
  };

  // Filter columns and links that are explicitly enabled (visible !== false)
  const columns = (config.columns || []).filter((col: any) => col.visible !== false);
  const socialLinks = (config.socialLinks || []).filter(
    (social: any) => typeof social.url === "string" && social.url.trim().length > 0
  );

  const resolveHref = (link: any) => {
    if (!link || !link.href) return "#";
    if (link.label === "Terms & Conditions" || link.href === "/terms") return "/terms-and-conditions";
    if (link.label === "Cancellation Policy" || link.href === "/cancellation") return "/cancellation-policy";
    return link.href;
  };

  return (
    <footer className="bg-[#0F1820] text-white pt-12 relative overflow-hidden flex flex-col items-center text-center font-montserrat border-t border-white/5">
      <div className="w-full max-w-6xl mx-auto px-6 relative z-10 flex flex-col items-center">

        {/* Top Links Grid (Desktop) */}
        {columns.length > 0 && (
          <div className="w-full hidden md:grid grid-cols-4 gap-8 text-left mb-16 border-b border-white/10 pb-16">
            {columns.map((section: any, idx: number) => {
              const activeLinks = (section.links || []).filter(
                (link: any) => link.visible !== false && typeof link.href === "string" && link.href.trim().length > 0
              );
              return (
                <div key={section.id || idx} className="flex flex-col gap-3">
                  <h3 className="text-white font-bold text-[15px] mb-3 tracking-wide">
                    {section.title}
                  </h3>
                  {activeLinks.map((link: any, lIdx: number) => (
                    <Link
                      key={link.id || lIdx}
                      href={resolveHref(link)}
                      className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Accordions (Mobile) */}
        {columns.length > 0 && (
          <div className="w-full flex flex-col md:hidden mb-12 border-t border-white/10">
            {columns.map((section: any, idx: number) => {
              const isOpen = openSection === idx;
              const activeLinks = (section.links || []).filter(
                (link: any) => link.visible !== false && typeof link.href === "string" && link.href.trim().length > 0
              );
              return (
                <div key={section.id || idx} className="w-full border-b border-white/10">
                  <button
                    onClick={() => toggleSection(idx)}
                    className="w-full flex items-center justify-between py-4 text-left font-bold text-white text-[15px] tracking-wide focus:outline-none"
                  >
                    <span>{section.title}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>

                  {/* Accordion Content Container */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 flex flex-col gap-3 text-left pl-2",
                      isOpen ? "max-h-[450px] pb-6" : "max-h-0"
                    )}
                  >
                    {activeLinks.map((link: any, lIdx: number) => (
                      <Link
                        key={link.id || lIdx}
                        href={resolveHref(link)}
                        className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Company Name & Details */}
        {config.showAddress !== false && (
          <div className="flex flex-col items-center mb-6 px-4">
            <h2 suppressHydrationWarning className="text-base md:text-lg font-bold tracking-widest text-white mb-3 uppercase">
              {resolvedBrandName}
            </h2>
            <p className="text-zinc-400 text-xs md:text-sm font-medium leading-relaxed max-w-md text-center">
              {resolvedAddress}
            </p>
          </div>
        )}

        {/* Contact Links */}
        {config.showContact !== false && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-8 text-zinc-400 text-[12px] md:text-[13px] font-medium tracking-wide max-w-xl px-6 text-center leading-relaxed">
            <a href={`mailto:${resolvedEmail}`} className="hover:text-white transition-colors">{resolvedEmail}</a>
            <span className="text-white/10">•</span>
            <a href={`tel:${resolvedPhone}`} className="hover:text-white transition-colors">{resolvedPhone}</a>
            <span className="text-white/10">•</span>
            <a href={`https://${resolvedWebsite}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{resolvedWebsite}</a>
          </div>
        )}

        {/* Social Pill Container */}
        {config.showSocial !== false && socialLinks.length > 0 && (
          <div className="bg-[#1E293B]/40 border border-white/5 rounded-[32px] px-8 py-3 flex items-center gap-6 mb-12 shadow-2xl">
            {socialLinks.map((social: any, idx: number) => (
              <a
                key={social.platform || idx}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                title={social.platform}
              >
                {getSocialIcon(social.platform)}
              </a>
            ))}
          </div>
        )}

        {/* One Trip At A Time Branding Slogan */}
        <div className="mb-10 select-none pointer-events-none opacity-45">
          <p className="font-montserrat font-light text-[10px] md:text-[12px] tracking-[0.25em] uppercase text-white/80">
            One Trip At A Time.
          </p>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      {config.showCopyright !== false && (
        <div
          className="w-full border-t border-white/10 mt-auto"
          style={{ backgroundColor: '#090F14' }}
        >
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left relative">
            <p className="text-zinc-500 text-[10px] md:text-xs font-bold tracking-widest uppercase">
              © {new Date().getFullYear()} {resolvedBrandName.toUpperCase()}. {resolvedCopyright.toUpperCase()}
            </p>

            {/* Scroll to Top Button */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-9 h-9 rounded-full bg-[#1E293B]/60 border border-white/10 flex items-center justify-center text-white hover:bg-primary-orange hover:text-white transition-all shadow-lg active:scale-95 shrink-0"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}

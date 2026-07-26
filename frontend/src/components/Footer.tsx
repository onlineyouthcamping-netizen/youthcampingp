"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterProps {
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  companyName?: string;
}

export default function Footer({
  logoUrl,
  phone = "+91-99242 46267",
  email = "info@youthcamping.com",
  companyName = "YouthCamping",
}: FooterProps = {}) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setNewsletterEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-[#0B1528] text-white pt-16 pb-10 font-montserrat border-t border-slate-800 relative z-20">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10">
        {/* Main 3-Column Footer Grid (1-Col Mobile Stack) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 pb-14">
          
          {/* Column 1: Brand Logo, Bio & Socials */}
          <div className="space-y-5">
            <Link href="/" className="inline-block">
              <img
                src="/footer-logo.png"
                alt="YouthCamping"
                className="w-auto object-contain"
                style={{ height: '110px' }}
              />
            </Link>

            <p className="text-zinc-400 text-xs leading-loose max-w-xs font-medium font-montserrat">
              Money Plant High Street, A 738, Jagatpur Rd, Gota,<br />Ahmedabad, Gujarat 382470
            </p>

            {/* Social Media Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <a 
                href="https://instagram.com/youthcamping" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-[#D4541A] flex items-center justify-center text-white transition-all cursor-pointer shadow-2xs min-w-[44px] min-h-[44px]"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              <a 
                href="https://facebook.com/youthcamping" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-[#D4541A] flex items-center justify-center text-white transition-all cursor-pointer shadow-2xs min-w-[44px] min-h-[44px]"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.592 9 4.876V8z"/>
                </svg>
              </a>

              <a 
                href="https://youtube.com/youthcamping" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-[#D4541A] flex items-center justify-center text-white transition-all cursor-pointer shadow-2xs min-w-[44px] min-h-[44px]"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </a>

              <a 
                href={`https://wa.me/${phone.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-[#D4541A] flex items-center justify-center text-white transition-all cursor-pointer shadow-2xs min-w-[44px] min-h-[44px]"
                aria-label="WhatsApp"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links & Useful Links */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider font-montserrat">
                Quick Links
              </h3>
              <ul className="space-y-2 text-xs text-zinc-400 font-medium">
                <li>
                  <Link href="/trips" className="hover:text-white transition-colors py-2 block min-h-[44px] flex items-center">
                    Trips
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white transition-colors py-2 block min-h-[44px] flex items-center">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/stories" className="hover:text-white transition-colors py-2 block min-h-[44px] flex items-center">
                    Stories
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors py-2 block min-h-[44px] flex items-center">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider font-montserrat">
                Useful Links
              </h3>
              <ul className="space-y-2 text-xs text-zinc-400 font-medium">
                <li>
                  <Link href="/how-it-works" className="hover:text-white transition-colors py-2 block min-h-[44px] flex items-center">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/questions" className="hover:text-white transition-colors py-2 block min-h-[44px] flex items-center">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions" className="hover:text-white transition-colors py-2 block min-h-[44px] flex items-center">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="hover:text-white transition-colors py-2 block min-h-[44px] flex items-center">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/cancellation-policy" className="hover:text-white transition-colors py-2 block min-h-[44px] flex items-center">
                    Cancellation Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: Stay Updated Newsletter */}
          <div className="space-y-4">
            <h3 className="text-white font-extrabold text-xs uppercase tracking-wider font-montserrat">
              Stay Updated
            </h3>
            <p className="text-zinc-300 text-xs font-medium leading-relaxed">
              Get travel stories, updates and exclusive offers straight to your inbox.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3 pt-1 w-full max-w-full">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full max-w-full bg-white text-zinc-900 placeholder:text-zinc-400 rounded-full px-5 min-h-[48px] text-xs outline-none font-medium shadow-xs"
              />
              <button
                type="submit"
                className="w-full min-h-[48px] bg-[#D4541A] hover:bg-[#c24813] text-white rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-orange-500/20 active:scale-95 flex items-center justify-center"
              >
                {subscribed ? "Subscribed! 🎉" : "Subscribe"}
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Sub-Footer Bar (Matching Reference Screenshot) */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 font-medium gap-3">
          <p>© {new Date().getFullYear()} YouthCamping. All Rights Reserved.</p>
          <div className="flex items-center gap-1.5">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
            <span>for travellers</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

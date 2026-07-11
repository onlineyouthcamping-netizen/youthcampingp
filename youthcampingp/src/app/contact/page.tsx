"use client";

import { Mail, Phone, MapPin } from "lucide-react";
import { useTheme } from "@/components/DynamicThemeProvider";

export default function ContactPage() {
  const { settings, theme } = useTheme();
  
  const phone = settings?.contactPhone || "99242 46267";
  const email = settings?.contactEmail || "youthcampingmedia@gmail.com";
  const address = settings?.address || "Money Plant High Street, A 738, Jagatpur Rd, Gota, Ahmedabad, Gujarat 382470";
  const primaryColor = settings?.theme?.primaryColor || theme?.primaryColor || "#ff4d00";

  return (
    <div className="bg-white min-h-screen">
      {/* Top Bar - Always visible */}
      <div 
        className="text-white py-2 px-6 hidden md:block"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[11px] font-bold capitalize tracking-wider">
          <div className="flex items-center gap-6">
            <span>We are available 10AM to 07PM</span>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              <span>{email}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5" />
            <span>{phone}</span>
          </div>
        </div>
      </div>

      <>
          {/* Hero Section */}
          <section className="relative h-[400px] md:h-[550px] w-full overflow-hidden">
            <img 
              src="/page-builder-defaults/placeholder-scenic.svg"
              alt="Youthcamping Team"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <h1 className="text-white text-5xl md:text-8xl font-bold italic capitalize tracking-tighter">
                Contact Us
              </h1>
            </div>
          </section>



          {/* Info Section */}
          <section className="py-24 px-6 bg-zinc-50/50">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16 space-y-4">
                 <h2 className="text-5xl font-bold text-[#111111] italic capitalize tracking-tighter">Find us here!</h2>
                 <div 
                  className="w-24 h-1 mx-auto rounded-full" 
                  style={{ backgroundColor: primaryColor }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20">
                {/* Phone */}
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center shadow-xl shadow-zinc-200/50 group hover:scale-110 transition-transform">
                    <Phone className="w-8 h-8 fill-current" style={{ color: primaryColor }} />
                  </div>
                  <p className="text-xl font-bold text-[#111111] tracking-tight">{phone}</p>
                </div>

                {/* Address */}
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center shadow-xl shadow-zinc-200/50 group hover:scale-110 transition-transform">
                    <MapPin className="w-8 h-8 fill-current" style={{ color: primaryColor }} />
                  </div>
                  <p className="text-xl font-bold text-[#111111] tracking-tight leading-relaxed max-w-xs">
                    {address}
                  </p>
                </div>

                {/* Email */}
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center shadow-xl shadow-zinc-200/50 group hover:scale-110 transition-transform">
                    <Mail className="w-8 h-8 fill-current" style={{ color: primaryColor }} />
                  </div>
                  <p 
                    className="text-xl font-bold tracking-tight underline decoration-2 underline-offset-8"
                    style={{ color: primaryColor }}
                  >
                    {email}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Map Section */}
          <section className="w-full h-[500px] relative border-t border-zinc-100">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3669.757827827672!2d72.54148431535496!3d23.105953084910075!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e8369655e8369%3A0x655e8369655e8369!2sMoney%20Plant%20High%20Street!5e0!3m2!1sen!2sin!4v1714444444444!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale hover:grayscale-0 transition-all duration-700"
            />
          </section>

      </>
    </div>
  );
}

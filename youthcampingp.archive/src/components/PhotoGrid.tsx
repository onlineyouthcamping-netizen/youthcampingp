"use client";

import { motion } from "framer-motion";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface PhotoGridProps {
  title?: string;
  subtitle?: string;
  images?: { url: string; alt: string }[];
  backgroundColor?: string;
  padding?: string;
}

export default function PhotoGrid({
  title = "Unfiltered Memories",
  subtitle = "The Reality Check",
  images = [],
  backgroundColor = "#ffffff",
  padding = "80px"
}: PhotoGridProps) {
  return (
    <section 
      style={{ backgroundColor, paddingTop: padding, paddingBottom: padding }}
      className="px-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-primary-orange tracking-[0.3em] font-bold text-xs mb-4"
            >
              {subtitle}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-semibold tracking-tight"
            >
              {title}
            </motion.h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative aspect-[4/5] rounded-[32px] overflow-hidden group shadow-xl"
            >
              <OptimizedImage 
                src={normalizeImageUrl(image.url) || ""} 
                alt={image.alt} 
                cloudinaryWidth={800}
                bunnyVariant="x540gt"
                sizes="(max-width: 768px) calc(100vw - 48px), 33vw"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {image.alt && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                  <p className="text-white font-bold text-lg">{image.alt}</p>
                </div>
              )}
            </motion.div>
          ))}
          {images.length === 0 && (
            <div className="col-span-full py-20 text-center border-4 border-dashed border-charcoal/10 rounded-[40px]">
              <p className="text-charcoal/30 font-bold capitalize tracking-widest">No photos added to this grid yet.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

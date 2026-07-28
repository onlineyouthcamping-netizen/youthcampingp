"use client";

import { motion } from "framer-motion";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface ImageGalleryProps {
  title?: string;
  images?: { url: string; alt: string }[];
  backgroundColor?: string;
  padding?: string;
}

export default function ImageGallery({
  title = "The Gallery",
  images = [],
  backgroundColor = "#ffffff",
  padding = "80px"
}: ImageGalleryProps) {
  return (
    <section 
      style={{ backgroundColor, paddingTop: padding, paddingBottom: padding }}
      className="px-6"
    >
      <div className="max-w-7xl mx-auto">
        {title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-semibold tracking-tight mb-16"
          >
            {title}
          </motion.h2>
        )}

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {images.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="relative rounded-[24px] overflow-hidden group shadow-lg break-inside-avoid"
            >
              <OptimizedImage 
                src={normalizeImageUrl(image.url) || ""} 
                alt={image.alt} 
                cloudinaryWidth={800}
                bunnyVariant="x540gt"
                sizes="(max-width: 768px) calc(100vw - 48px), 33vw"
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {image.alt && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6 text-center">
                   <p className="text-white font-bold tracking-widest text-sm">{image.alt}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
